"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import {
  setOccasionEnabled,
  setCategoryEnabled,
  addCustomOccasion,
  removeCustomOccasion,
} from "../actions";

interface LibraryOccasion {
  id: string;
  name: string;
  category: string;
  sort_order: number;
}
interface BakeryOccasion {
  id: string;
  occasion_id: string | null;
  custom_name: string | null;
  is_enabled: boolean;
}

export function OccasionsManager({
  library,
  bakeryOccasions,
}: {
  library: LibraryOccasion[];
  bakeryOccasions: BakeryOccasion[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [customName, setCustomName] = useState("");

  const enabledMap = useMemo(() => {
    const m = new Map<string, boolean>();
    for (const bo of bakeryOccasions) {
      if (bo.occasion_id) m.set(bo.occasion_id, bo.is_enabled);
    }
    return m;
  }, [bakeryOccasions]);

  const customs = bakeryOccasions.filter((b) => b.occasion_id === null);

  const categories = useMemo(() => {
    const groups = new Map<string, LibraryOccasion[]>();
    for (const o of library) {
      const list = groups.get(o.category) ?? [];
      list.push(o);
      groups.set(o.category, list);
    }
    return Array.from(groups.entries());
  }, [library]);

  function run(fn: () => Promise<unknown>) {
    startTransition(async () => {
      await fn();
      router.refresh();
    });
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3">
        <h1 className="text-3xl">Occasions</h1>
        {pending && <Loader2 className="h-4 w-4 animate-spin text-gold-600" />}
      </div>
      <p className="mt-1 text-muted-foreground">
        Choose which occasions your storefront offers. Toggle a whole category or individual
        occasions, and add your own.
      </p>

      {/* Custom occasions */}
      <Card className="mt-6">
        <CardTitle>Your custom occasions</CardTitle>
        <CardDescription>Occasions specific to your bakery.</CardDescription>
        <div className="mt-4 flex flex-wrap gap-2">
          {customs.map((c) => (
            <span
              key={c.id}
              className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-3 py-1 text-sm text-rose-800"
            >
              {c.custom_name}
              <button
                onClick={() => run(() => removeCustomOccasion(c.id))}
                disabled={pending}
                aria-label={`Remove ${c.custom_name}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
          {customs.length === 0 && (
            <p className="text-sm text-muted-foreground">None yet.</p>
          )}
        </div>
        <div className="mt-4 flex gap-2">
          <Input
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="e.g. Company Founding Day"
            className="max-w-xs"
          />
          <Button
            variant="outline"
            disabled={pending || customName.trim().length < 2}
            onClick={() =>
              run(async () => {
                await addCustomOccasion(customName);
                setCustomName("");
              })
            }
          >
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>
      </Card>

      {/* Library by category */}
      <div className="mt-6 space-y-5">
        {categories.map(([category, occasions]) => {
          const enabledCount = occasions.filter((o) => enabledMap.get(o.id)).length;
          const allOn = enabledCount === occasions.length;
          return (
            <Card key={category}>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{category}</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {enabledCount} of {occasions.length} enabled
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={allOn ? "ghost" : "outline"}
                  disabled={pending}
                  onClick={() => run(() => setCategoryEnabled(category, !allOn))}
                >
                  {allOn ? "Disable all" : "Enable all"}
                </Button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {occasions.map((o) => {
                  const on = enabledMap.get(o.id) ?? false;
                  return (
                    <button
                      key={o.id}
                      disabled={pending}
                      onClick={() => run(() => setOccasionEnabled(o.id, !on))}
                      className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                        on
                          ? "border-gold-500 bg-gold-100 text-gold-800"
                          : "border-border text-choco-500 hover:border-gold-300"
                      }`}
                    >
                      {o.name}
                    </button>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
