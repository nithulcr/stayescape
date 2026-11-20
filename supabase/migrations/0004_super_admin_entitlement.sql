create or replace function public.has_active_premium(p_owner_id uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select
    exists (
      select 1
      from public.profiles p
      where p.id = p_owner_id
        and p.role = 'super_admin'
        and p.account_status = 'active'
    )
    or exists (
      select 1
      from public.subscriptions s
      join public.plans pl on pl.id = s.plan_id
      where s.owner_id = p_owner_id
        and s.status = 'active'
        and (s.expires_at is null or s.expires_at > now())
        and pl.code = 'premium'
    );
$$;

create or replace function public.plan_limit_for(p_owner_id uuid, p_limit_key text)
returns integer
language plpgsql
security definer
stable
set search_path = ''
as $$
declare
  active_limit integer;
begin
  if exists (
    select 1
    from public.profiles p
    where p.id = p_owner_id
      and p.role = 'super_admin'
      and p.account_status = 'active'
  ) then
    return 1000000;
  end if;

  select case p_limit_key
           when 'max_properties' then pl.max_properties
           when 'max_images_per_property' then pl.max_images_per_property
         end
    into active_limit
  from public.subscriptions s
  join public.plans pl on pl.id = s.plan_id
  where s.owner_id = p_owner_id
    and s.status = 'active'
    and (s.expires_at is null or s.expires_at > now())
  order by s.created_at desc
  limit 1;

  if active_limit is null then
    select case p_limit_key
             when 'max_properties' then pl.max_properties
             when 'max_images_per_property' then pl.max_images_per_property
           end
      into active_limit
    from public.plans pl
    where pl.code = 'free';
  end if;

  return coalesce(active_limit, 1);
end;
$$;

create or replace function public.property_is_visible(p_property_id uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.properties pr
    left join public.plans pl on pl.code = pr.plan_type
    where pr.id = p_property_id
      and pr.status = 'approved'
      and (
        pr.plan_type = 'free'
        or coalesce(pl.expired_listing_visibility, 'keep_visible') = 'keep_visible'
        or public.has_active_premium(pr.owner_id)
        or exists (
          select 1 from public.subscriptions s
          where s.owner_id = pr.owner_id
            and s.status = 'active'
            and (s.expires_at is null or s.expires_at > now())
        )
      )
  );
$$;

create or replace function public.sync_property_plan()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  active_plan public.plan_code;
begin
  select pl.code
    into active_plan
  from public.subscriptions s
  join public.plans pl on pl.id = s.plan_id
  where s.owner_id = new.owner_id
    and s.status = 'active'
    and (s.expires_at is null or s.expires_at > now())
  order by s.created_at desc
  limit 1;

  if exists (
    select 1
    from public.profiles p
    where p.id = new.owner_id
      and p.role = 'super_admin'
      and p.account_status = 'active'
  ) then
    active_plan := 'premium';
  end if;

  new.plan_type := coalesce(active_plan, 'free');
  return new;
end;
$$;

create or replace function public.sync_owner_properties_plan()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_owner uuid;
  active_plan public.plan_code;
begin
  if tg_op = 'DELETE' then
    target_owner := old.owner_id;
  else
    target_owner := new.owner_id;
  end if;

  select pl.code
    into active_plan
  from public.subscriptions s
  join public.plans pl on pl.id = s.plan_id
  where s.owner_id = target_owner
    and s.status = 'active'
    and (s.expires_at is null or s.expires_at > now())
  order by s.created_at desc
  limit 1;

  if exists (
    select 1
    from public.profiles p
    where p.id = target_owner
      and p.role = 'super_admin'
      and p.account_status = 'active'
  ) then
    active_plan := 'premium';
  end if;

  update public.properties p
     set plan_type = coalesce(active_plan, 'free')
   where p.owner_id = target_owner;

  return null;
end;
$$;

drop policy if exists "Owners can upload property images" on storage.objects;
create policy "Owners can upload property images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'property-images'
    and public.is_active_property_owner(auth.uid())
    and (
      public.storage_property_path_is_owned(name)
      or public.is_admin()
    )
    and case
      when (storage.foldername(name))[2] ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$'
        then (
          select count(*)
          from public.property_images pi
          where pi.property_id = ((storage.foldername(name))[2])::uuid
        ) < public.plan_limit_for(((storage.foldername(name))[2])::uuid, 'max_images_per_property')
      else false
    end
  );
