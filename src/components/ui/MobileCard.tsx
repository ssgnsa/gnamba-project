import { ReactNode } from "react";
import { useMobile } from "../../hooks/useMobile";

interface MobileCardField {
  label: string;
  value: ReactNode;
  copyable?: boolean;
}

interface MobileCardProps {
  title: string;
  subtitle?: string;
  fields: MobileCardField[];
  actions?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

/**
 * Composant de carte mobile pour remplacer les tableaux sur petit écran
 * Affiche les données sous forme de carte avec champs label/valeur
 */
export default function MobileCard({
  title,
  subtitle,
  fields,
  actions,
  icon,
  className = "",
}: MobileCardProps) {
  const { isMobile } = useMobile();

  if (!isMobile) {
    return null; // Ne rien rendre sur desktop (le tableau prend le relais)
  }

  return (
    <div className={`egs-panel p-4 ${className}`}>
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
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>

      {/* Champs */}
      <div className="space-y-1.5">
        {fields.map((field, idx) => (
          <div
            key={idx}
            className="flex items-start justify-between gap-2 py-2 border-b border-slate-100 last:border-0"
          >
            <span className="text-[11px] uppercase tracking-wide text-slate-500 flex-shrink-0">
              {field.label}
            </span>
            <span className="text-xs sm:text-sm font-medium text-slate-900 text-right break-words">
              {field.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
