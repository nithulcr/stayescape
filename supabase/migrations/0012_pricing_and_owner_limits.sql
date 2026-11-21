-- Phase 1: owner-based premium pricing and property limits.
-- This migration updates the existing plan catalog. It does not add a second
-- configuration table and does not touch existing subscriptions or payments.

alter type public.billing_cycle add value if not exists 'six_month';

alter table public.plans
  add column if not exists price_six_month numeric(10,2) not null default 0;

update public.plans
   set max_properties = 1,
       price_monthly = 0,
       price_six_month = 0,
       price_yearly = 0,
       updated_at = now()
 where code = 'free';

update public.plans
   set max_properties = 3,
       price_monthly = 499,
       price_six_month = 2499,
       price_yearly = 4999,
       features = array[
         '3 property listings',
         '5 photos per property',
         'Rich details and amenities',
         'Priority placement',
         'Direct contact links'
       ],
       updated_at = now()
 where code = 'premium';

-- Existing rows keep their ids, ownership, billing cycles, expiry timestamps
-- and payment history. plan_limit_for() reads plans.max_properties, so the new
-- limits take effect for free and premium owners without rewriting any
-- subscription or property rows. Super Admin bypass, the owner match check and
-- the per-owner FOR UPDATE lock in enforce_property_limit() remain unchanged.
