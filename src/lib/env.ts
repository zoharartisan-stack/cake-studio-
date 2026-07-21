/**
 * Typed, validated access to environment variables.
 *
 * Design goals:
 *  - Never hardcode secrets — everything flows through env vars (see .env.example).
 *  - `npm run build` stays green with NO secrets present (all vars optional here);
 *    the app fails loudly only when a *required* var is read at runtime via the
 *    `required*` helpers below.
 *  - Public (browser-exposed) vars are separated from server-only secrets.
 */
import { z } from "zod";

/** Vars safe to expose to the browser. MUST be prefixed NEXT_PUBLIC_. */
const publicSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_ROOT_DOMAIN: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
});

/** Server-only secrets. NEVER referenced from client components. */
const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  IMAGE_GENERATION_API_KEY: z.string().optional(),
});

export const publicEnv = publicSchema.parse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_ROOT_DOMAIN: process.env.NEXT_PUBLIC_ROOT_DOMAIN,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
});

/** Server env — only read this on the server. */
export function getServerEnv() {
  return serverSchema.parse({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    IMAGE_GENERATION_API_KEY: process.env.IMAGE_GENERATION_API_KEY,
  });
}

/**
 * Read a required env var, throwing a clear error if missing. Use at runtime
 * call sites (API routes, server actions) — not at module top-level.
 */
export function requireEnv<K extends string>(
  name: K,
  value: string | undefined,
): string {
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. See .env.example.`,
    );
  }
  return value;
}
