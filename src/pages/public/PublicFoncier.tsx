import { ArrowRight, CheckCircle2, MapPin, MessageCircle, Phone, Shield, Sparkles, Target, FileText, Search, Zap, Award } from "lucide-react";
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

const items = [
  "Régularisation et sécurisation foncière",
  "Bornage, délimitation et repérage terrain",
  "Préparation des pièces foncières",
  "Accompagnement après achat ou vente",
];

const processSteps = [
  "Analyse du terrain et des pièces disponibles",
  "Vérification des pièces et des informations",
  "Mise en ordre et suivi administratif",
  "Accompagnement jusqu'à la mise au point finale",
];

const stats = [
  { n: "200+", l: "Dossiers traités", icon: FileText },
  { n: "95%", l: "Taux de réussite", icon: Target },
  { n: "5+", l: "Années d'expertise", icon: Award },
  { n: "3", l: "Régions couvertes", icon: MapPin },
];

export default function PublicFoncier({ onNavigate }: Props) {
  const whatsappUrl = buildWhatsAppUrl(OFFICIAL_CONTACT.phone);

  const nav = (page: PublicPage) => {
    onNavigate(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative py-20 sm:py-24 lg:py-28 overflow-hidden" style={{ background: 'linear-gradient(135deg, #064e3b 0%, #059669 50%, #1e3a5f 100%)' }}>
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <Container size="xl" className="relative z-10 py-8">
          <Flex direction="col" align="center" gap="4" className="text-center max-w-4xl mx-auto">
            <Badge variant="secondary" size="md" className="text-xs bg-white/10 text-white border-white/20">
              Foncier sécurisé
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight">
              Sécurisation et suivi des <span className="bg-gradient-to-r from-white via-white to-emerald-200 bg-clip-text text-transparent">dossiers fonciers</span>
            </h1>
            <p className="text-emerald-100 text-lg max-w-2xl mx-auto leading-relaxed">
              Notre accompagnement foncier intervient après l'achat, la vente ou
              la régularisation. Nous gardons le cap sur la clarté, le suivi et
              les prochaines étapes.
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
                <IconWrapper size="md" variant="success" shape="circle" className="mb-2">
                  <s.icon size={24} className="text-emerald-600" />
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
                  <Badge variant="success" size="sm">
                    <MapPin size={14} />
                    Terrain & foncier
                  </Badge>
                </Flex>
                <CardTitle className="text-2xl sm:text-3xl font-extrabold text-neutral-900">Une approche claire et rigoureuse</CardTitle>
                <CardDescription className="text-lg">Nous évitons les promesses vagues. Cette page présente notre accompagnement foncier avec des étapes concrètes et des informations faciles à comprendre.</CardDescription>
              </CardHeader>

              <ul className="space-y-4 mb-8">
                {items.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <IconWrapper size="sm" variant="success" shape="circle">
                      <CheckCircle2 size={15} className="text-emerald-600" />
                    </IconWrapper>
                    <span className="text-sm text-neutral-700 leading-relaxed pt-0.5">{item}</span>
                  </li>
                ))}
              </ul>

              <Flex gap="3" wrap>
                <Button variant="primary" size="md" onClick={() => nav("lots")} iconRight={<ArrowRight size={16} />} className="shadow-primary hover:shadow-primaryHover">
                  Voir les lots disponibles
                </Button>
                <Button variant="outline" size="md" onClick={() => nav("contact")} iconLeft={<Phone size={16} />}>
                  Nous contacter
                </Button>
              </Flex>
            </Card>

            <Card variant="default" padding="xl" style={{ background: 'linear-gradient(135deg, #064e3b 0%, #059669 100%)' }} className="text-white">
              <CardHeader className="mb-6">
                <Badge variant="secondary" size="sm" className="mb-4 bg-white/10 text-white border-white/20">Étapes</Badge>
                <CardTitle className="text-2xl sm:text-3xl font-extrabold">Étapes de travail</CardTitle>
              </CardHeader>

              <div className="space-y-4 mb-8">
                {processSteps.map((step, index) => (
                  <Flex key={step} align="start" gap="3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-sm font-bold text-white flex-shrink-0">
                      {index + 1}
                    </div>
                    <CardDescription className="text-sm text-white/90 leading-relaxed pt-1">{step}</CardDescription>
                  </Flex>
                ))}
              </div>

              <Flex gap="3" wrap>
                <Button variant="secondary" size="md" onClick={() => nav("lots")} iconRight={<ArrowRight size={16} />} className="bg-white/10 hover:bg-white/20 border-white/20">
                  Voir les lots disponibles
                </Button>
                <Button variant="accent" size="md" onClick={() => nav("contact")} iconLeft={<Phone size={16} />} className="bg-emerald-600 hover:bg-emerald-700 shadow-lg">
                  Nous contacter
                </Button>
              </Flex>
            </Card>

            {/* Why Choose Us */}
            <div className="lg:col-span-2">
              <Flex direction="col" align="center" gap="4" className="mb-12 text-center max-w-3xl mx-auto">
                <Badge variant="primary" size="md" className="text-xs">Notre différence</Badge>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 leading-tight">Pourquoi choisir GNAMBA SERVICES pour votre foncier ?</h2>
                <p className="text-neutral-500 text-lg leading-relaxed">Expertise juridique, réactivité et accompagnement complet pour sécuriser votre patrimoine.</p>
              </Flex>

              <Grid cols={{ base: 1, sm: 2, lg: 4 }} gap="lg">
                {[
                  { icon: Shield, title: "Expertise juridique", desc: "ACD, compulssoire, cadastre - nous maîtrisons les procédures" },
                  { icon: Search, title: "Vérification rigoureuse", desc: "Analyse documentaire complète avant tout engagement" },
                  { icon: Zap, title: "Réactivité", desc: "Suivi administratif accéléré, communication transparente" },
                  { icon: Target, title: "Résultats concrets", desc: "Titres sécurisés, dossiers finalisés, patrimoine protégé" },
                ].map((a) => (
                  <Card key={a.title} variant="default" padding="xl" interactive className="text-center group h-full">
                    <IconWrapper size="xl" variant="success" shape="circle" className="mx-auto mb-5 group-hover:scale-110 group-hover:bg-emerald-600 transition-all duration-300">
                      <a.icon size={28} className="text-emerald-600 group-hover:text-white transition-colors duration-300" />
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
              <IconWrapper size="xl" variant="success" shape="circle" className="mb-2">
                <Sparkles size={28} className="text-emerald-600" />
              </IconWrapper>
              <CardTitle className="text-2xl sm:text-3xl font-extrabold text-neutral-900">Sécurisez Votre Patrimoine Foncier</CardTitle>
              <CardDescription className="text-lg text-neutral-600 max-w-xl mx-auto">
                Contactez notre équipe pour une analyse de votre dossier. Réponse sous 24h garantie, expertise locale certifiée.
              </CardDescription>
              <Flex gap="4" wrap justify="center">
                <Button variant="primary" size="lg" onClick={() => nav("contact")} iconLeft={<Phone size={20} />} className="min-w-[200px] shadow-primary hover:shadow-primaryHover">
                  Demander un devis
                </Button>
                <Button variant="outline" size="lg" onClick={() => nav("lots")} iconRight={<ArrowRight size={20} />}>
                  Voir les lots disponibles
                </Button>
              </Flex>
            </Flex>
          </Card>
        </Container>
      </section>
    </div>
  );
}