import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export const metadata = { title: "Owner Console — CakeCraft Studio" };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cream-50">
      <header className="border-b border-cream-300 bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gold-600 text-white">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <span className="font-display text-lg font-semibold text-choco-800">
              CakeCraft · Owner Console
            </span>
          </div>
          <Link href="/dashboard" className="text-sm text-choco-500 hover:underline">
            Baker dashboard →
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-8">{children}</main>
    </div>
  );
}
