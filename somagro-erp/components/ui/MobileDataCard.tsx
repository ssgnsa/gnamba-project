import { ReactNode } from "react";
import { useMobile } from "@/hooks/useMobile";

interface MobileDataCardProps {
  title: string;
  subtitle?: string;
  fields: Array<{
    label: string;
    value: ReactNode;
  }>;
  actions?: ReactNode;
  icon?: ReactNode;
  className?: string;
  onClick?: () => void;
}

/**
 * Composant de carte mobile pour remplacer les tableaux sur petit écran
 * Affiche les données sous forme de carte avec champs label/valeur
 */
export default function MobileDataCard({
  title,
  subtitle,
  fields,
  actions,
  icon,
  className = "",
  onClick,
}: MobileDataCardProps) {
  const { isMobile } = useMobile();

  if (!isMobile) {
    return null; // Ne rien rendre sur desktop
  }

  const CardWrapper = onClick ? "button" : "div";
  const wrapperProps = onClick
    ? { onClick, className: `w-full text-left` }
    : {};

  return (
    <CardWrapper
      {...wrapperProps}
      className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ${className} ${onClick ? "hover:border-emerald-300 hover:shadow-md transition-all active:scale-[0.98]" : ""}`}
    >
      {/* En-tête */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {icon && <div className="flex-shrink-0">{icon}</div>}
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-slate-900 truncate">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-slate-500 truncate">{subtitle}</p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-1 flex-shrink-0">{actions}</div>
        )}
      </div>

      {/* Champs */}
      <div className="space-y-2">
        {fields.map((field, idx) => (
          <div
            key={idx}
            className="flex items-start justify-between gap-2 py-1.5 border-b border-slate-100 last:border-0"
          >
            <span className="text-xs text-slate-500 flex-shrink-0">
              {field.label}
            </span>
            <span className="text-xs sm:text-sm font-medium text-slate-900 text-right break-words">
              {field.value}
            </span>
          </div>
        ))}
      </div>
    </CardWrapper>
  );
}
