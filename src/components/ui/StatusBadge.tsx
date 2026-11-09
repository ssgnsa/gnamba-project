/** StatusBadge — Badge uniforme pour tous les statuts métier du foncier.
 * Mappings par défaut : actif→vert, inactif→gris, vendu→bleu, litige→rouge,
 * reserve→jaune, annule→gris, archive→gris foncé, brouillon→gris,
 * soumis→bleu, valide→vert, revoqué→rouge, livre→vert.
 */
import { FC, ClassNameIndex } from "react";

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
  customLabels?: Record<string, string>;
}

const defaultLabels: Record<string, string> = {
  actif: "Actif",
  inactif: "Inactif",
  vendu: "Vendu",
  litige: "Litige",
  reserve: "Réserve",
  annule: "Annulé",
  archive: "Archivé",
  brouillon: "Brouillon",
  soumis: "Soumis",
  valide: "Valide",
  "revoqué": "Révoqué",
  livre: "Livré",
};

const statusColors: Record<string, string> = {
  actif: "bg-green-100 text-green-800",
  inactif: "bg-neutral-100 text-neutral-800",
  vendu: "bg-blue-100 text-blue-800",
  litige: "bg-red-100 text-red-800",
  reserve: "bg-yellow-100 text-yellow-800",
  annule: "bg-neutral-100 text-neutral-800",
  archive: "bg-neutral-900 text-neutral-100",
  brouillon: "bg-neutral-100 text-neutral-800",
  soumis: "bg-blue-100 text-blue-800",
  valide: "bg-green-100 text-green-800",
  "revoqué": "bg-red-100 text-red-800",
  livre: "bg-green-100 text-green-800",
};

export const StatusBadge: FC<StatusBadgeProps> = ({
  status,
  size = "md",
  customLabels,
}) => {
  const label = customLabels?.[status] || defaultLabels[status] || status;
  const color = statusColors[status] || "bg-neutral-100 text-neutral-800";

  return (
    <span
      className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium ${color}`}
      aria-label={label}
    >
      {label}
    </span>
  );
};