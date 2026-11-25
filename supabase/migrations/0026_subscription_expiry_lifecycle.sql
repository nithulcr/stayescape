create index if not exists subscriptions_active_expiry_idx
  on public.subscriptions (status, expires_at)
  where status = 'active';

create or replace function public.restore_properties_after_renewal()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
  v_limit integer;
  v_visible integer;
  v_available integer;
begin
  if tg_op = 'INSERT' and (new.status is distinct from 'active' or new.expires_at is null or new.expires_at <= now()) then
    return new;
  end if;
  if tg_op = 'UPDATE' and (
    new.status is distinct from 'active'
    or new.expires_at is null
    or new.expires_at <= now()
  ) then
    return new;
  end if;
  if tg_op = 'UPDATE'
    and old.status = 'active'
    and old.expires_at is not distinct from new.expires_at then
    return new;
  end if;

  v_owner := new.owner_id;
  v_limit := greatest(public.plan_limit_for(v_owner, 'max_properties'), 0);
  perform 1 from public.profiles p where p.id = v_owner for update;

  select count(*)
  into v_visible
  from public.properties p
  where p.owner_id = v_owner
    and p.is_published
    and (
      p.status = 'approved'
      or (p.status = 'pending' and coalesce(p.has_requested_changes, false))
    );
  v_available := greatest(v_limit - v_visible, 0);

  with candidates as (
    select p.id,
      row_number() over (order by p.created_at asc, p.id asc) as restore_order
    from public.properties p
    where p.owner_id = v_owner
      and p.status = 'approved'
      and p.is_published = false
      and p.publish_after_renewal
  )
  update public.properties p
  set is_published = true,
    publish_after_renewal = false
  from candidates c
  where p.id = c.id
    and c.restore_order <= v_available;

  return new;
end;
$$;

create or replace function public.apply_expired_property_policy(p_owner_id uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
  v_property_count integer;
  v_batch_unpublished integer;
  v_unpublished_total integer := 0;
  v_expired_total integer := 0;
  v_owners_processed integer := 0;
begin
  if coalesce(auth.role(), '') not in ('service_role', 'supabase_admin') then
    raise exception 'Only background services can run the expiry policy';
  end if;

  for v_owner in
    select candidate.owner_id
    from (
      select s.owner_id
      from public.subscriptions s
      where s.status = 'active'
        and s.expires_at is not null
        and s.expires_at <= now()
      union
      select p.owner_id
      from public.properties p
      group by p.owner_id
      having count(*) > 1
    ) candidate
    where p_owner_id is null or candidate.owner_id = p_owner_id
  loop
    v_owners_processed := v_owners_processed + 1;
    perform 1 from public.profiles p where p.id = v_owner for update;

    update public.subscriptions s
    set status = 'expired',
      updated_at = now()
    where s.owner_id = v_owner
      and s.status = 'active'
      and s.expires_at is not null
      and s.expires_at <= now();
    get diagnostics v_batch_unpublished = row_count;
    v_expired_total := v_expired_total + v_batch_unpublished;

    continue when public.has_active_premium(v_owner);

    select count(*)
    into v_property_count
    from public.properties p
    where p.owner_id = v_owner;

    if v_property_count > 1 then
      update public.properties p
      set is_published = false,
        publish_after_renewal = true
      where p.owner_id = v_owner
        and p.is_published
        and (
          p.status = 'approved'
          or (p.status = 'pending' and coalesce(p.has_requested_changes, false))
        );
      get diagnostics v_batch_unpublished = row_count;
      v_unpublished_total := v_unpublished_total + v_batch_unpublished;
    end if;
  end loop;

  return jsonb_build_object(
    'owners_processed', v_owners_processed,
    'subscriptions_expired', v_expired_total,
    'properties_unpublished', v_unpublished_total
  );
end;
$$;

create or replace function public.select_expiry_property(p_owner_id uuid, p_property_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_property public.properties%rowtype;
  v_should_publish boolean;
begin
  if auth.uid() is distinct from p_owner_id
    and coalesce(auth.role(), '') not in ('service_role', 'supabase_admin') then
    raise exception 'Not allowed';
  end if;

  perform 1 from public.profiles p where p.id = p_owner_id for update;

  if public.has_active_premium(p_owner_id) then
    return jsonb_build_object('ok', false, 'message', 'Premium is active; all approved properties can remain published.');
  end if;

  select * into v_property
  from public.properties p
  where p.id = p_property_id
    and p.owner_id = p_owner_id
  for update;
  if not found then
    return jsonb_build_object('ok', false, 'message', 'Choose a property that you own.');
  end if;

  v_should_publish := v_property.status = 'approved';

  update public.properties p
  set is_published = false,
    publish_after_renewal = true
  where p.owner_id = p_owner_id
    and p.id <> p_property_id;

  update public.properties p
  set is_published = v_should_publish,
    publish_after_renewal = not v_should_publish
  where p.id = p_property_id;

  return jsonb_build_object('ok', true, 'message', 'Free property updated.');
end;
$$;

create or replace function public.set_property_published(p_property_id uuid, p_published boolean)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_property public.properties%rowtype;
  v_owner uuid;
  v_limit integer;
  v_visible_count integer;
begin
  select * into v_property
  from public.properties p
  where p.id = p_property_id
  for update;
  if not found then
    return jsonb_build_object('ok', false, 'message', 'Property not found.');
  end if;

  v_owner := v_property.owner_id;
  if auth.uid() is distinct from v_owner
    and coalesce(auth.role(), '') not in ('service_role', 'supabase_admin') then
    raise exception 'Not allowed';
  end if;

  perform 1 from public.profiles p where p.id = v_owner for update;

  if public.has_active_premium(v_owner) then
    v_limit := greatest(public.plan_limit_for(v_owner, 'max_properties'), 0);
  else
    v_limit := 1;
  end if;

  if p_published then
    if v_property.status <> 'approved' then
      return jsonb_build_object('ok', false, 'message', 'Only approved properties can be published.');
    end if;

    select count(*)
    into v_visible_count
    from public.properties p
    where p.owner_id = v_owner
      and p.id <> p_property_id
      and p.is_published
      and (
        p.status = 'approved'
        or (p.status = 'pending' and coalesce(p.has_requested_changes, false))
      );
    if v_visible_count >= v_limit then
      return jsonb_build_object('ok', false, 'message', 'Published property limit reached for your current plan.');
    end if;
  end if;

  update public.properties p
  set is_published = p_published,
    publish_after_renewal = case when p_published then false else p.publish_after_renewal end
  where p.id = p_property_id;

  return jsonb_build_object('ok', true, 'message', 'Publication status updated.');
end;
$$;

create or replace function public.enforce_published_property_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_limit integer;
  v_visible_count integer;
begin
  if new.is_published is distinct from true then
    return new;
  end if;
  if new.status is distinct from 'approved'
    and not (new.status = 'pending' and coalesce(new.has_requested_changes, false)) then
    return new;
  end if;
  if coalesce(auth.role(), '') in ('service_role', 'supabase_admin') then
    return new;
  end if;

  perform 1 from public.profiles p where p.id = new.owner_id for update;

  if public.has_active_premium(new.owner_id) then
    v_limit := greatest(public.plan_limit_for(new.owner_id, 'max_properties'), 0);
  else
    v_limit := 1;
  end if;

  select count(*)
  into v_visible_count
  from public.properties p
  where p.owner_id = new.owner_id
    and p.id is distinct from new.id
    and p.is_published
    and (
      p.status = 'approved'
      or (p.status = 'pending' and coalesce(p.has_requested_changes, false))
    );
  if v_visible_count >= v_limit then
    raise exception 'Published property limit reached for your current plan';
  end if;

  return new;
end;
$$;

create or replace function public.get_owner_entitlement(p_owner_id uuid)
returns jsonb
language plpgsql
security definer
stable
set search_path = ''
as $$
declare
  v_profile public.profiles%rowtype;
  v_subscription public.subscriptions%rowtype;
  v_plan public.plans%rowtype;
  v_admin_bypass boolean := false;
  v_has_premium boolean := false;
  v_is_expired boolean := false;
  v_effective_status text := 'free';
  v_plan_code text := 'free';
  v_plan_name text := 'Free';
  v_published_count integer := 0;
  v_property_count integer := 0;
  v_published_limit integer := 1;
  v_image_limit integer := 1;
  v_free_image_limit integer := 1;
  v_days_remaining integer;
  v_entitlement text := 'free';
begin
  if auth.uid() is distinct from p_owner_id
     and not public.is_admin()
     and not public.is_service_role() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  select * into v_profile from public.profiles where id = p_owner_id;
  if not found then
    return null;
  end if;

  select pl.max_images_per_property into v_free_image_limit
  from public.plans pl
  where pl.code = 'free';

  v_admin_bypass := v_profile.role = 'super_admin' and v_profile.account_status = 'active';

  select s.* into v_subscription
  from public.subscriptions s
  where s.owner_id = p_owner_id
  order by s.created_at desc, s.id desc
  limit 1;

  if found then
    select pl.* into v_plan from public.plans pl where pl.id = v_subscription.plan_id;
    v_plan_code := v_plan.code::text;
    v_plan_name := v_plan.name;

    if v_plan_code = 'premium' then
      if v_subscription.expires_at is null or v_subscription.expires_at > now() then
        v_has_premium := v_subscription.status = 'active';
      else
        v_is_expired := true;
      end if;

      if v_subscription.status = 'cancelled' then
        v_effective_status := 'cancelled';
      elsif v_is_expired then
        v_effective_status := 'expired';
      else
        v_effective_status := v_subscription.status::text;
      end if;
    end if;
  end if;

  if v_admin_bypass then
    v_has_premium := true;
    v_is_expired := false;
    v_effective_status := 'active';
    v_plan_code := 'premium';
    v_plan_name := coalesce(v_plan.name, 'Premium');
    v_entitlement := 'admin_bypass';
    v_image_limit := 1000000;
  elsif v_has_premium then
    v_entitlement := 'paid';
    v_image_limit := coalesce(v_plan.max_images_per_property, v_free_image_limit, 1);
  else
    v_image_limit := coalesce(v_free_image_limit, 1);
  end if;

  v_published_limit := public.plan_limit_for(p_owner_id, 'max_properties');

  select count(*)
  into v_published_count
  from public.properties p
  where p.owner_id = p_owner_id
    and p.is_published
    and (
      p.status = 'approved'
      or (p.status = 'pending' and coalesce(p.has_requested_changes, false))
    );

  select count(*)
  into v_property_count
  from public.properties p
  where p.owner_id = p_owner_id;

  if v_has_premium and v_subscription.expires_at is not null then
    v_days_remaining := greatest(0, ceil(extract(epoch from (v_subscription.expires_at - now())) / 86400)::integer);
  end if;

  return jsonb_build_object(
    'owner_id', p_owner_id,
    'status', v_effective_status,
    'plan_code', v_plan_code,
    'plan_name', v_plan_name,
    'has_premium', v_has_premium,
    'is_active', v_has_premium,
    'is_expired', v_is_expired,
    'is_unlimited', v_admin_bypass,
    'entitlement', v_entitlement,
    'subscription_id', v_subscription.id,
    'expires_at', v_subscription.expires_at,
    'days_remaining', v_days_remaining,
    'billing_cycle', v_subscription.billing_cycle::text,
    'max_properties', v_published_limit,
    'published_limit', v_published_limit,
    'published_count', v_published_count,
    'needs_property_selection', (not v_admin_bypass and not v_has_premium and v_property_count > greatest(v_published_limit, 1)),
    'max_images_per_property', v_image_limit,
    'price_monthly', coalesce(v_plan.price_monthly, 499),
    'price_six_month', coalesce(v_plan.price_six_month, 2499),
    'price_yearly', coalesce(v_plan.price_yearly, 4999),
    'features', coalesce(v_plan.features, array[]::text[]),
    'expired_listing_visibility', coalesce(v_plan.expired_listing_visibility, 'keep_visible')
  );
end;
$$;

create or replace function public.public_image_limit_for_owner(p_owner_id uuid)
returns integer
language plpgsql
security definer
stable
set search_path = ''
as $$
declare
  v_limit integer;
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

  if public.has_active_premium(p_owner_id) then
    select coalesce(pl.max_images_per_property, 5)
    into v_limit
    from public.subscriptions s
    join public.plans pl on pl.id = s.plan_id
    where s.owner_id = p_owner_id
      and s.status = 'active'
      and (s.expires_at is null or s.expires_at > now())
    order by s.created_at desc, s.id desc
    limit 1;
    return coalesce(v_limit, 5);
  end if;

  select coalesce(pl.max_images_per_property, 1)
  into v_limit
  from public.plans pl
  where pl.code = 'free';
  return coalesce(v_limit, 1);
end;
$$;

create or replace function public.public_allows_premium_content(p_owner_id uuid)
returns boolean
language plpgsql
security definer
stable
set search_path = ''
as $$
begin
  if exists (
    select 1
    from public.profiles p
    where p.id = p_owner_id
      and p.role = 'super_admin'
      and p.account_status = 'active'
  ) then
    return true;
  end if;

  return public.has_active_premium(p_owner_id);
end;
$$;

revoke all on function public.apply_expired_property_policy(uuid) from public;
grant execute on function public.apply_expired_property_policy(uuid) to service_role;
grant execute on function public.select_expiry_property(uuid, uuid) to authenticated, service_role;
grant execute on function public.set_property_published(uuid, boolean) to authenticated, service_role;
revoke all on function public.public_image_limit_for_owner(uuid) from public;
grant execute on function public.public_image_limit_for_owner(uuid) to anon, authenticated, service_role;
revoke all on function public.public_allows_premium_content(uuid) from public;
grant execute on function public.public_allows_premium_content(uuid) to anon, authenticated, service_role;
