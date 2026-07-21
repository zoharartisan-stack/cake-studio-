/**
 * CakeCraft Studio — Design tokens (TypeScript mirror of globals.css @theme).
 *
 * Single source of truth for values that JavaScript animation layers need
 * (Framer Motion, GSAP, React Three Fiber). Keep in sync with globals.css.
 * CSS utilities should be preferred in markup; use these only where a value
 * must be computed or passed to a JS animation API.
 */

// Palette rebrand → Raspberry (#A22A4E) + Blush (#FFE4DE). Scale keys retained
// (cream/gold/rose/choco) for stability; values mirror globals.css @theme:
//   cream = Blush · gold = Raspberry primary · rose = Raspberry-pink secondary
//   choco = Deep-wine ink. Keep in sync with globals.css.
export const brandColors = {
  cream: {
    50: "#fff6f3",
    100: "#ffe4de",
    200: "#ffd3ca",
    300: "#f8bcb0",
    400: "#f0a597",
  },
  gold: {
    50: "#fbeaef",
    100: "#f6d3dc",
    200: "#eba9bc",
    300: "#dd7c98",
    400: "#c55174",
    500: "#a22a4e",
    600: "#8a2242",
    700: "#6e1b35",
    800: "#521428",
    900: "#360d1b",
  },
  rose: {
    50: "#fcedf1",
    100: "#f8d8e0",
    200: "#f0b3c3",
    300: "#e68ba3",
    400: "#dd6e8a",
    500: "#d45b77",
    600: "#bc3f5e",
    700: "#99304a",
    800: "#722438",
    900: "#4c1826",
  },
  choco: {
    50: "#f3eef0",
    100: "#e4d5da",
    200: "#c6a9b4",
    300: "#a67c8c",
    400: "#825565",
    500: "#613b49",
    600: "#4a2a36",
    700: "#351c27",
    800: "#241219",
    900: "#160a0f",
  },
} as const;

/**
 * Primary brand anchors, for quick reference and as the default colors a new
 * bakery starts with in the signup wizard.
 */
export const brand = {
  background: brandColors.cream[100], // Blush  #FFE4DE
  primary: brandColors.gold[500], //     Raspberry #A22A4E
  secondary: brandColors.rose[500], //   Raspberry-pink #D45B77
  accent: brandColors.choco[700], //     Deep wine #351C27
} as const;

/** Motion durations in seconds (Framer Motion / GSAP use seconds). */
export const durations = {
  instant: 0.1,
  fast: 0.18,
  base: 0.28,
  slow: 0.48,
  slower: 0.72,
} as const;

/** Cubic-bezier easing arrays, consumable directly by Framer Motion / GSAP. */
export const easings = {
  outSoft: [0.22, 1, 0.36, 1],
  inOutSoft: [0.65, 0, 0.35, 1],
  back: [0.34, 1.56, 0.64, 1],
  bounce: [0.68, -0.55, 0.265, 1.55],
} as const;

/** Reusable spring presets for Framer Motion. */
export const springs = {
  /** Gentle, for layout shifts. */
  soft: { type: "spring", stiffness: 260, damping: 30 },
  /** Snappy, for interactive controls. */
  snappy: { type: "spring", stiffness: 420, damping: 28 },
  /** Playful overshoot, for "pop" reveals & builder payoffs. */
  pop: { type: "spring", stiffness: 500, damping: 18, mass: 0.8 },
} as const;

export type BrandColorFamily = keyof typeof brandColors;
