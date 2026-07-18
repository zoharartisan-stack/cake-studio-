# 🎂 CakeCraft Studio

A **white-label, multi-tenant SaaS platform** sold to individual bakery
owners. Each bakery subscribes and gets its own fully branded cake-design
website — own logo, colors, subdomain/custom domain, menu, and pricing —
where their customers design cakes step by step and place orders.

There is **no shared marketplace**: every deployed storefront belongs to
exactly one bakery, and bakeries can never see each other's data. Tenant
isolation is enforced with Postgres **Row Level Security scoped by
`bakery_id`** on every tenant-owned table.

> **Planning docs are the source of truth.** This project is built to the
> approved _Product Blueprint_, _UI/UX Design Spec_, and _Technical Plan_.
> The core concept, multi-tenant architecture, feature set, color palette,
> and subscription business model don't change without product sign-off.

---

## Tech stack

| Area        | Choice                                                                 |
| ----------- | ---------------------------------------------------------------------- |
| Framework   | Next.js (App Router) · React · TypeScript                              |
| Styling     | Tailwind CSS v4 (CSS-first design tokens)                              |
| Animation   | Framer Motion · GSAP + ScrollTrigger · Lenis · lottie-react · Three.js / R3F / Drei |
| Backend     | Supabase — Postgres, Auth, Storage, **RLS by `bakery_id`**             |
| AI          | Claude API + an image-generation API (cake previews)                   |
| Payments    | Stripe (bakery subscriptions + end-customer cards) · manual Cash-on-Delivery |
| Icons       | lucide-react                                                           |
| Validation  | Zod · React Hook Form                                                  |
| Hosting     | Vercel                                                                 |

## Design system

Brand palette (see `src/app/globals.css` `@theme` and
`src/config/design-tokens.ts`):

| Token          | Hex       |
| -------------- | --------- |
| Cream White    | `#FFF8F0` |
| Soft Gold      | `#D4AF37` |
| Rose Pink      | `#E89AAE` |
| Dark Chocolate | `#3A2A1F` |

Tokens for color scales, typography, radii, shadows, and **motion**
(durations, easings, springs, keyframes) are defined once and consumed by
both CSS utilities and JS animation layers. The whole system honors
`prefers-reduced-motion` — see `globals.css` and
`src/hooks/use-reduced-motion-safe.ts`.

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in values (see below)
npm run dev                  # http://localhost:3000
npm run build                # production build (must pass before a phase is "done")
npm run lint
```

### Environment variables

All secrets come from env vars — **nothing is hardcoded**. Copy
`.env.example` to `.env.local` and fill in. Highlights:

- `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_ROOT_DOMAIN` — app + tenant-subdomain root.
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — Supabase (service-role is **server-only**, bypasses RLS).
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` — Stripe.
- `ANTHROPIC_API_KEY`, `IMAGE_GENERATION_API_KEY` — AI features.

## Project structure

```
src/
  app/
    (marketing)/     SaaS site + bakery signup/onboarding      [later phase]
    (storefront)/    per-bakery customer storefront            [later phase]
    (dashboard)/     bakery owner admin                         [later phase]
    layout.tsx       root layout (fonts, smooth-scroll)
    globals.css      design system (@theme tokens, motion)
    page.tsx         design-system preview landing
  components/
    ui/              design-system primitives (Button, Card, Badge, …)
    motion/          animation primitives (Reveal, …)
    providers/       SmoothScroll (Lenis)
    layout/
  config/            design-tokens.ts · motion.ts · site.ts
  hooks/             use-reduced-motion-safe
  lib/
    env.ts           typed, validated env access
    utils/           cn, formatting
    supabase/        client factories, auth, DB types            [Phase 2]
    tenant/          subdomain -> bakery_id resolution           [Phase 2]
    stripe/          subscriptions + card payments               [later phase]
    ai/              Claude + image generation                   [later phase]
  types/
public/
  illustrations/     brand-matched empty-state SVGs
  backgrounds/       hero/section background SVGs
```

## Build phases

1. **Foundation Setup** — project, stack, design system, structure, env,
   docs. ✅ _(this phase)_
2. **Database, Auth & Multi-Tenancy** — tenant-scoped schema, RLS by
   `bakery_id`, subdomain-resolution middleware (via Supabase migrations).
3. … subsequent phases per the technical plan (storefront, Cake Builder,
   payments, AI, dashboard).

Rules we follow: one phase at a time; `npm run build` must pass before a
phase is done; all schema via Supabase migrations; all pricing/totals/
payment logic server-side and tenant-scoped; RLS by `bakery_id` on every
tenant-owned table.

See [`CHANGELOG.md`](./CHANGELOG.md) for what's been built.
