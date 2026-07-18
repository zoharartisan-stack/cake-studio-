-- =============================================================================
-- Phase 2 · Migration 5 — Harden function exposure (advisor follow-up)
-- -----------------------------------------------------------------------------
-- Two fixes flagged by the Supabase security advisor:
--   1. set_updated_at() had a mutable search_path.
--   2. SECURITY DEFINER functions were reachable as PostgREST RPC endpoints.
--
-- The RLS helpers MUST stay SECURITY DEFINER (they read tenant tables that RLS
-- itself gates — invoker mode would recurse). To keep them un-exposed we move
-- them into a dedicated `private` schema, which PostgREST does not serve, while
-- RLS policies (evaluated in-database) can still call them. Trigger/event
-- functions never need API access, so we revoke EXECUTE from the API roles.
-- =============================================================================

-- ----- 1. Lock down trigger / event-trigger functions ------------------------
alter function public.set_updated_at() set search_path = '';
revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.prevent_role_escalation() from public, anon, authenticated;
revoke all on function public.rls_auto_enable() from public, anon, authenticated;

-- ----- 2. Private schema for the RLS isolation helpers -----------------------
create schema if not exists private;
grant usage on schema private to anon, authenticated, service_role;

-- Drop every existing public policy so the helper functions can be replaced.
-- (All are recreated below, identical except they call private.* helpers.)
do $$
declare r record;
begin
  for r in select policyname, tablename from pg_policies where schemaname = 'public'
  loop
    execute format('drop policy %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

drop function if exists public.is_platform_admin();
drop function if exists public.is_bakery_member(uuid);
drop function if exists public.is_bakery_owner(uuid);
drop function if exists public.is_active_bakery(uuid);
drop function if exists public.current_end_customer_id(uuid);
drop function if exists public.owns_order(uuid, uuid);

create function private.is_platform_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.users u
    where u.id = (select auth.uid()) and u.role = 'platform_admin'
  );
$$;

create function private.is_bakery_member(b_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.bakery_staff s
    where s.user_id = (select auth.uid()) and s.bakery_id = b_id
  );
$$;

create function private.is_bakery_owner(b_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.bakery_staff s
    where s.user_id = (select auth.uid()) and s.bakery_id = b_id and s.role = 'bakery_owner'
  );
$$;

create function private.is_active_bakery(b_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.bakeries b where b.id = b_id and b.status = 'active'
  );
$$;

create function private.current_end_customer_id(b_id uuid)
returns uuid language sql stable security definer set search_path = '' as $$
  select ec.id from public.end_customer_profiles ec
  where ec.user_id = (select auth.uid()) and ec.bakery_id = b_id
  limit 1;
$$;

create function private.owns_order(o_id uuid, b_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.orders o
    where o.id = o_id
      and o.end_customer_id = private.current_end_customer_id(b_id)
  );
$$;

-- API roles may execute the helpers (needed for in-policy evaluation) but the
-- functions live outside the exposed schema, so they are not RPC-reachable.
revoke execute on all functions in schema private from public;
grant execute on function private.is_platform_admin() to anon, authenticated, service_role;
grant execute on function private.is_bakery_member(uuid) to anon, authenticated, service_role;
grant execute on function private.is_bakery_owner(uuid) to anon, authenticated, service_role;
grant execute on function private.is_active_bakery(uuid) to anon, authenticated, service_role;
grant execute on function private.current_end_customer_id(uuid) to anon, authenticated, service_role;
grant execute on function private.owns_order(uuid, uuid) to anon, authenticated, service_role;

-- =============================================================================
-- Recreate all policies (identical logic; helpers now private.*)
-- =============================================================================

-- users
create policy users_select_self on public.users
  for select using (id = (select auth.uid()));
create policy users_insert_self on public.users
  for insert with check (id = (select auth.uid()));
create policy users_update_self on public.users
  for update using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy users_platform_admin on public.users
  for all using (private.is_platform_admin()) with check (private.is_platform_admin());

-- bakeries
create policy bakeries_select_public on public.bakeries
  for select using (status = 'active' or private.is_bakery_member(id));
create policy bakeries_insert_owner on public.bakeries
  for insert with check (owner_id = (select auth.uid()));
create policy bakeries_update_owner on public.bakeries
  for update using (private.is_bakery_owner(id)) with check (private.is_bakery_owner(id));
create policy bakeries_platform_admin on public.bakeries
  for all using (private.is_platform_admin()) with check (private.is_platform_admin());

-- bakery_staff
create policy bakery_staff_select on public.bakery_staff
  for select using (private.is_bakery_member(bakery_id));
create policy bakery_staff_insert on public.bakery_staff
  for insert with check (
    private.is_bakery_owner(bakery_id)
    or (
      user_id = (select auth.uid())
      and role = 'bakery_owner'
      and exists (select 1 from public.bakeries b where b.id = bakery_id and b.owner_id = (select auth.uid()))
    )
  );
create policy bakery_staff_update on public.bakery_staff
  for update using (private.is_bakery_owner(bakery_id)) with check (private.is_bakery_owner(bakery_id));
create policy bakery_staff_delete on public.bakery_staff
  for delete using (private.is_bakery_owner(bakery_id));
create policy bakery_staff_platform_admin on public.bakery_staff
  for all using (private.is_platform_admin()) with check (private.is_platform_admin());

-- end_customer_profiles
create policy ecp_select on public.end_customer_profiles
  for select using (user_id = (select auth.uid()) or private.is_bakery_member(bakery_id));
create policy ecp_insert on public.end_customer_profiles
  for insert with check (
    (user_id = (select auth.uid()) and private.is_active_bakery(bakery_id))
    or private.is_bakery_member(bakery_id)
  );
create policy ecp_update on public.end_customer_profiles
  for update using (user_id = (select auth.uid()) or private.is_bakery_member(bakery_id))
  with check (user_id = (select auth.uid()) or private.is_bakery_member(bakery_id));
create policy ecp_delete on public.end_customer_profiles
  for delete using (user_id = (select auth.uid()));
create policy ecp_platform_admin on public.end_customer_profiles
  for all using (private.is_platform_admin()) with check (private.is_platform_admin());

-- occasion_library (global)
create policy occasion_library_select on public.occasion_library
  for select using (is_active = true);
create policy occasion_library_platform_admin on public.occasion_library
  for all using (private.is_platform_admin()) with check (private.is_platform_admin());

-- bakery_occasions
create policy bakery_occasions_select on public.bakery_occasions
  for select using (
    private.is_bakery_member(bakery_id)
    or (is_enabled and private.is_active_bakery(bakery_id))
  );
create policy bakery_occasions_write on public.bakery_occasions
  for all using (private.is_bakery_member(bakery_id)) with check (private.is_bakery_member(bakery_id));
create policy bakery_occasions_platform_admin on public.bakery_occasions
  for all using (private.is_platform_admin()) with check (private.is_platform_admin());

-- menu_items
create policy menu_items_select on public.menu_items
  for select using (
    private.is_bakery_member(bakery_id)
    or (is_available and private.is_active_bakery(bakery_id))
  );
create policy menu_items_write on public.menu_items
  for all using (private.is_bakery_member(bakery_id)) with check (private.is_bakery_member(bakery_id));
create policy menu_items_platform_admin on public.menu_items
  for all using (private.is_platform_admin()) with check (private.is_platform_admin());

-- cake_templates
create policy cake_templates_select on public.cake_templates
  for select using (
    private.is_bakery_member(bakery_id)
    or (is_active and private.is_active_bakery(bakery_id))
  );
create policy cake_templates_write on public.cake_templates
  for all using (private.is_bakery_member(bakery_id)) with check (private.is_bakery_member(bakery_id));
create policy cake_templates_platform_admin on public.cake_templates
  for all using (private.is_platform_admin()) with check (private.is_platform_admin());

-- cake_designs
create policy cake_designs_select on public.cake_designs
  for select using (
    private.is_bakery_member(bakery_id)
    or end_customer_id = private.current_end_customer_id(bakery_id)
  );
create policy cake_designs_insert on public.cake_designs
  for insert with check (
    private.is_bakery_member(bakery_id)
    or end_customer_id = private.current_end_customer_id(bakery_id)
  );
create policy cake_designs_update on public.cake_designs
  for update using (
    private.is_bakery_member(bakery_id)
    or end_customer_id = private.current_end_customer_id(bakery_id)
  ) with check (
    private.is_bakery_member(bakery_id)
    or end_customer_id = private.current_end_customer_id(bakery_id)
  );
create policy cake_designs_delete on public.cake_designs
  for delete using (
    private.is_bakery_member(bakery_id)
    or end_customer_id = private.current_end_customer_id(bakery_id)
  );
create policy cake_designs_platform_admin on public.cake_designs
  for all using (private.is_platform_admin()) with check (private.is_platform_admin());

-- orders
create policy orders_select on public.orders
  for select using (
    private.is_bakery_member(bakery_id)
    or end_customer_id = private.current_end_customer_id(bakery_id)
  );
create policy orders_insert on public.orders
  for insert with check (
    private.is_bakery_member(bakery_id)
    or end_customer_id = private.current_end_customer_id(bakery_id)
  );
create policy orders_update_staff on public.orders
  for update using (private.is_bakery_member(bakery_id)) with check (private.is_bakery_member(bakery_id));
create policy orders_platform_admin on public.orders
  for all using (private.is_platform_admin()) with check (private.is_platform_admin());

-- order_status_history
create policy osh_select on public.order_status_history
  for select using (
    private.is_bakery_member(bakery_id)
    or private.owns_order(order_id, bakery_id)
  );
create policy osh_insert_staff on public.order_status_history
  for insert with check (private.is_bakery_member(bakery_id));
create policy osh_platform_admin on public.order_status_history
  for all using (private.is_platform_admin()) with check (private.is_platform_admin());

-- messages
create policy messages_select on public.messages
  for select using (
    private.is_bakery_member(bakery_id)
    or (order_id is not null and private.owns_order(order_id, bakery_id))
  );
create policy messages_insert on public.messages
  for insert with check (
    private.is_bakery_member(bakery_id)
    or (
      sender_id = (select auth.uid())
      and order_id is not null
      and private.owns_order(order_id, bakery_id)
    )
  );
create policy messages_update on public.messages
  for update using (private.is_bakery_member(bakery_id) or sender_id = (select auth.uid()))
  with check (private.is_bakery_member(bakery_id) or sender_id = (select auth.uid()));
create policy messages_platform_admin on public.messages
  for all using (private.is_platform_admin()) with check (private.is_platform_admin());

-- favorites
create policy favorites_select on public.favorites
  for select using (
    end_customer_id = private.current_end_customer_id(bakery_id)
    or private.is_bakery_member(bakery_id)
  );
create policy favorites_write on public.favorites
  for all using (end_customer_id = private.current_end_customer_id(bakery_id))
  with check (end_customer_id = private.current_end_customer_id(bakery_id));
create policy favorites_platform_admin on public.favorites
  for all using (private.is_platform_admin()) with check (private.is_platform_admin());

-- invoices
create policy invoices_select on public.invoices
  for select using (
    private.is_bakery_member(bakery_id)
    or end_customer_id = private.current_end_customer_id(bakery_id)
  );
create policy invoices_write_staff on public.invoices
  for all using (private.is_bakery_member(bakery_id)) with check (private.is_bakery_member(bakery_id));
create policy invoices_platform_admin on public.invoices
  for all using (private.is_platform_admin()) with check (private.is_platform_admin());

-- loyalty_transactions
create policy loyalty_select on public.loyalty_transactions
  for select using (
    end_customer_id = private.current_end_customer_id(bakery_id)
    or private.is_bakery_member(bakery_id)
  );
create policy loyalty_write_staff on public.loyalty_transactions
  for all using (private.is_bakery_member(bakery_id)) with check (private.is_bakery_member(bakery_id));
create policy loyalty_platform_admin on public.loyalty_transactions
  for all using (private.is_platform_admin()) with check (private.is_platform_admin());

-- bakery_subscriptions
create policy subscriptions_select on public.bakery_subscriptions
  for select using (private.is_bakery_member(bakery_id));
create policy subscriptions_platform_admin on public.bakery_subscriptions
  for all using (private.is_platform_admin()) with check (private.is_platform_admin());
