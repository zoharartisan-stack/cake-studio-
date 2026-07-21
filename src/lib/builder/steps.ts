/**
 * Cake Builder step model (Phase 5a).
 *
 * Steps are derived from the bakery's own menu + enabled occasions, so the
 * "16 steps" is a ceiling: a category with no options is skipped. Option-based
 * steps come from `menu_items`; the rest (message, dietary, date, review) are
 * fixed. Pricing here is an OPTIMISTIC client estimate for the ticker; the
 * authoritative, tenant-scoped total is computed server-side in Phase 5b.
 */
import { MENU_CATEGORIES } from "@/lib/onboarding/defaults";

export interface BuilderOption {
  id: string;
  name: string;
  priceMinor: number;
  isBasePrice: boolean;
  /** Approx. servings, shown on size options ("serves ~20"). */
  servings?: number;
}

/** Tier choices (1–5) — a config/visual step, no direct price. */
export const TIER_OPTIONS: BuilderOption[] = [1, 2, 3, 4, 5].map((n) => ({
  id: `tier-${n}`,
  name: n === 1 ? "1 tier" : `${n} tiers`,
  priceMinor: 0,
  isBasePrice: false,
}));

/**
 * Approximate servings for a size option, shown so customers think in "how many
 * people" (blueprint §C). Heuristic: ~12 servings per kg, or a standard
 * round-cake chart for inch sizes. Returns undefined when it can't tell.
 */
export function servingsForSize(name: string): number | undefined {
  const kg = name.match(/([\d.]+)\s*kg/i);
  if (kg) return Math.max(2, Math.round(parseFloat(kg[1]) * 12));
  const inch = name.match(/(\d+)\s*(?:"|inch|in\b)/i);
  if (inch) {
    const chart: Record<number, number> = { 6: 10, 7: 15, 8: 20, 9: 27, 10: 38, 11: 45, 12: 56 };
    return chart[parseInt(inch[1], 10)];
  }
  return undefined;
}

export type StepKind =
  | "occasion"
  | "single"
  | "multi"
  | "message"
  | "dietary"
  | "date"
  | "review";

export interface BuilderStep {
  id: string;
  title: string;
  subtitle?: string;
  kind: StepKind;
  /** menu_items.category for option steps. */
  category?: string;
  options?: BuilderOption[];
  optional?: boolean;
}

export interface OccasionOption {
  id: string;
  name: string;
}

/** Selections keyed by step id. Single -> option id; multi -> ids; text/date -> string. */
export type Selections = Record<string, string | string[]>;

export const DIETARY_OPTIONS: BuilderOption[] = [
  { id: "eggless", name: "Eggless", priceMinor: 0, isBasePrice: false },
  { id: "vegan", name: "Vegan", priceMinor: 0, isBasePrice: false },
  { id: "gluten-free", name: "Gluten-free", priceMinor: 0, isBasePrice: false },
];

export const DELIVERY_SLOTS: BuilderOption[] = [
  { id: "morning", name: "Morning (9am–12pm)", priceMinor: 0, isBasePrice: false },
  { id: "afternoon", name: "Afternoon (12–4pm)", priceMinor: 0, isBasePrice: false },
  { id: "evening", name: "Evening (4–8pm)", priceMinor: 0, isBasePrice: false },
];

const MULTI_CATEGORIES = new Set(["topping", "decoration"]);

const STEP_COPY: Record<string, { title: string; subtitle: string }> = {
  size: { title: "Choose a size", subtitle: "How many servings do you need?" },
  flavor: { title: "Pick your flavor", subtitle: "The sponge that sets the tone." },
  filling: { title: "Add a filling", subtitle: "What's inside counts." },
  frosting: { title: "Choose your frosting", subtitle: "The finish and feel." },
  topping: { title: "Add toppings", subtitle: "Pick as many as you like." },
  decoration: { title: "Decorate it", subtitle: "Make it unmistakably yours." },
  shape: { title: "Pick a shape", subtitle: "Round, square, or something sweeter." },
};

export interface MenuItemLite {
  id: string;
  category: string;
  name: string;
  price_minor: number;
  is_base_price: boolean;
}

/** Build the ordered step list from the bakery's menu + occasions. */
export function buildSteps(
  menu: MenuItemLite[],
  occasions: OccasionOption[],
): BuilderStep[] {
  const steps: BuilderStep[] = [];

  if (occasions.length > 0) {
    steps.push({
      id: "occasion",
      title: "What's the occasion?",
      subtitle: "We'll tailor the experience to it.",
      kind: "occasion",
      options: occasions.map((o) => ({
        id: o.id,
        name: o.name,
        priceMinor: 0,
        isBasePrice: false,
      })),
      optional: true,
    });
  }

  for (const cat of MENU_CATEGORIES) {
    const options = menu
      .filter((m) => m.category === cat.key)
      .map((m) => ({
        id: m.id,
        name: m.name,
        priceMinor: m.price_minor,
        isBasePrice: m.is_base_price,
        servings: cat.key === "size" ? servingsForSize(m.name) : undefined,
      }));
    if (options.length === 0) continue;
    const copy = STEP_COPY[cat.key] ?? { title: cat.label, subtitle: "" };
    steps.push({
      id: cat.key,
      title: copy.title,
      subtitle: copy.subtitle,
      kind: MULTI_CATEGORIES.has(cat.key) ? "multi" : "single",
      category: cat.key,
      options,
      optional: !cat.hasBase && MULTI_CATEGORIES.has(cat.key),
    });

    // Right after size, offer tiers (1–5) — a visual/config choice shown in 3D.
    if (cat.key === "size") {
      steps.push({
        id: "tiers",
        title: "How many tiers?",
        subtitle: "Stack it up — see it change live in 3D.",
        kind: "single",
        options: TIER_OPTIONS,
      });
    }
  }

  steps.push({
    id: "message",
    title: "Add a message",
    subtitle: "A few words to pipe on top (optional).",
    kind: "message",
    optional: true,
  });
  steps.push({
    id: "dietary",
    title: "Dietary needs",
    subtitle: "Any preferences? (optional)",
    kind: "dietary",
    options: DIETARY_OPTIONS,
    optional: true,
  });
  steps.push({
    id: "date",
    title: "When do you need it?",
    subtitle: "Pick a date and a time slot.",
    kind: "date",
    options: DELIVERY_SLOTS,
  });
  steps.push({
    id: "review",
    title: "Review your cake",
    subtitle: "Everything look delicious?",
    kind: "review",
  });

  return steps;
}

/**
 * Optimistic client-side subtotal (minor units) for the live ticker. Base price
 * from the selected size; add-ons summed. Phase 5b replaces this with a
 * server-authoritative, tenant-scoped calculation.
 */
export function estimateSubtotalMinor(
  steps: BuilderStep[],
  selections: Selections,
): number {
  let total = 0;
  for (const step of steps) {
    if (!step.options) continue;
    if (step.kind === "single") {
      const sel = selections[step.id];
      const opt = step.options.find((o) => o.id === sel);
      if (opt) total += opt.priceMinor;
    } else if (step.kind === "multi") {
      const sel = selections[step.id];
      const ids = Array.isArray(sel) ? sel : [];
      for (const id of ids) {
        const opt = step.options.find((o) => o.id === id);
        if (opt) total += opt.priceMinor;
      }
    }
  }
  return total;
}
