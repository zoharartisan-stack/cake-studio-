import Link from "next/link";
import { redirect } from "next/navigation";
import { Sparkles, ArrowRight, CalendarHeart } from "lucide-react";
import { getCurrentBakery } from "@/lib/tenant/get-bakery";
import { createClient } from "@/lib/supabase/server";
import { Reveal } from "@/components/motion/reveal";
import { formatCurrency } from "@/lib/utils/format";
import { MENU_CATEGORIES } from "@/lib/onboarding/defaults";

export default async function StorefrontHome() {
  const bakery = await getCurrentBakery();
  if (!bakery) redirect("/");

  const supabase = await createClient();
  const [{ data: occ }, { data: menu }] = await Promise.all([
    supabase
      .from("bakery_occasions")
      .select("custom_name, occasion_library(name)")
      .eq("bakery_id", bakery.id)
      .eq("is_enabled", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("menu_items")
      .select("category, name, price_minor, is_base_price")
      .eq("bakery_id", bakery.id)
      .eq("is_available", true)
      .order("sort_order", { ascending: true }),
  ]);

  const occasions = (occ ?? [])
    .map((o) => {
      const lib = o.occasion_library as unknown as { name: string } | null;
      return lib?.name ?? o.custom_name ?? null;
    })
    .filter((n): n is string => Boolean(n));

  const menuItems = menu ?? [];
  const basePrice = menuItems.find((m) => m.is_base_price)?.price_minor;

  return (
    <main>
      {/* Hero */}
      <section
        className="relative overflow-hidden"
        style={{ backgroundColor: `${bakery.secondary_color}1a` }}
      >
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
          <Reveal>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-white"
              style={{ backgroundColor: bakery.secondary_color }}
            >
              <Sparkles className="h-3.5 w-3.5" /> Custom cakes, made for you
            </span>
          </Reveal>
          <Reveal delay={0.05}>
            <h1
              className="mt-5 max-w-2xl text-5xl leading-tight sm:text-6xl"
              style={{ color: bakery.accent_color }}
            >
              Design your dream cake with {bakery.name}
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-5 max-w-xl text-lg text-choco-500">
              {bakery.description ??
                "Pick your flavors, fillings, toppings and decorations — build it step by step and watch it come to life."}
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/design"
                className="inline-flex items-center gap-2 rounded-full px-6 py-3 font-display text-lg font-semibold text-white shadow-lift transition-transform hover:-translate-y-0.5"
                style={{ backgroundColor: bakery.primary_color }}
              >
                Start designing <ArrowRight className="h-5 w-5" />
              </Link>
              {basePrice !== undefined && (
                <span className="text-sm text-choco-500">
                  from{" "}
                  <span className="font-semibold" style={{ color: bakery.accent_color }}>
                    {formatCurrency(basePrice, bakery.currency, bakery.locale)}
                  </span>
                </span>
              )}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Occasions */}
      {occasions.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
          <Reveal>
            <h2 className="flex items-center gap-2 text-3xl" style={{ color: bakery.accent_color }}>
              <CalendarHeart className="h-6 w-6" style={{ color: bakery.secondary_color }} />
              For every occasion
            </h2>
          </Reveal>
          <Reveal delay={0.05}>
            <div className="mt-6 flex flex-wrap gap-2.5">
              {occasions.map((name) => (
                <span
                  key={name}
                  className="rounded-full border px-4 py-1.5 text-sm"
                  style={{ borderColor: `${bakery.primary_color}55`, color: bakery.accent_color }}
                >
                  {name}
                </span>
              ))}
            </div>
          </Reveal>
        </section>
      )}

      {/* Customize everything */}
      <section
        className="py-14"
        style={{ backgroundColor: `${bakery.primary_color}0f` }}
      >
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <Reveal>
            <h2 className="text-3xl" style={{ color: bakery.accent_color }}>
              Customize every detail
            </h2>
            <p className="mt-2 text-choco-500">
              Our step-by-step Cake Builder lets your customers choose from your menu.
            </p>
          </Reveal>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MENU_CATEGORIES.map((cat, i) => {
              const items = menuItems.filter((m) => m.category === cat.key);
              if (items.length === 0) return null;
              return (
                <Reveal key={cat.key} delay={i * 0.05}>
                  <div className="h-full rounded-xl border border-cream-300 bg-white p-5">
                    <h3 className="text-lg" style={{ color: bakery.accent_color }}>
                      {cat.label}
                    </h3>
                    <ul className="mt-2 space-y-1 text-sm text-choco-600">
                      {items.slice(0, 4).map((m) => (
                        <li key={m.name} className="flex justify-between gap-3">
                          <span>{m.name}</span>
                          <span className="text-choco-400">
                            {m.price_minor === 0
                              ? "included"
                              : `+${formatCurrency(m.price_minor, bakery.currency, bakery.locale)}`}
                          </span>
                        </li>
                      ))}
                      {items.length > 4 && (
                        <li className="text-xs text-choco-400">+{items.length - 4} more</li>
                      )}
                    </ul>
                  </div>
                </Reveal>
              );
            })}
          </div>
          <Reveal>
            <div className="mt-10 text-center">
              <Link
                href="/design"
                className="inline-flex items-center gap-2 rounded-full px-6 py-3 font-display text-lg font-semibold text-white shadow-lift transition-transform hover:-translate-y-0.5"
                style={{ backgroundColor: bakery.secondary_color }}
              >
                Build your cake <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
