alter type public.enquiry_status add value if not exists 'contacted';
alter type public.enquiry_status add value if not exists 'pending';
alter type public.enquiry_status add value if not exists 'completed';

alter table public.enquiries
  add column if not exists check_in date,
  add column if not exists check_out date,
  add column if not exists guests integer check (guests is null or guests > 0),
  add column if not exists response_message text,
  add column if not exists quoted_amount numeric(12, 2) check (quoted_amount is null or quoted_amount >= 0),
  add column if not exists quote_currency text not null default 'INR',
  add column if not exists responded_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

alter table public.enquiries drop constraint if exists enquiries_date_order_check;
alter table public.enquiries add constraint enquiries_date_order_check
  check (check_in is null or check_out is null or check_out > check_in);

alter table public.reviews drop constraint if exists reviews_status_check;
alter table public.reviews add constraint reviews_status_check
  check (status in ('pending', 'approved', 'rejected'));

create index if not exists reviews_property_status_created_idx
  on public.reviews (property_id, status, created_at desc);

create index if not exists enquiries_status_created_idx
  on public.enquiries (status, created_at desc);

create or replace function public.ensure_enquiry_property_approved()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.property_is_visible(new.property_id) then
    raise exception 'Enquiries are only accepted for published properties'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create or replace function public.protect_enquiry_customer_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if public.is_service_role() then
    return new;
  end if;

  if new.property_id is distinct from old.property_id
    or new.name is distinct from old.name
    or new.email is distinct from old.email
    or new.phone is distinct from old.phone
    or new.message is distinct from old.message
    or new.check_in is distinct from old.check_in
    or new.check_out is distinct from old.check_out
    or new.guests is distinct from old.guests
  then
    raise exception 'Customer enquiry details cannot be changed'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

create or replace function public.stamp_enquiry_response()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status is distinct from old.status
    and new.status::text in ('replied', 'contacted', 'completed')
    and new.responded_at is null
  then
    new.responded_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists set_updated_at_enquiries on public.enquiries;
create trigger set_updated_at_enquiries
  before update on public.enquiries
  for each row execute function public.set_updated_at();

drop trigger if exists protect_enquiry_customer_fields_trigger on public.enquiries;
create trigger protect_enquiry_customer_fields_trigger
  before update on public.enquiries
  for each row execute function public.protect_enquiry_customer_fields();

drop trigger if exists stamp_enquiry_response_trigger on public.enquiries;
create trigger stamp_enquiry_response_trigger
  before update on public.enquiries
  for each row execute function public.stamp_enquiry_response();

create or replace function public.can_insert_review(p_property_id uuid)
returns boolean
language plpgsql
security definer
stable
set search_path = ''
as $$
declare
  property_owner uuid;
begin
  if auth.uid() is null or not public.is_active_profile(auth.uid()) then
    return false;
  end if;
  if not public.property_is_visible(p_property_id) then
    return false;
  end if;

  select p.owner_id into property_owner
  from public.properties p
  where p.id = p_property_id;

  if property_owner is null or property_owner = auth.uid() then
    return false;
  end if;

  if exists (
    select 1
    from public.reviews r
    where r.property_id = p_property_id and r.user_id = auth.uid()
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
      or coalesce(new.comment, '') is distinct from coalesce(old.comment, '')
    )
  then
    new.status := 'pending';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_review_fields_trigger on public.reviews;
create trigger protect_review_fields_trigger
  before update on public.reviews
  for each row execute function public.protect_review_fields();

drop policy if exists "Public can view approved reviews" on public.reviews;
create policy "Public can view approved reviews"
  on public.reviews for select
  using (
    (status = 'approved' and public.property_is_visible(property_id))
    or user_id = auth.uid()
    or public.is_admin()
  );

drop policy if exists "Users can create reviews" on public.reviews;
create policy "Users can create reviews"
  on public.reviews for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and status = 'pending'
    and rating between 1 and 5
    and public.can_insert_review(property_id)
  );

drop policy if exists "Users can update own reviews" on public.reviews;
create policy "Users can update own reviews"
  on public.reviews for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and rating between 1 and 5);

drop policy if exists "Users can delete own reviews" on public.reviews;
create policy "Users can delete own reviews"
  on public.reviews for delete
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Anyone can enquire about published properties" on public.enquiries;
create policy "Anyone can enquire about published properties"
  on public.enquiries for insert
  with check (
    status = 'new'
    and public.property_is_visible(property_id)
  );

grant select, insert, update, delete on public.reviews to authenticated;

revoke all on function
  public.ensure_enquiry_property_approved(),
  public.protect_enquiry_customer_fields(),
  public.stamp_enquiry_response(),
  public.can_insert_review(uuid),
  public.protect_review_fields()
  from public;

grant execute on function public.ensure_enquiry_property_approved() to service_role;
grant execute on function public.protect_enquiry_customer_fields() to service_role;
grant execute on function public.stamp_enquiry_response() to service_role;
grant execute on function public.can_insert_review(uuid) to authenticated, service_role;
grant execute on function public.protect_review_fields() to service_role;
