# CakeCraft Studio — Cake Builder Design Specification

**Status:** Draft for implementation · **Owners:** Design + Frontend
**Scope:** The customer-facing, animated 16-step Cake Builder inside a
per-bakery storefront, from storefront landing through checkout and order
confirmation.

> This spec is **original**. It synthesizes current premium-web patterns
> (Awwwards/Dribbble/Behance product pages, Mobbin commerce flows, LottieFiles
> micro-moments, GSAP/Motion scroll craft, Three.js/Spline product configurators)
> into our own system. Nothing here is copied from a specific site.

> **Anchored to what already exists.** It extends — does not replace — the
> design system in `src/app/globals.css` + `src/config/design-tokens.ts` and the
> installed stack (Framer Motion, GSAP + ScrollTrigger, Lenis, lottie-react,
> Three.js / React Three Fiber / Drei). It respects `prefers-reduced-motion`
> globally and the multi-tenant model: **the builder themes to the bakery's own
> brand colors**, not the platform palette.

---

## 0. Design principles

1. **Every choice has an immediate visual payoff.** Selecting a flavor, color,
   or topping changes the live cake preview within one frame budget — never a
   static checkmark. This is the product's core "game-like" promise.
2. **The cake is the hero.** The 3D/rendered cake is persistently visible
   (side panel on desktop, sticky top third on mobile). Controls orbit it.
3. **Progress is always legible.** Users know which of the 16 steps they're on,
   what it costs so far, and can jump back freely.
4. **Motion is meaningful, never decorative-only.** Animation communicates
   state change, spatial continuity, and delight — and yields instantly to
   `prefers-reduced-motion`.
5. **Tenant-branded, platform-consistent.** Layout, spacing, and motion are
   platform-standard; accent colors, logo, and copy come from the bakery.
6. **Server is the source of truth for price.** The client animates an
   optimistic total; the authoritative total is always recomputed server-side,
   scoped to `bakery_id` (never trusted from the client).

---

## 1. UX flow: landing → checkout

```
Storefront home (/)                    ← Phase 4 (done)
  │  "Start designing" (shared-element transition: hero cake → builder cake)
  ▼
Occasion gateway  (/design)            ← builder entry
  │  pick occasion → sets theme accents, suggested templates, default candles
  ▼
Template choice (optional)
  │  "Start from a design" or "Start from scratch"
  ▼
┌──────────────────────────  BUILDER  ──────────────────────────┐
│  Persistent LIVE PREVIEW (3D)  │  STEP PANEL (1 of 16)          │
│                                │  options as animated cards     │
│  price ticker + progress rail  │  Back / Next, jump-to-step     │
└────────────────────────────────────────────────────────────────┘
  ▼
Review & summary  → add to cart (confetti moment, cake "lands" in cart)
  ▼
Cart drawer (glass) → Checkout (delivery, contact, payment)
  ▼
Payment: Stripe card  |  Cash on Delivery
  ▼
Order confirmation (celebration scene + order tracking link)
```

### The 16 steps (default; the exact set/labels come from the bakery's menu config)

| # | Step | Preview reaction |
|---|------|------------------|
| 1 | Occasion | theme accent + ambient particles for the occasion |
| 2 | Size / servings | cake scales up/down with a spring |
| 3 | Shape | round↔square↔heart morph |
| 4 | Tiers | tiers stack in with staggered drop |
| 5 | Sponge / flavor | cross-section peek animates the interior color |
| 6 | Filling | interior layer color/texture updates |
| 7 | Frosting type | surface material swap (butter/whipped/fondant) |
| 8 | Frosting color | color sweeps across the surface |
| 9 | Toppings | drag-and-drop; items drop with physics |
| 10 | Decorations | drag-and-drop placement + snap zones |
| 11 | Message on cake | live-typed icing text on the cake face |
| 12 | Candles / toppers | items plant with a bounce; optional flame flicker (Lottie) |
| 13 | Dietary (eggless/vegan/gluten-free) | badge toggles; no visual change |
| 14 | Reference image / AI assist | upload or generate; preview cross-fades |
| 15 | Delivery / pickup date & slot | calendar; no cake change |
| 16 | Review | orbit auto-rotate + full summary + price breakdown |

Steps that have no options configured by the bakery are skipped automatically,
and the progress rail recomputes — so the "16" is a ceiling, not a forced march.

---

## 2. Design system (extension of the existing tokens)

### 2.1 Color

- **Platform tokens** stay as defined (`cream`, `gold`, `rose`, `choco`).
- **Per-tenant brand** is injected at the storefront root as CSS variables and
  used by builder chrome:
  ```css
  --brand-primary   /* header, primary CTAs */
  --brand-secondary /* secondary actions, highlights */
  --brand-accent    /* headings, deep text */
  ```
  Consume via Tailwind arbitrary values (`bg-[var(--brand-primary)]`) or inline
  style. Selection states, progress fill, and price ticker use `--brand-primary`.
- **Semantic**: success `#4caf7d`, warning `#e0a44a`, danger `#d9534f`, info
  `#5b8fd4` (already in tokens).
- **Surfaces**: cake canvas sits on a soft radial gradient of
  `color-mix(in oklab, var(--brand-secondary) 12%, white)` → white, so any
  brand reads well behind the cake.

### 2.2 Typography

- **Display:** the storefront's display face (platform default Fredoka; a bakery
  may override). Steps titles, price, CTAs.
- **Body:** Plus Jakarta Sans. Option labels, help text.
- **Scale (fluid, `clamp`)**: hero `clamp(2.5rem,6vw,4rem)`, step title
  `clamp(1.5rem,3vw,2rem)`, body `1rem`, caption `0.8125rem`.
- **Numerics:** price ticker uses `font-variant-numeric: tabular-nums` so
  rolling digits don't jitter.

### 2.3 Spacing, radii, shadows

- Spacing: Tailwind default 4px base; section rhythm 16 / 24 / 40 / 64.
- Radii: reuse tokens — cards `--radius-lg` (1.25rem), pills `full`, canvas
  container `--radius-2xl`.
- Shadows: warm-tinted tokens (`--shadow-soft/-card/-lift`); selected option
  gets `--shadow-glow-*` ring in the brand color.

### 2.4 Motion tokens (already in `design-tokens.ts` / `globals.css`)

| Token | Value | Use |
|-------|-------|-----|
| `instant` | 100ms | color/opacity flips |
| `fast` | 180ms | hover, tap |
| `base` | 280ms | card enter, option select |
| `slow` | 480ms | step transitions, reveals |
| `slower` | 720ms | hero / celebration |
| ease `outSoft` | `cubic-bezier(.22,1,.36,1)` | most entrances |
| ease `back` | `cubic-bezier(.34,1.56,.64,1)` | "pop" payoffs |
| spring `pop` | stiffness 500 / damping 18 | selection payoff |
| spring `snappy` | 420 / 28 | controls |
| spring `soft` | 260 / 30 | layout shifts |

**Rule:** UI micro-motion 120–300ms; spatial/step transitions 300–500ms;
celebrations ≤ 900ms. Nothing blocks input.

### 2.5 Icons & z-index

- Icons: `lucide-react` only (one set). 20/24px, `1.75` stroke.
- z-index ladder: canvas 0 · sticky chrome 10 · step panel 20 · drag ghost 40 ·
  cart drawer 50 · toasts 60 · modal 70.

---

## 3. Page transitions & scroll animations

### 3.1 Shared-element "cake hand-off" (storefront → builder)
- **Why:** spatial continuity; the hero cake *becomes* the builder cake, so the
  user never loses the object of interest — a hallmark of premium product flows.
- **Behavior:** on "Start designing", the hero cake image/mesh animates
  (position + scale) into the builder's preview slot over ~480ms `outSoft`; step
  panel slides up behind it.
- **Tech:** Framer Motion `layoutId` for the DOM/image case; for the 3D case,
  animate an overlay snapshot then swap to the live R3F canvas on arrival.
- **Perf:** transform/opacity only; pre-warm the R3F canvas offscreen during the
  transition so first paint is instant.

### 3.2 Route transitions
- **Behavior:** cross-fade + 12px rise (`fadeInUp`) between builder → review →
  cart → checkout. Backwards nav reverses direction (x-axis) for orientation.
- **Tech:** Framer Motion `AnimatePresence mode="wait"` at the layout boundary.
- **Perf:** keep exit animations ≤ 250ms so navigation feels instant.

### 3.3 Scroll reveals (storefront + review page)
- **Why:** progressive disclosure keeps long pages calm.
- **Behavior:** sections rise + fade once on enter (30% in view), stagger 60–80ms.
- **Tech:** the existing `Reveal` component (Framer `whileInView`) for simple
  reveals; **GSAP ScrollTrigger** only for orchestrated/pinned sequences (e.g. a
  pinned "how it works" scrollytelling strip on the storefront).
- **Perf:** `once: true`; batch with ScrollTrigger.batch; never animate layout
  properties on scroll.

### 3.4 Smooth scroll
- **Tech:** Lenis (installed), already gated by reduced-motion in
  `SmoothScroll`. Disable Lenis inside the builder viewport (the builder is
  app-like, not a scroll page) to avoid intercepting control gestures.

---

## 4. Micro-interactions (catalogue)

For each: **Why → Behavior → Tech → Perf.**

- **Primary button (CTA)** — Why: tactile confidence. Behavior: hover `y:-3,
  scale:1.02`; tap `scale:.97`; on async action, label cross-fades to a spinner;
  success ripple in brand color. Tech: Framer Motion (already in `Button`).
  Perf: transform/opacity; `will-change:transform` only while animating.
- **Option card select** — Why: the core payoff. Behavior: card lifts, brand
  glow ring pops (`spring.pop`), a check badge scales in, and the preview
  reacts simultaneously. Tech: Framer `layout` + variants. Perf: avoid box-shadow
  animation on many cards — animate an absolutely-positioned ring element's
  opacity/scale instead.
- **Price ticker** — Why: trust + delight; users see cost update as they choose.
  Behavior: digits roll (odometer) when the server total returns; brief brand-
  colored flash on change; "recalculating…" shimmer while awaiting server.
  Tech: Framer Motion number transition (animate a motion value) or a small
  rolling-digit component; tabular-nums. Perf: debounce server recompute 150ms.
- **Progress rail** — Why: orientation. Behavior: segmented rail; completed
  segments fill in brand color with a left-to-right wipe; current pulses gently.
  Tech: CSS transition + Framer for the active pulse. Perf: transform scaleX.
- **Toggle / stepper (servings, tiers)** — Behavior: value springs; +/- buttons
  bounce; haptic on mobile (`navigator.vibrate(8)` where supported). Tech:
  Framer. Perf: trivial.
- **Form fields (checkout)** — Behavior: label floats up on focus; underline
  grows from center; inline validation icon fades in (green check / red).
  Tech: Framer + React Hook Form + Zod. Perf: trivial.
- **Tooltips / info** — Behavior: fade+rise 8px, 120ms. Tech: CSS/Framer.
- **Empty & error states** — brand-matched unDraw-style SVG + one action.

All hover-only affordances have a non-hover equivalent for touch (see §10).

---

## 5. Drag-and-drop cake customization (toppings, decorations)

- **Why:** direct manipulation is more playful and memorable than a checklist,
  and communicates "you're placing this on *your* cake."
- **Behavior:**
  - A **tray** of draggable ingredient chips sits under/beside the preview.
  - Drag lifts a chip into a **ghost** that follows the pointer (scales 1.08,
    soft shadow, slight tilt toward motion).
  - The cake surface shows **snap zones** (top, tiers, border) that highlight
    when a valid drop is near; invalid areas dim.
  - Drop → the item **animates onto the cake** (arc + settle bounce), plays a
    tiny Lottie sparkle, and appears in a "placed items" list (each removable).
  - Placed items can be nudged/removed; removing them reverse-animates off.
  - Everything is also achievable **without dragging**: tap a chip → it places
    in the next open snap zone (keyboard/touch/AT parity — see §11).
- **Tech:**
  - Pointer + drag: **Framer Motion drag** (`drag`, `dragConstraints`,
    `onDragEnd`) for DOM chips; hit-testing against snap-zone rects.
  - For placing onto the **3D** cake, project the drop point to the mesh via
    R3F raycasting and attach a decoration node at the nearest snap anchor.
  - Sparkle/flame accents: **Lottie** (lottie-react) — small, GPU-cheap.
- **Perf:** use `transform` for the ghost; throttle raycasts to pointer-move via
  `requestAnimationFrame`; cap simultaneous Lottie instances (pool + reuse).
  Disable drag physics under reduced-motion (instant placement).

---

## 6. Interactive 3D cake preview (rotate / zoom / lighting)

- **Why:** a configurator-grade 3D preview is the single biggest driver of
  perceived quality and conversion for customizable products.
- **Behavior:**
  - Orbit (drag), pinch/scroll zoom (clamped), and an auto-slow-rotate at idle
    that stops on interaction. A "reset view" and a 360° "spin" button.
  - Realistic-ish lighting: soft key + fill + rim, a subtle environment
    reflection for glossy frostings, contact shadow on the plate.
  - Material changes (frosting type/color, sponge) animate via material property
    tweens, not hard swaps.
  - A **2.5D fallback**: if WebGL is unavailable or the device is low-power, show
    a layered SVG/PNG composite that still reflects selections (see §12).
- **Tech:** **React Three Fiber + Drei** (installed).
  - `OrbitControls` (damped), `Environment`/`Lightformer` for lighting,
    `ContactShadows`, `AccumulativeShadows` only on capable devices.
  - Cake = parametric mesh (tiers as generated geometry) so size/tiers/shape are
    procedural rather than many static models; decorations are instanced.
  - Lazy-load the whole 3D bundle (`next/dynamic`, `ssr:false`) and mount only
    when the builder is in view.
- **Perf:**
  - Cap DPR (`dpr={[1, 1.75]}`), `frameloop="demand"` (render on change/interaction,
    not every frame) — big battery/thermal win on mobile.
  - Compress textures (KTX2/Basis); keep the base model < ~300–500 KB.
  - Instance repeated decorations; avoid real-time shadows on mobile (baked/contact only).
  - Pause the render loop when the tab/canvas is hidden (IntersectionObserver).
  - **Spline** is an option for authoring the scene visually, but for v1 we use
    R3F (already in the stack, no extra runtime, full control). Note Spline as a
    possible future authoring pipeline, not a v1 dependency.

---

## 7. Animated ingredient selection

Each category is a horizontally scrollable, snap-aligned rail of option cards.

- **Flavors / fillings** — Why: appetite appeal. Behavior: card shows a
  cross-section swatch; on select, the cake's interior color tweens and a thin
  "slice reveal" briefly shows the layers. Tech: R3F material tween + Framer for
  the card. Perf: reuse one shared material per layer.
- **Frosting type** — Behavior: material preset swap with a 300ms surface
  dissolve (roughness/clearcoat tween). Tech: R3F. Perf: tween params, don't
  rebuild materials.
- **Frosting color** — Behavior: a color "sweeps" across the cake (radial wipe
  from the tapped card). Tech: shader uniform tween or animated decal. Perf:
  single uniform, cheap.
- **Toppings / decorations** — drag-and-drop (§5) + tap-to-place.
- **Message text** — Behavior: as the user types, icing text renders on the cake
  face with a handwriting draw-on. Tech: troika-three-text (via Drei `Text`) with
  an SDF font; draw-on via clip/opacity. Perf: debounce mesh text updates 120ms.
- **Candles / toppers** — Behavior: plant with a spring; optional flame is a
  looping Lottie billboard. Tech: R3F + Lottie. Perf: pool flames; cap count.

Every rail: keyboard arrow navigation, `aria-selected`, and a visible focus ring.

---

## 8. Loading & skeleton experiences

- **Why:** perceived performance; the 3D canvas has real cost, so we cover it
  gracefully.
- **Behavior:**
  - **App/route load:** brand-colored "whisking" or "cake rising" Lottie
    (≤ 60 KB) centered, with a thin progress bar — max ~1.2s then reveal.
  - **Builder canvas load:** the preview area shows a **skeleton cake** (the
    `skeleton` shimmer utility already in `globals.css`) + a soft pulsing plate,
    swapped for the live canvas on ready via cross-fade.
  - **Option rails:** skeleton chips shimmer while the bakery menu loads.
  - **Server price recompute:** the ticker shows a shimmer, not a spinner.
- **Tech:** lottie-react for the hero loader; CSS `@utility skeleton` for
  skeletons; Suspense boundaries around the dynamic 3D import.
- **Perf:** lazy-load Lottie JSON; never ship the 3D bundle on the loading path.

---

## 9. Checkout & order-confirmation experience

- **Cart drawer** — Why: keep users in flow. Behavior: **glassmorphism** panel
  slides from the right (backdrop blur + `color-mix` tint of brand), the built
  cake thumbnail "flies" into it (shared element), line items stagger in. Tech:
  Framer Motion + CSS `backdrop-filter`. Perf: blur is expensive — limit to the
  drawer, `will-change:opacity`; drop blur under reduced-transparency / low-power.
- **Checkout form** — Behavior: 3 calm sections (delivery, contact, payment) with
  floating labels, inline validation, and a sticky order summary that keeps the
  cake + live total visible. Payment method (Stripe card vs Cash on Delivery)
  is a segmented control; card fields mount only when card is chosen. Tech:
  React Hook Form + Zod; Stripe Elements. **Totals recomputed server-side**
  before payment intent creation.
- **Order confirmation** — Why: the emotional peak; earn a share/repeat order.
  Behavior: a **celebration scene** — confetti burst (brand colors), the cake
  does a slow victory spin, an animated check draws on, order number counts up,
  and a "track your order" CTA. Reduced-motion: static celebratory illustration
  + check, no confetti.
  Tech: a lightweight canvas confetti (or a Lottie burst), Framer for the check
  draw + count-up. Perf: confetti runs ≤ 900ms then unmounts; cap particles by
  device tier.

---

## 10. Mobile-first responsive design

- **Layout:**
  - **Mobile (default):** preview pinned to the **top ~40vh** (sticky), step
    panel scrolls beneath; primary Back/Next as a **sticky bottom bar** (thumb
    zone) with the live price. Option rails are horizontal snap-scrollers.
  - **Tablet:** preview left ~45%, panel right.
  - **Desktop:** preview left 55–60% (with orbit affordances), panel right; Lenis
    smooth-scroll only outside the builder.
- **Touch:** all drag interactions have tap-to-place equivalents; hit targets
  ≥ 44×44px; long-press = "info"; pinch-zoom on the 3D canvas.
- **Gestures don't fight the page:** the 3D canvas captures pointer only inside
  its bounds; vertical page scroll is never hijacked on mobile.
- **Tech:** CSS grid/flex + container queries; Framer for the sticky bar; test at
  360/390/768/1024/1440.
- **Perf:** ship the 2.5D fallback decision at first render on low-power devices
  (see §12) so mobile never pays the full 3D cost unless it can afford it.

---

## 11. Accessibility

- **Reduced motion:** already global (`prefers-reduced-motion` in `globals.css`
  + `useReducedMotionSafe`). All §3–§9 motion has a static/instant path; 3D
  auto-rotate and confetti are disabled; step changes cross-fade instantly.
- **Keyboard:** full builder operable without a pointer — option rails are
  radiogroups (`role="radiogroup"`, arrow keys, `aria-checked`); drag-and-drop
  has a keyboard "select item → choose zone" mode; visible focus rings
  (`:focus-visible`, already themed).
- **Screen readers:** each step announces its title and a live summary
  (`aria-live="polite"`) of the current selection and running total; the 3D
  canvas has a descriptive text alternative that updates with selections; the
  price ticker announces changes politely (not assertively).
- **Color/contrast:** enforce AA — since brand colors are tenant-supplied, run a
  contrast check on `--brand-*` against white/text and auto-pick a readable
  on-color (`color-contrast()` / a JS luminance fallback) for text on brand fills.
- **Forms:** labels tied to inputs, errors linked via `aria-describedby`,
  no color-only signaling.
- **Targets & timing:** ≥ 44px targets; no time-limited steps; motion never the
  sole carrier of meaning.

---

## 12. Performance

- **Budgets (mobile mid-tier target):** LCP < 2.5s, interaction latency < 100ms,
  keep the builder at ~60fps (≥ 50fps floor); initial JS for the storefront
  route < ~180 KB gz excluding the lazy 3D chunk.
- **Code-split:** 3D (R3F/Three/Drei) and heavy Lottie are `dynamic(ssr:false)`
  and load only when the builder mounts. GSAP ScrollTrigger loads only on pages
  that use it.
- **3D specifics:** `frameloop="demand"`, DPR cap, instancing, KTX2 textures,
  contact/baked shadows on mobile, pause on hidden (see §6).
- **Device tiering:** detect WebGL support + `navigator.hardwareConcurrency` +
  `deviceMemory` + `prefers-reduced-motion`; low tier → 2.5D layered fallback,
  fewer particles, no blur, no auto-rotate.
- **Animation hygiene:** transform/opacity only; avoid animating layout,
  box-shadow (animate a ring layer), and filters broadly; `will-change` added
  only during animation; use `content-visibility:auto` for off-screen sections.
- **Images:** `next/image`, AVIF/WebP; logos/decorations served from Supabase
  Storage with sane sizes.
- **Data:** menu/options fetched server-side and cached per bakery; price
  recompute is a debounced server action returning only the new totals.
- **Measurement:** Lighthouse + Web Vitals in CI; a dev FPS overlay for the
  builder; test on a throttled mid-tier profile.

---

## 13. Consistent design system (summary)

Everything above draws from ONE token set (already in code) — colors (+ tenant
brand vars), fluid type scale, 4px spacing rhythm, token radii, warm shadows,
the motion duration/easing/spring tokens, lucide icons, and the z-index ladder.
No component invents its own timing or color; they reference tokens so the whole
builder — and every future storefront — reads as one system while re-skinning
per bakery.

---

## 14. Premium effects (used with restraint)

- **Glassmorphism** — cart drawer, sticky summary. `backdrop-filter: blur(16px)`
  + brand-tinted translucency. Perf-gated; off on low tier / reduced transparency.
- **Subtle gradients** — canvas backdrop and section dividers use soft brand
  `color-mix` gradients (no harsh banding; add 1–2% noise to avoid gradient bands).
- **Floating elements / parallax** — occasion-themed props (petals for weddings,
  confetti for birthdays, lanterns for Eid, snow for Christmas) drift slowly
  behind the cake with gentle parallax on pointer/scroll. Tech: CSS transforms +
  a cheap rAF loop or Framer `useTransform`; **strictly decorative → disabled on
  reduced-motion and low tier.**
- **Particle moments** — confetti on "added to cart" and on order confirmation;
  occasion ambient particles (sparse). Canvas-based, capped, short-lived.
- **Hover effects** — card lift + brand glow ring; magnetic pull on the primary
  CTA (subtle, ≤ 6px). Pointer-only; no-ops on touch.
- **Rive** — great for a characterful mascot or a state-driven "baker" animation
  later, but it needs the Rive editor to author `.riv` files; **not a v1
  dependency** (consistent with the Phase-1 decision). Lottie covers v1 accents.

---

## 15. Technology mapping

| Interaction | Best tool (v1) | Notes |
|-------------|----------------|-------|
| Micro-interactions (buttons, cards, toggles, forms) | **Framer Motion** | already the primary UI motion layer |
| Step / route transitions, shared-element cake hand-off | **Framer Motion** (`AnimatePresence`, `layoutId`) | |
| Scroll reveals (storefront/review) | **Framer** `whileInView` (`Reveal`) | |
| Pinned/orchestrated scrollytelling | **GSAP + ScrollTrigger** | only where Framer isn't enough |
| Smooth scroll (marketing/storefront) | **Lenis** | off inside the builder |
| 3D cake preview, materials, lighting, raycast placement | **Three.js + React Three Fiber + Drei** | `frameloop="demand"`, lazy-loaded |
| Icing text on cake | **Drei `Text` (troika SDF)** | debounced updates |
| Drag-and-drop ingredients | **Framer Motion drag** + R3F raycasting | tap-to-place parity |
| Small delight accents (sparkles, flame, whisk loader) | **Lottie (lottie-react)** | pooled, lazy JSON |
| Confetti / celebration | lightweight canvas confetti or Lottie burst | capped, ≤ 900ms |
| Forms & validation | **React Hook Form + Zod** | |
| Payments UI | **Stripe Elements** | totals server-side |
| Visual scene authoring (optional, future) | Spline | export/author only; R3F runtime for v1 |
| Character/mascot state animation (optional, future) | Rive | needs editor; post-v1 |

---

## 16. Suggested implementation phases (each ends buildable + reduced-motion-safe)

- **5a — Builder shell & state:** layout (preview slot + step panel + progress
  rail + sticky price/nav), builder state store, occasion gateway, step framing
  with Framer transitions. Static/2D preview placeholder. Server price stub.
- **5b — Server-side pricing engine:** compute totals from the bakery's
  `menu_items` per selection, tenant-scoped; debounced recompute action;
  animated price ticker.
- **5c — Non-3D animated steps:** all card-based steps (size, shape, flavor,
  filling, frosting type/color, dietary, message, dates) with live 2.5D preview
  reacting; micro-interactions catalogue.
- **5d — 3D preview:** R3F parametric cake, orbit/zoom/lighting, material tweens,
  device tiering + 2.5D fallback, lazy-load + demand frameloop.
- **5e — Drag-and-drop toppings/decorations** (+ tap-to-place, raycast placement).
- **5f — Review → cart → checkout** (glass cart, checkout form, COD + Stripe UI)
  and **order confirmation** celebration.
- **5g — Polish pass:** loaders/skeletons, occasion particles/parallax,
  performance tuning to budget, full a11y audit.

Each phase: `npm run build` green, reduced-motion verified, tenant-branding
verified, and (where data changes) tenant isolation preserved.
