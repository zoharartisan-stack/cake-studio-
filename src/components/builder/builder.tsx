"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ArrowLeft, ArrowRight, PartyPopper, Loader2 } from "lucide-react";
import { priceCake } from "@/app/(storefront)/storefront/design/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";
import { formatCurrency } from "@/lib/utils/format";
import { useReducedMotionSafe } from "@/hooks/use-reduced-motion-safe";
import { type PreviewState } from "./cake-preview";
import { CakePreview3D } from "./cake-preview-3d";
import { DragTray } from "./drag-tray";
import {
  buildSteps,
  estimateSubtotalMinor,
  type BuilderStep,
  type MenuItemLite,
  type OccasionOption,
  type Selections,
} from "@/lib/builder/steps";

interface BuilderProps {
  bakery: {
    id: string;
    name: string;
    currency: string;
    locale: string;
    primary_color: string;
    secondary_color: string;
    accent_color: string;
  };
  menu: MenuItemLite[];
  occasions: OccasionOption[];
}

export function Builder({ bakery, menu, occasions }: BuilderProps) {
  const reduce = useReducedMotionSafe();
  const steps = useMemo(() => buildSteps(menu, occasions), [menu, occasions]);

  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [selections, setSelections] = useState<Selections>({});
  const [serverSubtotal, setServerSubtotal] = useState<number | null>(null);
  const [pricing, setPricing] = useState(false);

  const step = steps[index];
  const optimistic = estimateSubtotalMinor(steps, selections);
  // Authoritative total from the server once it responds; optimistic until then.
  const subtotal = serverSubtotal ?? optimistic;
  const preview = derivePreview(bakery, steps, selections);

  // Debounced, tenant-scoped server price recompute (source of truth).
  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      setPricing(true);
      try {
        const res = await priceCake(selections);
        if (!cancelled && res.ok) setServerSubtotal(res.subtotalMinor);
      } finally {
        if (!cancelled) setPricing(false);
      }
    }, 220);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [selections]);

  function goTo(next: number) {
    if (next < 0 || next >= steps.length) return;
    setDirection(next > index ? 1 : -1);
    setIndex(next);
  }

  function selectSingle(stepId: string, optionId: string) {
    setSelections((s) => ({ ...s, [stepId]: optionId }));
  }
  function toggleMulti(stepId: string, optionId: string) {
    setSelections((s) => {
      const cur = Array.isArray(s[stepId]) ? (s[stepId] as string[]) : [];
      const next = cur.includes(optionId)
        ? cur.filter((x) => x !== optionId)
        : [...cur, optionId];
      return { ...s, [stepId]: next };
    });
  }
  function setValue(stepId: string, value: string) {
    setSelections((s) => ({ ...s, [stepId]: value }));
  }

  const isLast = index === steps.length - 1;

  return (
    <div className="mx-auto grid max-w-7xl grid-cols-1 lg:grid-cols-[1.05fr_1fr]">
      {/* Preview */}
      <div className="sticky top-[57px] z-10 h-[40vh] border-b border-cream-300 bg-cream-50 lg:top-[65px] lg:h-[calc(100vh-65px)] lg:border-b-0 lg:border-r">
        <CakePreview3D {...preview} />
      </div>

      {/* Panel */}
      <div className="flex min-h-[60vh] flex-col lg:min-h-[calc(100vh-65px)]">
        <ProgressRail
          steps={steps}
          index={index}
          color={bakery.primary_color}
          onJump={goTo}
        />

        <div className="flex-1 overflow-y-auto px-5 py-8 sm:px-8">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step.id}
              custom={direction}
              initial={reduce ? false : { opacity: 0, x: direction * 32 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduce ? undefined : { opacity: 0, x: direction * -32 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <StepView
                step={step}
                selections={selections}
                bakery={bakery}
                onSingle={selectSingle}
                onMulti={toggleMulti}
                onValue={setValue}
                steps={steps}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        <PriceNav
          bakery={bakery}
          subtotal={subtotal}
          pricing={pricing}
          index={index}
          isLast={isLast}
          onBack={() => goTo(index - 1)}
          onNext={() => goTo(index + 1)}
        />
      </div>
    </div>
  );
}

/* --------------------------- Progress rail --------------------------- */

function ProgressRail({
  steps,
  index,
  color,
  onJump,
}: {
  steps: BuilderStep[];
  index: number;
  color: string;
  onJump: (i: number) => void;
}) {
  return (
    <div className="border-b border-cream-300 px-5 py-3 sm:px-8">
      <div className="flex items-center gap-1.5">
        {steps.map((s, i) => {
          const done = i < index;
          const active = i === index;
          return (
            <button
              key={s.id}
              onClick={() => onJump(i)}
              aria-label={`Step ${i + 1}: ${s.title}`}
              className="group relative h-2 flex-1 overflow-hidden rounded-full bg-cream-300"
            >
              <span
                className="absolute inset-0 origin-left rounded-full transition-transform duration-300"
                style={{
                  backgroundColor: color,
                  transform: `scaleX(${done ? 1 : active ? 0.5 : 0})`,
                  opacity: done || active ? 1 : 0,
                }}
              />
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-choco-400">
        Step {index + 1} of {steps.length}
      </p>
    </div>
  );
}

/* --------------------------- Price + nav --------------------------- */

function PriceNav({
  bakery,
  subtotal,
  pricing,
  index,
  isLast,
  onBack,
  onNext,
}: {
  bakery: BuilderProps["bakery"];
  subtotal: number;
  pricing: boolean;
  index: number;
  isLast: boolean;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-cream-300 bg-white/85 px-5 py-3.5 backdrop-blur sm:px-8">
      <div>
        <p className="flex items-center gap-1.5 text-xs text-choco-400">
          Estimated total
          {pricing && <Loader2 className="h-3 w-3 animate-spin" />}
        </p>
        <motion.p
          key={subtotal}
          initial={{ scale: 0.9, opacity: 0.6 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 20 }}
          className="font-display text-xl font-semibold tabular-nums"
          style={{ color: bakery.accent_color }}
        >
          {formatCurrency(subtotal, bakery.currency, bakery.locale)}
        </motion.p>
      </div>
      <div className="flex gap-2">
        <Button variant="ghost" onClick={onBack} disabled={index === 0}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        {isLast ? (
          <button
            className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 font-display font-medium text-white shadow-soft"
            style={{ backgroundColor: bakery.secondary_color }}
          >
            <PartyPopper className="h-4 w-4" /> Add to cart
          </button>
        ) : (
          <button
            onClick={onNext}
            className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 font-display font-medium text-white shadow-soft"
            style={{ backgroundColor: bakery.primary_color }}
          >
            Next <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

/* --------------------------- Step views --------------------------- */

function StepView({
  step,
  selections,
  bakery,
  steps,
  onSingle,
  onMulti,
  onValue,
}: {
  step: BuilderStep;
  selections: Selections;
  bakery: BuilderProps["bakery"];
  steps: BuilderStep[];
  onSingle: (stepId: string, optionId: string) => void;
  onMulti: (stepId: string, optionId: string) => void;
  onValue: (stepId: string, value: string) => void;
}) {
  return (
    <div>
      <h1 className="text-3xl" style={{ color: bakery.accent_color }}>
        {step.title}
      </h1>
      {step.subtitle && <p className="mt-1.5 text-muted-foreground">{step.subtitle}</p>}

      <div className="mt-6">
        {(step.kind === "single" || step.kind === "occasion") && step.options && (
          <OptionGrid
            options={step.options}
            selectedIds={valueToIds(selections[step.id])}
            multi={false}
            bakery={bakery}
            onToggle={(id) => onSingle(step.id, id)}
          />
        )}

        {step.kind === "multi" && step.options && (
          <DragTray
            options={step.options}
            selectedIds={valueToIds(selections[step.id])}
            currency={bakery.currency}
            locale={bakery.locale}
            primary={bakery.primary_color}
            secondary={bakery.secondary_color}
            onToggle={(id) => onMulti(step.id, id)}
          />
        )}

        {step.kind === "dietary" && step.options && (
          <OptionGrid
            options={step.options}
            selectedIds={valueToIds(selections[step.id])}
            multi
            bakery={bakery}
            onToggle={(id) => onMulti(step.id, id)}
          />
        )}

        {step.kind === "message" && (
          <div className="max-w-md">
            <Input
              value={(selections[step.id] as string) ?? ""}
              maxLength={40}
              placeholder="Happy Birthday, Sara!"
              onChange={(e) => onValue(step.id, e.target.value)}
            />
            <p className="mt-1.5 text-xs text-choco-400">
              {((selections[step.id] as string) ?? "").length}/40 characters
            </p>
          </div>
        )}

        {step.kind === "date" && (
          <div className="space-y-5">
            <div className="max-w-xs">
              <Input
                type="date"
                value={(selections["date"] as string) ?? ""}
                onChange={(e) => onValue("date", e.target.value)}
              />
            </div>
            {step.options && (
              <OptionGrid
                options={step.options}
                selectedIds={valueToIds(selections["date_slot"])}
                multi={false}
                bakery={bakery}
                onToggle={(id) => onValue("date_slot", id)}
              />
            )}
          </div>
        )}

        {step.kind === "review" && (
          <ReviewSummary steps={steps} selections={selections} bakery={bakery} />
        )}
      </div>
    </div>
  );
}

function OptionGrid({
  options,
  selectedIds,
  multi,
  bakery,
  onToggle,
}: {
  options: NonNullable<BuilderStep["options"]>;
  selectedIds: string[];
  multi: boolean;
  bakery: BuilderProps["bakery"];
  onToggle: (id: string) => void;
}) {
  return (
    <div
      role={multi ? "group" : "radiogroup"}
      className="grid grid-cols-2 gap-3 sm:grid-cols-3"
    >
      {options.map((o) => {
        const selected = selectedIds.includes(o.id);
        return (
          <motion.button
            key={o.id}
            role={multi ? "checkbox" : "radio"}
            aria-checked={selected}
            onClick={() => onToggle(o.id)}
            whileTap={{ scale: 0.97 }}
            className={cn(
              "relative rounded-xl border-2 bg-surface p-4 text-left transition-colors",
              selected ? "shadow-lift" : "border-cream-300 hover:border-cream-400",
            )}
            style={selected ? { borderColor: bakery.primary_color } : undefined}
          >
            {selected && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 18 }}
                className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full text-white"
                style={{ backgroundColor: bakery.primary_color }}
              >
                <Check className="h-3.5 w-3.5" />
              </motion.span>
            )}
            <span className="block font-display font-medium text-choco-800">{o.name}</span>
            {o.priceMinor > 0 && (
              <span className="mt-0.5 block text-sm text-choco-400">
                +{formatCurrency(o.priceMinor, bakery.currency, bakery.locale)}
              </span>
            )}
            {o.isBasePrice && (
              <span className="mt-0.5 block text-sm text-choco-400">
                {formatCurrency(o.priceMinor, bakery.currency, bakery.locale)}
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

function ReviewSummary({
  steps,
  selections,
  bakery,
}: {
  steps: BuilderStep[];
  selections: Selections;
  bakery: BuilderProps["bakery"];
}) {
  const rows: { label: string; value: string }[] = [];
  for (const s of steps) {
    if (s.kind === "review") continue;
    if (s.kind === "message") {
      const v = (selections[s.id] as string) ?? "";
      if (v) rows.push({ label: "Message", value: `“${v}”` });
      continue;
    }
    if (s.kind === "date") {
      const d = (selections["date"] as string) ?? "";
      const slot = s.options?.find((o) => o.id === selections["date_slot"])?.name ?? "";
      if (d || slot) rows.push({ label: "When", value: [d, slot].filter(Boolean).join(" · ") });
      continue;
    }
    const ids = valueToIds(selections[s.id]);
    if (ids.length === 0) continue;
    const names = ids
      .map((id) => s.options?.find((o) => o.id === id)?.name)
      .filter(Boolean)
      .join(", ");
    rows.push({ label: REVIEW_LABELS[s.id] ?? s.title, value: names });
  }

  return (
    <div className="rounded-xl border border-cream-300 bg-surface">
      <ul className="divide-y divide-cream-200">
        {rows.length === 0 && (
          <li className="p-4 text-sm text-muted-foreground">No selections yet.</li>
        )}
        {rows.map((r) => (
          <li key={r.label} className="flex items-start justify-between gap-4 p-4">
            <span className="text-sm capitalize text-choco-400">{r.label}</span>
            <span className="text-right text-sm font-medium text-choco-800">{r.value}</span>
          </li>
        ))}
      </ul>
      <div className="border-t border-cream-300 p-4 text-xs text-choco-400">
        Final price is confirmed by {bakery.name} at checkout.
      </div>
    </div>
  );
}

/* --------------------------- helpers --------------------------- */

const REVIEW_LABELS: Record<string, string> = {
  occasion: "Occasion",
  size: "Size",
  flavor: "Flavor",
  filling: "Filling",
  frosting: "Frosting",
  topping: "Toppings",
  decoration: "Decorations",
  shape: "Shape",
};

function valueToIds(v: string | string[] | undefined): string[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

function derivePreview(
  bakery: BuilderProps["bakery"],
  steps: BuilderStep[],
  selections: Selections,
): PreviewState {
  const sizeStep = steps.find((s) => s.category === "size");
  let scale = 1;
  if (sizeStep?.options) {
    const i = sizeStep.options.findIndex((o) => o.id === selections["size"]);
    if (i >= 0) {
      const t = sizeStep.options.length > 1 ? i / (sizeStep.options.length - 1) : 0.5;
      scale = 0.88 + t * 0.24;
    }
  }

  const optionName = (category: string, key = category): string | undefined =>
    steps
      .find((s) => s.category === category)
      ?.options?.find((o) => o.id === selections[key])?.name;

  const shapeName = (optionName("shape") ?? "").toLowerCase();
  const shape: PreviewState["shape"] = shapeName.includes("square")
    ? "square"
    : shapeName.includes("heart")
      ? "heart"
      : "round";

  const namesFor = (category: string): string[] => {
    const step = steps.find((s) => s.category === category);
    if (!step?.options) return [];
    return valueToIds(selections[category])
      .map((id) => step.options?.find((o) => o.id === id)?.name)
      .filter((n): n is string => Boolean(n));
  };

  const toppingNames = [...namesFor("topping"), ...namesFor("decoration")];

  const occasion = steps
    .find((s) => s.kind === "occasion")
    ?.options?.find((o) => o.id === selections["occasion"])?.name;

  return {
    primary: bakery.primary_color,
    secondary: bakery.secondary_color,
    accent: bakery.accent_color,
    scale,
    shape,
    flavorName: optionName("flavor"),
    fillingName: optionName("filling"),
    frostingName: optionName("frosting"),
    toppingNames,
    message: (selections["message"] as string) ?? "",
    occasion,
  };
}
