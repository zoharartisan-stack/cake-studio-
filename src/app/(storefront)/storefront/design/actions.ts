"use server";

import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant/context";
import type { Selections } from "@/lib/builder/steps";

export interface PriceResult {
  ok: boolean;
  subtotalMinor: number;
  currency: string;
  locale: string;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Authoritative, tenant-scoped price for a cake design.
 *
 * SECURITY: the bakery is taken from the proxy-resolved tenant context
 * (`x-bakery-id`), NEVER from the client. Only selection *ids* are accepted;
 * prices are read from `menu_items` scoped to that bakery and to available
 * items — so a client cannot inject an item, a price, or another tenant's
 * menu. Non-menu selections (message, dietary, date, occasion) contribute 0.
 *
 * Total = sum of the selected menu items' `price_minor` (the size row carries
 * the base price; add-ons carry deltas; "included" options are 0).
 */
export async function priceCake(selections: Selections): Promise<PriceResult> {
  const ctx = await getTenantContext();
  const fallback: PriceResult = {
    ok: false,
    subtotalMinor: 0,
    currency: "PKR",
    locale: "en-PK",
  };
  if (!ctx) return fallback;

  // Collect UUID-shaped candidate ids only (filters out dietary/date/message).
  const ids = new Set<string>();
  for (const v of Object.values(selections)) {
    const values = Array.isArray(v) ? v : [v];
    for (const x of values) if (typeof x === "string" && UUID.test(x)) ids.add(x);
  }

  const supabase = await createClient();
  const { data: bakery } = await supabase
    .from("bakeries")
    .select("currency, locale")
    .eq("id", ctx.bakeryId)
    .maybeSingle();

  let subtotalMinor = 0;
  if (ids.size > 0) {
    const { data: items } = await supabase
      .from("menu_items")
      .select("price_minor")
      .eq("bakery_id", ctx.bakeryId)
      .eq("is_available", true)
      .in("id", [...ids]);
    subtotalMinor = (items ?? []).reduce((sum, it) => sum + (it.price_minor ?? 0), 0);
  }

  return {
    ok: true,
    subtotalMinor,
    currency: bakery?.currency ?? "PKR",
    locale: bakery?.locale ?? "en-PK",
  };
}
