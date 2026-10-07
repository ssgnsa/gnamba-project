export type PublicPage =
  | "home"
  | "about"
  | "services"
  | "immobilier"
  | "foncier"
  | "lotissement"
  | "btp-construction"
  | "realisations"
  | "temoignages"
  | "blog"
  | "contact"
  | "faq"
  | "mentions-legales"
  | "login"
  | "verification"
  | "lots";

export const PUBLIC_PAGE_PATHS: Record<PublicPage, string> = {
  home: "/",
  about: "/a-propos",
  services: "/services",
  immobilier: "/immobilier",
  foncier: "/foncier",
  lotissement: "/lotissement",
  "btp-construction": "/btp-construction",
  realisations: "/realisations",
  temoignages: "/temoignages",
  blog: "/blog",
  contact: "/contact",
  faq: "/faq",
  "mentions-legales": "/mentions-legales",
  login: "/login",
  verification: "/verification-attestation",
  lots: "/lots-disponibles",
};

const PUBLIC_PAGE_ALIASES: Record<string, PublicPage> = {
  "/home": "home",
  "/accueil": "home",
  "/about": "about",
  "/lots": "lots",
  "/faq/questions-frequentes": "faq",
  "/verification": "verification",
  "/forgot-password": "login",
  "/reset-password": "login",
};

export const normalizePublicPath = (path: string): string => {
  if (!path) return "/";
  const trimmed = path.split("?")[0]?.split("#")[0] || "/";
  if (trimmed === "") return "/";
  if (trimmed.includes(":")) return trimmed;
  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  if (withLeadingSlash.length > 1) {
    return withLeadingSlash.replace(/\/+$/, "");
  }
  return withLeadingSlash;
};

export const getPublicPageFromPath = (path: string): PublicPage | null => {
  const normalized = normalizePublicPath(path);
  if (normalized.includes(":")) return null;
  const directMatch = (Object.keys(PUBLIC_PAGE_PATHS) as PublicPage[]).find(
    (page) => PUBLIC_PAGE_PATHS[page] === normalized,
  );
  if (directMatch) return directMatch;
  return PUBLIC_PAGE_ALIASES[normalized] || null;
};

export const getPublicPageFromHref = (href: string): PublicPage | null => {
  if (!href) return null;
  const trimmed = href.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("#")) return null;
  if (trimmed.startsWith("mailto:") || trimmed.startsWith("tel:")) return null;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      return getPublicPageFromPath(new URL(trimmed).pathname);
    } catch {
      return null;
    }
  }
  return getPublicPageFromPath(trimmed);
};
