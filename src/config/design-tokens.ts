/**
 * CakeCraft Studio — Design tokens (TypeScript mirror of globals.css @theme).
 *
 * Single source of truth for values that JavaScript animation layers need
 * (Framer Motion, GSAP, React Three Fiber). Keep in sync with globals.css.
 * CSS utilities should be preferred in markup; use these only where a value
 * must be computed or passed to a JS animation API.
 */

export const brandColors = {
  cream: {
    50: "#fffdfb",
    100: "#fff8f0",
    200: "#fcefe1",
    300: "#f7e2cc",
    400: "#efd3b3",
  },
  gold: {
    50: "#fbf7ea",
    100: "#f6efcf",
    200: "#eddf9f",
    300: "#e3ce6f",
    400: "#dbbe4b",
    500: "#d4af37",
    600: "#b8942a",
    700: "#927320",
    800: "#6d561a",
    900: "#4a3a12",
  },
  rose: {
    50: "#fdf3f6",
    100: "#fbe7ed",
    200: "#f5c9d5",
    300: "#efacbe",
    400: "#eba3b6",
    500: "#e89aae",
    600: "#de6a85",
    700: "#c93d60",
    800: "#9e2f4b",
    900: "#6e2135",
  },
  choco: {
    50: "#f5f2f0",
    100: "#e8e1dc",
    200: "#cfc1b8",
    300: "#b09c8f",
    400: "#8a7264",
    500: "#665141",
    600: "#4e3c2e",
    700: "#3a2a1f",
    800: "#2a1e16",
    900: "#1a120d",
  },
} as const;

/** Primary brand anchors, for quick reference. */
export const brand = {
  creamWhite: brandColors.cream[100],
  softGold: brandColors.gold[500],
  rosePink: brandColors.rose[500],
  darkChocolate: brandColors.choco[700],
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
