import { Clock, FileCheck, MapPin, type LucideIcon } from "lucide-react";

export interface TrustBadge {
  icon: LucideIcon;
  label: string;
  description?: string;
}

interface Props {
  badges?: TrustBadge[];
  className?: string;
}

export const defaultTrustBadges: TrustBadge[] = [
  {
    icon: Clock,
    label: "Réponse rapide",
    description: "Devis sous 48h",
  },
  {
    icon: FileCheck,
    label: "Accompagnement",
    description: "Dossiers clairs",
  },
  {
    icon: MapPin,
    label: "Équipe locale",
    description: "À Sikensi",
  },
];

/**
 * TrustBadges - Affiche 3 preuves de confiance sous les CTA du Hero
 * Rassure immédiatement le visiteur avec des promesses concrètes
 */
export default function TrustBadges({ badges = defaultTrustBadges, className = "" }: Props) {
  return (
    <div className={`flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center max-w-3xl mx-auto ${className}`}>
      {badges.map((badge) => {
        const Icon = badge.icon;
        return (
          <div
            key={badge.label}
            className="flex items-center gap-3 px-4 sm:px-5 py-3 sm:py-3.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg hover:bg-white/15 hover:border-white/30 transition-all duration-200"
          >
            <Icon size={20} className="text-white/90 flex-shrink-0" aria-hidden="true" />
            <div className="text-center sm:text-left">
              <p className="text-sm font-semibold text-white">{badge.label}</p>
              {badge.description && (
                <p className="text-xs text-white/70">{badge.description}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
