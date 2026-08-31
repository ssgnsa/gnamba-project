import { ArrowRight, MessageCircle, Quote, Star, User, Shield, Sparkles, CheckCircle2 } from "lucide-react";
import type { PublicPage } from "../../lib/publicRoutes";
import { OFFICIAL_CONTACT, buildWhatsAppUrl } from "../../lib/officialContact";

// Premium UI Components
import {
  Button,
  Card,
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

const testimonials = [
  {
    name: "Client particulier",
    role: "Achat de terrain",
    text: "L'équipe a clarifié les étapes et les documents dès le premier échange. Le suivi a été simple et direct.",
  },
  {
    name: "Promoteur local",
    role: "Lotissement",
    text: "Nous avons apprécié la structure commerciale et la qualité de l'information sur les lots publiés.",
  },
  {
    name: "Entreprise BTP",
    role: "Suivi de chantier",
    text: "Les échanges ont été simples et rapides, avec des réponses claires à chaque étape.",
  },
  {
    name: "Investisseur immobilier",
    role: "Gestion locative",
    text: "La réactivité sur les états des lieux et l'encaissement des loyers a grandement facilité la gestion.",
  },
  {
    name: "Famille expatriée",
    role: "Achat villa clé en main",
    text: "Du premier contact à la remise des clés, tout a été géré professionnellement sans que je me déplace.",
  },
  {
    name: "Artisan local",
    role: "Fournitures chantier",
    text: "Livraison rapide, matériel conforme, facturation claire. Un partenaire fiable pour nos chantiers.",
  },
];

export default function PublicTestimonials({ onNavigate }: Props) {
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
            <Flex align="center" justify="center" gap="2" className="mb-2">
              <IconWrapper size="sm" variant="secondary" shape="circle" className="bg-white/10 text-white border-white/20">
                <MessageCircle size={14} />
              </IconWrapper>
              <Badge variant="secondary" size="md" className="text-xs bg-white/10 text-white border-white/20">
                Témoignages
              </Badge>
            </Flex>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight">
              Ce que disent <span className="bg-gradient-to-r from-white via-white to-sky-200 bg-clip-text text-transparent">nos clients</span>
            </h1>
            <p className="text-sky-100 text-lg max-w-2xl mx-auto leading-relaxed">
              Une vitrine transparente pour mettre en avant les retours d'expérience
              de ceux qui nous ont fait confiance.
            </p>
            <Flex align="center" justify="center" gap="4" className="pt-4">
              <Button size="lg" variant="secondary" onClick={() => nav("contact")} iconRight={<ArrowRight size={20} />} className="shadow-lg">
                Laisser un message
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

      {/* Stats */}
      <section className="py-12 bg-white border-y border-neutral-100">
        <Container size="xl">
          <Grid cols={{ base: 2, lg: 4 }} gap="md" className="text-center">
            {[
              { n: "100+", l: "Clients satisfaits", icon: User },
              { n: "4.9/5", l: "Note moyenne", icon: Star },
              { n: "95%", l: "Recommandent", icon: CheckCircle2 },
              { n: "5+", l: "Années d'expérience", icon: Shield },
            ].map((s) => (
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

      {/* Testimonials Grid */}
      <section className="py-20 sm:py-24 lg:py-28 bg-neutral-50">
        <Container size="xl">
          <Flex direction="col" align="center" gap="4" className="mb-12 text-center max-w-3xl mx-auto">
            <Badge variant="primary" size="md" className="text-xs">Retours d'expérience</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 leading-tight">Avis Clients</h2>
            <p className="text-neutral-500 text-lg leading-relaxed">Des clients partagent leur expérience avec GNAMBA SERVICES.</p>
          </Flex>

          <Grid cols={{ base: 1, md: 2, lg: 3 }} gap="lg">
            {testimonials.map((item, index) => (
              <Card
                key={index}
                variant="elevated"
                padding="xl"
                interactive
                className="h-full flex flex-col group"
              >
                <Flex justify="between" align="start" className="mb-4">
                  <IconWrapper size="md" variant="secondary" shape="circle" className="text-sky-200">
                    <Quote size={22} className="text-sky-600" />
                  </IconWrapper>
                  <Flex gap="0.5" className="text-amber-500">
                    {[0, 1, 2, 3, 4].map((star) => (
                      <Star key={star} size={16} fill="currentColor" />
                    ))}
                  </Flex>
                </Flex>
                <p className="text-sm text-neutral-600 leading-relaxed mb-6 flex-1">{item.text}</p>
                <Flex align="center" gap="3" className="pt-4 border-t border-neutral-100">
                  <div className="w-11 h-11 bg-gradient-to-br from-primary-600 to-primary-800 rounded-full flex items-center justify-center flex-shrink-0">
                    <User size={20} className="text-white" />
                  </div>
                  <Flex direction="col" gap="0.5">
                    <span className="text-sm font-semibold text-neutral-900">{item.name}</span>
                    <Badge variant="outline" size="sm" style={{ width: 'fit-content' }}>
                      {item.role}
                    </Badge>
                  </Flex>
                </Flex>
              </Card>
            ))}
          </Grid>
        </Container>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-24 lg:py-28 bg-white border-t border-neutral-100">
        <Container size="lg">
          <Card variant="elevated" padding="xl" className="text-center max-w-2xl mx-auto">
            <Flex direction="col" align="center" gap="4">
              <IconWrapper size="xl" variant="secondary" shape="circle" className="mb-2">
                <Sparkles size={28} className="text-sky-600" />
              </IconWrapper>
              <CardTitle className="text-2xl sm:text-3xl font-extrabold text-neutral-900">Et Après ?</CardTitle>
              <CardDescription className="text-lg text-neutral-600 max-w-xl mx-auto">
                Les retours nous aident à mieux vous accompagner. Pour une nouvelle demande, contactez-nous.
              </CardDescription>
              <Flex gap="4" wrap justify="center">
                <Button variant="primary" size="lg" onClick={() => nav("contact")} iconLeft={<MessageCircle size={20} />} className="min-w-[200px] shadow-primary hover:shadow-primaryHover">
                  Nous contacter
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