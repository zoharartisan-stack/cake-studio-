"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireBakeryAccess } from "@/lib/auth/require-bakery";
import { isValidSlug, RESERVED_SLUGS } from "@/lib/utils/slug";
import { DEFAULT_MENU_ITEMS } from "@/lib/onboarding/defaults";
import type { Json } from "@/types/database.types";

const HEX = /^#[0-9a-fA-F]{6}$/;

export interface SubdomainResult {
  available: boolean;
  reason?: string;
}

/**
 * Live subdomain availability check. Validates format + reserved words, then
 * checks existing (active) bakeries. The UNIQUE constraint on bakeries.slug is
 * the hard guarantee at insert time; this is the fast UX check.
 */
export async function checkSubdomain(raw: string): Promise<SubdomainResult> {
  const slug = raw.toLowerCase().trim();
  if (!isValidSlug(slug)) {
    return { available: false, reason: "3–40 chars: letters, numbers, hyphens." };
  }
  if (RESERVED_SLUGS.has(slug)) {
    return { available: false, reason: "That subdomain is reserved." };
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bakeries")
    .select("id")
    .eq("slug", slug)
    .limit(1)
    .maybeSingle();
  if (error) return { available: false, reason: "Couldn't check right now — try again." };
  return data ? { available: false, reason: "That subdomain is already taken." } : { available: true };
}

const createSchema = z.object({
  plan: z.enum(["basic", "premium", "enterprise"]),
  name: z.string().min(2).max(80),
  slug: z.string(),
  primaryColor: z.string().regex(HEX),
  secondaryColor: z.string().regex(HEX),
  accentColor: z.string().regex(HEX),
  city: z.string().max(80).optional().default(""),
  description: z.string().max(300).optional().default(""),
});

export type CreateBakeryInput = z.input<typeof createSchema>;
export type CreateBakeryResult =
  | { ok: true; bakeryId: string; slug: string }
  | { ok: false; error: string };

/**
 * Provision a bakery for the SIGNED-IN user. owner_id is taken from the session
 * (auth.uid) inside the DB function — never from the client. Atomic: bakery +
 * owner membership + starter menu + default occasions + trial subscription.
 */
export async function createBakery(
  input: CreateBakeryInput,
): Promise<CreateBakeryResult> {
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check your details and try again." };
  const v = parsed.data;
  if (!isValidSlug(v.slug) || RESERVED_SLUGS.has(v.slug)) {
    return { ok: false, error: "That subdomain isn't allowed." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Your session expired — please sign in again." };

  const { data, error } = await supabase.rpc("provision_bakery", {
    p_name: v.name,
    p_slug: v.slug,
    p_plan: v.plan,
    p_primary: v.primaryColor,
    p_secondary: v.secondaryColor,
    p_accent: v.accentColor,
    p_city: v.city ?? "",
    p_description: v.description ?? "",
    p_menu: DEFAULT_MENU_ITEMS as unknown as Json,
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "That subdomain was just taken — pick another." };
    }
    return { ok: false, error: error.message };
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return { ok: false, error: "Provisioning failed — please try again." };
  return { ok: true, bakeryId: row.bakery_id, slug: row.bakery_slug };
}

/** Save a logo URL to the caller's bakery (auth + membership enforced). */
export async function setBakeryLogo(logoUrl: string): Promise<{ ok: boolean; error?: string }> {
  const access = await requireBakeryAccess();
  const supabase = await createClient();
  const { error } = await supabase
    .from("bakeries")
    .update({ logo_url: logoUrl })
    .eq("id", access.bakeryId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
