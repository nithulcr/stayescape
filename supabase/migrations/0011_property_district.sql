alter table public.properties add column if not exists state text;
alter table public.properties add column if not exists district text;

update public.properties
set state = 'Kerala'
where state is null or btrim(state) = '';

update public.properties p
set district = case d.slug
  when 'wayanad' then 'Wayanad'
  when 'munnar' then 'Idukki'
  when 'thekkady' then 'Idukki'
  when 'kanthalloor' then 'Idukki'
  when 'alappuzha' then 'Alappuzha'
  when 'kochi' then 'Ernakulam'
  when 'fort-kochi' then 'Ernakulam'
  when 'kovalam' then 'Thiruvananthapuram'
  when 'varkala' then 'Thiruvananthapuram'
  when 'kumarakom' then 'Kottayam'
  when 'munroe-island' then 'Kollam'
  when 'kappad' then 'Kozhikode'
  else null
end
from public.destinations d
where p.destination_id = d.id and p.district is null;

alter table public.properties alter column state set default 'Kerala';
alter table public.properties alter column state set not null;

alter table public.properties drop constraint if exists properties_state_not_blank_check;
alter table public.properties add constraint properties_state_not_blank_check
  check (btrim(state) <> '');

alter table public.properties drop constraint if exists properties_district_valid_check;
alter table public.properties add constraint properties_district_valid_check
  check (
    district is null or district in (
      'Kasaragod', 'Kannur', 'Wayanad', 'Kozhikode', 'Malappuram', 'Palakkad',
      'Thrissur', 'Ernakulam', 'Idukki', 'Kottayam', 'Alappuzha',
      'Pathanamthitta', 'Kollam', 'Thiruvananthapuram'
    )
  );

create index if not exists properties_district_idx on public.properties (district);
create index if not exists properties_status_district_idx on public.properties (status, district);

create or replace function public.enforce_property_district()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if lower(btrim(new.state)) = 'kerala' and (new.district is null or btrim(new.district) = '') then
    raise exception 'District is required for Kerala properties';
  end if;
  return new;
end;
$$;

drop trigger if exists properties_enforce_district on public.properties;
create trigger properties_enforce_district
before insert or update of state, district on public.properties
for each row execute function public.enforce_property_district();
