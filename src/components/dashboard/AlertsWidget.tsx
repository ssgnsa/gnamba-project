import { AlertTriangle, Clock, TrendingDown, CheckCircle } from "lucide-react";

interface Alert {
  id: string;
  type: "warning" | "danger" | "info" | "success";
  message: string;
  sub?: string;
}

interface AlertsWidgetProps {
  alerts: Alert[];
}

const alertStyles = {
  danger: {
    bg: "bg-red-50",
    border: "border-red-200",
    icon: "text-red-500",
    Icon: AlertTriangle,
  },
  warning: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    icon: "text-amber-500",
    Icon: Clock,
  },
  info: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: "text-blue-500",
    Icon: TrendingDown,
  },
  success: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    icon: "text-emerald-500",
    Icon: CheckCircle,
  },
};

export default function AlertsWidget({ alerts }: AlertsWidgetProps) {
  if (!alerts.length) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-slate-400 gap-2">
        <CheckCircle size={28} className="text-emerald-400" />
        <p className="text-sm font-medium">Aucune alerte active</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {alerts.map((a) => {
        const s = alertStyles[a.type];
        return (
          <div
            key={a.id}
            className={`flex items-start gap-3 p-3 rounded-xl border ${s.bg} ${s.border}`}
          >
            <s.Icon size={16} className={`${s.icon} mt-0.5 flex-shrink-0`} />
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-800 leading-snug">
                {a.message}
              </p>
              {a.sub && (
                <p className="text-xs text-slate-500 mt-0.5">{a.sub}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
