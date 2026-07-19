import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

export interface BakeryAccess {
  userId: string;
  email: string;
  bakeryId: string;
  bakerySlug: string;
  bakeryName: string;
  staffRole: Database["public"]["Enums"]["staff_role"];
}

/** The signed-in auth user, or null. */
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Resolve the signed-in user's bakery membership (owner or staff). Returns null
 * when not signed in or not a member. If `bakeryId` is provided, it is VALIDATED
 * against the user's own memberships — a client-supplied id can never widen
 * access, it can only be accepted if the user genuinely belongs to it.
 */
export async function getBakeryAccess(
  bakeryId?: string,
): Promise<BakeryAccess | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  let query = supabase
    .from("bakery_staff")
    .select("bakery_id, role, bakeries!inner(slug, name)")
    .eq("user_id", user.id);

  if (bakeryId) query = query.eq("bakery_id", bakeryId);

  const { data, error } = await query.limit(1).maybeSingle();
  if (error || !data) return null;

  const bakery = data.bakeries as unknown as { slug: string; name: string };
  return {
    userId: user.id,
    email: user.email ?? "",
    bakeryId: data.bakery_id,
    bakerySlug: bakery.slug,
    bakeryName: bakery.name,
    staffRole: data.role,
  };
}

/**
 * Server-action guard. Throws unless the caller is an authenticated
 * bakery_owner/bakery_staff for the resolved bakery. Use at the top of every
 * branding/menu mutation. The bakery_id is derived from (or validated against)
 * the user's membership — NEVER trusted blindly from the client.
 */
export async function requireBakeryAccess(
  bakeryId?: string,
): Promise<BakeryAccess> {
  const access = await getBakeryAccess(bakeryId);
  if (!access) {
    throw new Error("Forbidden: you do not have access to this bakery.");
  }
  return access;
}
