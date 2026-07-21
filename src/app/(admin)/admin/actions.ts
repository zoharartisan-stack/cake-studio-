"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePlatformAdmin } from "@/lib/auth/require-admin";

type ActionResult = { ok: true } | { ok: false; error: string };

const STATUSES = ["pending", "active", "suspended", "cancelled"] as const;
type BakeryStatus = (typeof STATUSES)[number];

/**
 * Platform-admin only: set a bakery's lifecycle status (approve a pending
 * signup, suspend a non-paying tenant, reactivate, or cancel). The admin check
 * is enforced here and again by the bakeries platform-admin RLS policy.
 */
export async function setBakeryStatus(
  bakeryId: string,
  status: BakeryStatus,
): Promise<ActionResult> {
  await requirePlatformAdmin();
  if (!STATUSES.includes(status)) return { ok: false, error: "Unknown status." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("bakeries")
    .update({ status })
    .eq("id", bakeryId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin");
  return { ok: true };
}
