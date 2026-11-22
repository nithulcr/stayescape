create or replace function public.get_owner_entitlement(p_owner_id uuid)
returns jsonb
language plpgsql
security definer
stable
set search_path = ''
as $$
declare
  v_profile public.profiles%rowtype;
  v_subscription public.subscriptions%rowtype;
  v_plan public.plans%rowtype;
  v_admin_bypass boolean := false;
  v_has_premium boolean := false;
  v_is_expired boolean := false;
  v_effective_status text := 'free';
  v_plan_code text := 'free';
  v_plan_name text := 'Free';
  v_published_count integer := 0;
  v_published_limit integer := 1;
  v_image_limit integer := 1;
  v_free_image_limit integer := 1;
  v_days_remaining integer;
  v_entitlement text := 'free';
begin
  if auth.uid() is distinct from p_owner_id
     and not public.is_admin()
     and not public.is_service_role() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  select * into v_profile from public.profiles where id = p_owner_id;
  if not found then
    return null;
  end if;

  select pl.max_images_per_property into v_free_image_limit
  from public.plans pl
  where pl.code = 'free';

  v_admin_bypass := v_profile.role = 'super_admin' and v_profile.account_status = 'active';

  select s.* into v_subscription
  from public.subscriptions s
  where s.owner_id = p_owner_id
  order by s.created_at desc, s.id desc
  limit 1;

  if found then
    select pl.* into v_plan from public.plans pl where pl.id = v_subscription.plan_id;
    v_plan_code := v_plan.code::text;
    v_plan_name := v_plan.name;

    if v_plan_code = 'premium' then
      if v_subscription.expires_at is null or v_subscription.expires_at > now() then
        v_has_premium := v_subscription.status = 'active';
      else
        v_is_expired := true;
      end if;

      if v_subscription.status = 'cancelled' then
        v_effective_status := 'cancelled';
      elsif v_is_expired then
        v_effective_status := 'expired';
      else
        v_effective_status := v_subscription.status::text;
      end if;
    end if;
  end if;

  if v_admin_bypass then
    v_has_premium := true;
    v_is_expired := false;
    v_effective_status := 'active';
    v_plan_code := 'premium';
    v_plan_name := coalesce(v_plan.name, 'Premium');
    v_entitlement := 'admin_bypass';
    v_image_limit := 1000000;
  elsif v_has_premium then
    v_entitlement := 'paid';
    v_image_limit := coalesce(v_plan.max_images_per_property, v_free_image_limit, 1);
  else
    v_image_limit := coalesce(v_free_image_limit, 1);
  end if;

  v_published_limit := public.plan_limit_for(p_owner_id, 'max_properties');

  select count(*) into v_published_count
  from public.properties p
  where p.owner_id = p_owner_id
    and p.status = 'approved'
    and p.is_published;

  if v_has_premium and v_subscription.expires_at is not null then
    v_days_remaining := greatest(0, ceil(extract(epoch from (v_subscription.expires_at - now())) / 86400)::integer);
  end if;

  return jsonb_build_object(
    'owner_id', p_owner_id,
    'status', v_effective_status,
    'plan_code', v_plan_code,
    'plan_name', v_plan_name,
    'has_premium', v_has_premium,
    'is_active', v_has_premium,
    'is_expired', v_is_expired,
    'is_unlimited', v_admin_bypass,
    'entitlement', v_entitlement,
    'subscription_id', v_subscription.id,
    'expires_at', v_subscription.expires_at,
    'days_remaining', v_days_remaining,
    'billing_cycle', v_subscription.billing_cycle::text,
    'max_properties', v_published_limit,
    'published_limit', v_published_limit,
    'published_count', v_published_count,
    'needs_property_selection', (not v_admin_bypass and not v_has_premium and v_published_count > v_published_limit),
    'max_images_per_property', v_image_limit,
    'price_monthly', coalesce(v_plan.price_monthly, 0),
    'price_six_month', coalesce(v_plan.price_six_month, 0),
    'price_yearly', coalesce(v_plan.price_yearly, 0),
    'features', coalesce(v_plan.features, array[]::text[]),
    'expired_listing_visibility', coalesce(v_plan.expired_listing_visibility, 'keep_visible')
  );
end;
$$;
