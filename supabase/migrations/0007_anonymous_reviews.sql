alter table public.reviews alter column user_id drop not null;

alter table public.reviews
  add column if not exists guest_token uuid,
  add column if not exists reviewer_name text not null default 'Guest traveller';

alter table public.reviews drop constraint if exists reviews_reviewer_name_check;
alter table public.reviews add constraint reviews_reviewer_name_check
  check (length(btrim(reviewer_name)) between 1 and 100);

create unique index if not exists reviews_property_guest_token_key
  on public.reviews (property_id, guest_token)
  where guest_token is not null;

create or replace function public.current_guest_token()
returns uuid
language sql
stable
set search_path = ''
as $$
  with raw as (
    select nullif(current_setting('request.headers', true), '')::json ->> 'x-stayscape-guest' as value
  )
  select case
    when value ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
    then value::uuid
    else null
  end
  from raw;
$$;

create or replace function public.can_insert_guest_review(p_property_id uuid, p_guest_token uuid)
returns boolean
language plpgsql
security definer
stable
set search_path = ''
as $$
begin
  if p_guest_token is null or p_guest_token is distinct from public.current_guest_token() then
    return false;
  end if;
  if not public.property_is_visible(p_property_id) then
    return false;
  end if;
  if exists (
    select 1
    from public.reviews r
    where r.property_id = p_property_id and r.guest_token = p_guest_token
  ) then
    return false;
  end if;
  return true;
end;
$$;

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
    or new.guest_token is distinct from old.guest_token
    or new.reviewer_name is distinct from old.reviewer_name
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

drop policy if exists "Public can view approved reviews" on public.reviews;
create policy "Public can view approved reviews"
  on public.reviews for select
  using (
    (status = 'approved' and public.property_is_visible(property_id))
    or (auth.uid() is not null and user_id = auth.uid())
    or (guest_token is not null and guest_token = public.current_guest_token())
    or public.is_admin()
  );

drop policy if exists "Users can create reviews" on public.reviews;
create policy "Users can create reviews"
  on public.reviews for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and guest_token is null
    and status = 'pending'
    and rating between 1 and 5
    and public.can_insert_review(property_id)
  );

drop policy if exists "Guests can create reviews" on public.reviews;
create policy "Guests can create reviews"
  on public.reviews for insert
  to anon
  with check (
    user_id is null
    and guest_token is not null
    and guest_token = public.current_guest_token()
    and status = 'pending'
    and rating between 1 and 5
    and public.can_insert_guest_review(property_id, guest_token)
  );

drop policy if exists "Guests can update own reviews" on public.reviews;
create policy "Guests can update own reviews"
  on public.reviews for update
  to anon
  using (user_id is null and guest_token = public.current_guest_token())
  with check (user_id is null and guest_token = public.current_guest_token() and rating between 1 and 5);

drop policy if exists "Guests can delete own reviews" on public.reviews;
create policy "Guests can delete own reviews"
  on public.reviews for delete
  to anon
  using (user_id is null and guest_token = public.current_guest_token());

grant select, insert, update, delete on public.reviews to anon;

revoke all on function
  public.current_guest_token(),
  public.can_insert_guest_review(uuid, uuid),
  public.protect_review_fields()
  from public;

grant execute on function public.current_guest_token() to anon, authenticated, service_role;
grant execute on function public.can_insert_guest_review(uuid, uuid) to anon, service_role;
grant execute on function public.protect_review_fields() to service_role;
