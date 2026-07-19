import Link from "next/link";
import { ExternalLink, Palette, UtensilsCrossed, CalendarHeart, CheckCircle2 } from "lucide-react";
import { redirect } from "next/navigation";
import { getBakeryAccess } from "@/lib/auth/require-bakery";
import { createClient } from "@/lib/supabase/server";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";

export default async function DashboardOverview() {
  const access = await getBakeryAccess();
  if (!access) redirect("/login");

  const supabase = await createClient();
  const [{ data: bakery }, { count: menuCount }, { count: occasionCount }, { data: sub }] =
    await Promise.all([
      supabase.from("bakeries").select("*").eq("id", access.bakeryId).single(),
      supabase.from("menu_items").select("*", { count: "exact", head: true }).eq("bakery_id", access.bakeryId),
      supabase.from("bakery_occasions").select("*", { count: "exact", head: true }).eq("bakery_id", access.bakeryId).eq("is_enabled", true),
      supabase.from("bakery_subscriptions").select("tier, status").eq("bakery_id", access.bakeryId).maybeSingle(),
    ]);

  const url = `${access.bakerySlug}.${ROOT_DOMAIN}`;

  return (
    <div className="max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl">{access.bakeryName}</h1>
          <p className="mt-1 text-muted-foreground">Welcome back — here&apos;s your bakery at a glance.</p>
        </div>
        {bakery?.status === "active" && (
          <Badge tone="gold" className="gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" /> Live
          </Badge>
        )}
      </div>

      <Card className="mt-6">
        <CardTitle>Your storefront</CardTitle>
        <CardDescription>Share this address with your customers.</CardDescription>
        <a
          href={`http://${url}`}
          className="mt-3 inline-flex items-center gap-2 font-display text-lg text-gold-700 hover:underline"
        >
          {url} <ExternalLink className="h-4 w-4" />
        </a>
      </Card>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Plan" value={sub ? sub.tier : "—"} sub={sub?.status ?? ""} />
        <StatCard label="Menu items" value={String(menuCount ?? 0)} sub="across builder steps" />
        <StatCard label="Occasions on" value={String(occasionCount ?? 0)} sub="enabled" />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <QuickLink href="/dashboard/branding" icon={Palette} title="Branding" body="Logo, colors, subdomain" />
        <QuickLink href="/dashboard/menu" icon={UtensilsCrossed} title="Menu & Pricing" body="Options and prices" />
        <QuickLink href="/dashboard/occasions" icon={CalendarHeart} title="Occasions" body="Enable & customize" />
      </div>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <Card>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl capitalize text-choco-800">{value}</p>
      {sub && <p className="text-xs capitalize text-muted-foreground">{sub}</p>}
    </Card>
  );
}

function QuickLink({
  href,
  icon: Icon,
  title,
  body,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <Link href={href}>
      <Card className="h-full transition-shadow hover:shadow-lift">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
          <Icon className="h-5 w-5" />
        </span>
        <CardTitle className="mt-3 text-lg">{title}</CardTitle>
        <CardDescription>{body}</CardDescription>
      </Card>
    </Link>
  );
}
