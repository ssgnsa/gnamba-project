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
  ChevronRight,
} from "lucide-react";
import dbClient from "../../data/tableClient";
import { useSiteContent } from "../../context/SiteContentContext";
import { useSettings } from "../../context/SettingsContext";
import type { PublicPage } from "../../lib/publicRoutes";
import type { VitrineLot } from "../../types";
import { formatMontant } from "../../utils/reference";
import PublicSocialWall from "../../components/public/PublicSocialWall";
import { OFFICIAL_CONTACT, buildWhatsAppUrl } from "../../lib/officialContact";

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

const colorClasses = {
  blue: {
    bg: "bg-blue-50",
    icon: "bg-blue-700 text-white",
    border: "border-blue-100 hover:border-blue-300",
    dot: "bg-blue-600",
  },
  sky: {
    bg: "bg-sky-50",
    icon: "bg-sky-600 text-white",
    border: "border-sky-100 hover:border-sky-300",
    dot: "bg-sky-600",
  },
  emerald: {
    bg: "bg-emerald-50",
    icon: "bg-emerald-600 text-white",
    border: "border-emerald-100 hover:border-emerald-300",
    dot: "bg-emerald-600",
  },
  amber: {
    bg: "bg-amber-50",
    icon: "bg-amber-600 text-white",
    border: "border-amber-100 hover:border-amber-300",
    dot: "bg-amber-600",
  },
};

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

export default function PublicHome({ onNavigate }: Props) {
  const { get } = useSiteContent();
  const { settings } = useSettings();
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
  }, []);

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
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        message: form.message.trim(),
      });

      if (error) throw error;

      // Incrémenter le compteur de rate limit après envoi réussi
      incrementRateLimit();

      setSent(true);
      setForm({ name: "", phone: "", email: "", message: "" });
    } catch (error: any) {
      setSubmitError(
        error.message || "L’envoi du message a échoué. Réessayez.",
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
    "L'expertise qui transforme vos opportunités en patrimoine.",
  );
  const heroHeadline = normalizeHeroTitle(heroTitle, appCompany);
  const heroSubtitle = get(
    "hero",
    "subtitle",
    "De l'acquisition du terrain à la livraison clé en main, GNAMBA SERVICES accompagne votre projet de A à Z.",
  );
  const ctaPrimary = get("hero", "cta_primary", "Demander un devis gratuit");
  const ctaSecondary = get("hero", "cta_secondary", "Voir nos réalisations");
  const primaryTarget: PublicPage = /réalisations|realisations/i.test(
    ctaPrimary,
  )
    ? "realisations"
    : /service|découvr|decouvr/i.test(ctaPrimary)
      ? "services"
      : "contact";
  const secondaryTarget: PublicPage = /réalisations|realisations/i.test(
    ctaSecondary,
  )
    ? "realisations"
    : /service|découvr|decouvr/i.test(ctaSecondary)
      ? "services"
      : "contact";
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
      icon: HardHat,
      title: get("services", "btp_title", "BTP & Construction"),
      color: "blue",
      items: [
        "Villas, immeubles et rénovation",
        "Suivi de chantier et contrôle qualité",
        "Livraison clé en main",
        "Devis rapide sous 48h",
      ],
      page: "services" as PublicPage,
    },
    {
      icon: Building2,
      title: get("services", "immobilier_title", "Immobilier"),
      color: "sky",
      items: [
        "Achat et vente de biens",
        "Gestion locative",
        "Conseil patrimonial",
        "Accompagnement des dossiers",
      ],
      page: "services" as PublicPage,
    },
    {
      icon: Map,
      title: get("services", "foncier_title", "Foncier sécurisé"),
      color: "emerald",
      items: [
        "Vérification documentaire",
        "ACD, compulsoire et cadastre",
        "Bornage et sécurisation des parcelles",
        "Achat terrain sans risque",
      ],
      page: "services" as PublicPage,
    },
    {
      icon: Package,
      title: get(
        "services",
        "fournitures_title",
        "Fournitures professionnelles",
      ),
      color: "amber",
      items: [
        "Mobilier de bureau",
        "Équipements et consommables",
        "Solutions pour PME et chantiers",
        "Livraison rapide",
      ],
      page: "services" as PublicPage,
    },
  ];

  const advantages = [
    {
      icon: Award,
      title: "Expertise de terrain",
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

  return (
    <div>
      {/* Hero */}
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
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        )}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white/5 to-transparent" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-8">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-white/90 text-sm font-medium">
              Entreprise certifiée · Sikensi, Côte d'Ivoire
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-tight mb-6 max-w-4xl mx-auto">
            <span
              className="block text-transparent bg-clip-text"
              style={{
                backgroundImage: `linear-gradient(135deg, ${primaryColor}40 0%, ${primaryColor}80 100%)`,
              }}
            >
              {heroHeadline}
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-white/75 max-w-3xl mx-auto leading-relaxed mb-10">
            {heroSubtitle}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => nav(primaryTarget)}
              className="flex items-center justify-center gap-2 px-8 py-4 text-white rounded-2xl font-semibold text-base transition-all duration-200 shadow-lg hover:-translate-y-0.5"
              style={{
                backgroundColor: primaryColor,
                boxShadow: `0 10px 25px -5px ${primaryColor}50`,
              }}
              onMouseOver={(e) => (e.currentTarget.style.opacity = "0.9")}
              onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
              aria-label={ctaPrimary}
            >
              {ctaPrimary}
              <ArrowRight size={18} aria-hidden="true" />
            </button>
            <button
              onClick={() => nav(secondaryTarget)}
              className="flex items-center justify-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/30 text-white rounded-2xl font-semibold text-base transition-all duration-200 backdrop-blur-sm"
              aria-label={ctaSecondary}
            >
              {ctaSecondary}
            </button>
            {whatsappLink && (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-8 py-4 bg-emerald-500/90 hover:bg-emerald-500 text-white rounded-2xl font-semibold text-base transition-all duration-200 shadow-lg"
                aria-label="Contacter l'équipe par WhatsApp"
              >
                <MessageCircle size={18} aria-hidden="true" />
                WhatsApp
              </a>
            )}
          </div>

          <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-2xl mx-auto">
            {[
              { n: statsProjects, l: "Projets réalisés" },
              { n: statsClients, l: "Clients accompagnés" },
              { n: statsYears, l: "Années d'expertise" },
              { n: statsEmployees, l: "Régions couvertes" },
            ].map((s) => (
              <div key={s.l} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-white">
                  {s.n}
                </div>
                <div className="text-xs sm:text-sm text-white/60 mt-1">
                  {s.l}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-9 border-2 border-white/40 rounded-full flex items-start justify-center pt-1.5">
            <div className="w-1 h-2 bg-white/60 rounded-full" />
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-blue-600 font-semibold text-sm uppercase tracking-widest">
              Ce que nous faisons
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2 mb-4">
              Nos Domaines d'Expertise
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Une offre complète pensée pour sécuriser vos projets et accélérer
              vos décisions d'achat, de vente ou de chantier en Côte d'Ivoire.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((s) => {
              const Icon = s.icon;
              const c = colorClasses[s.color as keyof typeof colorClasses];
              return (
                <div
                  key={s.title}
                  onClick={() => nav(s.page)}
                  className={`group cursor-pointer border-2 ${c.border} rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg`}
                >
                  <div
                    className={`w-12 h-12 ${c.icon} rounded-xl flex items-center justify-center mb-4 shadow-sm`}
                  >
                    <Icon size={22} />
                  </div>
                  <h3 className="font-bold text-gray-900 text-base mb-3">
                    {s.title}
                  </h3>
                  <ul className="space-y-1.5">
                    {s.items.map((item) => (
                      <li
                        key={item}
                        className="flex items-center gap-2 text-sm text-gray-500"
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${c.dot} flex-shrink-0`}
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 flex items-center gap-1 text-sm font-medium text-blue-600 group-hover:gap-2 transition-all">
                    En savoir plus <ChevronRight size={14} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {featuredLots.length > 0 && (
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold">Lots à vendre</h2>
              <p className="text-gray-500">
                Sélection de lots actuellement mise en avant pour vos projets
                d'achat, d'investissement ou de revente.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredLots.map((lot) => (
                <div
                  key={lot.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100"
                >
                  {lot.image_url ? (
                    <img
                      src={lot.image_url}
                      alt={lot.image_alt || lot.titre}
                      className="h-48 w-full object-cover"
                    />
                  ) : (
                    <div className="h-48 bg-slate-100 flex items-center justify-center text-sm text-slate-400 px-4 text-center">
                      {lot.image_alt || lot.titre}
                    </div>
                  )}

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-gray-900 mb-1.5">
                          {lot.titre}
                        </h3>
                        <p className="text-sm text-gray-500 mb-3 line-clamp-3">
                          {lot.description}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          lot.statut === "disponible"
                            ? "bg-emerald-50 text-emerald-700"
                            : lot.statut === "reserve"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {lot.statut === "disponible"
                          ? "Disponible"
                          : lot.statut === "reserve"
                            ? "Réservé"
                            : "Vendu"}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm text-gray-700">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-gray-500">Surface</span>
                        <span className="font-semibold">
                          {Number(lot.superficie)} m²
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-gray-500">Prix</span>
                        <span className="font-semibold text-gray-900">
                          {formatMontant(Number(lot.prix_vente))} FCFA
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-gray-500">Localisation</span>
                        <span className="font-semibold text-right">
                          {lot.village}
                        </span>
                      </div>
                    </div>

                    {lot.caracteristiques.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {lot.caracteristiques.slice(0, 3).map((feature) => (
                          <span
                            key={feature}
                            className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-600"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => nav("contact")}
                        className="px-4 py-2 rounded-xl text-white text-sm"
                        style={{ backgroundColor: primaryColor }}
                      >
                        Contacter
                      </button>
                      <a
                        href={`tel:${(lot.contact_phone || contactPhone).replace(/\s+/g, "")}`}
                        className="px-4 py-2 rounded-xl border border-gray-200 text-sm"
                      >
                        Appeler
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Réalisations */}
      {realisations.length > 0 && (
        <section className="py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-12 gap-4">
              <div>
                <span className="text-blue-600 font-semibold text-sm uppercase tracking-widest">
                  Notre portfolio
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-1">
                  Projets Réalisés
                </h2>
              </div>
              <button
                onClick={() => nav("realisations")}
                className="flex items-center gap-2 px-5 py-3 border-2 border-blue-200 hover:border-blue-400 text-blue-700 rounded-xl text-sm font-semibold transition-all hover:bg-blue-50 min-h-[44px]"
                aria-label="Voir toutes les réalisations"
              >
                Voir tout <ArrowRight size={15} aria-hidden="true" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {loadingRealisations
                ? // Skeleton loading
                  [1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 animate-pulse"
                    >
                      <div className="h-48 bg-gray-200" />
                      <div className="p-5 space-y-3">
                        <div className="h-5 bg-gray-200 rounded w-3/4" />
                        <div className="h-4 bg-gray-200 rounded w-full" />
                        <div className="h-4 bg-gray-200 rounded w-2/3" />
                      </div>
                    </div>
                  ))
                : realisations.map((r) => (
                    <div
                      key={r.id}
                      className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 group"
                    >
                      <div className="h-48 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center relative overflow-hidden">
                        {r.image_url ? (
                          <img
                            src={r.image_url}
                            alt={r.title}
                            crossOrigin="anonymous"
                            className="absolute inset-0 w-full h-full object-cover"
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <>
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-700/20 to-blue-900/40" />
                            <HardHat
                              size={48}
                              className="text-white/60 relative z-10"
                            />
                          </>
                        )}
                        <div className="absolute top-3 left-3 z-10">
                          <span className="bg-white/90 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                            {getCategoryLabel(r.category)}
                          </span>
                        </div>
                        <div className="absolute bottom-3 right-3 z-10">
                          <span className="bg-black/40 text-white text-xs px-2 py-0.5 rounded">
                            {r.year}
                          </span>
                        </div>
                      </div>
                      <div className="p-5">
                        <h3 className="font-bold text-gray-900 mb-1.5 group-hover:text-blue-700 transition-colors">
                          {r.title}
                        </h3>
                        <p className="text-sm text-gray-500 leading-relaxed mb-3">
                          {r.description}
                        </p>
                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                          <Map size={12} />
                          {r.location}
                        </div>
                      </div>
                    </div>
                  ))}
            </div>
          </div>
        </section>
      )}

      <PublicSocialWall />

      {/* Why us */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span
              className="font-semibold text-sm uppercase tracking-widest"
              style={{ color: primaryColor }}
            >
              Nos atouts
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2 mb-4">
              Pourquoi Choisir {appCompany} ?
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Notre approche met la réactivité, la proximité et un suivi clair
              au service de vos projets.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {advantages.map((a) => {
              const Icon = a.icon;
              return (
                <div key={a.title} className="text-center group">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all duration-300 shadow-sm"
                    style={{
                      backgroundColor: `${primaryColor}10`,
                    }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.backgroundColor = primaryColor)
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.backgroundColor = `${primaryColor}10`)
                    }
                  >
                    <Icon
                      size={28}
                      style={{
                        color: primaryColor,
                      }}
                      onMouseOver={(e) =>
                        (e.currentTarget.style.color = "#ffffff")
                      }
                      onMouseOut={(e) =>
                        (e.currentTarget.style.color = primaryColor)
                      }
                    />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{a.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {a.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Band */}
      <section
        className="py-20 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, #1e3a5f 0%, ${primaryColor}40 40%, ${primaryColor} 100%)`,
        }}
      >
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Prêt à Concrétiser Votre Projet ?
          </h2>
          <p className="text-blue-200 text-lg mb-8 max-w-2xl mx-auto">
            Parlez-nous de votre projet pour recevoir une proposition claire,
            rapide et adaptée au contexte ivoirien.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => nav("contact")}
              className="flex items-center justify-center gap-2 px-8 py-4 bg-white text-blue-700 hover:bg-blue-50 rounded-2xl font-bold text-base transition-all shadow-lg"
              aria-label="Demander un devis et être rappelé"
            >
              <Mail size={18} aria-hidden="true" />
              Demander un devis
            </button>
            <button
              onClick={() => nav("realisations")}
              className="flex items-center justify-center gap-2 px-8 py-4 bg-white/10 border border-white/30 hover:bg-white/20 text-white rounded-2xl font-semibold text-base transition-all"
              aria-label="Voir nos réalisations"
            >
              Voir nos réalisations
              <ArrowRight size={18} aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      {/* Quick Contact */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-blue-600 font-semibold text-sm uppercase tracking-widest">
                Contactez-nous
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2 mb-4">
                Parlons de votre projet
              </h2>
              <p className="text-gray-500 mb-8 leading-relaxed">
                Notre équipe vous accompagne rapidement pour tout projet de
                construction, achat, vente ou sécurisation foncière.
              </p>
              <div className="space-y-4">
                {contactPhone && (
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Phone size={18} className="text-blue-700" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                        Téléphone
                      </div>
                      <a
                        href={`tel:${contactPhone.replace(/\s+/g, "")}`}
                        className="text-gray-700 font-semibold hover:text-blue-700 transition-colors"
                      >
                        {contactPhone}
                      </a>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Mail size={18} className="text-blue-700" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                      Email
                    </div>
                    <a
                      href={`mailto:${contactEmail}`}
                      className="text-gray-700 font-semibold hover:text-blue-700 transition-colors"
                    >
                      {contactEmail}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              {sent ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={32} className="text-emerald-600" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg mb-2">
                    Message envoyé !
                  </h3>
                  <p className="text-gray-500 text-sm mb-6">
                    Nous vous répondrons dans les plus brefs délais.
                  </p>
                  <button
                    onClick={() => setSent(false)}
                    className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-sm font-semibold transition-colors min-h-[44px]"
                  >
                    Envoyer un autre message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  <h3 className="font-bold text-gray-900 text-lg mb-6">
                    Envoyez-nous un message
                  </h3>
                  {submitError && (
                    <div
                      role="alert"
                      className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                    >
                      {submitError}
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">
                        Nom complet *
                      </label>
                      <input
                        value={form.name}
                        onChange={(e) =>
                          setForm({ ...form, name: e.target.value })
                        }
                        placeholder="Votre nom"
                        className={`w-full border rounded-xl px-4 py-2.5 text-base focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition ${
                          formErrors.name
                            ? "border-red-400 bg-red-50"
                            : "border-gray-200"
                        }`}
                        required
                        aria-invalid={!!formErrors.name}
                        aria-describedby={
                          formErrors.name ? "name-error" : undefined
                        }
                      />
                      {formErrors.name && (
                        <p
                          id="name-error"
                          className="mt-1 text-xs text-red-600 font-medium"
                        >
                          {formErrors.name}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">
                        Téléphone
                      </label>
                      <input
                        value={form.phone}
                        onChange={(e) =>
                          setForm({ ...form, phone: e.target.value })
                        }
                        placeholder="+225 XX XX XX XX XX"
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-base focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                      placeholder="votre@email.com"
                      className={`w-full border rounded-xl px-4 py-2.5 text-base focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition ${
                        formErrors.email
                          ? "border-red-400 bg-red-50"
                          : "border-gray-200"
                      }`}
                      required
                      aria-invalid={!!formErrors.email}
                      aria-describedby={
                        formErrors.email ? "email-error" : undefined
                      }
                    />
                    {formErrors.email && (
                      <p
                        id="email-error"
                        className="mt-1 text-xs text-red-600 font-medium"
                      >
                        {formErrors.email}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                      Message *
                    </label>
                    <textarea
                      value={form.message}
                      onChange={(e) =>
                        setForm({ ...form, message: e.target.value })
                      }
                      placeholder="Décrivez votre projet..."
                      rows={4}
                      className={`w-full border rounded-xl px-4 py-2.5 text-base focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition resize-none ${
                        formErrors.message
                          ? "border-red-400 bg-red-50"
                          : "border-gray-200"
                      }`}
                      required
                      aria-invalid={!!formErrors.message}
                      aria-describedby={
                        formErrors.message ? "message-error" : undefined
                      }
                    />
                    {formErrors.message && (
                      <p
                        id="message-error"
                        className="mt-1 text-xs text-red-600 font-medium"
                      >
                        {formErrors.message}
                      </p>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-blue-700 hover:bg-blue-800 disabled:opacity-70 text-white rounded-xl font-semibold text-sm transition-all shadow-sm min-h-[44px]"
                    aria-label="Envoyer la demande"
                  >
                    <Send size={15} aria-hidden="true" />
                    {sending ? "Envoi en cours..." : "Envoyer la demande"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
