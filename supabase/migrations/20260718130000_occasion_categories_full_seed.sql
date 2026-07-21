-- =============================================================================
-- Phase 3 · Migration 8 — Occasion library: categories + full worldwide seed
-- -----------------------------------------------------------------------------
-- Adds a `category` to occasion_library and seeds the full worldwide catalogue
-- grouped by category (Universal, Christian/Western, Islamic, South Asian,
-- Jewish, East Asian, Persian, Latin American, African, National Days,
-- Corporate, Style-driven). Bakeries enable/disable whole categories or single
-- occasions via bakery_occasions. Idempotent upsert on slug.
-- =============================================================================

alter table public.occasion_library
  add column if not exists category text not null default 'Universal';

create index if not exists occasion_library_category_idx on public.occasion_library (category);

insert into public.occasion_library (name, slug, category, description, icon, default_enabled, sort_order) values
  -- Universal
  ('Birthday','birthday','Universal','Birthday celebrations of all ages.','cake',true,10),
  ('Wedding','wedding','Universal','Weddings and receptions.','heart',true,11),
  ('Anniversary','anniversary','Universal','Anniversaries and milestones.','heart',true,12),
  ('Engagement','engagement','Universal','Engagements and proposals.','gem',true,13),
  ('Baby Shower','baby-shower','Universal','Baby showers.','baby',true,14),
  ('Gender Reveal','gender-reveal','Universal','Gender reveal parties.','baby',false,15),
  ('Graduation','graduation','Universal','Graduations and academic achievements.','graduation-cap',true,16),
  ('Retirement','retirement','Universal','Retirement send-offs.','party-popper',false,17),
  ('Housewarming','housewarming','Universal','New home celebrations.','home',false,18),
  ('Get Well Soon','get-well-soon','Universal','Get-well and recovery wishes.','heart-pulse',false,19),
  ('Congratulations','congratulations','Universal','General congratulations.','trophy',true,20),
  ('Farewell','farewell','Universal','Farewell and goodbye parties.','hand',false,21),
  ('Promotion','promotion','Universal','Job promotions.','trending-up',false,22),
  ('Bridal Shower','bridal-shower','Universal','Bridal showers.','flower',false,23),
  ('Bachelor Party','bachelor-party','Universal','Bachelor parties.','glass-water',false,24),
  ('Bachelorette Party','bachelorette-party','Universal','Bachelorette parties.','glass-water',false,25),

  -- Christian / Western
  ('Christmas','christmas','Christian / Western','Christmas celebrations.','tree-pine',true,40),
  ('Easter','easter','Christian / Western','Easter celebrations.','egg',false,41),
  ('Valentine''s Day','valentines-day','Christian / Western','Valentine''s Day.','heart',true,42),
  ('New Year','new-year','Christian / Western','New Year''s Eve and Day.','party-popper',true,43),
  ('Halloween','halloween','Christian / Western','Halloween.','ghost',false,44),
  ('Thanksgiving','thanksgiving','Christian / Western','Thanksgiving.','drumstick',false,45),
  ('Baptism / Christening','baptism','Christian / Western','Baptisms and christenings.','droplet',false,46),
  ('First Communion','first-communion','Christian / Western','First Holy Communion.','church',false,47),
  ('Confirmation','confirmation','Christian / Western','Confirmation.','church',false,48),

  -- Islamic
  ('Eid al-Fitr','eid-al-fitr','Islamic','Eid al-Fitr.','moon',true,60),
  ('Eid al-Adha','eid-al-adha','Islamic','Eid al-Adha.','moon',true,61),
  ('Ramadan','ramadan','Islamic','Ramadan and Iftar gatherings.','moon',false,62),
  ('Mawlid','mawlid','Islamic','Mawlid al-Nabi.','moon',false,63),
  ('Aqiqah','aqiqah','Islamic','Aqiqah (newborn celebration).','baby',false,64),
  ('Nikah / Walima','nikah-walima','Islamic','Nikah and Walima.','heart',false,65),
  ('Bismillah Ceremony','bismillah','Islamic','Bismillah ceremony.','book-open',false,66),

  -- South Asian
  ('Diwali','diwali','South Asian','Diwali, the festival of lights.','flame',true,80),
  ('Holi','holi','South Asian','Holi, the festival of colours.','palette',false,81),
  ('Raksha Bandhan','raksha-bandhan','South Asian','Raksha Bandhan.','heart',false,82),
  ('Karva Chauth','karva-chauth','South Asian','Karva Chauth.','moon',false,83),
  ('Navratri','navratri','South Asian','Navratri.','sparkles',false,84),
  ('Ganesh Chaturthi','ganesh-chaturthi','South Asian','Ganesh Chaturthi.','sparkles',false,85),
  ('Mehndi','mehndi','South Asian','Mehndi celebrations.','hand',false,86),
  ('Pongal','pongal','South Asian','Pongal harvest festival.','sun',false,87),
  ('Baisakhi','baisakhi','South Asian','Baisakhi.','wheat',false,88),

  -- Jewish
  ('Hanukkah','hanukkah','Jewish','Hanukkah.','flame',false,100),
  ('Rosh Hashanah','rosh-hashanah','Jewish','Jewish New Year.','apple',false,101),
  ('Passover','passover','Jewish','Passover / Pesach.','wine',false,102),
  ('Bar Mitzvah','bar-mitzvah','Jewish','Bar Mitzvah.','star',false,103),
  ('Bat Mitzvah','bat-mitzvah','Jewish','Bat Mitzvah.','star',false,104),
  ('Brit Milah','brit-milah','Jewish','Brit Milah.','baby',false,105),
  ('Purim','purim','Jewish','Purim.','drama',false,106),

  -- East Asian
  ('Chinese New Year','chinese-new-year','East Asian','Lunar New Year (Chinese).','sparkles',true,120),
  ('Korean New Year','korean-new-year','East Asian','Seollal (Korean New Year).','sparkles',false,121),
  ('Mid-Autumn Festival','mid-autumn','East Asian','Mid-Autumn / Mooncake Festival.','moon',false,122),
  ('Doljanchi','doljanchi','East Asian','Korean first-birthday (Dol).','baby',false,123),
  ('Chuseok','chuseok','East Asian','Korean harvest festival.','moon',false,124),
  ('Qixi Festival','qixi','East Asian','Chinese Valentine''s Day.','heart',false,125),

  -- Persian
  ('Nowruz','nowruz','Persian','Persian New Year.','flower',false,140),
  ('Yalda Night','yalda','Persian','Yalda (winter solstice).','moon',false,141),
  ('Sizdah Bedar','sizdah-bedar','Persian','Nature''s day.','leaf',false,142),
  ('Mehregan','mehregan','Persian','Festival of autumn.','sun',false,143),

  -- Latin American
  ('Quinceanera','quinceanera','Latin American','15th-birthday celebration.','crown',false,160),
  ('Dia de los Muertos','dia-de-los-muertos','Latin American','Day of the Dead.','skull',false,161),
  ('Las Posadas','las-posadas','Latin American','Christmas season celebration.','candle',false,162),
  ('Carnaval','carnaval','Latin American','Carnival.','drama',false,163),
  ('Three Kings Day','three-kings-day','Latin American','Epiphany / Reyes.','crown',false,164),

  -- African
  ('Kwanzaa','kwanzaa','African','Kwanzaa.','candle',false,180),
  ('Naming Ceremony','naming-ceremony','African','Traditional naming ceremony.','baby',false,181),
  ('Traditional Wedding','traditional-wedding','African','Traditional wedding.','heart',false,182),

  -- National Days
  ('Independence Day','independence-day','National Days','National independence celebrations.','flag',false,200),
  ('National Day','national-day','National Days','National day.','flag',false,201),
  ('Labor Day','labor-day','National Days','Labor / workers'' day.','briefcase',false,202),
  ('Mother''s Day','mothers-day','National Days','Mother''s Day.','flower',true,203),
  ('Father''s Day','fathers-day','National Days','Father''s Day.','user',true,204),
  ('Teacher''s Day','teachers-day','National Days','Teacher''s Day.','book-open',false,205),
  ('Republic Day','republic-day','National Days','Republic Day.','flag',false,206),

  -- Corporate
  ('Corporate Event','corporate-event','Corporate','Corporate and office events.','building-2',false,220),
  ('Product Launch','product-launch','Corporate','Product launches.','rocket',false,221),
  ('Company Anniversary','company-anniversary','Corporate','Company anniversaries.','building-2',false,222),
  ('Team Celebration','team-celebration','Corporate','Team milestones.','users',false,223),
  ('Grand Opening','grand-opening','Corporate','Grand openings.','scissors',false,224),
  ('Employee Appreciation','employee-appreciation','Corporate','Employee appreciation.','award',false,225),
  ('Conference','conference','Corporate','Conferences and summits.','presentation',false,226),

  -- Style-driven
  ('Minimalist','style-minimalist','Style-driven','Clean, minimalist designs.','minus',false,240),
  ('Floral','style-floral','Style-driven','Floral designs.','flower',false,241),
  ('Drip Cake','style-drip','Style-driven','Drip cakes.','droplet',false,242),
  ('Fondant Sculpted','style-fondant','Style-driven','Sculpted fondant cakes.','shapes',false,243),
  ('Number / Letter','style-number-letter','Style-driven','Number and letter cakes.','hash',false,244),
  ('Photo Cake','style-photo','Style-driven','Edible-photo cakes.','image',false,245),
  ('Naked Cake','style-naked','Style-driven','Naked / semi-naked cakes.','layers',false,246),
  ('Buttercream Art','style-buttercream','Style-driven','Buttercream painting.','palette',false,247),
  ('Themed / Character','style-themed','Style-driven','Themed and character cakes.','drama',false,248),
  ('Tiered Celebration','style-tiered','Style-driven','Multi-tier celebration cakes.','layers',false,249)
on conflict (slug) do update set
  name = excluded.name,
  category = excluded.category,
  description = excluded.description,
  icon = excluded.icon,
  default_enabled = excluded.default_enabled,
  sort_order = excluded.sort_order,
  is_active = true;
