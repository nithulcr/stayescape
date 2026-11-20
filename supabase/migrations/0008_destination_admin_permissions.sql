alter table public.destinations enable row level security;

drop policy if exists "Admins manage destinations" on public.destinations;

drop policy if exists "Admins and super admins can insert destinations" on public.destinations;
create policy "Admins and super admins can insert destinations"
  on public.destinations for insert
  to authenticated
  with check (public.is_admin() or public.is_super_admin());

drop policy if exists "Admins and super admins can update destinations" on public.destinations;
create policy "Admins and super admins can update destinations"
  on public.destinations for update
  to authenticated
  using (public.is_admin() or public.is_super_admin())
  with check (public.is_admin() or public.is_super_admin());

drop policy if exists "Admins and super admins can delete destinations" on public.destinations;
create policy "Admins and super admins can delete destinations"
  on public.destinations for delete
  to authenticated
  using (public.is_admin() or public.is_super_admin());

revoke insert, update, delete on public.destinations from anon;
grant select on public.destinations to anon;
grant select, insert, update, delete on public.destinations to authenticated;
