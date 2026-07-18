-- =============================================================================
-- Phase 2 · Migration 7 — Refine the role-escalation guard
-- -----------------------------------------------------------------------------
-- The guard must stop an END USER from changing their own role via the API,
-- but must NOT block trusted server context (service_role / SQL admin), which
-- legitimately assigns roles during bakery-owner onboarding and when creating
-- the first platform admin. End-user requests always carry a JWT (auth.uid()
-- is non-null); trusted server/service-role context has no end-user JWT.
-- =============================================================================

create or replace function public.prevent_role_escalation()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null            -- an end-user request…
     and not private.is_platform_admin()   -- …who is not a platform admin
  then
    raise exception 'Only platform admins can change user roles';
  end if;
  return new;
end;
$$;

revoke all on function public.prevent_role_escalation() from public, anon, authenticated;
