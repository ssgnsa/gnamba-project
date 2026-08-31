export type SectionType =
  | "hero"
  | "text"
  | "services"
  | "gallery"
  | "testimonials"
  | "contact"
  | "cta"
  | "faq"
  | "footer"
  | "featured-lots"
  | "site-realisations"
  | "trust-signals"
  | "advantages"
  | "stats-bar"
  | "cta-band"
  | "contact-form";

export type ViewportMode = "desktop" | "tablet" | "mobile";

export interface HeroProps {
  title: string;
  subtitle: string;
  bg_image_url: string;
  cta_text: string;
  cta_url: string;
  overlay_opacity: number;
}

export interface TextProps {
  title: string;
  content: string;
  align: "left" | "center" | "right";
}

export interface ServiceItem {
  icon: string;
  title: string;
  description: string;
}

export interface ServicesProps {
  title: string;
  subtitle: string;
  items: ServiceItem[];
}

export interface GalleryImage {
  url: string;
  caption: string;
}

export interface GalleryProps {
  title: string;
  images: GalleryImage[];
  columns: 2 | 3 | 4;
}

export interface TestimonialItem {
  name: string;
  role: string;
  text: string;
  avatar_url: string;
}

export interface TestimonialsProps {
  title: string;
  items: TestimonialItem[];
}

export interface ContactProps {
  title: string;
  subtitle: string;
  show_form: boolean;
  address: string;
  phone: string;
  email: string;
}

export interface CTAProps {
  title: string;
  subtitle: string;
  button_text: string;
  button_url: string;
  bg_color: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQProps {
  title: string;
  items: FAQItem[];
}

export interface FooterLink {
  label: string;
  url: string;
}

export interface FooterProps {
  logo_url: string;
  tagline: string;
  links: FooterLink[];
  copyright: string;
  show_social: boolean;
}

export interface FeaturedLotsProps {
  title: string;
  subtitle: string;
  limit: number;
  show_category: boolean;
  show_status: boolean;
  show_price: boolean;
  show_surface: boolean;
  show_location: boolean;
  cta_text: string;
  cta_url: string;
}

export interface SiteRealisationsProps {
  title: string;
  subtitle: string;
  limit: number;
  show_category: boolean;
  show_year: boolean;
  show_location: boolean;
  cta_text: string;
  cta_url: string;
}

export interface TrustSignalItem {
  icon: string;
  label: string;
  description: string;
}

export interface TrustSignalsProps {
  title: string;
  subtitle: string;
  items: TrustSignalItem[];
}

export interface AdvantageItem {
  icon: string;
  title: string;
  description: string;
}

export interface AdvantagesProps {
  title: string;
  subtitle: string;
  items: AdvantageItem[];
}

export interface StatsBarProps {
  title: string;
  items: {
    label: string;
    value: string;
    icon: string;
  }[];
}

export interface CTABandProps {
  title: string;
  subtitle: string;
  bg_color: string;
  primary_button_text: string;
  primary_button_url: string;
  secondary_button_text: string;
  secondary_button_url: string;
}

export interface ContactFormProps {
  title: string;
  subtitle: string;
  show_phone: boolean;
  show_email: boolean;
  phone: string;
  email: string;
}

export type SectionProps =
  | HeroProps
  | TextProps
  | ServicesProps
  | GalleryProps
  | TestimonialsProps
  | ContactProps
  | CTAProps
  | FAQProps
  | FooterProps
  | FeaturedLotsProps
  | SiteRealisationsProps
  | TrustSignalsProps
  | AdvantagesProps
  | StatsBarProps
  | CTABandProps
  | ContactFormProps;

export interface PageSection {
  id: string;
  type: SectionType;
  order: number;
  props: SectionProps;
}

export interface PageLayout {
  id?: string;
  page_slug: string;
  layout_json: PageSection[];
  is_published: boolean;
  published_at?: string;
}

export const PAGE_SLUGS = [
  { slug: "accueil", label: "Accueil" },
  { slug: "about", label: "À propos" },
  { slug: "services", label: "Services" },
  { slug: "realisations", label: "Réalisations" },
  { slug: "contact", label: "Contact" },
] as const;

export const SECTION_META: Record<
  SectionType,
  { label: string; description: string; icon: string }
> = {
  hero: {
    label: "Hero",
    description: "Bannière principale avec image de fond",
    icon: "🖼️",
  },
  text: {
    label: "Texte",
    description: "Bloc de texte avec titre et contenu",
    icon: "✍️",
  },
  services: {
    label: "Services",
    description: "Liste de services avec icônes",
    icon: "⚙️",
  },
  gallery: { label: "Galerie", description: "Grille d'images", icon: "🖼️" },
  testimonials: {
    label: "Témoignages",
    description: "Avis clients en carousel",
    icon: "💬",
  },
  contact: {
    label: "Contact",
    description: "Coordonnées et formulaire",
    icon: "📍",
  },
  cta: {
    label: "Appel à action",
    description: "Bandeau d'appel à l'action",
    icon: "📣",
  },
  faq: { label: "FAQ", description: "Questions fréquentes", icon: "❓" },
  footer: {
    label: "Pied de page",
    description: "Footer avec liens et copyright",
    icon: "📌",
  },
  "featured-lots": {
    label: "Lots à la une",
    description: "Affiche les lots en vedette depuis la base de données",
    icon: "🏘️",
  },
  "site-realisations": {
    label: "Réalisations",
    description: "Affiche les réalisations en vedette depuis la base de données",
    icon: "🏗️",
  },
  "trust-signals": {
    label: "Signaux de confiance",
    description: "Barre de confiance (sécurité, rapidité, couverture, garantie)",
    icon: "🛡️",
  },
  advantages: {
    label: "Avantages",
    description: "Section 'Pourquoi nous choisir' avec icônes",
    icon: "⭐",
  },
  "stats-bar": {
    label: "Barre de stats",
    description: "Compteurs animés (projets, clients, années, régions)",
    icon: "📊",
  },
  "cta-band": {
    label: "Bandeau CTA",
    description: "Bandeau plein largeur avec double appel à l'action",
    icon: "📣",
  },
  "contact-form": {
    label: "Formulaire contact",
    description: "Formulaire de contact rapide avec coordonnées",
    icon: "📝",
  },
};

export function defaultProps(type: SectionType): SectionProps {
  switch (type) {
    case "hero":
      return {
        title: "BTP, immobilier et foncier sécurisés",
        subtitle:
          "Votre partenaire de confiance pour vos projets de construction, d'investissement et de valorisation.",
        bg_image_url: "",
        cta_text: "Nous contacter",
        cta_url: "/contact",
        overlay_opacity: 60,
      } as HeroProps;
    case "text":
      return {
        title: "Notre histoire",
        content:
          "Gnamba Services accompagne les particuliers et les entreprises dans leurs projets de construction, d'immobilier et de foncier.",
        align: "left",
      } as TextProps;
    case "services":
      return {
        title: "Nos Services",
        subtitle: "Des solutions complètes pour vos projets",
        items: [
          {
            icon: "🏗️",
            title: "Construction BTP",
            description: "Réalisation de bâtiments résidentiels et commerciaux",
          },
          {
            icon: "🏠",
            title: "Gestion Immobilière",
            description: "Location et gestion de patrimoine immobilier",
          },
          {
            icon: "🗺️",
            title: "Foncier",
            description: "Acquisition et valorisation de terrains",
          },
        ],
      } as ServicesProps;
    case "gallery":
      return {
        title: "Nos Réalisations",
        images: [],
        columns: 3,
      } as GalleryProps;
    case "testimonials":
      return {
        title: "Ce que disent nos clients",
        items: [
          {
            name: "Marie Dupont",
            role: "Cliente",
            text: "Un accompagnement clair et professionnel du début à la fin.",
            avatar_url: "",
          },
        ],
      } as TestimonialsProps;
    case "contact":
      return {
        title: "Contactez-nous",
        subtitle: "Notre équipe est à votre disposition",
        show_form: true,
        address: "Abidjan, Côte d'Ivoire",
        phone: "+225 00 00 00 00",
        email: "contact@gnambaservices.ci",
      } as ContactProps;
    case "cta":
      return {
        title: "Prêt à démarrer votre projet ?",
        subtitle: "Contactez-nous dès aujourd'hui pour un devis gratuit",
        button_text: "Demander un devis",
        button_url: "/contact",
        bg_color: "#0f766e",
      } as CTAProps;
    case "faq":
      return {
        title: "Questions Fréquentes",
        items: [
          {
            question: "Quels types de projets réalisez-vous ?",
            answer:
              "Nous réalisons des projets de construction résidentielle, commerciale et industrielle.",
          },
          {
            question: "Comment obtenir un devis ?",
            answer:
              "Contactez-nous via le formulaire ou par téléphone pour une consultation gratuite.",
          },
        ],
      } as FAQProps;
    case "footer":
      return {
        logo_url: "",
        tagline: "Votre partenaire de confiance",
        links: [
          { label: "Accueil", url: "/" },
          { label: "Services", url: "/services" },
          { label: "Contact", url: "/contact" },
        ],
        copyright: `© ${new Date().getFullYear()} Gnamba Services. Tous droits réservés.`,
        show_social: true,
      } as FooterProps;
    case "featured-lots":
      return {
        title: "Lots à Vendre — Sélection Premium",
        subtitle: "Sélection de lots actuellement mis en avant pour vos projets d'achat, d'investissement ou de revente.",
        limit: 3,
        show_category: true,
        show_status: true,
        show_price: true,
        show_surface: true,
        show_location: true,
        cta_text: "Voir tous les lots",
        cta_url: "/lots-disponibles",
      } as FeaturedLotsProps;
    case "site-realisations":
      return {
        title: "Projets Réalisés",
        subtitle: "Découvrez nos dernières réalisations dans le BTP, l'immobilier, le foncier et les fournitures.",
        limit: 3,
        show_category: true,
        show_year: true,
        show_location: true,
        cta_text: "Voir tout",
        cta_url: "/realisations",
      } as SiteRealisationsProps;
    case "trust-signals":
      return {
        title: "Pourquoi nous faire confiance ?",
        subtitle: "",
        items: [
          { icon: "shield", label: "Transactions sécurisées", description: "Vérification juridique complète" },
          { icon: "zap", label: "Réponse sous 24h", description: "Devis et suivi ultra-rapides" },
          { icon: "globe", label: "Couverture nationale", description: "Présence sur 3 régions ivoiriennes" },
          { icon: "target", label: "Résultats garantis", description: "Engagement satisfaction client" },
        ],
      } as TrustSignalsProps;
    case "advantages":
      return {
        title: "Pourquoi Choisir GNAMBA SERVICES ?",
        subtitle: "Notre approche met la réactivité, la proximité et un suivi clair au service de vos projets.",
        items: [
          { icon: "award", title: "Expertise terrain", description: "Plus de 5 ans d'expérience dans le BTP, l'immobilier et le foncier en Côte d'Ivoire." },
          { icon: "users", title: "Réactivité locale", description: "Des professionnels disponibles et joignables rapidement pour faire avancer vos dossiers." },
          { icon: "check-circle", title: "Un seul interlocuteur", description: "Un guichet unique pour la construction, l'immobilier, le foncier et les fournitures." },
          { icon: "star", title: "Suivi jusqu'au résultat", description: "Un accompagnement sur mesure à chaque étape, de la première prise de contact à la livraison." },
        ],
      } as AdvantagesProps;
    case "stats-bar":
      return {
        title: "",
        items: [
          { label: "Projets réalisés", value: "50+", icon: "hard-hat" },
          { label: "Clients accompagnés", value: "100+", icon: "users" },
          { label: "Années d'expertise", value: "5+", icon: "award" },
          { label: "Régions couvertes", value: "3", icon: "globe" },
        ],
      } as StatsBarProps;
    case "cta-band":
      return {
        title: "Prêt à Concrétiser Votre Projet ?",
        subtitle: "Parlez-nous de votre projet pour recevoir une proposition claire, rapide et adaptée au contexte ivoirien.",
        bg_color: "#1e3a5f",
        primary_button_text: "Demander un devis",
        primary_button_url: "/contact",
        secondary_button_text: "Voir nos réalisations",
        secondary_button_url: "/realisations",
      } as CTABandProps;
    case "contact-form":
      return {
        title: "Parlons de votre projet",
        subtitle: "Notre équipe vous accompagne rapidement pour tout projet de construction, achat, vente ou sécurisation foncière.",
        show_phone: true,
        show_email: true,
        phone: "+225 07 77 96 01 49",
        email: "contact@gnambaservices.ci",
      } as ContactFormProps;
  }
}
