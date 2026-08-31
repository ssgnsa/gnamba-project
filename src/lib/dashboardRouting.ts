import type { Page } from "../components/Sidebar";

export const DASHBOARD_PAGE_PATHS: Record<Page, string> = {
  dashboard: "/dashboard",
  clients: "/clients",
  projets: "/projets",
  immobilier: "/immobilier",
  foncier: "/foncier",
  "catalogue-lots": "/lots-a-vendre",
  fournitures: "/fournitures",
  finances: "/finances",
  employes: "/employes",
  utilisateurs: "/utilisateurs",
  fournisseurs: "/fournisseurs",
  documents: "/documents",
  taches: "/taches",
  statistiques: "/statistiques",
  parametres: "/parametres",
  "codex-assistant": "/codex-assistant",
  "site-editor": "/site-editor",
  media: "/media",
  registre: "/registre",
  leads: "/leads",
};

const DASHBOARD_PAGE_ALIASES: Record<string, Page> = {
  "/app": "dashboard",
  "/admin": "dashboard",
};

export const normalizePath = (path: string): string => {
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

export const getDashboardPageFromPath = (path: string): Page | null => {
  const normalized = normalizePath(path);
  if (normalized.includes(":")) return null;
  const directMatch = (Object.keys(DASHBOARD_PAGE_PATHS) as Page[]).find(
    (page) => DASHBOARD_PAGE_PATHS[page] === normalized,
  );
  if (directMatch) return directMatch;
  return DASHBOARD_PAGE_ALIASES[normalized] || null;
};
