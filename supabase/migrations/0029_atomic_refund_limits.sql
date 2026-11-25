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
  v_existing public.payment_refunds%rowtype;
  v_event_id text;
  v_refund_id text;
  v_amount integer;
  v_currency text;
  v_status text;
  v_total integer;
  v_new_total integer;
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

  if p_refund_amount is null or p_refund_amount <= 0 then
    return jsonb_build_object('ok', false, 'message', 'Invalid refund amount.');
  end if;
  v_amount := p_refund_amount;

  v_currency := upper(btrim(coalesce(p_refund_currency, '')));
  if v_currency = '' then
    return jsonb_build_object('ok', false, 'message', 'Refund currency is required.');
  end if;

  v_status := lower(btrim(coalesce(p_refund_status, '')));
  if v_status = '' then
    v_status := 'refunded';
  end if;
  if v_status not in ('processed', 'refunded', 'success') then
    return jsonb_build_object('ok', true, 'message', 'Refund is not final.', 'ignored', true);
  end if;

  select * into v_payment
  from public.payments
  where razorpay_order_id = p_order_id
  for update;
  if not found then
    return jsonb_build_object('ok', false, 'message', 'Unknown payment order.');
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

  select * into v_existing
  from public.payment_refunds pr
  where pr.refund_id = v_refund_id
     or (v_event_id is not null and pr.event_id = v_event_id)
  limit 1;
  if found then
    return jsonb_build_object(
      'ok', true,
      'message', 'Refund already recorded.',
      'refund_id', v_existing.refund_id,
      'refunded_amount', v_payment.refunded_amount,
      'duplicate', true
    );
  end if;

  if v_event_id is not null
     and not public.reserve_payment_event(v_event_id, v_payment.id, 'refund') then
    return jsonb_build_object('ok', true, 'message', 'Duplicate webhook event belongs to another payment.');
  end if;

  select coalesce(sum(pr.amount), 0) into v_total
  from public.payment_refunds pr
  where pr.payment_id = v_payment.id
    and lower(pr.status) in ('processed', 'refunded', 'success');

  v_new_total := v_total + v_amount;
  if v_new_total > v_payment.amount then
    return jsonb_build_object('ok', false, 'message', 'Refund amount exceeds the captured payment amount.');
  end if;

  insert into public.payment_refunds (refund_id, payment_id, event_id, amount, currency, status)
  values (v_refund_id, v_payment.id, v_event_id, v_amount, v_currency, v_status)
  on conflict (refund_id) do nothing;
  get diagnostics v_inserted = row_count;

  if v_inserted = 0 then
    return jsonb_build_object(
      'ok', true,
      'message', 'Refund already recorded.',
      'refund_id', v_refund_id,
      'refunded_amount', v_payment.refunded_amount,
      'duplicate', true
    );
  end if;

  update public.payments
     set status = case
                    when v_new_total >= amount then 'refunded'::public.payment_status
                    else status
                  end,
         razorpay_payment_id = coalesce(razorpay_payment_id, nullif(btrim(coalesce(p_razorpay_payment_id, '')), '')),
         razorpay_refund_id = coalesce(razorpay_refund_id, v_refund_id),
         refunded_amount = v_new_total,
         refunded_at = coalesce(refunded_at, now())
   where id = v_payment.id;

  return jsonb_build_object(
    'ok', true,
    'message', case when v_new_total >= v_payment.amount then 'Refund recorded.' else 'Partial refund recorded.' end,
    'refund_id', v_refund_id,
    'refunded_amount', v_new_total,
    'duplicate', false
  );
end;
$$;

revoke all on function public.record_refund(text, text, text, text, integer, text, text) from public;
grant execute on function public.record_refund(text, text, text, text, integer, text, text) to service_role;
