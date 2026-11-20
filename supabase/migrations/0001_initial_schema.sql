-- STAYSCAPE initial schema
-- Run with: supabase db push / paste into Supabase SQL editor.

create extension if not exists pgcrypto;

create type public.user_role as enum ('customer', 'property_owner', 'admin');
create type public.account_status as enum ('active', 'suspended');
create type public.property_status as enum ('draft', 'pending', 'approved', 'rejected');
create type public.plan_code as enum ('free', 'premium');
create type public.billing_cycle as enum ('monthly', 'yearly');
create type public.subscription_status as enum ('active', 'expired', 'cancelled');
create type public.payment_status as enum ('pending', 'success', 'failed', 'refunded');
create type public.enquiry_status as enum ('new', 'read', 'replied');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  role public.user_role not null default 'customer',
  phone text,
  avatar_url text,
  account_status public.account_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.destinations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  state text not null default 'Kerala',
  short_description text,
  description text,
  image_url text,
  seo_title text,
  seo_description text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  icon text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.amenities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  icon text,
  created_at timestamptz not null default now()
);

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  code public.plan_code not null unique,
  name text not null,
  description text,
  price_monthly numeric(10,2) not null default 0,
  price_yearly numeric(10,2) not null default 0,
  max_properties integer not null default 1 check (max_properties > 0),
  max_images_per_property integer not null default 1 check (max_images_per_property > 0),
  expired_listing_visibility text not null default 'keep_visible'
    check (expired_listing_visibility in ('keep_visible', 'hide')),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  features text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  slug text not null unique,
  description text,
  short_description text,
  category_id uuid references public.categories(id) on delete set null,
  destination_id uuid references public.destinations(id) on delete set null,
  address text,
  latitude numeric(10,7),
  longitude numeric(10,7),
  map_url text,
  price_per_night numeric(12,2) check (price_per_night is null or price_per_night >= 0),
  status public.property_status not null default 'draft',
  is_featured boolean not null default false,
  plan_type public.plan_code not null default 'free',
  contact_phone text,
  whatsapp_number text,
  contact_email text,
  website_url text,
  instagram_url text,
  facebook_url text,
  check_in_time text,
  check_out_time text,
  highlights text[] not null default '{}',
  rejection_reason text,
  submitted_at timestamptz,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint properties_approved_data_consistency
    check (
      status <> 'approved'
      or (
        coalesce(btrim(name), '') <> ''
        and coalesce(btrim(slug), '') <> ''
        and approved_at is not null
        and rejection_reason is null
      )
    )
);

create table public.property_images (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  storage_path text not null unique,
  public_url text not null,
  alt_text text,
  position integer not null default 0 check (position >= 0),
  is_cover boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index property_images_one_cover_per_property
  on public.property_images (property_id) where is_cover = true;
create index property_images_property_position_idx
  on public.property_images (property_id, position);

create table public.property_amenities (
  property_id uuid not null references public.properties(id) on delete cascade,
  amenity_id uuid not null references public.amenities(id) on delete cascade,
  primary key (property_id, amenity_id)
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  plan_id uuid not null references public.plans(id) on delete restrict,
  status public.subscription_status not null default 'active',
  billing_cycle public.billing_cycle not null default 'monthly',
  starts_at timestamptz not null default now(),
  expires_at timestamptz check (expires_at is null or expires_at > starts_at),
  razorpay_subscription_id text,
  auto_renew boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index subscriptions_one_active_per_owner
  on public.subscriptions (owner_id) where status = 'active';

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  plan_id uuid not null references public.plans(id) on delete restrict,
  razorpay_order_id text not null unique,
  razorpay_payment_id text unique,
  razorpay_signature text,
  amount integer not null check (amount > 0),
  currency text not null default 'INR',
  billing_cycle public.billing_cycle not null default 'monthly',
  status public.payment_status not null default 'pending',
  created_at timestamptz not null default now()
);

create table public.enquiries (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  message text not null,
  status public.enquiry_status not null default 'new',
  created_at timestamptz not null default now()
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  status text not null default 'pending' check (status in ('pending', 'approved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (property_id, user_id)
);

create index properties_status_created_idx on public.properties (status, created_at desc);
create index properties_owner_idx on public.properties (owner_id);
create index properties_owner_status_idx on public.properties (owner_id, status);
create index properties_destination_idx on public.properties (destination_id);
create index properties_category_idx on public.properties (category_id);
create index property_amenities_amenity_id_idx on public.property_amenities (amenity_id);
create index subscriptions_owner_idx on public.subscriptions (owner_id);
create index subscriptions_owner_status_idx on public.subscriptions (owner_id, status);
create index payments_user_idx on public.payments (user_id);
create index payments_user_created_idx on public.payments (user_id, created_at desc);
create index enquiries_property_idx on public.enquiries (property_id);
create index enquiries_created_idx on public.enquiries (created_at desc);
create index profiles_role_account_status_idx on public.profiles (role, account_status);

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
      and p.role = 'admin'
      and p.account_status = 'active'
  );
$$;

create or replace function public.is_service_role()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role';
$$;

create or replace function public.is_active_profile(p_user_id uuid)
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
      and p.role in ('property_owner', 'admin')
  );
$$;

create or replace function public.has_active_premium(p_owner_id uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.subscriptions s
    join public.plans pl on pl.id = s.plan_id
    where s.owner_id = p_owner_id
      and s.status = 'active'
      and (s.expires_at is null or s.expires_at > now())
      and pl.code = 'premium'
  );
$$;

create or replace function public.plan_limit_for(p_owner_id uuid, p_limit_key text)
returns integer
language plpgsql
security definer
stable
set search_path = ''
as $$
declare
  active_limit integer;
begin
  select case p_limit_key
           when 'max_properties' then pl.max_properties
           when 'max_images_per_property' then pl.max_images_per_property
         end
    into active_limit
  from public.subscriptions s
  join public.plans pl on pl.id = s.plan_id
  where s.owner_id = p_owner_id
    and s.status = 'active'
    and (s.expires_at is null or s.expires_at > now())
  order by s.created_at desc
  limit 1;

  if active_limit is null then
    select case p_limit_key
             when 'max_properties' then pl.max_properties
             when 'max_images_per_property' then pl.max_images_per_property
           end
      into active_limit
    from public.plans pl
    where pl.code = 'free';
  end if;

  return coalesce(active_limit, 1);
end;
$$;

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
         rejection_reason = null
   where id = p_property_id
     and status = 'approved';
end;
$$;

create or replace function public.property_is_visible(p_property_id uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.properties pr
    left join public.plans pl on pl.code = pr.plan_type
    where pr.id = p_property_id
      and pr.status = 'approved'
      and (
        pr.plan_type = 'free'
        or coalesce(pl.expired_listing_visibility, 'keep_visible') = 'keep_visible'
        or exists (
          select 1 from public.subscriptions s
          where s.owner_id = pr.owner_id
            and s.status = 'active'
            and (s.expires_at is null or s.expires_at > now())
        )
      )
  );
$$;

create or replace view public.public_property_owners
with (security_barrier = true)
as select p.id, p.full_name, p.avatar_url
   from public.profiles p
   where p.account_status = 'active'
     and p.role in ('property_owner', 'admin')
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
  requested_role text := coalesce(new.raw_user_meta_data->>'role', 'customer');
  assigned_role public.user_role := case
    when requested_role = 'property_owner' then 'property_owner'
    else 'customer'
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
begin
  if public.is_admin() or public.is_service_role() then
    return new;
  end if;
  if new.role is distinct from old.role or new.account_status is distinct from old.account_status then
    raise exception 'You cannot change your own role or account status'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

create or replace function public.sync_property_plan()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  active_plan public.plan_code;
begin
  select pl.code
    into active_plan
  from public.subscriptions s
  join public.plans pl on pl.id = s.plan_id
  where s.owner_id = new.owner_id
    and s.status = 'active'
    and (s.expires_at is null or s.expires_at > now())
  order by s.created_at desc
  limit 1;

  new.plan_type := coalesce(active_plan, 'free');
  return new;
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
  end if;

  return new;
end;
$$;

create or replace function public.reset_approved_property_from_image()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_property uuid;
begin
  if tg_op = 'DELETE' then
    target_property := old.property_id;
  else
    target_property := new.property_id;
  end if;

  perform public.reset_approved_property(target_property);
  return null;
end;
$$;

create or replace function public.reset_approved_property_from_amenity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_property uuid;
begin
  if tg_op = 'DELETE' then
    target_property := old.property_id;
  else
    target_property := new.property_id;
  end if;

  perform public.reset_approved_property(target_property);
  return null;
end;
$$;

create or replace function public.can_insert_property_image(p_property_id uuid)
returns boolean
language plpgsql
security definer
stable
set search_path = ''
as $$
declare
  property_owner uuid;
  image_limit integer;
  image_count integer;
begin
  if not public.is_active_property_owner(auth.uid()) then
    return false;
  end if;

  select p.owner_id into property_owner from public.properties p where p.id = p_property_id;
  if property_owner is null or property_owner <> auth.uid() then
    return false;
  end if;

  image_limit := public.plan_limit_for(property_owner, 'max_images_per_property');

  select count(*) into image_count from public.property_images pi where pi.property_id = p_property_id;
  return image_count < coalesce(image_limit, 1);
end;
$$;

create or replace function public.ensure_enquiry_property_approved()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  property_status public.property_status;
begin
  select status into property_status from public.properties where id = new.property_id;
  if property_status is distinct from 'approved' then
    raise exception 'Enquiries are only accepted for published properties'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create or replace function public.expire_subscriptions()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected integer;
begin
  update public.subscriptions
     set status = 'expired', updated_at = now()
   where status = 'active' and expires_at is not null and expires_at < now();
  get diagnostics affected = row_count;
  return affected;
end;
$$;

create or replace function public.enforce_active_owner_mutation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if public.is_admin() or public.is_service_role() then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  if auth.uid() is null or not public.is_active_property_owner(auth.uid()) then
    raise exception 'Active property owner access required'
      using errcode = '42501';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create or replace function public.enforce_property_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  allowed_properties integer;
  owned_properties integer;
begin
  if public.is_admin() or public.is_service_role() then
    return new;
  end if;

  if new.owner_id is distinct from auth.uid() then
    raise exception 'Property owner does not match the authenticated user'
      using errcode = '42501';
  end if;

  perform 1 from public.profiles p where p.id = new.owner_id for update;

  allowed_properties := public.plan_limit_for(new.owner_id, 'max_properties');
  select count(*) into owned_properties
  from public.properties p
  where p.owner_id = new.owner_id;

  if owned_properties >= allowed_properties then
    raise exception 'Plan property limit reached'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

create or replace function public.enforce_premium_property_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  unlimited_fields boolean;
  premium_value_set boolean;
begin
  unlimited_fields := public.is_admin() or public.is_service_role() or public.has_active_premium(new.owner_id);
  if unlimited_fields then
    return new;
  end if;

  premium_value_set :=
       coalesce(btrim(new.description), '') <> ''
    or coalesce(btrim(new.address), '') <> ''
    or new.latitude is not null
    or new.longitude is not null
    or coalesce(btrim(new.map_url), '') <> ''
    or new.price_per_night is not null
    or exists (
      select 1 from unnest(new.highlights) highlight
      where coalesce(btrim(highlight), '') <> ''
    )
    or coalesce(btrim(new.contact_phone), '') <> ''
    or coalesce(btrim(new.whatsapp_number), '') <> ''
    or coalesce(btrim(new.contact_email), '') <> ''
    or coalesce(btrim(new.website_url), '') <> ''
    or coalesce(btrim(new.instagram_url), '') <> ''
    or coalesce(btrim(new.facebook_url), '') <> ''
    or coalesce(btrim(new.check_in_time), '') <> ''
    or coalesce(btrim(new.check_out_time), '') <> '';

  if tg_op = 'INSERT' then
    if premium_value_set then
      raise exception 'An active Premium plan is required for rich listing fields'
        using errcode = '42501';
    end if;
    return new;
  end if;

  if (
       (new.description is distinct from old.description and coalesce(btrim(new.description), '') <> '')
    or (new.address is distinct from old.address and coalesce(btrim(new.address), '') <> '')
    or (new.latitude is distinct from old.latitude and new.latitude is not null)
    or (new.longitude is distinct from old.longitude and new.longitude is not null)
    or (new.map_url is distinct from old.map_url and coalesce(btrim(new.map_url), '') <> '')
    or (new.price_per_night is distinct from old.price_per_night and new.price_per_night is not null)
    or (
      new.highlights is distinct from old.highlights
      and exists (
        select 1 from unnest(new.highlights) highlight
        where coalesce(btrim(highlight), '') <> ''
      )
    )
    or (new.contact_phone is distinct from old.contact_phone and coalesce(btrim(new.contact_phone), '') <> '')
    or (new.whatsapp_number is distinct from old.whatsapp_number and coalesce(btrim(new.whatsapp_number), '') <> '')
    or (new.contact_email is distinct from old.contact_email and coalesce(btrim(new.contact_email), '') <> '')
    or (new.website_url is distinct from old.website_url and coalesce(btrim(new.website_url), '') <> '')
    or (new.instagram_url is distinct from old.instagram_url and coalesce(btrim(new.instagram_url), '') <> '')
    or (new.facebook_url is distinct from old.facebook_url and coalesce(btrim(new.facebook_url), '') <> '')
    or (new.check_in_time is distinct from old.check_in_time and coalesce(btrim(new.check_in_time), '') <> '')
    or (new.check_out_time is distinct from old.check_out_time and coalesce(btrim(new.check_out_time), '') <> '')
  ) then
    raise exception 'An active Premium plan is required to add or change rich listing fields'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

create or replace function public.enforce_premium_amenity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_property uuid;
  property_owner uuid;
begin
  if public.is_admin() or public.is_service_role() then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  if tg_op = 'DELETE' then
    target_property := old.property_id;
  else
    target_property := new.property_id;
  end if;

  select p.owner_id into property_owner
  from public.properties p
  where p.id = target_property;

  if property_owner is null or property_owner <> auth.uid() then
    raise exception 'Property ownership does not match the authenticated user'
      using errcode = '42501';
  end if;

  if tg_op <> 'DELETE' and not public.has_active_premium(property_owner) then
    raise exception 'An active Premium plan is required to manage property amenities'
      using errcode = '42501';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create or replace function public.sync_owner_properties_plan()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_owner uuid;
  active_plan public.plan_code;
begin
  if tg_op = 'DELETE' then
    target_owner := old.owner_id;
  else
    target_owner := new.owner_id;
  end if;

  select pl.code
    into active_plan
  from public.subscriptions s
  join public.plans pl on pl.id = s.plan_id
  where s.owner_id = target_owner
    and s.status = 'active'
    and (s.expires_at is null or s.expires_at > now())
  order by s.created_at desc
  limit 1;

  update public.properties p
     set plan_type = coalesce(active_plan, 'free')
   where p.owner_id = target_owner;

  return null;
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
  else
    new.approved_at := null;
  end if;
  return new;
end;
$$;

create or replace function public.storage_property_path_is_owned(p_path text)
returns boolean
language plpgsql
security definer
stable
set search_path = ''
as $$
begin
  if p_path is null or auth.uid() is null then
    return false;
  end if;

  if (storage.foldername(p_path))[1] <> auth.uid()::text then
    return false;
  end if;

  if (storage.foldername(p_path))[2] !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$' then
    return false;
  end if;

  return exists (
    select 1 from public.properties p
    where p.id = ((storage.foldername(p_path))[2])::uuid
      and p.owner_id = auth.uid()
  );
end;
$$;

create or replace function public.storage_property_path_is_visible(p_path text)
returns boolean
language plpgsql
security definer
stable
set search_path = ''
as $$
begin
  if p_path is null then
    return false;
  end if;

  if (storage.foldername(p_path))[1] = 'destinations' then
    return true;
  end if;

  if (storage.foldername(p_path))[2] !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$' then
    return false;
  end if;

  return public.property_is_visible(((storage.foldername(p_path))[2])::uuid);
end;
$$;

create trigger handle_new_user_trigger
  after insert on auth.users
  for each row execute function public.handle_new_user();

create trigger set_updated_at_profiles
  before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger set_updated_at_destinations
  before update on public.destinations
  for each row execute function public.set_updated_at();
create trigger set_updated_at_categories
  before update on public.categories
  for each row execute function public.set_updated_at();
create trigger set_updated_at_plans
  before update on public.plans
  for each row execute function public.set_updated_at();
create trigger set_updated_at_properties
  before update on public.properties
  for each row execute function public.set_updated_at();
create trigger set_updated_at_subscriptions
  before update on public.subscriptions
  for each row execute function public.set_updated_at();
create trigger set_updated_at_reviews
  before update on public.reviews
  for each row execute function public.set_updated_at();

create trigger prevent_profile_privilege_escalation_trigger
  before update on public.profiles
  for each row execute function public.prevent_profile_privilege_escalation();

create trigger enforce_active_owner_mutation_properties
  before insert or update or delete on public.properties
  for each row execute function public.enforce_active_owner_mutation();
create trigger enforce_property_limit_trigger
  before insert on public.properties
  for each row execute function public.enforce_property_limit();
create trigger enforce_premium_property_fields_trigger
  before insert or update on public.properties
  for each row execute function public.enforce_premium_property_fields();
create trigger set_approval_metadata_properties
  before insert or update on public.properties
  for each row execute function public.set_approval_metadata();
create trigger sync_property_plan_trigger
  before insert or update on public.properties
  for each row execute function public.sync_property_plan();
create trigger guard_property_update_trigger
  before update on public.properties
  for each row execute function public.guard_property_update();

create trigger enforce_active_owner_mutation_images
  before insert or update or delete on public.property_images
  for each row execute function public.enforce_active_owner_mutation();
create trigger reset_approved_property_from_image_trigger
  after insert or update or delete on public.property_images
  for each row execute function public.reset_approved_property_from_image();

create trigger enforce_active_owner_mutation_amenities
  before insert or update or delete on public.property_amenities
  for each row execute function public.enforce_active_owner_mutation();
create trigger enforce_premium_amenity_trigger
  before insert or update on public.property_amenities
  for each row execute function public.enforce_premium_amenity();
create trigger reset_approved_property_from_amenity_trigger
  after insert or update or delete on public.property_amenities
  for each row execute function public.reset_approved_property_from_amenity();

create trigger sync_owner_properties_plan_trigger
  after insert or update or delete on public.subscriptions
  for each row execute function public.sync_owner_properties_plan();

create trigger ensure_enquiry_property_approved_trigger
  before insert on public.enquiries
  for each row execute function public.ensure_enquiry_property_approved();

alter table public.profiles enable row level security;
alter table public.destinations enable row level security;
alter table public.categories enable row level security;
alter table public.amenities enable row level security;
alter table public.plans enable row level security;
alter table public.properties enable row level security;
alter table public.property_images enable row level security;
alter table public.property_amenities enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payments enable row level security;
alter table public.enquiries enable row level security;
alter table public.reviews enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (
    public.is_admin()
    or (id = auth.uid() and public.is_active_profile(auth.uid()))
  )
  with check (
    public.is_admin()
    or (id = auth.uid() and public.is_active_profile(auth.uid()))
  );

drop policy if exists "Public can view destinations" on public.destinations;
create policy "Public can view destinations"
  on public.destinations for select
  using (true);

drop policy if exists "Admins manage destinations" on public.destinations;
create policy "Admins manage destinations"
  on public.destinations for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Public can view categories" on public.categories;
create policy "Public can view categories"
  on public.categories for select
  using (true);

drop policy if exists "Admins manage categories" on public.categories;
create policy "Admins manage categories"
  on public.categories for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Public can view amenities" on public.amenities;
create policy "Public can view amenities"
  on public.amenities for select
  using (true);

drop policy if exists "Admins manage amenities" on public.amenities;
create policy "Admins manage amenities"
  on public.amenities for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Public can view plans" on public.plans;
create policy "Public can view plans"
  on public.plans for select
  using (true);

drop policy if exists "Admins manage plans" on public.plans;
create policy "Admins manage plans"
  on public.plans for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Public can view visible properties" on public.properties;
create policy "Public can view visible properties"
  on public.properties for select
  using (public.property_is_visible(id) or owner_id = auth.uid() or public.is_admin());

drop policy if exists "Owners can create properties" on public.properties;
create policy "Owners can create properties"
  on public.properties for insert
  to authenticated
  with check (
    public.is_admin()
    or (
      owner_id = auth.uid()
      and public.is_active_property_owner(auth.uid())
      and status in ('draft', 'pending')
      and is_featured = false
    )
  );

drop policy if exists "Owners can update own properties" on public.properties;
create policy "Owners can update own properties"
  on public.properties for update
  to authenticated
  using (
    public.is_admin()
    or (owner_id = auth.uid() and public.is_active_property_owner(auth.uid()))
  )
  with check (
    public.is_admin()
    or (owner_id = auth.uid() and public.is_active_property_owner(auth.uid()))
  );

drop policy if exists "Owners and admins can delete properties" on public.properties;
create policy "Owners and admins can delete properties"
  on public.properties for delete
  to authenticated
  using (
    public.is_admin()
    or (owner_id = auth.uid() and public.is_active_property_owner(auth.uid()))
  );

drop policy if exists "Public can view visible property images" on public.property_images;
create policy "Public can view visible property images"
  on public.property_images for select
  using (
    public.is_admin()
    or public.property_is_visible(property_id)
    or exists (
      select 1 from public.properties p
      where p.id = property_id and p.owner_id = auth.uid()
    )
  );

drop policy if exists "Owners can add property images" on public.property_images;
create policy "Owners can add property images"
  on public.property_images for insert
  to authenticated
  with check (public.can_insert_property_image(property_id) or public.is_admin());

drop policy if exists "Owners can update property images" on public.property_images;
create policy "Owners can update property images"
  on public.property_images for update
  to authenticated
  using (
    public.is_admin()
    or (
      public.is_active_property_owner(auth.uid())
      and exists (
        select 1 from public.properties p
        where p.id = property_id and p.owner_id = auth.uid()
      )
    )
  )
  with check (
    public.is_admin()
    or (
      public.is_active_property_owner(auth.uid())
      and exists (
        select 1 from public.properties p
        where p.id = property_id and p.owner_id = auth.uid()
      )
    )
  );

drop policy if exists "Owners can delete property images" on public.property_images;
create policy "Owners can delete property images"
  on public.property_images for delete
  to authenticated
  using (
    public.is_admin()
    or (
      public.is_active_property_owner(auth.uid())
      and exists (
        select 1 from public.properties p
        where p.id = property_id and p.owner_id = auth.uid()
      )
    )
  );

drop policy if exists "Public can view visible property amenities" on public.property_amenities;
create policy "Public can view visible property amenities"
  on public.property_amenities for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.properties p
      where p.id = property_id and p.owner_id = auth.uid()
    )
    or (
      public.property_is_visible(property_id)
      and exists (
        select 1 from public.properties p
        where p.id = property_id and public.has_active_premium(p.owner_id)
      )
    )
  );

drop policy if exists "Owners can manage property amenities" on public.property_amenities;
create policy "Owners can manage property amenities"
  on public.property_amenities for all
  to authenticated
  using (
    public.is_admin()
    or (
      public.is_active_property_owner(auth.uid())
      and exists (
        select 1 from public.properties p
        where p.id = property_id and p.owner_id = auth.uid()
      )
    )
  )
  with check (
    public.is_admin()
    or (
      public.is_active_property_owner(auth.uid())
      and exists (
        select 1 from public.properties p
        where p.id = property_id and p.owner_id = auth.uid()
      )
    )
  );

drop policy if exists "Users can view own subscriptions" on public.subscriptions;
create policy "Users can view own subscriptions"
  on public.subscriptions for select
  to authenticated
  using (owner_id = auth.uid() or public.is_admin());

drop policy if exists "Admins manage subscriptions" on public.subscriptions;
create policy "Admins manage subscriptions"
  on public.subscriptions for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Users can view own payments" on public.payments;
create policy "Users can view own payments"
  on public.payments for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "Admins manage payments" on public.payments;
create policy "Admins manage payments"
  on public.payments for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Owners can view property enquiries" on public.enquiries;
create policy "Owners can view property enquiries"
  on public.enquiries for select
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.properties p
      where p.id = property_id and p.owner_id = auth.uid()
    )
  );

drop policy if exists "Anyone can enquire about published properties" on public.enquiries;
create policy "Anyone can enquire about published properties"
  on public.enquiries for insert
  with check (
    status = 'new'
    and exists (
      select 1 from public.properties p
      where p.id = property_id and p.status = 'approved'
    )
  );

drop policy if exists "Owners can update property enquiries" on public.enquiries;
create policy "Owners can update property enquiries"
  on public.enquiries for update
  to authenticated
  using (
    public.is_admin()
    or (
      public.is_active_property_owner(auth.uid())
      and exists (
        select 1 from public.properties p
        where p.id = property_id and p.owner_id = auth.uid()
      )
    )
  )
  with check (
    public.is_admin()
    or (
      public.is_active_property_owner(auth.uid())
      and exists (
        select 1 from public.properties p
        where p.id = property_id and p.owner_id = auth.uid()
      )
    )
  );

drop policy if exists "Admins can delete enquiries" on public.enquiries;
create policy "Admins can delete enquiries"
  on public.enquiries for delete
  to authenticated
  using (public.is_admin());

drop policy if exists "Public can view approved reviews" on public.reviews;
create policy "Public can view approved reviews"
  on public.reviews for select
  using (status = 'approved' or user_id = auth.uid() or public.is_admin());

drop policy if exists "Users can create reviews" on public.reviews;
create policy "Users can create reviews"
  on public.reviews for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and status = 'pending'
    and public.is_active_profile(auth.uid())
    and exists (
      select 1 from public.properties p
      where p.id = property_id and p.status = 'approved'
    )
  );

drop policy if exists "Admins manage reviews" on public.reviews;
create policy "Admins manage reviews"
  on public.reviews for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant usage on schema public to anon, authenticated, service_role;
grant usage on type public.user_role, public.account_status, public.property_status,
  public.plan_code, public.billing_cycle, public.subscription_status,
  public.payment_status, public.enquiry_status to anon, authenticated, service_role;
grant select on public.destinations, public.categories, public.amenities, public.plans,
  public.properties, public.property_images, public.property_amenities,
  public.reviews, public.public_property_owners to anon, authenticated;
grant select, insert, update, delete on public.profiles, public.subscriptions,
  public.payments, public.enquiries to authenticated;
grant insert on public.enquiries to anon;
grant insert, update, delete on public.properties, public.property_images,
  public.property_amenities to authenticated;
grant all on all tables in schema public to service_role;
revoke all on function
  public.set_updated_at(),
  public.is_admin(),
  public.is_service_role(),
  public.is_active_profile(uuid),
  public.is_active_property_owner(uuid),
  public.has_active_premium(uuid),
  public.plan_limit_for(uuid, text),
  public.reset_approved_property(uuid),
  public.property_is_visible(uuid),
  public.handle_new_user(),
  public.prevent_profile_privilege_escalation(),
  public.sync_property_plan(),
  public.guard_property_update(),
  public.reset_approved_property_from_image(),
  public.reset_approved_property_from_amenity(),
  public.can_insert_property_image(uuid),
  public.ensure_enquiry_property_approved(),
  public.expire_subscriptions(),
  public.enforce_active_owner_mutation(),
  public.enforce_property_limit(),
  public.enforce_premium_property_fields(),
  public.enforce_premium_amenity(),
  public.sync_owner_properties_plan(),
  public.set_approval_metadata(),
  public.storage_property_path_is_owned(text),
  public.storage_property_path_is_visible(text)
from public;

grant execute on function public.is_admin() to anon, authenticated, service_role;
grant execute on function public.is_service_role() to anon, authenticated, service_role;
grant execute on function public.is_active_profile(uuid) to authenticated, service_role;
grant execute on function public.is_active_property_owner(uuid) to authenticated, service_role;
grant execute on function public.has_active_premium(uuid) to anon, authenticated, service_role;
grant execute on function public.property_is_visible(uuid) to anon, authenticated, service_role;
grant execute on function public.plan_limit_for(uuid, text) to authenticated, service_role;
grant execute on function public.can_insert_property_image(uuid) to authenticated, service_role;
grant execute on function public.storage_property_path_is_owned(text) to anon, authenticated, service_role;
grant execute on function public.storage_property_path_is_visible(text) to anon, authenticated, service_role;
grant execute on function public.reset_approved_property(uuid) to service_role;
grant execute on function public.expire_subscriptions() to service_role;
grant execute on function public.set_updated_at() to service_role;
grant execute on function public.handle_new_user() to service_role;
grant execute on function public.prevent_profile_privilege_escalation() to service_role;
grant execute on function public.sync_property_plan() to service_role;
grant execute on function public.guard_property_update() to service_role;
grant execute on function public.reset_approved_property_from_image() to service_role;
grant execute on function public.reset_approved_property_from_amenity() to service_role;
grant execute on function public.ensure_enquiry_property_approved() to service_role;
grant execute on function public.enforce_active_owner_mutation() to service_role;
grant execute on function public.enforce_property_limit() to service_role;
grant execute on function public.enforce_premium_property_fields() to service_role;
grant execute on function public.enforce_premium_amenity() to service_role;
grant execute on function public.sync_owner_properties_plan() to service_role;
grant execute on function public.set_approval_metadata() to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'property-images',
  'property-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']::text[]
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read property images" on storage.objects;
create policy "Public can read property images"
  on storage.objects for select
  using (
    bucket_id = 'property-images'
    and (
      public.is_admin()
      or public.storage_property_path_is_visible(name)
      or public.storage_property_path_is_owned(name)
    )
  );

drop policy if exists "Owners can upload property images" on storage.objects;
create policy "Owners can upload property images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'property-images'
    and public.is_active_property_owner(auth.uid())
    and public.storage_property_path_is_owned(name)
    and case
      when (storage.foldername(name))[2] ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$'
        then (
          select count(*)
          from public.property_images pi
          where pi.property_id = ((storage.foldername(name))[2])::uuid
        ) < public.plan_limit_for(auth.uid(), 'max_images_per_property')
      else false
    end
  );

drop policy if exists "Admins can upload destination images" on storage.objects;
create policy "Admins can upload destination images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'property-images'
    and (storage.foldername(name))[1] = 'destinations'
    and public.is_admin()
  );

drop policy if exists "Owners can update own images" on storage.objects;
create policy "Owners can update own images"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'property-images'
    and (
      public.is_admin()
      or (
        public.is_active_property_owner(auth.uid())
        and public.storage_property_path_is_owned(name)
      )
    )
  )
  with check (
    bucket_id = 'property-images'
    and (
      public.is_admin()
      or (
        public.is_active_property_owner(auth.uid())
        and public.storage_property_path_is_owned(name)
      )
    )
  );

drop policy if exists "Owners can delete own images" on storage.objects;
create policy "Owners can delete own images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'property-images'
    and (
      public.is_admin()
      or (
        public.is_active_property_owner(auth.uid())
        and public.storage_property_path_is_owned(name)
      )
    )
  );
