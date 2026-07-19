"use client";

import { motion } from "framer-motion";
import { useReducedMotionSafe } from "@/hooks/use-reduced-motion-safe";

export interface PreviewState {
  primary: string;
  secondary: string;
  accent: string;
  /** 0.85–1.15 scale hint from the chosen size. */
  scale: number;
  shape: "round" | "square" | "heart";
  toppings: number;
  message: string;
  occasion?: string;
}

/**
 * Lightweight 2.5D cake preview placeholder (Phase 5a). It already reacts to
 * size (scale), shape (silhouette), toppings (count), and the message — so every
 * selection has an immediate visual payoff. The full parametric 3D preview
 * (React Three Fiber) replaces this in Phase 5d.
 */
export function CakePreview({
  primary,
  secondary,
  accent,
  scale,
  shape,
  toppings,
  message,
  occasion,
}: PreviewState) {
  const reduce = useReducedMotionSafe();

  const topRadius =
    shape === "square" ? "14px" : shape === "heart" ? "50% 50% 45% 45%" : "50%";
  const bodyRadius = shape === "square" ? "12px" : "16px 16px 10px 10px";

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
      {/* soft brand backdrop */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: `radial-gradient(60% 55% at 50% 42%, ${secondary}22, transparent 70%)`,
        }}
      />
      {occasion && (
        <span
          className="absolute left-1/2 top-6 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-semibold text-white"
          style={{ backgroundColor: secondary }}
        >
          {occasion}
        </span>
      )}

      <motion.div
        className="relative"
        animate={reduce ? undefined : { y: [0, -8, 0] }}
        transition={reduce ? undefined : { duration: 6, repeat: Infinity, ease: "easeInOut" }}
        style={{ width: 260 }}
      >
        <motion.div
          animate={{ scale }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
          style={{ transformOrigin: "bottom center" }}
        >
          {/* toppings */}
          <div className="mb-1 flex items-end justify-center gap-2">
            {Array.from({ length: Math.min(toppings, 7) }).map((_, i) => (
              <motion.span
                key={i}
                initial={reduce ? false : { scale: 0, y: 8 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 18, delay: i * 0.04 }}
                className="block h-3.5 w-3.5 rounded-full"
                style={{ backgroundColor: i % 2 ? primary : accent }}
              />
            ))}
          </div>

          {/* top tier (frosting) */}
          <div
            className="mx-auto h-16 w-40 shadow-lg"
            style={{ backgroundColor: primary, borderRadius: topRadius }}
          />
          {/* message band */}
          <div
            className="mx-auto -mt-3 flex h-9 w-48 items-center justify-center px-3 shadow"
            style={{ backgroundColor: "#fffaf3", borderRadius: "10px" }}
          >
            <span
              className="truncate font-display text-sm font-semibold"
              style={{ color: accent }}
            >
              {message || "Your cake"}
            </span>
          </div>
          {/* base tier (sponge) */}
          <div
            className="mx-auto -mt-1 h-24 w-56"
            style={{
              background: `linear-gradient(${secondary}, ${secondary}cc)`,
              borderRadius: bodyRadius,
            }}
          />
          {/* plate */}
          <div className="mx-auto mt-1 h-3 w-64 rounded-full bg-black/10" />
        </motion.div>
      </motion.div>
    </div>
  );
}
