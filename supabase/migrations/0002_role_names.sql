do $$
begin
  if exists (
    select 1
    from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'user_role'
      and e.enumlabel = 'customer'
  ) then
    alter type public.user_role rename value 'customer' to 'user';
  end if;

  if exists (
    select 1
    from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'user_role'
      and e.enumlabel = 'property_owner'
  ) then
    alter type public.user_role rename value 'property_owner' to 'owner';
  end if;
end $$;

alter type public.user_role add value if not exists 'super_admin';
