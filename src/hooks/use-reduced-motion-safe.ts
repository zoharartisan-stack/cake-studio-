"use client";

import { useReducedMotion } from "framer-motion";

/**
 * Thin wrapper over Framer's `useReducedMotion` so every animation entry point
 * in the app reads the user's OS preference through one hook. Returns `true`
 * when motion should be minimized.
 *
 * Usage: gate non-essential motion, e.g.
 *   const reduce = useReducedMotionSafe();
 *   <motion.div variants={reduce ? undefined : fadeInUp} />
 */
export function useReducedMotionSafe(): boolean {
  return useReducedMotion() ?? false;
}
