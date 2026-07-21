import { redirect } from "next/navigation";
import { getCurrentBakery } from "@/lib/tenant/get-bakery";
import { TrackView } from "./track-view";

export const metadata = { title: "Track your order" };
export const dynamic = "force-dynamic";

export default async function TrackPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const bakery = await getCurrentBakery();
  if (!bakery) redirect("/");
  const sp = await searchParams;
  const o = sp?.o;
  const initial = typeof o === "string" ? o : "";

  return (
    <TrackView
      bakery={{
        name: bakery.name,
        currency: bakery.currency,
        locale: bakery.locale,
        primary_color: bakery.primary_color,
        secondary_color: bakery.secondary_color,
        accent_color: bakery.accent_color,
      }}
      initialOrder={initial}
    />
  );
}
