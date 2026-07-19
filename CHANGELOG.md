# Changelog

All notable changes to CakeCraft Studio are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Phase 1 — Foundation Setup

Added

- Next.js (App Router) + React + TypeScript + Tailwind CSS v4 + ESLint project.
- Animation stack: Framer Motion, GSAP + ScrollTrigger, Lenis (smooth scroll),
  lottie-react, and Three.js / React Three Fiber / Drei.
  _(Intentionally not installed: Motion One — redundant with Framer Motion;
  Rive — needs the desktop editor, a future enhancement.)_
- Backend/utility deps: Supabase (`@supabase/supabase-js`, `@supabase/ssr`),
  Stripe (`stripe`, `@stripe/stripe-js`), Zod, React Hook Form
  (`@hookform/resolvers`), lucide-react, clsx + tailwind-merge.
- **Design system** in `globals.css` (`@theme`) mirrored in
  `config/design-tokens.ts`: full Cream / Gold / Rose / Chocolate color
  scales, typography, radii, warm shadows, and motion tokens (durations,
  easings, springs, keyframes). Global `prefers-reduced-motion` handling.
- Motion presets (`config/motion.ts`) and primitives: `SmoothScroll` (Lenis,
  reduced-motion aware), `Reveal` (scroll-triggered), `useReducedMotionSafe`.
- Design-system UI primitives: `Button`, `Card`, `Badge`, `Container`.
- Typed, validated, build-safe env access (`lib/env.ts`) + `.env.example`.
- Utilities: `cn`, currency/date formatting (market-agnostic, per-tenant).
- Platform config & subscription tiers (`config/site.ts`).
- Brand-matched placeholder SVGs in `public/illustrations` &
  `public/backgrounds`.
- Design-system preview landing page.
- Project docs: README, this CHANGELOG, per-directory READMEs marking which
  build phase fills each area.

### Notes / follow-ups

- The three planning docs (Blueprint, UI/UX Spec, Technical Plan) were not
  found in the repo; needed to build Phase 2 faithfully (schema, RLS, page
  designs).
- Fonts (Fredoka + Plus Jakarta Sans) are a placeholder pending the UI/UX
  spec's typography section.

### Phase 2 — Database, Auth & Multi-Tenancy

Added

- **Supabase migrations** (`supabase/migrations/`, applied to project
  `ajjqpryhjjwrttexhevp`) — no manual dashboard edits:
  1. `reset_prior_schema` — dropped the prior conflicting scaffold (was empty).
  2. `core_schema` — all 16 tenant-scoped tables + enums + indexes +
     `updated_at` triggers. Money stored in integer minor units.
  3. `auth_and_rls` — RLS helper fns, `handle_new_user` signup trigger, role
     escalation guard, RLS enabled on every table, `bakery_id`-scoped policies
     plus a separate `platform_admin` policy per table, role grants.
  4. `seed_occasion_library` — 24 global occasions (Birthday, Wedding, Eid,
     Korean New Year, Labor Day, Father's/Mother's Day, New Car, …).
  5. `harden_function_exposure` — moved SECURITY DEFINER isolation helpers into
     a non-exposed `private` schema; pinned search_paths; locked down trigger
     functions. **Supabase security advisor: 0 issues.**
  6. `fix_role_guard_ref` / `refine_role_guard` — role guard fixes.
- **16 tables**, all with RLS ON, all tenant tables filtered by `bakery_id`:
  `users`, `bakeries`, `bakery_staff`, `end_customer_profiles`,
  `occasion_library`, `bakery_occasions`, `cake_templates`, `cake_designs`,
  `menu_items`, `orders`, `order_status_history`, `messages`, `favorites`,
  `invoices`, `loyalty_transactions`, `bakery_subscriptions`.
- **Auth**: 4 roles (`platform_admin`, `bakery_owner`, `bakery_staff`,
  `end_customer`); end-customer accounts are tenant-scoped
  (`end_customer_profiles`, one per bakery). Email/password + Google OAuth are
  dashboard settings (documented in `src/lib/supabase/README.md`).
- **App-side**: typed Supabase clients (`client`/`server`/`admin`), generated
  DB types, tenant resolver, and **`src/proxy.ts`** (Next 16's renamed
  `middleware`) that maps hostname → active bakery, attaches `x-bakery-id`, and
  refreshes the Supabase session.
- **Tenant isolation VERIFIED** with two live test bakeries: each owner/customer
  saw only their own private rows (0 of the other's); cross-tenant writes were
  rejected by RLS; anon saw only public catalog. Fixture removed afterward.

### Notes

- Next 16 renamed `middleware.ts` → `proxy.ts`; we use `proxy.ts`.
- Prior DB scaffold conflicted with the spec; rebuilt clean with user sign-off.

### Phase 3 — Bakery Onboarding & Branding

Added

- **Migrations 8–11**: `occasion_library.category` + full worldwide seed (91
  occasions across 12 categories); public `bakery-logos` storage bucket with
  member-scoped write policies; owner subscription-insert policy (records the
  chosen plan pre-billing); and `provision_bakery()` — a SECURITY INVOKER
  function that atomically creates bakery + owner membership + starter menu +
  default occasions + trial subscription under the caller's RLS. Advisor: 0.
- **Signup wizard** (`/signup`), 5 steps: Plan → Shop details (live subdomain
  availability check) → Branding (color pickers + logo upload to Storage +
  real-time storefront preview) → Menu basics (pre-filled starter menu) → Go
  Live (storefront URL). Handles email-confirmation-required gracefully.
- **Login** (`/login`) + sign-out; server-side `requireBakeryAccess` guard.
- **Bakery dashboard** (`/dashboard`): overview, **Branding** panel (logo /
  colors / subdomain with live preview), **Menu & Pricing** table editor
  (writes `menu_items`), and **Occasions** manager (enable/disable by category
  or individual + custom occasions via `bakery_occasions`).
- **Security**: every branding/menu/occasion mutation is a server action that
  calls `requireBakeryAccess()` and derives `bakery_id` from the session —
  a client-supplied `bakery_id` is never trusted; RLS is the backstop.

Verified

- Provisioned two bakeries through the real `provision_bakery` RPC under real
  authenticated JWTs (the wizard's actual backend path). Both went live
  (active, menu, 16 default occasions, correct plan). Cross-tenant reads of
  private data returned empty, a cross-tenant write was RLS-rejected (HTTP
  403), and anon saw only the public catalog. Signup UI verified via browser
  screenshots. Test data removed afterward.

### Notes

- Next 16 renamed `middleware` → `proxy`; tenant resolution lives in `proxy.ts`.
- This project requires email confirmation on signup, so the wizard pauses on a
  "confirm your email" step. Enabling auto-confirm in Supabase Auth makes owner
  signup single-pass.

### Phase 4 — Storefront shell (per-bakery, subdomain-resolved)

Added

- **Tenant rewrite in `proxy.ts`**: subdomain / custom-domain requests are
  rewritten into an internal `/storefront` namespace (with `x-bakery-id`
  attached); the root domain keeps serving marketing + dashboard. Unknown
  tenant hosts redirect to the root SaaS site; `/storefront` is blocked from
  direct access on the root domain.
- **`getCurrentBakery()`** — loads the active tenant for the request (anon /
  RLS), used by the storefront.
- **Storefront** (`(storefront)/storefront`): branded layout (per-tenant logo +
  colors from the bakery record, not the platform palette), header, footer;
  a home page with hero + "from" base price, the bakery's enabled occasions,
  and a menu/catalog preview grouped by builder step; and a Cake Builder entry
  placeholder at `/design` (next phase).

Verified

- Two distinctly-branded bakeries rendered correctly on their own subdomains
  (`petal.localhost` teal/gold vs `cocoa.localhost` chocolate/pink), each
  showing only its own name, menu (PKR prices), and occasions. Unknown
  subdomains redirected to root. Screenshots captured; test data removed.

### Design

- **`docs/cake-builder-design-spec.md`** — full design specification for the
  animated Cake Builder (UX flow, design-system extension, transitions,
  micro-interactions, drag-and-drop, R3F 3D preview, accessibility, performance
  budgets, tech mapping, and a 5a–5g implementation plan).

### Phase 5a — Cake Builder shell & state

Added

- **Builder** (`/design` on a tenant storefront): step model derived from the
  bakery's own menu + enabled occasions (`lib/builder/steps.ts`), builder state,
  animated step transitions (Framer `AnimatePresence`), a jump-anywhere progress
  rail, and a sticky price + Back/Next bar. Fully **tenant-branded**.
- **Reactive 2.5D preview placeholder** (`cake-preview.tsx`) that already
  responds to size (scale), shape (silhouette), toppings (count), message, and
  occasion — reduced-motion-safe. The parametric 3D preview replaces it in 5d.
- Card-based steps (occasion, size, flavor, filling, frosting, toppings,
  decorations, shape, message, dietary, date, review) with select
  micro-interactions and a review summary.
- **Optimistic** client-side price estimate for the ticker
  (`estimateSubtotalMinor`); Phase 5b makes the total server-authoritative and
  tenant-scoped.

Verified

- Clicked through the builder on a seeded tenant (`build.localhost`): step
  transitions, per-tenant purple/pink branding, live preview reaction, price
  updates (Rs 3,800 → Rs 4,300), and the review summary all worked. Screenshots
  captured; test data removed.

### Phase 5b — Server-side pricing engine

Added

- **`priceCake(selections)` server action** (`/design/actions.ts`): the
  authoritative, tenant-scoped total. The bakery is taken from the proxy-resolved
  tenant context (`x-bakery-id`), **never from the client**; only selection ids
  are accepted; prices are read from `menu_items` scoped to that bakery and to
  available items. A client cannot inject an item, a price, or another tenant's
  menu. Non-menu selections contribute 0.
- Builder ticker wired to it: a **debounced** (220ms) recompute on every
  selection change, an optimistic estimate for instant feedback until the server
  responds, and a "confirming…" spinner while pending. Lint-safe (no synchronous
  setState in effects).

Verified

- Exercised the exact scoped-sum query with an injected other-tenant id and a
  fabricated id present: both were excluded (total 240000 = legit-only 240000),
  proving tenant scoping and DB-only pricing. Ran inside a rolled-back
  transaction — nothing persisted.

### Phase 5c — Richer reactive 2.5D preview

Added

- Rebuilt `cake-preview.tsx` to react expressively to selections: sponge color
  tweens by **flavor**, a **filling** stripe by filling, frosting **finish**
  (glossy fondant / soft whipped / matte buttercream), **distinct topping
  shapes** (berry dots, gold diamonds, chocolate triangles, flowers, sprinkles),
  a **lit candle** with a flickering flame, the piped **message**, and the
  **occasion** badge — with per-change pop/tween payoffs. Fully reduced-motion-safe.
- Builder passes the selected option names to the preview
  (`derivePreview` reworked) so mappings are name-driven.

Verified

- Screenshot on a seeded tenant with 2 kg + Belgian Chocolate + Salted Caramel +
  Fondant + Berries + Gold Leaf + candle + heart + message rendered all cues
  correctly, with the server price ticker confirming (Rs 6,500). Test data removed.

### Phase 5d — Parametric 3D cake preview (React Three Fiber)

Added

- `components/builder/cake-3d.tsx`: parametric 3D cake (round cylinder / square
  box / extruded **heart**), sponge + glossy/matte/soft frosting materials in
  the tenant's colors, sphere toppings + a lit candle, three-point lighting and
  a contact shadow, damped orbit + clamped zoom. `frameloop="demand"` + DPR cap
  for battery/thermal efficiency.
- `components/builder/cake-preview-3d.tsx`: capability-gated host — renders the
  2.5D preview on the server and on low-power/no-WebGL devices, and lazily
  (`next/dynamic`, `ssr:false`) upgrades to the 3D cake when supported. Occasion
  badge + "drag to rotate" hint overlays.
- Shared `lib/builder/preview-mapping.ts` (sponge/filling/finish/topping
  mappings) used by both the 2.5D and 3D previews.

Verified

- Screenshots (headless Chromium + WebGL) of the round and heart cakes with
  chocolate sponge, raspberry fondant, gold + berry toppings, and a candle,
  correctly framed and grounded; capability gate falls back to 2.5D otherwise.
  Test data removed.

### Occasion library — full global master list

- Reseeded `occasion_library` with the complete worldwide set: **277 occasions
  across 26 categories** (Birthdays, Love & Relationships, Family & Baby,
  Education, Career & Business, Vehicles, Home & Property, Financial, Achievements,
  Travel & Immigration, Gaming & Entertainment, Shopping & Lifestyle, Pets,
  Christian/Islamic/Hindu/Jewish/Buddhist, International & National holidays,
  Social, Digital & Personal milestones, Seasonal, Luxury, Just Because).
  Slugs deduped across categories; a curated ~32 are default-enabled.

### Phase 5e — Drag-and-drop toppings & decorations

Added

- `components/builder/drag-tray.tsx`: draggable ingredient chips + a drop zone
  for the topping/decoration steps. Drag a chip onto the zone to add it, or
  **tap / keyboard-activate** it (full parity for touch + assistive tech).
  Placed items appear as removable pills; the live preview reacts immediately.
  A drag-vs-tap guard prevents a drag from also firing the chip's click.

Verified

- Browser test: tapping one topping and dragging another both landed in the
  drop zone (2 pills) and appeared on the 3D cake; the new "Kids Birthday"
  occasion (from the master list) drove the badge. Test data removed.

## Next

- **5f** review → cart → checkout (glass cart, COD + Stripe UI) + order
  confirmation → **5g** polish/perf/a11y. (Full drag-onto-3D raycast placement
  is a later refinement.)
