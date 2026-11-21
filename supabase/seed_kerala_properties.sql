begin;

select set_config('request.jwt.claim.role', 'service_role', true);

do $$
declare
  v_owner_id uuid;
begin
  select p.id
    into v_owner_id
    from public.profiles p
   where lower(p.email) = lower('nithulcr@gmail.com')
   order by p.created_at
   limit 1;

  if v_owner_id is null then
    raise exception 'Profile not found for nithulcr@gmail.com';
  end if;
end
$$;

insert into public.destinations (
  name, slug, state, short_description, description,
  seo_title, seo_description, is_active, sort_order
)
values
  (
    'Vagamon', 'vagamon', 'Kerala',
    'Meadows, pine forests and cool hill air.',
    'Vagamon is a high-range hill destination in Idukki district known for rolling meadows, pine forests, mist and quiet roadside stops.',
    'Stays in Vagamon | STAYSCAPE',
    'Explore trial stay listings in Vagamon, a cool hill destination in Kerala.',
    true, 13
  ),
  (
    'Bekal', 'bekal', 'Kerala',
    'Fort views and a quiet north Kerala shoreline.',
    'Bekal is a coastal destination in Kasaragod district, known for Bekal Fort, beach walks and a slower north Kerala staycation pace.',
    'Stays in Bekal | STAYSCAPE',
    'Explore trial stay listings in Bekal, near Bekal Fort and the Kasaragod coast.',
    true, 14
  ),
  (
    'Palakkad', 'palakkad', 'Kerala',
    'Palm groves, dams and the Palakkad Gap.',
    'Palakkad is Kerala’s inland gateway, known for palace architecture, dams, farms and a landscape shaped by the Palakkad Gap.',
    'Stays in Palakkad | STAYSCAPE',
    'Explore trial stay listings in Palakkad for a calm inland Kerala staycation.',
    true, 15
  ),
  (
    'Thrissur', 'thrissur', 'Kerala',
    'Heritage streets, temples and cultural landmarks.',
    'Thrissur is central Kerala’s cultural hub, with temple precincts, museums, markets and easy access to both coast and inland villages.',
    'Stays in Thrissur | STAYSCAPE',
    'Explore trial stay listings in Thrissur, Kerala’s cultural capital.',
    true, 16
  ),
  (
    'Kannur', 'kannur', 'Kerala',
    'Cliff-top forts, beaches and folk traditions.',
    'Kannur combines coastal scenery, hill forts and strong folk traditions, making it a useful base for exploring north Kerala.',
    'Stays in Kannur | STAYSCAPE',
    'Explore trial stay listings in Kannur, a coastal and cultural destination in north Kerala.',
    true, 17
  ),
  (
    'Kozhikode', 'kozhikode', 'Kerala',
    'Historic coast, food streets and easy beach access.',
    'Kozhikode is a north Kerala city known for its harbour history, food culture and nearby beaches such as Kappad.',
    'Stays in Kozhikode | STAYSCAPE',
    'Explore trial stay listings in Kozhikode, a historic coastal city in north Kerala.',
    true, 18
  )
on conflict (slug) do nothing;

with seed_properties (
  slug, name, short_description, description,
  destination_slug, district, category_slug, price, address
) as (
  values
    (
      'vythiri-village-resort-trial',
      'Vythiri Village Resort',
      'Trial listing in Wayanad; demo price INR 9500 per night, not verified.',
      'Trial listing for Vythiri Village Resort in Wayanad. Demo starting price: INR 9500 per night, an estimate for testing only and not a verified current rate. Name and location are real; facilities, images and reviews are intentionally not seeded.',
      'wayanad', 'Wayanad', 'resorts', 9500.00,
      'Vythiri, Wayanad, Kerala'
    ),
    (
      'namaham-homestay-trial',
      'NAMAHA HOMESTAY',
      'Trial listing in Wayanad; demo price INR 4200 per night, not verified.',
      'Trial listing for NAMAHAM HOMESTAY in Wayanad. Demo starting price: INR 4200 per night, an estimate for testing only and not a verified current rate. Name and location are real; facilities, images and reviews are intentionally not seeded.',
      'wayanad', 'Wayanad', 'homestays', 4200.00,
      'Wayanad, Kerala'
    ),
    (
      'ktdc-tea-county-trial',
      'KTDC Tea County',
      'Trial listing in Munnar; demo price INR 5500 per night, not verified.',
      'Trial listing for KTDC Tea County in Munnar. Demo starting price: INR 5500 per night, an estimate for testing only and not a verified current rate. Name and location are real; facilities, images and reviews are intentionally not seeded.',
      'munnar', 'Idukki', 'boutique-hotels', 5500.00,
      'Munnar, Idukki, Kerala'
    ),
    (
      'windermere-estate-trial',
      'Windermere Estate',
      'Trial listing in Munnar; demo price INR 11000 per night, not verified.',
      'Trial listing for Windermere Estate in Munnar. Demo starting price: INR 11000 per night, an estimate for testing only and not a verified current rate. Name and location are real; facilities, images and reviews are intentionally not seeded.',
      'munnar', 'Idukki', 'tea-estate-stays', 11000.00,
      'Munnar, Idukki, Kerala'
    ),
    (
      'ktdc-aranya-nivas-trial',
      'KTDC Aranya Nivas',
      'Trial listing in Thekkady; demo price INR 6500 per night, not verified.',
      'Trial listing for KTDC Aranya Nivas in Thekkady. Demo starting price: INR 6500 per night, an estimate for testing only and not a verified current rate. Name and location are real; facilities, images and reviews are intentionally not seeded.',
      'thekkady', 'Idukki', 'eco-stays', 6500.00,
      'Thekkady, Idukki, Kerala'
    ),
    (
      'spice-village-thekkady-trial',
      'Spice Village, Thekkady - A CGH Earth Experience',
      'Trial listing in Thekkady; demo price INR 13000 per night, not verified.',
      'Trial listing for Spice Village in Thekkady. Demo starting price: INR 13000 per night, an estimate for testing only and not a verified current rate. Name and location are real; facilities, images and reviews are intentionally not seeded.',
      'thekkady', 'Idukki', 'eco-stays', 13000.00,
      'Thekkady, Idukki, Kerala'
    ),
    (
      'winter-vale-green-stay-trial',
      'Winter Vale Green Stay',
      'Trial listing in Vagamon; demo price INR 4500 per night, not verified.',
      'Trial listing for Winter Vale Green Stay in Vagamon. Demo starting price: INR 4500 per night, an estimate for testing only and not a verified current rate. Name and location are real; facilities, images and reviews are intentionally not seeded.',
      'vagamon', 'Idukki', 'eco-stays', 4500.00,
      'Vagamon, Idukki, Kerala'
    ),
    (
      'falcon-crest-vagamon-trial',
      'Falcon Crest',
      'Trial listing in Vagamon; demo price INR 5000 per night, not verified.',
      'Trial listing for Falcon Crest in Vagamon. Demo starting price: INR 5000 per night, an estimate for testing only and not a verified current rate. Name and location are real; facilities, images and reviews are intentionally not seeded.',
      'vagamon', 'Idukki', 'resorts', 5000.00,
      'Kolahalamedu, Vagamon, Idukki, Kerala'
    ),
    (
      'taj-kumarakom-resort-spa-kerala-trial',
      'Taj Kumarakom Resort & Spa, Kerala',
      'Trial listing in Kumarakom; demo price INR 18000 per night, not verified.',
      'Trial listing for Taj Kumarakom Resort & Spa, Kerala in Kumarakom. Demo starting price: INR 18000 per night, an estimate for testing only and not a verified current rate. Name and location are real; facilities, images and reviews are intentionally not seeded.',
      'kumarakom', 'Kottayam', 'resorts', 18000.00,
      'Kumarakom, Kottayam, Kerala'
    ),
    (
      'kumarakom-lake-resort-trial',
      'Kumarakom Lake Resort',
      'Trial listing in Kumarakom; demo price INR 16000 per night, not verified.',
      'Trial listing for Kumarakom Lake Resort in Kumarakom. Demo starting price: INR 16000 per night, an estimate for testing only and not a verified current rate. Name and location are real; facilities, images and reviews are intentionally not seeded.',
      'kumarakom', 'Kottayam', 'resorts', 16000.00,
      'Kumarakom, Kottayam, Kerala'
    ),
    (
      'marari-beach-resort-by-cgh-earth-trial',
      'Marari Beach Resort by CGH Earth',
      'Trial listing in Alappuzha; demo price INR 12000 per night, not verified.',
      'Trial listing for Marari Beach Resort by CGH Earth in Alappuzha. Demo starting price: INR 12000 per night, an estimate for testing only and not a verified current rate. Name and location are real; facilities, images and reviews are intentionally not seeded.',
      'alappuzha', 'Alappuzha', 'beach-stays', 12000.00,
      'Marari, Alappuzha, Kerala'
    ),
    (
      'spice-routes-pepper-trial',
      'Spice Routes Pepper',
      'Trial listing in Alappuzha; demo price INR 15000 per night, not verified.',
      'Trial listing for Spice Routes Pepper, a named houseboat associated with Alappuzha backwaters. Demo starting price: INR 15000 per night, an estimate for testing only and not a verified current rate. Name and location are real; facilities, images and reviews are intentionally not seeded.',
      'alappuzha', 'Alappuzha', 'houseboats', 15000.00,
      'Alappuzha, Kerala'
    ),
    (
      'gateway-varkala-ihcl-seleqtions-trial',
      'Gateway Varkala - IHCL SeleQtions',
      'Trial listing in Varkala; demo price INR 8000 per night, not verified.',
      'Trial listing for Gateway Varkala - IHCL SeleQtions near Varkala beach. Demo starting price: INR 8000 per night, an estimate for testing only and not a verified current rate. Name and location are real; facilities, images and reviews are intentionally not seeded.',
      'varkala', 'Thiruvananthapuram', 'boutique-hotels', 8000.00,
      'Varkala, Thiruvananthapuram, Kerala'
    ),
    (
      'clafouti-heritage-beach-resort-trial',
      'Clafouti Heritage Beach Resort',
      'Trial listing in Varkala; demo price INR 5500 per night, not verified.',
      'Trial listing for Clafouti Heritage Beach Resort in Varkala. Demo starting price: INR 5500 per night, an estimate for testing only and not a verified current rate. Name and location are real; facilities, images and reviews are intentionally not seeded.',
      'varkala', 'Thiruvananthapuram', 'beach-stays', 5500.00,
      'Varkala, Thiruvananthapuram, Kerala'
    ),
    (
      'taj-bekal-resort-spa-kerala-trial',
      'Taj Bekal Resort & Spa, Kerala',
      'Trial listing in Bekal; demo price INR 17000 per night, not verified.',
      'Trial listing for Taj Bekal Resort & Spa, Kerala in Bekal. Demo starting price: INR 17000 per night, an estimate for testing only and not a verified current rate. Name and location are real; facilities, images and reviews are intentionally not seeded.',
      'bekal', 'Kasaragod', 'resorts', 17000.00,
      'Bekal, Kasaragod, Kerala'
    ),
    (
      'gateway-bekal-trial',
      'Gateway Bekal',
      'Trial listing in Bekal; demo price INR 9000 per night, not verified.',
      'Trial listing for Gateway Bekal in Bekal. Demo starting price: INR 9000 per night, an estimate for testing only and not a verified current rate. Name and location are real; facilities, images and reviews are intentionally not seeded.',
      'bekal', 'Kasaragod', 'resorts', 9000.00,
      'Bekal, Kasaragod, Kerala'
    ),
    (
      'ktdc-garden-house-malampuzha-trial',
      'KTDC Garden House',
      'Trial listing in Palakkad; demo price INR 3500 per night, not verified.',
      'Trial listing for KTDC Garden House near Malampuzha in Palakkad. Demo starting price: INR 3500 per night, an estimate for testing only and not a verified current rate. Name and location are real; facilities, images and reviews are intentionally not seeded.',
      'palakkad', 'Palakkad', 'boutique-hotels', 3500.00,
      'Malampuzha, Palakkad, Kerala'
    ),
    (
      'udaya-ayurveda-resort-palakkad-trial',
      'Udaya Ayurveda Resort',
      'Trial listing in Palakkad; demo price INR 5000 per night, not verified.',
      'Trial listing for Udaya Ayurveda Resort in Palakkad. Demo starting price: INR 5000 per night, an estimate for testing only and not a verified current rate. Name and location are real; facilities, images and reviews are intentionally not seeded.',
      'palakkad', 'Palakkad', 'resorts', 5000.00,
      'Palakkad, Kerala'
    ),
    (
      'ktdc-tamarind-thrissur-trial',
      'KTDC Tamarind Thrissur',
      'Trial listing in Thrissur; demo price INR 4500 per night, not verified.',
      'Trial listing for KTDC Tamarind Thrissur in Thrissur. Demo starting price: INR 4500 per night, an estimate for testing only and not a verified current rate. Name and location are real; facilities, images and reviews are intentionally not seeded.',
      'thrissur', 'Thrissur', 'boutique-hotels', 4500.00,
      'Thrissur, Kerala'
    ),
    (
      'wariyam-heritage-trial',
      'Wariyam Heritage',
      'Trial listing in Thrissur; demo price INR 4000 per night, not verified.',
      'Trial listing for Wariyam Heritage in Thrissur. Demo starting price: INR 4000 per night, an estimate for testing only and not a verified current rate. Name and location are real; facilities, images and reviews are intentionally not seeded.',
      'thrissur', 'Thrissur', 'homestays', 4000.00,
      'Thrissur, Kerala'
    ),
    (
      'taj-malabar-resort-spa-cochin-trial',
      'Taj Malabar Resort & Spa, Cochin',
      'Trial listing in Kochi; demo price INR 13000 per night, not verified.',
      'Trial listing for Taj Malabar Resort & Spa, Cochin in Kochi. Demo starting price: INR 13000 per night, an estimate for testing only and not a verified current rate. Name and location are real; facilities, images and reviews are intentionally not seeded.',
      'kochi', 'Ernakulam', 'resorts', 13000.00,
      'Kochi, Ernakulam, Kerala'
    ),
    (
      'grand-hyatt-kochi-bolgatty-trial',
      'Grand Hyatt Kochi Bolgatty',
      'Trial listing in Kochi; demo price INR 12000 per night, not verified.',
      'Trial listing for Grand Hyatt Kochi Bolgatty in Kochi. Demo starting price: INR 12000 per night, an estimate for testing only and not a verified current rate. Name and location are real; facilities, images and reviews are intentionally not seeded.',
      'kochi', 'Ernakulam', 'resorts', 12000.00,
      'Bolgatty, Kochi, Ernakulam, Kerala'
    ),
    (
      'ktdc-loom-land-kannur-trial',
      'KTDC Loom Land',
      'Trial listing in Kannur; demo price INR 4000 per night, not verified.',
      'Trial listing for KTDC Loom Land in Kannur. Demo starting price: INR 4000 per night, an estimate for testing only and not a verified current rate. Name and location are real; facilities, images and reviews are intentionally not seeded.',
      'kannur', 'Kannur', 'boutique-hotels', 4000.00,
      'Kannur, Kerala'
    ),
    (
      'asokam-beach-resort-trial',
      'Asokam Beach Resort',
      'Trial listing in Kannur; demo price INR 5500 per night, not verified.',
      'Trial listing for Asokam Beach Resort in Kannur. Demo starting price: INR 5500 per night, an estimate for testing only and not a verified current rate. Name and location are real; facilities, images and reviews are intentionally not seeded.',
      'kannur', 'Kannur', 'beach-stays', 5500.00,
      'Kannur, Kerala'
    ),
    (
      'the-gateway-hotel-beach-road-kozhikode-trial',
      'The Gateway Hotel Beach Road',
      'Trial listing in Kozhikode; demo price INR 7500 per night, not verified.',
      'Trial listing for The Gateway Hotel Beach Road in Kozhikode. Demo starting price: INR 7500 per night, an estimate for testing only and not a verified current rate. Name and location are real; facilities, images and reviews are intentionally not seeded.',
      'kozhikode', 'Kozhikode', 'boutique-hotels', 7500.00,
      'Beach Road, Kozhikode, Kerala'
    ),
    (
      'the-raviz-calicut-trial',
      'The Raviz Calicut',
      'Trial listing in Kozhikode; demo price INR 8500 per night, not verified.',
      'Trial listing for The Raviz Calicut in Kozhikode. Demo starting price: INR 8500 per night, an estimate for testing only and not a verified current rate. Name and location are real; facilities, images and reviews are intentionally not seeded.',
      'kozhikode', 'Kozhikode', 'resorts', 8500.00,
      'Kozhikode, Kerala'
    )
),
resolved as (
  select
    s.slug,
    s.name,
    s.short_description,
    s.description,
    s.district,
    s.price,
    s.address,
    d.id as destination_id,
    c.id as category_id,
    (
      select p.id
        from public.profiles p
       where lower(p.email) = lower('nithulcr@gmail.com')
       order by p.created_at
       limit 1
    ) as owner_id
  from seed_properties s
  left join public.destinations d on d.slug = s.destination_slug
  left join public.categories c on c.slug = s.category_slug
),
inserted as (
  insert into public.properties (
    owner_id,
    name,
    slug,
    description,
    short_description,
    category_id,
    destination_id,
    address,
    price_per_night,
    status,
    is_featured,
    contact_phone,
    whatsapp_number,
    contact_email,
    state,
    district,
    highlights,
    submitted_at
  )
  select
    r.owner_id,
    r.name,
    r.slug,
    r.description,
    r.short_description,
    r.category_id,
    r.destination_id,
    r.address,
    r.price,
    'pending'::public.property_status,
    false,
    '9946844274',
    '9946844274',
    'nithulcr@gmail.com',
    'Kerala',
    r.district,
    array['Trial/demo listing', 'Price and facilities require manual verification']::text[],
    now()
  from resolved r
  where r.owner_id is not null
    and r.destination_id is not null
    and r.category_id is not null
  on conflict (slug) do nothing
  returning id, slug
)
select count(*) as properties_inserted
from inserted;

commit;
