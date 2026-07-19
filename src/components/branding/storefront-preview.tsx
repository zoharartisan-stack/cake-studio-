"use client";

import { Cake, ShoppingBag, Star } from "lucide-react";

export interface BrandPreview {
  name: string;
  logoUrl?: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

/**
 * Live mini-storefront that re-renders instantly as branding inputs change.
 * Used in the signup Branding step and the dashboard Branding panel. Colors are
 * applied as inline styles so typing a new hex updates the preview in realtime.
 */
export function StorefrontPreview({
  name,
  logoUrl,
  primaryColor,
  secondaryColor,
  accentColor,
}: BrandPreview) {
  const displayName = name.trim() || "Your Bakery";

  return (
    <div className="overflow-hidden rounded-xl border border-border shadow-card">
      <div className="flex items-center justify-between bg-cream-200 px-3 py-1.5">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-gold-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-choco-200" />
        </div>
        <span className="text-[10px] text-muted-foreground">live preview</span>
      </div>

      <div style={{ backgroundColor: "#fff" }}>
        {/* Header */}
        <header
          className="flex items-center justify-between px-4 py-3"
          style={{ backgroundColor: primaryColor }}
        >
          <div className="flex items-center gap-2">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt="logo"
                className="h-8 w-8 rounded-full object-cover ring-2 ring-white/50"
              />
            ) : (
              <span className="grid h-8 w-8 place-items-center rounded-full bg-white/25 text-white">
                <Cake className="h-4 w-4" />
              </span>
            )}
            <span className="font-display text-base font-semibold text-white drop-shadow-sm">
              {displayName}
            </span>
          </div>
          <ShoppingBag className="h-4 w-4 text-white/90" />
        </header>

        {/* Hero */}
        <div className="px-4 py-5" style={{ backgroundColor: "#fffdfb" }}>
          <h4 className="font-display text-lg" style={{ color: accentColor }}>
            Design your dream cake
          </h4>
          <p className="mt-1 text-xs text-choco-500">
            Fresh, custom cakes from {displayName}.
          </p>
          <button
            className="mt-3 rounded-full px-4 py-1.5 text-xs font-semibold text-white shadow"
            style={{ backgroundColor: secondaryColor }}
          >
            Start designing
          </button>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-3 gap-2 px-4 pb-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-lg border p-2"
              style={{ borderColor: `${primaryColor}33` }}
            >
              <div
                className="mb-1.5 grid h-10 place-items-center rounded"
                style={{ backgroundColor: `${secondaryColor}22` }}
              >
                <Cake className="h-4 w-4" style={{ color: primaryColor }} />
              </div>
              <div className="flex items-center gap-0.5">
                <Star className="h-2.5 w-2.5" style={{ color: accentColor }} />
                <span className="text-[9px] text-choco-500">Signature</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
