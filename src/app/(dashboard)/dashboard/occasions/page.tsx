import { redirect } from "next/navigation";
import { getBakeryAccess } from "@/lib/auth/require-bakery";
import { createClient } from "@/lib/supabase/server";
import { OccasionsManager } from "./occasions-manager";

export const metadata = { title: "Occasions" };

export default async function OccasionsPage() {
  const access = await getBakeryAccess();
  if (!access) redirect("/login");

  const supabase = await createClient();
  const [{ data: library }, { data: bakeryOccasions }] = await Promise.all([
    supabase
      .from("occasion_library")
      .select("id, name, category, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("bakery_occasions")
      .select("id, occasion_id, custom_name, is_enabled")
      .eq("bakery_id", access.bakeryId),
  ]);

  return (
    <OccasionsManager
      library={library ?? []}
      bakeryOccasions={bakeryOccasions ?? []}
    />
  );
}
