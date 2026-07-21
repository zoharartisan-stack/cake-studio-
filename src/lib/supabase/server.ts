import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database.types";
import { publicEnv, requireEnv } from "@/lib/env";

/**
 * Server Supabase client bound to the request's cookies (anon key + user
 * session; RLS applies). Use in Server Components, Route Handlers, and Server
 * Actions. In Next 16 `cookies()` is async, so this factory is async too.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL", publicEnv.NEXT_PUBLIC_SUPABASE_URL),
    requireEnv(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component (cookies are read-only there).
            // Session refresh is handled by proxy.ts, so this is safe to ignore.
          }
        },
      },
    },
  );
}
