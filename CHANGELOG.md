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

## Next

- The full 16-step animated Cake Builder (live preview + server-side pricing),
  cart, checkout (Stripe cards + Cash-on-Delivery), and order tracking.
