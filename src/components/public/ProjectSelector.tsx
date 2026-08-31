import { ArrowRight, HardHat, Building2, Map, Grid3X3 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Badge, Container, Flex, IconWrapper, Grid } from "../../components/ui";

export interface ProjectOption {
  id: string;
  icon: LucideIcon;
  title: string;
  problem: string;
  action: string;
  color: "btp" | "immobilier" | "foncier" | "lotissement";
  ctaText: string;
  onClick: () => void;
}

interface Props {
  options?: ProjectOption[];
  className?: string;
}

const colorMap = {
  foncier: {
    bg: "from-emerald-600 to-emerald-700",
    accent: "bg-emerald-600",
    light: "bg-emerald-50",
    icon: "text-emerald-600",
    badge: "bg-emerald-100 text-emerald-700",
  },
  btp: {
    bg: "from-orange-600 to-orange-700",
    accent: "bg-orange-600",
    light: "bg-orange-50",
    icon: "text-orange-600",
    badge: "bg-orange-100 text-orange-700",
  },
  immobilier: {
    bg: "from-sky-600 to-sky-700",
    accent: "bg-sky-600",
    light: "bg-sky-50",
    icon: "text-sky-600",
    badge: "bg-sky-100 text-sky-700",
  },
  lotissement: {
    bg: "from-purple-600 to-purple-700",
    accent: "bg-purple-600",
    light: "bg-purple-50",
    icon: "text-purple-600",
    badge: "bg-purple-100 text-purple-700",
  },
};

/**
 * ProjectSelector - Quel est votre projet ?
 * 4 cartes : Foncier | BTP | Immobilier | Lotissement
 * Chaque carte pose le problème client et oriente vers une action spécifique
 */
export default function ProjectSelector({ options, className = "" }: Props) {
  const defaultOptions: ProjectOption[] = options || [
    {
      id: "foncier",
      icon: Map,
      title: "Sécuriser un terrain",
      problem: "Vous cherchez à acquérir ou à sécuriser une parcelle en Côte d'Ivoire",
      action: "Vérification documentaire • ACD & Cadastre • Bornage",
      color: "foncier",
      ctaText: "Parler de mon terrain",
      onClick: () => {}, // À remplacer par onNavigate
    },
    {
      id: "btp",
      icon: HardHat,
      title: "Construire votre projet",
      problem: "Vous avez un projet de construction, extension ou rénovation",
      action: "Étude • Suivi de chantier • Livraison clé en main",
      color: "btp",
      ctaText: "Demander un devis BTP",
      onClick: () => {},
    },
    {
      id: "immobilier",
      icon: Building2,
      title: "Valoriser un bien",
      problem: "Vous souhaitez vendre, louer ou faire estimer un bien",
      action: "Estimation • Commercialisation • Gestion locative",
      color: "immobilier",
      ctaText: "Faire estimer mon bien",
      onClick: () => {},
    },
    {
      id: "lotissement",
      icon: Grid3X3,
      title: "Lotir & Aménager",
      problem: "Vous préparez une opération de lotissement ou d'aménagement",
      action: "Conception • Dossiers administratifs • Suivi de travaux",
      color: "lotissement",
      ctaText: "Étudier mon projet",
      onClick: () => {},
    },
  ];

  return (
    <section className={`py-20 sm:py-24 lg:py-28 bg-neutral-50 ${className}`}>
      <Container size="xl">
        {/* Header */}
        <Flex direction="col" align="center" gap="4" className="mb-16 text-center max-w-3xl mx-auto">
          <Badge variant="primary" size="md" className="text-xs">
            Quel est votre projet ?
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-neutral-900 leading-tight">
            Trouvez votre solution
          </h2>
          <p className="text-neutral-500 text-lg leading-relaxed">
            Sélectionnez votre situation pour recevoir des conseils adaptés à votre besoin
          </p>
        </Flex>

        {/* Project Cards Grid */}
        <Grid cols={{ base: 1, sm: 2, lg: 4 }} gap="lg">
          {defaultOptions.map((option) => {
            const Icon = option.icon;
            const colors = colorMap[option.color];

            return (
              <Card
                key={option.id}
                variant="default"
                interactive
                padding="0"
                className="group h-full flex flex-col overflow-hidden hover:shadow-lg transition-all duration-300"
              >
                {/* Color header bar */}
                <div
                  className={`h-1.5 bg-gradient-to-r ${colors.bg}`}
                  aria-hidden="true"
                />

                <CardHeader className="pt-6 pb-4">
                  <IconWrapper
                    size="lg"
                    variant="primary"
                    shape="circle"
                    className="mb-4 group-hover:scale-110 transition-transform duration-300"
                  >
                    <Icon size={28} className={colors.icon} />
                  </IconWrapper>

                  <CardTitle className="text-xl font-bold text-neutral-900 mb-2">
                    {option.title}
                  </CardTitle>

                  {/* Problem statement */}
                  <p className="text-sm text-neutral-600 leading-relaxed mb-3">
                    {option.problem}
                  </p>

                  {/* What we do */}
                  <p className="text-xs text-neutral-500 font-medium">
                    {option.action}
                  </p>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col pb-6">
                  {/* CTA Button */}
                  <button
                    onClick={option.onClick}
                    className={`mt-auto w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold text-sm transition-all duration-200 ${colors.accent} text-white hover:shadow-lg group/btn`}
                    aria-label={option.ctaText}
                  >
                    {option.ctaText}
                    <ArrowRight
                      size={16}
                      className="group-hover/btn:translate-x-1 transition-transform"
                      aria-hidden="true"
                    />
                  </button>
                </CardContent>
              </Card>
            );
          })}
        </Grid>
      </Container>
    </section>
  );
}
