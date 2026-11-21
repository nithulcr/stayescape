-- STAYSCAPE initial seed data.
-- Kerala destinations only; no sample properties are seeded.

insert into public.plans (code, name, description, price_monthly, price_six_month, price_yearly,
  max_properties, max_images_per_property, expired_listing_visibility, is_active, sort_order, features)
values
  (
    'free', 'Free', 'List a single property and receive enquiries from travellers.',
    0, 0, 0, 1, 1, 'keep_visible', true, 1,
    array['1 property listing', '1 photo per property', 'Enquiry inbox', 'Admin-reviewed listing']
  ),
  (
    'premium', 'Premium', 'Showcase your properties with richer details and more photos.',
    499, 2499, 4999, 3, 5, 'hide', true, 2,
    array['3 property listings', '5 photos per property', 'Rich details and amenities', 'Priority placement', 'Direct contact links']
  )
on conflict (code) do nothing;

insert into public.categories (name, slug, description, icon, is_active, sort_order)
values
  ('Resorts', 'resorts', 'Full-service resorts with pools, dining and curated experiences.', 'Building2', true, 1),
  ('Private Villas', 'private-villas', 'Private, self-contained villas for families and groups.', 'Home', true, 2),
  ('Homestays', 'homestays', 'Warm, locally hosted stays with a personal touch.', 'Users', true, 3),
  ('Houseboats', 'houseboats', 'Traditional and luxury backwater houseboat experiences.', 'Ship', true, 4),
  ('Eco Stays', 'eco-stays', 'Low-impact stays close to nature and wildlife.', 'Leaf', true, 5),
  ('Boutique Hotels', 'boutique-hotels', 'Design-led hotels with intimate service and character.', 'KeyRound', true, 6),
  ('Beach Stays', 'beach-stays', 'Coastal escapes near Kerala’s beaches and backwaters.', 'Waves', true, 7),
  ('Tea Estate Stays', 'tea-estate-stays', 'Hill stays surrounded by tea gardens and misty valleys.', 'Mountain', true, 8)
on conflict (slug) do update
set name = excluded.name,
    description = excluded.description,
    icon = excluded.icon,
    is_active = excluded.is_active,
    sort_order = excluded.sort_order;

insert into public.amenities (name, slug, icon)
values
  ('Swimming pool', 'swimming-pool', 'Waves'),
  ('Free Wi-Fi', 'free-wifi', 'Wifi'),
  ('Breakfast included', 'breakfast-included', 'Coffee'),
  ('Free parking', 'free-parking', 'Car'),
  ('Air conditioning', 'air-conditioning', 'Wind'),
  ('Kitchen access', 'kitchen-access', 'ChefHat'),
  ('Private balcony', 'private-balcony', 'Sun'),
  ('Pet friendly', 'pet-friendly', 'PawPrint'),
  ('Spa and wellness', 'spa-and-wellness', 'Flower2'),
  ('On-site restaurant', 'on-site-restaurant', 'UtensilsCrossed'),
  ('River view', 'river-view', 'Waves'),
  ('Mountain view', 'mountain-view', 'Mountain'),
  ('Tea garden view', 'tea-garden-view', 'Leaf'),
  ('Airport pickup', 'airport-pickup', 'Plane'),
  ('Bonfire', 'bonfire', 'Flame'),
  ('Yoga deck', 'yoga-deck', 'Flower2')
on conflict (slug) do update
set name = excluded.name, icon = excluded.icon;

insert into public.destinations (
  name, slug, state, short_description, description, image_url,
  seo_title, seo_description, is_active, sort_order
)
values
  (
    'Wayanad', 'wayanad', 'Kerala',
    'Misty hills, wildlife and cool-weather retreats.',
    'Wayanad is Kerala’s hill district of forests, waterfalls, tea plantations and tribal heritage. It is ideal for nature-focused staycations, family trips and monsoon escapes.',
    'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1400&q=80',
    'Stays in Wayanad | STAYSCAPE',
    'Discover resorts, villas and homestays in Wayanad with misty valleys, waterfalls and wildlife experiences.',
    true, 1
  ),
  (
    'Munnar', 'munnar', 'Kerala',
    'Tea gardens, cool air and panoramic hill views.',
    'Munnar is Kerala’s best-known hill station, framed by rolling tea estates, eucalyptus forests and misty peaks. Explore tea museum visits, sunrise points and plantation stays.',
    'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1400&q=80',
    'Stays in Munnar | STAYSCAPE',
    'Find tea estate stays, resorts and homestays in Munnar for a refreshing Kerala hill getaway.',
    true, 2
  ),
  (
    'Alappuzha', 'alappuzha', 'Kerala',
    'Backwaters, canals and iconic houseboat journeys.',
    'Alappuzha, also known as Alleppey, is the gateway to Kerala’s backwaters. Stay on a houseboat or choose a riverside resort for sunset cruises and village experiences.',
    'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1400&q=80',
    'Stays in Alappuzha | STAYSCAPE',
    'Browse houseboats and backwater resorts in Alappuzha, one of Kerala’s most loved staycation destinations.',
    true, 3
  ),
  (
    'Kochi', 'kochi', 'Kerala',
    'Harbour city energy, heritage and great food.',
    'Kochi blends colonial history, busy harbours, art galleries and an excellent food scene. It is a convenient base for exploring central Kerala and the nearby islands.',
    'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1400&q=80',
    'Stays in Kochi | STAYSCAPE',
    'Explore boutique hotels, homestays and resorts in Kochi for culture, cuisine and coastal charm.',
    true, 4
  ),
  (
    'Fort Kochi', 'fort-kochi', 'Kerala',
    'Colonial streets, cafés and seaside heritage.',
    'Fort Kochi is a compact heritage quarter of churches, spice warehouses, art spaces and seaside promenades. Boutique stays here suit slow travellers and culture lovers.',
    'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=1400&q=80',
    'Stays in Fort Kochi | STAYSCAPE',
    'Find heritage homestays and boutique hotels in Fort Kochi, close to cafés, galleries and the seafront.',
    true, 5
  ),
  (
    'Kovalam', 'kovalam', 'Kerala',
    'Sandy beaches, surf and sunset-facing resorts.',
    'Kovalam is one of Kerala’s most popular beach destinations, known for crescent-shaped beaches, lighthouse views and a wide range of coastal resorts.',
    'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?auto=format&fit=crop&w=1400&q=80',
    'Stays in Kovalam | STAYSCAPE',
    'Discover beach resorts and villas in Kovalam for a relaxed Kerala seaside escape.',
    true, 6
  ),
  (
    'Varkala', 'varkala', 'Kerala',
    'Clifftop cafés and dramatic Arabian Sea views.',
    'Varkala’s red cliffs rise directly above the Arabian Sea, creating one of Kerala’s most distinctive coastal settings. It is popular with solo travellers, couples and yoga retreats.',
    'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=1400&q=80',
    'Stays in Varkala | STAYSCAPE',
    'Browse cliffside hotels, homestays and villas in Varkala with Arabian Sea views.',
    true, 7
  ),
  (
    'Thekkady', 'thekkady', 'Kerala',
    'Wildlife, spice gardens and forest-edge stays.',
    'Thekkady is home to Periyar Wildlife Sanctuary and a landscape of spice plantations, forest trails and calm lake waters. Wildlife and nature stays are especially popular here.',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1400&q=80',
    'Stays in Thekkady | STAYSCAPE',
    'Find forest lodges, spice plantation stays and resorts near Periyar in Thekkady.',
    true, 8
  ),
  (
    'Kumarakom', 'kumarakom', 'Kerala',
    'Birdlife, backwater villas and serene lakeside resorts.',
    'Kumarakom sits on the banks of Vembanad Lake and is known for birdwatching, houseboats and peaceful backwater resorts. It is a great choice for a slower, quieter staycation.',
    'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1400&q=80',
    'Stays in Kumarakom | STAYSCAPE',
    'Explore lakeside resorts and backwater villas in Kumarakom for a tranquil Kerala getaway.',
    true, 9
  ),
  (
    'Kanthalloor', 'kanthalloor', 'Kerala',
    'Cold-weather gardens and quiet hill villages.',
    'Kanthalloor is a high-altitude village near Munnar known for temperate fruits, quiet roads and dramatic mountain scenery. It suits travellers looking for an offbeat hill retreat.',
    'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1400&q=80',
    'Stays in Kanthalloor | STAYSCAPE',
    'Find offbeat homestays and eco stays in Kanthalloor, a quiet hill destination in Kerala.',
    true, 10
  ),
  (
    'Munroe Island', 'munroe-island', 'Kerala',
    'Narrow canals, villages and backwater birdlife.',
    'Munroe Island is a cluster of canals and village paths at the meeting point of Ashtamudi Lake and the Kallada River. Canoe trips and village homestays are the highlight.',
    'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1400&q=80',
    'Stays in Munroe Island | STAYSCAPE',
    'Discover homestays and backwater stays on Munroe Island for an authentic Kerala village experience.',
    true, 11
  ),
  (
    'Kappad', 'kappad', 'Kerala',
    'Historic beachfront and calm coastal evenings.',
    'Kappad is a peaceful beach destination near Kozhikode, known for its wide shoreline and connection to Vasco da Gama’s arrival in India. It is ideal for a low-key coastal stay.',
    'https://images.unsplash.com/photo-1540206395-68808572332f?auto=format&fit=crop&w=1400&q=80',
    'Stays in Kappad | STAYSCAPE',
    'Browse beach homestays and resorts in Kappad for a quiet north Kerala coastline escape.',
    true, 12
  )
on conflict (slug) do update
set name = excluded.name,
    state = excluded.state,
    short_description = excluded.short_description,
    description = excluded.description,
    image_url = excluded.image_url,
    seo_title = excluded.seo_title,
    seo_description = excluded.seo_description,
    is_active = excluded.is_active,
    sort_order = excluded.sort_order;
