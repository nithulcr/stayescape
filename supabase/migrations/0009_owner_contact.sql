alter table public.profiles add column if not exists whatsapp_number text;

create or replace view public.public_property_owners
with (security_barrier = true)
as select p.id, p.full_name, p.avatar_url, p.phone, p.whatsapp_number
   from public.profiles p
   where p.account_status = 'active'
     and p.role in ('owner', 'admin', 'super_admin')
     and exists (
       select 1
       from public.properties pr
       where pr.owner_id = p.id
         and public.property_is_visible(pr.id)
     );
