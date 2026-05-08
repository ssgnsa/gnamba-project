import {
  Jt as Y,
  R as K,
  Tt as z,
  Wt as M,
  Yt as Q,
  b as L,
  l as Z,
  q as ee,
  xn as te,
} from "./icons-vendor-BfPGE0aO.js";
import { n as re } from "./react-vendor-Dj4gTxeL.js";
import { t as g } from "./supabase-Cm30VQRU.js";
import { n as se } from "./SettingsContext-CMQ2j17o.js";
import { l as le } from "./index-J6Ma0lNi.js";
import { t as oe } from "./Modal-DHHPHHB4.js";
import { t as $ } from "./Badge-DgCJ0f3s.js";
import { t as ae } from "./MobileCard-CQbjJFWA.js";
import { n as ne, t as ie } from "./demoMode-e1eV8-nn.js";
var o = te(),
  e = re(),
  p = 20,
  F = {
    particulier: { label: "Particulier", color: "blue" },
    entreprise: { label: "Entreprise", color: "green" },
    promoteur_immobilier: { label: "Promoteur", color: "orange" },
    institution: { label: "Institution", color: "gray" },
  },
  ce = [
    { value: "", label: "Tous les types" },
    { value: "particulier", label: "Particulier" },
    { value: "entreprise", label: "Entreprise" },
    { value: "promoteur_immobilier", label: "Promoteur Immobilier" },
    { value: "institution", label: "Institution" },
  ],
  O = {
    nom: "",
    prenom: "",
    telephone: "",
    email: "",
    adresse: "",
    type_client: "particulier",
    notes: "",
  },
  de = /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  R =
    /^(?:(?:\+225|00225|0)[\s-])?[56789]\d{2}[\s-]?\d{2}[\s-]?\d{2}[\s-]?\d{2}$/;
function ue(s) {
  return s ? (de.test(s.trim()) ? null : "Format d'email invalide.") : null;
}
function me(s) {
  if (!s.trim()) return "Le téléphone est obligatoire.";
  const u = s.replace(/[\s-]/g, "");
  return !R.test(u) && !R.test(s)
    ? "Format de téléphone invalide. Ex: +225 07 00 00 00 ou 07000000."
    : null;
}
function we() {
  const { settings: s } = se(),
    { user: u, profile: f } = le(),
    [q, D] = (0, o.useState)([]),
    [U, w] = (0, o.useState)(!0),
    [y, B] = (0, o.useState)(""),
    [b, G] = (0, o.useState)(""),
    [H, m] = (0, o.useState)(!1),
    [v, C] = (0, o.useState)(null),
    [r, i] = (0, o.useState)(O),
    [k, _] = (0, o.useState)(!1),
    [E, c] = (0, o.useState)(null),
    [V, S] = (0, o.useState)(1),
    X = ne(u, f);
  (0, o.useEffect)(() => {
    j();
  }, []);
  const j = async () => {
      w(!0);
      const { data: t } = await g
        .from("clients")
        .select("*")
        .order("created_at", { ascending: !1 });
      (D(t || []), w(!1));
    },
    J = () => {
      (i(O), C(null), c(null), m(!0));
    },
    P = (t) => {
      (i({
        nom: t.nom,
        prenom: t.prenom,
        telephone: t.telephone,
        email: t.email,
        adresse: t.adresse,
        type_client: t.type_client,
        notes: t.notes,
      }),
        C(t.id),
        c(null),
        m(!0));
    },
    W = async () => {
      const t = me(r.telephone);
      if (t) {
        c(t);
        return;
      }
      const l = ue(r.email);
      if (l) {
        c(l);
        return;
      }
      if (!r.nom.trim()) {
        c("Le nom est obligatoire.");
        return;
      }
      (_(!0), c(null));
      try {
        if (v) {
          const { error: a } = await g
            .from("clients")
            .update({ ...r, updated_at: new Date().toISOString() })
            .eq("id", v);
          if (a) throw a;
        } else {
          const { error: a } = await g.from("clients").insert(r);
          if (a) throw a;
        }
        (m(!1), j());
      } catch (a) {
        c(
          a instanceof Error
            ? a.message
            : "Impossible d'enregistrer ce client.",
        );
      } finally {
        _(!1);
      }
    },
    I = async (t) => {
      if (X) {
        window.alert(ie());
        return;
      }
      confirm("Supprimer ce client ?") &&
        (await g.from("clients").delete().eq("id", t), j());
    },
    T = (0, o.useCallback)((t) => {
      (sessionStorage.setItem("egs:filter_client_id", t),
        window.dispatchEvent(
          new CustomEvent("egs:navigate", { detail: "projets" }),
        ));
    }, []),
    d = q.filter((t) => {
      const l = `${t.nom} ${t.prenom} ${t.telephone} ${t.email}`
          .toLowerCase()
          .includes(y.toLowerCase()),
        a = !b || t.type_client === b;
      return l && a;
    }),
    x = Math.max(1, Math.ceil(d.length / p)),
    n = Math.min(V, x),
    h = (n - 1) * p,
    A = d.slice(h, h + p),
    N = (t) => S(xe(t, 1, x));
  return (
    (0, o.useEffect)(() => {
      S(1);
    }, [y, b]),
    (0, e.jsxs)("div", {
      className: "space-y-4",
      children: [
        (0, e.jsxs)("div", {
          className:
            "flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between",
          children: [
            (0, e.jsxs)("div", {
              className:
                "flex flex-col sm:flex-row gap-2 flex-1 w-full sm:max-w-none",
              children: [
                (0, e.jsxs)("div", {
                  className: "relative flex-1 w-full sm:max-w-sm",
                  children: [
                    (0, e.jsx)(K, {
                      size: 16,
                      className:
                        "absolute left-3 top-1/2 -translate-y-1/2 text-gray-400",
                    }),
                    (0, e.jsx)("input", {
                      type: "text",
                      placeholder: "Rechercher un client...",
                      value: y,
                      onChange: (t) => B(t.target.value),
                      className:
                        "w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-100)] focus:border-[var(--color-primary-400)]",
                    }),
                  ],
                }),
                (0, e.jsx)("select", {
                  value: b,
                  onChange: (t) => G(t.target.value),
                  className:
                    "px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-100)] focus:border-[var(--color-primary-400)] bg-white w-full sm:w-auto",
                  children: ce.map((t) =>
                    (0, e.jsx)(
                      "option",
                      { value: t.value, children: t.label },
                      t.value,
                    ),
                  ),
                }),
              ],
            }),
            (0, e.jsxs)("button", {
              onClick: J,
              className:
                "flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--color-primary-300)] w-full sm:w-auto",
              style: {
                backgroundColor: s.primary_color,
                color: "var(--color-on-primary)",
              },
              children: [(0, e.jsx)(ee, { size: 16 }), " Nouveau Client"],
            }),
          ],
        }),
        (0, e.jsx)("div", {
          className: "egs-panel overflow-hidden",
          children: U
            ? (0, e.jsx)("div", {
                className: "flex items-center justify-center h-48",
                children: (0, e.jsx)("div", {
                  className: "animate-spin rounded-full h-8 w-8 border-b-2",
                  style: { borderColor: s.primary_color },
                }),
              })
            : d.length === 0
              ? (0, e.jsxs)("div", {
                  className:
                    "flex flex-col items-center justify-center h-48 text-gray-400",
                  children: [
                    (0, e.jsx)(Z, { size: 40, className: "mb-2 opacity-30" }),
                    (0, e.jsx)("p", {
                      className: "text-sm",
                      children: "Aucun client trouvé",
                    }),
                  ],
                })
              : (0, e.jsxs)(e.Fragment, {
                  children: [
                    (0, e.jsx)("div", {
                      className: "md:hidden p-3 space-y-3",
                      children: A.map((t) => {
                        const l = F[t.type_client];
                        return (0, e.jsx)(
                          ae,
                          {
                            title: `${t.prenom} ${t.nom}`.trim() || t.nom,
                            subtitle: t.email || t.telephone || "Client",
                            icon: (0, e.jsx)("div", {
                              className:
                                "w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold",
                              style: {
                                backgroundColor: s.primary_color,
                                color: "var(--color-on-primary)",
                              },
                              children:
                                t.prenom[0]?.toUpperCase() ||
                                t.nom[0]?.toUpperCase() ||
                                "?",
                            }),
                            fields: [
                              { label: "Téléphone", value: t.telephone || "—" },
                              { label: "Email", value: t.email || "—" },
                              {
                                label: "Type",
                                value: (0, e.jsx)($, {
                                  label: l.label,
                                  color: l.color,
                                }),
                              },
                              { label: "Adresse", value: t.adresse || "—" },
                            ],
                            actions: (0, e.jsxs)(e.Fragment, {
                              children: [
                                (0, e.jsx)("button", {
                                  onClick: () => T(t.id),
                                  className:
                                    "p-2 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors",
                                  title: "Voir projets",
                                  children: (0, e.jsx)(z, { size: 16 }),
                                }),
                                (0, e.jsx)("button", {
                                  onClick: () => P(t),
                                  className:
                                    "p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors",
                                  children: (0, e.jsx)(M, { size: 16 }),
                                }),
                                (0, e.jsx)("button", {
                                  onClick: () => I(t.id),
                                  className:
                                    "p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors",
                                  children: (0, e.jsx)(L, { size: 16 }),
                                }),
                              ],
                            }),
                          },
                          t.id,
                        );
                      }),
                    }),
                    (0, e.jsx)("div", {
                      className: "hidden md:block overflow-x-auto",
                      children: (0, e.jsxs)("table", {
                        className: "w-full egs-table",
                        children: [
                          (0, e.jsx)("thead", {
                            children: (0, e.jsxs)("tr", {
                              className: "bg-gray-50 border-b border-gray-100",
                              children: [
                                (0, e.jsx)("th", {
                                  className:
                                    "text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide",
                                  children: "Nom",
                                }),
                                (0, e.jsx)("th", {
                                  className:
                                    "text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide",
                                  children: "Téléphone",
                                }),
                                (0, e.jsx)("th", {
                                  className:
                                    "text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell",
                                  children: "Email",
                                }),
                                (0, e.jsx)("th", {
                                  className:
                                    "text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell",
                                  children: "Type",
                                }),
                                (0, e.jsx)("th", {
                                  className:
                                    "text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell",
                                  children: "Adresse",
                                }),
                                (0, e.jsx)("th", { className: "px-4 py-3" }),
                              ],
                            }),
                          }),
                          (0, e.jsx)("tbody", {
                            className: "divide-y divide-gray-50",
                            children: A.map((t) => {
                              const l = F[t.type_client];
                              return (0, e.jsxs)(
                                "tr",
                                {
                                  className:
                                    "hover:bg-gray-50 transition-colors",
                                  children: [
                                    (0, e.jsx)("td", {
                                      className: "px-4 py-3",
                                      children: (0, e.jsxs)("div", {
                                        className: "flex items-center gap-2",
                                        children: [
                                          (0, e.jsx)("div", {
                                            className:
                                              "w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold",
                                            style: {
                                              backgroundColor: s.primary_color,
                                              color: "var(--color-on-primary)",
                                            },
                                            children:
                                              t.prenom[0]?.toUpperCase() ||
                                              t.nom[0]?.toUpperCase() ||
                                              "?",
                                          }),
                                          (0, e.jsx)("div", {
                                            children: (0, e.jsxs)("div", {
                                              className:
                                                "text-sm font-medium text-gray-800",
                                              children: [t.prenom, " ", t.nom],
                                            }),
                                          }),
                                        ],
                                      }),
                                    }),
                                    (0, e.jsx)("td", {
                                      className:
                                        "px-4 py-3 text-sm text-gray-600",
                                      children: t.telephone,
                                    }),
                                    (0, e.jsx)("td", {
                                      className:
                                        "px-4 py-3 text-sm text-gray-500 hidden md:table-cell",
                                      children: t.email || "—",
                                    }),
                                    (0, e.jsx)("td", {
                                      className:
                                        "px-4 py-3 hidden sm:table-cell",
                                      children: (0, e.jsx)($, {
                                        label: l.label,
                                        color: l.color,
                                      }),
                                    }),
                                    (0, e.jsx)("td", {
                                      className:
                                        "px-4 py-3 text-sm text-gray-500 hidden lg:table-cell max-w-[180px] truncate",
                                      children: t.adresse || "—",
                                    }),
                                    (0, e.jsx)("td", {
                                      className: "px-4 py-3",
                                      children: (0, e.jsxs)("div", {
                                        className:
                                          "flex items-center gap-1 justify-end",
                                        children: [
                                          (0, e.jsx)("button", {
                                            onClick: () => T(t.id),
                                            className:
                                              "p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors",
                                            title: "Voir projets",
                                            children: (0, e.jsx)(z, {
                                              size: 15,
                                            }),
                                          }),
                                          (0, e.jsx)("button", {
                                            onClick: () => P(t),
                                            className:
                                              "p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors",
                                            children: (0, e.jsx)(M, {
                                              size: 15,
                                            }),
                                          }),
                                          (0, e.jsx)("button", {
                                            onClick: () => I(t.id),
                                            className:
                                              "p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors",
                                            children: (0, e.jsx)(L, {
                                              size: 15,
                                            }),
                                          }),
                                        ],
                                      }),
                                    }),
                                  ],
                                },
                                t.id,
                              );
                            }),
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
        }),
        d.length > p &&
          (0, e.jsxs)("div", {
            className:
              "flex flex-col sm:flex-row items-center justify-between gap-3 bg-white rounded-xl border border-gray-100 px-4 py-3",
            children: [
              (0, e.jsxs)("p", {
                className: "text-sm text-gray-500",
                children: [
                  h + 1,
                  "–",
                  Math.min(h + p, d.length),
                  " sur ",
                  d.length,
                  " clients",
                ],
              }),
              (0, e.jsxs)("div", {
                className: "flex items-center gap-1",
                children: [
                  (0, e.jsx)("button", {
                    onClick: () => N(n - 1),
                    disabled: n <= 1,
                    className:
                      "p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors",
                    "aria-label": "Page précédente",
                    children: (0, e.jsx)(Q, { size: 16 }),
                  }),
                  Array.from({ length: x }, (t, l) => l + 1).map((t) => {
                    if (!(t === 1 || t === x || (t >= n - 1 && t <= n + 1)))
                      return null;
                    const l = t === n - 2,
                      a = t === n + 2;
                    return (0, e.jsxs)(
                      "span",
                      {
                        className: "flex items-center",
                        children: [
                          l &&
                            (0, e.jsx)("span", {
                              className: "px-1 text-gray-400 text-sm",
                              children: "…",
                            }),
                          (0, e.jsx)("button", {
                            onClick: () => N(t),
                            className: `min-w-[36px] h-9 rounded-lg text-sm font-medium transition-colors ${t === n ? "text-white" : "text-gray-600 hover:bg-gray-50 border border-gray-200"}`,
                            style:
                              t === n
                                ? {
                                    backgroundColor: s.primary_color,
                                    color: "var(--color-on-primary)",
                                  }
                                : {},
                            children: t,
                          }),
                          a &&
                            (0, e.jsx)("span", {
                              className: "px-1 text-gray-400 text-sm",
                              children: "…",
                            }),
                        ],
                      },
                      t,
                    );
                  }),
                  (0, e.jsx)("button", {
                    onClick: () => N(n + 1),
                    disabled: n >= x,
                    className:
                      "p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors",
                    "aria-label": "Page suivante",
                    children: (0, e.jsx)(Y, { size: 16 }),
                  }),
                ],
              }),
            ],
          }),
        (0, e.jsx)(oe, {
          isOpen: H,
          onClose: () => {
            (m(!1), c(null));
          },
          title: v ? "Modifier le Client" : "Nouveau Client",
          children: (0, e.jsxs)("div", {
            className: "space-y-4",
            children: [
              E &&
                (0, e.jsx)("div", {
                  className:
                    "rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700",
                  children: E,
                }),
              (0, e.jsxs)("div", {
                className: "grid grid-cols-1 sm:grid-cols-2 gap-3",
                children: [
                  (0, e.jsxs)("div", {
                    children: [
                      (0, e.jsx)("label", {
                        className:
                          "block text-xs font-medium text-gray-600 mb-1",
                        children: "Prénom *",
                      }),
                      (0, e.jsx)("input", {
                        type: "text",
                        value: r.prenom,
                        onChange: (t) => i({ ...r, prenom: t.target.value }),
                        className:
                          "w-full px-3 py-2 border border-gray-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400",
                      }),
                    ],
                  }),
                  (0, e.jsxs)("div", {
                    children: [
                      (0, e.jsx)("label", {
                        className:
                          "block text-xs font-medium text-gray-600 mb-1",
                        children: "Nom *",
                      }),
                      (0, e.jsx)("input", {
                        type: "text",
                        value: r.nom,
                        onChange: (t) => i({ ...r, nom: t.target.value }),
                        className:
                          "w-full px-3 py-2 border border-gray-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400",
                      }),
                    ],
                  }),
                ],
              }),
              (0, e.jsxs)("div", {
                children: [
                  (0, e.jsx)("label", {
                    className: "block text-xs font-medium text-gray-600 mb-1",
                    children: "Téléphone *",
                  }),
                  (0, e.jsx)("input", {
                    type: "tel",
                    value: r.telephone,
                    onChange: (t) => i({ ...r, telephone: t.target.value }),
                    placeholder: "+225 07 00 00 00",
                    className:
                      "w-full px-3 py-2 border border-gray-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400",
                  }),
                ],
              }),
              (0, e.jsxs)("div", {
                children: [
                  (0, e.jsx)("label", {
                    className: "block text-xs font-medium text-gray-600 mb-1",
                    children: "Email",
                  }),
                  (0, e.jsx)("input", {
                    type: "email",
                    value: r.email,
                    onChange: (t) => i({ ...r, email: t.target.value }),
                    placeholder: "exemple@email.com",
                    className:
                      "w-full px-3 py-2 border border-gray-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400",
                  }),
                ],
              }),
              (0, e.jsxs)("div", {
                children: [
                  (0, e.jsx)("label", {
                    className: "block text-xs font-medium text-gray-600 mb-1",
                    children: "Adresse",
                  }),
                  (0, e.jsx)("input", {
                    type: "text",
                    value: r.adresse,
                    onChange: (t) => i({ ...r, adresse: t.target.value }),
                    className:
                      "w-full px-3 py-2 border border-gray-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400",
                  }),
                ],
              }),
              (0, e.jsxs)("div", {
                children: [
                  (0, e.jsx)("label", {
                    className: "block text-xs font-medium text-gray-600 mb-1",
                    children: "Type de Client",
                  }),
                  (0, e.jsxs)("select", {
                    value: r.type_client,
                    onChange: (t) => i({ ...r, type_client: t.target.value }),
                    className:
                      "w-full px-3 py-2 border border-gray-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400",
                    children: [
                      (0, e.jsx)("option", {
                        value: "particulier",
                        children: "Particulier",
                      }),
                      (0, e.jsx)("option", {
                        value: "entreprise",
                        children: "Entreprise",
                      }),
                      (0, e.jsx)("option", {
                        value: "promoteur_immobilier",
                        children: "Promoteur Immobilier",
                      }),
                      (0, e.jsx)("option", {
                        value: "institution",
                        children: "Institution",
                      }),
                    ],
                  }),
                ],
              }),
              (0, e.jsxs)("div", {
                children: [
                  (0, e.jsx)("label", {
                    className: "block text-xs font-medium text-gray-600 mb-1",
                    children: "Notes",
                  }),
                  (0, e.jsx)("textarea", {
                    value: r.notes,
                    onChange: (t) => i({ ...r, notes: t.target.value }),
                    rows: 3,
                    className:
                      "w-full px-3 py-2 border border-gray-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 resize-none",
                  }),
                ],
              }),
              (0, e.jsxs)("div", {
                className: "flex gap-3 pt-2",
                children: [
                  (0, e.jsx)("button", {
                    onClick: () => {
                      (m(!1), c(null));
                    },
                    className:
                      "flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors",
                    children: "Annuler",
                  }),
                  (0, e.jsx)("button", {
                    onClick: W,
                    disabled: k || !r.nom.trim() || !r.telephone.trim(),
                    className:
                      "flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50",
                    style: {
                      backgroundColor: s.primary_color,
                      color: "var(--color-on-primary)",
                    },
                    children: k ? "Enregistrement..." : "Enregistrer",
                  }),
                ],
              }),
            ],
          }),
        }),
      ],
    })
  );
}
function xe(s, u, f) {
  return Math.min(f, Math.max(u, s));
}
export { we as default };
