create table if not exists public.payment_refunds (
  refund_id text primary key,
  payment_id uuid not null references public.payments(id) on delete cascade,
  event_id text unique references public.payment_events(event_id) on delete cascade,
  amount integer not null check (amount >= 0),
  currency text not null default 'INR',
  status text not null,
  created_at timestamptz not null default now()
);

create index if not exists payment_refunds_payment_idx
  on public.payment_refunds (payment_id, created_at desc);

alter table public.payment_refunds enable row level security;

revoke all on public.payment_refunds from anon, authenticated;
grant select, insert, update, delete on public.payment_refunds to service_role;

alter table public.payments
  add column if not exists razorpay_refund_id text,
  add column if not exists refunded_amount integer not null default 0,
  add column if not exists refunded_at timestamptz;

create or replace function public.record_refund(
  p_order_id text,
  p_event_id text,
  p_razorpay_payment_id text,
  p_refund_id text,
  p_refund_amount integer,
  p_refund_currency text,
  p_refund_status text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_payment public.payments%rowtype;
  v_event_id text;
  v_refund_id text;
  v_amount integer;
  v_currency text;
  v_status text;
  v_inserted integer;
begin
  if p_order_id is null or btrim(p_order_id) = '' then
    return jsonb_build_object('ok', false, 'message', 'Invalid refund request.');
  end if;

  v_event_id := nullif(btrim(coalesce(p_event_id, '')), '');
  v_refund_id := nullif(btrim(coalesce(p_refund_id, '')), '');
  if v_refund_id is null and v_event_id is not null then
    v_refund_id := 'event:' || v_event_id;
  end if;
  if v_refund_id is null then
    return jsonb_build_object('ok', false, 'message', 'Refund identifier is required.');
  end if;

  v_amount := coalesce(p_refund_amount, 0);
  if v_amount < 0 then
    return jsonb_build_object('ok', false, 'message', 'Invalid refund amount.');
  end if;

  v_currency := upper(btrim(coalesce(p_refund_currency, 'INR')));
  v_status := nullif(btrim(coalesce(p_refund_status, '')), '');
  if v_status is null then
    v_status := 'refunded';
  end if;

  select * into v_payment
  from public.payments
  where razorpay_order_id = p_order_id
  for update;
  if not found then
    return jsonb_build_object('ok', false, 'message', 'Unknown payment order.');
  end if;

  if v_amount = 0 then
    v_amount := v_payment.amount;
  end if;

  if upper(btrim(v_payment.currency)) <> v_currency then
    return jsonb_build_object('ok', false, 'message', 'Refund currency does not match this order.');
  end if;

  if p_razorpay_payment_id is not null
     and btrim(p_razorpay_payment_id) <> ''
     and v_payment.razorpay_payment_id is not null
     and v_payment.razorpay_payment_id <> btrim(p_razorpay_payment_id) then
    return jsonb_build_object('ok', false, 'message', 'Payment id does not match this order.');
  end if;

  if v_event_id is not null
     and not public.reserve_payment_event(v_event_id, v_payment.id, 'refund') then
    return jsonb_build_object('ok', true, 'message', 'Duplicate webhook event belongs to another payment.');
  end if;

  insert into public.payment_refunds (refund_id, payment_id, event_id, amount, currency, status)
  select v_refund_id, v_payment.id, v_event_id, v_amount, v_currency, v_status
  where not exists (
    select 1
    from public.payment_refunds pr
    where pr.refund_id = v_refund_id
       or (v_event_id is not null and pr.event_id = v_event_id)
  )
  on conflict (refund_id) do nothing;
  get diagnostics v_inserted = row_count;

  if v_inserted > 0 then
    update public.payments
       set status = 'refunded',
           razorpay_payment_id = coalesce(razorpay_payment_id, nullif(btrim(coalesce(p_razorpay_payment_id, '')), '')),
           razorpay_refund_id = v_refund_id,
           refunded_amount = coalesce(refunded_amount, 0) + v_amount,
           refunded_at = coalesce(refunded_at, now())
     where id = v_payment.id;
  else
    update public.payments
       set status = 'refunded',
           razorpay_refund_id = coalesce(razorpay_refund_id, v_refund_id),
           refunded_at = coalesce(refunded_at, now())
     where id = v_payment.id;
  end if;

  return jsonb_build_object(
    'ok', true,
    'message', case when v_inserted > 0 then 'Refund recorded.' else 'Refund already recorded.' end,
    'refund_id', v_refund_id,
    'refunded_amount', (select refunded_amount from public.payments where id = v_payment.id),
    'duplicate', v_inserted = 0
  );
end;
$$;

revoke all on function public.record_refund(text, text, text, text, integer, text, text) from public;
grant execute on function public.record_refund(text, text, text, text, integer, text, text) to service_role;
