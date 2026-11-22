alter table public.subscriptions
  add column if not exists user_name text;

update public.subscriptions s
set user_name = coalesce(
  nullif(btrim(p.full_name), ''),
  nullif(split_part(p.email, '@', 1), ''),
  nullif(btrim(p.email), ''),
  'Unknown user'
)
from public.profiles p
where p.id = s.owner_id
  and s.user_name is distinct from coalesce(
    nullif(btrim(p.full_name), ''),
    nullif(split_part(p.email, '@', 1), ''),
    nullif(btrim(p.email), ''),
    'Unknown user'
  );

update public.subscriptions
set user_name = 'Unknown user'
where user_name is null or btrim(user_name) = '';

alter table public.subscriptions
  alter column user_name set not null;

create or replace function public.subscription_user_name_for_owner(p_owner_id uuid)
returns text
language sql
security definer
stable
set search_path = ''
as $$
  select coalesce(
    nullif(btrim(p.full_name), ''),
    nullif(split_part(p.email, '@', 1), ''),
    nullif(btrim(p.email), ''),
    'Unknown user'
  )
  from public.profiles p
  where p.id = p_owner_id;
$$;

create or replace function public.set_subscription_user_name()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.user_name := coalesce(public.subscription_user_name_for_owner(new.owner_id), 'Unknown user');
  return new;
end;
$$;

drop trigger if exists set_subscription_user_name_trigger on public.subscriptions;
create trigger set_subscription_user_name_trigger
  before insert or update on public.subscriptions
  for each row execute function public.set_subscription_user_name();

create or replace function public.sync_subscription_user_name()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform set_config('app.subscription_user_name_sync', 'on', true);
  update public.subscriptions s
  set user_name = coalesce(
    nullif(btrim(new.full_name), ''),
    nullif(split_part(new.email, '@', 1), ''),
    nullif(btrim(new.email), ''),
    'Unknown user'
  )
  where s.owner_id = new.id
    and s.user_name is distinct from coalesce(
      nullif(btrim(new.full_name), ''),
      nullif(split_part(new.email, '@', 1), ''),
      nullif(btrim(new.email), ''),
      'Unknown user'
    );
  perform set_config('app.subscription_user_name_sync', 'off', true);
  return new;
end;
$$;

drop trigger if exists sync_subscription_user_name_trigger on public.profiles;
create trigger sync_subscription_user_name_trigger
  after update of full_name, email on public.profiles
  for each row execute function public.sync_subscription_user_name();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  if tg_table_name = 'subscriptions'
    and coalesce(current_setting('app.subscription_user_name_sync', true), 'off') = 'on' then
    return new;
  end if;

  new.updated_at = now();
  return new;
end;
$$;
