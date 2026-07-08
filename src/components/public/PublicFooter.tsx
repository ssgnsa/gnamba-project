import {
  MapPin,
  Phone,
  Mail,
  Clock,
  ChevronRight,
  Facebook,
  Linkedin,
  Twitter,
  Instagram,
  Video,
  Youtube,
} from "lucide-react";
import type { MouseEvent } from "react";
import type { PublicPage } from "../../lib/publicRoutes";
import { PUBLIC_PAGE_PATHS } from "../../lib/publicRoutes";
import { useSiteContent } from "../../context/SiteContentContext";
import { useSettings } from "../../context/SettingsContext";
import BrandLogo from "../BrandLogo";
import {
  OFFICIAL_CONTACT,
  buildGoogleMapsDirectionsUrl,
  buildWhatsAppUrl,
} from "../../lib/officialContact";

interface PublicFooterProps {
  onNavigate: (page: PublicPage) => void;
}

export default function PublicFooter({ onNavigate }: PublicFooterProps) {
  const { get } = useSiteContent();
  const { settings } = useSettings();
  const primaryColor = settings.primary_color || "#1e40af";

  const tagline = get(
    "footer",
    "tagline",
    "Votre partenaire de confiance pour vos projets BTP, immobiliers et fonciers en Côte d'Ivoire.",
  );
  const copyright = get(
    "footer",
    "copyright",
    `© ${new Date().getFullYear()} ${OFFICIAL_CONTACT.companyName}. Tous droits réservés.`,
  );

  // Utiliser les paramètres de contact en priorité, sinon fallback sur site_content
  const footerAddress = OFFICIAL_CONTACT.address;
  const footerPhone = OFFICIAL_CONTACT.phone;
  const footerEmail = OFFICIAL_CONTACT.email;
  const footerHours = OFFICIAL_CONTACT.hours;
  const whatsappUrl = buildWhatsAppUrl(OFFICIAL_CONTACT.phone);
  const mapsDirectionsUrl = buildGoogleMapsDirectionsUrl(
    OFFICIAL_CONTACT.physicalAddress || OFFICIAL_CONTACT.address,
  );
  const footerSignature = get("footer", "signature", "");
  const logoInitials = OFFICIAL_CONTACT.companyName
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleNav = (page: PublicPage) => {
    onNavigate(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLinkClick = (
    event: MouseEvent<HTMLAnchorElement>,
    page: PublicPage,
  ) => {
    if (event.defaultPrevented) return;
    if (event.button !== 0) return;
    if (event.metaKey || event.altKey || event.ctrlKey || event.shiftKey)
      return;
    event.preventDefault();
    handleNav(page);
  };

  const socialLinks = [
    {
      key: "social_facebook" as const,
      label: "Facebook",
      icon: Facebook,
      url: settings.social_facebook,
    },
    {
      key: "social_youtube" as const,
      label: "YouTube",
      icon: Youtube,
      url: settings.social_youtube,
    },
    {
      key: "social_linkedin" as const,
      label: "LinkedIn",
      icon: Linkedin,
      url: settings.social_linkedin,
    },
    {
      key: "social_twitter" as const,
      label: "Twitter",
      icon: Twitter,
      url: settings.social_twitter,
    },
    {
      key: "social_instagram" as const,
      label: "Instagram",
      icon: Instagram,
      url: settings.social_instagram,
    },
    {
      key: "social_tiktok" as const,
      label: "TikTok",
      icon: Video,
      url: settings.social_tiktok,
    },
  ].filter((s) => s.url);

  return (
    <footer className="bg-slate-950 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0"
                style={{
                  backgroundColor: settings.primary_color,
                  color: "var(--color-on-primary)",
                }}
              >
                <BrandLogo
                  tone="dark"
                  alt={`Logo ${OFFICIAL_CONTACT.companyName} - BTP Immobilier Foncier`}
                  className="w-full h-full object-cover"
                  fallback={
                    <span className="text-white font-bold text-sm">
                      {logoInitials}
                    </span>
                  }
                />
              </div>
              <div>
                <div className="font-bold text-white text-sm">
                  {OFFICIAL_CONTACT.companyName}
                </div>
                <div
                  className="text-xs"
                  style={{ color: settings.primary_color }}
                >
                  BTP · Immobilier · Foncier
                </div>
              </div>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">{tagline}</p>

            {socialLinks.length > 0 && (
              <div className="flex gap-3 mt-4">
                {socialLinks.map(({ icon: Icon, label, url }) => (
                  <a
                    key={label}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                    style={{ backgroundColor: primaryColor }}
                    title={label}
                  >
                    <Icon size={16} className="text-white" />
                  </a>
                ))}
              </div>
            )}
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wide">
              Nos services
            </h4>
            <ul className="space-y-1">
              {[
                {
                  label: "BTP & Construction",
                  page: "btp-construction" as PublicPage,
                  href: PUBLIC_PAGE_PATHS["btp-construction"],
                },
                {
                  label: "Immobilier",
                  page: "immobilier" as PublicPage,
                  href: PUBLIC_PAGE_PATHS.immobilier,
                },
                {
                  label: "Foncier sécurisé",
                  page: "foncier" as PublicPage,
                  href: PUBLIC_PAGE_PATHS.foncier,
                },
                {
                  label: "Lotissement",
                  page: "lotissement" as PublicPage,
                  href: PUBLIC_PAGE_PATHS.lotissement,
                },
              ].map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    onClick={(event) => handleLinkClick(event, item.page)}
                    className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors min-h-[44px] py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 rounded-lg"
                  >
                    <ChevronRight size={12} />
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wide">
              Liens rapides
            </h4>
            <ul className="space-y-1">
              {[
                {
                  label: "Accueil",
                  page: "home" as PublicPage,
                  href: PUBLIC_PAGE_PATHS.home,
                },
                {
                  label: "À propos",
                  page: "about" as PublicPage,
                  href: PUBLIC_PAGE_PATHS.about,
                },
                {
                  label: "Réalisations",
                  page: "realisations" as PublicPage,
                  href: PUBLIC_PAGE_PATHS.realisations,
                },
                {
                  label: "Témoignages",
                  page: "temoignages" as PublicPage,
                  href: PUBLIC_PAGE_PATHS.temoignages,
                },
                {
                  label: "Blog",
                  page: "blog" as PublicPage,
                  href: PUBLIC_PAGE_PATHS.blog,
                },
                {
                  label: "Contact",
                  page: "contact" as PublicPage,
                  href: PUBLIC_PAGE_PATHS.contact,
                },
                {
                  label: "Lots à vendre",
                  page: "lots" as PublicPage,
                  href: PUBLIC_PAGE_PATHS.lots,
                },
                {
                  label: "FAQ",
                  page: "faq" as PublicPage,
                  href: PUBLIC_PAGE_PATHS.faq,
                },
                {
                  label: "Mentions légales",
                  page: "mentions-legales" as PublicPage,
                  href: PUBLIC_PAGE_PATHS["mentions-legales"],
                },
                {
                  label: "Connexion",
                  page: "login" as PublicPage,
                  href: PUBLIC_PAGE_PATHS.login,
                },
              ].map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    onClick={(event) => handleLinkClick(event, item.page)}
                    className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors min-h-[44px] py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 rounded-lg"
                  >
                    <ChevronRight size={12} />
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wide">
              Contact
            </h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5">
                <MapPin
                  size={14}
                  className="mt-0.5 flex-shrink-0"
                  style={{ color: primaryColor }}
                />
                <span className="text-sm text-slate-400">{footerAddress}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin
                  size={14}
                  className="mt-0.5 flex-shrink-0"
                  style={{ color: primaryColor }}
                />
                <a
                  href={mapsDirectionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-slate-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 rounded"
                >
                  Ouvrir sur Google Maps
                </a>
              </li>
              {footerPhone && (
                <li className="flex items-start gap-2.5">
                  <Phone
                    size={14}
                    className="mt-0.5 flex-shrink-0"
                    style={{ color: primaryColor }}
                  />
                  <a
                    href={`tel:${footerPhone.replace(/\s+/g, "")}`}
                    className="text-sm text-slate-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 rounded"
                  >
                    {footerPhone}
                  </a>
                </li>
              )}
              <li className="flex items-start gap-2.5">
                <Mail
                  size={14}
                  className="mt-0.5 flex-shrink-0"
                  style={{ color: primaryColor }}
                />
                <a
                  href={`mailto:${footerEmail}`}
                  className="text-sm text-slate-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 rounded"
                >
                  {footerEmail}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <Phone
                  size={14}
                  className="mt-0.5 flex-shrink-0"
                  style={{ color: primaryColor }}
                />
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-slate-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 rounded"
                >
                  WhatsApp {OFFICIAL_CONTACT.phone}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <Clock
                  size={14}
                  className="mt-0.5 flex-shrink-0"
                  style={{ color: primaryColor }}
                />
                <span className="text-sm text-slate-400">{footerHours}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">{copyright}</p>
          {footerSignature && (
            <p className="text-xs text-slate-600">{footerSignature}</p>
          )}
        </div>
        <div className="border-t border-slate-800/70 py-6 flex flex-col md:flex-row gap-3 md:items-center md:justify-between text-sm text-slate-400">
          <p>
            Vous avez un chantier, un terrain ou un bien à valoriser ?
            Demandez un devis et recevez un retour rapide.
          </p>
          <a
            href={PUBLIC_PAGE_PATHS.contact}
            onClick={(event) => handleLinkClick(event, "contact")}
            className="inline-flex items-center gap-2 text-white font-medium hover:text-slate-200 transition-colors"
          >
            Demander un devis
            <ChevronRight size={14} />
          </a>
        </div>
      </div>
    </footer>
  );
}
