# Kerala Property Trial Seed Data

This document accompanies `supabase/seed_kerala_properties.sql`.

## What the script seeds

- 26 real, named Kerala properties across 13 requested locations.
- District and destination mapping for every property.
- Existing category slugs only; no new categories are created.
- Six missing destinations are created only when absent: `vagamon`, `bekal`, `palakkad`, `thrissur`, `kannur`, `kozhikode`.
- `pending` status only; no property is auto-approved or featured.
- Contact fields on every property:
  - `contact_email`: `nithulcr@gmail.com`
  - `contact_phone`: `9946844274`
  - `whatsapp_number`: `9946844274`
- Trial/demo starting prices in INR, explicitly marked as estimates in `short_description`, `description`, and `highlights`.

## Assumptions

1. The script resolves the existing profile by email and fails if `nithulcr@gmail.com` is absent. It does not create or update a profile. The profile UUID is used as `owner_id`.
2. Existing destination rows are resolved by slug. Because `vagamon`, `bekal`, `palakkad`, `thrissur`, `kannur`, and `kozhikode` are not in the current seed destinations, the script inserts those lookup rows with `ON CONFLICT (slug) DO NOTHING`. Existing destination rows are not updated.
3. Properties are idempotent by `slug` with `ON CONFLICT (slug) DO NOTHING`. Existing properties are never modified.
4. `properties` has no SEO columns, so no property SEO fields are seeded. Destination SEO fields are only supplied for newly created destinations; existing destinations are untouched.
5. `properties` has no `owner_name` column. Owner identity comes from `profiles` through the owner views; the profile is not modified.
6. Specific amenities are intentionally not linked because facility claims were not independently verified. No fake amenities are created.
7. No property images, image URLs, ratings, or reviews are inserted. Images must be uploaded manually.
8. Website, Instagram, Facebook, check-in, and check-out fields are left unset because they were not required for this trial seed.
9. Address values are locality-level only. No coordinates or map URLs are invented.
10. The script sets `request.jwt.claim.role` to `service_role` inside a transaction so plan-limit and rich-field triggers do not block the trial seed. Run it as a role allowed to set that claim.

## Prerequisites

1. Apply migrations through `0011_property_district.sql`.
2. Apply `supabase/seed.sql` so categories, plans, amenities, and base destinations exist.
3. Ensure a profile exists with email `nithulcr@gmail.com`.
4. Run `supabase/seed_kerala_properties.sql` in the Supabase SQL editor or with a database role that can write to `public` tables.

The script is safe to rerun. It returns `properties_inserted`, which will be `0` on later runs when the slugs already exist.

## Destination lookup changes

| Slug | District | Action |
|---|---|---|
| `vagamon` | Idukki | Insert only if missing |
| `bekal` | Kasaragod | Insert only if missing |
| `palakkad` | Palakkad | Insert only if missing |
| `thrissur` | Thrissur | Insert only if missing |
| `kannur` | Kannur | Insert only if missing |
| `kozhikode` | Kozhikode | Insert only if missing |

All other destination slugs used by the script already exist in `supabase/seed.sql`.

## Properties

Verification status means the name and location were sourced from public listings or official pages. Facilities, photographs, availability, reviews, and current prices were not independently verified.

| # | Property name | Destination | District | Type | Trial price/night | Verification status and source basis |
|---:|---|---|---|---|---:|---|
| 1 | Vythiri Village Resort | Wayanad | Wayanad | Resorts | INR 9500 | Name/location verified from Wayanad travel listings; facilities and price unverified. |
| 2 | NAMAHAM HOMESTAY | Wayanad | Wayanad | Homestays | INR 4200 | Name/location verified from Kerala Tourism approved homestay material and travel listings; facilities and price unverified. |
| 3 | KTDC Tea County | Munnar | Idukki | Boutique Hotels | INR 5500 | Name/location verified from KTDC and travel editorial sources; facilities and price unverified. |
| 4 | Windermere Estate | Munnar | Idukki | Tea Estate Stays | INR 11000 | Name/location verified from travel editorial sources; facilities and price unverified. |
| 5 | KTDC Aranya Nivas | Thekkady | Idukki | Eco Stays | INR 6500 | Name/location verified from KTDC and Thekkady accommodation sources; facilities and price unverified. |
| 6 | Spice Village, Thekkady - A CGH Earth Experience | Thekkady | Idukki | Eco Stays | INR 13000 | Name/location verified from CGH Earth and boutique-hotel listings; facilities and price unverified. |
| 7 | Winter Vale Green Stay | Vagamon | Idukki | Eco Stays | INR 4500 | Name/location verified from Vagamon resort listings; facilities and price unverified. |
| 8 | Falcon Crest | Vagamon | Idukki | Resorts | INR 5000 | Name/location verified from Vagamon and Kolahalamedu travel listings; facilities and price unverified. |
| 9 | Taj Kumarakom Resort & Spa, Kerala | Kumarakom | Kottayam | Resorts | INR 18000 | Name/location verified from Taj Hotels; facilities and price unverified. |
| 10 | Kumarakom Lake Resort | Kumarakom | Kottayam | Resorts | INR 16000 | Name/location verified from Kerala Tourism and Kottayam district listings; facilities and price unverified. |
| 11 | Marari Beach Resort by CGH Earth | Alappuzha | Alappuzha | Beach Stays | INR 12000 | Name/location verified from CGH Earth; facilities and price unverified. |
| 12 | Spice Routes Pepper | Alappuzha | Alappuzha | Houseboats | INR 15000 | Name/location verified from Alappuzha houseboat listings; facilities and price unverified. |
| 13 | Gateway Varkala - IHCL SeleQtions | Varkala | Thiruvananthapuram | Boutique Hotels | INR 8000 | Name/location verified from hotel-group and travel listings; facilities and price unverified. |
| 14 | Clafouti Heritage Beach Resort | Varkala | Thiruvananthapuram | Beach Stays | INR 5500 | Name/location verified from Varkala accommodation listings; facilities and price unverified. |
| 15 | Taj Bekal Resort & Spa, Kerala | Bekal | Kasaragod | Resorts | INR 17000 | Name/location verified from Taj Hotels and travel listings; facilities and price unverified. |
| 16 | Gateway Bekal | Bekal | Kasaragod | Resorts | INR 9000 | Name/location verified from Bekal accommodation listings; facilities and price unverified. |
| 17 | KTDC Garden House | Palakkad | Palakkad | Boutique Hotels | INR 3500 | Name/location verified from KTDC and Malampuzha listings; facilities and price unverified. |
| 18 | Udaya Ayurveda Resort | Palakkad | Palakkad | Resorts | INR 5000 | Name/location verified from Palakkad accommodation directories; facilities and price unverified. |
| 19 | KTDC Tamarind Thrissur | Thrissur | Thrissur | Boutique Hotels | INR 4500 | Name/location verified from KTDC and Thrissur listings; facilities and price unverified. |
| 20 | Wariyam Heritage | Thrissur | Thrissur | Homestays | INR 4000 | Name/location verified from Kerala homestay and Thrissur listings; facilities and price unverified. |
| 21 | Taj Malabar Resort & Spa, Cochin | Kochi | Ernakulam | Resorts | INR 13000 | Name/location verified from Taj Hotels and Kochi listings; facilities and price unverified. |
| 22 | Grand Hyatt Kochi Bolgatty | Kochi | Ernakulam | Resorts | INR 12000 | Name/location verified from hotel and Kochi travel listings; facilities and price unverified. |
| 23 | KTDC Loom Land | Kannur | Kannur | Boutique Hotels | INR 4000 | Name/location verified from KTDC and Kannur listings; facilities and price unverified. |
| 24 | Asokam Beach Resort | Kannur | Kannur | Beach Stays | INR 5500 | Name/location verified from Kannur accommodation listings; facilities and price unverified. |
| 25 | The Gateway Hotel Beach Road | Kozhikode | Kozhikode | Boutique Hotels | INR 7500 | Name/location verified from Kozhikode accommodation listings; facilities and price unverified. |
| 26 | The Raviz Calicut | Kozhikode | Kozhikode | Resorts | INR 8500 | Name/location verified from Kozhikode accommodation listings; facilities and price unverified. |

## Public source URLs used where available

- `https://www.gowayanad.info/blog/best-resorts-hotels-wayanad-2026`
- `https://entestay.in/`
- `https://www.keralatourism.org/where-to-stay/download_approved_list/4`
- `https://www.ktdc.com/`
- `https://www.cntraveller.in/story/best-places-to-stay-in-munnar/`
- `https://all-boutique-hotels.com/thekkadi`
- `https://www.vagamon.com/resorts`
- `https://www.tajhotels.com/en-in/hotels/taj-kumarakom-kerala`
- `https://www.keralatourism.org/resorts/the-zuri-kumarakom-kerala-resort-spa/2710`
- `https://www.itchotels.com/in/en/corporate/media-room/media-releases---reports/2026/ITC-Hotels-set-to-acquire-a-Luxury-Resort-along-the-Iconic-backwaters-of-Kumarakom-Kerala`
- `https://www.keralatourism.org/hotels/kumarakom-lake-resort/2704`
- `https://kottayam.nic.in/en/accommodation/kumarakom-lake-resort`
- `https://www.keralatourism.org/hotels/coconut-lagoon/2317`
- `https://www.cghearth.com/coconut-lagoon`

## Manual follow-up

- Upload property images manually through the admin flow.
- Verify amenities before linking amenity rows.
- Verify current prices before approving or publishing any listing.
- Replace locality-level addresses with precise addresses only when verified.
- Add ratings and reviews only through real user-generated data flows.
