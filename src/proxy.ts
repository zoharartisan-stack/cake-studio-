import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import {
  TENANT_ID_HEADER,
  TENANT_SLUG_HEADER,
  parseHost,
  resolveBakery,
} from "@/lib/tenant/resolve";

/**
 * Next 16 Proxy (formerly `middleware.ts` — renamed and Node-runtime by default
 * in v16). Runs before every matched request and does two jobs:
 *
 *   1. TENANT RESOLUTION + REWRITE — map the hostname to an active bakery,
 *      attach its bakery_id to the request (headers `x-bakery-id` /
 *      `x-bakery-slug`), and rewrite tenant (subdomain / custom-domain)
 *      requests into the internal `/storefront` route namespace. The root
 *      domain keeps serving the marketing site + dashboard. Requests to an
 *      unknown/inactive tenant host redirect to the root SaaS site. This
 *      identifies the tenant; RLS still enforces isolation.
 *
 *   2. SUPABASE SESSION REFRESH — keep the auth cookies fresh so Server
 *      Components see the signed-in user (@supabase/ssr requirement).
 *
 * If Supabase env vars are absent (e.g. a bare local checkout), it degrades to
 * a pass-through so the app still runs.
 */

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  // Never let a client spoof the tenant headers — strip any inbound values.
  requestHeaders.delete(TENANT_ID_HEADER);
  requestHeaders.delete(TENANT_SLUG_HEADER);

  const parsed = parseHost(request.headers.get("host"), ROOT_DOMAIN);
  const { pathname } = request.nextUrl;

  // Without Supabase configured we can't resolve tenants or refresh sessions.
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // --- 1. Tenant resolution + rewrite target --------------------------------
  // For a tenant host, all requests are rewritten into /storefront/*.
  let rewriteUrl: URL | null = null;

  if (parsed.kind !== "root") {
    const lookup = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const bakery = await resolveBakery(lookup, parsed);

    if (!bakery) {
      // Host expected a tenant but none is active — send to the SaaS root.
      const url = request.nextUrl.clone();
      url.protocol = "https:";
      url.host = ROOT_DOMAIN;
      url.pathname = "/";
      url.searchParams.set("unknown_tenant", "1");
      return NextResponse.redirect(url);
    }

    requestHeaders.set(TENANT_ID_HEADER, bakery.id);
    requestHeaders.set(TENANT_SLUG_HEADER, bakery.slug);

    // Avoid double-prefixing if already inside the namespace.
    if (!pathname.startsWith("/storefront")) {
      rewriteUrl = request.nextUrl.clone();
      rewriteUrl.pathname = `/storefront${pathname === "/" ? "" : pathname}`;
    }
  } else if (pathname.startsWith("/storefront")) {
    // /storefront is internal-only; block direct access on the root domain.
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  const build = () =>
    rewriteUrl
      ? NextResponse.rewrite(rewriteUrl, { request: { headers: requestHeaders } })
      : NextResponse.next({ request: { headers: requestHeaders } });

  // --- 2. Supabase auth session refresh -------------------------------------
  let response = build();

  const supabase = createServerClient<Database>(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = build();
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Touch the session so expired tokens refresh into the response cookies.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  // Run on everything except Next internals and static assets.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|illustrations|backgrounds|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
