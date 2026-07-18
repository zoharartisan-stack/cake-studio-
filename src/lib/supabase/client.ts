"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";
import { publicEnv, requireEnv } from "@/lib/env";

/**
 * Browser Supabase client (uses the public anon key; all access is gated by
 * RLS). Safe to call from Client Components.
 */
export function createClient() {
  return createBrowserClient<Database>(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL", publicEnv.NEXT_PUBLIC_SUPABASE_URL),
    requireEnv(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ),
  );
}
