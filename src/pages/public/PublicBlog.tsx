import { ArrowRight, BookOpen, CalendarDays, MessageCircle, Tag, Sparkles, Shield, TrendingUp, Search } from "lucide-react";
import type { PublicPage } from "../../lib/publicRoutes";
import { OFFICIAL_CONTACT, buildWhatsAppUrl } from "../../lib/officialContact";

// Premium UI Components
import {
  Button,
  Card,
  CardHeader,
  CardContent,
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

const articles = [
  {
    title: "Comment sécuriser un terrain avant achat",
    category: "Foncier",
    date: "Conseil pratique",
    summary:
      "Les bons réflexes pour vérifier les pièces, poser les bonnes questions et éviter les zones d'ombre.",
  },
  {
    title: "Préparer un lot à la vente avec une fiche claire",
    category: "Lotissement",
    date: "Vitrine commerciale",
    summary:
      "Quelques règles simples pour publier une fiche claire, lisible et facile à consulter.",
  },
  {
    title: "BTP : garder le cap sur un chantier",
    category: "Construction",
    date: "Suivi chantier",
    summary:
      "Un chantier avance mieux quand les délais, le budget et la communication restent bien suivis.",
  },
  {
    title: "Gestion locative : les pièges à éviter",
    category: "Immobilier",
    date: "Guide complet",
    summary:
      "Les erreurs fréquentes des propriétaires et comment les anticiper pour une gestion sereine.",
  },
  {
    title: "Foncier ivoirien : les réformes 2024 à connaître",
    category: "Foncier",
    date: "Actualité",
    summary:
      "Ce qui change avec les nouvelles dispositions sur l'ACD, le compulssoire et le cadastre.",
  },
  {
    title: "Vendre son bien rapidement : 5 leviers efficaces",
    category: "Immobilier",
    date: "Stratégie vente",
    summary:
      "Estimation, présentation, diffusion, négociation, accompagnement - les clés d'une vente réussie.",
  },
];

const categories = [
  { id: "all", label: "Tous", icon: Sparkles },
  { id: "Foncier", label: "Foncier", icon: Search },
  { id: "Lotissement", label: "Lotissement", icon: TrendingUp },
  { id: "Construction", label: "Construction", icon: Shield },
  { id: "Immobilier", label: "Immobilier", icon: Sparkles },
  { id: "Guide complet", label: "Guides", icon: BookOpen },
  { id: "Actualité", label: "Actualité", icon: TrendingUp },
  { id: "Stratégie vente", label: "Stratégies", icon: Shield },
];

export default function PublicBlog({ onNavigate }: Props) {
  const whatsappUrl = buildWhatsAppUrl(OFFICIAL_CONTACT.phone);

  const nav = (page: PublicPage) => {
    onNavigate(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative py-20 sm:py-24 lg:py-28 overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #4f46e5 100%)' }}>
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
                <BookOpen size={14} />
              </IconWrapper>
              <Badge variant="secondary" size="md" className="text-xs bg-white/10 text-white border-white/20">
                Blog & Conseils
              </Badge>
            </Flex>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight">
              Conseils, bonnes pratiques <span className="bg-gradient-to-r from-white via-white to-indigo-200 bg-clip-text text-transparent">et actualités</span>
            </h1>
            <p className="text-indigo-100 text-lg max-w-2xl mx-auto leading-relaxed">
              Une page éditoriale pour publier des contenus utiles autour
              du foncier, de l'immobilier et du BTP.
            </p>
            <Flex align="center" justify="center" gap="4" className="pt-4">
              <Button size="lg" variant="secondary" onClick={() => nav("contact")} iconRight={<ArrowRight size={20} />} className="shadow-lg">
                Nous écrire
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

      {/* Category Filters */}
      <section className="py-8 bg-white border-b border-neutral-100">
        <Container size="xl">
          <Flex wrap gap="2" justify="center">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <Badge
                  key={cat.id}
                  variant="outline"
                  size="sm"
                  className="gap-1.5 transition-all hover:bg-primary-50 hover:border-primary-300 hover:text-primary-700"
                >
                  <Icon size={12} />
                  {cat.label}
                </Badge>
              );
            })}
          </Flex>
        </Container>
      </section>

      {/* Articles Grid */}
      <section className="py-20 sm:py-24 lg:py-28 bg-neutral-50">
        <Container size="xl">
          <Grid cols={{ base: 1, md: 2, lg: 3 }} gap="lg">
            {articles.map((article) => (
              <Card
                key={article.title}
                variant="elevated"
                padding="lg"
                interactive
                className="h-full flex flex-col group"
              >
                <CardHeader className="mb-4">
                  <Badge variant="outline" size="sm" className="text-xs mb-3" style={{ width: 'fit-content' }}>
                    <Tag size={10} className="mr-1" />
                    {article.category}
                  </Badge>
                  <CardTitle className="text-lg font-bold text-neutral-900 line-clamp-2 group-hover:text-primary-600 transition-colors">{article.title}</CardTitle>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col">
                  <Flex align="center" gap="1.5" className="text-xs text-neutral-400 mb-3">
                    <CalendarDays size={12} />
                    {article.date}
                  </Flex>
                  <p className="text-sm text-neutral-600 leading-relaxed mb-4 flex-1">{article.summary}</p>

                  <Button
                    variant="ghost"
                    size="sm"
                    iconLeft={<BookOpen size={14} />}
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Lire l'article
                    <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </Grid>

          {/* CTA Card */}
          <Card variant="default" padding="xl" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)' }} className="text-white max-w-4xl mx-auto mt-12">
            <Flex direction="col" align="start" smDirection="row" smAlign="center" smJustify="between" gap="6">
              <Flex direction="col" gap="3">
                <Badge variant="secondary" size="sm" className="w-fit bg-white/10 text-white border-white/20">Publication</Badge>
                <CardTitle className="text-2xl font-extrabold">Espace éditorial prêt à accueillir vos conseils et actualités</CardTitle>
                <CardDescription className="text-primary-100 max-w-xl">
                  Le blog peut accueillir des conseils, des annonces et des
                  mises en avant de projets selon vos priorités de communication.
                </CardDescription>
              </Flex>
              <Button variant="secondary" size="md" onClick={() => nav("services")} iconRight={<ArrowRight size={16} />} className="bg-white/10 hover:bg-white/20 border-white/20 min-w-[160px]">
                Nos services
              </Button>
            </Flex>
          </Card>
        </Container>
      </section>
    </div>
  );
}