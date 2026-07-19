import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "./context";
import type { Database } from "@/types/database.types";

export type Bakery = Database["public"]["Tables"]["bakeries"]["Row"];

/**
 * Load the active bakery for the current storefront request (resolved by
 * proxy.ts from the hostname). Returns null off a tenant host or if the bakery
 * isn't active. Read under the anon client — RLS only exposes active bakeries.
 */
export async function getCurrentBakery(): Promise<Bakery | null> {
  const ctx = await getTenantContext();
  if (!ctx) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("bakeries")
    .select("*")
    .eq("id", ctx.bakeryId)
    .eq("status", "active")
    .maybeSingle();
  return data ?? null;
}
