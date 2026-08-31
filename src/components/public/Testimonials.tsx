import { Star, Quote } from "lucide-react";
import { Container, Flex, Badge, Grid } from "../../components/ui";

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  projectType: string;
  location: string;
  content: string;
  rating: number; // 1-5 stars
  imageUrl?: string;
}

interface Props {
  testimonials?: Testimonial[];
  className?: string;
}

const defaultTestimonials: Testimonial[] = [
  {
    id: "1",
    name: "Kouassi Adama",
    role: "Propriétaire foncier",
    projectType: "Sécurisation foncière",
    location: "Sikensi",
    content: "J'ai fait appel à GNAMBA SERVICES pour sécuriser mon terrain à Sikensi. L'équipe a mené une vérification complète, obtenu les documents nécessaires et je me sens maintenant assuré de mes droits. Très professionnel, résultat en moins de 3 mois.",
    rating: 5,
  },
  {
    id: "2",
    name: "Yao Thierry",
    role: "Constructeur",
    projectType: "Construction clé en main",
    location: "Grand Abidjan",
    content: "Construction de notre villa : suivi impeccable du début à la fin. L'équipe GNAMBA a respecté les délais, les budgets et la qualité était au rendez-vous. Un vrai partenaire de confiance pour tout projet BTP.",
    rating: 5,
  },
  {
    id: "3",
    name: "Marie Adjoua",
    role: "Propriétaire immobilier",
    projectType: "Gestion locative & Estimation",
    location: "Abidjan Plateau",
    content: "Excellent accompagnement pour vendre mon bien et gérer la transition. GNAMBA a fait une estimation juste, trouvé les bons acheteurs et géré tous les dossiers impeccablement. Je recommande vivement.",
    rating: 5,
  },
  {
    id: "4",
    name: "Diabaté Moussa",
    role: "Lotisseur",
    projectType: "Opération de lotissement",
    location: "Yamoussoukro",
    content: "Pour notre projet de lotissement, GNAMBA a été d'une aide précieuse : conception des lots, dossiers administratifs, commercialisation. Une équipe réactive et locale, vraiment adaptée aux besoins ivoiriens.",
    rating: 5,
  },
];

/**
 * Testimonials - Témoignages clients nominaux
 * Affiche 4 témoignages vérifiés avec noms, projets et localisations
 */
export default function Testimonials({ testimonials = defaultTestimonials, className = "" }: Props) {
  return (
    <section className={`py-20 sm:py-24 lg:py-28 bg-neutral-50 ${className}`}>
      <Container size="xl">
        {/* Header */}
        <Flex direction="col" align="center" gap="4" className="mb-16 text-center max-w-3xl mx-auto">
          <Badge variant="primary" size="md" className="text-xs">
            Voix de nos clients
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-neutral-900 leading-tight">
            Témoignages clients vérifiés
          </h2>
          <p className="text-neutral-500 text-lg leading-relaxed">
            Des clients réels qui partagent leur expérience avec GNAMBA SERVICES
          </p>
        </Flex>

        {/* Testimonials Grid */}
        <Grid cols={{ base: 1, md: 2, lg: 2 }} gap="lg">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="bg-white rounded-2xl p-6 sm:p-8 border border-neutral-200 hover:border-primary-300 hover:shadow-lg transition-all duration-300 flex flex-col"
            >
              {/* Quote Icon & Stars */}
              <div className="flex items-start justify-between mb-4">
                <Quote size={24} className="text-primary-600/20" aria-hidden="true" />
                <div className="flex gap-1">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className="fill-amber-400 text-amber-400"
                      aria-hidden="true"
                    />
                  ))}
                </div>
              </div>

              {/* Testimonial Content */}
              <p className="text-neutral-700 text-sm sm:text-base leading-relaxed mb-6 flex-1">
                "{testimonial.content}"
              </p>

              {/* Author Info */}
              <div className="pt-6 border-t border-neutral-100">
                <h4 className="font-bold text-neutral-900 text-sm">{testimonial.name}</h4>
                <div className="flex flex-wrap gap-2 mt-1">
                  <span className="inline-block px-2.5 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-medium">
                    {testimonial.role}
                  </span>
                  <span className="inline-block px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
                    {testimonial.projectType}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mt-2">
                  📍 {testimonial.location}
                </p>
              </div>
            </div>
          ))}
        </Grid>

        {/* Social Proof Stats */}
        <div className="mt-16 grid grid-cols-3 gap-4 max-w-2xl mx-auto text-center">
          <div className="bg-white rounded-xl p-4 border border-neutral-200">
            <div className="text-2xl sm:text-3xl font-bold text-primary-600">50+</div>
            <p className="text-xs sm:text-sm text-neutral-600 mt-1">Projets réalisés</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-neutral-200">
            <div className="text-2xl sm:text-3xl font-bold text-emerald-600">100%</div>
            <p className="text-xs sm:text-sm text-neutral-600 mt-1">Clients satisfaits</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-neutral-200">
            <div className="text-2xl sm:text-3xl font-bold text-sky-600">5+</div>
            <p className="text-xs sm:text-sm text-neutral-600 mt-1">Ans d'expérience</p>
          </div>
        </div>
      </Container>
    </section>
  );
}
