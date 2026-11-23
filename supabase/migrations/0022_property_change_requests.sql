alter table public.properties
  add column if not exists has_requested_changes boolean not null default false,
  add column if not exists change_requested_at timestamptz;

update public.properties
set has_requested_changes = true,
    change_requested_at = coalesce(change_requested_at, submitted_at)
where status = 'pending'
  and submitted_at is not null
  and submitted_at > created_at + interval '1 second';

create index if not exists properties_requested_changes_idx
  on public.properties (has_requested_changes, submitted_at desc);

create or replace function public.reset_approved_property(p_property_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.properties
     set status = 'pending',
         submitted_at = now(),
         approved_at = null,
         rejection_reason = null,
         has_requested_changes = true,
         change_requested_at = now()
   where id = p_property_id
     and status = 'approved';
end;
$$;

create or replace function public.guard_property_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if public.is_admin() or public.is_service_role() then
    return new;
  end if;

  if new.owner_id is distinct from old.owner_id then
    raise exception 'Property ownership cannot be changed' using errcode = '42501';
  end if;

  if new.is_featured is distinct from old.is_featured then
    raise exception 'Only admins can feature a property' using errcode = '42501';
  end if;

  if new.status = 'approved' and old.status is distinct from 'approved' then
    raise exception 'Only admins can approve a property' using errcode = '42501';
  end if;

  if old.status = 'approved' and (
    new.name is distinct from old.name
    or new.slug is distinct from old.slug
    or new.short_description is distinct from old.short_description
    or new.description is distinct from old.description
    or new.category_id is distinct from old.category_id
    or new.destination_id is distinct from old.destination_id
    or new.address is distinct from old.address
    or new.latitude is distinct from old.latitude
    or new.longitude is distinct from old.longitude
    or new.map_url is distinct from old.map_url
    or new.price_per_night is distinct from old.price_per_night
    or new.highlights is distinct from old.highlights
    or new.contact_phone is distinct from old.contact_phone
    or new.whatsapp_number is distinct from old.whatsapp_number
    or new.contact_email is distinct from old.contact_email
    or new.website_url is distinct from old.website_url
    or new.instagram_url is distinct from old.instagram_url
    or new.facebook_url is distinct from old.facebook_url
    or new.check_in_time is distinct from old.check_in_time
    or new.check_out_time is distinct from old.check_out_time
  ) then
    new.status := 'pending';
    new.submitted_at := now();
    new.approved_at := null;
    new.rejection_reason := null;
    new.has_requested_changes := true;
    new.change_requested_at := now();
  end if;

  return new;
end;
$$;

create or replace function public.set_approval_metadata()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'approved' then
    new.approved_at := coalesce(new.approved_at, now());
    new.rejection_reason := null;
    new.has_requested_changes := false;
    new.change_requested_at := null;
  elsif new.status = 'rejected' then
    if tg_op = 'UPDATE' and old.status is distinct from 'rejected' then
      new.has_requested_changes := false;
      new.change_requested_at := null;
    end if;
    new.approved_at := null;
    new.is_published := false;
    new.publish_after_renewal := false;
  else
    new.approved_at := null;
    new.is_published := false;
    new.publish_after_renewal := false;
  end if;
  return new;
end;
$$;
