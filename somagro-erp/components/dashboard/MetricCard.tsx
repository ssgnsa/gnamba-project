interface MetricCardProps {
  label: string;
  value: string | number;
  change?: string;
  helper?: string;
  tone?: "emerald" | "amber" | "sky" | "rose";
}

const toneStyles: Record<
  NonNullable<MetricCardProps["tone"]>,
  { badge: string; dot: string }
> = {
  emerald: { badge: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-400" },
  amber: { badge: "bg-amber-50 text-amber-700", dot: "bg-amber-400" },
  sky: { badge: "bg-sky-50 text-sky-700", dot: "bg-sky-400" },
  rose: { badge: "bg-rose-50 text-rose-700", dot: "bg-rose-400" },
};

export function MetricCard({
  label,
  value,
  change,
  helper,
  tone = "emerald",
}: MetricCardProps) {
  const toneStyle = toneStyles[tone];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500 truncate sm:text-xs sm:tracking-[0.2em]">
          {label}
        </p>
        {change ? (
          <span
            className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.15em] whitespace-nowrap sm:px-2 sm:py-1 sm:text-[10px] sm:tracking-[0.2em] ${toneStyle.badge}`}
          >
            {change}
          </span>
        ) : null}
      </div>
      <div className="mt-2 flex items-center gap-2 sm:mt-3">
        <span
          className={`h-1.5 w-1.5 rounded-full sm:h-2 sm:w-2 ${toneStyle.dot}`}
        />
        <p className="text-xl font-semibold text-slate-900 sm:text-2xl">
          {value}
        </p>
      </div>
      {helper ? (
        <p className="mt-1.5 text-[11px] text-slate-500 sm:mt-2 sm:text-xs">
          {helper}
        </p>
      ) : null}
    </div>
  );
}
