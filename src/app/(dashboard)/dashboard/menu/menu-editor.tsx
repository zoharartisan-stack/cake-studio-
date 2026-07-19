"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardTitle } from "@/components/ui/card";
import { MENU_CATEGORIES } from "@/lib/onboarding/defaults";
import type { Database } from "@/types/database.types";
import { saveMenuItem, deleteMenuItem } from "../actions";

type MenuItem = Database["public"]["Tables"]["menu_items"]["Row"];

export function MenuEditor({
  items,
  currency,
}: {
  items: MenuItem[];
  currency: string;
}) {
  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl">Menu &amp; Pricing</h1>
      <p className="mt-1 text-muted-foreground">
        Set which builder options you offer and the price of each. Prices are in {currency}.
      </p>

      <div className="mt-6 space-y-6">
        {MENU_CATEGORIES.map((cat) => (
          <Card key={cat.key}>
            <div className="flex items-center justify-between">
              <CardTitle>{cat.label}</CardTitle>
              <span className="text-xs text-muted-foreground">
                {cat.hasBase ? "sets the cake base price" : "add-on price"}
              </span>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="pb-2 font-medium">Option</th>
                    <th className="pb-2 font-medium">Price ({currency})</th>
                    <th className="pb-2 font-medium">Available</th>
                    <th className="pb-2" />
                  </tr>
                </thead>
                <tbody>
                  {items
                    .filter((i) => i.category === cat.key)
                    .map((item) => (
                      <MenuRow key={item.id} item={item} />
                    ))}
                  <AddRow category={cat.key} isBase={cat.hasBase} />
                </tbody>
              </table>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function MenuRow({ item }: { item: MenuItem }) {
  const router = useRouter();
  const [name, setName] = useState(item.name);
  const [price, setPrice] = useState((item.price_minor / 100).toString());
  const [available, setAvailable] = useState(item.is_available);
  const [busy, setBusy] = useState<"save" | "delete" | null>(null);

  async function save() {
    setBusy("save");
    await saveMenuItem({
      id: item.id,
      category: item.category,
      name: name.trim(),
      price_minor: Math.round(Number(price || 0) * 100),
      is_base_price: item.is_base_price,
      is_available: available,
    });
    setBusy(null);
    router.refresh();
  }

  async function remove() {
    setBusy("delete");
    await deleteMenuItem(item.id);
    setBusy(null);
    router.refresh();
  }

  return (
    <tr className="border-t border-border">
      <td className="py-2 pr-3">
        <Input value={name} onChange={(e) => setName(e.target.value)} className="h-9" />
      </td>
      <td className="py-2 pr-3">
        <Input
          type="number"
          min={0}
          step="1"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="h-9 w-28"
        />
      </td>
      <td className="py-2 pr-3">
        <input
          type="checkbox"
          checked={available}
          onChange={(e) => setAvailable(e.target.checked)}
          className="h-4 w-4 accent-gold-500"
        />
      </td>
      <td className="py-2 text-right">
        <div className="flex justify-end gap-1">
          <Button size="sm" variant="ghost" onClick={save} disabled={busy !== null} aria-label="Save">
            {busy === "save" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          </Button>
          <Button size="sm" variant="ghost" onClick={remove} disabled={busy !== null} aria-label="Delete">
            {busy === "delete" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-danger" />}
          </Button>
        </div>
      </td>
    </tr>
  );
}

function AddRow({ category, isBase }: { category: string; isBase: boolean }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [busy, setBusy] = useState(false);

  async function add() {
    if (name.trim().length < 1) return;
    setBusy(true);
    const res = await saveMenuItem({
      category,
      name: name.trim(),
      price_minor: Math.round(Number(price || 0) * 100),
      is_base_price: isBase,
      is_available: true,
    });
    setBusy(false);
    if (res.ok) {
      setName("");
      setPrice("");
      router.refresh();
    }
  }

  return (
    <tr className="border-t border-dashed border-border">
      <td className="py-2 pr-3">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="New option…" className="h-9" />
      </td>
      <td className="py-2 pr-3">
        <Input type="number" min={0} step="1" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" className="h-9 w-28" />
      </td>
      <td />
      <td className="py-2 text-right">
        <Button size="sm" variant="outline" onClick={add} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add
        </Button>
      </td>
    </tr>
  );
}
