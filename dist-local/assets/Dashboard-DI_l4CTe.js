import {
  $t as se,
  Bt as Ne,
  Ht as ve,
  I as _e,
  Kt as Se,
  Ut as we,
  V as Ae,
  Wt as Ce,
  an as ke,
  c as $e,
  gn as Fe,
  kt as H,
  pn as De,
  sn as Re,
  ut as Ie,
  v as Te,
  vn as re,
  xn as Le,
  y as ae,
} from "./icons-vendor-BfPGE0aO.js";
import { n as ze } from "./react-vendor-Dj4gTxeL.js";
import { t as p } from "./supabase-Cm30VQRU.js";
import { i as K, l as Ee } from "./index-J6Ma0lNi.js";
import { t as A } from "./KPICard-CVeKEx2c.js";
var f = Le(),
  e = ze();
function Me(a) {
  return a >= 1e6
    ? (a / 1e6).toFixed(1) + "M"
    : a >= 1e3
      ? (a / 1e3).toFixed(0) + "k"
      : a.toFixed(0);
}
function Pe({ data: a }) {
  if (!a.length) return null;
  const t = 560,
    d = 220,
    m = 52,
    v = 16,
    _ = 16,
    F = 40,
    z = t - m - v,
    h = d - _ - F,
    C = Math.max(...a.flatMap((n) => [n.recettes, n.depenses]), 1),
    l = z / a.length,
    b = Math.min(l * 0.32, 28),
    j = 4,
    S = [0, 0.25, 0.5, 0.75, 1].map((n) => ({
      y: _ + h * (1 - n),
      label: Me(C * n),
    })),
    y = (n) => _ + h * (1 - n / C),
    x = a.map((n, c) => `${m + l * c + l / 2},${y(n.recettes)}`).join(" "),
    w = [
      `${m + l * 0 + l / 2},${_ + h}`,
      ...a.map((n, c) => `${m + l * c + l / 2},${y(n.recettes)}`),
      `${m + l * (a.length - 1) + l / 2},${_ + h}`,
    ].join(" ");
  return (0, e.jsxs)("div", {
    className: "w-full overflow-x-auto",
    children: [
      (0, e.jsxs)("svg", {
        viewBox: `0 0 ${t} ${d}`,
        className: "w-full",
        style: { minWidth: 320 },
        children: [
          (0, e.jsx)("defs", {
            children: (0, e.jsxs)("linearGradient", {
              id: "areaGrad",
              x1: "0",
              y1: "0",
              x2: "0",
              y2: "1",
              children: [
                (0, e.jsx)("stop", {
                  offset: "0%",
                  stopColor: "#14b8a6",
                  stopOpacity: "0.18",
                }),
                (0, e.jsx)("stop", {
                  offset: "100%",
                  stopColor: "#14b8a6",
                  stopOpacity: "0",
                }),
              ],
            }),
          }),
          S.map((n, c) =>
            (0, e.jsxs)(
              "g",
              {
                children: [
                  (0, e.jsx)("line", {
                    x1: m,
                    y1: n.y,
                    x2: t - v,
                    y2: n.y,
                    stroke: "#e2e8f0",
                    strokeWidth: "1",
                    strokeDasharray: c === 0 ? "0" : "4,3",
                  }),
                  (0, e.jsx)("text", {
                    x: m - 6,
                    y: n.y + 4,
                    textAnchor: "end",
                    fontSize: "9",
                    fill: "#94a3b8",
                    children: n.label,
                  }),
                ],
              },
              c,
            ),
          ),
          a.map((n, c) => {
            const k = m + l * c + l / 2,
              s = k - j / 2 - b,
              i = k + j / 2,
              g = Math.max((n.recettes / C) * h, 2),
              I = Math.max((n.depenses / C) * h, 2);
            return (0, e.jsxs)(
              "g",
              {
                children: [
                  (0, e.jsx)("rect", {
                    x: s,
                    y: y(n.recettes),
                    width: b,
                    height: g,
                    rx: "3",
                    fill: "#14b8a6",
                    opacity: "0.85",
                  }),
                  (0, e.jsx)("rect", {
                    x: i,
                    y: y(n.depenses),
                    width: b,
                    height: I,
                    rx: "3",
                    fill: "#f87171",
                    opacity: "0.75",
                  }),
                  (0, e.jsx)("text", {
                    x: k,
                    y: d - F + 14,
                    textAnchor: "middle",
                    fontSize: "9",
                    fill: "#94a3b8",
                    children: n.month,
                  }),
                ],
              },
              c,
            );
          }),
          (0, e.jsx)("polygon", { points: w, fill: "url(#areaGrad)" }),
          (0, e.jsx)("polyline", {
            points: x,
            fill: "none",
            stroke: "#14b8a6",
            strokeWidth: "2.5",
            strokeLinejoin: "round",
            strokeLinecap: "round",
          }),
          a.map((n, c) =>
            (0, e.jsx)(
              "circle",
              {
                cx: m + l * c + l / 2,
                cy: y(n.recettes),
                r: "3.5",
                fill: "white",
                stroke: "#14b8a6",
                strokeWidth: "2",
              },
              c,
            ),
          ),
        ],
      }),
      (0, e.jsxs)("div", {
        className: "flex items-center gap-5 mt-3 px-2",
        children: [
          (0, e.jsxs)("div", {
            className: "flex items-center gap-1.5",
            children: [
              (0, e.jsx)("span", {
                className: "w-3 h-3 rounded-sm bg-teal-400 inline-block",
              }),
              (0, e.jsx)("span", {
                className: "text-xs text-slate-500",
                children: "Recettes",
              }),
            ],
          }),
          (0, e.jsxs)("div", {
            className: "flex items-center gap-1.5",
            children: [
              (0, e.jsx)("span", {
                className: "w-3 h-3 rounded-sm bg-red-400 inline-block",
              }),
              (0, e.jsx)("span", {
                className: "text-xs text-slate-500",
                children: "Dépenses",
              }),
            ],
          }),
        ],
      }),
    ],
  });
}
function Be(a) {
  return a >= 1e6
    ? (a / 1e6).toFixed(1) + "M"
    : a >= 1e3
      ? (a / 1e3).toFixed(0) + "k"
      : a.toFixed(0);
}
function X({ data: a, total: t, title: d }) {
  let h = -Math.PI / 2;
  const C = a.map((l) => {
    const b = (l.value / (t || 1)) * 2 * Math.PI,
      j = h;
    h += b;
    const S = h,
      y = 70 + 52 * Math.cos(j),
      x = 70 + 52 * Math.sin(j),
      w = 70 + 52 * Math.cos(S),
      n = 70 + 52 * Math.sin(S),
      c = 70 + 34 * Math.cos(S),
      k = 70 + 34 * Math.sin(S),
      s = 70 + 34 * Math.cos(j),
      i = 70 + 34 * Math.sin(j),
      g = b > Math.PI ? 1 : 0,
      I = `M ${y} ${x} A 52 52 0 ${g} 1 ${w} ${n} L ${c} ${k} A 34 34 0 ${g} 0 ${s} ${i} Z`;
    return { ...l, path: I, angle: b };
  });
  return !a.length || t === 0
    ? (0, e.jsx)("div", {
        className:
          "flex items-center justify-center h-36 text-slate-400 text-sm",
        children: "Aucune donnée",
      })
    : (0, e.jsxs)("div", {
        className: "flex flex-col items-center gap-4",
        children: [
          (0, e.jsx)("div", {
            className: "relative",
            children: (0, e.jsxs)("svg", {
              width: 140,
              height: 140,
              viewBox: "0 0 140 140",
              children: [
                C.map((l, b) =>
                  (0, e.jsx)(
                    "path",
                    {
                      d: l.path,
                      fill: l.color,
                      stroke: "white",
                      strokeWidth: "1.5",
                    },
                    b,
                  ),
                ),
                (0, e.jsx)("text", {
                  x: 70,
                  y: 66,
                  textAnchor: "middle",
                  fontSize: "11",
                  fill: "#64748b",
                  fontWeight: "500",
                  children: d,
                }),
                (0, e.jsx)("text", {
                  x: 70,
                  y: 79,
                  textAnchor: "middle",
                  fontSize: "13",
                  fill: "#1e293b",
                  fontWeight: "700",
                  children: Be(t),
                }),
              ],
            }),
          }),
          (0, e.jsx)("div", {
            className: "w-full space-y-2",
            children: a
              .slice(0, 5)
              .map((l, b) =>
                (0, e.jsxs)(
                  "div",
                  {
                    className: "flex items-center justify-between text-xs",
                    children: [
                      (0, e.jsxs)("div", {
                        className: "flex items-center gap-2 min-w-0",
                        children: [
                          (0, e.jsx)("span", {
                            className: "w-2.5 h-2.5 rounded-full flex-shrink-0",
                            style: { backgroundColor: l.color },
                          }),
                          (0, e.jsx)("span", {
                            className: "text-slate-600 truncate",
                            children: l.label,
                          }),
                        ],
                      }),
                      (0, e.jsxs)("span", {
                        className:
                          "text-slate-800 font-semibold ml-2 flex-shrink-0",
                        children: [
                          t > 0 ? ((l.value / t) * 100).toFixed(0) : 0,
                          "%",
                        ],
                      }),
                    ],
                  },
                  b,
                ),
              ),
          }),
        ],
      });
}
var Oe = {
  danger: {
    bg: "bg-red-50",
    border: "border-red-200",
    icon: "text-red-500",
    Icon: re,
  },
  warning: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    icon: "text-amber-500",
    Icon: Se,
  },
  info: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: "text-blue-500",
    Icon: ae,
  },
  success: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    icon: "text-emerald-500",
    Icon: se,
  },
};
function Y({ alerts: a }) {
  return a.length
    ? (0, e.jsx)("div", {
        className: "space-y-2",
        children: a.map((t) => {
          const d = Oe[t.type];
          return (0, e.jsxs)(
            "div",
            {
              className: `flex items-start gap-3 p-3 rounded-xl border ${d.bg} ${d.border}`,
              children: [
                (0, e.jsx)(d.Icon, {
                  size: 16,
                  className: `${d.icon} mt-0.5 flex-shrink-0`,
                }),
                (0, e.jsxs)("div", {
                  className: "min-w-0",
                  children: [
                    (0, e.jsx)("p", {
                      className:
                        "text-sm font-medium text-slate-800 leading-snug",
                      children: t.message,
                    }),
                    t.sub &&
                      (0, e.jsx)("p", {
                        className: "text-xs text-slate-500 mt-0.5",
                        children: t.sub,
                      }),
                  ],
                }),
              ],
            },
            t.id,
          );
        }),
      })
    : (0, e.jsxs)("div", {
        className:
          "flex flex-col items-center justify-center py-8 text-slate-400 gap-2",
        children: [
          (0, e.jsx)(se, { size: 28, className: "text-emerald-400" }),
          (0, e.jsx)("p", {
            className: "text-sm font-medium",
            children: "Aucune alerte active",
          }),
        ],
      });
}
function $(a) {
  return a >= 1e6
    ? (a / 1e6).toFixed(2) + "M"
    : a >= 1e3
      ? (a / 1e3).toFixed(0) + "k"
      : a.toFixed(0);
}
function Z(a) {
  return $(a) + " FCFA";
}
function J(a, t) {
  return t === 0 ? 0 : ((a - t) / t) * 100;
}
var Q = ["#14b8a6", "#0ea5e9", "#22c55e", "#a3e635", "#f59e0b", "#e879f9"],
  ee = ["#f87171", "#fb923c", "#fbbf24", "#a78bfa", "#60a5fa", "#34d399"],
  te = [
    {
      id: "egs-frontend",
      name: "EGS Frontend",
      description: "Interface principale EGS - Enterprise Gnamba System",
      url: "http://localhost:8080",
      icon: H,
      color: "blue",
      category: "application",
      status: "online",
    },
    {
      id: "somagro-frontend",
      name: "SomAgro Frontend",
      description: "Application SomAgro - Gestion agricole",
      url: "http://localhost:8082",
      icon: H,
      color: "emerald",
      category: "application",
      status: "online",
    },
    {
      id: "somagro-supabase-studio",
      name: "SomAgro Supabase Studio",
      description: "Interface d'administration base de données SomAgro",
      url: "http://127.0.0.1:55323",
      icon: we,
      color: "slate",
      category: "database",
      status: "online",
    },
    {
      id: "somagro-supabase-api",
      name: "SomAgro Supabase API",
      description: "API REST Supabase pour SomAgro",
      url: "http://127.0.0.1:55321",
      icon: _e,
      color: "purple",
      category: "api",
      status: "online",
    },
  ];
function Xe() {
  const { profile: a } = Ee(),
    [t, d] = (0, f.useState)(null),
    [m, v] = (0, f.useState)(!0),
    [_, F] = (0, f.useState)(new Date()),
    [z, h] = (0, f.useState)(null),
    [C, l] = (0, f.useState)(!1),
    [b, j] = (0, f.useState)(null),
    [S, y] = (0, f.useState)(te),
    x =
      a?.role === "admin" ||
      a?.role === "gestionnaire" ||
      a?.access_level === "admin" ||
      a?.access_level === "gerant",
    w = (0, f.useCallback)(async () => {
      y(
        await Promise.all(
          te.map(async (s) => {
            try {
              if (s.url.startsWith("http")) {
                const i = new AbortController(),
                  g = setTimeout(() => i.abort(), 3e3);
                return (
                  await fetch(s.url, {
                    method: "HEAD",
                    signal: i.signal,
                    mode: "no-cors",
                  }),
                  clearTimeout(g),
                  { ...s, status: "online" }
                );
              } else return { ...s, status: "online" };
            } catch {
              return { ...s, status: "offline" };
            }
          }),
        ),
      );
    }, []),
    n = (0, f.useCallback)(async () => {
      v(!0);
      try {
        const s = new Date(),
          i = s.getFullYear(),
          g = s.getMonth(),
          I = new Date(i, g, 1).toISOString().split("T")[0],
          ne = new Date(i, g - 1, 1).toISOString().split("T")[0],
          ie = new Date(i, g, 0).toISOString().split("T")[0],
          le = new Date(i, g - 5, 1).toISOString().split("T")[0];
        if (!x) {
          const [r, o, W, q, R] = await Promise.all([
              p.from("clients").select("id", { count: "exact", head: !0 }),
              p
                .from("projects")
                .select("id", { count: "exact", head: !0 })
                .eq("statut", "en_cours"),
              p.from("properties").select("id", { count: "exact", head: !0 }),
              p
                .from("rent_payments")
                .select("montant")
                .in("statut", ["en_attente", "retard", "partiel"]),
              p
                .from("tasks")
                .select("id", { count: "exact", head: !0 })
                .eq("priorite", "urgente")
                .neq("statut", "termine"),
            ]),
            u = (q.data || []).reduce((je, ye) => je + Number(ye.montant), 0),
            N = [];
          (u > 0 &&
            N.push({
              id: "1",
              type: "warning",
              message: `${u.toLocaleString("fr-FR")} FCFA de loyers en attente`,
              sub: "Relancer les locataires concernés",
            }),
            (R.count ?? 0) > 0 &&
              N.push({
                id: "2",
                type: "danger",
                message: `${R.count} tâche(s) urgente(s) non terminée(s)`,
                sub: "Vérifier le tableau des tâches",
              }),
            N.length === 0 &&
              N.push({
                id: "4",
                type: "success",
                message: "Tout est en ordre",
                sub: "Aucune alerte active",
              }),
            d({
              currentRecettes: 0,
              prevRecettes: 0,
              currentDepenses: 0,
              prevDepenses: 0,
              beneficeNet: 0,
              totalClients: r.count ?? 0,
              projetsActifs: o.count ?? 0,
              biensImmobiliers: W.count ?? 0,
              loyersEnAttente: u,
              tachesUrgentes: R.count ?? 0,
              monthly: [],
              recettesByCategory: [],
              depensesByCategory: [],
              recentTransactions: [],
              alerts: N,
            }),
            F(new Date()),
            v(!1));
          return;
        }
        const [oe, ce, de, me, xe, ue, E, pe] = await Promise.all([
            p
              .from("finances")
              .select("type_transaction,categorie,montant,date_transaction")
              .gte("date_transaction", le),
            p
              .from("finances")
              .select("type_transaction,montant")
              .gte("date_transaction", ne)
              .lte("date_transaction", ie),
            p.from("clients").select("id", { count: "exact", head: !0 }),
            p
              .from("projects")
              .select("id", { count: "exact", head: !0 })
              .eq("statut", "en_cours"),
            p.from("properties").select("id", { count: "exact", head: !0 }),
            p
              .from("rent_payments")
              .select("montant")
              .in("statut", ["en_attente", "retard", "partiel"]),
            p
              .from("tasks")
              .select("id", { count: "exact", head: !0 })
              .eq("priorite", "urgente")
              .neq("statut", "termine"),
            p
              .from("finances")
              .select(
                "id,type_transaction,description,categorie,montant,date_transaction",
              )
              .order("date_transaction", { ascending: !1 })
              .limit(8),
          ]),
          M = oe.data || [],
          G = M.filter((r) => r.date_transaction >= I),
          T = G.filter((r) => r.type_transaction === "recette").reduce(
            (r, o) => r + Number(o.montant),
            0,
          ),
          L = G.filter((r) => r.type_transaction === "depense").reduce(
            (r, o) => r + Number(o.montant),
            0,
          ),
          V = ce.data || [],
          he = V.filter((r) => r.type_transaction === "recette").reduce(
            (r, o) => r + Number(o.montant),
            0,
          ),
          be = V.filter((r) => r.type_transaction === "depense").reduce(
            (r, o) => r + Number(o.montant),
            0,
          ),
          U = [];
        for (let r = 5; r >= 0; r--) {
          const o = new Date(i, g - r, 1),
            W = o.toLocaleDateString("fr-FR", { month: "short" }),
            q = o.toISOString().slice(0, 7),
            R = M.filter((u) => u.date_transaction.startsWith(q));
          U.push({
            month: W,
            recettes: R.filter((u) => u.type_transaction === "recette").reduce(
              (u, N) => u + Number(N.montant),
              0,
            ),
            depenses: R.filter((u) => u.type_transaction === "depense").reduce(
              (u, N) => u + Number(N.montant),
              0,
            ),
          });
        }
        const P = {},
          B = {};
        M.forEach((r) => {
          r.type_transaction === "recette"
            ? (P[r.categorie] = (P[r.categorie] || 0) + Number(r.montant))
            : (B[r.categorie] = (B[r.categorie] || 0) + Number(r.montant));
        });
        const ge = Object.entries(P)
            .sort((r, o) => o[1] - r[1])
            .map((r, o) => ({
              label: r[0],
              value: r[1],
              color: Q[o % Q.length],
            })),
          fe = Object.entries(B)
            .sort((r, o) => o[1] - r[1])
            .map((r, o) => ({
              label: r[0],
              value: r[1],
              color: ee[o % ee.length],
            })),
          O = (ue.data || []).reduce((r, o) => r + Number(o.montant), 0),
          D = [];
        (O > 0 &&
          D.push({
            id: "1",
            type: "warning",
            message: `${Z(O)} de loyers en attente`,
            sub: "Relancer les locataires concernés",
          }),
          (E.count ?? 0) > 0 &&
            D.push({
              id: "2",
              type: "danger",
              message: `${E.count} tâche(s) urgente(s) non terminée(s)`,
              sub: "Vérifier le tableau des tâches",
            }),
          L > T &&
            T > 0 &&
            D.push({
              id: "3",
              type: "info",
              message: "Dépenses supérieures aux recettes ce mois",
              sub: `Déficit de ${Z(L - T)}`,
            }),
          D.length === 0 &&
            D.push({
              id: "4",
              type: "success",
              message: "Tout est en ordre",
              sub: "Aucune alerte financière active",
            }),
          d({
            currentRecettes: T,
            prevRecettes: he,
            currentDepenses: L,
            prevDepenses: be,
            beneficeNet: T - L,
            totalClients: de.count ?? 0,
            projetsActifs: me.count ?? 0,
            biensImmobiliers: xe.count ?? 0,
            loyersEnAttente: O,
            tachesUrgentes: E.count ?? 0,
            monthly: U,
            recettesByCategory: ge,
            depensesByCategory: fe,
            recentTransactions: pe.data || [],
            alerts: D,
          }),
          F(new Date()));
      } finally {
        v(!1);
      }
      w();
    }, [x, w]);
  (0, f.useEffect)(() => {
    (n().catch(() => v(!1)), w());
  }, [n, w]);
  const c = (0, f.useCallback)(async () => {
      if (!(!t || !x)) {
        (l(!0), j(null));
        try {
          const s = K.createFinancialSummaryPrompt({
            revenues: t.monthly.map((i) => ({
              month: i.month,
              amount: i.recettes,
            })),
            expenses: t.monthly.map((i) => ({
              month: i.month,
              amount: i.depenses,
            })),
            projects: [
              {
                name: "Clients",
                status: `${t.totalClients} total`,
                budget: t.totalClients,
              },
              { name: "Projets", status: `${t.projetsActifs} actifs` },
              {
                name: "Biens immobiliers",
                status: `${t.biensImmobiliers} biens`,
              },
            ],
          });
          h(
            await K.chat([{ role: "user", content: s }], void 0, {
              temperature: 0.7,
              maxTokens: 800,
            }),
          );
        } catch (s) {
          j(
            s instanceof Error
              ? s.message
              : "Erreur lors de la génération du résumé",
          );
        } finally {
          l(!1);
        }
      }
    }, [t, x]),
    k = new Date().toLocaleDateString("fr-FR", {
      month: "long",
      year: "numeric",
    });
  return (0, e.jsxs)("div", {
    className:
      "p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6 max-w-[1600px] mx-auto",
    children: [
      (0, e.jsxs)("div", {
        className: "flex items-center justify-between flex-wrap gap-3",
        children: [
          (0, e.jsxs)("div", {
            className: "min-w-0 flex-1",
            children: [
              (0, e.jsx)("h1", {
                className:
                  "text-xl sm:text-2xl font-bold text-slate-800 truncate",
                children: "Intelligence Financière",
              }),
              (0, e.jsxs)("p", {
                className:
                  "text-xs sm:text-sm text-slate-500 mt-0.5 capitalize hidden sm:block",
                children: ["Tableau de bord analytique — ", k],
              }),
            ],
          }),
          (0, e.jsxs)("button", {
            onClick: n,
            className:
              "flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs sm:text-sm font-medium transition-colors min-h-[44px]",
            children: [
              (0, e.jsx)(Ae, { size: 16, className: m ? "animate-spin" : "" }),
              (0, e.jsx)("span", {
                className: "hidden sm:inline",
                children: "Actualiser",
              }),
            ],
          }),
        ],
      }),
      !x &&
        (0, e.jsxs)("div", {
          className:
            "bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3",
          children: [
            (0, e.jsx)(Ie, {
              className: "text-amber-600 flex-shrink-0 mt-0.5",
              size: 20,
            }),
            (0, e.jsxs)("div", {
              children: [
                (0, e.jsx)("p", {
                  className: "text-sm font-medium text-amber-800",
                  children: "Accès restreint aux informations financières",
                }),
                (0, e.jsx)("p", {
                  className: "text-xs text-amber-600 mt-1",
                  children:
                    "Seuls les administrateurs, gérants et gestionnaires peuvent consulter les données financières détaillées.",
                }),
              ],
            }),
          ],
        }),
      m && !t
        ? (0, e.jsx)("div", {
            className: "grid grid-cols-2 lg:grid-cols-4 gap-4",
            children: Array.from({ length: 8 }).map((s, i) =>
              (0, e.jsx)(
                "div",
                { className: "h-32 rounded-2xl bg-slate-100 animate-pulse" },
                i,
              ),
            ),
          })
        : t
          ? (0, e.jsxs)(e.Fragment, {
              children: [
                x &&
                  (0, e.jsxs)("div", {
                    className: "grid grid-cols-2 md:grid-cols-4 gap-4",
                    children: [
                      (0, e.jsx)(A, {
                        label: "Recettes du mois",
                        value: $(t.currentRecettes) + " FCFA",
                        icon: Te,
                        color: "teal",
                        trend: J(t.currentRecettes, t.prevRecettes),
                        trendLabel: "vs mois précédent",
                      }),
                      (0, e.jsx)(A, {
                        label: "Dépenses du mois",
                        value: $(t.currentDepenses) + " FCFA",
                        icon: ae,
                        color: "red",
                        trend: -J(t.currentDepenses, t.prevDepenses),
                        trendLabel: "vs mois précédent",
                      }),
                      (0, e.jsx)(A, {
                        label: "Bénéfice Net",
                        value: $(t.beneficeNet) + " FCFA",
                        icon: ve,
                        color: t.beneficeNet >= 0 ? "emerald" : "red",
                        subValue:
                          t.currentRecettes > 0
                            ? `Marge : ${((t.beneficeNet / t.currentRecettes) * 100).toFixed(1)}%`
                            : void 0,
                      }),
                      (0, e.jsx)(A, {
                        label: "Loyers en attente",
                        value: $(t.loyersEnAttente) + " FCFA",
                        icon: Ce,
                        color: t.loyersEnAttente > 0 ? "amber" : "slate",
                        subValue:
                          t.loyersEnAttente > 0
                            ? "À encaisser"
                            : "Tout encaissé",
                      }),
                    ],
                  }),
                (0, e.jsxs)("div", {
                  className: "grid grid-cols-2 md:grid-cols-4 gap-4",
                  children: [
                    (0, e.jsx)(A, {
                      label: "Clients",
                      value: String(t.totalClients),
                      icon: $e,
                      color: "blue",
                    }),
                    (0, e.jsx)(A, {
                      label: "Projets actifs",
                      value: String(t.projetsActifs),
                      icon: Re,
                      color: "slate",
                    }),
                    (0, e.jsx)(A, {
                      label: "Biens immobiliers",
                      value: String(t.biensImmobiliers),
                      icon: ke,
                      color: "blue",
                    }),
                    (0, e.jsx)(A, {
                      label: "Tâches urgentes",
                      value: String(t.tachesUrgentes),
                      icon: re,
                      color: t.tachesUrgentes > 0 ? "amber" : "slate",
                    }),
                  ],
                }),
                x && !1,
                x &&
                  (0, e.jsxs)(e.Fragment, {
                    children: [
                      (0, e.jsxs)("div", {
                        className: "grid grid-cols-1 xl:grid-cols-3 gap-6",
                        children: [
                          (0, e.jsxs)("div", {
                            className:
                              "xl:col-span-2 bg-white rounded-2xl border border-slate-200 p-6",
                            children: [
                              (0, e.jsx)("h2", {
                                className: "font-semibold text-slate-800 mb-1",
                                children: "Évolution Financière",
                              }),
                              (0, e.jsx)("p", {
                                className: "text-xs text-slate-400 mb-5",
                                children: "Recettes & dépenses sur 6 mois",
                              }),
                              (0, e.jsx)(Pe, { data: t.monthly }),
                            ],
                          }),
                          (0, e.jsxs)("div", {
                            className:
                              "bg-white rounded-2xl border border-slate-200 p-6",
                            children: [
                              (0, e.jsx)("h2", {
                                className: "font-semibold text-slate-800 mb-1",
                                children: "Alertes & Indicateurs",
                              }),
                              (0, e.jsx)("p", {
                                className: "text-xs text-slate-400 mb-5",
                                children: "Points d'attention critiques",
                              }),
                              (0, e.jsx)(Y, { alerts: t.alerts }),
                              (0, e.jsxs)("div", {
                                className:
                                  "mt-6 pt-5 border-t border-slate-100",
                                children: [
                                  (0, e.jsx)("h3", {
                                    className:
                                      "text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3",
                                    children: "Santé Financière",
                                  }),
                                  [
                                    {
                                      label: "Taux de marge",
                                      value:
                                        t.currentRecettes > 0
                                          ? (
                                              (t.beneficeNet /
                                                t.currentRecettes) *
                                              100
                                            ).toFixed(1) + "%"
                                          : "—",
                                      ok: t.beneficeNet >= 0,
                                    },
                                    {
                                      label: "Ratio dép./rec.",
                                      value:
                                        t.currentRecettes > 0
                                          ? (
                                              (t.currentDepenses /
                                                t.currentRecettes) *
                                              100
                                            ).toFixed(1) + "%"
                                          : "—",
                                      ok:
                                        t.currentDepenses <= t.currentRecettes,
                                    },
                                    {
                                      label: "Loyers recouvrés",
                                      value:
                                        t.loyersEnAttente === 0
                                          ? "100%"
                                          : `${$(t.loyersEnAttente)} en att.`,
                                      ok: t.loyersEnAttente === 0,
                                    },
                                  ].map((s, i) =>
                                    (0, e.jsxs)(
                                      "div",
                                      {
                                        className:
                                          "flex items-center justify-between py-2 border-b border-slate-50 last:border-0",
                                        children: [
                                          (0, e.jsx)("span", {
                                            className: "text-xs text-slate-600",
                                            children: s.label,
                                          }),
                                          (0, e.jsx)("span", {
                                            className: `text-xs font-bold ${s.ok ? "text-emerald-600" : "text-red-500"}`,
                                            children: s.value,
                                          }),
                                        ],
                                      },
                                      i,
                                    ),
                                  ),
                                ],
                              }),
                            ],
                          }),
                        ],
                      }),
                      (0, e.jsxs)("div", {
                        className: "grid grid-cols-1 lg:grid-cols-3 gap-6",
                        children: [
                          (0, e.jsxs)("div", {
                            className:
                              "bg-white rounded-2xl border border-slate-200 p-6",
                            children: [
                              (0, e.jsx)("h2", {
                                className: "font-semibold text-slate-800 mb-1",
                                children: "Recettes par catégorie",
                              }),
                              (0, e.jsx)("p", {
                                className: "text-xs text-slate-400 mb-5",
                                children: "6 derniers mois",
                              }),
                              (0, e.jsx)(X, {
                                data: t.recettesByCategory,
                                total: t.recettesByCategory.reduce(
                                  (s, i) => s + i.value,
                                  0,
                                ),
                                title: "Total",
                              }),
                            ],
                          }),
                          (0, e.jsxs)("div", {
                            className:
                              "bg-white rounded-2xl border border-slate-200 p-6",
                            children: [
                              (0, e.jsx)("h2", {
                                className: "font-semibold text-slate-800 mb-1",
                                children: "Dépenses par catégorie",
                              }),
                              (0, e.jsx)("p", {
                                className: "text-xs text-slate-400 mb-5",
                                children: "6 derniers mois",
                              }),
                              (0, e.jsx)(X, {
                                data: t.depensesByCategory,
                                total: t.depensesByCategory.reduce(
                                  (s, i) => s + i.value,
                                  0,
                                ),
                                title: "Total",
                              }),
                            ],
                          }),
                          (0, e.jsxs)("div", {
                            className:
                              "bg-white rounded-2xl border border-slate-200 p-6 flex flex-col",
                            children: [
                              (0, e.jsx)("h2", {
                                className: "font-semibold text-slate-800 mb-1",
                                children: "Transactions récentes",
                              }),
                              (0, e.jsx)("p", {
                                className: "text-xs text-slate-400 mb-4",
                                children: "8 dernières opérations",
                              }),
                              (0, e.jsxs)("div", {
                                className: "flex-1 space-y-2 overflow-auto",
                                children: [
                                  t.recentTransactions.length === 0 &&
                                    (0, e.jsx)("p", {
                                      className:
                                        "text-sm text-slate-400 text-center py-8",
                                      children: "Aucune transaction",
                                    }),
                                  t.recentTransactions.map((s) =>
                                    (0, e.jsxs)(
                                      "div",
                                      {
                                        className:
                                          "flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors",
                                        children: [
                                          (0, e.jsx)("div", {
                                            className: `w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${s.type_transaction === "recette" ? "bg-teal-100" : "bg-red-100"}`,
                                            children:
                                              s.type_transaction === "recette"
                                                ? (0, e.jsx)(De, {
                                                    size: 15,
                                                    className: "text-teal-600",
                                                  })
                                                : (0, e.jsx)(Fe, {
                                                    size: 15,
                                                    className: "text-red-500",
                                                  }),
                                          }),
                                          (0, e.jsxs)("div", {
                                            className: "flex-1 min-w-0",
                                            children: [
                                              (0, e.jsx)("p", {
                                                className:
                                                  "text-xs font-medium text-slate-700 truncate",
                                                children:
                                                  s.description || s.categorie,
                                              }),
                                              (0, e.jsx)("p", {
                                                className:
                                                  "text-xs text-slate-400",
                                                children: new Date(
                                                  s.date_transaction,
                                                ).toLocaleDateString("fr-FR"),
                                              }),
                                            ],
                                          }),
                                          (0, e.jsxs)("span", {
                                            className: `text-xs font-bold flex-shrink-0 ${s.type_transaction === "recette" ? "text-teal-600" : "text-red-500"}`,
                                            children: [
                                              s.type_transaction === "recette"
                                                ? "+"
                                                : "-",
                                              $(s.montant),
                                            ],
                                          }),
                                        ],
                                      },
                                      s.id,
                                    ),
                                  ),
                                ],
                              }),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                !x &&
                  (0, e.jsxs)("div", {
                    className:
                      "bg-white rounded-2xl border border-slate-200 p-6",
                    children: [
                      (0, e.jsx)("h2", {
                        className: "font-semibold text-slate-800 mb-1",
                        children: "Alertes",
                      }),
                      (0, e.jsx)("p", {
                        className: "text-xs text-slate-400 mb-5",
                        children: "Points d'attention",
                      }),
                      (0, e.jsx)(Y, { alerts: t.alerts }),
                    ],
                  }),
                (0, e.jsxs)("div", {
                  className: "bg-white rounded-2xl border border-slate-200 p-6",
                  children: [
                    (0, e.jsx)("h2", {
                      className: "font-semibold text-slate-800 mb-1",
                      children: "Services & Infrastructure",
                    }),
                    (0, e.jsx)("p", {
                      className: "text-xs text-slate-400 mb-5",
                      children:
                        "Accès rapide aux applications et services actifs",
                    }),
                    (0, e.jsx)("div", {
                      className:
                        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4",
                      children: S.map((s) => {
                        const i = s.icon;
                        return (0, e.jsx)(
                          "a",
                          {
                            href: s.url,
                            target: "_blank",
                            rel: "noopener noreferrer",
                            className: `group block p-4 rounded-xl border transition-all duration-200 ${{ blue: "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100", emerald: "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100", slate: "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100", purple: "bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100" }[s.color]}`,
                            children: (0, e.jsxs)("div", {
                              className: "flex items-start gap-3",
                              children: [
                                (0, e.jsx)("div", {
                                  className: `p-2 rounded-lg ${s.status === "online" ? "bg-white/50" : "bg-gray-100"}`,
                                  children: (0, e.jsx)(i, { size: 20 }),
                                }),
                                (0, e.jsxs)("div", {
                                  className: "flex-1 min-w-0",
                                  children: [
                                    (0, e.jsxs)("div", {
                                      className: "flex items-center gap-2",
                                      children: [
                                        (0, e.jsx)("h3", {
                                          className:
                                            "font-medium text-sm truncate",
                                          children: s.name,
                                        }),
                                        (0, e.jsx)(Ne, {
                                          size: 12,
                                          className:
                                            "opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0",
                                        }),
                                      ],
                                    }),
                                    (0, e.jsx)("p", {
                                      className:
                                        "text-xs opacity-75 mt-1 leading-relaxed",
                                      children: s.description,
                                    }),
                                    (0, e.jsxs)("div", {
                                      className: "flex items-center gap-1 mt-2",
                                      children: [
                                        (0, e.jsx)("div", {
                                          className: `w-2 h-2 rounded-full ${s.status === "online" ? "bg-green-500" : "bg-gray-400"}`,
                                        }),
                                        (0, e.jsx)("span", {
                                          className:
                                            "text-xs font-medium capitalize",
                                          children: s.status,
                                        }),
                                      ],
                                    }),
                                  ],
                                }),
                              ],
                            }),
                          },
                          s.id,
                        );
                      }),
                    }),
                  ],
                }),
                (0, e.jsxs)("p", {
                  className: "text-xs text-slate-400 text-right",
                  children: [
                    "Dernière actualisation : ",
                    _.toLocaleTimeString("fr-FR"),
                  ],
                }),
              ],
            })
          : null,
    ],
  });
}
export { Xe as default };
