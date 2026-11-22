create table if not exists public.payment_events (
  event_id text primary key,
  payment_id uuid not null references public.payments(id) on delete cascade,
  event_type text not null,
  created_at timestamptz not null default now()
);

create index if not exists payment_events_payment_idx on public.payment_events (payment_id, created_at desc);
create index if not exists payments_user_created_idx on public.payments (user_id, created_at desc);
create index if not exists subscriptions_owner_status_idx on public.subscriptions (owner_id, status);

alter table public.payment_events enable row level security;

revoke all on public.payment_events from anon, authenticated;
grant select, insert, update, delete on public.payment_events to service_role;

create or replace function public.reserve_payment_event(
  p_event_id text,
  p_payment_id uuid,
  p_event_type text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event public.payment_events%rowtype;
begin
  if p_event_id is null or btrim(p_event_id) = '' then
    return true;
  end if;

  select * into v_event from public.payment_events where event_id = p_event_id;
  if found then
    return v_event.payment_id = p_payment_id;
  end if;

  insert into public.payment_events (event_id, payment_id, event_type)
  values (p_event_id, p_payment_id, p_event_type)
  on conflict (event_id) do nothing;

  return found;
end;
$$;

create or replace function public.activate_paid_subscription(
  p_payment_id uuid,
  p_razorpay_payment_id text,
  p_duration_months integer,
  p_signature text default null,
  p_event_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_payment public.payments%rowtype;
  v_plan public.plans%rowtype;
  v_subscription public.subscriptions%rowtype;
  v_expires_at timestamptz;
  v_base timestamptz;
  v_subscription_id uuid;
  v_has_subscription boolean;
begin
  if p_payment_id is null or p_razorpay_payment_id is null
     or btrim(p_razorpay_payment_id) = '' or p_duration_months is null or p_duration_months <= 0 then
    return jsonb_build_object('ok', false, 'message', 'Invalid activation request.');
  end if;

  select * into v_payment from public.payments where id = p_payment_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'message', 'Unknown payment order.');
  end if;

  if v_payment.status = 'success' then
    if p_event_id is not null
       and not public.reserve_payment_event(p_event_id, v_payment.id, 'duplicate_activation') then
      return jsonb_build_object('ok', false, 'message', 'Duplicate webhook event belongs to another payment.');
    end if;
    return jsonb_build_object(
      'ok', true,
      'message', 'Payment already recorded.',
      'subscription_id', v_payment.subscription_id
    );
  end if;

  if v_payment.status not in ('pending', 'failed') then
    return jsonb_build_object('ok', false, 'message', 'Payment is not activatable.');
  end if;

  if v_payment.razorpay_payment_id is not null
     and v_payment.razorpay_payment_id <> p_razorpay_payment_id then
    return jsonb_build_object('ok', false, 'message', 'Payment id does not match this order.');
  end if;

  select * into v_plan from public.plans where id = v_payment.plan_id;
  if not found or v_plan.code <> 'premium' then
    return jsonb_build_object('ok', false, 'message', 'Plan not found for this payment.');
  end if;

  if upper(btrim(v_payment.currency)) <> 'INR' then
    return jsonb_build_object('ok', false, 'message', 'Payment currency is not supported.');
  end if;

  if p_event_id is not null
     and not public.reserve_payment_event(p_event_id, v_payment.id, 'activation') then
    return jsonb_build_object('ok', true, 'message', 'Duplicate webhook event.');
  end if;

  perform 1 from public.profiles p where p.id = v_payment.user_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'message', 'Payment owner not found.');
  end if;

  select * into v_subscription
    from public.subscriptions
   where owner_id = v_payment.user_id and status = 'active'
   order by created_at desc
   limit 1
   for update;
  v_has_subscription := found;

  v_base := greatest(now(), coalesce(v_subscription.expires_at, now()));
  v_expires_at := (v_base at time zone 'UTC' + make_interval(months => p_duration_months)) at time zone 'UTC';

  if v_has_subscription then
    update public.subscriptions
       set plan_id = v_payment.plan_id,
           status = 'active',
           billing_cycle = v_payment.billing_cycle,
           starts_at = now(),
           expires_at = v_expires_at,
           auto_renew = false,
           updated_at = now()
     where id = v_subscription.id;
    v_subscription_id := v_subscription.id;
  else
    insert into public.subscriptions (
      owner_id, plan_id, status, billing_cycle, starts_at, expires_at, auto_renew
    )
    values (
      v_payment.user_id, v_payment.plan_id, 'active', v_payment.billing_cycle,
      now(), v_expires_at, false
    )
    returning id into v_subscription_id;
  end if;

  update public.payments
     set razorpay_payment_id = p_razorpay_payment_id,
         razorpay_signature = coalesce(p_signature, razorpay_signature),
         status = 'success',
         subscription_id = v_subscription_id
   where id = v_payment.id;

  return jsonb_build_object(
    'ok', true,
    'message', 'Subscription activated.',
    'subscription_id', v_subscription_id,
    'expires_at', v_expires_at
  );
end;
$$;

create or replace function public.record_payment_status(
  p_order_id text,
  p_status public.payment_status,
  p_event_id text default null,
  p_razorpay_payment_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_payment public.payments%rowtype;
begin
  if p_order_id is null or btrim(p_order_id) = '' or p_status not in ('failed', 'refunded') then
    return jsonb_build_object('ok', false, 'message', 'Invalid payment status request.');
  end if;

  select * into v_payment from public.payments where razorpay_order_id = p_order_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'message', 'Unknown payment order.');
  end if;

  if p_event_id is not null
     and not public.reserve_payment_event(p_event_id, v_payment.id, p_status::text) then
    return jsonb_build_object('ok', true, 'message', 'Duplicate webhook event.');
  end if;

  if v_payment.status = 'success' then
    return jsonb_build_object('ok', true, 'message', 'Payment already recorded.');
  end if;

  if v_payment.status = p_status then
    return jsonb_build_object('ok', true, 'message', 'Payment status already recorded.');
  end if;

  if p_status = 'refunded' and v_payment.status <> 'success' then
    return jsonb_build_object('ok', true, 'message', 'Refund recorded before activation.');
  end if;

  if v_payment.razorpay_payment_id is not null
     and p_razorpay_payment_id is not null
     and v_payment.razorpay_payment_id <> p_razorpay_payment_id then
    return jsonb_build_object('ok', false, 'message', 'Payment id does not match this order.');
  end if;

  update public.payments
     set status = p_status,
         razorpay_payment_id = coalesce(p_razorpay_payment_id, razorpay_payment_id)
   where id = v_payment.id;

  return jsonb_build_object('ok', true, 'message', 'Payment status recorded.');
end;
$$;

revoke all on function public.reserve_payment_event(text, uuid, text) from public;
revoke all on function public.activate_paid_subscription(uuid, text, integer, text, text) from public;
revoke all on function public.record_payment_status(text, public.payment_status, text, text) from public;

grant execute on function public.reserve_payment_event(text, uuid, text) to service_role;
grant execute on function public.activate_paid_subscription(uuid, text, integer, text, text) to service_role;
grant execute on function public.record_payment_status(text, public.payment_status, text, text) to service_role;
