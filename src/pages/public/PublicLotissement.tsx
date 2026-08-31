import { ArrowRight, CheckCircle2, Layers3, MessageCircle, Phone, Shield, Zap, Target, MapPin, FileText, Sparkles, Award } from "lucide-react";
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

const points = [
  "Viabilisation et découpage de terrains",
  "Mise en valeur des lots",
  "Suivi de la cohérence des références",
  "Préparation des fiches à vendre",
];

const stages = [
  "Étude du site et définition du plan",
  "Organisation des parcelles et des accès",
  "Préparation des lots",
  "Publication et suivi des demandes",
];

const stats = [
  { n: "15+", l: "Lotissements réalisés", icon: Layers3 },
  { n: "500+", l: "Parcelles viabilisées", icon: MapPin },
  { n: "5+", l: "Années d'expertise", icon: Award },
  { n: "3", l: "Régions couvertes", icon: Target },
];

export default function PublicLotissement({ onNavigate }: Props) {
  const whatsappUrl = buildWhatsAppUrl(OFFICIAL_CONTACT.phone);

  const nav = (page: PublicPage) => {
    onNavigate(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative py-20 sm:py-24 lg:py-28 overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1e40af 100%)' }}>
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <Container size="xl" className="relative z-10 py-8">
          <Flex direction="col" align="center" gap="4" className="text-center max-w-4xl mx-auto">
            <Badge variant="secondary" size="md" className="text-xs bg-white/10 text-white border-white/20">
              Lotissement
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight">
              Lotissement et mise en marché des <span className="bg-gradient-to-r from-white via-white to-blue-200 bg-clip-text text-transparent">parcelles</span>
            </h1>
            <p className="text-primary-100 text-lg max-w-2xl mx-auto leading-relaxed">
              Une page dédiée au lotissement et à la mise en marché des parcelles,
              pensée pour présenter les terrains à vendre de façon claire.
            </p>
            <Flex align="center" justify="center" gap="4" className="pt-4">
              <Button size="lg" variant="secondary" onClick={() => nav("lots")} iconRight={<ArrowRight size={20} />} className="shadow-lg">
                Voir les lots
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
                <IconWrapper size="md" variant="primary" shape="circle" className="mb-2">
                  <s.icon size={24} className="text-primary-600" />
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
                  <Badge variant="primary" size="sm">
                    <Layers3 size={14} />
                    Présentation
                  </Badge>
                </Flex>
                <CardTitle className="text-2xl sm:text-3xl font-extrabold text-neutral-900">Des parcelles prêtes à être présentées</CardTitle>
                <CardDescription className="text-lg">Les informations peuvent évoluer avec le terrain et les documents disponibles. La page lotissement sert à montrer l'offre, la disponibilité et la logique de présentation.</CardDescription>
              </CardHeader>

              <ul className="space-y-4 mb-8">
                {points.map((point) => (
                  <li key={point} className="flex items-start gap-3">
                    <IconWrapper size="sm" variant="primary" shape="circle">
                      <CheckCircle2 size={15} className="text-primary-600" />
                    </IconWrapper>
                    <span className="text-sm text-neutral-700 leading-relaxed pt-0.5">{point}</span>
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

            <Card variant="default" padding="xl" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e40af 100%)' }} className="text-white">
              <CardHeader className="mb-6">
                <Badge variant="secondary" size="sm" className="mb-4 bg-white/10 text-white border-white/20">Déroulé</Badge>
                <CardTitle className="text-2xl sm:text-3xl font-extrabold">Étapes de lotissement</CardTitle>
              </CardHeader>

              <div className="space-y-4 mb-8">
                {stages.map((stage, index) => (
                  <Flex key={stage} align="start" gap="3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-500 text-sm font-bold text-white flex-shrink-0">
                      {index + 1}
                    </div>
                    <CardDescription className="text-sm text-white/90 leading-relaxed pt-1">{stage}</CardDescription>
                  </Flex>
                ))}
              </div>

              <Flex gap="3" wrap>
                <Button variant="secondary" size="md" onClick={() => nav("contact")} iconLeft={<Phone size={16} />} className="bg-white/10 hover:bg-white/20 border-white/20">
                  Contact
                </Button>
                <Button variant="accent" size="md" onClick={() => nav("faq")} iconRight={<ArrowRight size={16} />} className="bg-primary-600 hover:bg-primary-700 shadow-lg">
                  Questions fréquentes
                </Button>
              </Flex>
            </Card>

            {/* Why Choose Us */}
            <div className="lg:col-span-2">
              <Flex direction="col" align="center" gap="4" className="mb-12 text-center max-w-3xl mx-auto">
                <Badge variant="primary" size="md" className="text-xs">Notre différence</Badge>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 leading-tight">Pourquoi choisir GNAMBA SERVICES pour votre lotissement ?</h2>
                <p className="text-neutral-500 text-lg leading-relaxed">Viabilisation rigoureuse, parcelles prêtes à vendre, accompagnement administratif complet.</p>
              </Flex>

              <Grid cols={{ base: 1, sm: 2, lg: 4 }} gap="lg">
                {[
                  { icon: FileText, title: "Dossiers complets", desc: "Pièces foncières vérifiées, lots prêts à la commercialisation" },
                  { icon: Shield, title: "Viabilisation maîtrisée", desc: "Réseaux, voirie, bornage - conformité aux normes locales" },
                  { icon: Zap, title: "Mise en marché rapide", desc: "Fiches produits, photos, signalisation - vente accélérée" },
                  { icon: Target, title: "Suivi clientèle", desc: "Accompagnement acheteurs, signature, remise des clés" },
                ].map((a) => (
                  <Card key={a.title} variant="default" padding="xl" interactive className="text-center group h-full">
                    <IconWrapper size="xl" variant="primary" shape="circle" className="mx-auto mb-5 group-hover:scale-110 group-hover:bg-primary-600 transition-all duration-300">
                      <a.icon size={28} className="text-primary-600 group-hover:text-white transition-colors duration-300" />
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
              <IconWrapper size="xl" variant="primary" shape="circle" className="mb-2">
                <Sparkles size={28} className="text-primary-600" />
              </IconWrapper>
              <CardTitle className="text-2xl sm:text-3xl font-extrabold text-neutral-900">Lancez Votre Projet de Lotissement</CardTitle>
              <CardDescription className="text-lg text-neutral-600 max-w-xl mx-auto">
                Contactez notre équipe pour une étude de faisabilité. De la viabilisation à la commercialisation, nous gérons l'ensemble du processus.
              </CardDescription>
              <Flex gap="4" wrap justify="center">
                <Button variant="primary" size="lg" onClick={() => nav("contact")} iconLeft={<Phone size={20} />} className="min-w-[200px] shadow-primary hover:shadow-primaryHover">
                  Demander une étude
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