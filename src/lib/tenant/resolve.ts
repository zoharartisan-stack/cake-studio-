import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/**
 * Tenant resolution: map an incoming hostname to a bakery (tenant).
 *
 * Hosting model:
 *   - Root domain (NEXT_PUBLIC_ROOT_DOMAIN) + `www` → the CakeCraft SaaS site.
 *   - `<slug>.<root>` subdomain → that bakery's storefront.
 *   - Any other host → treated as a bakery's custom domain.
 *
 * The resolved bakery_id is attached to the request via these headers by
 * proxy.ts; server code reads them through `getTenantContext()`.
 */

export const TENANT_ID_HEADER = "x-bakery-id";
export const TENANT_SLUG_HEADER = "x-bakery-slug";

export type HostKind = "root" | "subdomain" | "custom";

export interface ParsedHost {
  kind: HostKind;
  /** Subdomain label when kind === "subdomain". */
  slug?: string;
  /** Bare hostname (no port) when kind === "custom". */
  host?: string;
}

function stripPort(host: string): string {
  return host.split(":")[0].trim().toLowerCase();
}

/** Classify a hostname relative to the configured root domain. */
export function parseHost(host: string | null, rootDomain: string): ParsedHost {
  if (!host) return { kind: "root" };
  const h = stripPort(host);
  const root = stripPort(rootDomain);

  if (h === root || h === `www.${root}` || h === "localhost") {
    return { kind: "root" };
  }

  if (h.endsWith(`.${root}`)) {
    const sub = h.slice(0, -(root.length + 1));
    if (!sub || sub === "www") return { kind: "root" };
    // Use the left-most label as the tenant slug.
    return { kind: "subdomain", slug: sub.split(".")[0] };
  }

  return { kind: "custom", host: h };
}

export interface ResolvedTenant {
  id: string;
  slug: string;
  name: string;
  status: Database["public"]["Enums"]["bakery_status"];
}

/**
 * Look up an ACTIVE bakery for a parsed host. Returns null when the host maps
 * to no active tenant. Relies on the public RLS read policy for active
 * bakeries, so a plain anon client is sufficient.
 */
export async function resolveBakery(
  supabase: SupabaseClient<Database>,
  parsed: ParsedHost,
): Promise<ResolvedTenant | null> {
  let query = supabase
    .from("bakeries")
    .select("id, slug, name, status")
    .eq("status", "active")
    .limit(1);

  if (parsed.kind === "subdomain" && parsed.slug) {
    query = query.eq("slug", parsed.slug);
  } else if (parsed.kind === "custom" && parsed.host) {
    query = query.eq("custom_domain", parsed.host);
  } else {
    return null;
  }

  const { data, error } = await query.maybeSingle();
  if (error || !data) return null;
  return data as ResolvedTenant;
}
