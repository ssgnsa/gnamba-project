export type SectionType =
  | "hero"
  | "text"
  | "services"
  | "gallery"
  | "testimonials"
  | "contact"
  | "cta"
  | "faq"
  | "footer";

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

export type SectionProps =
  | HeroProps
  | TextProps
  | ServicesProps
  | GalleryProps
  | TestimonialsProps
  | ContactProps
  | CTAProps
  | FAQProps
  | FooterProps;

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
};

export function defaultProps(type: SectionType): SectionProps {
  switch (type) {
    case "hero":
      return {
        title: "Bienvenue chez Gnamba Services",
        subtitle:
          "Votre partenaire de confiance pour vos projets BTP et immobiliers",
        bg_image_url: "",
        cta_text: "Nous contacter",
        cta_url: "/contact",
        overlay_opacity: 60,
      } as HeroProps;
    case "text":
      return {
        title: "Notre histoire",
        content:
          "Gnamba Services est une entreprise spécialisée dans la construction et la gestion immobilière.",
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
            text: "Excellent service, je recommande vivement Gnamba Services.",
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
  }
}
