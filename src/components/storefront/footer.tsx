import { MapPin, Phone, Mail } from "lucide-react";
import type { Bakery } from "@/lib/tenant/get-bakery";

export function StorefrontFooter({ bakery }: { bakery: Bakery }) {
  const place = [bakery.city, bakery.region, bakery.country].filter(Boolean).join(", ");
  return (
    <footer
      className="mt-16 py-10 text-sm"
      style={{ backgroundColor: bakery.accent_color, color: "#fff" }}
    >
      <div className="mx-auto grid max-w-6xl gap-6 px-5 sm:grid-cols-2 sm:px-8">
        <div>
          <p className="font-display text-lg font-semibold">{bakery.name}</p>
          {bakery.description && (
            <p className="mt-1 max-w-sm text-white/75">{bakery.description}</p>
          )}
        </div>
        <div className="space-y-1.5 text-white/80 sm:text-right">
          {place && (
            <p className="flex items-center gap-1.5 sm:justify-end">
              <MapPin className="h-4 w-4" /> {place}
            </p>
          )}
          {bakery.contact_phone && (
            <p className="flex items-center gap-1.5 sm:justify-end">
              <Phone className="h-4 w-4" /> {bakery.contact_phone}
            </p>
          )}
          {bakery.contact_email && (
            <p className="flex items-center gap-1.5 sm:justify-end">
              <Mail className="h-4 w-4" /> {bakery.contact_email}
            </p>
          )}
        </div>
      </div>
      <div className="mx-auto mt-8 max-w-6xl px-5 text-xs text-white/60 sm:px-8">
        Powered by CakeCraft Studio
      </div>
    </footer>
  );
}
