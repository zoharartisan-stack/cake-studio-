-- =============================================================================
-- Phase 3 · Migration 9 — Logo storage bucket + onboarding subscription policy
-- =============================================================================

-- ----- Storage: public bakery-logos bucket -----------------------------------
-- Objects are keyed by bakery: `<bakery_id>/<filename>`. Public read (logos
-- appear on storefronts); writes restricted to members of that bakery.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'bakery-logos', 'bakery-logos', true, 2097152,
  array['image/png','image/jpeg','image/webp','image/svg+xml']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "bakery logos public read" on storage.objects;
drop policy if exists "bakery members insert logos" on storage.objects;
drop policy if exists "bakery members update logos" on storage.objects;
drop policy if exists "bakery members delete logos" on storage.objects;

create policy "bakery logos public read" on storage.objects
  for select using (bucket_id = 'bakery-logos');

create policy "bakery members insert logos" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'bakery-logos'
    and private.is_bakery_member(((storage.foldername(name))[1])::uuid)
  );

create policy "bakery members update logos" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'bakery-logos'
    and private.is_bakery_member(((storage.foldername(name))[1])::uuid)
  );

create policy "bakery members delete logos" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'bakery-logos'
    and private.is_bakery_member(((storage.foldername(name))[1])::uuid)
  );

-- ----- Onboarding: owner may create their own (trial) subscription row -------
-- Records the plan chosen at signup BEFORE Stripe billing exists. Constrained
-- to a trial with no Stripe ids; the real lifecycle is managed later by Stripe
-- webhooks via the service role. Updates remain admin/service-role only.
create policy subscriptions_insert_owner on public.bakery_subscriptions
  for insert to authenticated
  with check (
    private.is_bakery_owner(bakery_id)
    and status = 'trialing'
    and stripe_customer_id is null
    and stripe_subscription_id is null
  );
