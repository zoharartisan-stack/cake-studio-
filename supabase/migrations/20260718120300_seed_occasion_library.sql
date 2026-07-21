-- =============================================================================
-- Phase 2 · Migration 4 — Seed the GLOBAL occasion library
-- -----------------------------------------------------------------------------
-- Broad, market-agnostic occasion catalogue. Each bakery enables/disables these
-- (and adds its own) via bakery_occasions. `default_enabled` marks the ones a
-- new bakery starts with switched on. Idempotent via ON CONFLICT (slug).
-- =============================================================================

insert into public.occasion_library (name, slug, description, icon, default_enabled, sort_order) values
  ('Birthday',        'birthday',        'Birthday celebrations of all ages.',        'cake',        true,  10),
  ('Wedding',         'wedding',         'Weddings and wedding receptions.',          'heart',       true,  20),
  ('Anniversary',     'anniversary',     'Anniversaries and milestones.',             'heart',       true,  30),
  ('Engagement',      'engagement',      'Engagements and proposals.',                'gem',         false, 40),
  ('Baby Shower',     'baby-shower',     'Baby showers and gender reveals.',          'baby',        false, 50),
  ('Graduation',      'graduation',      'Graduations and academic achievements.',    'graduation-cap', false, 60),
  ('Eid al-Fitr',     'eid-al-fitr',     'Eid al-Fitr celebrations.',                 'moon',        true,  70),
  ('Eid al-Adha',     'eid-al-adha',     'Eid al-Adha celebrations.',                 'moon',        true,  80),
  ('Ramadan',         'ramadan',         'Ramadan and Iftar gatherings.',             'moon',        false, 90),
  ('Korean New Year', 'korean-new-year', 'Seollal (Korean New Year).',                'sparkles',    false, 100),
  ('Chinese New Year','chinese-new-year','Lunar New Year celebrations.',              'sparkles',    false, 110),
  ('Diwali',          'diwali',          'Diwali, the festival of lights.',           'flame',       false, 120),
  ('Christmas',       'christmas',       'Christmas celebrations.',                   'tree-pine',   false, 130),
  ('New Year',        'new-year',        'New Year''s Eve and Day.',                  'party-popper',false, 140),
  ('Valentine''s Day','valentines-day',  'Valentine''s Day and romantic occasions.',  'heart',       false, 150),
  ('Mother''s Day',   'mothers-day',     'Mother''s Day appreciation.',               'flower',      true,  160),
  ('Father''s Day',   'fathers-day',     'Father''s Day appreciation.',               'user',        true,  170),
  ('Labor Day',       'labor-day',       'Labor Day and worker appreciation.',        'briefcase',   false, 180),
  ('New Car',         'new-car',         'Celebrating a new car.',                    'car',         false, 190),
  ('Housewarming',    'housewarming',    'New home celebrations.',                    'home',        false, 200),
  ('Retirement',      'retirement',      'Retirement send-offs.',                     'party-popper',false, 210),
  ('Congratulations', 'congratulations', 'General congratulations.',                  'trophy',      true,  220),
  ('Get Well Soon',   'get-well-soon',   'Get-well and recovery wishes.',             'heart-pulse', false, 230),
  ('Corporate Event', 'corporate-event', 'Corporate and office events.',              'building-2',  false, 240)
on conflict (slug) do nothing;
