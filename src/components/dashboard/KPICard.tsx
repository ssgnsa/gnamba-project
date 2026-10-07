import { type LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface KPICardProps {
  label: string;
  value: string;
  subValue?: string;
  icon: LucideIcon;
  color: "teal" | "blue" | "emerald" | "amber" | "red" | "slate";
  trend?: number;
  trendLabel?: string;
}

const colorMap = {
  teal: { icon: "bg-teal-100 text-teal-700", accent: "bg-teal-500" },
  blue: { icon: "bg-sky-100 text-sky-700", accent: "bg-sky-500" },
  emerald: {
    icon: "bg-emerald-100 text-emerald-700",
    accent: "bg-emerald-500",
  },
  amber: { icon: "bg-amber-100 text-amber-700", accent: "bg-amber-500" },
  red: { icon: "bg-rose-100 text-rose-700", accent: "bg-rose-500" },
  slate: { icon: "bg-slate-100 text-slate-700", accent: "bg-slate-500" },
};

export default function KPICard({
  label,
  value,
  subValue,
  icon: Icon,
  color,
  trend,
  trendLabel,
}: KPICardProps) {
  const c = colorMap[color];

  const trendPositive = trend !== undefined && trend > 0;
  const trendNegative = trend !== undefined && trend < 0;

  return (
    <div className="relative rounded-2xl border border-slate-200 bg-white p-5 flex flex-col gap-3 overflow-hidden shadow-sm transition-shadow hover:shadow-md">
      <div className={`absolute inset-x-0 top-0 h-1 ${c.accent}`} />
      <div className="flex items-start justify-between">
        <div
          className={`w-10 h-10 rounded-xl ${c.icon} flex items-center justify-center flex-shrink-0`}
        >
          <Icon size={20} strokeWidth={2} />
        </div>
        {trend !== undefined && (
          <div
            className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
              trendPositive
                ? "bg-emerald-100 text-emerald-700"
                : trendNegative
                  ? "bg-red-100 text-red-700"
                  : "bg-slate-100 text-slate-500"
            }`}
          >
            {trendPositive ? (
              <TrendingUp size={11} />
            ) : trendNegative ? (
              <TrendingDown size={11} />
            ) : (
              <Minus size={11} />
            )}
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900 leading-tight">
          {value}
        </p>
        {subValue && (
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            {subValue}
          </p>
        )}
      </div>
      <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">
        {label}
      </p>
      {trendLabel && <p className="text-xs text-slate-400">{trendLabel}</p>}
    </div>
  );
}
