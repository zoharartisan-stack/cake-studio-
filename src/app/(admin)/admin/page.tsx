import { redirect } from "next/navigation";
import { getPlatformAdmin } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";
import { TenantsTable, type TenantRow } from "./tenants-table";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const admin = await getPlatformAdmin();
  if (!admin) redirect("/login");

  const supabase = await createClient();

  const [{ data: bakeries }, { count: orderCount }] = await Promise.all([
    supabase
      .from("bakeries")
      .select("id, name, slug, status, created_at, custom_domain, owner_id, bakery_subscriptions(tier, status)")
      .order("created_at", { ascending: false }),
    supabase.from("orders").select("*", { count: "exact", head: true }),
  ]);

  const list = bakeries ?? [];
  const ownerIds = [...new Set(list.map((b) => b.owner_id).filter(Boolean))];
  let owners: { id: string; email: string }[] = [];
  if (ownerIds.length) {
    const { data } = await supabase.from("users").select("id, email").in("id", ownerIds);
    owners = data ?? [];
  }
  const emailById = new Map(owners.map((u) => [u.id, u.email]));

  const tenants: TenantRow[] = list.map((b) => {
    const sub = (b.bakery_subscriptions as unknown as { tier: string; status: string }[] | null)?.[0];
    return {
      id: b.id,
      name: b.name,
      slug: b.slug,
      status: b.status,
      createdAt: b.created_at,
      customDomain: b.custom_domain,
      ownerEmail: emailById.get(b.owner_id) ?? "—",
      subTier: sub?.tier ?? null,
      subStatus: sub?.status ?? null,
    };
  });

  const total = tenants.length;
  const active = tenants.filter((t) => t.status === "active").length;
  const pending = tenants.filter((t) => t.status === "pending").length;

  return (
    <div>
      <h1 className="text-3xl text-choco-900">Platform overview</h1>
      <p className="mt-1 text-muted-foreground">
        Signed in as {admin.email}. Manage every bakery on CakeCraft.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        <Stat label="Bakeries" value={total} />
        <Stat label="Active" value={active} tone="good" />
        <Stat label="Pending" value={pending} tone={pending ? "warn" : "muted"} />
        <Stat label="Orders (all)" value={orderCount ?? 0} />
      </div>

      <h2 className="mt-10 text-xl text-choco-900">Bakeries</h2>
      <TenantsTable tenants={tenants} />
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "muted",
}: {
  label: string;
  value: number;
  tone?: "good" | "warn" | "muted";
}) {
  const color =
    tone === "good" ? "text-green-700" : tone === "warn" ? "text-gold-700" : "text-choco-800";
  return (
    <div className="rounded-xl border border-cream-300 bg-surface p-4">
      <p className="text-xs uppercase tracking-wide text-choco-400">{label}</p>
      <p className={`mt-1 font-display text-3xl font-semibold tabular-nums ${color}`}>{value}</p>
    </div>
  );
}
