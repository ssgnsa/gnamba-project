import { xn as E } from "./icons-vendor-BfPGE0aO.js";
import { n as C } from "./react-vendor-Dj4gTxeL.js";
import { t as d } from "./supabase-Cm30VQRU.js";
var n = E(),
  I = C(),
  p = "egs:settings:cache:v2",
  X = 300 * 1e3,
  e = {
    app_title: "EGS",
    app_subtitle: "Enterprise Gnamba System",
    app_company: "Gnamba Services",
    primary_color: "#1e40af",
    secondary_color: "#16a34a",
    logo_url: "",
    contact_address: "Abidjan, Côte d'Ivoire",
    contact_phone: "+225 XX XX XX XX XX",
    contact_email: "contact@gnambaservices.ci",
    contact_hours: "Lun-Ven : 08h – 18h",
    social_facebook: "",
    social_youtube: "",
    social_linkedin: "",
    social_twitter: "",
    social_instagram: "",
    social_tiktok: "",
    seo_description:
      "Gnamba Services - BTP, Immobilier, Foncier en Côte d'Ivoire",
    seo_keywords:
      "BTP, immobilier, foncier, construction, Abidjan, Côte d'Ivoire",
    brand_logo_dark: "",
    brand_favicon_url: "",
    brand_watermark_url: "",
    hero_background_url: "",
  };
function x() {
  if (typeof window > "u") return null;
  try {
    const a = localStorage.getItem(p);
    if (!a) return null;
    const s = JSON.parse(a);
    return Date.now() - s.timestamp > X
      ? (localStorage.removeItem(p), null)
      : s.data;
  } catch {
    return (localStorage.removeItem(p), null);
  }
}
function O(a) {
  if (!(typeof window > "u"))
    try {
      const s = { data: a, timestamp: Date.now() };
      localStorage.setItem(p, JSON.stringify(s));
    } catch {}
}
var m = (0, n.createContext)({
  settings: e,
  loading: !1,
  error: null,
  refreshSettings: async () => {},
  updateSetting: async () => {},
  updateSettings: async () => {},
  hasLoadedOnce: !1,
});
function P({ children: a }) {
  const [s, f] = (0, n.useState)(() => x() || e),
    [y, b] = (0, n.useState)(!0),
    [k, i] = (0, n.useState)(null),
    [S, h] = (0, n.useState)(!1),
    u = (0, n.useCallback)(async () => {
      try {
        i(null);
        const { data: r, error: c } = await d
          .from("app_settings")
          .select("key, value");
        if (c) {
          i(`Erreur de chargement: ${c.message}`);
          return;
        }
        const t = {};
        r?.forEach((_) => {
          t[_.key] = _.value || "";
        });
        const { data: l } = await d
            .from("media_files")
            .select("url, brand_asset_type")
            .in("brand_asset_type", [
              "logo_principal",
              "favicon",
              "watermark",
              "logo_secondaire",
            ])
            .eq("is_brand_asset", !0),
          o = {};
        l?.forEach((_) => {
          o[_.brand_asset_type] || (o[_.brand_asset_type] = _.url);
        });
        const g = {
          app_title: t.app_title || e.app_title,
          app_subtitle: t.app_subtitle || e.app_subtitle,
          app_company: t.app_company || e.app_company,
          primary_color: t.primary_color || e.primary_color,
          secondary_color: t.secondary_color || e.secondary_color,
          logo_url: t.logo_url || o.logo_principal || "",
          contact_address: t.contact_address || e.contact_address,
          contact_phone: t.contact_phone || e.contact_phone,
          contact_email: t.contact_email || e.contact_email,
          contact_hours: t.contact_hours || e.contact_hours,
          social_facebook: t.social_facebook || e.social_facebook,
          social_youtube: t.social_youtube || e.social_youtube,
          social_linkedin: t.social_linkedin || e.social_linkedin,
          social_twitter: t.social_twitter || e.social_twitter,
          social_instagram: t.social_instagram || e.social_instagram,
          social_tiktok: t.social_tiktok || e.social_tiktok,
          seo_description: t.seo_description || e.seo_description,
          seo_keywords: t.seo_keywords || e.seo_keywords,
          brand_logo_dark: t.brand_logo_dark || o.logo_secondaire || "",
          brand_favicon_url: t.brand_favicon_url || o.favicon || "",
          brand_watermark_url: t.brand_watermark_url || o.watermark || "",
          hero_background_url: t.hero_background_url || "",
        };
        (f(g), O(g), h(!0));
      } catch (r) {
        i(
          `Erreur inattendue: ${r instanceof Error ? r.message : "Erreur inconnue"}`,
        );
      } finally {
        b(!1);
      }
    }, []),
    w = async (r, c) => {
      i(null);
      const { error: t } = await d
        .from("app_settings")
        .upsert(
          { key: r, value: c, updated_at: new Date().toISOString() },
          { onConflict: "key" },
        );
      if (t) throw (i(`Erreur de sauvegarde: ${t.message}`), t);
      await u();
    },
    v = async (r) => {
      i(null);
      const c = Object.entries(r)
        .filter(([, l]) => l != null)
        .map(([l, o]) => ({
          key: l,
          value: o,
          updated_at: new Date().toISOString(),
        }));
      if (c.length === 0) return;
      const { error: t } = await d
        .from("app_settings")
        .upsert(c, { onConflict: "key" });
      if (t) throw (i(`Erreur de sauvegarde: ${t.message}`), t);
      await u();
    };
  return (
    (0, n.useEffect)(() => {
      u();
    }, [u]),
    (0, I.jsx)(m.Provider, {
      value: {
        settings: s,
        loading: y,
        error: k,
        refreshSettings: u,
        updateSetting: w,
        updateSettings: v,
        hasLoadedOnce: S,
      },
      children: a,
    })
  );
}
function A() {
  const a = (0, n.useContext)(m);
  if (a === void 0)
    throw new Error(
      "useSettings doit être utilisé à l'intérieur d'un SettingsProvider",
    );
  return a;
}
export { A as n, P as t };
