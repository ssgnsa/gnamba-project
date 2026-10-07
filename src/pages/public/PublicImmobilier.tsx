import { ArrowRight, Building2, CheckCircle2, MessageCircle, Phone, Shield, Zap, Target, Users, Search, TrendingUp, Home, Sparkles } from "lucide-react";
import type { PublicPage } from "../../lib/publicRoutes";
import { OFFICIAL_CONTACT, buildWhatsAppUrl } from "../../lib/officialContact";

// Premium UI Components
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  Badge,
  Container,
  Grid,
  Flex,
  IconWrapper,
} from "../../components/ui";

interface Props {
  onNavigate: (page: PublicPage) => void;
}

const benefits = [
  "Gestion locative et suivi des loyers",
  "Vente, achat et estimation de biens",
  "Accompagnement sur les dossiers de location",
  "Conseil pour la valorisation du patrimoine",
];

const services = [
  "Résidentiel",
  "Commercial",
  "Suivi administratif",
  "Mise en relation d'acquéreurs",
];

const stats = [
  { n: "150+", l: "Biens gérés", icon: Building2 },
  { n: "98%", l: "Satisfaction client", icon: Users },
  { n: "3+", l: "Régions couvertes", icon: Target },
  { n: "24h", l: "Réponse garantie", icon: Zap },
];

export default function PublicImmobilier({ onNavigate }: Props) {
  const whatsappUrl = buildWhatsAppUrl(OFFICIAL_CONTACT.phone);

  const nav = (page: PublicPage) => {
    onNavigate(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative py-20 sm:py-24 lg:py-28 overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0284c7 100%)' }}>
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <Container size="xl" className="relative z-10 py-8">
          <Flex direction="col" align="center" gap="4" className="text-center max-w-4xl mx-auto">
            <Badge variant="secondary" size="md" className="text-xs bg-white/10 text-white border-white/20">
              Immobilier
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight">
              Gestion, vente et <span className="bg-gradient-to-r from-white via-white to-sky-200 bg-clip-text text-transparent">valorisation immobilière</span>
            </h1>
            <p className="text-sky-100 text-lg max-w-2xl mx-auto leading-relaxed">
              Un accompagnement clair pour vos biens résidentiels et commerciaux,
              avec une logique simple: sécuriser, valoriser et faire avancer.
            </p>
            <Flex align="center" justify="center" gap="4" className="pt-4">
              <Button size="lg" variant="secondary" onClick={() => nav("contact")} iconRight={<ArrowRight size={20} />} className="shadow-lg">
                Demander un devis
              </Button>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-semibold text-base transition-all duration-200 shadow-lg"
              >
                <MessageCircle size={18} />
                WhatsApp
              </a>
            </Flex>
          </Flex>
        </Container>
      </section>

      {/* Stats Bar */}
      <section className="py-12 bg-white border-y border-neutral-100">
        <Container size="xl">
          <Grid cols={{ base: 2, lg: 4 }} gap="md" className="text-center">
            {stats.map((s) => (
              <Flex key={s.l} direction="col" align="center" gap="2">
                <IconWrapper size="md" variant="secondary" shape="circle" className="mb-2">
                  <s.icon size={24} className="text-sky-600" />
                </IconWrapper>
                <div className="text-3xl font-extrabold text-neutral-900">{s.n}</div>
                <div className="text-sm text-neutral-500">{s.l}</div>
              </Flex>
            ))}
          </Grid>
        </Container>
      </section>

      {/* Main Content */}
      <section className="py-20 sm:py-24 lg:py-28 bg-neutral-50">
        <Container size="xl">
          <Grid cols={{ base: 1, lg: 2 }} gap="xl" gapY="md">
            <Card variant="elevated" padding="xl">
              <CardHeader className="mb-6">
                <Flex align="center" gap="2" className="mb-4" style={{ width: 'fit-content' }}>
                  <Badge variant="secondary" size="sm">
                    <Building2 size={14} />
                    Ce que nous couvrons
                  </Badge>
                </Flex>
                <CardTitle className="text-2xl sm:text-3xl font-extrabold text-neutral-900">Un espace pensé pour les biens à valoriser</CardTitle>
                <CardDescription className="text-lg">Immobilier et foncier ne servent pas au même moment de vie d'un dossier. Ici, nous nous concentrons sur la gestion, la vente et la mise en relation avec des acquéreurs.</CardDescription>
              </CardHeader>

              <ul className="space-y-4 mb-8">
                {benefits.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <IconWrapper size="sm" variant="secondary" shape="circle">
                      <CheckCircle2 size={15} className="text-sky-600" />
                    </IconWrapper>
                    <span className="text-sm text-neutral-700 leading-relaxed pt-0.5">{item}</span>
                  </li>
                ))}
              </ul>

              <Flex gap="3" wrap>
                <Button variant="primary" size="md" onClick={() => nav("contact")} iconRight={<ArrowRight size={16} />} className="shadow-primary hover:shadow-primaryHover">
                  Nous contacter
                </Button>
                <Button variant="outline" size="md" onClick={() => nav("realisations")} iconLeft={<TrendingUp size={16} />}>
                  Voir nos projets
                </Button>
              </Flex>
            </Card>

            <Card variant="default" padding="xl" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #0284c7 100%)' }} className="text-white">
              <CardHeader className="mb-6">
                <Badge variant="secondary" size="sm" className="mb-4 bg-white/10 text-white border-white/20">Services associés</Badge>
                <CardTitle className="text-2xl sm:text-3xl font-extrabold">Immobilier de gestion</CardTitle>
              </CardHeader>

              <div className="space-y-3 mb-6">
                {services.map((service) => (
                  <Card key={service} variant="bordered" padding="md" className="bg-white/10 border-white/20">
                    <p className="text-sm font-medium text-white/90">{service}</p>
                  </Card>
                ))}
              </div>

              <Card variant="bordered" padding="md" className="bg-white/10 border-white/20 mb-6">
                <p className="text-sm text-white/75 leading-relaxed">Besoin d'une estimation ou d'un suivi de bien? Contactez-nous directement pour une réponse rapide et une orientation claire.</p>
              </Card>

              <Flex gap="3" wrap>
                <Button variant="secondary" size="md" onClick={() => nav("contact")} iconLeft={<Phone size={16} />} className="bg-white/10 hover:bg-white/20 border-white/20">
                  Contact
                </Button>
                <Button variant="accent" size="md" onClick={() => nav("realisations")} iconRight={<ArrowRight size={16} />} className="bg-sky-600 hover:bg-sky-700 shadow-lg">
                  Voir les réalisations
                </Button>
              </Flex>
            </Card>

            {/* Why Choose Us */}
            <div className="lg:col-span-2">
              <Flex direction="col" align="center" gap="4" className="mb-12 text-center max-w-3xl mx-auto">
                <Badge variant="primary" size="md" className="text-xs">Notre différence</Badge>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 leading-tight">Pourquoi choisir GNAMBA SERVICES pour votre immobilier ?</h2>
                <p className="text-neutral-500 text-lg leading-relaxed">Gestion rigoureuse, estimation juste, réseau d'acquéreurs qualifiés.</p>
              </Flex>

              <Grid cols={{ base: 1, sm: 2, lg: 4 }} gap="lg">
                {[
                  { icon: Home, title: "Estimation précise", desc: "Analyse marché locale pour une valeur réaliste de votre bien" },
                  { icon: Users, title: "Réseau acquéreurs", desc: "Base clients qualifiés pour accélérer la vente ou la location" },
                  { icon: Shield, title: "Gestion locative sereine", desc: "Encaissement, états des lieux, contentieux - nous gérons tout" },
                  { icon: Search, title: "Valorisation patrimoine", desc: "Conseil stratégique pour optimiser votre investissement" },
                ].map((a) => (
                  <Card key={a.title} variant="default" padding="xl" interactive className="text-center group h-full">
                    <IconWrapper size="xl" variant="secondary" shape="circle" className="mx-auto mb-5 group-hover:scale-110 group-hover:bg-sky-600 transition-all duration-300">
                      <a.icon size={28} className="text-sky-600 group-hover:text-white transition-colors duration-300" />
                    </IconWrapper>
                    <CardTitle className="text-lg font-bold text-neutral-900 mb-2">{a.title}</CardTitle>
                    <CardDescription className="text-sm leading-relaxed">{a.desc}</CardDescription>
                  </Card>
                ))}
              </Grid>
            </div>
          </Grid>
        </Container>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-24 lg:py-28 bg-neutral-50">
        <Container size="lg">
          <Card variant="elevated" padding="xl" className="text-center max-w-2xl mx-auto">
            <Flex direction="col" align="center" gap="4">
              <IconWrapper size="xl" variant="secondary" shape="circle" className="mb-2">
                <Sparkles size={28} className="text-sky-600" />
              </IconWrapper>
              <CardTitle className="text-2xl sm:text-3xl font-extrabold text-neutral-900">Valorisez Votre Patrimoine Immobilier</CardTitle>
              <CardDescription className="text-lg text-neutral-600 max-w-xl mx-auto">
                Contactez notre équipe pour une estimation gratuite ou la gestion de vos biens. Réponse sous 24h, expertise locale.
              </CardDescription>
              <Flex gap="4" wrap justify="center">
                <Button variant="primary" size="lg" onClick={() => nav("contact")} iconLeft={<Phone size={20} />} className="min-w-[200px] shadow-primary hover:shadow-primaryHover">
                  Demander un devis
                </Button>
                <Button variant="outline" size="lg" onClick={() => nav("realisations")} iconRight={<ArrowRight size={20} />}>
                  Voir nos réalisations
                </Button>
              </Flex>
            </Flex>
          </Card>
        </Container>
      </section>
    </div>
  );
}