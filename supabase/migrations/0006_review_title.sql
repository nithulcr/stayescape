alter table public.reviews
  add column if not exists title text;

alter table public.reviews drop constraint if exists reviews_title_check;
alter table public.reviews add constraint reviews_title_check
  check (title is null or (length(btrim(title)) between 1 and 120));

create or replace function public.protect_review_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if public.is_admin() or public.is_service_role() then
    return new;
  end if;

  if new.user_id is distinct from old.user_id
    or new.property_id is distinct from old.property_id
    or new.created_at is distinct from old.created_at
    or new.status is distinct from old.status
  then
    raise exception 'Review ownership, property and moderation status cannot be changed'
      using errcode = '42501';
  end if;

  if old.status = 'approved'
    and (
      new.rating is distinct from old.rating
      or coalesce(new.title, '') is distinct from coalesce(old.title, '')
      or coalesce(new.comment, '') is distinct from coalesce(old.comment, '')
    )
  then
    new.status := 'pending';
  end if;

  return new;
end;
$$;

revoke all on function public.protect_review_fields() from public;
grant execute on function public.protect_review_fields() to service_role;
