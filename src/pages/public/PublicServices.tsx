import {
  HardHat,
  Building2,
  Map,
  Package,
  CheckCircle2,
  ArrowRight,
  Phone,
} from "lucide-react";
import { useSiteContent } from "../../context/SiteContentContext";
import type { PublicPage } from "../../lib/publicRoutes";

interface Props {
  onNavigate: (page: PublicPage) => void;
}

const colorMap = {
  blue: {
    bg: "from-blue-600 to-blue-800",
    light: "bg-blue-50",
    icon: "text-blue-700",
    badge: "bg-blue-100 text-blue-700",
    dot: "bg-blue-600",
    border: "border-blue-200",
    check: "text-blue-600",
  },
  sky: {
    bg: "from-sky-500 to-sky-700",
    light: "bg-sky-50",
    icon: "text-sky-600",
    badge: "bg-sky-100 text-sky-700",
    dot: "bg-sky-600",
    border: "border-sky-200",
    check: "text-sky-600",
  },
  emerald: {
    bg: "from-emerald-600 to-emerald-800",
    light: "bg-emerald-50",
    icon: "text-emerald-600",
    badge: "bg-emerald-100 text-emerald-700",
    dot: "bg-emerald-600",
    border: "border-emerald-200",
    check: "text-emerald-600",
  },
  amber: {
    bg: "from-amber-500 to-amber-700",
    light: "bg-amber-50",
    icon: "text-amber-600",
    badge: "bg-amber-100 text-amber-700",
    dot: "bg-amber-600",
    border: "border-amber-200",
    check: "text-amber-600",
  },
};

export default function PublicServices({ onNavigate }: Props) {
  const { get } = useSiteContent();

  const services = [
    {
      id: "btp",
      icon: HardHat,
      title: get("services", "btp_title", "BTP & Construction"),
      subtitle: "Du projet à la livraison, nous réalisons vos rêves",
      color: "blue",
      description: get(
        "services",
        "btp_description",
        "Construction, rénovation et suivi de chantier avec des équipes qualifiées et des matériaux de premier choix.",
      ),
      features: [
        "Construction de villas, immeubles et bâtiments commerciaux",
        "Rénovation et réhabilitation de structures existantes",
        "Suivi et contrôle de chantier rigoureux",
        "Génie civil et travaux d'infrastructure",
        "Aménagement intérieur et décoration",
        "Études techniques et architecturales",
      ],
      examples: [
        "Villa R+2 à Cocody",
        "Immeuble commercial Plateau",
        "Rénovation bureaux SGBCI",
      ],
    },
    {
      id: "immobilier",
      icon: Building2,
      title: get("services", "immobilier_title", "Immobilier"),
      subtitle: "Gestion et valorisation de votre patrimoine",
      color: "sky",
      description: get(
        "services",
        "immobilier_description",
        "Gestion locative, vente et conseil en investissement immobilier pour maximiser votre patrimoine.",
      ),
      features: [
        "Gestion locative complète (résidentiel et commercial)",
        "Vente et acquisition de biens immobiliers",
        "Conseil en investissement immobilier",
        "État des lieux et gestion des sinistres",
        "Syndic de copropriété",
        "Évaluation et estimation immobilière",
      ],
      examples: [
        "Résidence Les Palmiers",
        "Gestion 45 biens locatifs",
        "Programme logements Bingerville",
      ],
    },
    {
      id: "foncier",
      icon: Map,
      title: get("services", "foncier_title", "Foncier"),
      subtitle: "Sécurisez votre patrimoine foncier",
      color: "emerald",
      description: get(
        "services",
        "foncier_description",
        "Gestion de terrains, régularisation foncière et constitution de dossiers fonciers en toute conformité.",
      ),
      features: [
        "Gestion et viabilisation de lotissements",
        "Régularisation foncière et mise en conformité",
        "Établissement d'attestations de propriété coutumière",
        "Constitution et suivi de dossiers fonciers",
        "Bornage et délimitation de parcelles",
        "Transactions foncières sécurisées",
      ],
      examples: [
        "Lotissement Gnamba Village (80 parcelles)",
        "Régularisation terrains Yopougon",
        "Attestations coutumières",
      ],
    },
    {
      id: "fournitures",
      icon: Package,
      title: get(
        "services",
        "fournitures_title",
        "Fournitures Professionnelles",
      ),
      subtitle: "Équipez votre espace avec excellence",
      color: "amber",
      description: get(
        "services",
        "fournitures_description",
        "Mobilier de bureau, équipements professionnels et fournitures de chantier pour tous vos besoins.",
      ),
      features: [
        "Mobilier de bureau (bureaux, chaises, rangements)",
        "Équipements informatiques et technologiques",
        "Fournitures et consommables de bureau",
        "Matériaux et équipements de chantier",
        "Aménagement et décoration d'espaces professionnels",
        "Maintenance et SAV des équipements",
      ],
      examples: [
        "Aménagement bureaux SGBCI 1200m²",
        "Équipements chantier villa Cocody",
        "Fournitures bureautiques annuelles",
      ],
    },
  ];

  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="py-20 bg-gradient-to-br from-gray-900 to-blue-900 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-blue-300 font-semibold text-sm uppercase tracking-widest">
            Ce que nous offrons
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mt-3 mb-5">
            Nos Services
          </h1>
          <p className="text-blue-100/80 text-lg max-w-2xl mx-auto leading-relaxed">
            Des solutions complètes et sur mesure pour tous vos besoins en BTP,
            immobilier, foncier et fournitures professionnelles.
          </p>
        </div>
      </section>

      {/* Services detail */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
          {services.map((s, i) => {
            const Icon = s.icon;
            const c = colorMap[s.color as keyof typeof colorMap];
            const isReversed = i % 2 !== 0;
            return (
              <div
                key={s.id}
                className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
              >
                <div className={isReversed ? "lg:order-2" : ""}>
                  <div
                    className={`inline-flex items-center gap-2 ${c.badge} rounded-full px-3 py-1.5 text-xs font-semibold mb-4`}
                  >
                    <Icon size={13} />
                    {s.title}
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-3">
                    {s.subtitle}
                  </h2>
                  <p className="text-gray-600 leading-relaxed mb-6">
                    {s.description}
                  </p>
                  <ul className="space-y-3 mb-6">
                    {s.features.map((f) => (
                      <li key={f} className="flex items-start gap-3">
                        <CheckCircle2
                          size={17}
                          className={`${c.check} mt-0.5 flex-shrink-0`}
                        />
                        <span className="text-sm text-gray-700">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => {
                      onNavigate("contact");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-sm font-semibold transition-all shadow-sm"
                  >
                    <Phone size={15} />
                    Demander un devis
                    <ArrowRight size={15} />
                  </button>
                </div>

                <div className={isReversed ? "lg:order-1" : ""}>
                  <div
                    className={`bg-gradient-to-br ${c.bg} rounded-3xl p-8 relative overflow-hidden`}
                  >
                    <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />
                    <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-white/5 rounded-full" />
                    <div className="relative z-10">
                      <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
                        <Icon size={32} className="text-white" />
                      </div>
                      <h3 className="text-white font-bold text-lg mb-4">
                        Exemples de projets
                      </h3>
                      <div className="space-y-3">
                        {s.examples.map((ex) => (
                          <div
                            key={ex}
                            className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3"
                          >
                            <div className="w-2 h-2 bg-white/60 rounded-full flex-shrink-0" />
                            <span className="text-white/90 text-sm">{ex}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gray-50 border-t border-gray-100">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Un projet en tête ?
          </h2>
          <p className="text-gray-500 mb-6">
            Contactez notre équipe pour obtenir un devis gratuit et
            personnalisé.
          </p>
          <button
            onClick={() => {
              onNavigate("contact");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-semibold transition-all shadow-md"
          >
            <Phone size={17} />
            Demander un devis gratuit
          </button>
        </div>
      </section>
    </div>
  );
}
