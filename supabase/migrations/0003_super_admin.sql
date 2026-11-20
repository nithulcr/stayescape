create or replace function public.is_super_admin()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role = 'super_admin'
      and p.account_status = 'active'
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'super_admin')
      and p.account_status = 'active'
  );
$$;

create or replace function public.is_active_property_owner(p_user_id uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = p_user_id
      and p.account_status = 'active'
      and p.role in ('owner', 'admin', 'super_admin')
  );
$$;

create or replace view public.public_property_owners
with (security_barrier = true)
as select p.id, p.full_name, p.avatar_url
   from public.profiles p
   where p.account_status = 'active'
     and p.role in ('owner', 'admin', 'super_admin')
     and exists (
       select 1
       from public.properties pr
       where pr.owner_id = p.id
         and public.property_is_visible(pr.id)
     );

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_role text := coalesce(new.raw_user_meta_data->>'role', 'user');
  assigned_role public.user_role := case
    when requested_role = 'owner' then 'owner'
    else 'user'
  end;
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(coalesce(new.email, ''), '@', 1)),
    assigned_role
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(profiles.full_name, excluded.full_name);
  return new;
end;
$$;

create or replace function public.prevent_profile_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  active_super_admins integer;
begin
  if public.is_service_role() then
    return new;
  end if;

  if new.id = auth.uid()
     and (
       new.role is distinct from old.role
       or new.account_status is distinct from old.account_status
     ) then
    raise exception 'You cannot change your own role or account status'
      using errcode = '42501';
  end if;

  if not public.is_super_admin() then
    if old.role in ('admin', 'super_admin') and new.id <> auth.uid() then
      raise exception 'Only a super admin can manage privileged accounts'
        using errcode = '42501';
    end if;
    if new.role in ('admin', 'super_admin') then
      raise exception 'Only a super admin can assign the admin role'
        using errcode = '42501';
    end if;
  end if;

  if old.role = 'super_admin'
     and (new.role is distinct from 'super_admin' or new.account_status = 'suspended') then
    select count(*) into active_super_admins
    from public.profiles p
    where p.role = 'super_admin'
      and p.account_status = 'active';
    if active_super_admins <= 1 then
      raise exception 'The last active super admin cannot be demoted or suspended'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.is_super_admin() from public;
grant execute on function public.is_super_admin() to anon, authenticated, service_role;

do $$
declare
  target_id uuid;
begin
  select p.id into target_id
  from public.profiles p
  where lower(p.email) = lower('nithulcr@gmail.com')
  limit 1;

  if target_id is null then
    raise notice 'SUPER ADMIN NOT ASSIGNED: no profile exists for nithulcr@gmail.com. Sign up with that email first, then run: update public.profiles set role = ''super_admin'' where lower(email) = lower(''nithulcr@gmail.com'');';
  else
    alter table public.profiles disable trigger prevent_profile_privilege_escalation_trigger;
    update public.profiles set role = 'super_admin' where id = target_id;
    alter table public.profiles enable trigger prevent_profile_privilege_escalation_trigger;
    raise notice 'SUPER ADMIN ASSIGNED: nithulcr@gmail.com is now super_admin.';
  end if;
end $$;
