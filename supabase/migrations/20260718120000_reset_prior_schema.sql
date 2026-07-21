-- =============================================================================
-- Phase 2 · Migration 1 — Reset prior scaffold
-- -----------------------------------------------------------------------------
-- The project carried an earlier, unrelated scaffold whose shape conflicts with
-- the CakeCraft Studio technical plan (3-value role enum, non-tenant-scoped
-- customers, mismatched table names, missing 9 core tables). Every prior table
-- had 0 rows, so nothing of value is dropped here.
--
-- Intentionally PRESERVED:
--   * Supabase-managed event triggers (pgrst_*, issue_pg_*, graphql).
--   * public.rls_auto_enable() + the `ensure_rls` event trigger — a helpful
--     defense-in-depth guard that auto-enables RLS on any new public table.
-- =============================================================================

-- Auth signup trigger from the old schema (recreated in migration 3).
drop trigger if exists on_auth_user_created on auth.users;

-- Prior application tables (CASCADE also removes their policies, triggers, FKs).
drop table if exists public.design_templates cascade;
drop table if exists public.trend_reports cascade;
drop table if exists public.bakery_locations cascade;
drop table if exists public.bakery_gallery_images cascade;
drop table if exists public.order_messages cascade;
drop table if exists public.orders cascade;
drop table if exists public.cake_designs cascade;
drop table if exists public.bakery_menu_items cascade;
drop table if exists public.bakeries cascade;
drop table if exists public.users cascade;

-- Prior trigger / utility functions belonging to the old schema.
drop function if exists public.handle_new_user() cascade;
drop function if exists public.prevent_role_change() cascade;
drop function if exists public.enforce_order_status_transition() cascade;

-- Prior enums (unused once their tables are gone).
drop type if exists public.order_status cascade;
drop type if exists public.subscription_plan cascade;
drop type if exists public.user_role cascade;
