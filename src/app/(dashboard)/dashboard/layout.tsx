import { redirect } from "next/navigation";
import { Cake, LogOut } from "lucide-react";
import { getBakeryAccess } from "@/lib/auth/require-bakery";
import { signOut } from "@/lib/auth/actions";
import { DashboardNav } from "./nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const access = await getBakeryAccess();
  if (!access) redirect("/login");

  return (
    <div className="min-h-screen bg-cream-100">
      <div className="mx-auto flex max-w-7xl flex-col md:flex-row">
        {/* Sidebar */}
        <aside className="border-b border-border bg-surface md:min-h-screen md:w-64 md:border-b-0 md:border-r">
          <div className="flex items-center gap-2 px-5 py-5">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-gold-500 text-white">
              <Cake className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-display text-sm font-semibold text-choco-800">
                {access.bakeryName}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {access.bakerySlug}
              </p>
            </div>
          </div>

          <DashboardNav />

          <form action={signOut} className="px-3 py-4">
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-choco-600 hover:bg-cream-200"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </form>
        </aside>

        {/* Content */}
        <main className="flex-1 px-5 py-8 md:px-10">{children}</main>
      </div>
    </div>
  );
}
