import { redirect } from "next/navigation";
import { getBakeryAccess } from "@/lib/auth/require-bakery";
import { createClient } from "@/lib/supabase/server";
import { OrdersList, type OrderRow } from "./orders-list";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const access = await getBakeryAccess();
  if (!access) redirect("/login");

  const supabase = await createClient();
  const { data: bakery } = await supabase
    .from("bakeries")
    .select("currency, locale")
    .eq("id", access.bakeryId)
    .maybeSingle();

  const { data } = await supabase
    .from("orders")
    .select(
      "id, order_number, status, fulfillment_type, delivery_date, total_minor, currency, payment_method, payment_status, notes, created_at, cake_designs(name)",
    )
    .eq("bakery_id", access.bakeryId)
    .order("created_at", { ascending: false })
    .limit(100);

  const orders: OrderRow[] = (data ?? []).map((o) => ({
    id: o.id,
    orderNumber: o.order_number,
    status: o.status,
    fulfillment: o.fulfillment_type,
    deliveryDate: o.delivery_date,
    totalMinor: o.total_minor,
    currency: o.currency,
    paymentMethod: o.payment_method,
    paymentStatus: o.payment_status,
    notes: o.notes,
    createdAt: o.created_at,
    designName:
      (o.cake_designs as unknown as { name: string } | null)?.name ?? "Custom Cake",
  }));

  return (
    <div className="max-w-4xl">
      <div>
        <h1 className="text-3xl">Orders</h1>
        <p className="mt-1 text-muted-foreground">
          Every order for {access.bakeryName}. Move each one along as you bake and deliver.
        </p>
      </div>
      <OrdersList
        orders={orders}
        currency={bakery?.currency ?? "PKR"}
        locale={bakery?.locale ?? "en-PK"}
      />
    </div>
  );
}
