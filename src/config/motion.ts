/**
 * Reusable Framer Motion variants and transitions.
 *
 * These implement the "Animation & Interactivity Playbook" primitives at the
 * design-system level so pages compose motion consistently. Every consumer
 * should still gate against `prefers-reduced-motion` (see useReducedMotionSafe).
 */
import type { Variants, Transition } from "framer-motion";
import { durations, easings, springs } from "./design-tokens";

export const transitions = {
  base: { duration: durations.base, ease: easings.outSoft } as Transition,
  slow: { duration: durations.slow, ease: easings.outSoft } as Transition,
  pop: springs.pop as Transition,
  snappy: springs.snappy as Transition,
  soft: springs.soft as Transition,
};

/** Fade + rise, the default entrance for content blocks. */
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: transitions.slow },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: transitions.base },
};

/** "Pop" entrance for playful reveals (builder payoffs, badges, confetti cues). */
export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: { opacity: 1, scale: 1, transition: transitions.pop },
};

/** Stagger children — pair with fadeInUp/popIn on child elements. */
export const staggerContainer = (stagger = 0.08, delayChildren = 0): Variants => ({
  hidden: {},
  visible: {
    transition: { staggerChildren: stagger, delayChildren },
  },
});

/** Interactive hover/tap feel for cards & buttons. */
export const interactive = {
  whileHover: { y: -3, scale: 1.02, transition: transitions.snappy },
  whileTap: { scale: 0.97, transition: transitions.snappy },
};

/** Viewport config for scroll-reveal (`whileInView`). */
export const revealViewport = { once: true, amount: 0.3 } as const;
