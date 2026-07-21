import Link from "next/link";
import { Cake, ShoppingBag } from "lucide-react";

/**
 * Per-tenant storefront header. Colors come from the bakery's brand palette
 * (passed as props / CSS vars), not the platform design system.
 */
export function StorefrontHeader({
  name,
  logoUrl,
  primaryColor,
}: {
  name: string;
  logoUrl: string | null;
  primaryColor: string;
}) {
  return (
    <header
      className="sticky top-0 z-40 shadow-sm"
      style={{ backgroundColor: primaryColor }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={`${name} logo`}
              className="h-9 w-9 rounded-full object-cover ring-2 ring-white/40"
            />
          ) : (
            <span className="grid h-9 w-9 place-items-center rounded-full bg-white/25 text-white">
              <Cake className="h-5 w-5" />
            </span>
          )}
          <span className="font-display text-lg font-semibold text-white drop-shadow-sm">
            {name}
          </span>
        </Link>
        <nav className="flex items-center gap-5 text-sm font-medium text-white/90">
          <Link href="/" className="hidden hover:text-white sm:inline">
            Home
          </Link>
          <Link href="/design" className="hidden hover:text-white sm:inline">
            Design a cake
          </Link>
          <button aria-label="Cart" className="text-white/90 hover:text-white">
            <ShoppingBag className="h-5 w-5" />
          </button>
        </nav>
      </div>
    </header>
  );
}
