/** Locale-neutral currency display (API amounts are decimal strings). */
export function formatLoanCurrency(amount: string | number | null | undefined): string {
  if (amount === null || amount === undefined || amount === "") return "—";
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  if (Number.isNaN(n)) return String(amount);
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export function formatLoanDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatLoanDateTime(ts: string | null | undefined): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
