"use client";

import * as React from "react";
import { motion, type Variants } from "framer-motion";
import { fadeInUp, revealViewport } from "@/config/motion";
import { useReducedMotionSafe } from "@/hooks/use-reduced-motion-safe";

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  /** Variant to animate with; defaults to fade-in-up. */
  variants?: Variants;
  /** Optional entrance delay in seconds. */
  delay?: number;
  as?: "div" | "section" | "li" | "span";
}

/**
 * Scroll-triggered reveal wrapper. Animates once when scrolled into view, and
 * renders content statically (no animation) under prefers-reduced-motion.
 */
export function Reveal({
  children,
  className,
  style,
  variants = fadeInUp,
  delay = 0,
  as = "div",
}: RevealProps) {
  const reduce = useReducedMotionSafe();

  if (reduce) {
    return React.createElement(as, { className, style }, children);
  }

  const MotionTag = motion[as];

  return (
    <MotionTag
      className={className}
      style={style}
      initial="hidden"
      whileInView="visible"
      viewport={revealViewport}
      variants={variants}
      transition={{ delay }}
    >
      {children}
    </MotionTag>
  );
}
