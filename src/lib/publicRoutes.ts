export type PublicPage =
  | "home"
  | "about"
  | "services"
  | "realisations"
  | "contact"
  | "login"
  | "verification";

export const PUBLIC_PAGE_PATHS: Record<PublicPage, string> = {
  home: "/",
  about: "/about",
  services: "/services",
  realisations: "/realisations",
  contact: "/contact",
  login: "/login",
  verification: "/verification-attestation",
};

const PUBLIC_PAGE_ALIASES: Record<string, PublicPage> = {
  "/home": "home",
  "/accueil": "home",
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
