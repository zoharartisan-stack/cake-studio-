/**
 * Formatting helpers. Currency/locale are per-bakery settings (the platform is
 * market-agnostic), so callers pass the tenant's currency & locale explicitly.
 * Defaults are provided only for previews and the marketing site.
 */

export function formatCurrency(
  amountMinor: number,
  currency = "PKR",
  locale = "en-PK",
): string {
  // Amounts are stored in minor units (e.g. paisa/cents) to avoid float drift.
  const amount = amountMinor / 100;
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function formatDate(
  date: string | number | Date,
  locale = "en-PK",
): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
  }).format(new Date(date));
}
