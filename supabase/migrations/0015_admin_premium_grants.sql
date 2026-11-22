alter table public.subscriptions
  add column if not exists source text not null default 'razorpay' check (source in ('razorpay', 'admin_grant')),
  add column if not exists granted_by uuid references public.profiles(id) on delete set null,
  add column if not exists grant_reason text,
  add column if not exists grant_notes text,
  add column if not exists grant_duration_months integer check (grant_duration_months is null or grant_duration_months between 1 and 120);

update public.subscriptions
   set source = 'razorpay'
 where source is null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'admin_grant_metadata_required'
      and conrelid = 'public.subscriptions'::regclass
  ) then
    alter table public.subscriptions
      add constraint admin_grant_metadata_required
      check (
        source <> 'admin_grant'
        or (granted_by is not null and grant_reason is not null and grant_duration_months is not null)
      );
  end if;
end $$;

create index if not exists subscriptions_source_idx on public.subscriptions (source, created_at desc);

create or replace function public.assert_admin_subscription_actor(
  p_actor_id uuid,
  p_actor_email text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_actor_id is null or btrim(coalesce(p_actor_email, '')) = '' then
    raise exception 'Admin identity required' using errcode = '42501';
  end if;

  if not (public.is_service_role() or public.is_super_admin()) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  if auth.uid() is not null and auth.uid() <> p_actor_id then
    raise exception 'Admin identity mismatch' using errcode = '42501';
  end if;
end;
$$;

create or replace function public.record_admin_subscription_audit(
  p_actor_id uuid,
  p_actor_email text,
  p_action text,
  p_target_id uuid,
  p_metadata jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.admin_audit_logs (
    actor_id, actor_email, action, target_table, target_id, metadata
  )
  values (
    p_actor_id,
    nullif(btrim(coalesce(p_actor_email, '')), ''),
    p_action,
    'subscriptions',
    p_target_id::text,
    coalesce(p_metadata, '{}'::jsonb)
  );
end;
$$;

create or replace function public.admin_grant_premium(
  p_owner_id uuid,
  p_plan_id uuid,
  p_billing_cycle public.billing_cycle,
  p_duration_months integer,
  p_start_at timestamptz,
  p_reason text,
  p_actor_id uuid,
  p_actor_email text,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile public.profiles%rowtype;
  v_plan public.plans%rowtype;
  v_active public.subscriptions%rowtype;
  v_starts_at timestamptz;
  v_expires_at timestamptz;
  v_subscription_id uuid;
begin
  perform public.assert_admin_subscription_actor(p_actor_id, p_actor_email);

  if p_duration_months is null or p_duration_months < 1 or p_duration_months > 120
     or p_billing_cycle is null
     or p_reason is null or char_length(btrim(p_reason)) not between 3 and 500
     or (p_notes is not null and char_length(btrim(p_notes)) > 2000) then
    return jsonb_build_object('ok', false, 'message', 'Invalid grant request.');
  end if;

  if p_start_at is null
     or p_start_at > now() + interval '5 minutes'
     or p_start_at < now() - interval '365 days' then
    return jsonb_build_object('ok', false, 'message', 'Invalid start date.');
  end if;

  select * into v_plan
    from public.plans
   where id = p_plan_id
     and code = 'premium'
     and is_active;
  if not found then
    return jsonb_build_object('ok', false, 'message', 'Premium plan not found.');
  end if;

  select * into v_profile from public.profiles where id = p_owner_id for update;
  if not found or v_profile.account_status <> 'active'
     or v_profile.role not in ('user', 'owner', 'admin') then
    return jsonb_build_object('ok', false, 'message', 'Target user is not eligible.');
  end if;

  select * into v_active
    from public.subscriptions
   where owner_id = p_owner_id
     and status = 'active'
   for update;
  if found then
    return jsonb_build_object('ok', false, 'message', 'Active subscription exists. Use Extend instead.');
  end if;

  v_starts_at := greatest(p_start_at, now());
  v_expires_at := (v_starts_at at time zone 'UTC' + make_interval(months => p_duration_months)) at time zone 'UTC';
  if v_expires_at is null or v_expires_at <= v_starts_at then
    return jsonb_build_object('ok', false, 'message', 'Invalid expiry date.');
  end if;

  insert into public.subscriptions (
    owner_id, plan_id, status, billing_cycle, starts_at, expires_at,
    source, granted_by, grant_reason, grant_notes, grant_duration_months, auto_renew
  )
  values (
    p_owner_id, p_plan_id, 'active', p_billing_cycle, v_starts_at, v_expires_at,
    'admin_grant', p_actor_id, btrim(p_reason),
    nullif(btrim(coalesce(p_notes, '')), ''), p_duration_months, false
  )
  returning id into v_subscription_id;

  perform public.record_admin_subscription_audit(
    p_actor_id,
    p_actor_email,
    'subscription.admin_granted',
    v_subscription_id,
    jsonb_build_object(
      'target_user_id', p_owner_id::text,
      'target_email', v_profile.email,
      'previous_status', null,
      'previous_expires_at', null,
      'new_status', 'active',
      'new_expires_at', v_expires_at,
      'duration_months', p_duration_months,
      'billing_cycle', p_billing_cycle::text,
      'reason', btrim(p_reason),
      'notes', nullif(btrim(coalesce(p_notes, '')), ''),
      'requested_start_at', p_start_at
    )
  );

  return jsonb_build_object(
    'ok', true,
    'message', 'Premium granted.',
    'subscription_id', v_subscription_id,
    'expires_at', v_expires_at
  );
end;
$$;

create or replace function public.admin_extend_premium(
  p_owner_id uuid,
  p_plan_id uuid,
  p_billing_cycle public.billing_cycle,
  p_duration_months integer,
  p_reason text,
  p_actor_id uuid,
  p_actor_email text,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile public.profiles%rowtype;
  v_plan public.plans%rowtype;
  v_subscription public.subscriptions%rowtype;
  v_has_active boolean;
  v_previous_status public.subscription_status;
  v_previous_expires_at timestamptz;
  v_base timestamptz;
  v_expires_at timestamptz;
begin
  perform public.assert_admin_subscription_actor(p_actor_id, p_actor_email);

  if p_duration_months is null or p_duration_months < 1 or p_duration_months > 120
     or p_billing_cycle is null
     or p_reason is null or char_length(btrim(p_reason)) not between 3 and 500
     or (p_notes is not null and char_length(btrim(p_notes)) > 2000) then
    return jsonb_build_object('ok', false, 'message', 'Invalid extension request.');
  end if;

  select * into v_plan
    from public.plans
   where id = p_plan_id
     and code = 'premium'
     and is_active;
  if not found then
    return jsonb_build_object('ok', false, 'message', 'Premium plan not found.');
  end if;

  select * into v_profile from public.profiles where id = p_owner_id for update;
  if not found or v_profile.account_status <> 'active'
     or v_profile.role not in ('user', 'owner', 'admin') then
    return jsonb_build_object('ok', false, 'message', 'Target user is not eligible.');
  end if;

  select * into v_subscription
    from public.subscriptions
   where owner_id = p_owner_id
     and status = 'active'
   for update;
  v_has_active := found;

  if not v_has_active then
    select * into v_subscription
      from public.subscriptions
     where owner_id = p_owner_id
       and plan_id = p_plan_id
     order by created_at desc
     limit 1
     for update;
    if not found or v_subscription.status not in ('expired', 'cancelled') then
      return jsonb_build_object('ok', false, 'message', 'No Premium subscription to extend.');
    end if;
  elsif v_subscription.plan_id <> p_plan_id then
    return jsonb_build_object('ok', false, 'message', 'Active subscription is not Premium.');
  end if;

  v_previous_status := v_subscription.status;
  v_previous_expires_at := v_subscription.expires_at;
  v_base := greatest(now(), coalesce(v_subscription.expires_at, now()));
  v_expires_at := (v_base at time zone 'UTC' + make_interval(months => p_duration_months)) at time zone 'UTC';
  if v_expires_at is null or v_expires_at <= v_base then
    return jsonb_build_object('ok', false, 'message', 'Invalid expiry date.');
  end if;

  update public.subscriptions
     set status = 'active',
         plan_id = p_plan_id,
         billing_cycle = p_billing_cycle,
         expires_at = v_expires_at,
         updated_at = now()
   where id = v_subscription.id;

  perform public.record_admin_subscription_audit(
    p_actor_id,
    p_actor_email,
    'subscription.admin_extended',
    v_subscription.id,
    jsonb_build_object(
      'target_user_id', p_owner_id::text,
      'target_email', v_profile.email,
      'previous_status', v_previous_status::text,
      'previous_expires_at', v_previous_expires_at,
      'new_status', 'active',
      'new_expires_at', v_expires_at,
      'duration_months', p_duration_months,
      'billing_cycle', p_billing_cycle::text,
      'reason', btrim(p_reason),
      'notes', nullif(btrim(coalesce(p_notes, '')), '')
    )
  );

  return jsonb_build_object(
    'ok', true,
    'message', 'Premium extended.',
    'subscription_id', v_subscription.id,
    'expires_at', v_expires_at
  );
end;
$$;

create or replace function public.admin_revoke_premium(
  p_owner_id uuid,
  p_reason text,
  p_actor_id uuid,
  p_actor_email text,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile public.profiles%rowtype;
  v_subscription public.subscriptions%rowtype;
  v_previous_status public.subscription_status;
  v_previous_expires_at timestamptz;
begin
  perform public.assert_admin_subscription_actor(p_actor_id, p_actor_email);

  if p_reason is null or char_length(btrim(p_reason)) not between 3 and 500
     or (p_notes is not null and char_length(btrim(p_notes)) > 2000) then
    return jsonb_build_object('ok', false, 'message', 'Invalid revocation request.');
  end if;

  select * into v_profile from public.profiles where id = p_owner_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'message', 'Target user not found.');
  end if;

  select * into v_subscription
    from public.subscriptions
   where owner_id = p_owner_id
     and status = 'active'
   for update;
  if not found then
    return jsonb_build_object('ok', false, 'message', 'No active subscription to revoke.');
  end if;

  v_previous_status := v_subscription.status;
  v_previous_expires_at := v_subscription.expires_at;

  update public.subscriptions
     set status = 'cancelled',
         updated_at = now()
   where id = v_subscription.id;

  perform public.apply_expired_property_policy(p_owner_id);

  perform public.record_admin_subscription_audit(
    p_actor_id,
    p_actor_email,
    'subscription.admin_revoked',
    v_subscription.id,
    jsonb_build_object(
      'target_user_id', p_owner_id::text,
      'target_email', v_profile.email,
      'previous_status', v_previous_status::text,
      'previous_expires_at', v_previous_expires_at,
      'new_status', 'cancelled',
      'new_expires_at', v_previous_expires_at,
      'reason', btrim(p_reason),
      'notes', nullif(btrim(coalesce(p_notes, '')), ''),
      'payment_records_changed', false,
      'properties_deleted', false
    )
  );

  return jsonb_build_object(
    'ok', true,
    'message', 'Premium revoked.',
    'subscription_id', v_subscription.id,
    'expires_at', v_previous_expires_at
  );
end;
$$;

revoke all on function public.assert_admin_subscription_actor(uuid, text) from public;
grant execute on function public.assert_admin_subscription_actor(uuid, text) to service_role;

revoke all on function public.record_admin_subscription_audit(uuid, text, text, uuid, jsonb) from public;
grant execute on function public.record_admin_subscription_audit(uuid, text, text, uuid, jsonb) to service_role;

revoke all on function public.admin_grant_premium(uuid, uuid, public.billing_cycle, integer, timestamptz, text, uuid, text, text) from public;
grant execute on function public.admin_grant_premium(uuid, uuid, public.billing_cycle, integer, timestamptz, text, uuid, text, text) to authenticated, service_role;

revoke all on function public.admin_extend_premium(uuid, uuid, public.billing_cycle, integer, text, uuid, text, text) from public;
grant execute on function public.admin_extend_premium(uuid, uuid, public.billing_cycle, integer, text, uuid, text, text) to authenticated, service_role;

revoke all on function public.admin_revoke_premium(uuid, text, uuid, text, text) from public;
grant execute on function public.admin_revoke_premium(uuid, text, uuid, text, text) to authenticated, service_role;
