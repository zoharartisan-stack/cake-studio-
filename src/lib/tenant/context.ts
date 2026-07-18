import { headers } from "next/headers";
import { TENANT_ID_HEADER, TENANT_SLUG_HEADER } from "./resolve";

export interface TenantContext {
  bakeryId: string;
  slug: string;
}

/**
 * Read the tenant resolved by proxy.ts for the current request. Returns null on
 * the root (SaaS marketing) domain or when no active tenant matched the host.
 *
 * IMPORTANT: this identifies the tenant for the request; it does NOT grant
 * access. Every query still runs under RLS scoped by bakery_id, so a mismatched
 * or spoofed header cannot read another tenant's rows.
 */
export async function getTenantContext(): Promise<TenantContext | null> {
  const h = await headers();
  const bakeryId = h.get(TENANT_ID_HEADER);
  const slug = h.get(TENANT_SLUG_HEADER);
  if (!bakeryId || !slug) return null;
  return { bakeryId, slug };
}
