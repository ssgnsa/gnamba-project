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
    "Votre partenaire de confiance pour tous vos projets immobiliers et de construction.",
  );
  const copyright = get(
    "footer",
    "copyright",
    `© ${new Date().getFullYear()} ${settings.app_company || "Gnamba Services"}. Tous droits réservés.`,
  );

  // Utiliser les paramètres de contact en priorité, sinon fallback sur site_content
  const footerAddress =
    settings.contact_address ||
    get("contact", "address", "Abidjan, Côte d'Ivoire");
  const footerPhone = settings.contact_phone || get("contact", "phone", "");
  const footerEmail =
    settings.contact_email ||
    get("contact", "email", "contact@gnambaservices.ci");
  const footerHours =
    settings.contact_hours || get("contact", "hours", "Lun-Ven : 08h – 18h");
  const footerSignature = get("footer", "signature", "");
  const logoInitials = (settings.app_company || "Gnamba Services")
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
                  alt={`Logo ${settings.app_company || "Gnamba Services"} - BTP Immobilier Foncier`}
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
                  {settings.app_company || "Gnamba Services"}
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
                "BTP & Construction",
                "Gestion Immobilière",
                "Foncier Villageois",
                "Fournitures Pro",
              ].map((s) => (
                <li key={s}>
                  <a
                    href={PUBLIC_PAGE_PATHS.services}
                    onClick={(event) => handleLinkClick(event, "services")}
                    className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors min-h-[44px] py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 rounded-lg"
                  >
                    <ChevronRight size={12} />
                    {s}
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
                  label: "Contact",
                  page: "contact" as PublicPage,
                  href: PUBLIC_PAGE_PATHS.contact,
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
              {footerPhone && (
                <li className="flex items-start gap-2.5">
                  <Phone
                    size={14}
                    className="mt-0.5 flex-shrink-0"
                    style={{ color: primaryColor }}
                  />
                  <a
                    href={`tel:${footerPhone}`}
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
      </div>
    </footer>
  );
}
