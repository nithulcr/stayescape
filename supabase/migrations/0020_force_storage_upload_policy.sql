drop policy if exists "Owners can upload property images" on storage.objects;

create policy "Owners can upload property images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'property-images'
    and public.is_active_property_owner(auth.uid())
    and (
      public.storage_property_path_is_owned(name)
      or public.is_admin()
    )
    and case
      when (storage.foldername(name))[2] ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$'
        then (
          select count(*)
          from public.property_images pi
          where pi.property_id = ((storage.foldername(name))[2])::uuid
        ) < public.plan_limit_for((
          select p.owner_id
          from public.properties p
          where p.id = ((storage.foldername(name))[2])::uuid
        ), 'max_images_per_property')
      else false
    end
  );
