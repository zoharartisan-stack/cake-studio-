-- =============================================================================
-- Order tracking — public status lookup RPC
-- -----------------------------------------------------------------------------
-- Lets a (guest) customer track an order by its number on the storefront.
-- SECURITY DEFINER because guests have no session/RLS identity. Safety:
--   * scoped to the single (bakery_id, order_number) passed in;
--   * returns only non-sensitive status fields — NO customer name/phone/address
--     or internal notes;
--   * the order_number is a random 6-hex token (ORD-xxxxxx), not enumerable in
--     practice. The trusted caller passes the proxy-resolved bakery_id.
-- =============================================================================

create or replace function public.get_order_status(
  p_bakery uuid,
  p_order_number text
)
returns table (
  order_number text,
  status public.order_status,
  fulfillment_type public.fulfillment_type,
  delivery_date date,
  total_minor int,
  currency text,
  created_at timestamptz,
  design_name text
)
language sql
security definer
set search_path = ''
as $$
  select o.order_number, o.status, o.fulfillment_type, o.delivery_date,
         o.total_minor, o.currency, o.created_at,
         coalesce(d.name, 'Custom Cake') as design_name
  from public.orders o
  left join public.cake_designs d on d.id = o.cake_design_id
  where o.bakery_id = p_bakery
    and upper(o.order_number) = upper(trim(p_order_number))
  limit 1;
$$;

grant execute on function public.get_order_status(uuid, text) to anon, authenticated;
