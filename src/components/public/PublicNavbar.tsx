import { useState, useEffect, useRef, type MouseEvent } from "react";
import { Menu, X, LogIn } from "lucide-react";
import { useSettings } from "../../context/SettingsContext";
import BrandLogo from "../BrandLogo";
import { PUBLIC_PAGE_PATHS, type PublicPage } from "../../lib/publicRoutes";

interface PublicNavbarProps {
  activePage: PublicPage;
  onNavigate: (page: PublicPage) => void;
}

const navLinks: { id: PublicPage; label: string; href: string }[] = [
  { id: "home", label: "Accueil", href: PUBLIC_PAGE_PATHS.home },
  { id: "about", label: "À propos", href: PUBLIC_PAGE_PATHS.about },
  { id: "services", label: "Nos services", href: PUBLIC_PAGE_PATHS.services },
  {
    id: "realisations",
    label: "Réalisations",
    href: PUBLIC_PAGE_PATHS.realisations,
  },
  { id: "contact", label: "Contact", href: PUBLIC_PAGE_PATHS.contact },
];

export default function PublicNavbar({
  activePage,
  onNavigate,
}: PublicNavbarProps) {
  const { settings } = useSettings();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const previousBodyOverflow = useRef("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (menuOpen) {
      previousBodyOverflow.current = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = previousBodyOverflow.current;
    }

    return () => {
      document.body.style.overflow = previousBodyOverflow.current;
    };
  }, [menuOpen]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleNav = (page: PublicPage) => {
    onNavigate(page);
    setMenuOpen(false);
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

  // Déterminer la couleur à utiliser
  const primaryColor = settings.primary_color || "#1e40af";
  const appCompany = settings.app_company || "Gnamba Services";
  const logoInitials = appCompany
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled || menuOpen
          ? "bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm"
          : "bg-gradient-to-b from-slate-900/40 to-transparent"
      }`}
      style={{ paddingTop: "max(0px, var(--sat))" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <a
            href={PUBLIC_PAGE_PATHS.home}
            onClick={(event) => handleLinkClick(event, "home")}
            className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 rounded-xl"
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm group-hover:opacity-90 transition-colors overflow-hidden flex-shrink-0"
              style={{ backgroundColor: primaryColor }}
            >
              <BrandLogo
                tone="dark"
                alt={`Logo ${appCompany} - BTP Immobilier Foncier`}
                className="w-full h-full object-cover bg-white"
                fallback={
                  <span className="text-white font-bold text-lg">
                    {logoInitials}
                  </span>
                }
              />
            </div>
            <div>
              <div
                className={`font-bold text-base leading-tight transition-colors ${scrolled || menuOpen ? "text-gray-900" : "text-white"}`}
              >
                {appCompany}
              </div>
              <div
                className={`text-xs leading-tight transition-colors ${scrolled || menuOpen ? "text-blue-600" : "text-blue-200"}`}
              >
                BTP · Immobilier · Foncier
              </div>
            </div>
          </a>

          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.id}
                href={link.href}
                onClick={(event) => handleLinkClick(event, link.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activePage === link.id
                    ? "text-white shadow-sm"
                    : scrolled
                      ? "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      : "text-white/90 hover:text-white hover:bg-white/10"
                } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-300)]`}
                style={
                  activePage === link.id
                    ? { backgroundColor: primaryColor }
                    : {}
                }
                aria-current={activePage === link.id ? "page" : undefined}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            <a
              href={PUBLIC_PAGE_PATHS.login}
              onClick={(event) => handleLinkClick(event, "login")}
              className="flex items-center gap-2 px-4 py-2 text-white rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-300)]"
              style={{ backgroundColor: primaryColor }}
            >
              <LogIn size={15} />
              Connexion employés
            </a>
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={`lg:hidden p-2 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-300)] ${scrolled || menuOpen ? "text-slate-700 hover:bg-slate-100" : "text-white hover:bg-white/10"}`}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div
          className="lg:hidden border-t border-slate-100 bg-white px-4 py-4 space-y-1 shadow-lg"
          style={{ paddingBottom: "max(1rem, var(--sab))" }}
        >
          {navLinks.map((link) => (
            <a
              key={link.id}
              href={link.href}
              onClick={(event) => handleLinkClick(event, link.id)}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                activePage === link.id
                  ? "text-white"
                  : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
              } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-300)]`}
              style={
                activePage === link.id ? { backgroundColor: primaryColor } : {}
              }
              aria-current={activePage === link.id ? "page" : undefined}
            >
              {link.label}
            </a>
          ))}
          <div className="pt-2 border-t border-gray-100 mt-2">
            <a
              href={PUBLIC_PAGE_PATHS.login}
              onClick={(event) => handleLinkClick(event, "login")}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-white rounded-xl text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-300)]"
              style={{ backgroundColor: primaryColor }}
            >
              <LogIn size={15} />
              Connexion employés
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
