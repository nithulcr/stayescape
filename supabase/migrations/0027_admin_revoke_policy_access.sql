create or replace function public.apply_expired_property_policy(p_owner_id uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
  v_property_count integer;
  v_batch_unpublished integer;
  v_unpublished_total integer := 0;
  v_expired_total integer := 0;
  v_owners_processed integer := 0;
begin
  if not public.is_service_role() and not public.is_admin() then
    raise exception 'Only administrators or background services can run the expiry policy' using errcode = '42501';
  end if;

  for v_owner in
    select candidate.owner_id
    from (
      select s.owner_id
      from public.subscriptions s
      where s.status = 'active'
        and s.expires_at is not null
        and s.expires_at <= now()
      union
      select p.owner_id
      from public.properties p
      group by p.owner_id
      having count(*) > 1
    ) candidate
    where p_owner_id is null or candidate.owner_id = p_owner_id
  loop
    v_owners_processed := v_owners_processed + 1;
    perform 1 from public.profiles p where p.id = v_owner for update;

    update public.subscriptions s
    set status = 'expired',
      updated_at = now()
    where s.owner_id = v_owner
      and s.status = 'active'
      and s.expires_at is not null
      and s.expires_at <= now();
    get diagnostics v_batch_unpublished = row_count;
    v_expired_total := v_expired_total + v_batch_unpublished;

    continue when public.has_active_premium(v_owner);

    select count(*)
    into v_property_count
    from public.properties p
    where p.owner_id = v_owner;

    if v_property_count > 1 then
      update public.properties p
      set is_published = false,
        publish_after_renewal = true
      where p.owner_id = v_owner
        and p.is_published
        and (
          p.status = 'approved'
          or (p.status = 'pending' and coalesce(p.has_requested_changes, false))
        );
      get diagnostics v_batch_unpublished = row_count;
      v_unpublished_total := v_unpublished_total + v_batch_unpublished;
    end if;
  end loop;

  return jsonb_build_object(
    'owners_processed', v_owners_processed,
    'subscriptions_expired', v_expired_total,
    'properties_unpublished', v_unpublished_total
  );
end;
$$;
