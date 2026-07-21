"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, Pause, Play, Ban } from "lucide-react";
import { formatDate } from "@/lib/utils/format";
import { setBakeryStatus } from "./actions";

export interface TenantRow {
  id: string;
  name: string;
  slug: string;
  status: string;
  createdAt: string;
  customDomain: string | null;
  ownerEmail: string;
  subTier: string | null;
  subStatus: string | null;
}

const STATUS_STYLE: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  pending: "bg-gold-100 text-gold-800",
  suspended: "bg-rose-100 text-rose-800",
  cancelled: "bg-cream-200 text-choco-500",
};

type Action = { label: string; to: "active" | "suspended" | "cancelled"; Icon: typeof Check };

function actionsFor(status: string): Action[] {
  switch (status) {
    case "pending":
      return [
        { label: "Approve", to: "active", Icon: Check },
        { label: "Reject", to: "cancelled", Icon: Ban },
      ];
    case "active":
      return [
        { label: "Suspend", to: "suspended", Icon: Pause },
        { label: "Cancel", to: "cancelled", Icon: Ban },
      ];
    case "suspended":
      return [
        { label: "Reactivate", to: "active", Icon: Play },
        { label: "Cancel", to: "cancelled", Icon: Ban },
      ];
    default:
      return [{ label: "Reactivate", to: "active", Icon: Play }];
  }
}

export function TenantsTable({ tenants }: { tenants: TenantRow[] }) {
  if (tenants.length === 0) {
    return (
      <p className="mt-4 rounded-xl border border-cream-300 bg-surface p-6 text-sm text-muted-foreground">
        No bakeries yet. They appear here as owners sign up.
      </p>
    );
  }
  return (
    <div className="mt-4 overflow-x-auto rounded-xl border border-cream-300 bg-surface">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-cream-200 text-left text-xs uppercase tracking-wide text-choco-400">
            <th className="px-4 py-3">Bakery</th>
            <th className="px-4 py-3">Owner</th>
            <th className="px-4 py-3">Plan</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Manage</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-cream-200">
          {tenants.map((t) => (
            <Row key={t.id} t={t} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Row({ t }: { t: TenantRow }) {
  const router = useRouter();
  const [status, setStatus] = useState(t.status);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function change(to: TenantRow["status"]) {
    const prev = status;
    setStatus(to);
    setError(null);
    startTransition(async () => {
      const res = await setBakeryStatus(t.id, to as "active" | "suspended" | "cancelled");
      if (!res.ok) {
        setStatus(prev);
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <tr className="align-top">
      <td className="px-4 py-3">
        <div className="font-display font-medium text-choco-800">{t.name}</div>
        <div className="text-xs text-choco-400">
          {t.customDomain ?? `${t.slug}`} · joined {formatDate(t.createdAt, "en-US")}
        </div>
      </td>
      <td className="px-4 py-3 text-choco-600">{t.ownerEmail}</td>
      <td className="px-4 py-3 text-choco-600">
        {t.subTier ? (
          <span className="capitalize">
            {t.subTier}
            {t.subStatus ? <span className="text-choco-400"> · {t.subStatus}</span> : null}
          </span>
        ) : (
          <span className="text-choco-400">—</span>
        )}
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_STYLE[status] ?? "bg-cream-200 text-choco-600"}`}>
          {status}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          {actionsFor(status).map((a) => (
            <button
              key={a.to}
              onClick={() => change(a.to)}
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-lg border border-cream-300 px-2.5 py-1.5 text-xs font-medium text-choco-700 hover:bg-cream-100 disabled:opacity-50"
            >
              <a.Icon className="h-3.5 w-3.5" /> {a.label}
            </button>
          ))}
          {pending && <Loader2 className="h-4 w-4 animate-spin text-gold-600" />}
        </div>
        {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      </td>
    </tr>
  );
}
