-- =============================================================================
-- Phase 5f — Guest order placement RPC
-- -----------------------------------------------------------------------------
-- Creates a cake design + order for a (guest) storefront customer. SECURITY
-- DEFINER because guests have no session (anonymous auth is disabled), so there
-- is no RLS identity to insert under. Safety is enforced INSIDE the function:
--   * writes ONLY to the bakery passed in, and only if it is ACTIVE;
--   * the total is RECOMPUTED here from that bakery's own available menu_items
--     (client-supplied prices are ignored entirely — only ids are used);
--   * it never reads or writes another tenant's private data.
-- The trusted caller is a server action that passes the proxy-resolved
-- bakery_id (not a client value). Cash-on-Delivery only for now.
--
-- NOTE: being a SECURITY DEFINER function reachable by `anon` (a deliberate
-- public "place order" endpoint), this intentionally shows one advisor notice.
-- =============================================================================

create or replace function public.place_order(
  p_bakery uuid,
  p_menu_ids uuid[],
  p_design_name text,
  p_config jsonb,
  p_fulfillment text,
  p_customer_name text,
  p_customer_phone text,
  p_address jsonb,
  p_delivery_date date,
  p_delivery_slot text,
  p_payment_method text
)
returns table (order_number text, total_minor int, currency text, locale text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_currency text;
  v_locale text;
  v_subtotal int := 0;
  v_design uuid;
  v_num text;
  v_ok boolean := false;
begin
  select b.currency, b.locale into v_currency, v_locale
  from public.bakeries b where b.id = p_bakery and b.status = 'active';
  if not found then
    raise exception 'BAKERY_NOT_ACTIVE';
  end if;
  if p_payment_method <> 'cash_on_delivery' then
    raise exception 'UNSUPPORTED_PAYMENT';
  end if;

  -- Authoritative price: only this bakery's available items, by id.
  select coalesce(sum(mi.price_minor), 0) into v_subtotal
  from public.menu_items mi
  where mi.bakery_id = p_bakery
    and mi.is_available
    and mi.id = any (coalesce(p_menu_ids, '{}'::uuid[]));

  insert into public.cake_designs (bakery_id, name, config, computed_price_minor, is_saved)
  values (p_bakery, coalesce(nullif(p_design_name, ''), 'Custom Cake'),
          coalesce(p_config, '{}'::jsonb), v_subtotal, true)
  returning id into v_design;

  for i in 1..5 loop
    begin
      v_num := 'ORD-' || upper(substr(md5(gen_random_uuid()::text), 1, 6));
      insert into public.orders (
        bakery_id, cake_design_id, order_number, status, fulfillment_type,
        delivery_address, delivery_date, delivery_slot, subtotal_minor, total_minor,
        currency, payment_method, payment_status, notes
      ) values (
        p_bakery, v_design, v_num, 'pending', p_fulfillment::public.fulfillment_type,
        p_address, p_delivery_date, nullif(p_delivery_slot, ''), v_subtotal, v_subtotal,
        v_currency, 'cash_on_delivery', 'unpaid',
        'Guest order — ' || coalesce(p_customer_name, '') ||
          case when p_customer_phone is not null and p_customer_phone <> ''
               then ' · ' || p_customer_phone else '' end
      );
      v_ok := true;
      exit;
    exception when unique_violation then
      if i = 5 then raise; end if;
    end;
  end loop;

  if not v_ok then raise exception 'ORDER_FAILED'; end if;
  return query select v_num, v_subtotal, v_currency, v_locale;
end;
$$;

grant execute on function public.place_order(
  uuid, uuid[], text, jsonb, text, text, text, jsonb, date, text, text
) to anon, authenticated;
