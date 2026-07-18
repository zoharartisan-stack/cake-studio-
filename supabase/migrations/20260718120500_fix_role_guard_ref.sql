-- =============================================================================
-- Phase 2 · Migration 6 — Fix prevent_role_escalation() helper reference
-- -----------------------------------------------------------------------------
-- Migration 5 relocated the isolation helpers from public.* to private.*, but
-- the prevent_role_escalation() trigger function still called the old
-- public.is_platform_admin(), which no longer exists. Repoint it at
-- private.is_platform_admin().
-- =============================================================================

create or replace function public.prevent_role_escalation()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.role is distinct from old.role and not private.is_platform_admin() then
    raise exception 'Only platform admins can change user roles';
  end if;
  return new;
end;
$$;

revoke all on function public.prevent_role_escalation() from public, anon, authenticated;
