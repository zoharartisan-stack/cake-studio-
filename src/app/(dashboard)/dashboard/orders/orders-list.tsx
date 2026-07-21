"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Package, Truck, Store, CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { updateOrderStatus, ORDER_STATUSES } from "../actions";

export interface OrderRow {
  id: string;
  orderNumber: string;
  status: string;
  fulfillment: "delivery" | "pickup";
  deliveryDate: string | null;
  totalMinor: number;
  currency: string;
  paymentMethod: string;
  paymentStatus: string;
  notes: string | null;
  createdAt: string;
  designName: string;
}

const STATUS_LABEL: Record<string, string> = {
  pending: "Received",
  confirmed: "Confirmed",
  in_production: "Baking",
  ready: "Ready",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_TONE: Record<string, "gold" | "rose" | "neutral"> = {
  pending: "rose",
  confirmed: "gold",
  in_production: "gold",
  ready: "gold",
  out_for_delivery: "gold",
  delivered: "neutral",
  completed: "neutral",
  cancelled: "neutral",
};

export function OrdersList({
  orders,
  currency,
  locale,
}: {
  orders: OrderRow[];
  currency: string;
  locale: string;
}) {
  if (orders.length === 0) {
    return (
      <Card className="mt-6 flex flex-col items-center gap-2 py-14 text-center">
        <Package className="h-8 w-8 text-choco-300" />
        <p className="font-display text-lg">No orders yet</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          When a customer places an order on your storefront, it lands here.
        </p>
      </Card>
    );
  }

  return (
    <div className="mt-6 flex flex-col gap-3">
      {orders.map((o) => (
        <OrderCard key={o.id} order={o} currency={currency} locale={locale} />
      ))}
    </div>
  );
}

function OrderCard({
  order,
  currency,
  locale,
}: {
  order: OrderRow;
  currency: string;
  locale: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(order.status);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function change(next: string) {
    const prev = status;
    setStatus(next); // optimistic
    setError(null);
    startTransition(async () => {
      const res = await updateOrderStatus(order.id, next as (typeof ORDER_STATUSES)[number]);
      if (!res.ok) {
        setStatus(prev);
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-display text-lg font-semibold">{order.designName}</span>
            <Badge tone={STATUS_TONE[status] ?? "neutral"}>{STATUS_LABEL[status] ?? status}</Badge>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            #{order.orderNumber} · {formatDate(order.createdAt, locale)}
          </p>
        </div>
        <div className="text-right">
          <p className="font-display text-lg font-semibold">
            {formatCurrency(order.totalMinor, currency, locale)}
          </p>
          <p className="text-xs capitalize text-muted-foreground">
            {order.paymentMethod.replace(/_/g, " ")} · {order.paymentStatus}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-choco-600">
        <span className="inline-flex items-center gap-1.5">
          {order.fulfillment === "delivery" ? (
            <Truck className="h-4 w-4" />
          ) : (
            <Store className="h-4 w-4" />
          )}
          <span className="capitalize">{order.fulfillment}</span>
        </span>
        {order.deliveryDate && (
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4" /> {formatDate(order.deliveryDate, locale)}
          </span>
        )}
      </div>

      {order.notes && <p className="text-sm text-choco-500">{order.notes}</p>}

      <div className="flex flex-wrap items-center gap-2 border-t border-cream-200 pt-3">
        <label htmlFor={`st-${order.id}`} className="text-sm font-medium text-choco-600">
          Status
        </label>
        <select
          id={`st-${order.id}`}
          value={status}
          disabled={pending}
          onChange={(e) => change(e.target.value)}
          className="rounded-lg border border-cream-300 bg-surface px-3 py-1.5 text-sm font-medium text-choco-700 disabled:opacity-60"
        >
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        {pending && <Loader2 className="h-4 w-4 animate-spin text-gold-600" />}
        {error && <span className="text-sm text-danger">{error}</span>}
      </div>
    </Card>
  );
}
