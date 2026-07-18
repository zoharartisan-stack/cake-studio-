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

## Next

- **Phase 2 — Database, Auth & Multi-Tenancy:** tenant-scoped schema, RLS
  policies filtered by `bakery_id`, and subdomain-resolution middleware, all
  via Supabase migrations.
