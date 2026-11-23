create or replace function public.property_has_active_premium(p_property_id uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select coalesce(public.has_active_premium(p.owner_id), false)
  from public.properties p
  where p.id = p_property_id;
$$;

revoke all on function public.property_has_active_premium(uuid) from public;
grant execute on function public.property_has_active_premium(uuid) to anon, authenticated, service_role;

create or replace function public.set_initial_review_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if public.is_admin() or public.is_service_role() then
    return new;
  end if;

  if public.property_has_active_premium(new.property_id) then
    new.status := 'pending';
  else
    new.status := 'approved';
  end if;

  return new;
end;
$$;

drop trigger if exists set_initial_review_status_trigger on public.reviews;
create trigger set_initial_review_status_trigger
  before insert on public.reviews
  for each row execute function public.set_initial_review_status();

create or replace function public.protect_review_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_is_owner boolean;
  v_is_reviewer boolean;
begin
  if public.is_admin() or public.is_service_role() then
    return new;
  end if;

  v_is_owner := exists (
    select 1 from public.properties p
    where p.id = old.property_id and p.owner_id = auth.uid()
  );
  v_is_reviewer :=
    (auth.uid() is not null and old.user_id = auth.uid())
    or (old.guest_token is not null and old.guest_token = public.current_guest_token());

  if new.user_id is distinct from old.user_id
    or new.guest_token is distinct from old.guest_token
    or new.reviewer_name is distinct from old.reviewer_name
    or new.property_id is distinct from old.property_id
    or new.created_at is distinct from old.created_at
  then
    raise exception 'Review ownership, property and moderation status cannot be changed'
      using errcode = '42501';
  end if;

  if new.status is distinct from old.status then
    if not v_is_owner and not v_is_reviewer then
      raise exception 'Review ownership, property and moderation status cannot be changed'
        using errcode = '42501';
    end if;
  elsif v_is_owner and not v_is_reviewer and (
    new.rating is distinct from old.rating
    or coalesce(new.title, '') is distinct from coalesce(old.title, '')
    or coalesce(new.comment, '') is distinct from coalesce(old.comment, '')
  ) then
    raise exception 'Property owners can only approve or remove reviews'
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
    or exists (
      select 1 from public.properties p
      where p.id = property_id and p.owner_id = auth.uid()
    )
    or public.is_admin()
  );

drop policy if exists "Users can create reviews" on public.reviews;
create policy "Users can create reviews"
  on public.reviews for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and guest_token is null
    and status in ('pending', 'approved')
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
    and status in ('pending', 'approved')
    and rating between 1 and 5
    and public.can_insert_guest_review(property_id, guest_token)
  );

drop policy if exists "Property owners can moderate reviews" on public.reviews;
create policy "Property owners can moderate reviews"
  on public.reviews for update
  to authenticated
  using (
    exists (
      select 1 from public.properties p
      where p.id = property_id and p.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.properties p
      where p.id = property_id and p.owner_id = auth.uid()
    )
  );

drop policy if exists "Property owners can remove reviews" on public.reviews;
create policy "Property owners can remove reviews"
  on public.reviews for delete
  to authenticated
  using (
    exists (
      select 1 from public.properties p
      where p.id = property_id and p.owner_id = auth.uid()
    )
  );
