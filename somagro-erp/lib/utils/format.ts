export function formatNumber(value: number | null | undefined) {
  const safe = Number(value ?? 0);
  if (!Number.isFinite(safe)) return "0";
  return new Intl.NumberFormat("fr-FR").format(safe);
}

export function formatCurrency(value: number | null | undefined) {
  const safe = Number(value ?? 0);
  if (!Number.isFinite(safe)) return "0 FCFA";
  return `${formatNumber(Math.round(safe))} FCFA`;
}

export function formatPercent(value: number | null | undefined, decimals = 0) {
  const safe = Number(value ?? 0);
  if (!Number.isFinite(safe)) return "0%";
  const rounded =
    decimals > 0 ? safe.toFixed(decimals) : Math.round(safe).toString();
  return `${rounded}%`;
}

export function formatDate(value?: string | null) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleDateString("fr-FR");
}

export function toDateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}
