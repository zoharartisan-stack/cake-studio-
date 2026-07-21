-- =============================================================================
-- Phase 3 · Migration 11 — Atomic bakery provisioning function
-- -----------------------------------------------------------------------------
-- Onboarding creates a bakery + owner membership + starter menu + default
-- occasions + trial subscription. Doing this as ONE SECURITY INVOKER function
-- makes it atomic (all-or-nothing in a single transaction) and keeps RLS fully
-- in force: it runs as the calling user, so `owner_id = auth.uid()` and the
-- membership/ownership checks are all enforced exactly as for any other write.
-- (Invoker, not definer, so it is not an elevated RPC surface.)
-- =============================================================================

create or replace function public.provision_bakery(
  p_name text,
  p_slug text,
  p_plan public.subscription_tier,
  p_primary text,
  p_secondary text,
  p_accent text,
  p_city text,
  p_description text,
  p_menu jsonb
)
returns table (bakery_id uuid, bakery_slug text)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_bakery uuid;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  insert into public.bakeries
    (owner_id, name, slug, status, primary_color, secondary_color, accent_color, city, description)
  values
    (v_uid, p_name, lower(p_slug), 'active', p_primary, p_secondary, p_accent,
     nullif(p_city, ''), nullif(p_description, ''))
  returning id into v_bakery;

  insert into public.bakery_staff (bakery_id, user_id, role)
  values (v_bakery, v_uid, 'bakery_owner');

  insert into public.menu_items (bakery_id, category, name, price_minor, is_base_price, sort_order)
  select v_bakery,
         i->>'category',
         i->>'name',
         (i->>'price_minor')::int,
         (i->>'is_base_price')::boolean,
         (i->>'sort_order')::int
  from jsonb_array_elements(coalesce(p_menu, '[]'::jsonb)) as i;

  insert into public.bakery_occasions (bakery_id, occasion_id, is_enabled, sort_order)
  select v_bakery, o.id, true, o.sort_order
  from public.occasion_library o
  where o.default_enabled and o.is_active;

  insert into public.bakery_subscriptions (bakery_id, tier, status)
  values (v_bakery, p_plan, 'trialing');

  return query select v_bakery, lower(p_slug);
end;
$$;

grant execute on function public.provision_bakery(
  text, text, public.subscription_tier, text, text, text, text, text, jsonb
) to authenticated;
