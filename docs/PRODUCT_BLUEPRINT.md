# CakeCraft — Multi-Tenant Cake Ordering & 3D Design Platform
## Complete Product & Technical Blueprint (v1.0)

> This document is the **single source of truth** for the product. Update it
> first (add occasions/shapes/features here), then build against it.

---

## 1. The Core Idea
A SaaS product sold to bakers, with three front doors:

| Side | Who | Access |
|---|---|---|
| Customer Storefront | Anyone, anywhere | Public, unauthenticated browsing |
| Baker Console | The baker who owns that store | Private login, only they see it |
| Owner Console (yours) | You | Super-admin — creates bakers, billing/licenses |

3-role, multi-tenant architecture. Each baker = an isolated **tenant**
(`bakery_id` on almost every table), all running one shared codebase.
New baker = new DB row + subdomain, **not** a new server.

## 2. The Three Roles
- **🧁 Customer** (public, no login to browse): browse occasions/shapes/trending,
  build a cake in the 3D configurator, upload a reference photo + note, place &
  track orders. Optional account for history.
- **👩‍🍳 Baker** (tenant admin, private login): sees only their own orders/catalog/
  customers; accepts/rejects/quotes orders (esp. reference-photo customs); sets
  pricing per size/flavor/tier; sets availability (blackout dates, lead time,
  max/day); manages storefront branding; views analytics.
- **🏢 Owner / Super-Admin** (you): onboards bakers (tenant + subdomain like
  `mariascakes.cakecraft.app`), manages subscription billing, can suspend a
  tenant; controls global content (master shape library, occasions, trending
  gallery); platform-wide analytics.

## 3. The 3D Part — Realistic Scope
- Not "4D" and not AI-generated photorealism. A **parametric 3D configurator**:
  pre-built base shapes; customer choices (size, tiers, colors, frosting,
  toppings, decor) applied in real time as material/color swaps + simple mesh
  attachments (topper, drip layer, sprinkles). Rotate/zoom/orbit feels premium.
  Same proven pattern as car/shoe configurators.
- **Not realistic (don't promise):** auto-generating a 3D model from an uploaded
  photo. Reference-photo orders go to the baker as image + text; baker quotes
  manually (this is how real bakeries already work).
- **Tech:** Three.js via react-three-fiber + @react-three/drei (OrbitControls,
  Environment lighting).

## 4. Feature Map
### A. Occasions (global library, data-driven table — never hardcoded)
Life events (birthdays incl. milestones, weddings, engagements, showers, gender
reveals, christenings, graduations, retirement, housewarming, new job, farewell,
divorce/breakup, sobriety, pet, get well, congrats, apology, proposal, …);
Cultural & religious (Quinceañera, Bar/Bat Mitzvah, Diwali, Holi, Eid al-Fitr/
Adha, Lunar New Year, Hanukkah, Nowruz, Kwanzaa, Day of the Dead, …);
Public/seasonal (Valentine's, Mother's/Father's, Christmas, NYE, Easter,
Halloween, Thanksgiving, Independence Day localized, …); Corporate (company
anniversary, product launch, office party, client appreciation, "just because").

### B. Cake Shapes & Styles (base 3D model library)
- **Structural (parametric):** Round (single/multi-tier), Square/Rectangle,
  Heart, Number 0–9, Letter A–Z, Sheet, Dome, Hexagon, Oval, Ring/Bundt, Star,
  Cloud, Diamond, Cylinder/Barrel, Pillow, Gift-box, Book.
- **Assembled/display (layout):** Cupcake tower, Bento, Tiered pyramid, Macaron
  tower, Cake-pop display, Croquembouche.
- **Finish/texture (material on any shape):** Naked/semi-naked, Drip, Ombre,
  Marble, Rosette/ruffle, Basketweave, Geode, Mirror glaze, Fault-line, Floral
  wrap, Photo-print.
- **Sculpted/novelty (curated gallery, via reference-photo flow):** Car, animal,
  cartoon, topsy-turvy, gravity-defying, custom sculptures.

### C. Customization (configurator)
Flavor (Vanilla, Chocolate, Red Velvet, Lemon, Carrot, Marble, Funfetti, Black
Forest, Coffee, Pistachio, Fruit, Gluten-free/Vegan flagged); **Size by serving
count** (6/8/10" → "serves 10/20/40" — always show servings); Tiers 1–5 live in
3D; Frosting (Buttercream, Fondant, Ganache, Whipped, Naked); Color picker (live
3D); Toppings/decor (flowers, fruit, sprinkles, macarons, drip, gold leaf,
topper/text, photo print, figurines); Message text as a decal on the 3D preview.

### D. Reference Photo Flow (separate)
Upload photo(s) + note → baker dashboard "Custom Quote Request" → baker replies
price + notes → customer accepts → converts to real order + payment.

### E. Trending / Curated Designs Gallery
Curated platform-wide (by you) + bakers add signature designs. Each: photos,
description, "select as starting point" → pre-fills configurator, then tweak.

### F. Ordering & Checkout
Cart → delivery/pickup date & time (respect lead-time) → address or pickup →
payment (**Stripe Connect** for per-tenant payouts) → confirmation → live status
(Received → Confirmed → Baking → Ready → Delivered).

### G. Baker Dashboard
Orders inbox (reference-photo requests flagged for quoting), due-date calendar,
catalog/pricing editor, branding editor, analytics (revenue, top designs, volume).

### H. Owner (Super-Admin) Console
Tenant list, create/suspend tenant, subscription/billing per tenant, global
shape & occasion library, platform-wide trending curation.

## 5. Core Data Model
`Bakery(tenant)`: id, subdomain, name/logo/brand, subscription_status.
`User`: id, role (customer/baker/owner), bakery_id (null for customer/owner).
`Order`: id, bakery_id, customer_id, status, type (configured/reference/curated),
price, due_date, delivery/pickup, reference_photos[], note.
`CakeConfig`: id, order_id, shape_id, base_flavor, size, tiers, frosting_type,
color(s), toppings[], message_text, reference_curated_id.
`Shape(global)`: id, name, model_url. `Occasion(global)`: id, name.
`TrendingDesign`: id, photos[], bakery_id (null = platform).
**Rule:** `bakery_id` on every tenant table, enforced at the query layer (RLS).

## 6. Tech Stack
Next.js (React) · Three.js + r3f + drei · Tailwind + Framer Motion · Supabase
(Postgres, auth, RLS, storage) · Stripe Connect · Vercel.

## 7. Animation System
- **Framer Motion** — UI micro-interactions & page/step transitions.
- **GSAP (ScrollTrigger)** — scroll storytelling, staggered card reveals.
- **Lottie** — small decorative baking icons (order-status timeline).
- **r3f/drei** — the cake: hero auto-rotate, smooth tier grow/shrink, topping
  "drop-on", live color/material cross-fade.
- Moments to animate (meaning, not everything): hero rotating cake; card hover
  + staggered scroll-in; topping drop / tier grow / color cross-fade;
  add-to-cart fly; **canvas-confetti** on order placed; animated status timeline;
  soft cross-fade + slide between wizard steps; skeleton shimmer loaders.
- **Constraint:** every animation < ~400ms, ease-out. Slower feels sluggish.
- **Look & feel:** one elegant **display serif** for headings, clean sans-serif
  for body; warm palette — **blush, cream, gold** — not harsh primaries.

## 8. Build Roadmap
- **Phase 1 (MVP):** single baker, full customer storefront, 3D configurator
  (3–4 shapes), occasions, reference-photo flow, Stripe checkout, baker order
  dashboard. Goal: first real baker live.
- **Phase 2:** multi-tenant (subdomain per baker, owner console, subscription
  billing), trending gallery, expanded shapes.
- **Phase 3:** analytics, branding customization, mobile wrapper, reviews.

## 9 & 10. Working method
Feed this doc up front; build **Phase 1 only**, one step at a time, testing each
before moving on. Order: scaffold → static occasions/shapes browsing → one 3D
shape (color+rotate) → remaining shapes + toppings/frosting → reference-photo
flow → cart + Stripe checkout → baker dashboard → animations last → then
multi-tenant/owner/billing. Say "this works, next step" between each. Keep this
document as the living contract.
