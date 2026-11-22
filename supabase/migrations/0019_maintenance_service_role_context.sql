create or replace function public.is_service_role()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role'
     or current_user in ('service_role', 'postgres', 'supabase_admin');
$$;
