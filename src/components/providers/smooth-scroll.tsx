"use client";

import { ReactLenis } from "lenis/react";
import { useReducedMotionSafe } from "@/hooks/use-reduced-motion-safe";

/**
 * App-wide smooth scrolling (Lenis). This is the base layer that GSAP
 * ScrollTrigger sequences hook into. Disabled entirely when the user prefers
 * reduced motion, in which case native scrolling is used.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotionSafe();

  if (reduce) return <>{children}</>;

  return (
    <ReactLenis root options={{ lerp: 0.1, smoothWheel: true }}>
      {children}
    </ReactLenis>
  );
}
