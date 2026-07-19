"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireBakeryAccess } from "@/lib/auth/require-bakery";
import { isValidSlug, RESERVED_SLUGS } from "@/lib/utils/slug";

const HEX = /^#[0-9a-fA-F]{6}$/;

type ActionResult = { ok: true } | { ok: false; error: string };

/* ============================ Branding ============================ */

const brandingSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(300).optional().default(""),
  primaryColor: z.string().regex(HEX),
  secondaryColor: z.string().regex(HEX),
  accentColor: z.string().regex(HEX),
  logoUrl: z.string().url().optional().nullable(),
});

export async function updateBranding(
  input: z.input<typeof brandingSchema>,
): Promise<ActionResult> {
  // Auth + membership check; bakery_id comes from the session, not the client.
  const access = await requireBakeryAccess();
  const parsed = brandingSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid branding values." };
  const v = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from("bakeries")
    .update({
      name: v.name,
      description: v.description || null,
      primary_color: v.primaryColor,
      secondary_color: v.secondaryColor,
      accent_color: v.accentColor,
      ...(v.logoUrl !== undefined ? { logo_url: v.logoUrl } : {}),
    })
    .eq("id", access.bakeryId);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/branding");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function updateSubdomain(slugRaw: string): Promise<ActionResult> {
  const access = await requireBakeryAccess();
  const slug = slugRaw.toLowerCase().trim();
  if (!isValidSlug(slug) || RESERVED_SLUGS.has(slug)) {
    return { ok: false, error: "That subdomain isn't allowed." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("bakeries")
    .update({ slug })
    .eq("id", access.bakeryId);
  if (error) {
    if (error.code === "23505") return { ok: false, error: "That subdomain is already taken." };
    return { ok: false, error: error.message };
  }
  revalidatePath("/dashboard/branding");
  revalidatePath("/dashboard");
  return { ok: true };
}

/* ============================ Menu ============================ */

const menuItemSchema = z.object({
  id: z.string().uuid().optional(),
  category: z.string().min(1).max(40),
  name: z.string().min(1).max(80),
  price_minor: z.number().int().min(0).max(100_000_000),
  is_base_price: z.boolean().default(false),
  is_available: z.boolean().default(true),
});

export async function saveMenuItem(
  input: z.input<typeof menuItemSchema>,
): Promise<ActionResult> {
  const access = await requireBakeryAccess();
  const parsed = menuItemSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid menu item." };
  const v = parsed.data;
  const supabase = await createClient();

  if (v.id) {
    // Scope the update to this bakery; RLS is the backstop.
    const { error } = await supabase
      .from("menu_items")
      .update({
        category: v.category,
        name: v.name,
        price_minor: v.price_minor,
        is_base_price: v.is_base_price,
        is_available: v.is_available,
      })
      .eq("id", v.id)
      .eq("bakery_id", access.bakeryId);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabase.from("menu_items").insert({
      bakery_id: access.bakeryId,
      category: v.category,
      name: v.name,
      price_minor: v.price_minor,
      is_base_price: v.is_base_price,
      is_available: v.is_available,
    });
    if (error) return { ok: false, error: error.message };
  }
  revalidatePath("/dashboard/menu");
  return { ok: true };
}

export async function deleteMenuItem(id: string): Promise<ActionResult> {
  const access = await requireBakeryAccess();
  const supabase = await createClient();
  const { error } = await supabase
    .from("menu_items")
    .delete()
    .eq("id", id)
    .eq("bakery_id", access.bakeryId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/menu");
  return { ok: true };
}

/* ============================ Occasions ============================ */

async function setOccasionRow(
  bakeryId: string,
  occasionId: string,
  enabled: boolean,
) {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("bakery_occasions")
    .select("id")
    .eq("bakery_id", bakeryId)
    .eq("occasion_id", occasionId)
    .maybeSingle();

  if (existing) {
    return supabase
      .from("bakery_occasions")
      .update({ is_enabled: enabled })
      .eq("id", existing.id);
  }
  return supabase
    .from("bakery_occasions")
    .insert({ bakery_id: bakeryId, occasion_id: occasionId, is_enabled: enabled });
}

export async function setOccasionEnabled(
  occasionId: string,
  enabled: boolean,
): Promise<ActionResult> {
  const access = await requireBakeryAccess();
  const { error } = await setOccasionRow(access.bakeryId, occasionId, enabled);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/occasions");
  return { ok: true };
}

export async function setCategoryEnabled(
  category: string,
  enabled: boolean,
): Promise<ActionResult> {
  const access = await requireBakeryAccess();
  const supabase = await createClient();

  const { data: occ } = await supabase
    .from("occasion_library")
    .select("id")
    .eq("category", category)
    .eq("is_active", true);
  if (!occ?.length) return { ok: true };
  const ids = occ.map((o) => o.id);

  const { data: existing } = await supabase
    .from("bakery_occasions")
    .select("id, occasion_id")
    .eq("bakery_id", access.bakeryId)
    .in("occasion_id", ids);

  const existingIds = new Set((existing ?? []).map((r) => r.occasion_id));
  const toInsert = ids
    .filter((id) => !existingIds.has(id))
    .map((id) => ({ bakery_id: access.bakeryId, occasion_id: id, is_enabled: enabled }));

  if (toInsert.length) {
    const { error } = await supabase.from("bakery_occasions").insert(toInsert);
    if (error) return { ok: false, error: error.message };
  }
  if (existing?.length) {
    const { error } = await supabase
      .from("bakery_occasions")
      .update({ is_enabled: enabled })
      .eq("bakery_id", access.bakeryId)
      .in("occasion_id", ids);
    if (error) return { ok: false, error: error.message };
  }
  revalidatePath("/dashboard/occasions");
  return { ok: true };
}

export async function addCustomOccasion(name: string): Promise<ActionResult> {
  const access = await requireBakeryAccess();
  const clean = name.trim().slice(0, 60);
  if (clean.length < 2) return { ok: false, error: "Enter an occasion name." };
  const supabase = await createClient();
  const { error } = await supabase.from("bakery_occasions").insert({
    bakery_id: access.bakeryId,
    custom_name: clean,
    is_enabled: true,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/occasions");
  return { ok: true };
}

export async function removeCustomOccasion(id: string): Promise<ActionResult> {
  const access = await requireBakeryAccess();
  const supabase = await createClient();
  const { error } = await supabase
    .from("bakery_occasions")
    .delete()
    .eq("id", id)
    .eq("bakery_id", access.bakeryId)
    .is("occasion_id", null);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/occasions");
  return { ok: true };
}
