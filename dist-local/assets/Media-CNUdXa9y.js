import {
  Bt as O,
  C as K,
  Et as J,
  Gt as Q,
  Kt as Y,
  Nt as W,
  Ot as ee,
  R as se,
  T as q,
  V as te,
  Vt as ae,
  Xt as re,
  Zt as le,
  b as X,
  bt as P,
  nn as ie,
  ot as H,
  p as oe,
  pt as ne,
  r as G,
  xn as ce,
  yt as de,
  z as xe,
} from "./icons-vendor-BfPGE0aO.js";
import { n as ue } from "./react-vendor-Dj4gTxeL.js";
import { t as B } from "./supabase-Cm30VQRU.js";
import { n as me } from "./SettingsContext-CMQ2j17o.js";
import { l as ge } from "./index-J6Ma0lNi.js";
import { n as pe, r as be } from "./MediaPicker-D7QT2z_y.js";
import {
  a as he,
  l as fe,
  n as ye,
  o as ve,
  t as je,
} from "./mediaUtils-xKruIzqQ.js";
import { n as Ne, t as _e } from "./SiteMediaAssignments-B70inDrP.js";
var r = ce();
function we() {
  const { settings: t, loading: u, refreshSettings: L } = me(),
    i = (0, r.useMemo)(() => t.primary_color || "#1e40af", [t.primary_color]),
    d = (0, r.useMemo)(
      () => t.secondary_color || "#16a34a",
      [t.secondary_color],
    ),
    x = (0, r.useMemo)(() => t.logo_url, [t.logo_url]),
    _ = (0, r.useMemo)(() => t.brand_logo_dark, [t.brand_logo_dark]),
    o = (0, r.useMemo)(() => t.brand_favicon_url, [t.brand_favicon_url]),
    I = (0, r.useMemo)(() => t.brand_watermark_url, [t.brand_watermark_url]),
    m = (0, r.useMemo)(() => t.app_title || "EGS", [t.app_title]),
    E = (0, r.useMemo)(
      () => t.app_subtitle || "Enterprise Gnamba System",
      [t.app_subtitle],
    ),
    b = (0, r.useMemo)(
      () => t.app_company || "Gnamba Services",
      [t.app_company],
    ),
    z = (0, r.useMemo)(
      () =>
        b
          .split(" ")
          .filter(Boolean)
          .map((n) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase(),
      [b],
    ),
    c = (0, r.useMemo)(
      () => ({
        address: t.contact_address || "Abidjan, Côte d'Ivoire",
        phone: t.contact_phone || "+225 XX XX XX XX XX",
        email: t.contact_email || "contact@gnambaservices.ci",
        hours: t.contact_hours || "Lun-Ven : 08h – 18h",
      }),
      [t.contact_address, t.contact_phone, t.contact_email, t.contact_hours],
    ),
    S = (0, r.useMemo)(() => {
      const n = [];
      return (
        t.social_facebook &&
          n.push({
            key: "social_facebook",
            label: "Facebook",
            url: t.social_facebook,
          }),
        t.social_youtube &&
          n.push({
            key: "social_youtube",
            label: "YouTube",
            url: t.social_youtube,
          }),
        t.social_linkedin &&
          n.push({
            key: "social_linkedin",
            label: "LinkedIn",
            url: t.social_linkedin,
          }),
        t.social_twitter &&
          n.push({
            key: "social_twitter",
            label: "Twitter",
            url: t.social_twitter,
          }),
        t.social_instagram &&
          n.push({
            key: "social_instagram",
            label: "Instagram",
            url: t.social_instagram,
          }),
        t.social_tiktok &&
          n.push({
            key: "social_tiktok",
            label: "TikTok",
            url: t.social_tiktok,
          }),
        n
      );
    }, [
      t.social_facebook,
      t.social_youtube,
      t.social_linkedin,
      t.social_twitter,
      t.social_instagram,
      t.social_tiktok,
    ]),
    y = (0, r.useMemo)(
      () => ({
        description:
          t.seo_description ||
          "Gnamba Services - BTP, Immobilier, Foncier en Côte d'Ivoire",
        keywords:
          t.seo_keywords ||
          "BTP, immobilier, foncier, construction, Abidjan, Côte d'Ivoire",
      }),
      [t.seo_description, t.seo_keywords],
    ),
    T = (0, r.useMemo)(() => !!(x && _ && o), [x, _, o]),
    v = (n) => {
      const w = n.replace("#", ""),
        f = parseInt(w.substring(0, 2), 16),
        g = parseInt(w.substring(2, 4), 16),
        p = parseInt(w.substring(4, 6), 16);
      return (0.299 * f + 0.587 * g + 0.114 * p) / 255 > 0.5
        ? "#000000"
        : "#ffffff";
    },
    j = (0, r.useMemo)(() => v(i), [i]),
    h = (0, r.useMemo)(() => v(d), [d]);
  return {
    loading: u,
    settings: t,
    primaryColor: i,
    secondaryColor: d,
    logoUrl: x,
    logoDarkUrl: _,
    faviconUrl: o,
    watermarkUrl: I,
    appTitle: m,
    appSubtitle: E,
    appCompany: b,
    logoInitials: z,
    contact: c,
    socialLinks: S,
    seo: y,
    isBrandingComplete: T,
    getContrastColor: v,
    primaryContrast: j,
    secondaryContrast: h,
    styles: (0, r.useMemo)(
      () => ({
        primaryButton: { backgroundColor: i, color: j },
        secondaryButton: { backgroundColor: d, color: h },
        primaryText: { color: i },
        secondaryText: { color: d },
      }),
      [i, d, j, h],
    ),
    refreshSettings: L,
  };
}
var e = ue(),
  ke = {
    brand_assets: "Actifs de marque",
    site_vitrine: "Site Vitrine",
    hero_backgrounds: "Fonds Hero",
    realisations: "Réalisations",
    projets_btp: "Projets BTP",
    immobilier: "Immobilier",
    services: "Services",
    equipe: "Équipe",
    documents: "Documents",
    autre: "Autre",
  };
function Ce({ file: t, onClose: u, onDelete: L, onUpdate: i }) {
  const { user: d } = ge(),
    [x, _] = (0, r.useState)("info"),
    [o, I] = (0, r.useState)([]),
    [m, E] = (0, r.useState)([]),
    [b, z] = (0, r.useState)(!1),
    [c, S] = (0, r.useState)(!1),
    [y, T] = (0, r.useState)(!1),
    [v, j] = (0, r.useState)(t.alt_text || ""),
    [h, n] = (0, r.useState)(t.description || ""),
    [w, f] = (0, r.useState)(""),
    [g, p] = (0, r.useState)(t.tags || []),
    M = (0, r.useRef)(null),
    k = (0, r.useCallback)(async () => {
      I(await he(t.id));
    }, [t.id]),
    A = (0, r.useCallback)(async () => {
      E(await ve(t.id));
    }, [t.id]);
  (0, r.useEffect)(() => {
    (x === "usages" && k(), x === "versions" && A());
  }, [x, k, A]);
  const R = (s) =>
      s < 1024 * 1024
        ? `${(s / 1024).toFixed(0)} KB`
        : `${(s / (1024 * 1024)).toFixed(1)} MB`,
    U = (s) =>
      new Date(s).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    F = async () => {
      (await navigator.clipboard.writeText(t.url),
        z(!0),
        setTimeout(() => z(!1), 2e3));
    },
    N = async () => {
      S(!0);
      const { data: s } = await B.from("media_files")
        .update({
          alt_text: v,
          description: h,
          tags: g,
          updated_at: new Date().toISOString(),
        })
        .eq("id", t.id)
        .select()
        .single();
      (s && i(s), S(!1));
    },
    D = () => {
      const s = w.trim().toLowerCase().replace(/\s+/g, "-");
      (s && !g.includes(s) && p((l) => [...l, s]), f(""));
    },
    $ = (s) => p((l) => l.filter((C) => C !== s)),
    a = async (s) => {
      if (!s.target.files?.[0] || !d) return;
      T(!0);
      const { data: l, error: C } = await fe(t.id, s.target.files[0], d.id);
      (l && i(l), T(!1), C || A());
    };
  return (0, e.jsx)("div", {
    className:
      "fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4",
    onClick: u,
    children: (0, e.jsxs)("div", {
      className:
        "bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden",
      onClick: (s) => s.stopPropagation(),
      children: [
        (0, e.jsxs)("div", {
          className:
            "flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0",
          children: [
            (0, e.jsxs)("div", {
              className: "min-w-0 flex-1",
              children: [
                (0, e.jsx)("h2", {
                  className: "text-base font-semibold text-gray-900 truncate",
                  children: t.original_name,
                }),
                (0, e.jsxs)("div", {
                  className: "flex items-center gap-3 mt-0.5",
                  children: [
                    (0, e.jsx)("span", {
                      className: "text-xs text-gray-400",
                      children: R(t.size),
                    }),
                    (0, e.jsx)("span", {
                      className: "text-xs text-gray-400",
                      children: t.type,
                    }),
                    (0, e.jsx)("span", {
                      className:
                        "text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium",
                      children: ke[t.category] || t.category,
                    }),
                    t.is_brand_asset &&
                      (0, e.jsx)("span", {
                        className:
                          "text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium",
                        children: "Actif de marque",
                      }),
                  ],
                }),
              ],
            }),
            (0, e.jsxs)("div", {
              className: "flex items-center gap-1 ml-4",
              children: [
                (0, e.jsx)("a", {
                  href: t.url,
                  target: "_blank",
                  rel: "noopener noreferrer",
                  className:
                    "p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors",
                  title: "Ouvrir dans un nouvel onglet",
                  children: (0, e.jsx)(O, { size: 16 }),
                }),
                (0, e.jsx)("a", {
                  href: t.url,
                  download: t.original_name,
                  className:
                    "p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors",
                  title: "Télécharger",
                  children: (0, e.jsx)(ae, { size: 16 }),
                }),
                (0, e.jsx)("button", {
                  onClick: () => {
                    (L(t), u());
                  },
                  className:
                    "p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors",
                  title: "Supprimer",
                  children: (0, e.jsx)(X, { size: 16 }),
                }),
                (0, e.jsx)("button", {
                  onClick: u,
                  className:
                    "p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors",
                  children: (0, e.jsx)(G, { size: 16 }),
                }),
              ],
            }),
          ],
        }),
        (0, e.jsxs)("div", {
          className: "flex flex-1 overflow-hidden",
          children: [
            (0, e.jsx)("div", {
              className:
                "w-72 flex-shrink-0 bg-gray-50 flex items-center justify-center p-4 border-r border-gray-100",
              children: (0, e.jsxs)("div", {
                className: "w-full egs-table",
                children: [
                  (0, e.jsx)("img", {
                    src: t.url,
                    alt: t.alt_text || t.original_name,
                    className:
                      "w-full rounded-xl object-contain max-h-64 shadow-sm",
                  }),
                  (0, e.jsxs)("div", {
                    className: "mt-3 space-y-2",
                    children: [
                      (0, e.jsxs)("button", {
                        onClick: F,
                        className:
                          "w-full flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 hover:border-blue-300 transition-colors",
                        children: [
                          b
                            ? (0, e.jsx)(le, {
                                size: 13,
                                className: "text-green-500",
                              })
                            : (0, e.jsx)(Q, { size: 13 }),
                          b ? "URL copiée !" : "Copier l'URL",
                        ],
                      }),
                      (0, e.jsx)("input", {
                        ref: M,
                        type: "file",
                        accept: ".jpg,.jpeg,.png,.webp,.gif,.svg",
                        className: "hidden",
                        onChange: a,
                      }),
                      (0, e.jsxs)("button", {
                        onClick: () => M.current?.click(),
                        disabled: y,
                        className:
                          "w-full flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-amber-50 hover:border-amber-300 transition-colors disabled:opacity-50",
                        children: [
                          (0, e.jsx)(te, {
                            size: 13,
                            className: y ? "animate-spin" : "",
                          }),
                          y ? "Remplacement..." : "Remplacer l'image",
                        ],
                      }),
                    ],
                  }),
                  (0, e.jsx)("p", {
                    className:
                      "text-xs text-gray-400 font-mono break-all mt-3 text-center",
                    children: t.filename,
                  }),
                ],
              }),
            }),
            (0, e.jsxs)("div", {
              className: "flex-1 flex flex-col overflow-hidden",
              children: [
                (0, e.jsx)("div", {
                  className:
                    "flex gap-1 px-6 pt-4 border-b border-gray-100 flex-shrink-0",
                  children: [
                    { id: "info", label: "Informations", icon: de },
                    {
                      id: "usages",
                      label: `Usages${o.length > 0 ? ` (${o.length})` : ""}`,
                      icon: H,
                    },
                    {
                      id: "versions",
                      label: `Historique${m.length > 0 ? ` (${m.length})` : ""}`,
                      icon: Y,
                    },
                  ].map((s) => {
                    const l = s.icon;
                    return (0, e.jsxs)(
                      "button",
                      {
                        onClick: () => _(s.id),
                        className: `flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg border-b-2 transition-colors -mb-px ${x === s.id ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`,
                        children: [(0, e.jsx)(l, { size: 13 }), s.label],
                      },
                      s.id,
                    );
                  }),
                }),
                (0, e.jsxs)("div", {
                  className: "flex-1 overflow-y-auto p-6",
                  children: [
                    x === "info" &&
                      (0, e.jsxs)("div", {
                        className: "space-y-5",
                        children: [
                          (0, e.jsxs)("div", {
                            children: [
                              (0, e.jsx)("label", {
                                className:
                                  "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5",
                                children: "Texte alternatif (SEO)",
                              }),
                              (0, e.jsx)("input", {
                                value: v,
                                onChange: (s) => j(s.target.value),
                                placeholder:
                                  "Description de l'image pour l'accessibilité...",
                                className:
                                  "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition",
                              }),
                            ],
                          }),
                          (0, e.jsxs)("div", {
                            children: [
                              (0, e.jsx)("label", {
                                className:
                                  "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5",
                                children: "Description",
                              }),
                              (0, e.jsx)("textarea", {
                                value: h,
                                onChange: (s) => n(s.target.value),
                                placeholder: "Description de l'image...",
                                rows: 3,
                                className:
                                  "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition resize-none",
                              }),
                            ],
                          }),
                          (0, e.jsxs)("div", {
                            children: [
                              (0, e.jsxs)("label", {
                                className:
                                  "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5",
                                children: [
                                  (0, e.jsx)(K, {
                                    size: 11,
                                    className: "inline mr-1",
                                  }),
                                  "Tags",
                                ],
                              }),
                              (0, e.jsxs)("div", {
                                className: "flex items-center gap-2 mb-2",
                                children: [
                                  (0, e.jsx)("input", {
                                    value: w,
                                    onChange: (s) => f(s.target.value),
                                    onKeyDown: (s) => {
                                      s.key === "Enter" &&
                                        (s.preventDefault(), D());
                                    },
                                    placeholder:
                                      "Ajouter un tag (Entrée pour valider)",
                                    className:
                                      "flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition",
                                  }),
                                  (0, e.jsx)("button", {
                                    onClick: D,
                                    className:
                                      "px-3 py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors",
                                    children: "Ajouter",
                                  }),
                                ],
                              }),
                              (0, e.jsxs)("div", {
                                className: "flex flex-wrap gap-1.5",
                                children: [
                                  g.map((s) =>
                                    (0, e.jsxs)(
                                      "span",
                                      {
                                        className:
                                          "flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs rounded-full font-medium",
                                        children: [
                                          "#",
                                          s,
                                          (0, e.jsx)("button", {
                                            onClick: () => $(s),
                                            className:
                                              "hover:text-blue-900 transition-colors",
                                            children: (0, e.jsx)(G, {
                                              size: 10,
                                            }),
                                          }),
                                        ],
                                      },
                                      s,
                                    ),
                                  ),
                                  g.length === 0 &&
                                    (0, e.jsx)("span", {
                                      className: "text-xs text-gray-400",
                                      children:
                                        "Aucun tag. Ajoutez des tags pour faciliter la recherche.",
                                    }),
                                ],
                              }),
                            ],
                          }),
                          (0, e.jsx)("div", {
                            className:
                              "grid grid-cols-2 gap-3 pt-2 border-t border-gray-100",
                            children: [
                              { label: "Taille", value: R(t.size) },
                              { label: "Type", value: t.type },
                              { label: "Uploadé le", value: U(t.upload_date) },
                              { label: "Modifié le", value: U(t.updated_at) },
                            ].map(({ label: s, value: l }) =>
                              (0, e.jsxs)(
                                "div",
                                {
                                  children: [
                                    (0, e.jsx)("p", {
                                      className:
                                        "text-xs text-gray-400 font-medium",
                                      children: s,
                                    }),
                                    (0, e.jsx)("p", {
                                      className:
                                        "text-sm text-gray-700 mt-0.5 font-mono",
                                      children: l,
                                    }),
                                  ],
                                },
                                s,
                              ),
                            ),
                          }),
                          (0, e.jsx)("div", {
                            className: "pt-3 flex justify-end",
                            children: (0, e.jsxs)("button", {
                              onClick: N,
                              disabled: c,
                              className:
                                "flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50",
                              children: [
                                (0, e.jsx)(xe, { size: 14 }),
                                c ? "Enregistrement..." : "Enregistrer",
                              ],
                            }),
                          }),
                        ],
                      }),
                    x === "usages" &&
                      (0, e.jsx)("div", {
                        className: "space-y-3",
                        children:
                          o.length === 0
                            ? (0, e.jsxs)("div", {
                                className: "text-center py-10 text-gray-400",
                                children: [
                                  (0, e.jsx)(H, {
                                    size: 32,
                                    className: "mx-auto mb-2 opacity-30",
                                  }),
                                  (0, e.jsx)("p", {
                                    className: "text-sm",
                                    children:
                                      "Cette image n'est assignée à aucun élément",
                                  }),
                                ],
                              })
                            : o.map((s) =>
                                (0, e.jsxs)(
                                  "div",
                                  {
                                    className:
                                      "flex items-center justify-between p-3 bg-gray-50 rounded-xl",
                                    children: [
                                      (0, e.jsxs)("div", {
                                        children: [
                                          (0, e.jsx)("p", {
                                            className:
                                              "text-sm font-medium text-gray-800",
                                            children:
                                              ye[s.usage_type] || s.usage_type,
                                          }),
                                          (0, e.jsxs)("p", {
                                            className:
                                              "text-xs text-gray-500 mt-0.5",
                                            children: [
                                              je[s.entity_type] ||
                                                s.entity_type,
                                              s.entity_id &&
                                                ` · ${s.entity_id.slice(0, 8)}...`,
                                            ],
                                          }),
                                        ],
                                      }),
                                      (0, e.jsx)("span", {
                                        className: "text-xs text-gray-400",
                                        children: new Date(
                                          s.created_at,
                                        ).toLocaleDateString("fr-FR"),
                                      }),
                                    ],
                                  },
                                  s.id,
                                ),
                              ),
                      }),
                    x === "versions" &&
                      (0, e.jsx)("div", {
                        className: "space-y-3",
                        children:
                          m.length === 0
                            ? (0, e.jsxs)("div", {
                                className: "text-center py-10 text-gray-400",
                                children: [
                                  (0, e.jsx)(Y, {
                                    size: 32,
                                    className: "mx-auto mb-2 opacity-30",
                                  }),
                                  (0, e.jsx)("p", {
                                    className: "text-sm",
                                    children:
                                      "Aucun historique de remplacement",
                                  }),
                                  (0, e.jsx)("p", {
                                    className: "text-xs mt-1",
                                    children: `Utilisez "Remplacer l'image" pour créer une nouvelle version`,
                                  }),
                                ],
                              })
                            : m.map((s) =>
                                (0, e.jsxs)(
                                  "div",
                                  {
                                    className:
                                      "flex items-center justify-between p-3 bg-gray-50 rounded-xl",
                                    children: [
                                      (0, e.jsxs)("div", {
                                        className: "flex items-center gap-3",
                                        children: [
                                          (0, e.jsx)("div", {
                                            className:
                                              "w-10 h-10 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0",
                                            children: (0, e.jsx)("img", {
                                              src: s.old_url,
                                              alt: "",
                                              className:
                                                "w-full h-full object-cover",
                                              onError: (l) => {
                                                l.target.style.display = "none";
                                              },
                                            }),
                                          }),
                                          (0, e.jsxs)("div", {
                                            children: [
                                              (0, e.jsxs)("p", {
                                                className:
                                                  "text-sm font-medium text-gray-700",
                                                children: [
                                                  "Version ",
                                                  s.version_number,
                                                ],
                                              }),
                                              (0, e.jsx)("p", {
                                                className:
                                                  "text-xs text-gray-400",
                                                children: new Date(
                                                  s.replaced_at,
                                                ).toLocaleString("fr-FR"),
                                              }),
                                            ],
                                          }),
                                        ],
                                      }),
                                      (0, e.jsx)("a", {
                                        href: s.old_url,
                                        target: "_blank",
                                        rel: "noopener noreferrer",
                                        className:
                                          "p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors",
                                        children: (0, e.jsx)(O, { size: 13 }),
                                      }),
                                    ],
                                  },
                                  s.id,
                                ),
                              ),
                      }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  });
}
var Se = [
    { value: "all", label: "Toutes" },
    { value: "brand_assets", label: "Actifs de marque" },
    { value: "site_vitrine", label: "Vitrine" },
    { value: "hero_backgrounds", label: "Hero" },
    { value: "realisations", label: "Réalisations" },
    { value: "projets_btp", label: "Projets BTP" },
    { value: "immobilier", label: "Immobilier" },
    { value: "services", label: "Services" },
    { value: "equipe", label: "Équipe" },
    { value: "documents", label: "Documents" },
    { value: "autre", label: "Autre" },
  ],
  Te = [
    { value: "date_desc", label: "Plus récent" },
    { value: "date_asc", label: "Plus ancien" },
    { value: "name_asc", label: "Nom A-Z" },
    { value: "size_desc", label: "Plus grand" },
  ];
function Ue() {
  const { primaryColor: t } = we(),
    [u, L] = (0, r.useState)("library"),
    [i, d] = (0, r.useState)([]),
    [x, _] = (0, r.useState)(!0),
    [o, I] = (0, r.useState)(""),
    [m, E] = (0, r.useState)("all"),
    [b, z] = (0, r.useState)("date_desc"),
    [c, S] = (0, r.useState)(""),
    [y, T] = (0, r.useState)([]),
    [v, j] = (0, r.useState)(!1),
    [h, n] = (0, r.useState)("grid"),
    [w, f] = (0, r.useState)(!1),
    [g, p] = (0, r.useState)(null),
    [M, k] = (0, r.useState)(null),
    A = (0, r.useCallback)(async () => {
      _(!0);
      let a = B.from("media_files").select("*");
      m !== "all" && (a = a.eq("category", m));
      const [s, l] = (() => {
        switch (b) {
          case "date_asc":
            return ["upload_date", !0];
          case "name_asc":
            return ["original_name", !0];
          case "size_desc":
            return ["size", !1];
          default:
            return ["upload_date", !1];
        }
      })();
      a = a.order(s, { ascending: l });
      const { data: C } = await a,
        V = C || [];
      (d(V),
        T(Array.from(new Set(V.flatMap((Z) => Z.tags || []))).sort()),
        _(!1));
    }, [m, b]);
  (0, r.useEffect)(() => {
    A();
  }, [A]);
  const R = (a) => {
      (d((s) => [...a, ...s]),
        f(!1),
        T(
          Array.from(new Set([...y, ...a.flatMap((s) => s.tags || [])])).sort(),
        ));
    },
    U = async (a) => {
      (await B.storage.from("media").remove([a.filename]),
        await B.from("media_files").delete().eq("id", a.id),
        d((s) => s.filter((l) => l.id !== a.id)),
        k(null),
        g?.id === a.id && p(null));
    },
    F = (a) => {
      (d((s) => s.map((l) => (l.id === a.id ? a : l))), g?.id === a.id && p(a));
    },
    N = i.filter((a) => {
      const s =
          a.original_name.toLowerCase().includes(o.toLowerCase()) ||
          (a.alt_text && a.alt_text.toLowerCase().includes(o.toLowerCase())) ||
          (a.description &&
            a.description.toLowerCase().includes(o.toLowerCase())),
        l = !c || (a.tags && a.tags.includes(c));
      return s && l;
    }),
    D = (a) =>
      a < 1024 * 1024
        ? `${(a / 1024).toFixed(0)} KB`
        : `${(a / (1024 * 1024)).toFixed(1)} MB`,
    $ = i.reduce((a, s) => a + s.size, 0);
  return (0, e.jsxs)("div", {
    className: "p-6 space-y-6",
    children: [
      (0, e.jsxs)("div", {
        className: "flex items-center justify-between",
        children: [
          (0, e.jsxs)("div", {
            children: [
              (0, e.jsx)("h1", {
                className: "text-2xl font-bold text-gray-900",
                children: "Gestion des médias",
              }),
              (0, e.jsxs)("p", {
                className: "text-sm text-gray-500 mt-0.5",
                children: [
                  i.length,
                  " image",
                  i.length > 1 ? "s" : "",
                  " · ",
                  D($),
                  " utilisés",
                ],
              }),
            ],
          }),
          u === "library" &&
            (0, e.jsxs)("button", {
              onClick: () => f(!0),
              className:
                "flex items-center gap-2 px-4 py-2.5 text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity shadow-sm",
              style: { backgroundColor: t },
              children: [(0, e.jsx)(oe, { size: 16 }), "Téléverser"],
            }),
        ],
      }),
      (0, e.jsx)("div", {
        className: "grid grid-cols-2 md:grid-cols-4 gap-4",
        children: [
          { icon: P, color: "blue", value: i.length, label: "Images totales" },
          { icon: J, color: "green", value: D($), label: "Stockage utilisé" },
          {
            icon: q,
            color: "amber",
            value: i.filter((a) => a.is_brand_asset).length,
            label: "Actifs de marque",
          },
          {
            icon: ie,
            color: "rose",
            value:
              i.length > 0
                ? new Date(i[0].upload_date).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "short",
                  })
                : "—",
            label: "Dernier upload",
          },
        ].map(({ icon: a, color: s, value: l, label: C }) =>
          (0, e.jsxs)(
            "div",
            {
              className:
                "bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3",
              children: [
                (0, e.jsx)("div", {
                  className: `w-10 h-10 rounded-xl bg-${s}-50 flex items-center justify-center`,
                  children: (0, e.jsx)(a, {
                    size: 18,
                    className: `text-${s}-600`,
                  }),
                }),
                (0, e.jsxs)("div", {
                  children: [
                    (0, e.jsx)("p", {
                      className: "text-2xl font-bold text-gray-900",
                      children: l,
                    }),
                    (0, e.jsx)("p", {
                      className: "text-xs text-gray-500",
                      children: C,
                    }),
                  ],
                }),
              ],
            },
            C,
          ),
        ),
      }),
      (0, e.jsx)("div", {
        className: "border-b border-gray-200",
        children: (0, e.jsx)("div", {
          className: "flex gap-1",
          children: [
            { id: "library", label: "Bibliothèque", icon: P },
            { id: "brand", label: "Actifs de marque", icon: q },
            { id: "assignments", label: "Assignations", icon: K },
          ].map((a) => {
            const s = a.icon;
            return (0, e.jsxs)(
              "button",
              {
                onClick: () => L(a.id),
                className: `flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${u === a.id ? "text-gray-900" : "border-transparent text-gray-500 hover:text-gray-700"}`,
                style: u === a.id ? { borderColor: t, color: t } : {},
                children: [(0, e.jsx)(s, { size: 15 }), a.label],
              },
              a.id,
            );
          }),
        }),
      }),
      u === "library" &&
        (0, e.jsxs)(e.Fragment, {
          children: [
            w &&
              (0, e.jsxs)("div", {
                className:
                  "bg-white rounded-2xl border border-gray-200 p-6 shadow-sm",
                children: [
                  (0, e.jsxs)("div", {
                    className: "flex items-center justify-between mb-4",
                    children: [
                      (0, e.jsx)("h2", {
                        className: "text-base font-semibold text-gray-900",
                        children: "Téléverser des images",
                      }),
                      (0, e.jsx)("button", {
                        onClick: () => f(!1),
                        className:
                          "p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors",
                        children: (0, e.jsx)(G, { size: 16 }),
                      }),
                    ],
                  }),
                  (0, e.jsx)(pe, { onUploadComplete: R, onClose: () => f(!1) }),
                ],
              }),
            (0, e.jsxs)("div", {
              className:
                "bg-white rounded-2xl border border-gray-200 overflow-hidden",
              children: [
                (0, e.jsxs)("div", {
                  className:
                    "p-4 border-b border-gray-100 flex flex-wrap items-center gap-3",
                  children: [
                    (0, e.jsxs)("div", {
                      className: "relative flex-1 min-w-[180px]",
                      children: [
                        (0, e.jsx)(se, {
                          size: 14,
                          className:
                            "absolute left-3 top-1/2 -translate-y-1/2 text-gray-400",
                        }),
                        (0, e.jsx)("input", {
                          type: "text",
                          placeholder: "Rechercher...",
                          value: o,
                          onChange: (a) => I(a.target.value),
                          className:
                            "w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50",
                        }),
                      ],
                    }),
                    (0, e.jsx)("div", {
                      className:
                        "flex items-center gap-1.5 overflow-x-auto max-w-lg",
                      children: Se.map((a) =>
                        (0, e.jsxs)(
                          "button",
                          {
                            onClick: () => E(a.value),
                            className: `px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${m === a.value ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`,
                            children: [
                              a.label,
                              a.value !== "all" &&
                                (0, e.jsxs)("span", {
                                  className: `ml-1 ${m === a.value ? "text-blue-200" : "text-gray-400"}`,
                                  children: [
                                    "(",
                                    i.filter((s) => s.category === a.value)
                                      .length,
                                    ")",
                                  ],
                                }),
                            ],
                          },
                          a.value,
                        ),
                      ),
                    }),
                    (0, e.jsxs)("div", {
                      className: "flex items-center gap-2 ml-auto",
                      children: [
                        y.length > 0 &&
                          (0, e.jsxs)("div", {
                            className: "relative",
                            children: [
                              (0, e.jsxs)("button", {
                                onClick: () => j(!v),
                                className: `flex items-center gap-1.5 px-3 py-2 border rounded-lg text-xs font-medium transition-colors ${c ? "border-blue-400 bg-blue-50 text-blue-700" : "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100"}`,
                                children: [
                                  (0, e.jsx)(W, { size: 12 }),
                                  c ? `#${c}` : "Tags",
                                  (0, e.jsx)(re, { size: 10 }),
                                ],
                              }),
                              v &&
                                (0, e.jsxs)("div", {
                                  className:
                                    "absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-2 z-10 min-w-[150px] max-h-48 overflow-y-auto",
                                  children: [
                                    (0, e.jsx)("button", {
                                      onClick: () => {
                                        (S(""), j(!1));
                                      },
                                      className:
                                        "w-full text-left px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50 rounded-lg",
                                      children: "Tous les tags",
                                    }),
                                    y.map((a) =>
                                      (0, e.jsxs)(
                                        "button",
                                        {
                                          onClick: () => {
                                            (S(a), j(!1));
                                          },
                                          className:
                                            "w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg font-medium",
                                          children: ["#", a],
                                        },
                                        a,
                                      ),
                                    ),
                                  ],
                                }),
                            ],
                          }),
                        (0, e.jsx)("select", {
                          value: b,
                          onChange: (a) => z(a.target.value),
                          className:
                            "border border-gray-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 bg-gray-50",
                          children: Te.map((a) =>
                            (0, e.jsx)(
                              "option",
                              { value: a.value, children: a.label },
                              a.value,
                            ),
                          ),
                        }),
                        (0, e.jsxs)("div", {
                          className:
                            "flex items-center border border-gray-200 rounded-lg overflow-hidden",
                          children: [
                            (0, e.jsx)("button", {
                              onClick: () => n("grid"),
                              className: `p-2 transition-colors ${h === "grid" ? "bg-blue-600 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`,
                              children: (0, e.jsx)(ee, { size: 14 }),
                            }),
                            (0, e.jsx)("button", {
                              onClick: () => n("list"),
                              className: `p-2 transition-colors ${h === "list" ? "bg-blue-600 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`,
                              children: (0, e.jsx)(ne, { size: 14 }),
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
                (0, e.jsx)("div", {
                  className: "p-4",
                  children: x
                    ? (0, e.jsx)("div", {
                        className: "flex items-center justify-center py-16",
                        children: (0, e.jsx)("div", {
                          className:
                            "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600",
                        }),
                      })
                    : N.length === 0
                      ? (0, e.jsxs)("div", {
                          className:
                            "flex flex-col items-center justify-center py-20 text-gray-400",
                          children: [
                            (0, e.jsx)(P, {
                              size: 64,
                              className: "mb-4 opacity-20",
                            }),
                            (0, e.jsx)("p", {
                              className: "text-base font-medium text-gray-500",
                              children:
                                o || c
                                  ? "Aucun résultat pour votre recherche"
                                  : "Aucune image dans cette catégorie",
                            }),
                            !o &&
                              !c &&
                              (0, e.jsx)("button", {
                                onClick: () => f(!0),
                                className:
                                  "text-blue-600 hover:underline text-sm mt-1",
                                children: "Téléversez vos premières images",
                              }),
                          ],
                        })
                      : h === "grid"
                        ? (0, e.jsx)("div", {
                            className:
                              "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3",
                            children: N.map((a) =>
                              (0, e.jsx)(
                                be,
                                { file: a, onDetail: p, onDelete: (s) => k(s) },
                                a.id,
                              ),
                            ),
                          })
                        : (0, e.jsx)("div", {
                            className: "space-y-1",
                            children: N.map((a) =>
                              (0, e.jsxs)(
                                "div",
                                {
                                  onClick: () => p(a),
                                  className:
                                    "flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group cursor-pointer",
                                  children: [
                                    (0, e.jsx)("img", {
                                      src: a.url,
                                      alt: a.original_name,
                                      className:
                                        "w-12 h-12 rounded-lg object-cover flex-shrink-0",
                                    }),
                                    (0, e.jsxs)("div", {
                                      className: "flex-1 min-w-0",
                                      children: [
                                        (0, e.jsx)("p", {
                                          className:
                                            "text-sm font-medium text-gray-800 truncate",
                                          children: a.original_name,
                                        }),
                                        (0, e.jsxs)("div", {
                                          className: "flex items-center gap-2",
                                          children: [
                                            (0, e.jsxs)("p", {
                                              className:
                                                "text-xs text-gray-400",
                                              children: [
                                                D(a.size),
                                                " · ",
                                                new Date(
                                                  a.upload_date,
                                                ).toLocaleDateString("fr-FR"),
                                              ],
                                            }),
                                            a.tags
                                              ?.slice(0, 3)
                                              .map((s) =>
                                                (0, e.jsxs)(
                                                  "span",
                                                  {
                                                    className:
                                                      "text-xs text-blue-500",
                                                    children: ["#", s],
                                                  },
                                                  s,
                                                ),
                                              ),
                                          ],
                                        }),
                                      ],
                                    }),
                                    (0, e.jsxs)("div", {
                                      className: "flex items-center gap-2",
                                      children: [
                                        a.is_brand_asset &&
                                          (0, e.jsx)(q, {
                                            size: 13,
                                            className:
                                              "text-amber-500 fill-amber-500",
                                          }),
                                        (0, e.jsx)("span", {
                                          className:
                                            "text-xs text-gray-500 capitalize hidden sm:block",
                                          children: a.category.replace(
                                            /_/g,
                                            " ",
                                          ),
                                        }),
                                        (0, e.jsx)("button", {
                                          onClick: (s) => {
                                            (s.stopPropagation(), k(a));
                                          },
                                          className:
                                            "p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all",
                                          children: (0, e.jsx)(X, { size: 13 }),
                                        }),
                                      ],
                                    }),
                                  ],
                                },
                                a.id,
                              ),
                            ),
                          }),
                }),
                N.length > 0 &&
                  (0, e.jsxs)("div", {
                    className:
                      "px-4 py-3 border-t border-gray-100 text-xs text-gray-400",
                    children: [
                      N.length,
                      " image",
                      N.length > 1 ? "s" : "",
                      " affichée",
                      N.length > 1 ? "s" : "",
                      (o || c) &&
                        ` · filtré par ${[o && `"${o}"`, c && `#${c}`].filter(Boolean).join(", ")}`,
                    ],
                  }),
              ],
            }),
          ],
        }),
      u === "brand" && (0, e.jsx)(Ne, {}),
      u === "assignments" && (0, e.jsx)(_e, {}),
      g &&
        (0, e.jsx)(Ce, {
          file: g,
          onClose: () => p(null),
          onDelete: (a) => {
            (k(a), p(null));
          },
          onUpdate: F,
        }),
      M &&
        (0, e.jsx)("div", {
          className:
            "fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4",
          children: (0, e.jsxs)("div", {
            className: "bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl",
            children: [
              (0, e.jsx)("div", {
                className:
                  "w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4",
                children: (0, e.jsx)(X, {
                  size: 20,
                  className: "text-red-600",
                }),
              }),
              (0, e.jsx)("h3", {
                className:
                  "text-base font-semibold text-gray-900 text-center mb-1",
                children: "Supprimer l'image",
              }),
              (0, e.jsxs)("p", {
                className: "text-sm text-gray-500 text-center mb-5",
                children: [
                  "Cette action supprimera définitivement ",
                  (0, e.jsxs)("strong", {
                    children: ['"', M.original_name, '"'],
                  }),
                  " de la bibliothèque et de tous les emplacements où elle est utilisée.",
                ],
              }),
              (0, e.jsxs)("div", {
                className: "flex items-center gap-3",
                children: [
                  (0, e.jsx)("button", {
                    onClick: () => k(null),
                    className:
                      "flex-1 px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-xl hover:bg-gray-50 transition-colors",
                    children: "Annuler",
                  }),
                  (0, e.jsx)("button", {
                    onClick: () => U(M),
                    className:
                      "flex-1 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 transition-colors",
                    children: "Supprimer",
                  }),
                ],
              }),
            ],
          }),
        }),
    ],
  });
}
export { Ue as default };
