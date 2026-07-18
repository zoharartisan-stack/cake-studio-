-- =============================================================================
-- Phase 2 · Migration 3 — Auth provisioning + Row Level Security
-- -----------------------------------------------------------------------------
-- Tenant isolation is enforced HERE. Every tenant-owned table has RLS enabled
-- and policies that filter on `bakery_id` (via membership / ownership helpers),
-- so one bakery can never read or write another bakery's rows. A SEPARATE
-- `platform_admin` policy grants the platform admin broad access.
--
-- Isolation helpers are SECURITY DEFINER and owned by the table owner, so they
-- bypass RLS internally — this both prevents policy recursion and keeps the
-- checks correct regardless of the caller's own row visibility.
-- =============================================================================

-- ----- Isolation / role helper functions -------------------------------------
create or replace function public.is_platform_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.role = 'platform_admin'
  );
$$;

create or replace function public.is_bakery_member(b_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.bakery_staff s
    where s.user_id = auth.uid() and s.bakery_id = b_id
  );
$$;

create or replace function public.is_bakery_owner(b_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.bakery_staff s
    where s.user_id = auth.uid() and s.bakery_id = b_id and s.role = 'bakery_owner'
  );
$$;

create or replace function public.is_active_bakery(b_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.bakeries b where b.id = b_id and b.status = 'active'
  );
$$;

create or replace function public.current_end_customer_id(b_id uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select ec.id from public.end_customer_profiles ec
  where ec.user_id = auth.uid() and ec.bakery_id = b_id
  limit 1;
$$;

create or replace function public.owns_order(o_id uuid, b_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.orders o
    where o.id = o_id
      and o.end_customer_id = public.current_end_customer_id(b_id)
  );
$$;

-- ----- Auth provisioning: mirror auth.users -> public.users ------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----- Prevent role self-escalation ------------------------------------------
-- A user may update their own profile, but only a platform admin may change the
-- `role` column (closes a privilege-escalation hole in the users UPDATE policy).
create or replace function public.prevent_role_escalation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and not public.is_platform_admin() then
    raise exception 'Only platform admins can change user roles';
  end if;
  return new;
end;
$$;

create trigger users_prevent_role_escalation
  before update on public.users
  for each row execute function public.prevent_role_escalation();

-- =============================================================================
-- Enable RLS (explicit, even though `ensure_rls` also does so on create)
-- =============================================================================
alter table public.users                 enable row level security;
alter table public.bakeries               enable row level security;
alter table public.bakery_staff           enable row level security;
alter table public.end_customer_profiles  enable row level security;
alter table public.occasion_library       enable row level security;
alter table public.bakery_occasions       enable row level security;
alter table public.menu_items             enable row level security;
alter table public.cake_templates         enable row level security;
alter table public.cake_designs           enable row level security;
alter table public.orders                 enable row level security;
alter table public.order_status_history   enable row level security;
alter table public.messages               enable row level security;
alter table public.favorites              enable row level security;
alter table public.invoices               enable row level security;
alter table public.loyalty_transactions   enable row level security;
alter table public.bakery_subscriptions   enable row level security;

-- =============================================================================
-- Policies
-- Each tenant table gets bakery_id-scoped policies PLUS a separate
-- `*_platform_admin` policy (FOR ALL) so platform admins have broad access
-- through a distinct policy, as required.
-- =============================================================================

-- ----- users (global) --------------------------------------------------------
create policy users_select_self on public.users
  for select using (id = auth.uid());
create policy users_insert_self on public.users
  for insert with check (id = auth.uid());
create policy users_update_self on public.users
  for update using (id = auth.uid()) with check (id = auth.uid());
create policy users_platform_admin on public.users
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());

-- ----- bakeries (tenant root) ------------------------------------------------
-- Public may read ACTIVE bakeries (needed for tenant resolution + storefront).
create policy bakeries_select_public on public.bakeries
  for select using (status = 'active' or public.is_bakery_member(id));
-- A user may create a bakery they own; owners update; deletes are admin-only.
create policy bakeries_insert_owner on public.bakeries
  for insert with check (owner_id = auth.uid());
create policy bakeries_update_owner on public.bakeries
  for update using (public.is_bakery_owner(id)) with check (public.is_bakery_owner(id));
create policy bakeries_platform_admin on public.bakeries
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());

-- ----- bakery_staff ----------------------------------------------------------
create policy bakery_staff_select on public.bakery_staff
  for select using (public.is_bakery_member(bakery_id));
-- Owner adds staff; ALSO allow the bootstrapping self-insert as owner right
-- after a bakery is created (before any staff row exists).
create policy bakery_staff_insert on public.bakery_staff
  for insert with check (
    public.is_bakery_owner(bakery_id)
    or (
      user_id = auth.uid()
      and role = 'bakery_owner'
      and exists (select 1 from public.bakeries b where b.id = bakery_id and b.owner_id = auth.uid())
    )
  );
create policy bakery_staff_update on public.bakery_staff
  for update using (public.is_bakery_owner(bakery_id)) with check (public.is_bakery_owner(bakery_id));
create policy bakery_staff_delete on public.bakery_staff
  for delete using (public.is_bakery_owner(bakery_id));
create policy bakery_staff_platform_admin on public.bakery_staff
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());

-- ----- end_customer_profiles -------------------------------------------------
create policy ecp_select on public.end_customer_profiles
  for select using (user_id = auth.uid() or public.is_bakery_member(bakery_id));
create policy ecp_insert on public.end_customer_profiles
  for insert with check (
    (user_id = auth.uid() and public.is_active_bakery(bakery_id))
    or public.is_bakery_member(bakery_id)
  );
create policy ecp_update on public.end_customer_profiles
  for update using (user_id = auth.uid() or public.is_bakery_member(bakery_id))
  with check (user_id = auth.uid() or public.is_bakery_member(bakery_id));
create policy ecp_delete on public.end_customer_profiles
  for delete using (user_id = auth.uid());
create policy ecp_platform_admin on public.end_customer_profiles
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());

-- ----- occasion_library (global) ---------------------------------------------
create policy occasion_library_select on public.occasion_library
  for select using (is_active = true);
create policy occasion_library_platform_admin on public.occasion_library
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());

-- ----- bakery_occasions ------------------------------------------------------
create policy bakery_occasions_select on public.bakery_occasions
  for select using (
    public.is_bakery_member(bakery_id)
    or (is_enabled and public.is_active_bakery(bakery_id))
  );
create policy bakery_occasions_write on public.bakery_occasions
  for all using (public.is_bakery_member(bakery_id)) with check (public.is_bakery_member(bakery_id));
create policy bakery_occasions_platform_admin on public.bakery_occasions
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());

-- ----- menu_items ------------------------------------------------------------
create policy menu_items_select on public.menu_items
  for select using (
    public.is_bakery_member(bakery_id)
    or (is_available and public.is_active_bakery(bakery_id))
  );
create policy menu_items_write on public.menu_items
  for all using (public.is_bakery_member(bakery_id)) with check (public.is_bakery_member(bakery_id));
create policy menu_items_platform_admin on public.menu_items
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());

-- ----- cake_templates --------------------------------------------------------
create policy cake_templates_select on public.cake_templates
  for select using (
    public.is_bakery_member(bakery_id)
    or (is_active and public.is_active_bakery(bakery_id))
  );
create policy cake_templates_write on public.cake_templates
  for all using (public.is_bakery_member(bakery_id)) with check (public.is_bakery_member(bakery_id));
create policy cake_templates_platform_admin on public.cake_templates
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());

-- ----- cake_designs ----------------------------------------------------------
create policy cake_designs_select on public.cake_designs
  for select using (
    public.is_bakery_member(bakery_id)
    or end_customer_id = public.current_end_customer_id(bakery_id)
  );
create policy cake_designs_insert on public.cake_designs
  for insert with check (
    public.is_bakery_member(bakery_id)
    or end_customer_id = public.current_end_customer_id(bakery_id)
  );
create policy cake_designs_update on public.cake_designs
  for update using (
    public.is_bakery_member(bakery_id)
    or end_customer_id = public.current_end_customer_id(bakery_id)
  ) with check (
    public.is_bakery_member(bakery_id)
    or end_customer_id = public.current_end_customer_id(bakery_id)
  );
create policy cake_designs_delete on public.cake_designs
  for delete using (
    public.is_bakery_member(bakery_id)
    or end_customer_id = public.current_end_customer_id(bakery_id)
  );
create policy cake_designs_platform_admin on public.cake_designs
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());

-- ----- orders ----------------------------------------------------------------
-- Customers read + create their own orders; staff manage the bakery's orders.
-- (Totals are computed server-side; customers never update order money.)
create policy orders_select on public.orders
  for select using (
    public.is_bakery_member(bakery_id)
    or end_customer_id = public.current_end_customer_id(bakery_id)
  );
create policy orders_insert on public.orders
  for insert with check (
    public.is_bakery_member(bakery_id)
    or end_customer_id = public.current_end_customer_id(bakery_id)
  );
create policy orders_update_staff on public.orders
  for update using (public.is_bakery_member(bakery_id)) with check (public.is_bakery_member(bakery_id));
create policy orders_platform_admin on public.orders
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());

-- ----- order_status_history --------------------------------------------------
create policy osh_select on public.order_status_history
  for select using (
    public.is_bakery_member(bakery_id)
    or public.owns_order(order_id, bakery_id)
  );
create policy osh_insert_staff on public.order_status_history
  for insert with check (public.is_bakery_member(bakery_id));
create policy osh_platform_admin on public.order_status_history
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());

-- ----- messages --------------------------------------------------------------
create policy messages_select on public.messages
  for select using (
    public.is_bakery_member(bakery_id)
    or (order_id is not null and public.owns_order(order_id, bakery_id))
  );
create policy messages_insert on public.messages
  for insert with check (
    public.is_bakery_member(bakery_id)
    or (
      sender_id = auth.uid()
      and order_id is not null
      and public.owns_order(order_id, bakery_id)
    )
  );
create policy messages_update on public.messages
  for update using (public.is_bakery_member(bakery_id) or sender_id = auth.uid())
  with check (public.is_bakery_member(bakery_id) or sender_id = auth.uid());
create policy messages_platform_admin on public.messages
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());

-- ----- favorites -------------------------------------------------------------
create policy favorites_select on public.favorites
  for select using (
    end_customer_id = public.current_end_customer_id(bakery_id)
    or public.is_bakery_member(bakery_id)
  );
create policy favorites_write on public.favorites
  for all using (end_customer_id = public.current_end_customer_id(bakery_id))
  with check (end_customer_id = public.current_end_customer_id(bakery_id));
create policy favorites_platform_admin on public.favorites
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());

-- ----- invoices --------------------------------------------------------------
create policy invoices_select on public.invoices
  for select using (
    public.is_bakery_member(bakery_id)
    or end_customer_id = public.current_end_customer_id(bakery_id)
  );
create policy invoices_write_staff on public.invoices
  for all using (public.is_bakery_member(bakery_id)) with check (public.is_bakery_member(bakery_id));
create policy invoices_platform_admin on public.invoices
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());

-- ----- loyalty_transactions --------------------------------------------------
create policy loyalty_select on public.loyalty_transactions
  for select using (
    end_customer_id = public.current_end_customer_id(bakery_id)
    or public.is_bakery_member(bakery_id)
  );
create policy loyalty_write_staff on public.loyalty_transactions
  for all using (public.is_bakery_member(bakery_id)) with check (public.is_bakery_member(bakery_id));
create policy loyalty_platform_admin on public.loyalty_transactions
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());

-- ----- bakery_subscriptions --------------------------------------------------
-- Members read their own subscription; writes come from Stripe webhooks
-- (service role, which bypasses RLS) or a platform admin.
create policy subscriptions_select on public.bakery_subscriptions
  for select using (public.is_bakery_member(bakery_id));
create policy subscriptions_platform_admin on public.bakery_subscriptions
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());

-- =============================================================================
-- Role grants (privilege layer beneath RLS). anon = read-only public storefront
-- reads; authenticated = full CRUD gated by the policies above.
-- =============================================================================
grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to anon, authenticated;
grant insert, update, delete on all tables in schema public to authenticated;
grant execute on all functions in schema public to anon, authenticated;
