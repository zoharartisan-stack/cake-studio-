import { redirect } from "next/navigation";
import { getBakeryAccess } from "@/lib/auth/require-bakery";
import { createClient } from "@/lib/supabase/server";
import { BrandingPanel } from "./branding-panel";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";

export const metadata = { title: "Branding" };

export default async function BrandingPage() {
  const access = await getBakeryAccess();
  if (!access) redirect("/login");

  const supabase = await createClient();
  const { data: bakery } = await supabase
    .from("bakeries")
    .select("*")
    .eq("id", access.bakeryId)
    .single();
  if (!bakery) redirect("/login");

  return <BrandingPanel bakery={bakery} rootDomain={ROOT_DOMAIN} />;
}
