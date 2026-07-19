-- =============================================================================
-- Rebrand — default bakery brand colors → Raspberry (#A22A4E) + pink/wine.
-- Only changes the DEFAULTS applied to NEW bakeries; existing bakeries keep
-- their own chosen colors.
-- =============================================================================

alter table public.bakeries
  alter column primary_color   set default '#A22A4E',
  alter column secondary_color set default '#D45B77',
  alter column accent_color    set default '#351C27';
