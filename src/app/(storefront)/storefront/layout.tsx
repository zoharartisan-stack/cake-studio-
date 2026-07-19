import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentBakery } from "@/lib/tenant/get-bakery";
import { StorefrontHeader } from "@/components/storefront/header";
import { StorefrontFooter } from "@/components/storefront/footer";

export async function generateMetadata(): Promise<Metadata> {
  const bakery = await getCurrentBakery();
  if (!bakery) return { title: "Storefront" };
  return {
    title: { default: bakery.name, template: `%s · ${bakery.name}` },
    description: bakery.description ?? `Custom cakes from ${bakery.name}.`,
  };
}

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const bakery = await getCurrentBakery();
  if (!bakery) redirect("/");

  return (
    <div className="flex min-h-screen flex-col bg-white text-choco-800">
      <StorefrontHeader
        name={bakery.name}
        logoUrl={bakery.logo_url}
        primaryColor={bakery.primary_color}
      />
      <div className="flex-1">{children}</div>
      <StorefrontFooter bakery={bakery} />
    </div>
  );
}
