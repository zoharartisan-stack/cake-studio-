import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { publicEnv, requireEnv, getServerEnv } from "@/lib/env";

/**
 * Service-role Supabase client — **BYPASSES RLS**. Server-only (the
 * `server-only` import makes importing this from client code a build error).
 *
 * Use ONLY for trusted server work that legitimately spans tenants or must not
 * be gated by a user's policies: Stripe webhooks writing subscriptions,
 * platform-admin tooling, background jobs. Never expose its results directly to
 * one tenant without first scoping by the correct bakery_id yourself.
 */
export function createAdminClient() {
  const { SUPABASE_SERVICE_ROLE_KEY } = getServerEnv();
  return createClient<Database>(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL", publicEnv.NEXT_PUBLIC_SUPABASE_URL),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY", SUPABASE_SERVICE_ROLE_KEY),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
