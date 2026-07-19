"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Palette, UtensilsCrossed, CalendarHeart } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const LINKS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/branding", label: "Branding", icon: Palette },
  { href: "/dashboard/menu", label: "Menu & Pricing", icon: UtensilsCrossed },
  { href: "/dashboard/occasions", label: "Occasions", icon: CalendarHeart },
];

export function DashboardNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto px-3 pb-2 md:flex-col md:overflow-visible md:pb-0">
      {LINKS.map((l) => {
        const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-gold-100 text-gold-800"
                : "text-choco-600 hover:bg-cream-200",
            )}
          >
            <l.icon className="h-4 w-4" /> {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
