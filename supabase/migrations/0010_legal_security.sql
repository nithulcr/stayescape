create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text,
  message text not null,
  status text not null default 'new' check (status in ('new', 'read', 'replied', 'closed')),
  created_at timestamptz not null default now()
);

create table if not exists public.review_reports (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews(id) on delete cascade,
  reporter_user_id uuid references public.profiles(id) on delete set null,
  reporter_guest_token uuid,
  reason text not null check (reason in ('spam', 'abuse', 'fake', 'irrelevant', 'private-information', 'other')),
  details text,
  status text not null default 'open' check (status in ('open', 'reviewed', 'dismissed', 'actioned')),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  actor_id uuid references public.profiles(id) on delete set null,
  actor_email text,
  action text not null,
  target_table text,
  target_id text,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  email_snapshot text not null,
  reason text,
  status text not null default 'pending' check (status in ('pending', 'anonymised', 'completed', 'rejected')),
  requested_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.security_rate_limits (
  key text primary key,
  window_start timestamptz not null,
  hits integer not null default 0
);

create index if not exists contact_messages_status_idx on public.contact_messages (status, created_at desc);
create index if not exists review_reports_status_idx on public.review_reports (status, created_at desc);
create index if not exists admin_audit_logs_occurred_idx on public.admin_audit_logs (occurred_at desc);
create index if not exists account_deletion_requests_status_idx on public.account_deletion_requests (status, requested_at desc);
create unique index if not exists review_reports_user_unique on public.review_reports (review_id, reporter_user_id) where reporter_user_id is not null;
create unique index if not exists review_reports_guest_unique on public.review_reports (review_id, reporter_guest_token) where reporter_guest_token is not null;

create or replace function public.consume_rate_limit(
  p_action text,
  p_subject text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_key text;
  v_now timestamptz;
  v_window_start timestamptz;
  v_hits integer;
begin
  if p_action is null or btrim(p_action) = '' or p_subject is null or btrim(p_subject) = '' then
    return true;
  end if;

  v_key := md5(p_action || ':' || p_subject);
  v_now := now();
  perform pg_advisory_xact_lock(hashtext(v_key));

  insert into public.security_rate_limits (key, window_start, hits)
  values (v_key, v_now, 1)
  on conflict (key) do update
    set window_start = case
          when public.security_rate_limits.window_start + make_interval(secs => p_window_seconds) <= v_now then v_now
          else public.security_rate_limits.window_start
        end,
        hits = case
          when public.security_rate_limits.window_start + make_interval(secs => p_window_seconds) <= v_now then 1
          else public.security_rate_limits.hits + 1
        end
  returning window_start, hits into v_window_start, v_hits;

  return v_hits <= p_limit;
end;
$$;

alter table public.contact_messages enable row level security;
alter table public.review_reports enable row level security;
alter table public.admin_audit_logs enable row level security;
alter table public.account_deletion_requests enable row level security;
alter table public.security_rate_limits enable row level security;

drop policy if exists "contact messages public insert" on public.contact_messages;
create policy "contact messages public insert" on public.contact_messages
  for insert to anon, authenticated
  with check (
    btrim(name) <> '' and btrim(email) <> '' and btrim(message) <> ''
    and char_length(message) <= 4000
  );

drop policy if exists "admins manage contact messages" on public.contact_messages;
create policy "admins manage contact messages" on public.contact_messages
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "review reports public insert" on public.review_reports;
create policy "review reports public insert" on public.review_reports
  for insert to anon, authenticated
  with check (
    status = 'open' and char_length(reason) between 3 and 120
    and char_length(coalesce(details, '')) <= 2000
  );

drop policy if exists "admins manage review reports" on public.review_reports;
create policy "admins manage review reports" on public.review_reports
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "admins read audit logs" on public.admin_audit_logs;
create policy "admins read audit logs" on public.admin_audit_logs
  for select to authenticated
  using (public.is_admin());

drop policy if exists "users read own deletion requests" on public.account_deletion_requests;
create policy "users read own deletion requests" on public.account_deletion_requests
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "users create own deletion requests" on public.account_deletion_requests;
create policy "users create own deletion requests" on public.account_deletion_requests
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "users update own deletion requests" on public.account_deletion_requests;
create policy "users update own deletion requests" on public.account_deletion_requests
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

revoke all on table public.contact_messages from anon, authenticated;
grant insert, select, update, delete on public.contact_messages to authenticated;
grant insert on public.contact_messages to anon;

revoke all on table public.review_reports from anon, authenticated;
grant insert, select, update, delete on public.review_reports to authenticated;
grant insert on public.review_reports to anon;

revoke all on table public.admin_audit_logs from anon, authenticated;
grant select on public.admin_audit_logs to authenticated;

revoke all on table public.account_deletion_requests from anon, authenticated;
grant insert, select, update on public.account_deletion_requests to authenticated;

revoke all on table public.security_rate_limits from anon, authenticated;
grant all on table public.security_rate_limits to service_role;

revoke all on function public.consume_rate_limit(text, text, integer, integer) from public;
grant execute on function public.consume_rate_limit(text, text, integer, integer) to anon, authenticated, service_role;
