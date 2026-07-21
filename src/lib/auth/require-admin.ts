import "server-only";

import { createClient } from "@/lib/supabase/server";

export interface PlatformAdmin {
  userId: string;
  email: string;
}

/** The signed-in user if they are a platform admin, else null. */
export async function getPlatformAdmin(): Promise<PlatformAdmin | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("users")
    .select("id, email, role")
    .eq("id", user.id)
    .maybeSingle();
  if (error || !data || data.role !== "platform_admin") return null;
  return { userId: data.id, email: data.email };
}

/** Server-action guard: throws unless the caller is a platform admin. */
export async function requirePlatformAdmin(): Promise<PlatformAdmin> {
  const admin = await getPlatformAdmin();
  if (!admin) throw new Error("Forbidden: platform admins only.");
  return admin;
}
