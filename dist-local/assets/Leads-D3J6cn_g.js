import {
  $t as $,
  J as y,
  L as j,
  O as w,
  V as M,
  bn as O,
  c as g,
  i as q,
  ln as P,
  nt as _,
  st as S,
  xn as W,
} from "./icons-vendor-BfPGE0aO.js";
import { n as G } from "./react-vendor-Dj4gTxeL.js";
import { t as m } from "./supabase-Cm30VQRU.js";
import { n as J } from "./SettingsContext-CMQ2j17o.js";
import { t as h } from "./Badge-DgCJ0f3s.js";
var l = W(),
  e = G();
function K() {
  const { settings: C } = J(),
    [n, k] = (0, l.useState)([]),
    [f, L] = (0, l.useState)([]),
    [A, v] = (0, l.useState)(!0),
    [o, z] = (0, l.useState)("leads"),
    [p, D] = (0, l.useState)(""),
    [u, E] = (0, l.useState)(""),
    [c, R] = (0, l.useState)(""),
    [d, B] = (0, l.useState)({
      total: 0,
      active: 0,
      optedOut: 0,
      totalSent: 0,
      totalFailed: 0,
    }),
    x = (0, l.useCallback)(async () => {
      v(!0);
      try {
        const [s, t, a] = await Promise.all([
          m.from("leads").select("*").order("created_at", { ascending: !1 }),
          m
            .from("lead_campaigns")
            .select("*")
            .order("created_at", { ascending: !1 }),
          m.from("lead_interactions").select("status"),
        ]);
        (k(s.data || []), L(t.data || []));
        const i = a.data || [];
        B({
          total: s.data?.length || 0,
          active: s.data?.filter((r) => r.status === "active").length || 0,
          optedOut: s.data?.filter((r) => r.status === "opted_out").length || 0,
          totalSent: i.filter((r) => r.status === "sent").length,
          totalFailed: i.filter((r) => r.status === "failed").length,
        });
      } finally {
        v(!1);
      }
    }, []);
  (0, l.useEffect)(() => {
    x();
  }, [x]);
  const b = n.filter((s) => {
      const t = !p || s.status === p,
        a = !u || s.channels_optin?.[u],
        i =
          !c ||
          s.phone.includes(c) ||
          `${s.first_name || ""} ${s.last_name || ""}`
            .toLowerCase()
            .includes(c.toLowerCase()) ||
          (s.email || "").toLowerCase().includes(c.toLowerCase());
      return t && a && i;
    }),
    F = async (s, t) => {
      (await m.from("leads").update({ status: t }).eq("id", s), x());
    },
    N = (s) => {
      const t = {
        active: { label: "Actif", color: "bg-green-100 text-green-700" },
        opted_out: { label: "Désabonné", color: "bg-red-100 text-red-700" },
        converted: { label: "Converti", color: "bg-blue-100 text-blue-700" },
        bounced: { label: "Rebond", color: "bg-yellow-100 text-yellow-700" },
      }[s] || { label: s, color: "bg-gray-100 text-gray-700" };
      return (0, e.jsx)("span", {
        className: `px-2 py-1 rounded-full text-xs font-medium ${t.color}`,
        children: t.label,
      });
    },
    T = (s) => {
      const t = {
        draft: { label: "Brouillon", color: "bg-gray-100 text-gray-600" },
        scheduled: { label: "Planifié", color: "bg-blue-100 text-blue-700" },
        running: { label: "En cours", color: "bg-green-100 text-green-700" },
        completed: {
          label: "Terminé",
          color: "bg-emerald-100 text-emerald-700",
        },
        paused: { label: "En pause", color: "bg-yellow-100 text-yellow-700" },
      }[s] || { label: s, color: "bg-gray-100 text-gray-700" };
      return (0, e.jsx)("span", {
        className: `px-2 py-1 rounded-full text-xs font-medium ${t.color}`,
        children: t.label,
      });
    };
  return A && n.length === 0
    ? (0, e.jsx)("div", {
        className: "flex items-center justify-center h-64",
        children: (0, e.jsx)("div", {
          className: "animate-spin rounded-full h-8 w-8 border-b-2",
          style: { borderColor: C.primary_color },
        }),
      })
    : (0, e.jsxs)("div", {
        className:
          "p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6 max-w-[1600px] mx-auto",
        children: [
          (0, e.jsxs)("div", {
            className: "flex items-center justify-between flex-wrap gap-3",
            children: [
              (0, e.jsxs)("div", {
                children: [
                  (0, e.jsx)("h1", {
                    className: "text-xl sm:text-2xl font-bold text-slate-800",
                    children: "📢 Gestion des Leads & Campagnes",
                  }),
                  (0, e.jsx)("p", {
                    className: "text-xs sm:text-sm text-slate-500 mt-0.5",
                    children: "Capture automatique + Bot multi-canal autonome",
                  }),
                ],
              }),
              (0, e.jsxs)("button", {
                onClick: x,
                className:
                  "flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-medium transition-colors",
                children: [(0, e.jsx)(M, { size: 16 }), " Actualiser"],
              }),
            ],
          }),
          (0, e.jsxs)("div", {
            className: "grid grid-cols-2 md:grid-cols-5 gap-4",
            children: [
              (0, e.jsx)("div", {
                className:
                  "bg-white rounded-2xl shadow-sm border border-slate-200 p-4",
                children: (0, e.jsxs)("div", {
                  className: "flex items-center gap-3",
                  children: [
                    (0, e.jsx)("div", {
                      className: "p-2 bg-blue-50 rounded-xl",
                      children: (0, e.jsx)(g, {
                        size: 20,
                        className: "text-blue-600",
                      }),
                    }),
                    (0, e.jsxs)("div", {
                      children: [
                        (0, e.jsx)("div", {
                          className: "text-xs text-slate-500",
                          children: "Total Leads",
                        }),
                        (0, e.jsx)("div", {
                          className: "text-lg font-bold text-slate-800",
                          children: d.total,
                        }),
                      ],
                    }),
                  ],
                }),
              }),
              (0, e.jsx)("div", {
                className:
                  "bg-white rounded-2xl shadow-sm border border-slate-200 p-4",
                children: (0, e.jsxs)("div", {
                  className: "flex items-center gap-3",
                  children: [
                    (0, e.jsx)("div", {
                      className: "p-2 bg-green-50 rounded-xl",
                      children: (0, e.jsx)($, {
                        size: 20,
                        className: "text-green-600",
                      }),
                    }),
                    (0, e.jsxs)("div", {
                      children: [
                        (0, e.jsx)("div", {
                          className: "text-xs text-slate-500",
                          children: "Actifs",
                        }),
                        (0, e.jsx)("div", {
                          className: "text-lg font-bold text-green-600",
                          children: d.active,
                        }),
                      ],
                    }),
                  ],
                }),
              }),
              (0, e.jsx)("div", {
                className:
                  "bg-white rounded-2xl shadow-sm border border-slate-200 p-4",
                children: (0, e.jsxs)("div", {
                  className: "flex items-center gap-3",
                  children: [
                    (0, e.jsx)("div", {
                      className: "p-2 bg-red-50 rounded-xl",
                      children: (0, e.jsx)(q, {
                        size: 20,
                        className: "text-red-600",
                      }),
                    }),
                    (0, e.jsxs)("div", {
                      children: [
                        (0, e.jsx)("div", {
                          className: "text-xs text-slate-500",
                          children: "Désabonnés",
                        }),
                        (0, e.jsx)("div", {
                          className: "text-lg font-bold text-red-600",
                          children: d.optedOut,
                        }),
                      ],
                    }),
                  ],
                }),
              }),
              (0, e.jsx)("div", {
                className:
                  "bg-white rounded-2xl shadow-sm border border-slate-200 p-4",
                children: (0, e.jsxs)("div", {
                  className: "flex items-center gap-3",
                  children: [
                    (0, e.jsx)("div", {
                      className: "p-2 bg-teal-50 rounded-xl",
                      children: (0, e.jsx)(j, {
                        size: 20,
                        className: "text-teal-600",
                      }),
                    }),
                    (0, e.jsxs)("div", {
                      children: [
                        (0, e.jsx)("div", {
                          className: "text-xs text-slate-500",
                          children: "Messages envoyés",
                        }),
                        (0, e.jsx)("div", {
                          className: "text-lg font-bold text-teal-600",
                          children: d.totalSent,
                        }),
                      ],
                    }),
                  ],
                }),
              }),
              (0, e.jsx)("div", {
                className:
                  "bg-white rounded-2xl shadow-sm border border-slate-200 p-4",
                children: (0, e.jsxs)("div", {
                  className: "flex items-center gap-3",
                  children: [
                    (0, e.jsx)("div", {
                      className: "p-2 bg-amber-50 rounded-xl",
                      children: (0, e.jsx)(O, {
                        size: 20,
                        className: "text-amber-600",
                      }),
                    }),
                    (0, e.jsxs)("div", {
                      children: [
                        (0, e.jsx)("div", {
                          className: "text-xs text-slate-500",
                          children: "Échecs",
                        }),
                        (0, e.jsx)("div", {
                          className: "text-lg font-bold text-amber-600",
                          children: d.totalFailed,
                        }),
                      ],
                    }),
                  ],
                }),
              }),
            ],
          }),
          (0, e.jsx)("div", {
            className: "flex gap-2 border-b border-slate-200",
            children: [
              { key: "leads", label: "📋 Leads", icon: g },
              { key: "campaigns", label: "📢 Campagnes", icon: j },
              { key: "analytics", label: "📊 Analytiques", icon: P },
            ].map((s) =>
              (0, e.jsx)(
                "button",
                {
                  onClick: () => z(s.key),
                  className: `px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 ${o === s.key ? "bg-white text-slate-800 border-b-2 border-slate-800" : "text-slate-500 hover:text-slate-700"}`,
                  children: s.label,
                },
                s.key,
              ),
            ),
          }),
          o === "leads" &&
            (0, e.jsxs)("div", {
              className: "space-y-4",
              children: [
                (0, e.jsxs)("div", {
                  className: "flex flex-wrap gap-3",
                  children: [
                    (0, e.jsx)("div", {
                      className: "relative flex-1 min-w-[200px]",
                      children: (0, e.jsx)("input", {
                        type: "text",
                        placeholder: "Rechercher par nom, téléphone, email...",
                        value: c,
                        onChange: (s) => R(s.target.value),
                        className:
                          "w-full pl-4 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100",
                      }),
                    }),
                    (0, e.jsxs)("select", {
                      value: p,
                      onChange: (s) => D(s.target.value),
                      className:
                        "px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white",
                      children: [
                        (0, e.jsx)("option", {
                          value: "",
                          children: "Tous les statuts",
                        }),
                        (0, e.jsx)("option", {
                          value: "active",
                          children: "Actifs",
                        }),
                        (0, e.jsx)("option", {
                          value: "opted_out",
                          children: "Désabonnés",
                        }),
                        (0, e.jsx)("option", {
                          value: "converted",
                          children: "Convertis",
                        }),
                      ],
                    }),
                    (0, e.jsxs)("select", {
                      value: u,
                      onChange: (s) => E(s.target.value),
                      className:
                        "px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white",
                      children: [
                        (0, e.jsx)("option", {
                          value: "",
                          children: "Tous les canaux",
                        }),
                        (0, e.jsx)("option", { value: "sms", children: "SMS" }),
                        (0, e.jsx)("option", {
                          value: "whatsapp",
                          children: "WhatsApp",
                        }),
                        (0, e.jsx)("option", {
                          value: "email",
                          children: "Email",
                        }),
                      ],
                    }),
                  ],
                }),
                (0, e.jsx)("div", {
                  className:
                    "bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden",
                  children:
                    b.length === 0
                      ? (0, e.jsxs)("div", {
                          className:
                            "flex flex-col items-center justify-center h-48 text-slate-400",
                          children: [
                            (0, e.jsx)(g, {
                              size: 40,
                              className: "mb-2 opacity-30",
                            }),
                            (0, e.jsx)("p", {
                              className: "text-sm",
                              children: "Aucun lead trouvé",
                            }),
                          ],
                        })
                      : (0, e.jsxs)(e.Fragment, {
                          children: [
                            (0, e.jsx)("div", {
                              className: "hidden md:block overflow-x-auto",
                              children: (0, e.jsxs)("table", {
                                className: "w-full text-sm",
                                children: [
                                  (0, e.jsx)("thead", {
                                    className:
                                      "bg-slate-50 border-b border-slate-200",
                                    children: (0, e.jsxs)("tr", {
                                      children: [
                                        (0, e.jsx)("th", {
                                          className:
                                            "text-left px-4 py-3 font-semibold text-slate-600",
                                          children: "Nom / Téléphone",
                                        }),
                                        (0, e.jsx)("th", {
                                          className:
                                            "text-left px-4 py-3 font-semibold text-slate-600",
                                          children: "Email",
                                        }),
                                        (0, e.jsx)("th", {
                                          className:
                                            "text-left px-4 py-3 font-semibold text-slate-600",
                                          children: "Source",
                                        }),
                                        (0, e.jsx)("th", {
                                          className:
                                            "text-left px-4 py-3 font-semibold text-slate-600",
                                          children: "Canaux",
                                        }),
                                        (0, e.jsx)("th", {
                                          className:
                                            "text-left px-4 py-3 font-semibold text-slate-600",
                                          children: "Statut",
                                        }),
                                        (0, e.jsx)("th", {
                                          className:
                                            "text-left px-4 py-3 font-semibold text-slate-600",
                                          children: "Score",
                                        }),
                                        (0, e.jsx)("th", {
                                          className:
                                            "text-left px-4 py-3 font-semibold text-slate-600",
                                          children: "Date",
                                        }),
                                        (0, e.jsx)("th", {
                                          className:
                                            "text-left px-4 py-3 font-semibold text-slate-600",
                                          children: "Actions",
                                        }),
                                      ],
                                    }),
                                  }),
                                  (0, e.jsx)("tbody", {
                                    children: b.map((s) =>
                                      (0, e.jsxs)(
                                        "tr",
                                        {
                                          className:
                                            "border-b border-slate-100 hover:bg-slate-50 transition-colors",
                                          children: [
                                            (0, e.jsxs)("td", {
                                              className: "px-4 py-3",
                                              children: [
                                                (0, e.jsx)("div", {
                                                  className:
                                                    "font-medium text-slate-800",
                                                  children:
                                                    [s.first_name, s.last_name]
                                                      .filter(Boolean)
                                                      .join(" ") || "—",
                                                }),
                                                (0, e.jsx)("div", {
                                                  className:
                                                    "text-xs text-slate-500",
                                                  children: s.phone,
                                                }),
                                              ],
                                            }),
                                            (0, e.jsx)("td", {
                                              className:
                                                "px-4 py-3 text-slate-600",
                                              children: s.email || "—",
                                            }),
                                            (0, e.jsx)("td", {
                                              className:
                                                "px-4 py-3 text-xs text-slate-500",
                                              children:
                                                s.source_form ||
                                                s.source_page ||
                                                "—",
                                            }),
                                            (0, e.jsx)("td", {
                                              className: "px-4 py-3",
                                              children: (0, e.jsxs)("div", {
                                                className: "flex gap-1",
                                                children: [
                                                  s.channels_optin?.sms &&
                                                    (0, e.jsx)(w, {
                                                      size: 14,
                                                      className:
                                                        "text-blue-500",
                                                    }),
                                                  s.channels_optin?.whatsapp &&
                                                    (0, e.jsx)(_, {
                                                      size: 14,
                                                      className:
                                                        "text-green-500",
                                                    }),
                                                  s.channels_optin?.email &&
                                                    (0, e.jsx)(S, {
                                                      size: 14,
                                                      className: "text-red-500",
                                                    }),
                                                  s.channels_optin?.telegram &&
                                                    (0, e.jsx)(y, {
                                                      size: 14,
                                                      className: "text-sky-500",
                                                    }),
                                                ],
                                              }),
                                            }),
                                            (0, e.jsx)("td", {
                                              className: "px-4 py-3",
                                              children: N(s.status),
                                            }),
                                            (0, e.jsx)("td", {
                                              className:
                                                "px-4 py-3 font-bold text-slate-700",
                                              children: s.score,
                                            }),
                                            (0, e.jsx)("td", {
                                              className:
                                                "px-4 py-3 text-xs text-slate-500",
                                              children: new Date(
                                                s.created_at,
                                              ).toLocaleDateString("fr-FR"),
                                            }),
                                            (0, e.jsx)("td", {
                                              className: "px-4 py-3",
                                              children: (0, e.jsxs)("select", {
                                                value: s.status,
                                                onChange: (t) =>
                                                  F(s.id, t.target.value),
                                                className:
                                                  "text-xs px-2 py-1 rounded-lg border border-slate-200 bg-white",
                                                children: [
                                                  (0, e.jsx)("option", {
                                                    value: "active",
                                                    children: "Actif",
                                                  }),
                                                  (0, e.jsx)("option", {
                                                    value: "opted_out",
                                                    children: "Désabonné",
                                                  }),
                                                  (0, e.jsx)("option", {
                                                    value: "converted",
                                                    children: "Conversi",
                                                  }),
                                                  (0, e.jsx)("option", {
                                                    value: "bounced",
                                                    children: "Rebond",
                                                  }),
                                                ],
                                              }),
                                            }),
                                          ],
                                        },
                                        s.id,
                                      ),
                                    ),
                                  }),
                                ],
                              }),
                            }),
                            (0, e.jsx)("div", {
                              className: "md:hidden p-3 space-y-3",
                              children: b.map((s) =>
                                (0, e.jsxs)(
                                  "div",
                                  {
                                    className:
                                      "p-4 bg-slate-50 rounded-xl space-y-2",
                                    children: [
                                      (0, e.jsxs)("div", {
                                        className:
                                          "flex items-center justify-between",
                                        children: [
                                          (0, e.jsx)("span", {
                                            className:
                                              "font-medium text-slate-800",
                                            children:
                                              [s.first_name, s.last_name]
                                                .filter(Boolean)
                                                .join(" ") || "—",
                                          }),
                                          N(s.status),
                                        ],
                                      }),
                                      (0, e.jsxs)("div", {
                                        className: "text-sm text-slate-600",
                                        children: ["📞 ", s.phone],
                                      }),
                                      s.email &&
                                        (0, e.jsxs)("div", {
                                          className: "text-sm text-slate-600",
                                          children: ["📧 ", s.email],
                                        }),
                                      (0, e.jsxs)("div", {
                                        className: "flex gap-1",
                                        children: [
                                          s.channels_optin?.sms &&
                                            (0, e.jsx)(h, {
                                              label: "SMS",
                                              color: "blue",
                                            }),
                                          s.channels_optin?.whatsapp &&
                                            (0, e.jsx)(h, {
                                              label: "WhatsApp",
                                              color: "green",
                                            }),
                                          s.channels_optin?.email &&
                                            (0, e.jsx)(h, {
                                              label: "Email",
                                              color: "red",
                                            }),
                                        ],
                                      }),
                                    ],
                                  },
                                  s.id,
                                ),
                              ),
                            }),
                          ],
                        }),
                }),
              ],
            }),
          o === "campaigns" &&
            (0, e.jsx)("div", {
              className: "space-y-4",
              children:
                f.length === 0
                  ? (0, e.jsxs)("div", {
                      className:
                        "bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center text-slate-400",
                      children: [
                        (0, e.jsx)(j, {
                          size: 40,
                          className: "mx-auto mb-3 opacity-30",
                        }),
                        (0, e.jsx)("p", {
                          className: "text-sm",
                          children: "Aucune campagne pour le moment",
                        }),
                        (0, e.jsx)("p", {
                          className: "text-xs mt-1",
                          children:
                            "Les workflows automatiques sont configurés dans bot_workflows",
                        }),
                      ],
                    })
                  : f.map((s) =>
                      (0, e.jsxs)(
                        "div",
                        {
                          className:
                            "bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-3",
                          children: [
                            (0, e.jsxs)("div", {
                              className: "flex items-center justify-between",
                              children: [
                                (0, e.jsx)("h3", {
                                  className: "font-bold text-slate-800",
                                  children: s.name,
                                }),
                                T(s.status),
                              ],
                            }),
                            (0, e.jsx)("div", {
                              className: "flex gap-2",
                              children: (s.channels || []).map((t) =>
                                (0, e.jsx)(h, { label: t, color: "blue" }, t),
                              ),
                            }),
                            (0, e.jsx)("div", {
                              className: "grid grid-cols-5 gap-3 text-center",
                              children: [
                                {
                                  label: "Envoyés",
                                  value: s.stats?.sent || 0,
                                  color: "text-teal-600",
                                },
                                {
                                  label: "Livrés",
                                  value: s.stats?.delivered || 0,
                                  color: "text-blue-600",
                                },
                                {
                                  label: "Lus",
                                  value: s.stats?.read || 0,
                                  color: "text-purple-600",
                                },
                                {
                                  label: "Échecs",
                                  value: s.stats?.failed || 0,
                                  color: "text-red-600",
                                },
                                {
                                  label: "Opt-out",
                                  value: s.stats?.opted_out || 0,
                                  color: "text-amber-600",
                                },
                              ].map((t) =>
                                (0, e.jsxs)(
                                  "div",
                                  {
                                    children: [
                                      (0, e.jsx)("div", {
                                        className: `text-lg font-bold ${t.color}`,
                                        children: t.value,
                                      }),
                                      (0, e.jsx)("div", {
                                        className: "text-xs text-slate-500",
                                        children: t.label,
                                      }),
                                    ],
                                  },
                                  t.label,
                                ),
                              ),
                            }),
                            (0, e.jsxs)("div", {
                              className: "text-xs text-slate-500",
                              children: [
                                "Créé le ",
                                new Date(s.created_at).toLocaleDateString(
                                  "fr-FR",
                                ),
                              ],
                            }),
                          ],
                        },
                        s.id,
                      ),
                    ),
            }),
          o === "analytics" &&
            (0, e.jsx)("div", {
              className: "space-y-6",
              children: (0, e.jsxs)("div", {
                className: "grid grid-cols-1 md:grid-cols-2 gap-6",
                children: [
                  (0, e.jsxs)("div", {
                    className:
                      "bg-white rounded-2xl shadow-sm border border-slate-200 p-6",
                    children: [
                      (0, e.jsx)("h3", {
                        className: "font-bold text-slate-800 mb-4",
                        children: "📊 Sources des Leads",
                      }),
                      (() => {
                        const s = {};
                        return (
                          n.forEach((t) => {
                            const a =
                              t.source_form || t.source_page || "direct";
                            s[a] = (s[a] || 0) + 1;
                          }),
                          Object.entries(s)
                            .sort((t, a) => a[1] - t[1])
                            .map(([t, a]) =>
                              (0, e.jsxs)(
                                "div",
                                {
                                  className:
                                    "flex items-center justify-between py-2 border-b border-slate-50 last:border-0",
                                  children: [
                                    (0, e.jsx)("span", {
                                      className: "text-sm text-slate-600",
                                      children: t,
                                    }),
                                    (0, e.jsx)("span", {
                                      className:
                                        "text-sm font-bold text-slate-800",
                                      children: a,
                                    }),
                                  ],
                                },
                                t,
                              ),
                            )
                        );
                      })(),
                    ],
                  }),
                  (0, e.jsxs)("div", {
                    className:
                      "bg-white rounded-2xl shadow-sm border border-slate-200 p-6",
                    children: [
                      (0, e.jsx)("h3", {
                        className: "font-bold text-slate-800 mb-4",
                        children: "📱 Canaux Opt-in",
                      }),
                      [
                        {
                          label: "SMS",
                          key: "sms",
                          icon: w,
                          color: "text-blue-600",
                        },
                        {
                          label: "WhatsApp",
                          key: "whatsapp",
                          icon: _,
                          color: "text-green-600",
                        },
                        {
                          label: "Email",
                          key: "email",
                          icon: S,
                          color: "text-red-600",
                        },
                        {
                          label: "Telegram",
                          key: "telegram",
                          icon: y,
                          color: "text-sky-600",
                        },
                      ].map((s) => {
                        const t = n.filter(
                            (i) => i.channels_optin?.[s.key],
                          ).length,
                          a =
                            n.length > 0 ? Math.round((t / n.length) * 100) : 0;
                        return (0, e.jsxs)(
                          "div",
                          {
                            className:
                              "py-2 border-b border-slate-50 last:border-0",
                            children: [
                              (0, e.jsxs)("div", {
                                className:
                                  "flex items-center justify-between mb-1",
                                children: [
                                  (0, e.jsxs)("div", {
                                    className: "flex items-center gap-2",
                                    children: [
                                      (0, e.jsx)(s.icon, {
                                        size: 16,
                                        className: s.color,
                                      }),
                                      (0, e.jsx)("span", {
                                        className: "text-sm text-slate-600",
                                        children: s.label,
                                      }),
                                    ],
                                  }),
                                  (0, e.jsxs)("span", {
                                    className:
                                      "text-sm font-bold text-slate-800",
                                    children: [t, " (", a, "%)"],
                                  }),
                                ],
                              }),
                              (0, e.jsx)("div", {
                                className:
                                  "w-full bg-slate-100 rounded-full h-2",
                                children: (0, e.jsx)("div", {
                                  className: "h-2 rounded-full bg-slate-800",
                                  style: { width: `${a}%` },
                                }),
                              }),
                            ],
                          },
                          s.key,
                        );
                      }),
                    ],
                  }),
                ],
              }),
            }),
        ],
      });
}
export { K as default };
