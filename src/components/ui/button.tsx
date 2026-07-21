"use client";

import * as React from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { interactive, transitions } from "@/config/motion";
import { useReducedMotionSafe } from "@/hooks/use-reduced-motion-safe";

type Variant = "primary" | "secondary" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium font-display " +
  "transition-colors disabled:pointer-events-none disabled:opacity-50 select-none";

const variants: Record<Variant, string> = {
  primary:
    "bg-gold-500 text-white hover:bg-gold-600 shadow-soft",
  secondary:
    "bg-rose-500 text-white hover:bg-rose-600 shadow-soft",
  outline:
    "border-2 border-gold-500 text-choco-700 hover:bg-gold-50",
  ghost: "text-choco-700 hover:bg-cream-200",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-base",
  lg: "h-13 px-7 text-lg",
};

export interface ButtonProps
  extends Omit<HTMLMotionProps<"button">, "ref"> {
  variant?: Variant;
  size?: Size;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    const reduce = useReducedMotionSafe();
    return (
      <motion.button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        whileHover={reduce ? undefined : interactive.whileHover}
        whileTap={reduce ? undefined : interactive.whileTap}
        transition={transitions.snappy}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
