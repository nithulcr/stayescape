alter table public.subscriptions
  add column if not exists source text not null default 'razorpay';

do $$
declare
  constraint_name text;
begin
  for constraint_name in
    select conname
    from pg_constraint
    where conrelid = 'public.subscriptions'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) like '%source%'
      and pg_get_constraintdef(oid) like '%razorpay%'
      and pg_get_constraintdef(oid) like '%admin_grant%'
  loop
    execute format('alter table public.subscriptions drop constraint %I', constraint_name);
  end loop;
end $$;

alter table public.subscriptions
  add constraint subscriptions_source_check
  check (source in ('razorpay', 'admin_grant', 'manual'));

create table if not exists public.manual_subscription_requests (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  plan_id uuid not null references public.plans(id) on delete restrict,
  billing_cycle public.billing_cycle not null,
  amount integer not null check (amount > 0),
  currency text not null default 'INR' check (upper(btrim(currency)) = 'INR'),
  duration_months integer not null check (duration_months in (1, 6, 12)),
  status text not null default 'pending' check (
    status in ('pending', 'payment_submitted', 'under_verification', 'approved', 'rejected')
  ),
  payment_reference text,
  proof_path text,
  verified_at timestamptz,
  verified_by uuid references public.profiles(id) on delete set null,
  verified_reference text,
  rejection_reason text,
  admin_notes text,
  approved_subscription_id uuid references public.subscriptions(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.manual_request_history (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.manual_subscription_requests(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  actor_email text,
  from_status text,
  to_status text not null,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.manual_request_active_references (
  reference text primary key check (reference = upper(btrim(reference)) and btrim(reference) <> ''),
  request_id uuid not null references public.manual_subscription_requests(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists manual_request_active_references_request_idx
  on public.manual_request_active_references (request_id);

insert into public.manual_request_active_references (reference, request_id)
select distinct upper(btrim(candidate.reference)), candidate.request_id
from (
  select r.id as request_id, r.payment_reference as reference
  from public.manual_subscription_requests r
  where r.status in ('payment_submitted', 'under_verification', 'approved')
    and r.payment_reference is not null
  union
  select r.id as request_id, r.verified_reference as reference
  from public.manual_subscription_requests r
  where r.status in ('under_verification', 'approved')
    and r.verified_reference is not null
) candidate
where btrim(candidate.reference) <> ''
on conflict (reference) do nothing;

drop trigger if exists manual_subscription_requests_set_updated_at on public.manual_subscription_requests;
create trigger manual_subscription_requests_set_updated_at
  before update on public.manual_subscription_requests
  for each row execute function public.set_updated_at();

create index if not exists manual_subscription_requests_owner_idx
  on public.manual_subscription_requests (owner_id, created_at desc);
create index if not exists manual_subscription_requests_status_idx
  on public.manual_subscription_requests (status, created_at desc);
create index if not exists manual_request_history_request_idx
  on public.manual_request_history (request_id, created_at desc);

create unique index if not exists manual_requests_active_reference_unique
  on public.manual_subscription_requests (upper(btrim(payment_reference)))
  where status in ('payment_submitted', 'under_verification', 'approved')
    and payment_reference is not null;

create unique index if not exists manual_requests_verified_reference_unique
  on public.manual_subscription_requests (upper(btrim(verified_reference)))
  where status in ('under_verification', 'approved')
    and verified_reference is not null;

create or replace function public.sync_manual_request_active_references()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op <> 'INSERT' then
    delete from public.manual_request_active_references
    where request_id = old.id;
  end if;

  if tg_op <> 'DELETE' and new.status in ('payment_submitted', 'under_verification', 'approved') then
    insert into public.manual_request_active_references (reference, request_id)
    select distinct upper(btrim(candidate.reference)), new.id
    from (values (new.payment_reference), (new.verified_reference)) as candidate(reference)
    where candidate.reference is not null
      and btrim(candidate.reference) <> '';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists manual_request_active_references_sync on public.manual_subscription_requests;
create trigger manual_request_active_references_sync
after insert or update of status, payment_reference, verified_reference or delete
on public.manual_subscription_requests
for each row execute function public.sync_manual_request_active_references();

create or replace function public.record_manual_request_history(
  p_request_id uuid,
  p_actor_id uuid,
  p_actor_email text,
  p_from_status text,
  p_to_status text,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.manual_request_history (
    request_id, actor_id, actor_email, from_status, to_status, note
  )
  values (
    p_request_id,
    p_actor_id,
    nullif(btrim(coalesce(p_actor_email, '')), ''),
    p_from_status,
    p_to_status,
    nullif(btrim(coalesce(p_note, '')), '')
  );
end;
$$;

create or replace function public.record_manual_request_audit(
  p_actor_id uuid,
  p_actor_email text,
  p_action text,
  p_request_id uuid,
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
    'manual_subscription_requests',
    p_request_id::text,
    coalesce(p_metadata, '{}'::jsonb)
  );
end;
$$;

create or replace function public.assert_manual_request_owner(p_actor_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_actor_id is null or auth.uid() is null or auth.uid() <> p_actor_id then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.profiles p
    where p.id = p_actor_id
      and p.account_status = 'active'
      and p.role in ('owner', 'admin', 'super_admin')
  ) then
    raise exception 'Owner is not eligible' using errcode = '42501';
  end if;
end;
$$;

create or replace function public.assert_manual_request_admin(
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

  if not public.is_super_admin() or auth.uid() is null or auth.uid() <> p_actor_id then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
end;
$$;

create or replace function public.create_manual_subscription_request(
  p_owner_id uuid,
  p_plan_id uuid,
  p_billing_cycle public.billing_cycle,
  p_amount integer,
  p_currency text,
  p_duration_months integer,
  p_actor_id uuid,
  p_actor_email text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_plan public.plans%rowtype;
  v_expected_amount integer;
  v_expected_months integer;
  v_request_id uuid;
begin
  perform public.assert_manual_request_owner(p_actor_id);
  if p_owner_id is distinct from p_actor_id then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  if upper(btrim(coalesce(p_currency, ''))) <> 'INR' then
    return jsonb_build_object('ok', false, 'message', 'Only INR payments are supported.');
  end if;

  select * into v_plan
  from public.plans
  where id = p_plan_id
    and code = 'premium'
    and is_active;
  if not found then
    return jsonb_build_object('ok', false, 'message', 'Premium plan is not configured.');
  end if;

  v_expected_months := case p_billing_cycle
    when 'monthly' then 1
    when 'six_month' then 6
    when 'yearly' then 12
    else null
  end;
  v_expected_amount := round(case p_billing_cycle
    when 'monthly' then v_plan.price_monthly
    when 'six_month' then v_plan.price_six_month
    when 'yearly' then v_plan.price_yearly
    else 0
  end * 100)::integer;

  if v_expected_months is null
     or p_duration_months is distinct from v_expected_months
     or p_amount is null
     or p_amount <> v_expected_amount
     or v_expected_amount <= 0 then
    return jsonb_build_object('ok', false, 'message', 'Invalid plan price or duration.');
  end if;

  insert into public.manual_subscription_requests (
    owner_id, plan_id, billing_cycle, amount, currency, duration_months, status
  )
  values (
    p_owner_id, p_plan_id, p_billing_cycle, p_amount, 'INR', p_duration_months, 'pending'
  )
  returning id into v_request_id;

  perform public.record_manual_request_history(
    v_request_id, p_actor_id, p_actor_email, null, 'pending', 'WhatsApp request created.'
  );

  return jsonb_build_object(
    'ok', true,
    'message', 'Payment request created.',
    'request_id', v_request_id,
    'amount', p_amount
  );
end;
$$;

create or replace function public.owner_submit_manual_payment(
  p_request_id uuid,
  p_payment_reference text,
  p_proof_path text,
  p_actor_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request public.manual_subscription_requests%rowtype;
  v_reference text;
begin
  perform public.assert_manual_request_owner(p_actor_id);

  v_reference := upper(btrim(coalesce(p_payment_reference, '')));
  if v_reference !~ '^[A-Z0-9][A-Z0-9/_-]{5,63}$' then
    return jsonb_build_object(
      'ok', false,
      'message', 'Enter a valid transaction reference using 6 to 64 letters, numbers, slashes, underscores or hyphens.',
      'fieldErrors', jsonb_build_object('paymentReference', jsonb_build_array('Enter a valid transaction reference.'))
    );
  end if;

  if p_proof_path is null
     or btrim(p_proof_path) = ''
     or split_part(p_proof_path, '/', 1) <> p_actor_id::text
     or split_part(p_proof_path, '/', 2) <> p_request_id::text then
    return jsonb_build_object('ok', false, 'message', 'Invalid payment proof.');
  end if;

  select * into v_request
  from public.manual_subscription_requests
  where id = p_request_id
  for update;
  if not found or v_request.owner_id <> p_actor_id then
    return jsonb_build_object('ok', false, 'message', 'Payment request not found.');
  end if;
  if v_request.status <> 'pending' then
    return jsonb_build_object('ok', false, 'message', 'This payment request cannot be updated.');
  end if;

  begin
    update public.manual_subscription_requests
       set status = 'payment_submitted',
           payment_reference = v_reference,
           proof_path = btrim(p_proof_path)
     where id = p_request_id;
  exception when unique_violation then
    return jsonb_build_object(
      'ok', false,
      'message', 'This transaction reference has already been submitted.',
      'fieldErrors', jsonb_build_object('paymentReference', jsonb_build_array('This transaction reference has already been submitted.'))
    );
  end;

  perform public.record_manual_request_history(
    p_request_id, p_actor_id, null, 'pending', 'payment_submitted', 'Transaction reference and proof submitted.'
  );

  return jsonb_build_object('ok', true, 'message', 'Payment details submitted for verification.');
end;
$$;

create or replace function public.admin_verify_manual_payment(
  p_request_id uuid,
  p_verified_reference text,
  p_notes text,
  p_bank_credit_verified boolean,
  p_actor_id uuid,
  p_actor_email text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request public.manual_subscription_requests%rowtype;
  v_reference text;
begin
  perform public.assert_manual_request_admin(p_actor_id, p_actor_email);

  if p_bank_credit_verified is not true then
    return jsonb_build_object('ok', false, 'message', 'Confirm that the bank or UPI credit was checked.');
  end if;

  v_reference := upper(btrim(coalesce(p_verified_reference, '')));
  if v_reference !~ '^[A-Z0-9][A-Z0-9/_-]{5,63}$' then
    return jsonb_build_object(
      'ok', false,
      'message', 'Enter the actual bank or UPI transaction reference.',
      'fieldErrors', jsonb_build_object('verifiedReference', jsonb_build_array('Enter a valid transaction reference.'))
    );
  end if;
  if p_notes is not null and char_length(btrim(p_notes)) > 1000 then
    return jsonb_build_object('ok', false, 'message', 'Verification notes are too long.');
  end if;

  select * into v_request
  from public.manual_subscription_requests
  where id = p_request_id
  for update;
  if not found then
    return jsonb_build_object('ok', false, 'message', 'Payment request not found.');
  end if;
  if v_request.status <> 'payment_submitted' then
    return jsonb_build_object('ok', false, 'message', 'Only submitted payments can be marked as verified.');
  end if;

  begin
    update public.manual_subscription_requests
       set status = 'under_verification',
           verified_at = now(),
           verified_by = p_actor_id,
           verified_reference = v_reference,
           admin_notes = nullif(btrim(coalesce(p_notes, '')), '')
     where id = p_request_id;
  exception when unique_violation then
    return jsonb_build_object(
      'ok', false,
      'message', 'This transaction reference is already being used by another request.'
    );
  end;

  perform public.record_manual_request_history(
    p_request_id, p_actor_id, p_actor_email,
    'payment_submitted', 'under_verification', 'Bank or UPI credit verified by Super Admin.'
  );
  perform public.record_manual_request_audit(
    p_actor_id, p_actor_email, 'manual_payment.verified', p_request_id,
    jsonb_build_object(
      'submitted_reference', v_request.payment_reference,
      'verified_reference', v_reference,
      'amount', v_request.amount,
      'currency', v_request.currency
    )
  );

  return jsonb_build_object('ok', true, 'message', 'Payment marked as verified.');
end;
$$;

create or replace function public.admin_reject_manual_request(
  p_request_id uuid,
  p_reason text,
  p_actor_id uuid,
  p_actor_email text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request public.manual_subscription_requests%rowtype;
  v_reason text;
begin
  perform public.assert_manual_request_admin(p_actor_id, p_actor_email);

  v_reason := btrim(coalesce(p_reason, ''));
  if char_length(v_reason) not between 3 and 500 then
    return jsonb_build_object('ok', false, 'message', 'Enter a rejection reason of at least 3 characters.');
  end if;

  select * into v_request
  from public.manual_subscription_requests
  where id = p_request_id
  for update;
  if not found then
    return jsonb_build_object('ok', false, 'message', 'Payment request not found.');
  end if;
  if v_request.status not in ('pending', 'payment_submitted', 'under_verification') then
    return jsonb_build_object('ok', false, 'message', 'This request cannot be rejected.');
  end if;

  update public.manual_subscription_requests
     set status = 'rejected',
         rejection_reason = v_reason
   where id = p_request_id;

  perform public.record_manual_request_history(
    p_request_id, p_actor_id, p_actor_email,
    v_request.status, 'rejected', v_reason
  );
  perform public.record_manual_request_audit(
    p_actor_id, p_actor_email, 'manual_payment.rejected', p_request_id,
    jsonb_build_object(
      'previous_status', v_request.status,
      'reason', v_reason,
      'amount', v_request.amount,
      'currency', v_request.currency
    )
  );

  return jsonb_build_object('ok', true, 'message', 'Payment request rejected. Premium was not changed.');
end;
$$;

create or replace function public.admin_approve_manual_request(
  p_request_id uuid,
  p_notes text,
  p_actor_id uuid,
  p_actor_email text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request public.manual_subscription_requests%rowtype;
  v_profile public.profiles%rowtype;
  v_plan public.plans%rowtype;
  v_subscription public.subscriptions%rowtype;
  v_base timestamptz;
  v_expires_at timestamptz;
  v_subscription_id uuid;
begin
  perform public.assert_manual_request_admin(p_actor_id, p_actor_email);

  if p_notes is not null and char_length(btrim(p_notes)) > 1000 then
    return jsonb_build_object('ok', false, 'message', 'Approval notes are too long.');
  end if;

  select * into v_request
  from public.manual_subscription_requests
  where id = p_request_id
  for update;
  if not found then
    return jsonb_build_object('ok', false, 'message', 'Payment request not found.');
  end if;

  if v_request.status = 'approved' and v_request.approved_subscription_id is not null then
    return jsonb_build_object(
      'ok', true,
      'message', 'Payment was already approved.',
      'subscription_id', v_request.approved_subscription_id,
      'duplicate', true
    );
  end if;

  if v_request.status <> 'under_verification'
     or v_request.verified_at is null
     or v_request.verified_by is null
     or btrim(coalesce(v_request.verified_reference, '')) = '' then
    return jsonb_build_object(
      'ok', false,
      'message', 'Verify the actual bank or UPI credit before approval.'
    );
  end if;

  if exists (
    select 1
    from public.manual_subscription_requests other
    where other.id <> v_request.id
      and other.status in ('payment_submitted', 'under_verification', 'approved')
      and (
        upper(btrim(other.payment_reference)) in (
          upper(btrim(v_request.payment_reference)),
          upper(btrim(v_request.verified_reference))
        )
        or upper(btrim(other.verified_reference)) in (
          upper(btrim(v_request.payment_reference)),
          upper(btrim(v_request.verified_reference))
        )
      )
  ) then
    return jsonb_build_object('ok', false, 'message', 'This transaction reference was already approved.');
  end if;

  select * into v_plan
  from public.plans
  where id = v_request.plan_id
    and code = 'premium'
    and is_active;
  if not found then
    return jsonb_build_object('ok', false, 'message', 'Premium plan is not configured.');
  end if;

  select * into v_profile from public.profiles where id = v_request.owner_id for update;
  if not found or v_profile.account_status <> 'active' then
    return jsonb_build_object('ok', false, 'message', 'Payment owner is not eligible.');
  end if;

  select * into v_subscription
  from public.subscriptions
  where owner_id = v_request.owner_id
    and status = 'active'
  order by created_at desc
  limit 1
  for update;

  v_base := greatest(now(), coalesce(v_subscription.expires_at, now()));
  v_expires_at := (v_base at time zone 'UTC' + make_interval(months => v_request.duration_months)) at time zone 'UTC';
  if v_expires_at is null or v_expires_at <= v_base then
    return jsonb_build_object('ok', false, 'message', 'Invalid subscription expiry.');
  end if;

  if found then
    update public.subscriptions
       set plan_id = v_request.plan_id,
           status = 'active',
           billing_cycle = v_request.billing_cycle,
           starts_at = now(),
           expires_at = v_expires_at,
           source = 'manual',
           auto_renew = false,
           updated_at = now()
     where id = v_subscription.id;
    v_subscription_id := v_subscription.id;
  else
    insert into public.subscriptions (
      owner_id, plan_id, status, billing_cycle, starts_at, expires_at, source, auto_renew
    )
    values (
      v_request.owner_id, v_request.plan_id, 'active', v_request.billing_cycle,
      now(), v_expires_at, 'manual', false
    )
    returning id into v_subscription_id;
  end if;

  update public.manual_subscription_requests
     set status = 'approved',
         approved_subscription_id = v_subscription_id,
         admin_notes = case
           when nullif(btrim(coalesce(p_notes, '')), '') is null then admin_notes
           else nullif(btrim(coalesce(p_notes, '')), '')
         end
   where id = p_request_id;

  perform public.record_manual_request_history(
    p_request_id, p_actor_id, p_actor_email,
    'under_verification', 'approved', 'Premium activated after verified bank or UPI credit.'
  );
  perform public.record_manual_request_audit(
    p_actor_id, p_actor_email, 'manual_payment.approved', p_request_id,
    jsonb_build_object(
      'subscription_id', v_subscription_id,
      'owner_id', v_request.owner_id::text,
      'owner_email', v_profile.email,
      'amount', v_request.amount,
      'currency', v_request.currency,
      'verified_reference', v_request.verified_reference,
      'duration_months', v_request.duration_months,
      'expires_at', v_expires_at
    )
  );
  perform public.record_admin_subscription_audit(
    p_actor_id, p_actor_email, 'subscription.manual_approved', v_subscription_id,
    jsonb_build_object(
      'request_id', v_request.id::text,
      'target_user_id', v_request.owner_id::text,
      'target_email', v_profile.email,
      'new_status', 'active',
      'new_expires_at', v_expires_at,
      'duration_months', v_request.duration_months,
      'billing_cycle', v_request.billing_cycle::text,
      'amount', v_request.amount,
      'currency', v_request.currency,
      'verified_reference', v_request.verified_reference
    )
  );

  return jsonb_build_object(
    'ok', true,
    'message', 'Verified manual payment approved.',
    'subscription_id', v_subscription_id,
    'expires_at', v_expires_at,
    'duplicate', false
  );
end;
$$;

alter table public.manual_subscription_requests enable row level security;
alter table public.manual_request_history enable row level security;
alter table public.manual_request_active_references enable row level security;

drop policy if exists "Owners read own manual payment requests" on public.manual_subscription_requests;
create policy "Owners read own manual payment requests" on public.manual_subscription_requests
  for select to authenticated
  using (owner_id = auth.uid() or public.is_super_admin());

drop policy if exists "Owners create pending manual payment requests" on public.manual_subscription_requests;
create policy "Owners create pending manual payment requests" on public.manual_subscription_requests
  for insert to authenticated
  with check (
    owner_id = auth.uid()
    and status = 'pending'
    and currency = 'INR'
    and payment_reference is null
    and proof_path is null
    and verified_at is null
    and verified_by is null
    and verified_reference is null
    and rejection_reason is null
    and approved_subscription_id is null
    and duration_months = case billing_cycle
      when 'monthly' then 1
      when 'six_month' then 6
      when 'yearly' then 12
      else 0
    end
    and amount = (
      select round(case billing_cycle
        when 'monthly' then pl.price_monthly
        when 'six_month' then pl.price_six_month
        when 'yearly' then pl.price_yearly
        else 0
      end * 100)::integer
      from public.plans pl
      where pl.id = plan_id
        and pl.code = 'premium'
        and pl.is_active
    )
  );

drop policy if exists "Owners and super admins read manual request history" on public.manual_request_history;
create policy "Owners and super admins read manual request history" on public.manual_request_history
  for select to authenticated
  using (
    public.is_super_admin()
    or exists (
      select 1
      from public.manual_subscription_requests r
      where r.id = request_id
        and r.owner_id = auth.uid()
    )
  );

revoke all on table public.manual_subscription_requests from anon, authenticated;
grant select, insert on public.manual_subscription_requests to authenticated;
revoke all on table public.manual_request_history from anon, authenticated;
grant select on public.manual_request_history to authenticated;
revoke all on table public.manual_request_active_references from public, anon, authenticated;

revoke all on function public.record_manual_request_history(uuid, uuid, text, text, text, text) from public;
grant execute on function public.record_manual_request_history(uuid, uuid, text, text, text, text) to service_role;
revoke all on function public.record_manual_request_audit(uuid, text, text, uuid, jsonb) from public;
grant execute on function public.record_manual_request_audit(uuid, text, text, uuid, jsonb) to service_role;
revoke all on function public.assert_manual_request_owner(uuid) from public;
grant execute on function public.assert_manual_request_owner(uuid) to service_role;
revoke all on function public.assert_manual_request_admin(uuid, text) from public;
grant execute on function public.assert_manual_request_admin(uuid, text) to service_role;
revoke all on function public.sync_manual_request_active_references() from public;
grant execute on function public.sync_manual_request_active_references() to service_role;

revoke all on function public.create_manual_subscription_request(uuid, uuid, public.billing_cycle, integer, text, integer, uuid, text) from public;
grant execute on function public.create_manual_subscription_request(uuid, uuid, public.billing_cycle, integer, text, integer, uuid, text) to authenticated, service_role;
revoke all on function public.owner_submit_manual_payment(uuid, text, text, uuid) from public;
grant execute on function public.owner_submit_manual_payment(uuid, text, text, uuid) to authenticated, service_role;
revoke all on function public.admin_verify_manual_payment(uuid, text, text, boolean, uuid, text) from public;
grant execute on function public.admin_verify_manual_payment(uuid, text, text, boolean, uuid, text) to authenticated, service_role;
revoke all on function public.admin_reject_manual_request(uuid, text, uuid, text) from public;
grant execute on function public.admin_reject_manual_request(uuid, text, uuid, text) to authenticated, service_role;
revoke all on function public.admin_approve_manual_request(uuid, text, uuid, text) from public;
grant execute on function public.admin_approve_manual_request(uuid, text, uuid, text) to authenticated, service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'manual-payment-proofs',
  'manual-payment-proofs',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']::text[]
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Owners can upload manual payment proofs" on storage.objects;
create policy "Owners can upload manual payment proofs"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'manual-payment-proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
    and exists (
      select 1
      from public.manual_subscription_requests r
      where r.id = ((storage.foldername(name))[2])::uuid
        and r.owner_id = auth.uid()
        and r.status = 'pending'
    )
  );

drop policy if exists "Super admins can read manual payment proofs" on storage.objects;
create policy "Super admins can read manual payment proofs"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'manual-payment-proofs'
    and public.is_super_admin()
  );
