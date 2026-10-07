import { useContentVersion } from "../../hooks/useContentVersion";
import { useEffect, useState } from "react";
import {
  HardHat,
  Building2,
  Map,
  Package,
  CheckCircle2,
  Users,
  Star,
  Award,
  ArrowRight,
  MessageCircle,
  Phone,
  Mail,
  Send,
  MapPin,
  Ruler,
  Tag,
  Shield,
  Zap,
  Globe,
  Target,
  Grid3X3,
} from "lucide-react";
import dbClient from "../../data/tableClient";
import { useSiteContent } from "../../context/SiteContentContext";
import { useSettings } from "../../context/SettingsContext";
import type { PublicPage } from "../../lib/publicRoutes";
import type { VitrineLot } from "../../types";
import { formatMontant } from "../../utils/reference";
import TrustBadges from "../../components/public/TrustBadges";
import ProjectSelector from "../../components/public/ProjectSelector";
import ProcessSteps from "../../components/public/ProcessSteps";
import Testimonials from "../../components/public/Testimonials";
import { OFFICIAL_CONTACT, buildWhatsAppUrl } from "../../lib/officialContact";

// Premium UI Components
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Container,
  Grid,
  Flex,
  IconWrapper,
  Skeleton,
} from "../../components/ui";

interface Realisation {
  id: string;
  title: string;
  description: string;
  category: string;
  year: number;
  location: string;
  image_url?: string;
}

interface ContactForm {
  name: string;
  phone: string;
  email: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  message?: string;
}

interface Props {
  onNavigate: (page: PublicPage) => void;
}

const categoryLabels: Record<string, string> = {
  btp: "BTP",
  immobilier: "Immobilier",
  foncier: "Foncier",
  fournitures: "Fournitures",
};

const VALID_CATEGORIES = [
  "btp",
  "immobilier",
  "foncier",
  "fournitures",
] as const;
type ValidCategory = (typeof VALID_CATEGORIES)[number];

const getCategoryLabel = (category: string): string => {
  if (VALID_CATEGORIES.includes(category as ValidCategory)) {
    return categoryLabels[category] || category;
  }
  return category;
};

function normalizeHeroTitle(rawTitle: string, companyName: string): string {
  const fallback = "BTP, immobilier et foncier sécurisés";
  const title = rawTitle.trim().replace(/\s+/g, " ");
  if (!title) return fallback;

  const lowerTitle = title.toLowerCase();
  const lowerCompany = companyName.toLowerCase();

  if (
    lowerTitle.includes(lowerCompany) ||
    /^bienvenue\b/i.test(title) ||
    /^accueil\b/i.test(title)
  ) {
    return fallback;
  }

  return title;
}

// Service icons and colors
const serviceColors = {
  btp: { primary: 'primary', light: 'bg-primary-50', icon: 'text-primary-600', border: 'border-primary-100', gradient: 'from-primary-500/10 to-primary-600/5', accent: 'bg-primary-600', accentHover: 'hover:bg-primary-700' },
  immobilier: { primary: 'sky', light: 'bg-sky-50', icon: 'text-sky-600', border: 'border-sky-100', gradient: 'from-sky-500/10 to-sky-600/5', accent: 'bg-sky-600', accentHover: 'hover:bg-sky-700' },
  foncier: { primary: 'emerald', light: 'bg-emerald-50', icon: 'text-emerald-600', border: 'border-emerald-100', gradient: 'from-emerald-500/10 to-emerald-600/5', accent: 'bg-emerald-600', accentHover: 'hover:bg-emerald-700' },
  fournitures: { primary: 'amber', light: 'bg-amber-50', icon: 'text-amber-600', border: 'border-amber-100', gradient: 'from-amber-500/10 to-amber-600/5', accent: 'bg-amber-600', accentHover: 'hover:bg-amber-700' },
};

const serviceIcons = {
  btp: HardHat,
  immobilier: Building2,
  foncier: Map,
  fournitures: Package,
};

export default function PublicHome({ onNavigate }: Props) {
  const { get } = useSiteContent();
  const { settings } = useSettings();
  const contentVersion = useContentVersion();
  const primaryColor = settings.primary_color || "#1e40af";
  const appCompany = OFFICIAL_CONTACT.companyName;

  const [realisations, setRealisations] = useState<Realisation[]>([]);
  const [loadingRealisations, setLoadingRealisations] = useState(true);
  const [featuredLots, setFeaturedLots] = useState<VitrineLot[]>([]);
  const [form, setForm] = useState<ContactForm>({
    name: "",
    phone: "",
    email: "",
    message: "",
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Anti-abus - Rate limiting (max 5 messages par heure)
  const RATE_LIMIT_MAX = 5;
  const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 heure

  const checkRateLimit = (): {
    allowed: boolean;
    remaining?: number;
    resetIn?: number;
  } => {
    if (typeof window === "undefined") return { allowed: true };

    const now = Date.now();
    const storageKey = "egs:contact_rate_limit";
    const data = JSON.parse(
      localStorage.getItem(storageKey) || '{"count": 0, "windowStart": 0}',
    );

    if (now - data.windowStart > RATE_LIMIT_WINDOW_MS) {
      return { allowed: true };
    }

    if (data.count >= RATE_LIMIT_MAX) {
      const resetIn = Math.ceil(
        (data.windowStart + RATE_LIMIT_WINDOW_MS - now) / 60000,
      );
      return { allowed: false, resetIn };
    }

    return { allowed: true, remaining: RATE_LIMIT_MAX - data.count };
  };

  const incrementRateLimit = () => {
    if (typeof window === "undefined") return;

    const now = Date.now();
    const storageKey = "egs:contact_rate_limit";
    const data = JSON.parse(
      localStorage.getItem(storageKey) || '{"count": 0, "windowStart": 0}',
    );

    if (now - data.windowStart > RATE_LIMIT_WINDOW_MS) {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ count: 1, windowStart: now }),
      );
    } else {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          count: data.count + 1,
          windowStart: data.windowStart,
        }),
      );
    }
  };

  useEffect(() => {
    void (async () => {
      try {
        const { data, error } = await dbClient
          .from("site_realisations")
          .select("id, title, description, category, year, location, image_url")
          .eq("featured", true)
          .order("sort_order")
          .limit(3);

        if (data) setRealisations(data);
        if (error) setRealisations([]);
      } finally {
        setLoadingRealisations(false);
      }
    })();
  }, []);

  useEffect(() => {
    void (async () => {
      const { data, error } = await dbClient
        .from("vitrine_lots")
        .select("*")
        .eq("publier_sur_vitrine", true)
        .order("ordre_affichage", { ascending: true })
        .order("created_at", { ascending: false })
        .limit(3);

      if (error) {
        setFeaturedLots([]);
        return;
      }

      setFeaturedLots((data as VitrineLot[]) || []);
    })();
  }, [contentVersion]); // <-- MODIFIÉ : était [] auparavant

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: FormErrors = {};

    if (!form.name || form.name.trim() === "") {
      errors.name = "Le nom est requis";
    }
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = "Email invalide";
    }
    if (!form.message || form.message.trim() === "") {
      errors.message = "Le message est requis";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setSubmitError(null);
      return;
    }

    setFormErrors({});
    setSubmitError(null);

    // Vérifier le rate limit avant envoi
    const rateLimit = checkRateLimit();
    if (!rateLimit.allowed) {
      setSubmitError(
        `Trop de tentatives. Veuillez réessayer dans ${rateLimit.resetIn} minute(s).`,
      );
      return;
    }

    setSending(true);

    try {
      const { error } = await dbClient.from("contact_messages").insert({
        nom: form.name.trim(),
        telephone: form.phone.trim(),
        email: form.email.trim(),
        sujet: "Contact via page d'accueil",
        message: form.message.trim(),
        statut: "nouveau",
      });

      if (error) throw error;

      // Incrémenter le compteur de rate limit après envoi réussi
      incrementRateLimit();

      setSent(true);
      setForm({ name: "", phone: "", email: "", message: "" });
    } catch (error: any) {
      setSubmitError(
        error.message || "L'envoi du message a échoué. Réessayez.",
      );
    } finally {
      setSending(false);
    }
  };

  const nav = (page: PublicPage) => {
    onNavigate(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const heroTitle = get(
    "hero",
    "title",
    "Votre terrain, votre construction, votre projet immobilier — accompagnés avec rigueur en Côte d'Ivoire.",
  );
  const heroHeadline = normalizeHeroTitle(heroTitle, appCompany);
  const heroSubtitle = get(
    "hero",
    "subtitle",
    "GNAMBA SERVICES vous accompagne à Sikensi et dans le Grand Abidjan pour sécuriser vos démarches foncières, construire avec sérénité et valoriser vos biens immobiliers.",
  );
  const ctaPrimary = get("hero", "cta_primary", "Échanger sur WhatsApp");
  const ctaSecondary = get("hero", "cta_secondary", "Voir les terrains disponibles");
  const primaryTarget: PublicPage = /whatsapp|échang/i.test(ctaPrimary)
    ? "contact"
    : /terrain|lot|disponib/i.test(ctaSecondary)
      ? "lots"
      : "realisations";
  const secondaryTarget: PublicPage = /terrain|lot|disponib/i.test(ctaSecondary)
    ? "lots"
    : /réalisations|realisations/i.test(ctaSecondary)
      ? "realisations"
      : "services";
  // Use settings.hero_background_url first, fallback to site_content
  const heroBg =
    settings.hero_background_url || get("hero", "background_url", "");

  const statsProjects = get("about", "stats_projects", "50+");
  const statsClients = get("about", "stats_clients", "100+");
  const statsYears = get("about", "stats_years", "5+");
  const statsEmployees = get("about", "stats_employees", "3 régions");

  const contactPhone = OFFICIAL_CONTACT.phone;
  const contactEmail = OFFICIAL_CONTACT.email;
  const whatsappLink = buildWhatsAppUrl(OFFICIAL_CONTACT.phone);

  const services = [
    {
      id: "foncier",
      icon: Map,
      title: get("services", "foncier_title", "Sécurisez votre projet foncier"),
      subtitle: "Accompagnement clair pour vos démarches, vérifications et projets de terrain",
      color: "foncier",
      items: [
        "Diagnostic complet avant achat : ACD, compulsoire, cadastre",
        "Vérification juridique et bornage des parcelles",
        "Sécurisation des droits de propriété",
        "Suivi administratif jusqu'à la finalisation",
      ],
      cta: "Parler de mon terrain",
      page: "foncier" as PublicPage,
    },
    {
      id: "btp",
      icon: HardHat,
      title: get("services", "btp_title", "Construisez avec un suivi fiable"),
      subtitle: "De l'étude à la livraison, nous organisons votre projet de construction avec méthode",
      color: "btp",
      items: [
        "Étude technique et conception adaptée à votre budget",
        "Suivi rigoureux du chantier et contrôle qualité",
        "Livraison clé en main et assistance post-travaux",
        "Devis transparent sous 48h, sans surprise",
      ],
      cta: "Demander un devis BTP",
      page: "services" as PublicPage,
    },
    {
      id: "immobilier",
      icon: Building2,
      title: get("services", "immobilier_title", "Valorisez votre bien immobilier"),
      subtitle: "Vente, mise en location ou accompagnement : présentez votre bien de manière professionnelle",
      color: "immobilier",
      items: [
        "Estimation juste et stratégie de commercialisation",
        "Gestion de la location : dossiers, contrats, suivi locataire",
        "Accompagnement complet des négociations",
        "Conseil patrimonial et optimisation fiscale",
      ],
      cta: "Faire estimer mon bien",
      page: "immobilier" as PublicPage,
    },
    {
      id: "lotissement",
      icon: Grid3X3,
      title: get("services", "lotissement_title", "Donnez forme à votre opération"),
      subtitle: "Préparez et coordonnez votre projet de lotissement avec un interlocuteur local",
      color: "fournitures",
      items: [
        "Conception et viabilisation des lots avec respect des normes",
        "Dossiers administratifs et autorisations",
        "Commercialisation et gestion des ventes",
        "Suivi du projet jusqu'à la réception",
      ],
      cta: "Étudier mon projet",
      page: "services" as PublicPage,
    },
  ];

  const advantages = [
    {
      icon: Award,
      title: "Expertise terrain",
      desc: `Plus de ${statsYears} d'expérience dans le BTP, l'immobilier et le foncier en Côte d'Ivoire.`,
    },
    {
      icon: Users,
      title: "Réactivité locale",
      desc: "Des professionnels disponibles et joignables rapidement pour faire avancer vos dossiers.",
    },
    {
      icon: CheckCircle2,
      title: "Un seul interlocuteur",
      desc: "Un guichet unique pour la construction, l'immobilier, le foncier et les fournitures.",
    },
    {
      icon: Star,
      title: "Suivi jusqu'au résultat",
      desc: "Un accompagnement sur mesure à chaque étape, de la première prise de contact à la livraison.",
    },
  ];

  const trustSignals = [
    { icon: Shield, label: "Transactions sécurisées", desc: "Vérification juridique complète" },
    { icon: Zap, label: "Réponse sous 24h", desc: "Devis et suivi ultra-rapides" },
    { icon: Globe, label: "Couverture nationale", desc: "Présence sur 3 régions ivoiriennes" },
    { icon: Target, label: "Résultats garantis", desc: "Engagement satisfaction client" },
  ];

  // Project Selector options
  const projectOptions = [
    {
      id: "foncier",
      icon: Map,
      title: "Sécuriser un terrain",
      problem: "Vous cherchez à acquérir ou à sécuriser une parcelle en Côte d'Ivoire",
      action: "Vérification documentaire • ACD & Cadastre • Bornage",
      color: "foncier" as const,
      ctaText: "Parler de mon terrain",
      onClick: () => nav("foncier"),
    },
    {
      id: "btp",
      icon: HardHat,
      title: "Construire votre projet",
      problem: "Vous avez un projet de construction, extension ou rénovation",
      action: "Étude • Suivi de chantier • Livraison clé en main",
      color: "btp" as const,
      ctaText: "Demander un devis BTP",
      onClick: () => nav("services"),
    },
    {
      id: "immobilier",
      icon: Building2,
      title: "Valoriser un bien",
      problem: "Vous souhaitez vendre, louer ou faire estimer un bien",
      action: "Estimation • Commercialisation • Gestion locative",
      color: "immobilier" as const,
      ctaText: "Faire estimer mon bien",
      onClick: () => nav("immobilier"),
    },
    {
      id: "lotissement",
      icon: Grid3X3,
      title: "Lotir & Aménager",
      problem: "Vous préparez une opération de lotissement ou d'aménagement",
      action: "Conception • Dossiers administratifs • Suivi de travaux",
      color: "lotissement" as const,
      ctaText: "Étudier mon projet",
      onClick: () => nav("services"),
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {heroBg ? (
          <img
            src={heroBg}
            alt={`Vue d'ensemble des réalisations ${appCompany}`}
            crossOrigin="anonymous"
            className="absolute inset-0 h-full w-full object-cover"
            loading="eager"
            fetchPriority="high"
            decoding="async"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, #0f172a 0%, ${primaryColor}40 40%, ${primaryColor} 100%)`,
            }}
          />
        )}
        {heroBg && <div className="absolute inset-0 bg-black/50" />}
        {!heroBg && (
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        )}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white/5 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-neutral-900/20" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Trust badge */}
          <div className="mb-10 flex items-center justify-center">
            <div className="inline-flex items-center gap-3 bg-white/10 border border-white/20 rounded-full px-6 py-2.5 backdrop-blur-sm">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-white/90 text-sm font-medium">Entreprise certifiée</span>
              </div>
              <div className="w-px h-6 bg-white/20 mx-1" />
              <span className="text-white/90 text-sm font-medium">Sikensi, Côte d'Ivoire</span>
            </div>
          </div>

          {/* Hero Content */}
          <div className="text-center max-w-5xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-white leading-tight mb-6 max-w-4xl mx-auto tracking-tight">
              <span className="bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent">
                {heroHeadline}
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-white/80 max-w-3xl mx-auto leading-relaxed mb-10">
              {heroSubtitle}
            </p>

            {/* CTA Group */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Button
                onClick={() => nav(primaryTarget)}
                size="lg"
                iconRight={<ArrowRight size={20} aria-hidden="true" />}
                className="shadow-primary hover:shadow-primaryHover"
              >
                {ctaPrimary}
              </Button>
              <Button
                variant="outline"
                onClick={() => nav(secondaryTarget)}
                size="lg"
                className="border-white/30 text-white hover:bg-white/10 hover:border-white/50"
              >
                {ctaSecondary}
              </Button>
              {whatsappLink && (
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:flex items-center justify-center gap-2 px-8 py-4 bg-emerald-500/90 hover:bg-emerald-500 text-white rounded-2xl font-semibold text-base transition-all duration-200 shadow-lg"
                  aria-label="Contacter l'équipe par WhatsApp"
                >
                  <MessageCircle size={18} aria-hidden="true" />
                  WhatsApp
                </a>
              )}
            </div>

            {/* Trust Badges - 3 preuves immédiates */}
            <TrustBadges className="mt-12 mb-16" />

            {/* Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto">
              {[
                { n: statsProjects, l: "Projets réalisés", icon: HardHat },
                { n: statsClients, l: "Clients accompagnés", icon: Users },
                { n: statsYears, l: "Années d'expertise", icon: Award },
                { n: statsEmployees, l: "Régions couvertes", icon: Globe },
              ].map((s) => (
                <div key={s.l} className="text-center">
                  <IconWrapper size="md" variant="ghost" className="text-white mx-auto mb-3" shape="circle">
                    <s.icon size={24} className="text-white/90" />
                  </IconWrapper>
                  <div className="text-3xl sm:text-4xl font-extrabold text-white leading-none">{s.n}</div>
                  <div className="text-sm text-white/60 mt-1">{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
            <div className="w-7 h-10 border-2 border-white/40 rounded-full flex items-start justify-center pt-2">
              <div className="w-1.5 h-2.5 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '1s' }} />
            </div>
          </div>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="py-12 bg-white border-y border-neutral-100">
        <Container size="xl">
          <Grid cols={{ base: 2, md: 4 }} gap="md" className="text-center">
            {trustSignals.map((signal, _i) => (
              <Flex key={signal.label} direction="col" align="center" gap="2" className="group">
                <IconWrapper size="lg" variant="primary" shape="circle" className="mb-3 group-hover:scale-110 transition-transform duration-300">
                  <signal.icon size={28} className="text-primary-600" />
                </IconWrapper>
                <p className="font-semibold text-neutral-900 text-sm">{signal.label}</p>
                <p className="text-neutral-500 text-xs">{signal.desc}</p>
              </Flex>
            ))}
          </Grid>
        </Container>
      </section>

      {/* Project Selector - Quel est votre projet ? */}
      <ProjectSelector options={projectOptions} />

      {/* Services Section */}
      <section className="py-20 sm:py-24 lg:py-28 bg-white">
        <Container size="xl">
          <Flex direction="col" align="center" gap="4" className="mb-16 text-center max-w-3xl mx-auto">
            <Badge variant="primary" size="md" className="text-xs">
              Ce que nous faisons
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-neutral-900 leading-tight">
              Nos Domaines d'Expertise
            </h2>
            <p className="text-neutral-500 text-lg leading-relaxed">
              Une offre complète pensée pour sécuriser vos projets et accélérer
              vos décisions d'achat, de vente ou de chantier en Côte d'Ivoire.
            </p>
          </Flex>

          <Grid cols={{ base: 1, sm: 2, lg: 4 }} gap="lg">
            {services.map((s) => {
              const Icon = s.icon;
              const c = serviceColors[s.color as keyof typeof serviceColors];
              return (
                <Card
                  key={s.id}
                  variant="default"
                  interactive
                  padding="lg"
                  onClick={() => nav(s.page)}
                  className="group h-full flex flex-col"
                >
                  <CardHeader className="mb-5">
                    <IconWrapper size="xl" variant={c.primary as any} shape="circle" className="mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Icon size={32} className={c.icon} />
                    </IconWrapper>
                    <Flex align="center" gap="2" className="mb-2">
                      <span className="text-xs font-semibold uppercase tracking-widest text-primary-600">Service</span>
                      <Badge variant="outline" size="sm">{getCategoryLabel(s.id)}</Badge>
                    </Flex>
                    <CardTitle className="text-xl font-bold text-neutral-900">{s.title}</CardTitle>
                    <CardDescription className="text-sm text-neutral-600">{s.subtitle}</CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1 mb-6">
                    <ul className="space-y-3">
                      {s.items.map((item) => (
                        <li key={item} className="flex items-start gap-3">
                          <span className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: primaryColor }} />
                          <span className="text-sm text-neutral-700 leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <Flex gap="2" className="pt-4 border-t border-neutral-100">
                    <ArrowRight size={14} className="text-primary-600 group-hover:translate-x-1 transition-transform" />
                    <span className="text-sm font-semibold text-primary-600 group-hover:text-primary-700">{s.cta || "En savoir plus"}</span>
                  </Flex>
                </Card>
              );
            })}
          </Grid>
        </Container>
      </section>

      {/* Featured Lots */}
      {featuredLots.length > 0 && (
        <section className="py-20 sm:py-24 lg:py-28 bg-neutral-50">
          <Container size="xl">
            <Flex direction="col" align="center" gap="4" className="mb-12 text-center max-w-3xl mx-auto">
              <Badge variant="secondary" size="md" className="text-xs">
                Opportunités actuelles
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 leading-tight">
                Lots à Vendre — Sélection Premium
              </h2>
              <p className="text-neutral-500 text-lg leading-relaxed">
                Sélection de lots actuellement mis en avant pour vos projets
                d'achat, d'investissement ou de revente.
              </p>
            </Flex>

            <Grid cols={{ base: 1, md: 2, lg: 3 }} gap="lg">
              {featuredLots.map((lot) => (
                <Card key={lot.id} variant="elevated" padding="none" className="overflow-hidden h-full flex flex-col">
                  <div className="relative h-56 bg-gradient-to-br from-primary-100 to-emerald-100 flex items-center justify-center overflow-hidden">
                    {lot.image_url ? (
                      <img
                        src={lot.image_url}
                        alt={lot.image_alt || lot.titre}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="text-center px-6">
                        <MapPin className="w-14 h-14 text-primary-300 mx-auto mb-3" />
                        <p className="text-sm font-medium text-neutral-500">{lot.image_alt || lot.titre}</p>
                      </div>
                    )}
                    <div className="absolute top-3 left-3 z-10">
                      <Badge variant="primary" size="sm">{getCategoryLabel(lot.type_bien || 'btp')}</Badge>
                    </div>
                    <div className="absolute top-3 right-3 z-10">
                      <Badge
                        size="sm"
                        variant={
                          lot.statut === "disponible" ? "success" :
                          lot.statut === "reserve" ? "warning" : "default"
                        }
                      >
                        {lot.statut === "disponible" ? "Disponible" : lot.statut === "reserve" ? "Réservé" : "Vendu"}
                      </Badge>
                    </div>
                  </div>

                  <CardContent padding="lg" className="flex-1 flex flex-col">
                    <Flex justify="between" align="start" gap="3" className="mb-4">
                      <div>
                        <CardTitle className="text-lg font-bold text-neutral-900">{lot.titre}</CardTitle>
                        <p className="text-sm text-neutral-500 mt-0.5">{lot.reference}</p>
                      </div>
                    </Flex>

                    <p className="text-sm text-neutral-600 leading-relaxed mb-5 line-clamp-3 flex-1">{lot.description}</p>

                    <div className="space-y-3 mb-5">
                      <Flex justify="between" className="text-sm text-neutral-700">
                        <Flex align="center" gap="2">
                          <Ruler size={15} className="text-neutral-400" />
                          <span>{Number(lot.superficie)} m²</span>
                        </Flex>
                      </Flex>
                      <Flex justify="between" className="text-sm text-neutral-700">
                        <Flex align="center" gap="2">
                          <Tag size={15} className="text-neutral-400" />
                          <span className="font-semibold text-neutral-900">{formatMontant(Number(lot.prix_vente))} FCFA</span>
                        </Flex>
                      </Flex>
                      <Flex justify="between" className="text-sm text-neutral-700">
                        <Flex align="center" gap="2">
                          <MapPin size={15} className="text-neutral-400" />
                          <span className="font-medium text-neutral-900 text-right">{lot.village}</span>
                        </Flex>
                      </Flex>
                    </div>

                    {lot.caracteristiques && lot.caracteristiques.length > 0 && (
                      <Flex wrap gap="2" className="mb-5">
                        {lot.caracteristiques.slice(0, 3).map((feature, index) => (
                          <Badge key={`${feature}-${index}`} variant="outline" size="sm">{feature}</Badge>
                        ))}
                      </Flex>
                    )}

                    <Flex gap="2" className="pt-4 border-t border-neutral-100">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => nav("contact")}
                        className="flex-1"
                      >
                        Contacter
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`tel:${(lot.contact_phone || contactPhone).replace(/\s+/g, "")}`, '_self')}
                        className="flex-1"
                      >
                        <Phone size={15} />
                        Appeler
                      </Button>
                    </Flex>
                  </CardContent>
                </Card>
              ))}
            </Grid>

            <Flex justify="center" className="mt-10">
              <Button variant="outline" size="lg" onClick={() => nav("lots")} iconRight={<ArrowRight size={18} />}>
                Voir tous les lots
              </Button>
            </Flex>
          </Container>
        </section>
      )}

      {/* Réalisations */}
      {realisations.length > 0 && (
        <section className="py-20 sm:py-24 lg:py-28 bg-white">
          <Container size="xl">
            <Flex justify="between" align="center" wrap gap="4" className="mb-12">
              <Flex direction="col" gap="2">
                <Badge variant="primary" size="md" className="text-xs">Notre portfolio</Badge>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-900">Projets Réalisés</h2>
              </Flex>
              <Button variant="outline" size="md" onClick={() => nav("realisations")} iconRight={<ArrowRight size={15} />}>
                Voir tout
              </Button>
            </Flex>

            <Grid cols={{ base: 1, md: 2, lg: 3 }} gap="lg">
              {loadingRealisations
                ? [1, 2, 3].map((i) => (
                    <Card key={i} variant="default" padding="none" className="overflow-hidden animate-pulse">
                      <Skeleton variant="rectangular" className="h-56 w-full" />
                      <CardContent padding="lg">
                        <Skeleton variant="text" width="3/4" className="mb-3" />
                        <Skeleton variant="text" width="full" className="mb-2" />
                        <Skeleton variant="text" width="2/3" />
                      </CardContent>
                    </Card>
                  ))
                : realisations.map((r) => {
                    const Icon = serviceIcons[r.category as keyof typeof serviceIcons] || HardHat;
                    const c = serviceColors[r.category as keyof typeof serviceColors] || serviceColors.btp;
                    return (
                      <Card
                        key={r.id}
                        variant="default"
                        padding="none"
                        className="overflow-hidden group h-full flex flex-col"
                      >
                        <div className={`relative h-56 bg-gradient-to-br ${c.gradient} flex items-center justify-center overflow-hidden`}>
                          {r.image_url ? (
                            <img
                              src={r.image_url}
                              alt={r.title}
                              crossOrigin="anonymous"
                              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              loading="lazy"
                              decoding="async"
                            />
                          ) : (
                            <>
                              <div className="absolute inset-0 bg-gradient-to-br from-primary-700/20 to-primary-900/40" />
                              <Icon size={56} className="text-white/60 relative z-10" />
                            </>
                          )}
                          <div className="absolute top-3 left-3 z-10">
                            <Badge variant="primary" size="sm">{getCategoryLabel(r.category)}</Badge>
                          </div>
                          <div className="absolute bottom-3 right-3 z-10">
                            <Badge variant="outline" size="sm" className="bg-black/40 text-white border-white/20">{r.year}</Badge>
                          </div>
                        </div>
                        <CardContent padding="lg" className="flex-1 flex flex-col">
                          <CardTitle className="text-lg font-bold text-neutral-900 mb-2 group-hover:text-primary-600 transition-colors">{r.title}</CardTitle>
                          <p className="text-sm text-neutral-500 leading-relaxed mb-4 flex-1 line-clamp-2">{r.description}</p>
                          <Flex align="center" justify="between" className="text-xs text-neutral-400 pt-2 border-t border-neutral-100">
                            <Flex align="center" gap="1.5">
                              <MapPin size={11} />
                              {r.location}
                            </Flex>
                          </Flex>
                        </CardContent>
                      </Card>
                    );
                  })}
            </Grid>
          </Container>
        </section>
      )}

      {/* Social Wall - Commenté jusqu'à contenu réel */}
      {/* <PublicSocialWall /> */}

      {/* Why Choose Us */}
      <section className="py-20 sm:py-24 lg:py-28 bg-neutral-50">
        <Container size="xl">
          <Flex direction="col" align="center" gap="4" className="mb-16 text-center max-w-3xl mx-auto">
            <Badge variant="primary" size="md" className="text-xs">Nos atouts</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 leading-tight">Pourquoi Choisir {appCompany} ?</h2>
            <p className="text-neutral-500 text-lg leading-relaxed">Notre approche met la réactivité, la proximité et un suivi clair au service de vos projets.</p>
          </Flex>

          <Grid cols={{ base: 1, sm: 2, lg: 4 }} gap="lg">
            {advantages.map((a) => {
              const Icon = a.icon;
              return (
                <Card key={a.title} variant="default" padding="xl" className="text-center group h-full">
                  <IconWrapper size="xl" variant="primary" shape="circle" className="mx-auto mb-5 group-hover:scale-110 group-hover:bg-primary-600 transition-all duration-300">
                    <Icon size={28} className="text-primary-600 group-hover:text-white transition-colors duration-300" />
                  </IconWrapper>
                  <CardTitle className="text-lg font-bold text-neutral-900 mb-2">{a.title}</CardTitle>
                  <p className="text-sm text-neutral-500 leading-relaxed">{a.desc}</p>
                </Card>
              );
            })}
          </Grid>
        </Container>
      </section>

      {/* Process Steps - Comment on travaille */}
      <ProcessSteps />

      {/* Testimonials - Voix de nos clients */}
      <Testimonials />

      {/* CTA Band */}
      <section className="relative py-20 sm:py-24 lg:py-28 overflow-hidden" style={{ background: `linear-gradient(135deg, #1e3a5f 0%, ${primaryColor}40 40%, ${primaryColor} 100%)` }}>
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")` }} />
        <Container size="lg" className="relative z-10 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-4">Vous avez un terrain, un chantier ou un bien à valoriser ?</h2>
          <p className="text-primary-100 text-lg mb-10 max-w-2xl mx-auto leading-relaxed">Expliquez-nous votre projet. Un conseiller GNAMBA SERVICES vous répond avec les prochaines étapes adaptées à votre besoin.</p>
          <Flex justify="center" gap="4" wrap>
            {whatsappLink && (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 bg-white text-primary-700 hover:bg-primary-50 rounded-2xl font-semibold text-base transition-all duration-200 shadow-lg flex items-center justify-center gap-2"
                aria-label="Demander mon devis par WhatsApp"
              >
                <MessageCircle size={18} aria-hidden="true" />
                Demander mon devis
              </a>
            )}
            <Button size="lg" variant="outline" onClick={() => nav("contact")} iconRight={<ArrowRight size={18} />} className="border-white/30 text-white hover:bg-white/10 hover:border-white/50">
              Formulaire de contact
            </Button>
          </Flex>
        </Container>
      </section>

      {/* Quick Contact */}
      <section className="py-20 sm:py-24 lg:py-28 bg-neutral-50">
        <Container size="xl">
          <Grid cols={{ base: 1, lg: 2 }} gap="xl" align="center">
            <div>
              <Badge variant="primary" size="md" className="text-xs mb-4">Contactez-nous</Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 mb-4 leading-tight">Parlons de votre projet</h2>
              <p className="text-neutral-500 mb-8 leading-relaxed">Notre équipe vous accompagne rapidement pour tout projet de construction, achat, vente ou sécurisation foncière.</p>

              <Flex direction="col" gap="4">
                {contactPhone && (
                  <Flex align="center" gap="4">
                    <IconWrapper size="md" variant="primary" shape="circle">
                      <Phone size={20} className="text-primary-700" />
                    </IconWrapper>
                    <div>
                      <p className="text-xs text-neutral-400 font-medium uppercase tracking-wide">Téléphone</p>
                      <a href={`tel:${contactPhone.replace(/\s+/g, "")}`} className="text-neutral-700 font-semibold hover:text-primary-600 transition-colors">{contactPhone}</a>
                    </div>
                  </Flex>
                )}
                <Flex align="center" gap="4">
                  <IconWrapper size="md" variant="primary" shape="circle">
                    <Mail size={20} className="text-primary-700" />
                  </IconWrapper>
                  <div>
                    <p className="text-xs text-neutral-400 font-medium uppercase tracking-wide">Email</p>
                    <a href={`mailto:${contactEmail}`} className="text-neutral-700 font-semibold hover:text-primary-600 transition-colors">{contactEmail}</a>
                  </div>
                </Flex>
              </Flex>
            </div>

            <Card variant="elevated" padding="xl">
              {sent ? (
                <Flex direction="col" align="center" gap="4" className="py-8 text-center">
                  <IconWrapper size="xl" variant="success" shape="circle" className="mb-2">
                    <CheckCircle2 size={32} className="text-emerald-600" />
                  </IconWrapper>
                  <CardTitle className="text-xl">Message envoyé !</CardTitle>
                  <p className="text-neutral-500 text-sm max-w-sm">Nous vous répondrons dans les plus brefs délais.</p>
                  <Button variant="primary" size="md" onClick={() => setSent(false)}>Envoyer un autre message</Button>
                </Flex>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  <CardTitle className="text-lg mb-6">Envoyez-nous un message</CardTitle>
                  {submitError && (
                    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{submitError}</div>
                  )}

                  <Grid cols={{ base: 1, sm: 2 }} gap="md">
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 mb-1.5">Nom complet *</label>
                      <input
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Votre nom"
                        className={`w-full border rounded-xl px-4 py-3 text-base focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition ${formErrors.name ? "border-red-400 bg-red-50" : "border-neutral-200"}`}
                        required
                        aria-invalid={!!formErrors.name}
                      />
                      {formErrors.name && <p className="mt-1 text-xs text-red-600 font-medium">{formErrors.name}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 mb-1.5">Téléphone</label>
                      <input
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="+225 XX XX XX XX XX"
                        className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition"
                      />
                    </div>
                  </Grid>

                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1.5">Email *</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="votre@email.com"
                      className={`w-full border rounded-xl px-4 py-3 text-base focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition ${formErrors.email ? "border-red-400 bg-red-50" : "border-neutral-200"}`}
                      required
                      aria-invalid={!!formErrors.email}
                    />
                    {formErrors.email && <p className="mt-1 text-xs text-red-600 font-medium">{formErrors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1.5">Message *</label>
                    <textarea
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="Décrivez votre projet..."
                      rows={4}
                      className={`w-full border rounded-xl px-4 py-3 text-base focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition resize-none ${formErrors.message ? "border-red-400 bg-red-50" : "border-neutral-200"}`}
                      required
                      aria-invalid={!!formErrors.message}
                      aria-describedby={
                        formErrors.message ? "message-error" : undefined
                      }
                    />
                    {formErrors.message && <p className="mt-1 text-xs text-red-600 font-medium">{formErrors.message}</p>}
                  </div>

                  <Button type="submit" disabled={sending} size="lg" iconLeft={<Send size={16} />} className="w-full min-h-[48px]">
                    {sending ? "Envoi en cours..." : "Envoyer la demande"}
                  </Button>
                </form>
              )}
            </Card>
          </Grid>
        </Container>
      </section>
    </div>
  );
}