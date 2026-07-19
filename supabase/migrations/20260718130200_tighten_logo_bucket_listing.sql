-- =============================================================================
-- Phase 3 · Migration 10 — Tighten logo bucket (advisor follow-up)
-- -----------------------------------------------------------------------------
-- `bakery-logos` is a PUBLIC bucket, so object URLs are served without any
-- storage.objects SELECT policy. The broad read policy only added the ability
-- to LIST/enumerate every file, which we don't want. Drop it; public logo URLs
-- keep working, write policies (scoped to bakery members) remain.
-- =============================================================================

drop policy if exists "bakery logos public read" on storage.objects;
