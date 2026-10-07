import {
  HardHat,
  Building2,
  Map,
  Package,
  CheckCircle2,
  ArrowRight,
  Phone,
  Sparkles,
  Shield,
  Zap,
  Target,
} from "lucide-react";
import { useSiteContent } from "../../context/SiteContentContext";
import type { PublicPage } from "../../lib/publicRoutes";

// Premium UI Components
import {
  Button,
  Card,
  CardContent,
  CardTitle,
  CardDescription,
  Badge,
  Container,
  Grid,
  Flex,
  IconWrapper,
  Divider,
} from "../../components/ui";

interface Props {
  onNavigate: (page: PublicPage) => void;
}

const colorMap = {
  btp: {
    primary: 'primary',
    light: 'bg-primary-50',
    icon: 'text-primary-600',
    badge: 'bg-primary-100 text-primary-700',
    border: 'border-primary-200',
    check: 'text-primary-600',
    gradient: 'from-primary-500/10 to-primary-600/5',
    accent: 'bg-primary-600',
    accentHover: 'hover:bg-primary-700',
  },
  immobilier: {
    primary: 'sky',
    light: 'bg-sky-50',
    icon: 'text-sky-600',
    badge: 'bg-sky-100 text-sky-700',
    border: 'border-sky-200',
    check: 'text-sky-600',
    gradient: 'from-sky-500/10 to-sky-600/5',
    accent: 'bg-sky-600',
    accentHover: 'hover:bg-sky-700',
  },
  foncier: {
    primary: 'emerald',
    light: 'bg-emerald-50',
    icon: 'text-emerald-600',
    badge: 'bg-emerald-100 text-emerald-700',
    border: 'border-emerald-200',
    check: 'text-emerald-600',
    gradient: 'from-emerald-500/10 to-emerald-600/5',
    accent: 'bg-emerald-600',
    accentHover: 'hover:bg-emerald-700',
  },
  fournitures: {
    primary: 'amber',
    light: 'bg-amber-50',
    icon: 'text-amber-600',
    badge: 'bg-amber-100 text-amber-700',
    border: 'border-amber-200',
    check: 'text-amber-600',
    gradient: 'from-amber-500/10 to-amber-600/5',
    accent: 'bg-amber-600',
    accentHover: 'hover:bg-amber-700',
  },
};

export default function PublicServices({ onNavigate }: Props) {
  const { get } = useSiteContent();

  const services = [
    {
      id: "btp",
      icon: HardHat,
      title: get("services", "btp_title", "BTP & Construction"),
      subtitle: "Du plan au chantier, un suivi sérieux",
      color: "btp",
      description: get(
        "services",
        "btp_description",
        "Construction, rénovation et suivi de chantier avec des équipes qualifiées, une organisation rigoureuse et des matériaux adaptés au climat et aux usages locaux.",
      ),
      features: [
        "Construction de villas, immeubles et bâtiments commerciaux",
        "Rénovation et réhabilitation de structures existantes",
        "Suivi et contrôle de chantier rigoureux",
        "Génie civil et travaux d'infrastructure",
        "Aménagement intérieur et décoration",
        "Études et conception de projets",
      ],
      examples: [
        "Villa R+2 à Cocody",
        "Immeuble commercial au Plateau",
        "Rénovation de bureaux à Treichville",
      ],
    },
    {
      id: "immobilier",
      icon: Building2,
      title: get("services", "immobilier_title", "Immobilier"),
      subtitle: "Gestion et valorisation de votre patrimoine",
      color: "immobilier",
      description: get(
        "services",
        "immobilier_description",
        "Gestion locative, vente et conseil en investissement immobilier pour valoriser votre patrimoine et sécuriser vos revenus.",
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
        "Résidence locative à Bingerville",
        "Gestion de biens à Abidjan",
        "Programme résidentiel à Grand-Bassam",
      ],
    },
    {
      id: "foncier",
      icon: Map,
      title: get("services", "foncier_title", "Foncier sécurisé"),
      subtitle: "Sécurisez votre patrimoine foncier",
      color: "foncier",
      description: get(
        "services",
        "foncier_description",
        "Gestion de terrains, régularisation foncière et constitution de dossiers fonciers pour réduire les risques et accélérer les décisions.",
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
        "Lotissement de parcelles à Sikensi",
        "Régularisation de terrains à Yopougon",
        "Attestations coutumières",
      ],
    },
    {
      id: "fournitures",
      icon: Package,
      title: get(
        "services",
        "fournitures_title",
        "Fournitures professionnelles",
      ),
      subtitle: "Équipez votre activité sans perdre de temps",
      color: "fournitures",
      description: get(
        "services",
        "fournitures_description",
        "Mobilier de bureau, équipements professionnels et fournitures de chantier pour simplifier vos achats et livrer vite.",
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
        "Aménagement de bureaux à Abidjan-Plateau",
        "Équipements chantier à Cocody",
        "Fournitures bureautiques pour PME",
      ],
    },
  ];

  const nav = (page: PublicPage) => {
    onNavigate(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative py-20 sm:py-24 lg:py-28 overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1e40af 100%)' }}>
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <Container size="xl" className="relative z-10 py-8">
          <Flex direction="col" align="center" gap="4" className="text-center max-w-4xl mx-auto">
            <Badge variant="secondary" size="md" className="text-xs bg-white/10 text-white border-white/20">
              Ce que nous offrons
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight">
              Nos <span className="bg-gradient-to-r from-white via-white to-amber-200 bg-clip-text text-transparent">Services</span>
            </h1>
            <p className="text-primary-100 text-lg max-w-2xl mx-auto leading-relaxed">
              Des solutions concrètes, rapides et adaptées au marché ivoirien
              pour vos besoins en BTP, immobilier, foncier et fournitures.
            </p>
            <Flex align="center" justify="center" gap="4" className="pt-4">
              <IconWrapper size="md" variant="ghost" shape="circle" className="bg-white/10 text-white border-white/20">
                <Shield size={20} />
              </IconWrapper>
              <span className="text-primary-200 text-sm font-medium">Expertise locale certifiée</span>
              <IconWrapper size="md" variant="ghost" shape="circle" className="bg-white/10 text-white border-white/20">
                <Zap size={20} />
              </IconWrapper>
              <span className="text-primary-200 text-sm font-medium">Réponse sous 24h</span>
              <IconWrapper size="md" variant="ghost" shape="circle" className="bg-white/10 text-white border-white/20">
                <Target size={20} />
              </IconWrapper>
              <span className="text-primary-200 text-sm font-medium">Résultats garantis</span>
            </Flex>
          </Flex>
        </Container>
      </section>

      {/* Services detail */}
      <section className="py-20 sm:py-24 lg:py-28 bg-white">
        <Container size="xl">
          <div className="space-y-20 lg:space-y-24">
            {services.map((s, i) => {
              const Icon = s.icon;
              const c = colorMap[s.color as keyof typeof colorMap];
              const isReversed = i % 2 !== 0;

              return (
                <article key={s.id} className={`animate-in slide-in-from-bottom-4 duration-500`} style={{ animationDelay: `${i * 100}ms` }}>
                  <Grid cols={{ base: 1, lg: 2 }} gap="xl" gapY="md" align="center" className={isReversed ? 'lg:grid-flow-dense' : ''}>
                    <div className={isReversed ? 'lg:order-2' : 'lg:order-1'}>
                      <Flex align="center" gap="2" className="mb-4" style={{ width: 'fit-content' }}>
                        <Badge variant="primary" size="sm" className="gap-1.5">
                          <Icon size={14} className={c.icon} />
                          {s.title}
                        </Badge>
                      </Flex>
                      <Flex direction="col" gap="4">
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 leading-tight">
                          {s.subtitle}
                        </h2>
                        <p className="text-neutral-600 text-lg leading-relaxed max-w-xl">
                          {s.description}
                        </p>

                        <ul className="space-y-3 pt-2 border-t border-neutral-100">
                          {s.features.map((f) => (
                            <li key={f} className="flex items-start gap-3">
                              <IconWrapper size="sm" variant={c.primary as any} shape="circle" className="flex-shrink-0 mt-0.5">
                                <CheckCircle2 size={15} className={c.check} />
                              </IconWrapper>
                              <span className="text-sm text-neutral-700 leading-relaxed">{f}</span>
                            </li>
                          ))}
                        </ul>

                        <Flex gap="3" className="pt-4">
                          <Button
                            variant={c.primary as any}
                            size="lg"
                            onClick={() => nav("contact")}
                            iconLeft={<Phone size={18} />}
                            iconRight={<ArrowRight size={18} />}
                            className="shadow-primary hover:shadow-primaryHover"
                          >
                            Demander un devis
                          </Button>
                          <Button
                            variant="outline"
                            size="lg"
                            onClick={() => nav(s.id === 'btp' ? 'lots' : 'realisations')}
                            iconRight={<ArrowRight size={18} />}
                          >
                            Voir nos projets
                          </Button>
                        </Flex>
                      </Flex>
                    </div>

                    <div className={isReversed ? 'lg:order-1' : 'lg:order-2'}>
                      <Card variant="default" padding="none" className="overflow-hidden relative" style={{ borderRadius: '1.5rem' }}>
                        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${c.primary === 'primary' ? '#1e40af' : c.primary === 'sky' ? '#0284c7' : c.primary === 'emerald' ? '#059669' : '#d97706'} 0%, ${c.primary === 'primary' ? '#1e3a5f' : c.primary === 'sky' ? '#0369a1' : c.primary === 'emerald' ? '#047857' : '#b45309'} 100%)` }}>
                          <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />
                          <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-white/5 rounded-full" />
                        </div>
                        <CardContent padding="xl" className="relative z-10 h-full flex flex-col">
                          <Flex align="center" gap="4" className="mb-6">
                            <IconWrapper size="xl" variant="ghost" shape="circle" className="bg-white/20 text-white">
                              <Icon size={32} className="text-white" />
                            </IconWrapper>
                          </Flex>
                          <CardTitle className="text-white font-bold text-lg mb-4">Exemples de projets</CardTitle>
                          <div className="space-y-3 flex-1">
                            {s.examples.map((ex) => (
                              <div
                                key={ex}
                                className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3 backdrop-blur-sm"
                              >
                                <div className="w-2 h-2 bg-white/60 rounded-full flex-shrink-0" />
                                <span className="text-white/90 text-sm">{ex}</span>
                              </div>
                            ))}
                          </div>
                          <Button
                            variant="secondary"
                            size="md"
                            onClick={() => nav("realisations")}
                            iconRight={<ArrowRight size={16} />}
                            className="mt-6 w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border-white/20"
                          >
                            Voir plus de réalisations
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  </Grid>

                  {i < services.length - 1 && (
                    <Divider variant="dashed" className="my-10" />
                  )}
                </article>
              );
            })}
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-24 lg:py-28 bg-neutral-50">
        <Container size="lg">
          <Card variant="elevated" padding="xl" className="text-center max-w-2xl mx-auto">
            <Flex direction="col" align="center" gap="4">
              <IconWrapper size="xl" variant="primary" shape="circle" className="mb-2">
                <Sparkles size={28} className="text-primary-600" />
              </IconWrapper>
              <CardTitle className="text-2xl sm:text-3xl font-extrabold text-neutral-900">Un projet en tête ?</CardTitle>
              <CardDescription className="text-lg text-neutral-600 max-w-xl mx-auto">
                Contactez notre équipe pour obtenir un devis clair, rapide et réellement adapté à votre budget.
              </CardDescription>
              <Button
                variant="primary"
                size="lg"
                onClick={() => nav("contact")}
                iconLeft={<Phone size={20} />}
                className="min-w-[200px] shadow-primary hover:shadow-primaryHover"
              >
                Demander un devis gratuit
              </Button>
            </Flex>
          </Card>
        </Container>
      </section>
    </div>
  );
}