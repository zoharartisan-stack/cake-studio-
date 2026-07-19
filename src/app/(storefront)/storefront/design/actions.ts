"use server";

import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant/context";
import type { Selections } from "@/lib/builder/steps";
import type { Json } from "@/types/database.types";

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

export interface PlaceOrderInput {
  selections: Selections;
  designName?: string;
  fulfillment: "delivery" | "pickup";
  name: string;
  phone: string;
  addressLine?: string;
  city?: string;
  deliveryDate?: string;
  deliverySlot?: string;
  paymentMethod: "cash_on_delivery";
}

export type PlaceOrderResult =
  | { ok: true; orderNumber: string; totalMinor: number; currency: string; locale: string }
  | { ok: false; error: string };

/**
 * Place a (guest) order. The bakery is the proxy-resolved tenant — NOT a client
 * value. Only selection ids are forwarded; the DB function recomputes the total
 * from that bakery's own menu. Cash-on-Delivery only for now.
 */
export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  const ctx = await getTenantContext();
  if (!ctx) return { ok: false, error: "Storefront not found." };
  if (input.name.trim().length < 2) return { ok: false, error: "Enter your name." };
  if (input.phone.trim().length < 6) return { ok: false, error: "Enter a valid phone number." };
  if (input.fulfillment === "delivery" && !(input.addressLine ?? "").trim()) {
    return { ok: false, error: "Enter a delivery address." };
  }
  if (input.paymentMethod !== "cash_on_delivery") {
    return { ok: false, error: "Only Cash on Delivery is available right now." };
  }

  const menuIds = new Set<string>();
  for (const v of Object.values(input.selections)) {
    const values = Array.isArray(v) ? v : [v];
    for (const x of values) if (typeof x === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x)) menuIds.add(x);
  }

  const address =
    input.fulfillment === "delivery"
      ? { name: input.name, phone: input.phone, line: input.addressLine ?? "", city: input.city ?? "" }
      : null;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("place_order", {
    p_bakery: ctx.bakeryId,
    p_menu_ids: [...menuIds],
    p_design_name: input.designName ?? "Custom Cake",
    p_config: input.selections as unknown as Json,
    p_fulfillment: input.fulfillment,
    p_customer_name: input.name,
    p_customer_phone: input.phone,
    p_address: address as unknown as Json,
    p_delivery_date: input.deliveryDate && input.deliveryDate.length ? input.deliveryDate : null,
    p_delivery_slot: input.deliverySlot ?? "",
    p_payment_method: input.paymentMethod,
  });

  if (error) return { ok: false, error: error.message };
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return { ok: false, error: "Could not place the order — please try again." };
  return {
    ok: true,
    orderNumber: row.order_number,
    totalMinor: row.total_minor,
    currency: row.currency,
    locale: row.locale,
  };
}
