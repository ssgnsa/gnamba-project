import type { ReactNode } from "react";

interface RotatingCardProps {
  title: string;
  metric: string;
  label: string;
  hint: string;
  backTitle: string;
  backItems: string[];
  accentClass?: string;
  icon?: ReactNode;
}

export function RotatingCard({
  title,
  metric,
  label,
  hint,
  backTitle,
  backItems,
  accentClass = "from-emerald-500 to-lime-500",
  icon,
}: RotatingCardProps) {
  return (
    <div className="rotating-card group h-full">
      <div className="rotating-card-inner relative h-full min-h-[240px] rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="rotating-card-face flex h-full flex-col justify-between rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                {label}
              </p>
              <h3 className="mt-3 text-xl font-semibold text-slate-900">
                {title}
              </h3>
            </div>
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${accentClass} text-white shadow-lg`}
            >
              {icon}
            </div>
          </div>
          <div>
            <p className="text-4xl font-semibold text-slate-900">{metric}</p>
            <p className="mt-2 text-sm text-slate-600">{hint}</p>
          </div>
        </div>
        <div className="rotating-card-face rotating-card-back absolute left-0 top-0 flex h-full w-full flex-col justify-between rounded-3xl bg-slate-900 p-6 text-white">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-300">
              Focus semaine
            </p>
            <h3 className="mt-3 text-xl font-semibold">{backTitle}</h3>
          </div>
          <ul className="space-y-3 text-sm text-slate-200">
            {backItems.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-emerald-400" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
