"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useReducedMotionSafe } from "@/hooks/use-reduced-motion-safe";
import {
  spongeColor,
  fillingColor,
  frostingFinish,
  mapTopping,
  type ToppingShape,
} from "@/lib/builder/preview-mapping";

export interface PreviewState {
  primary: string;
  secondary: string;
  accent: string;
  /** 0.85–1.15 scale hint from the chosen size. */
  scale: number;
  /** Number of stacked tiers (1–5). */
  tiers: number;
  shape: "round" | "square" | "heart";
  flavorName?: string;
  fillingName?: string;
  frostingName?: string;
  toppingNames: string[];
  message: string;
  occasion?: string;
}

export function CakePreview(props: PreviewState) {
  const {
    primary,
    secondary,
    accent,
    scale,
    tiers,
    shape,
    flavorName,
    fillingName,
    frostingName,
    toppingNames,
    message,
    occasion,
  } = props;
  const reduce = useReducedMotionSafe();
  const count = Math.max(1, Math.min(5, Math.round(tiers || 1)));
  const tierH = count <= 2 ? 84 : count === 3 ? 68 : 56;

  const sponge = spongeColor(flavorName);
  const filling = fillingColor(fillingName);
  const finish = frostingFinish(frostingName);

  const mapped = toppingNames.map(mapTopping);
  const hasCandle = mapped.includes("candle");
  const toppings = mapped.filter((m): m is Exclude<typeof m, "candle"> => m !== "candle").slice(0, 7);

  const bodyRadius =
    shape === "square"
      ? "8px"
      : shape === "heart"
        ? "45% 45% 42% 42% / 55% 55% 45% 45%"
        : "18px 18px 12px 12px";
  const topRadius = shape === "square" ? "10px" : "50%";

  const finishOverlay =
    finish === "glossy"
      ? "radial-gradient(40% 60% at 32% 22%, rgba(255,255,255,.65), transparent 60%)"
      : finish === "soft"
        ? "linear-gradient(180deg, rgba(255,255,255,.5), transparent 55%)"
        : "repeating-linear-gradient(115deg, rgba(255,255,255,.14) 0 6px, transparent 6px 12px)";

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ background: `radial-gradient(60% 55% at 50% 42%, ${secondary}22, transparent 70%)` }}
      />
      <AnimatePresence>
        {occasion && (
          <motion.span
            key={occasion}
            initial={reduce ? false : { y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute left-1/2 top-6 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-semibold text-white"
            style={{ backgroundColor: secondary }}
          >
            {occasion}
          </motion.span>
        )}
      </AnimatePresence>

      <motion.div
        className="relative"
        animate={reduce ? undefined : { y: [0, -8, 0] }}
        transition={reduce ? undefined : { duration: 6, repeat: Infinity, ease: "easeInOut" }}
        style={{ width: 280 }}
      >
        <motion.div
          animate={{ scale }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
          style={{ transformOrigin: "bottom center" }}
        >
          {/* candle */}
          {hasCandle && (
            <div className="mb-0.5 flex justify-center">
              <div className="relative">
                {!reduce && (
                  <motion.span
                    className="absolute -top-4 left-1/2 h-3 w-2 -translate-x-1/2 rounded-full"
                    style={{ background: "radial-gradient(circle at 50% 30%, #ffe08a, #ff8a3d)" }}
                    animate={{ scaleY: [1, 1.25, 0.95, 1.15, 1], opacity: [0.9, 1, 0.85, 1, 0.9] }}
                    transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
                  />
                )}
                {reduce && (
                  <span
                    className="absolute -top-4 left-1/2 h-3 w-2 -translate-x-1/2 rounded-full"
                    style={{ background: "radial-gradient(circle at 50% 30%, #ffe08a, #ff8a3d)" }}
                  />
                )}
                <span className="block h-6 w-1.5 rounded-sm" style={{ backgroundColor: accent }} />
              </div>
            </div>
          )}

          {/* toppings */}
          <div className="relative z-10 mx-auto -mb-2 flex h-4 w-44 items-end justify-around">
            <AnimatePresence mode="popLayout">
              {toppings.map((t, i) => (
                <motion.span
                  key={`${i}-${t.shape}-${t.color}`}
                  initial={reduce ? false : { scale: 0, y: 10 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 520, damping: 16, delay: i * 0.03 }}
                  className={t.shape === "flower" ? "text-base leading-none" : "block"}
                  style={toppingStyle(t.shape, t.color)}
                >
                  {t.shape === "flower" ? "✿" : null}
                </motion.span>
              ))}
            </AnimatePresence>
          </div>

          {/* frosting top — remounts (pops) when finish/color changes */}
          <motion.div
            key={`${finish}-${primary}`}
            initial={reduce ? false : { scale: 0.94, opacity: 0.7 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 420, damping: 20 }}
            className="relative mx-auto h-16 w-44 shadow-lg"
            style={{ backgroundColor: primary, borderRadius: topRadius }}
          >
            <span className="absolute inset-0" style={{ borderRadius: topRadius, background: finishOverlay }} />
          </motion.div>

          {/* drips */}
          <div className="relative mx-auto -mt-2 flex w-44 justify-around">
            {Array.from({ length: 5 }).map((_, i) => (
              <span
                key={i}
                className="h-3 w-3 rounded-b-full"
                style={{ backgroundColor: primary, opacity: 0.9 }}
              />
            ))}
          </div>

          {/* message band */}
          <div
            className="relative z-10 mx-auto -mt-1 flex h-9 w-52 items-center justify-center px-3 shadow"
            style={{ backgroundColor: "#fffaf3", borderRadius: "10px" }}
          >
            <span className="truncate font-display text-sm font-semibold" style={{ color: accent }}>
              {message || "Your cake"}
            </span>
          </div>

          {/* stacked tiers — narrow on top, wide at the base. Sponge color
              tweens on flavor change; each tier grows/shrinks when the tier
              count changes. */}
          <div className="mx-auto flex flex-col items-center">
            <AnimatePresence initial={false}>
              {Array.from({ length: count }).map((_, j) => {
                const width = 176 + j * 30;
                return (
                  <motion.div
                    key={j}
                    initial={reduce ? false : { scaleY: 0, opacity: 0 }}
                    animate={{ scaleY: 1, opacity: 1, backgroundColor: sponge }}
                    exit={reduce ? { opacity: 0 } : { scaleY: 0, opacity: 0 }}
                    transition={{
                      duration: 0.32,
                      ease: "easeOut",
                      backgroundColor: { duration: 0.4, ease: "easeOut" },
                    }}
                    className="relative -mt-1 overflow-hidden first:mt-0"
                    style={{
                      width,
                      height: tierH,
                      borderRadius: bodyRadius,
                      transformOrigin: "bottom center",
                    }}
                  >
                    <motion.span
                      className="absolute left-0 right-0 top-1/2 h-2.5 -translate-y-1/2"
                      animate={{ backgroundColor: filling }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                    />
                    <span
                      className="absolute inset-x-0 top-0 h-3"
                      style={{ background: "rgba(255,255,255,.14)" }}
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* plate */}
          <div className="mx-auto mt-1 h-3 w-64 rounded-full bg-black/10" />
        </motion.div>
      </motion.div>
    </div>
  );
}

function toppingStyle(shape: ToppingShape, color: string): React.CSSProperties {
  if (shape === "flower") return { color };
  if (shape === "diamond")
    return { width: 12, height: 12, backgroundColor: color, transform: "rotate(45deg)", borderRadius: 2 };
  if (shape === "triangle")
    return {
      width: 0,
      height: 0,
      borderLeft: "6px solid transparent",
      borderRight: "6px solid transparent",
      borderBottom: `12px solid ${color}`,
      backgroundColor: "transparent",
    };
  return { width: 12, height: 12, backgroundColor: color, borderRadius: "9999px" };
}
