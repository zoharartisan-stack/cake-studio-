import Link from "next/link";
import { redirect } from "next/navigation";
import { Cake, ArrowLeft } from "lucide-react";
import { getCurrentBakery } from "@/lib/tenant/get-bakery";

export const metadata = { title: "Design a cake" };

export default async function DesignPage() {
  const bakery = await getCurrentBakery();
  if (!bakery) redirect("/");

  return (
    <main className="mx-auto max-w-2xl px-5 py-24 text-center sm:px-8">
      <span
        className="mx-auto grid h-20 w-20 place-items-center rounded-full text-white"
        style={{ backgroundColor: bakery.primary_color }}
      >
        <Cake className="h-10 w-10" />
      </span>
      <h1 className="mt-6 text-4xl" style={{ color: bakery.accent_color }}>
        The Cake Builder is coming soon
      </h1>
      <p className="mt-3 text-choco-500">
        This is where the full 16-step, animated Cake Builder will live — pulling
        options and prices from {bakery.name}&apos;s menu, with a live preview and
        server-side pricing. (Next phase.)
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-medium text-white"
        style={{ backgroundColor: bakery.secondary_color }}
      >
        <ArrowLeft className="h-4 w-4" /> Back to {bakery.name}
      </Link>
    </main>
  );
}
