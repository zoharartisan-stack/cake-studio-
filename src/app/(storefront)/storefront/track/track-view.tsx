"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Loader2,
  Search,
  ClipboardCheck,
  CheckCircle2,
  ChefHat,
  Package,
  Truck,
  PartyPopper,
  XCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { useReducedMotionSafe } from "@/hooks/use-reduced-motion-safe";
import { getOrderStatus, type OrderStatusResult } from "@/app/(storefront)/storefront/design/actions";

interface Bakery {
  name: string;
  currency: string;
  locale: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
}

type Stage = { k: string; label: string; Icon: typeof ClipboardCheck };

const DELIVERY_STAGES: Stage[] = [
  { k: "pending", label: "Received", Icon: ClipboardCheck },
  { k: "confirmed", label: "Confirmed", Icon: CheckCircle2 },
  { k: "in_production", label: "Baking", Icon: ChefHat },
  { k: "ready", label: "Ready", Icon: Package },
  { k: "out_for_delivery", label: "Out for delivery", Icon: Truck },
  { k: "delivered", label: "Delivered", Icon: PartyPopper },
];
const PICKUP_STAGES: Stage[] = [
  { k: "pending", label: "Received", Icon: ClipboardCheck },
  { k: "confirmed", label: "Confirmed", Icon: CheckCircle2 },
  { k: "in_production", label: "Baking", Icon: ChefHat },
  { k: "ready", label: "Ready to collect", Icon: Package },
  { k: "completed", label: "Picked up", Icon: PartyPopper },
];

export function TrackView({ bakery, initialOrder }: { bakery: Bakery; initialOrder: string }) {
  const reduce = useReducedMotionSafe();
  const [order, setOrder] = useState(initialOrder);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OrderStatusResult | null>(null);
  const ranInitial = useRef(false);

  async function lookup(num: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await getOrderStatus(num);
      if (!res.ok) {
        setResult(null);
        setError(res.error);
        return;
      }
      setResult(res.order);
    } finally {
      setBusy(false);
    }
  }

  // Auto-look-up when arriving from the confirmation screen (?o=ORD-...).
  useEffect(() => {
    if (ranInitial.current) return;
    ranInitial.current = true;
    if (initialOrder.trim().length >= 4) void lookup(initialOrder.trim());
  }, [initialOrder]);

  return (
    <div className="mx-auto max-w-2xl px-5 py-12 sm:py-16">
      <h1 className="text-4xl" style={{ color: bakery.accent_color }}>
        Track your order
      </h1>
      <p className="mt-2 text-muted-foreground">
        Enter your order number to see where your cake is.
      </p>

      <form
        className="mt-6 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (order.trim().length >= 4) void lookup(order.trim());
        }}
      >
        <Input
          value={order}
          onChange={(e) => setOrder(e.target.value)}
          placeholder="ORD-1A2B3C"
          aria-label="Order number"
          className="uppercase"
        />
        <button
          type="submit"
          disabled={busy}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg px-5 font-display font-medium text-white shadow-soft disabled:opacity-60"
          style={{ backgroundColor: bakery.primary_color }}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Track
        </button>
      </form>

      {error && <p className="mt-4 text-sm text-danger">{error}</p>}

      {result && (
        <motion.div
          key={result.orderNumber}
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="mt-8 rounded-2xl border border-cream-300 bg-surface p-6 shadow-soft"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-display text-xl font-semibold" style={{ color: bakery.accent_color }}>
                {result.designName}
              </p>
              <p className="mt-0.5 text-sm text-choco-400">
                #{result.orderNumber} · ordered {formatDate(result.createdAt, bakery.locale)}
              </p>
            </div>
            <p className="font-display text-lg font-semibold" style={{ color: bakery.accent_color }}>
              {formatCurrency(result.totalMinor, bakery.currency, bakery.locale)}
            </p>
          </div>

          {result.deliveryDate && (
            <p className="mt-1 text-sm text-choco-500">
              {result.fulfillment === "delivery" ? "Delivery" : "Pickup"} on{" "}
              {formatDate(result.deliveryDate, bakery.locale)}
            </p>
          )}

          <div className="mt-6">
            {result.status === "cancelled" ? (
              <div className="flex items-center gap-2 rounded-xl bg-cream-200 px-4 py-3 text-choco-600">
                <XCircle className="h-5 w-5" /> This order was cancelled. Please contact {bakery.name}.
              </div>
            ) : (
              <Timeline
                status={result.status}
                fulfillment={result.fulfillment}
                color={bakery.primary_color}
                accent={bakery.accent_color}
                reduce={reduce}
              />
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

function Timeline({
  status,
  fulfillment,
  color,
  accent,
  reduce,
}: {
  status: string;
  fulfillment: "delivery" | "pickup";
  color: string;
  accent: string;
  reduce: boolean;
}) {
  const stages = fulfillment === "pickup" ? PICKUP_STAGES : DELIVERY_STAGES;
  let idx = stages.findIndex((s) => s.k === status);
  if (idx < 0) idx = status === "completed" || status === "delivered" ? stages.length - 1 : 0;

  return (
    <div className="relative pl-2">
      {/* full track line */}
      <div className="absolute bottom-3 left-[18px] top-3 w-0.5 bg-cream-300" aria-hidden />
      {/* animated progress fill (top → current stage) */}
      <motion.div
        className="absolute left-[18px] top-3 w-0.5 origin-top"
        style={{ backgroundColor: color, bottom: "12px" }}
        initial={reduce ? false : { scaleY: 0 }}
        animate={{ scaleY: idx / Math.max(stages.length - 1, 1) }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        aria-hidden
      />

      <ul className="relative space-y-5">
        {stages.map((s, i) => {
          const done = i < idx;
          const current = i === idx;
          const Icon = s.Icon;
          return (
            <li key={s.k} className="flex items-center gap-4">
              <motion.span
                className="relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full border-2"
                style={{
                  backgroundColor: done || current ? color : "var(--color-surface)",
                  borderColor: done || current ? color : "var(--color-border)",
                  color: done || current ? "#fff" : "var(--color-muted-foreground)",
                }}
                initial={reduce ? false : { scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: reduce ? 0 : i * 0.06, type: "spring", stiffness: 400, damping: 18 }}
              >
                <Icon className="h-4 w-4" />
                {current && !reduce && (
                  <motion.span
                    className="absolute inset-0 rounded-full"
                    style={{ border: `2px solid ${color}` }}
                    animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
                  />
                )}
              </motion.span>
              <span
                className="font-display font-medium"
                style={{ color: done || current ? accent : "var(--color-muted-foreground)" }}
              >
                {s.label}
                {current && <span className="ml-2 text-xs font-normal text-choco-400">in progress</span>}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
