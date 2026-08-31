import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info" | "primary" | "secondary";
  size?: "sm" | "md" | "lg";
  dot?: boolean;
  icon?: ReactNode;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      className,
      variant = "default",
      size = "md",
      dot = false,
      icon,
      children,
      ...props
    },
    ref,
  ) => {
    const variants = {
      default:
        "bg-gray-100 text-gray-700 border border-gray-200",
      primary:
        "bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20",
      secondary:
        "bg-[var(--color-secondary)]/10 text-[var(--color-secondary)] border border-[var(--color-secondary)]/20",
      success:
        "bg-emerald-50 text-emerald-700 border border-emerald-100",
      warning:
        "bg-amber-50 text-amber-700 border border-amber-100",
      danger:
        "bg-red-50 text-red-700 border border-red-100",
      info:
        "bg-blue-50 text-blue-700 border border-blue-100",
    };

    const sizes = {
      sm: "px-2 py-0.5 text-xs gap-1",
      md: "px-2.5 py-1 text-sm gap-1.5",
      lg: "px-3 py-1.5 text-base gap-2",
    };

    const dotColors = {
      default: "bg-gray-400",
      primary: "bg-[var(--color-primary)]",
      secondary: "bg-[var(--color-secondary)]",
      success: "bg-emerald-500",
      warning: "bg-amber-500",
      danger: "bg-red-500",
      info: "bg-blue-500",
    };

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center font-medium rounded-full border",
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      >
        {dot && (
          <span
            className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", dotColors[variant])}
            aria-hidden="true"
          />
        )}
        {icon && <span className="flex-shrink-0" aria-hidden="true">{icon}</span>}
        {children}
      </span>
    );
  },
);

Badge.displayName = "Badge";

// Status badge mapping for common use cases
export const StatusBadge = ({
  status,
  size = "md",
  dot = true,
  ...props
}: BadgeProps & { status: string }) => {
  const statusConfig: Record<string, { variant: BadgeProps["variant"]; label: string }> = {
    // Property statuses
    disponible: { variant: "success", label: "Disponible" },
    loue: { variant: "primary", label: "Loué" },
    en_vente: { variant: "info", label: "En vente" },
    vendu: { variant: "secondary", label: "Vendu" },
    // Foncier lot statuses
    actif: { variant: "success", label: "Actif" },
    reserve: { variant: "warning", label: "Réservé" },
    en_cours_vente: { variant: "info", label: "En cours de vente" },
    litige: { variant: "danger", label: "Litige" },
    archive: { variant: "default", label: "Archivé" },
    // Payment statuses
    paye: { variant: "success", label: "Payé" },
    en_attente: { variant: "warning", label: "En attente" },
    retard: { variant: "danger", label: "En retard" },
    partiel: { variant: "info", label: "Partiel" },
    // Contract statuses
    contrat_actif: { variant: "success", label: "Actif" },
    termine: { variant: "secondary", label: "Terminé" },
    resilie: { variant: "danger", label: "Résilié" },
    renouvele: { variant: "info", label: "Renouvelé" },
    // Document statuses
    valide: { variant: "success", label: "Validé" },
    brouillon: { variant: "default", label: "Brouillon" },
    soumisi: { variant: "info", label: "Soumis" },
    rejete: { variant: "danger", label: "Rejeté" },
    // Generic
    active: { variant: "success", label: "Actif" },
    inactive: { variant: "default", label: "Inactif" },
    pending: { variant: "warning", label: "En attente" },
    completed: { variant: "success", label: "Terminé" },
    cancelled: { variant: "danger", label: "Annulé" },
  };

  const config = statusConfig[status] || { variant: "default", label: status };

  return (
    <Badge variant={config.variant} size={size} dot={dot} {...props}>
      {config.label}
    </Badge>
  );
};

export default Badge;