update public.plans
   set max_images_per_property = 1,
       updated_at = now()
 where code = 'free';

update public.plans
   set max_images_per_property = 5,
       features = array[
         '3 property listings',
         '5 photos per property',
         'Rich details and amenities',
         'Priority placement',
         'Direct contact links'
       ],
       updated_at = now()
 where code = 'premium';
