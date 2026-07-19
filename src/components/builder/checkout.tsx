"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, X, PartyPopper, Truck, Store, CreditCard, Wallet } from "lucide-react";
import { Input, Label } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils/format";
import { useReducedMotionSafe } from "@/hooks/use-reduced-motion-safe";
import type { BuilderStep, Selections } from "@/lib/builder/steps";
import { placeOrder } from "@/app/(storefront)/storefront/design/actions";

interface CheckoutProps {
  bakery: {
    name: string;
    currency: string;
    locale: string;
    primary_color: string;
    secondary_color: string;
    accent_color: string;
  };
  steps: BuilderStep[];
  selections: Selections;
  subtotal: number;
  onClose: () => void;
}

function optName(steps: BuilderStep[], category: string, sel: Selections): string | undefined {
  const step = steps.find((s) => s.category === category);
  const v = sel[category];
  const id = Array.isArray(v) ? v[0] : v;
  return step?.options?.find((o) => o.id === id)?.name;
}

export function Checkout({ bakery, steps, selections, subtotal, onClose }: CheckoutProps) {
  const reduce = useReducedMotionSafe();
  const [fulfillment, setFulfillment] = useState<"delivery" | "pickup">("delivery");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [date, setDate] = useState((selections["date"] as string) ?? "");
  const [payment] = useState<"cash_on_delivery">("cash_on_delivery");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ orderNumber: string; total: number } | null>(null);

  const size = optName(steps, "size", selections);
  const flavor = optName(steps, "flavor", selections);
  const message = (selections["message"] as string) ?? "";
  const slotName = steps
    .find((s) => s.kind === "date")
    ?.options?.find((o) => o.id === selections["date_slot"])?.name;

  async function handlePlace() {
    setError(null);
    setBusy(true);
    try {
      const res = await placeOrder({
        selections,
        designName: [size, flavor].filter(Boolean).join(" · ") || "Custom Cake",
        fulfillment,
        name,
        phone,
        addressLine,
        city,
        deliveryDate: date,
        deliverySlot: slotName ?? "",
        paymentMethod: payment,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setDone({ orderNumber: res.orderNumber, total: res.totalMinor });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <motion.div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={done ? undefined : onClose}
      />
      <motion.aside
        className="relative flex h-full w-full max-w-md flex-col overflow-y-auto bg-cream-50 shadow-lift"
        initial={reduce ? false : { x: "100%" }}
        animate={{ x: 0 }}
        exit={reduce ? undefined : { x: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 34 }}
      >
        <AnimatePresence mode="wait">
          {done ? (
            <Confirmation
              key="done"
              bakery={bakery}
              orderNumber={done.orderNumber}
              total={done.total}
              reduce={reduce}
            />
          ) : (
            <motion.div key="form" exit={reduce ? undefined : { opacity: 0 }} className="flex flex-1 flex-col">
              <header className="flex items-center justify-between border-b border-cream-300 px-5 py-4">
                <h2 className="text-xl" style={{ color: bakery.accent_color }}>Checkout</h2>
                <button onClick={onClose} aria-label="Close checkout"><X className="h-5 w-5 text-choco-500" /></button>
              </header>

              <div className="flex-1 space-y-6 px-5 py-5">
                {/* Summary */}
                <div className="rounded-xl border border-cream-300 bg-surface p-4">
                  <p className="text-sm font-medium text-choco-700">Your cake</p>
                  <ul className="mt-2 space-y-0.5 text-sm text-choco-500">
                    {size && <li>Size · {size}</li>}
                    {flavor && <li>Flavor · {flavor}</li>}
                    {message && <li>Message · “{message}”</li>}
                  </ul>
                  <div className="mt-3 flex items-center justify-between border-t border-cream-200 pt-3">
                    <span className="text-sm text-choco-500">Total</span>
                    <span className="font-display text-lg font-semibold" style={{ color: bakery.accent_color }}>
                      {formatCurrency(subtotal, bakery.currency, bakery.locale)}
                    </span>
                  </div>
                </div>

                {/* Fulfillment */}
                <div>
                  <Label>How would you like it?</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["delivery", "pickup"] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setFulfillment(f)}
                        className="flex items-center justify-center gap-2 rounded-lg border-2 py-2.5 text-sm font-medium capitalize"
                        style={fulfillment === f
                          ? { borderColor: bakery.primary_color, color: bakery.accent_color }
                          : { borderColor: "var(--color-border)", color: "var(--color-muted-foreground)" }}
                      >
                        {f === "delivery" ? <Truck className="h-4 w-4" /> : <Store className="h-4 w-4" />} {f}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Contact */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="cname">Your name</Label>
                    <Input id="cname" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="cphone">Phone</Label>
                    <Input id="cphone" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" />
                  </div>
                  {fulfillment === "delivery" && (
                    <>
                      <div>
                        <Label htmlFor="caddr">Delivery address</Label>
                        <Input id="caddr" value={addressLine} onChange={(e) => setAddress(e.target.value)} />
                      </div>
                      <div>
                        <Label htmlFor="ccity">City</Label>
                        <Input id="ccity" value={city} onChange={(e) => setCity(e.target.value)} />
                      </div>
                    </>
                  )}
                  <div>
                    <Label htmlFor="cdate">Needed by</Label>
                    <Input id="cdate" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                  </div>
                </div>

                {/* Payment */}
                <div>
                  <Label>Payment</Label>
                  <div className="space-y-2">
                    <div
                      className="flex items-center gap-2 rounded-lg border-2 px-3 py-2.5 text-sm"
                      style={{ borderColor: bakery.primary_color, color: bakery.accent_color }}
                    >
                      <Wallet className="h-4 w-4" /> Cash on Delivery
                    </div>
                    <div className="flex items-center justify-between gap-2 rounded-lg border-2 border-border px-3 py-2.5 text-sm text-muted-foreground">
                      <span className="flex items-center gap-2"><CreditCard className="h-4 w-4" /> Card (Stripe)</span>
                      <span className="text-xs">Coming soon</span>
                    </div>
                  </div>
                </div>

                {error && <p className="text-sm text-danger">{error}</p>}
              </div>

              <footer className="sticky bottom-0 border-t border-cream-300 bg-cream-50 px-5 py-4">
                <button
                  onClick={handlePlace}
                  disabled={busy}
                  className="flex w-full items-center justify-center gap-2 rounded-lg py-3 font-display font-semibold text-white shadow-soft disabled:opacity-60"
                  style={{ backgroundColor: bakery.primary_color }}
                >
                  {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <PartyPopper className="h-5 w-5" />}
                  Place order · {formatCurrency(subtotal, bakery.currency, bakery.locale)}
                </button>
              </footer>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.aside>
    </div>
  );
}

function Confirmation({
  bakery,
  orderNumber,
  total,
  reduce,
}: {
  bakery: CheckoutProps["bakery"];
  orderNumber: string;
  total: number;
  reduce: boolean;
}) {
  return (
    <motion.div
      key="done"
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative flex flex-1 flex-col items-center justify-center px-6 py-10 text-center"
    >
      {!reduce && <Confetti colors={[bakery.primary_color, bakery.secondary_color, "#ffd36e"]} />}
      <motion.div
        initial={reduce ? false : { scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 380, damping: 16 }}
        className="grid h-20 w-20 place-items-center rounded-full text-white"
        style={{ backgroundColor: bakery.primary_color }}
      >
        <PartyPopper className="h-10 w-10" />
      </motion.div>
      <h2 className="mt-6 text-3xl" style={{ color: bakery.accent_color }}>Order placed! 🎉</h2>
      <p className="mt-2 text-choco-500">{bakery.name} will confirm your order shortly.</p>
      <div className="mt-6 w-full rounded-xl border border-cream-300 bg-surface p-5">
        <p className="text-sm text-choco-400">Order number</p>
        <p className="font-display text-xl font-semibold" style={{ color: bakery.accent_color }}>{orderNumber}</p>
        <p className="mt-3 text-sm text-choco-400">Total (Cash on Delivery)</p>
        <p className="font-display text-lg" style={{ color: bakery.accent_color }}>
          {formatCurrency(total, bakery.currency, bakery.locale)}
        </p>
      </div>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-2 rounded-full px-6 py-3 font-display font-semibold text-white"
        style={{ backgroundColor: bakery.secondary_color }}
      >
        Back to {bakery.name}
      </Link>
    </motion.div>
  );
}

function Confetti({ colors }: { colors: string[] }) {
  const pieces = Array.from({ length: 36 });
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((_, i) => {
        const left = (i * 37) % 100;
        const delay = (i % 6) * 0.05;
        const color = colors[i % colors.length];
        const rotate = (i * 47) % 360;
        return (
          <motion.span
            key={i}
            className="absolute top-1/3 h-2 w-2"
            style={{ left: `${left}%`, backgroundColor: color, borderRadius: i % 2 ? "9999px" : "2px" }}
            initial={{ y: 0, opacity: 1, rotate: 0 }}
            animate={{ y: 420, opacity: 0, rotate }}
            transition={{ duration: 0.9, delay, ease: "easeOut" }}
          />
        );
      })}
    </div>
  );
}
