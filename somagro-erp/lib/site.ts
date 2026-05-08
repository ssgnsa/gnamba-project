import { headers } from "next/headers";
import { createServerSupabase } from "@/lib/supabase/server";

export type SiteSettings = {
  site_name: string;
  tagline: string;
  primary_color: string;
  secondary_color: string;
  logo_url: string | null;
  hero_title: string;
  hero_subtitle: string;
  cta_label: string;
  cta_url: string;
  is_public: boolean;
};

const DEFAULT_SITE_SETTINGS: SiteSettings = {
  site_name: "SomAgro",
  tagline: "ERP agricole intelligent",
  primary_color: "#34d399",
  secondary_color: "#0f172a",
  logo_url: null,
  hero_title:
    "Pilotage complet des exploitations agricoles, du champ a la vente.",
  hero_subtitle:
    "SomAgro ERP connecte elevage, cultures, infrastructures, stocks et finance dans un meme cockpit. Concu pour fonctionner sur le terrain.",
  cta_label: "Demarrer",
  cta_url: "/register",
  is_public: true,
};

function stripPort(host?: string) {
  if (!host) return "";
  if (host.startsWith("[")) {
    const end = host.indexOf("]");
    if (end !== -1) return host.slice(1, end);
  }
  return host.split(":")[0];
}

function resolveSlugFromHost(host?: string) {
  const cleaned = stripPort(host).toLowerCase();
  if (!cleaned) return null;
  if (cleaned === "localhost" || cleaned === "127.0.0.1" || cleaned === "::1")
    return null;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(cleaned)) return null;
  const parts = cleaned.split(".");
  if (cleaned.endsWith(".local") && parts.length >= 2) {
    return parts[0] === "www" ? null : parts[0];
  }
  if (parts.length >= 3) {
    return parts[0] === "www" ? null : parts[0];
  }
  return null;
}

export async function getSiteContext() {
  const supabase = createServerSupabase();
  const host = headers().get("host") ?? "";
  const forcedSlug = process.env.SOMAGRO_TENANT_SLUG?.trim();
  const slug = forcedSlug || resolveSlugFromHost(host);

  let tenant: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
  } | null = null;

  if (slug) {
    const { data } = await supabase
      .from("tenants")
      .select("id, name, slug, logo_url")
      .eq("slug", slug)
      .maybeSingle();
    tenant = data ?? null;
  }

  if (!tenant) {
    const { data } = await supabase
      .from("tenants")
      .select("id, name, slug, logo_url")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    tenant = data ?? null;
  }

  const tenantId = tenant?.id ?? null;

  let siteSettings: Partial<SiteSettings> | null = null;
  if (tenantId) {
    const { data } = await supabase
      .from("site_settings")
      .select(
        "site_name, tagline, primary_color, secondary_color, logo_url, hero_title, hero_subtitle, cta_label, cta_url, is_public",
      )
      .eq("tenant_id", tenantId)
      .maybeSingle();
    siteSettings = data ?? null;
  }

  const merged: SiteSettings = {
    ...DEFAULT_SITE_SETTINGS,
    ...siteSettings,
    site_name:
      siteSettings?.site_name ||
      tenant?.name ||
      DEFAULT_SITE_SETTINGS.site_name,
    logo_url: siteSettings?.logo_url || tenant?.logo_url || null,
  };

  return { tenant, tenantId, settings: merged, rawSettings: siteSettings };
}
