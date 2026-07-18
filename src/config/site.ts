/**
 * Platform-level (CakeCraft Studio SaaS) configuration.
 *
 * NOTE: This is the marketing/SaaS product config — NOT per-tenant bakery
 * config. Per-bakery branding (logo, colors, menu, domain) is resolved at
 * runtime from the tenant record in Phase 2 and layered over the design
 * system via CSS variables.
 */

export const siteConfig = {
  name: "CakeCraft Studio",
  tagline: "The white-label cake-design platform for modern bakeries.",
  description:
    "Launch your own fully branded cake-design storefront. Your customers design cakes step by step; you get the orders. Subscription plans for every bakery.",
  /** Root marketing domain; tenants live on subdomains of the app domain. */
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
} as const;

/** Subscription tiers sold to bakery owners (core revenue model). */
export const subscriptionTiers = [
  {
    id: "basic",
    name: "Basic",
    blurb: "Everything a new bakery needs to sell custom cakes online.",
    highlights: [
      "Branded storefront on a cakecraft subdomain",
      "Full 16-step Cake Builder",
      "Cash-on-Delivery orders",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    blurb: "Grow with card payments and a custom domain.",
    highlights: [
      "Everything in Basic",
      "Custom domain",
      "Stripe card payments",
      "Advanced occasion library",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    blurb: "For multi-location bakeries and high volume.",
    highlights: [
      "Everything in Premium",
      "Priority support",
      "Higher limits & analytics",
    ],
  },
] as const;

export type SubscriptionTierId = (typeof subscriptionTiers)[number]["id"];
