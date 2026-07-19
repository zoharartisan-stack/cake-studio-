import { redirect } from "next/navigation";
import { getCurrentBakery } from "@/lib/tenant/get-bakery";
import { createClient } from "@/lib/supabase/server";
import { Builder } from "@/components/builder/builder";
import type { MenuItemLite, OccasionOption } from "@/lib/builder/steps";

export const metadata = { title: "Design a cake" };

export default async function DesignPage() {
  const bakery = await getCurrentBakery();
  if (!bakery) redirect("/");

  const supabase = await createClient();
  const [{ data: menu }, { data: occ }] = await Promise.all([
    supabase
      .from("menu_items")
      .select("id, category, name, price_minor, is_base_price")
      .eq("bakery_id", bakery.id)
      .eq("is_available", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("bakery_occasions")
      .select("id, custom_name, occasion_library(name)")
      .eq("bakery_id", bakery.id)
      .eq("is_enabled", true)
      .order("sort_order", { ascending: true }),
  ]);

  const occasions: OccasionOption[] = (occ ?? [])
    .map((o) => {
      const lib = o.occasion_library as unknown as { name: string } | null;
      const name = lib?.name ?? o.custom_name;
      return name ? { id: o.id, name } : null;
    })
    .filter((o): o is OccasionOption => o !== null);

  return (
    <Builder
      bakery={{
        id: bakery.id,
        name: bakery.name,
        currency: bakery.currency,
        locale: bakery.locale,
        primary_color: bakery.primary_color,
        secondary_color: bakery.secondary_color,
        accent_color: bakery.accent_color,
      }}
      menu={(menu ?? []) as MenuItemLite[]}
      occasions={occasions}
    />
  );
}
