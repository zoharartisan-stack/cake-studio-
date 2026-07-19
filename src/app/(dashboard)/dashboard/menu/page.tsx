import { redirect } from "next/navigation";
import { getBakeryAccess } from "@/lib/auth/require-bakery";
import { createClient } from "@/lib/supabase/server";
import { MenuEditor } from "./menu-editor";

export const metadata = { title: "Menu & Pricing" };

export default async function MenuPage() {
  const access = await getBakeryAccess();
  if (!access) redirect("/login");

  const supabase = await createClient();
  const [{ data: items }, { data: bakery }] = await Promise.all([
    supabase
      .from("menu_items")
      .select("*")
      .eq("bakery_id", access.bakeryId)
      .order("category", { ascending: true })
      .order("sort_order", { ascending: true }),
    supabase.from("bakeries").select("currency").eq("id", access.bakeryId).single(),
  ]);

  return (
    <MenuEditor items={items ?? []} currency={bakery?.currency ?? "PKR"} />
  );
}
