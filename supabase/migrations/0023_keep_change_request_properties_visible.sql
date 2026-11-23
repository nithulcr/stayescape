create or replace function public.property_is_visible(p_property_id uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.properties pr
    left join public.plans pl on pl.code = pr.plan_type
    where pr.id = p_property_id
      and pr.is_published
      and (
        pr.status = 'approved'
        or (pr.status = 'pending' and coalesce(pr.has_requested_changes, false))
      )
      and (
        select count(*)
        from public.properties other
        where other.owner_id = pr.owner_id
          and other.is_published
          and (
            other.status = 'approved'
            or (other.status = 'pending' and coalesce(other.has_requested_changes, false))
          )
          and (
            other.created_at < pr.created_at
            or (other.created_at = pr.created_at and other.id < pr.id)
          )
      ) < public.plan_limit_for(pr.owner_id, 'max_properties')
      and (
        pr.plan_type = 'free'
        or coalesce(pl.expired_listing_visibility, 'keep_visible') = 'keep_visible'
        or public.has_active_premium(pr.owner_id)
      )
  );
$$;

create or replace function public.set_approval_metadata()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'approved' then
    new.approved_at := coalesce(new.approved_at, now());
    new.rejection_reason := null;
    new.has_requested_changes := false;
    new.change_requested_at := null;
  elsif new.status = 'rejected' then
    if tg_op = 'UPDATE' and old.status is distinct from 'rejected' then
      new.has_requested_changes := false;
      new.change_requested_at := null;
    end if;
    new.approved_at := null;
    new.is_published := false;
    new.publish_after_renewal := false;
  else
    new.approved_at := null;
    if tg_op = 'UPDATE' and coalesce(new.has_requested_changes, false) then
      new.is_published := old.is_published;
      new.publish_after_renewal := old.publish_after_renewal;
    else
      new.is_published := false;
      new.publish_after_renewal := false;
    end if;
  end if;
  return new;
end;
$$;

drop policy if exists "Anyone can enquire about published properties" on public.enquiries;
create policy "Anyone can enquire about published properties"
  on public.enquiries for insert
  with check (
    status = 'new'
    and exists (
      select 1 from public.properties p
      where p.id = property_id
        and (
          p.status = 'approved'
          or (
            p.status = 'pending'
            and coalesce(p.has_requested_changes, false)
            and p.is_published
          )
        )
    )
  );
