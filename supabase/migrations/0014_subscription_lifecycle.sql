alter table public.properties
  add column if not exists is_published boolean not null default false,
  add column if not exists publish_after_renewal boolean not null default false;

update public.properties
   set is_published = true
 where status = 'approved'
   and is_published = false;

create index if not exists properties_owner_published_idx
  on public.properties (owner_id, status, is_published);

create or replace function public.enforce_published_property_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  allowed_properties integer;
  published_properties integer;
begin
  if public.is_admin() or public.is_service_role() then
    return new;
  end if;

  if new.owner_id is distinct from auth.uid() then
    raise exception 'Property owner does not match the authenticated user'
      using errcode = '42501';
  end if;

  if new.status is distinct from 'approved' or new.is_published is not true then
    return new;
  end if;

  perform 1 from public.profiles p where p.id = new.owner_id for update;

  allowed_properties := public.plan_limit_for(new.owner_id, 'max_properties');
  select count(*) into published_properties
  from public.properties p
  where p.owner_id = new.owner_id
    and p.status = 'approved'
    and p.is_published
    and p.id is distinct from new.id;

  if published_properties >= allowed_properties then
    raise exception 'Published property limit reached'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_published_property_limit_trigger on public.properties;
create trigger enforce_published_property_limit_trigger
  before insert or update of status, is_published on public.properties
  for each row execute function public.enforce_published_property_limit();

create or replace function public.set_approval_metadata()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'approved' then
    new.approved_at := coalesce(new.approved_at, now());
    new.rejection_reason := null;
  else
    new.approved_at := null;
    new.is_published := false;
    new.publish_after_renewal := false;
  end if;
  return new;
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
      and pr.is_published
      and (
        select count(*)
        from public.properties other
        where other.owner_id = pr.owner_id
          and other.status = 'approved'
          and other.is_published
          and (
            other.created_at < pr.created_at
            or (other.created_at = pr.created_at and other.id < pr.id)
          )
      ) < public.plan_limit_for(pr.owner_id, 'max_properties')
      and (
        pr.plan_type = 'free'
        or coalesce(pl.expired_listing_visibility, 'keep_visible') = 'keep_visible'
        or public.has_active_premium(pr.owner_id)
      )
  );
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
  v_published_limit integer := 1;
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
  elsif v_has_premium then
    v_entitlement := 'paid';
  end if;

  v_published_limit := public.plan_limit_for(p_owner_id, 'max_properties');

  select count(*) into v_published_count
  from public.properties p
  where p.owner_id = p_owner_id
    and p.status = 'approved'
    and p.is_published;

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
    'needs_property_selection', (not v_admin_bypass and not v_has_premium and v_published_count > v_published_limit),
    'max_images_per_property', coalesce(v_plan.max_images_per_property, 0),
    'price_monthly', coalesce(v_plan.price_monthly, 0),
    'price_six_month', coalesce(v_plan.price_six_month, 0),
    'price_yearly', coalesce(v_plan.price_yearly, 0),
    'features', coalesce(v_plan.features, array[]::text[]),
    'expired_listing_visibility', coalesce(v_plan.expired_listing_visibility, 'keep_visible')
  );
end;
$$;

create or replace function public.apply_expired_property_policy(p_owner_id uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner uuid;
  v_keep uuid;
  v_published_limit integer;
  v_affected integer;
  v_expired_count integer := 0;
  v_unpublished_count integer := 0;
begin
  if not public.is_admin() and not public.is_service_role() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  for v_owner in
    select q.owner_id
    from (
      select s.owner_id
      from public.subscriptions s
      where s.status = 'active'
        and s.expires_at is not null
        and s.expires_at <= now()
      union
      select p.owner_id
      from public.properties p
      where p.status = 'approved'
        and p.is_published
      group by p.owner_id
      having count(*) > 1
    ) q
    where p_owner_id is null or q.owner_id = p_owner_id
  loop
    perform 1 from public.profiles p where p.id = v_owner for update;

    update public.subscriptions s
       set status = 'expired',
           updated_at = now()
     where s.owner_id = v_owner
       and s.status = 'active'
       and s.expires_at is not null
       and s.expires_at <= now();
    get diagnostics v_affected = row_count;
    v_expired_count := v_expired_count + v_affected;

    continue when public.has_active_premium(v_owner);

    v_published_limit := public.plan_limit_for(v_owner, 'max_properties');

    select count(*) into v_affected
    from public.properties p
    where p.owner_id = v_owner
      and p.status = 'approved'
      and p.is_published;

    if v_affected > v_published_limit then
      select p.id into v_keep
      from public.properties p
      where p.owner_id = v_owner
        and p.status = 'approved'
        and p.is_published
      order by p.created_at asc, p.id asc
      limit 1;

      update public.properties p
         set is_published = false,
             publish_after_renewal = true
       where p.owner_id = v_owner
         and p.status = 'approved'
         and p.is_published
         and p.id is distinct from v_keep;
      get diagnostics v_affected = row_count;
      v_unpublished_count := v_unpublished_count + v_affected;
    end if;
  end loop;

  return jsonb_build_object(
    'subscriptions_expired', v_expired_count,
    'properties_unpublished', v_unpublished_count
  );
end;
$$;

create or replace function public.select_expiry_property(
  p_owner_id uuid,
  p_property_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_property public.properties%rowtype;
begin
  if auth.uid() is distinct from p_owner_id
     and not public.is_admin()
     and not public.is_service_role() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  perform 1 from public.profiles p where p.id = p_owner_id for update;

  if public.has_active_premium(p_owner_id) then
    return jsonb_build_object('ok', false, 'message', 'Property selection is not required');
  end if;

  select * into v_property
  from public.properties p
  where p.id = p_property_id
    and p.owner_id = p_owner_id
    and p.status = 'approved';

  if not found then
    return jsonb_build_object('ok', false, 'message', 'Approved property not found');
  end if;

  update public.properties p
     set is_published = false,
         publish_after_renewal = p.publish_after_renewal or p.is_published
   where p.owner_id = p_owner_id
     and p.status = 'approved'
     and p.id is distinct from p_property_id;

  update public.properties p
     set is_published = true,
         publish_after_renewal = false
   where p.id = p_property_id;

  return jsonb_build_object('ok', true, 'property_id', p_property_id);
end;
$$;

create or replace function public.set_property_published(
  p_property_id uuid,
  p_published boolean
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_property public.properties%rowtype;
  v_published_count integer;
  v_allowed integer;
begin
  select p.* into v_property
  from public.properties p
  where p.id = p_property_id;

  if not found then
    return jsonb_build_object('ok', false, 'message', 'Property not found');
  end if;

  if auth.uid() is distinct from v_property.owner_id
     and not public.is_admin()
     and not public.is_service_role() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  perform 1 from public.profiles p where p.id = v_property.owner_id for update;

  select p.* into v_property
  from public.properties p
  where p.id = p_property_id
  for update;

  if v_property.status is distinct from 'approved' then
    return jsonb_build_object('ok', false, 'message', 'Only approved properties can be published');
  end if;

  if p_published then
    select count(*) into v_published_count
    from public.properties p
    where p.owner_id = v_property.owner_id
      and p.status = 'approved'
      and p.is_published
      and p.id is distinct from p_property_id;
    v_allowed := public.plan_limit_for(v_property.owner_id, 'max_properties');

    if v_published_count >= v_allowed then
      return jsonb_build_object('ok', false, 'message', 'Published property limit reached');
    end if;

    update public.properties p
       set is_published = true,
           publish_after_renewal = false
     where p.id = p_property_id;
  else
    update public.properties p
       set is_published = false,
           publish_after_renewal = false
     where p.id = p_property_id;
  end if;

  return jsonb_build_object('ok', true, 'property_id', p_property_id, 'is_published', p_published);
end;
$$;

create or replace function public.restore_properties_after_renewal()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_plan_code text;
  v_allowed integer;
  v_available integer;
  v_restored integer := 0;
begin
  if new.status is distinct from 'active' then
    return null;
  end if;

  select pl.code::text into v_plan_code
  from public.plans pl
  where pl.id = new.plan_id;

  if v_plan_code is distinct from 'premium' then
    return null;
  end if;

  perform 1 from public.profiles p where p.id = new.owner_id for update;

  if not public.has_active_premium(new.owner_id) then
    return null;
  end if;

  v_allowed := public.plan_limit_for(new.owner_id, 'max_properties');

  select greatest(v_allowed - count(*), 0) into v_available
  from public.properties p
  where p.owner_id = new.owner_id
    and p.status = 'approved'
    and p.is_published;

  with ranked as (
    select p.id, row_number() over (order by p.created_at asc, p.id asc) as position
    from public.properties p
    where p.owner_id = new.owner_id
      and p.status = 'approved'
      and p.is_published = false
      and p.publish_after_renewal
  )
  update public.properties p
     set is_published = true,
         publish_after_renewal = false
    from ranked r
   where p.id = r.id
     and r.position <= v_available;

  get diagnostics v_restored = row_count;

  update public.properties p
     set publish_after_renewal = false
   where p.owner_id = new.owner_id
     and p.status = 'approved'
     and p.is_published = false
     and p.publish_after_renewal;

  return null;
end;
$$;

drop trigger if exists restore_properties_after_renewal_trigger on public.subscriptions;
create trigger restore_properties_after_renewal_trigger
  after insert or update on public.subscriptions
  for each row execute function public.restore_properties_after_renewal();

create or replace function public.expire_subscriptions()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.apply_expired_property_policy();
end;
$$;

revoke all on function public.get_owner_entitlement(uuid) from public;
grant execute on function public.get_owner_entitlement(uuid) to authenticated, service_role;

revoke all on function public.apply_expired_property_policy(uuid) from public;
grant execute on function public.apply_expired_property_policy(uuid) to service_role;

revoke all on function public.select_expiry_property(uuid, uuid) from public;
grant execute on function public.select_expiry_property(uuid, uuid) to authenticated, service_role;

revoke all on function public.set_property_published(uuid, boolean) from public;
grant execute on function public.set_property_published(uuid, boolean) to authenticated, service_role;
