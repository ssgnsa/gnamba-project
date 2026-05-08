const __vite__mapDeps = (
  i,
  m = __vite__mapDeps,
  d = m.f ||
    (m.f = [
      "assets/browser-BWJXYg3H.js",
      "assets/rolldown-runtime-2JzG8er9.js",
    ]),
) => i.map((i) => d[i]);
import { n as ws } from "./rolldown-runtime-2JzG8er9.js";
import {
  $t as Ht,
  B as Ss,
  Bt as zs,
  Ct as zn,
  F as ks,
  G as kn,
  H as An,
  It as aa,
  K as As,
  Kt as $s,
  Pt as Cs,
  R as Es,
  Wt as Os,
  _n as Is,
  a as Ps,
  at as Ar,
  bn as sa,
  l as Ls,
  o as Zs,
  p as ia,
  q as Ts,
  r as Rs,
  xn as Ds,
  xt as qs,
} from "./icons-vendor-BfPGE0aO.js";
import { n as Fs } from "./react-vendor-Dj4gTxeL.js";
import { t as z } from "./supabase-Cm30VQRU.js";
import { n as Us } from "./SettingsContext-CMQ2j17o.js";
import { c as Vs, l as Ms, t as Js } from "./index-J6Ma0lNi.js";
import { t as rt } from "./Modal-DHHPHHB4.js";
import { t as Zr } from "./Badge-DgCJ0f3s.js";
import { t as Gs } from "./MediaPicker-D7QT2z_y.js";
import {
  d as mt,
  g as Bs,
  h as ve,
  l as Le,
  m as Ks,
  n as $n,
  p as Je,
  r as Hs,
  s as q,
  t as Ws,
  u as Cn,
} from "./print-BThDe4k7.js";
import { r as Qs, s as Xs } from "./mediaUtils-xKruIzqQ.js";
import { t as oa } from "./purify.es-CU1YVi5P.js";
var _ = Ds(),
  n = Fs(),
  Ys = 500 * 1024,
  En = ["image/png", "image/jpeg", "image/svg+xml"];
function ei({
  villageName: e,
  currentLogoUrl: t,
  onLogoUploaded: r,
  onError: a,
  disabled: s = !1,
}) {
  const [l, o] = (0, _.useState)(!1),
    [u, d] = (0, _.useState)(!1),
    [v, x] = (0, _.useState)({ isValid: !1 }),
    [A, N] = (0, _.useState)(t),
    j = (0, _.useRef)(null),
    F = (0, _.useCallback)(
      (k) =>
        new Promise((R) => {
          if (!En.includes(k.type)) {
            R({
              isValid: !1,
              error: "Format non supporté. Utilisez PNG, JPG ou SVG.",
            });
            return;
          }
          if (k.size > Ys) {
            R({
              isValid: !1,
              error: `Fichier trop volumineux (${(k.size / 1024).toFixed(0)}KB). Maximum 500KB.`,
            });
            return;
          }
          const U = new Image();
          ((U.onload = () => {
            const le = U.width / U.height;
            if (!(le >= 0.9 && le <= 1.1)) {
              R({
                isValid: !1,
                error: `Ratio invalide (${U.width}x${U.height}). Utilisez une image carrée (1:1).`,
                fileName: k.name,
                fileSize: k.size,
                dimensions: { width: U.width, height: U.height },
              });
              return;
            }
            R({
              isValid: !0,
              fileName: k.name,
              fileSize: k.size,
              dimensions: { width: U.width, height: U.height },
            });
          }),
            (U.onerror = () => {
              R({ isValid: !1, error: "Image corrompue ou illisible." });
            }),
            (U.src = URL.createObjectURL(k)));
        }),
      [],
    ),
    pe = (0, _.useCallback)(
      async (k) => {
        const R = k.name.split(".").pop(),
          U = `${e
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "-")
            .replace(/-+/g, "-")
            .trim()}-logo.${Date.now()}.${R}`,
          { error: le } = await z.storage
            .from("village-logos")
            .upload(U, k, { cacheControl: "3600", upsert: !0 });
        if (le) {
          if (le.message.includes("bucket")) return await re(k);
          throw le;
        }
        const { data: He } = z.storage.from("village-logos").getPublicUrl(U);
        return He.publicUrl;
      },
      [e],
    ),
    re = (k) =>
      new Promise((R, U) => {
        const le = new FileReader();
        ((le.onload = () => R(le.result)),
          (le.onerror = U),
          le.readAsDataURL(k));
      }),
    me = (0, _.useCallback)(
      async (k) => {
        if (!s) {
          (d(!0), x({ isValid: !1 }));
          try {
            const R = await F(k);
            if ((x(R), !R.isValid)) {
              (a?.(R.error || "Validation échouée"), d(!1));
              return;
            }
            const U = await pe(k);
            (N(U),
              r(U),
              setTimeout(() => {
                x({ isValid: !1 });
              }, 3e3));
          } catch (R) {
            const U = R.message || "Échec de l'upload. Réessayez.";
            (x({ isValid: !1, error: U }), a?.(U));
          } finally {
            d(!1);
          }
        }
      },
      [s, F, pe, r, a],
    ),
    g = (0, _.useCallback)(
      (k) => {
        (k.preventDefault(), o(!1));
        const R = k.dataTransfer.files[0];
        R && R.type.startsWith("image/") && me(R);
      },
      [me],
    ),
    C = (0, _.useCallback)(
      (k) => {
        const R = k.target.files?.[0];
        R && me(R);
      },
      [me],
    ),
    ne = (0, _.useCallback)(() => {
      (N(void 0),
        x({ isValid: !1 }),
        r(""),
        j.current && (j.current.value = ""));
    }, [r]),
    H = () =>
      (0, n.jsx)("div", {
        className:
          "w-32 h-32 rounded-full bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center border-4 border-amber-500/30",
        children: (0, n.jsx)("span", {
          className: "text-3xl font-bold text-white tracking-wider",
          children: e
            .split(" ")
            .map((k) => k[0])
            .slice(0, 2)
            .join("")
            .toUpperCase(),
        }),
      });
  return (0, n.jsxs)("div", {
    className: "space-y-4",
    children: [
      (0, n.jsxs)("div", {
        className: "flex items-center gap-6",
        children: [
          (0, n.jsx)("div", {
            className: "relative group",
            children: A
              ? (0, n.jsxs)("div", {
                  className: "relative",
                  children: [
                    (0, n.jsx)("img", {
                      src: A,
                      alt: `Logo de ${e}`,
                      className:
                        "w-32 h-32 object-contain rounded-full border-4 border-amber-500/30 bg-white p-2",
                    }),
                    !s &&
                      (0, n.jsx)("button", {
                        onClick: ne,
                        className:
                          "absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600",
                        title: "Supprimer le logo",
                        children: (0, n.jsx)(Rs, { size: 14 }),
                      }),
                  ],
                })
              : H(),
          }),
          (0, n.jsxs)("div", {
            onDragOver: (k) => {
              (k.preventDefault(), s || o(!0));
            },
            onDragLeave: () => o(!1),
            onDrop: g,
            className: `flex-1 border-2 border-dashed rounded-xl p-6 text-center transition-all ${l ? "border-blue-500 bg-blue-50" : s ? "border-gray-200 bg-gray-50" : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"}`,
            children: [
              (0, n.jsx)("input", {
                ref: j,
                type: "file",
                accept: En.join(","),
                onChange: C,
                disabled: s || u,
                className: "hidden",
              }),
              u
                ? (0, n.jsxs)("div", {
                    className: "flex flex-col items-center gap-2",
                    children: [
                      (0, n.jsx)("div", {
                        className:
                          "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600",
                      }),
                      (0, n.jsx)("p", {
                        className: "text-sm text-gray-600",
                        children: "Upload en cours...",
                      }),
                    ],
                  })
                : (0, n.jsxs)(n.Fragment, {
                    children: [
                      (0, n.jsx)(ia, {
                        size: 32,
                        className: `mx-auto mb-2 ${l ? "text-blue-500" : "text-gray-400"}`,
                      }),
                      (0, n.jsx)("p", {
                        className: "text-sm font-medium text-gray-700",
                        children: "Glissez-déposez ou cliquez pour uploader",
                      }),
                      (0, n.jsx)("p", {
                        className: "text-xs text-gray-500 mt-1",
                        children:
                          "PNG, JPG ou SVG • Max 500KB • Format carré recommandé",
                      }),
                      (0, n.jsx)("button", {
                        onClick: () => j.current?.click(),
                        disabled: s,
                        className:
                          "mt-3 px-4 py-2 text-sm text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50",
                        children: "Sélectionner un fichier",
                      }),
                    ],
                  }),
            ],
          }),
        ],
      }),
      v.isValid &&
        v.fileName &&
        (0, n.jsxs)("div", {
          className:
            "flex items-center gap-2 text-green-600 text-sm bg-green-50 border border-green-200 rounded-lg px-3 py-2",
          children: [
            (0, n.jsx)(Ht, { size: 16 }),
            (0, n.jsxs)("span", {
              children: [
                v.fileName,
                " (",
                (v.fileSize / 1024).toFixed(0),
                "KB) -",
                " ",
                v.dimensions?.width,
                "x",
                v.dimensions?.height,
                "px",
              ],
            }),
          ],
        }),
      v.error &&
        (0, n.jsxs)("div", {
          className:
            "flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2",
          children: [
            (0, n.jsx)(sa, { size: 16 }),
            (0, n.jsx)("span", { children: v.error }),
          ],
        }),
      (0, n.jsxs)("div", {
        className: "bg-blue-50 border border-blue-200 rounded-lg px-3 py-2",
        children: [
          (0, n.jsx)("p", {
            className: "text-xs font-medium text-blue-800 mb-1",
            children: "💡 Recommandations :",
          }),
          (0, n.jsxs)("ul", {
            className:
              "text-xs text-blue-700 space-y-0.5 list-disc list-inside",
            children: [
              (0, n.jsx)("li", {
                children:
                  "Utilisez un logo au format SVG pour une qualité optimale",
              }),
              (0, n.jsx)("li", {
                children: "Privilégiez un fond transparent (PNG)",
              }),
              (0, n.jsx)("li", {
                children: "Format carré 1:1 (ex: 300x300px, 500x500px)",
              }),
              (0, n.jsx)("li", {
                children:
                  "Évitez les détails trop fins (lisibilité après impression)",
              }),
            ],
          }),
        ],
      }),
    ],
  });
}
function ti({
  logoUrl: e,
  villageName: t,
  size: r = "md",
  primaryColor: a = "#1e3a5f",
  className: s = "",
}) {
  const l = { sm: "w-12 h-12", md: "w-24 h-24", lg: "w-32 h-32" },
    o = { sm: 48, md: 96, lg: 128 };
  if (e)
    return (0, n.jsx)("img", {
      src: e,
      alt: `Logo ${t}`,
      className: `${l[r]} object-contain rounded-full border-2 border-amber-500/30 bg-white p-1 ${s}`,
      style: { aspectRatio: "1/1" },
    });
  const u = t
    .split(" ")
    .map((d) => d[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (0, n.jsx)("div", {
    className: `${l[r]} rounded-full flex items-center justify-center border-2 border-amber-500/30 ${s}`,
    style: {
      background: `linear-gradient(135deg, ${a}, ${a}dd)`,
      aspectRatio: "1/1",
    },
    children: (0, n.jsx)("span", {
      className: "text-white font-bold tracking-wider",
      style: { fontSize: o[r] * 0.35 },
      children: u,
    }),
  });
}
var nt = (e) => (!e || typeof e != "object" || Array.isArray(e) ? null : e),
  la = (e) =>
    e
      ? `${e.code || ""} ${e.message || ""} ${e.details || ""} ${e.hint || ""}`.toLowerCase()
      : "",
  ri = (e) => {
    if (!e) return !1;
    if (e.code === "PGRST202") return !0;
    const t = la(e);
    return (
      t.includes("could not find the function public.log_foncier_audit") ||
      t.includes("no matches were found in the schema cache") ||
      t.includes("p_lot_id") ||
      t.includes("p_new_values") ||
      t.includes("lot_id")
    );
  },
  ni = (e) => {
    if (!e) return !1;
    if (e.code === "PGRST202") return !0;
    const t = la(e);
    return (
      t.includes("could not find the function public.log_foncier_audit") ||
      t.includes("no matches were found in the schema cache") ||
      t.includes("p_parcelle_id") ||
      t.includes("p_details") ||
      t.includes("parcelle_id")
    );
  },
  ca = (e) => ({
    p_lot_id: e.lotId,
    p_action: e.action,
    p_old_values: e.oldValues || null,
    p_new_values: e.details || null,
  }),
  ua = (e) => ({
    p_parcelle_id: e.lotId,
    p_action: e.action,
    p_details: e.details || null,
  }),
  ai = (e) => {
    const t = nt(e);
    if (!t) return null;
    const r = t.p_lot_id ?? t.p_parcelle_id ?? t.lot_id ?? t.parcelle_id,
      a = t.p_action ?? t.action,
      s = String(r || "").trim(),
      l = String(a || "").trim();
    if (!s || !l) return null;
    const o = nt(t.p_new_values) || nt(t.p_details) || nt(t.details),
      u = nt(t.p_old_values) || nt(t.old_values);
    return { lotId: s, action: l, details: o || null, oldValues: u || null };
  };
async function Ce(e, t) {
  const r = await e.rpc("log_foncier_audit", ca(t));
  if (!r.error) return r;
  if (ri(r.error)) {
    const a = await e.rpc("log_foncier_audit", ua(t));
    if (!a.error) return a;
  }
  return r;
}
async function si(e, t) {
  const r = ai(t);
  if (!r)
    return {
      data: null,
      error: {
        code: "AUDIT_PAYLOAD_INVALID",
        message: "Payload audit foncier invalide",
      },
    };
  const a = await e.rpc("log_foncier_audit", ua(r));
  if (!a.error) return a;
  if (ni(a.error)) {
    const s = await e.rpc("log_foncier_audit", ca(r));
    if (!s.error) return s;
  }
  return a;
}
var ii = {
    brouillon: "Brouillon",
    soumis: "Soumis",
    valide: "Validé",
    archive: "Archivé",
    revoque: "Révoqué",
    expire: "Expiré",
    annule: "Annulé",
  },
  oi = {
    brouillon: "gray",
    soumis: "blue",
    valide: "green",
    archive: "gray",
    revoque: "red",
    expire: "orange",
    annule: "red",
  },
  li = (e, t) => {
    const r = typeof e?.message == "string" ? e.message : "";
    return (
      (typeof e?.code == "string" ? e.code : "") === "42703" ||
      r.includes(`column "${t}" does not exist`)
    );
  };
function ci({
  lotId: e,
  userId: t,
  userName: r,
  isAdmin: a = !1,
  isOnline: s = navigator.onLine,
  onWorkflowComplete: l,
}) {
  const [o, u] = (0, _.useState)(null),
    [d, v] = (0, _.useState)(!0),
    [x, A] = (0, _.useState)(!1),
    [N, j] = (0, _.useState)(!1),
    [F, pe] = (0, _.useState)(!1),
    [re, me] = (0, _.useState)(null),
    [g, C] = (0, _.useState)(!1),
    [ne, H] = (0, _.useState)("lecteur"),
    [k, R] = (0, _.useState)(null),
    U = (0, _.useCallback)(async () => {
      if (!t) return;
      const { data: X } = await z
        .from("user_profiles")
        .select("foncier_role")
        .eq("id", t)
        .maybeSingle();
      X?.foncier_role && H(X.foncier_role);
    }, [t]),
    le = (0, _.useCallback)(async () => {
      (v(!0), R(null));
      const X = z
        .from("foncier_attestations")
        .select(
          "id, lot_id, reference, statut, created_at, version, validation_agent_nom, validation_chef_nom, validation_chef_date, foncier_lots:lot_id(reference, numero_lot, village, proprietaire_nom, proprietaire_prenom)",
        )
        .eq("lot_id", e)
        .order("created_at", { ascending: !1 })
        .limit(1);
      let fe = await X.is("deleted_at", null).maybeSingle();
      if (
        (fe.error && li(fe.error, "deleted_at") && (fe = await X.maybeSingle()),
        fe.error)
      ) {
        (R("Impossible de charger l’attestation."), v(!1));
        return;
      }
      if (!fe.data) {
        (u(null), v(!1));
        return;
      }
      const ke = fe.data,
        wt = Array.isArray(ke.foncier_lots)
          ? (ke.foncier_lots[0] ?? null)
          : (ke.foncier_lots ?? null);
      (u({ ...ke, foncier_lots: wt }), v(!1));
    }, [e]),
    He = (0, _.useCallback)(async (X) => {
      pe(!0);
      try {
        me(await Xs("foncier_attestation", X, "attestation_scan"));
      } catch {
        me(null);
      } finally {
        pe(!1);
      }
    }, []);
  ((0, _.useEffect)(() => {
    (le(), U());
  }, [le, U]),
    (0, _.useEffect)(() => {
      if (!o?.id) {
        me(null);
        return;
      }
      He(o.id);
    }, [o?.id, He]));
  const bt = ["agent", "validateur_village", "admin"].includes(ne) || a,
    yt = ne === "validateur_village" || a,
    jt = async () => {
      if (!o) return;
      if (!s) {
        alert("Connexion requise pour soumettre.");
        return;
      }
      if (!confirm("Soumettre l’attestation au Chef du village ?")) return;
      A(!0);
      const X = new Date().toISOString(),
        { error: fe } = await z
          .from("foncier_attestations")
          .update({ statut: "soumis", updated_at: X, client_updated_at: X })
          .eq("id", o.id);
      (fe
        ? alert("Erreur : " + fe.message)
        : (await Ce(z, {
            lotId: o.lot_id,
            action: "SOUMISSION_CHEF",
            details: { attestation_id: o.id, reference: o.reference },
          }),
          await le(),
          l?.()),
        A(!1));
    },
    ue = async () => {
      if (!o) return;
      if (!s) {
        alert("Connexion requise pour valider.");
        return;
      }
      if (!confirm("Valider l’attestation (signature physique du Chef) ?"))
        return;
      j(!0);
      const X = new Date().toISOString(),
        fe = o.validation_chef_nom || r || null,
        { error: ke } = await z
          .from("foncier_attestations")
          .update({
            statut: "valide",
            validation_chef_nom: fe,
            validation_chef_id: t || null,
            validation_chef_date: X,
            updated_at: X,
            client_updated_at: X,
          })
          .eq("id", o.id);
      (ke
        ? alert("Erreur : " + ke.message)
        : (await Ce(z, {
            lotId: o.lot_id,
            action: "VALIDATION_CHEF",
            details: { attestation_id: o.id, reference: o.reference },
          }),
          await le(),
          l?.()),
        j(!1));
    },
    Nt = async (X) => {
      if (!o) return;
      pe(!0);
      const { error: fe } = await Qs(
        X.id,
        "foncier_attestation",
        o.id,
        "attestation_scan",
        "Scan original",
      );
      (fe
        ? alert(`Erreur : ${fe}`)
        : (me(X),
          await Ce(z, {
            lotId: o.lot_id,
            action: "SCAN_ORIGINAL",
            details: {
              attestation_id: o.id,
              reference: o.reference,
              media_id: X.id,
            },
          })),
        C(!1),
        pe(!1));
    };
  if (d)
    return (0, n.jsx)("div", {
      className: "flex items-center justify-center p-8",
      children: (0, n.jsx)("div", {
        className:
          "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600",
      }),
    });
  if (!o)
    return (0, n.jsx)("div", {
      className:
        "p-6 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600",
      children:
        "Aucune attestation trouvée pour ce lot. Créez d’abord une attestation dans le module foncier.",
    });
  const Ue = (o.statut || "brouillon").toLowerCase();
  return (0, n.jsxs)("div", {
    className: "space-y-6",
    children: [
      k &&
        (0, n.jsx)("div", {
          role: "alert",
          className:
            "p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700",
          children: k,
        }),
      (0, n.jsxs)("div", {
        className: "bg-white rounded-xl shadow-sm border border-gray-200 p-6",
        children: [
          (0, n.jsxs)("div", {
            className: "flex items-center justify-between mb-4",
            children: [
              (0, n.jsxs)("div", {
                className: "flex items-center gap-3",
                children: [
                  (0, n.jsx)("div", {
                    className: "p-3 bg-blue-100 rounded-xl",
                    children: (0, n.jsx)(aa, {
                      size: 24,
                      className: "text-blue-600",
                    }),
                  }),
                  (0, n.jsxs)("div", {
                    children: [
                      (0, n.jsx)("h2", {
                        className: "text-lg font-bold text-gray-900",
                        children: "Validation Chef de Village",
                      }),
                      (0, n.jsx)("p", {
                        className: "text-sm text-gray-500",
                        children: "Signature physique requise",
                      }),
                    ],
                  }),
                ],
              }),
              (0, n.jsx)(Zr, {
                color: oi[Ue] || "gray",
                label: ii[Ue] || o.statut || "Brouillon",
              }),
            ],
          }),
          o.foncier_lots &&
            (0, n.jsxs)("div", {
              className:
                "grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100",
              children: [
                (0, n.jsxs)("div", {
                  children: [
                    (0, n.jsx)("p", {
                      className: "text-xs text-gray-500",
                      children: "Référence",
                    }),
                    (0, n.jsx)("p", {
                      className: "text-sm font-medium",
                      children: o.foncier_lots.reference,
                    }),
                  ],
                }),
                (0, n.jsxs)("div", {
                  children: [
                    (0, n.jsx)("p", {
                      className: "text-xs text-gray-500",
                      children: "N° Lot",
                    }),
                    (0, n.jsx)("p", {
                      className: "text-sm font-medium",
                      children: o.foncier_lots.numero_lot,
                    }),
                  ],
                }),
                (0, n.jsxs)("div", {
                  children: [
                    (0, n.jsx)("p", {
                      className: "text-xs text-gray-500",
                      children: "Village",
                    }),
                    (0, n.jsx)("p", {
                      className: "text-sm font-medium",
                      children: o.foncier_lots.village,
                    }),
                  ],
                }),
                (0, n.jsxs)("div", {
                  children: [
                    (0, n.jsx)("p", {
                      className: "text-xs text-gray-500",
                      children: "Propriétaire",
                    }),
                    (0, n.jsxs)("p", {
                      className: "text-sm font-medium",
                      children: [
                        o.foncier_lots.proprietaire_prenom,
                        " ",
                        o.foncier_lots.proprietaire_nom,
                      ],
                    }),
                  ],
                }),
              ],
            }),
        ],
      }),
      (0, n.jsxs)("div", {
        className: "bg-white rounded-xl shadow-sm border border-gray-200 p-6",
        children: [
          (0, n.jsx)("h3", {
            className: "text-sm font-semibold text-gray-700 mb-4",
            children: "Étapes",
          }),
          (0, n.jsxs)("div", {
            className: "space-y-4",
            children: [
              (0, n.jsxs)("div", {
                className: "flex items-start gap-4",
                children: [
                  (0, n.jsx)("div", {
                    className: `w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${o.statut === "soumis" || o.statut === "valide" ? "bg-blue-100" : "bg-gray-100"}`,
                    children:
                      o.statut === "soumis" || o.statut === "valide"
                        ? (0, n.jsx)(Ht, {
                            size: 20,
                            className: "text-blue-600",
                          })
                        : (0, n.jsx)($s, {
                            size: 20,
                            className: "text-gray-400",
                          }),
                  }),
                  (0, n.jsxs)("div", {
                    className: "flex-1",
                    children: [
                      (0, n.jsxs)("div", {
                        className: "flex items-center justify-between",
                        children: [
                          (0, n.jsx)("h4", {
                            className: "text-sm font-medium text-gray-900",
                            children: "1. Soumission au Chef",
                          }),
                          o.statut === "soumis" &&
                            (0, n.jsx)("span", {
                              className: "text-xs text-gray-500",
                              children: new Date(
                                o.created_at,
                              ).toLocaleDateString("fr-FR"),
                            }),
                        ],
                      }),
                      (0, n.jsx)("p", {
                        className: "text-xs text-gray-500 mt-1",
                        children:
                          o.statut === "soumis" || o.statut === "valide"
                            ? `Soumis par ${o.validation_agent_nom || "Agent foncier"}`
                            : "En attente de soumission",
                      }),
                      o.statut !== "soumis" &&
                        o.statut !== "valide" &&
                        bt &&
                        (0, n.jsx)("button", {
                          onClick: jt,
                          disabled: x,
                          className:
                            "mt-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50",
                          children: x ? "Soumission..." : "Soumettre",
                        }),
                    ],
                  }),
                ],
              }),
              (0, n.jsxs)("div", {
                className: "flex items-start gap-4",
                children: [
                  (0, n.jsx)("div", {
                    className: `w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${o.statut === "valide" ? "bg-green-100" : "bg-gray-100"}`,
                    children:
                      o.statut === "valide"
                        ? (0, n.jsx)(Ht, {
                            size: 20,
                            className: "text-green-600",
                          })
                        : (0, n.jsx)(Ls, {
                            size: 20,
                            className: "text-gray-400",
                          }),
                  }),
                  (0, n.jsxs)("div", {
                    className: "flex-1",
                    children: [
                      (0, n.jsxs)("div", {
                        className: "flex items-center justify-between",
                        children: [
                          (0, n.jsx)("h4", {
                            className: "text-sm font-medium text-gray-900",
                            children: "2. Validation Chef",
                          }),
                          o.validation_chef_date &&
                            (0, n.jsx)("span", {
                              className: "text-xs text-gray-500",
                              children: new Date(
                                o.validation_chef_date,
                              ).toLocaleDateString("fr-FR"),
                            }),
                        ],
                      }),
                      (0, n.jsx)("p", {
                        className: "text-xs text-gray-500 mt-1",
                        children:
                          o.statut === "valide"
                            ? `Validé par ${o.validation_chef_nom || "Chef du village"}`
                            : "Signature physique du Chef requise",
                      }),
                      o.statut === "soumis" &&
                        yt &&
                        (0, n.jsx)("button", {
                          onClick: ue,
                          disabled: N,
                          className:
                            "mt-2 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50",
                          children: N ? "Validation..." : "Valider (Chef)",
                        }),
                      o.statut === "soumis" &&
                        !yt &&
                        (0, n.jsx)("p", {
                          className: "text-xs text-amber-600 mt-2",
                          children:
                            "Accès réservé au Chef (validateur village) ou admin.",
                        }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      (0, n.jsxs)("div", {
        className: "bg-white rounded-xl shadow-sm border border-gray-200 p-6",
        children: [
          (0, n.jsxs)("div", {
            className: "flex items-center justify-between mb-4",
            children: [
              (0, n.jsxs)("div", {
                children: [
                  (0, n.jsx)("h3", {
                    className: "text-sm font-semibold text-gray-700",
                    children: "Scan original",
                  }),
                  (0, n.jsx)("p", {
                    className: "text-xs text-gray-500",
                    children: "Joindre le scan pour consultation en ligne",
                  }),
                ],
              }),
              (0, n.jsxs)("button", {
                onClick: () => C(!0),
                disabled: !s || F || o.statut !== "valide",
                className:
                  "px-3 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50",
                children: [
                  (0, n.jsx)(ia, { size: 14, className: "inline mr-1" }),
                  " Scanner",
                ],
              }),
            ],
          }),
          F
            ? (0, n.jsxs)("div", {
                className: "flex items-center gap-2 text-xs text-gray-500",
                children: [
                  (0, n.jsx)("div", {
                    className:
                      "animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400",
                  }),
                  " Chargement...",
                ],
              })
            : re
              ? (0, n.jsxs)("div", {
                  className: "flex items-center gap-4",
                  children: [
                    (0, n.jsxs)("div", {
                      className:
                        "w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center",
                      children: [
                        (0, n.jsx)("img", {
                          src: re.url,
                          alt: re.original_name,
                          className: "w-full h-full object-cover",
                          onError: (X) => {
                            X.target.style.display = "none";
                          },
                        }),
                        (0, n.jsx)(qs, {
                          size: 20,
                          className: "text-gray-300",
                        }),
                      ],
                    }),
                    (0, n.jsxs)("div", {
                      className: "flex-1",
                      children: [
                        (0, n.jsx)("p", {
                          className: "text-sm font-medium text-gray-700",
                          children: re.original_name,
                        }),
                        (0, n.jsxs)("a", {
                          href: re.url,
                          target: "_blank",
                          rel: "noreferrer",
                          className:
                            "text-xs text-blue-600 hover:underline inline-flex items-center gap-1",
                          children: ["Ouvrir ", (0, n.jsx)(zs, { size: 12 })],
                        }),
                      ],
                    }),
                  ],
                })
              : (0, n.jsx)("div", {
                  className: "text-xs text-gray-400",
                  children: "Aucun scan enregistré.",
                }),
          o.statut !== "valide" &&
            (0, n.jsxs)("div", {
              className: "mt-3 text-xs text-amber-600 flex items-center gap-1",
              children: [
                (0, n.jsx)(sa, { size: 12 }),
                " Le scan est disponible après validation du Chef.",
              ],
            }),
        ],
      }),
      g &&
        (0, n.jsx)(Gs, {
          title: "Ajouter le scan original",
          defaultCategory: "documents",
          onSelect: Nt,
          onClose: () => C(!1),
        }),
    ],
  });
}
var cd = Object.freeze({ status: "aborted" });
function f(e, t, r) {
  function a(u, d) {
    if (
      (u._zod ||
        Object.defineProperty(u, "_zod", {
          value: { def: d, constr: o, traits: new Set() },
          enumerable: !1,
        }),
      u._zod.traits.has(e))
    )
      return;
    (u._zod.traits.add(e), t(u, d));
    const v = o.prototype,
      x = Object.keys(v);
    for (let A = 0; A < x.length; A++) {
      const N = x[A];
      N in u || (u[N] = v[N].bind(u));
    }
  }
  const s = r?.Parent ?? Object;
  class l extends s {}
  Object.defineProperty(l, "name", { value: e });
  function o(u) {
    var d;
    const v = r?.Parent ? new l() : this;
    (a(v, u), (d = v._zod).deferred ?? (d.deferred = []));
    for (const x of v._zod.deferred) x();
    return v;
  }
  return (
    Object.defineProperty(o, "init", { value: a }),
    Object.defineProperty(o, Symbol.hasInstance, {
      value: (u) =>
        r?.Parent && u instanceof r.Parent ? !0 : u?._zod?.traits?.has(e),
    }),
    Object.defineProperty(o, "name", { value: e }),
    o
  );
}
var it = class extends Error {
    constructor() {
      super(
        "Encountered Promise during synchronous parse. Use .parseAsync() instead.",
      );
    }
  },
  da = class extends Error {
    constructor(e) {
      (super(`Encountered unidirectional transform during encode: ${e}`),
        (this.name = "ZodEncodeError"));
    }
  },
  Tr = {};
function Ge(e) {
  return (e && Object.assign(Tr, e), Tr);
}
function pa(e) {
  const t = Object.values(e).filter((r) => typeof r == "number");
  return Object.entries(e)
    .filter(([r, a]) => t.indexOf(+r) === -1)
    .map(([r, a]) => a);
}
function Rr(e, t) {
  return typeof t == "bigint" ? t.toString() : t;
}
function Vr(e) {
  return {
    get value() {
      {
        const t = e();
        return (Object.defineProperty(this, "value", { value: t }), t);
      }
      throw new Error("cached value already set");
    },
  };
}
function Mr(e) {
  return e == null;
}
function Jr(e) {
  const t = e.startsWith("^") ? 1 : 0,
    r = e.endsWith("$") ? e.length - 1 : e.length;
  return e.slice(t, r);
}
var On = Symbol("evaluating");
function J(e, t, r) {
  let a;
  Object.defineProperty(e, t, {
    get() {
      if (a !== On) return (a === void 0 && ((a = On), (a = r())), a);
    },
    set(s) {
      Object.defineProperty(e, t, { value: s });
    },
    configurable: !0,
  });
}
function Ke(e, t, r) {
  Object.defineProperty(e, t, {
    value: r,
    writable: !0,
    enumerable: !0,
    configurable: !0,
  });
}
function De(...e) {
  const t = {};
  for (const r of e) Object.assign(t, Object.getOwnPropertyDescriptors(r));
  return Object.defineProperties({}, t);
}
function In(e) {
  return JSON.stringify(e);
}
function ui(e) {
  return e
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
var ma = "captureStackTrace" in Error ? Error.captureStackTrace : (...e) => {};
function Wt(e) {
  return typeof e == "object" && e !== null && !Array.isArray(e);
}
var di = Vr(() => {
  if (typeof navigator < "u" && navigator?.userAgent?.includes("Cloudflare"))
    return !1;
  try {
    return (new Function(""), !0);
  } catch {
    return !1;
  }
});
function vt(e) {
  if (Wt(e) === !1) return !1;
  const t = e.constructor;
  if (t === void 0 || typeof t != "function") return !0;
  const r = t.prototype;
  return !(
    Wt(r) === !1 ||
    Object.prototype.hasOwnProperty.call(r, "isPrototypeOf") === !1
  );
}
function fa(e) {
  return vt(e) ? { ...e } : Array.isArray(e) ? [...e] : e;
}
var pi = new Set(["string", "number", "symbol"]);
function tr(e) {
  return e.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function qe(e, t, r) {
  const a = new e._zod.constr(t ?? e._zod.def);
  return ((!t || r?.parent) && (a._zod.parent = e), a);
}
function O(e) {
  const t = e;
  if (!t) return {};
  if (typeof t == "string") return { error: () => t };
  if (t?.message !== void 0) {
    if (t?.error !== void 0)
      throw new Error("Cannot specify both `message` and `error` params");
    t.error = t.message;
  }
  return (
    delete t.message,
    typeof t.error == "string" ? { ...t, error: () => t.error } : t
  );
}
function mi(e) {
  return Object.keys(e).filter(
    (t) => e[t]._zod.optin === "optional" && e[t]._zod.optout === "optional",
  );
}
var ud = {
  safeint: [Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
  int32: [-2147483648, 2147483647],
  uint32: [0, 4294967295],
  float32: [-34028234663852886e22, 34028234663852886e22],
  float64: [-Number.MAX_VALUE, Number.MAX_VALUE],
};
function fi(e, t) {
  const r = e._zod.def,
    a = r.checks;
  if (a && a.length > 0)
    throw new Error(
      ".pick() cannot be used on object schemas containing refinements",
    );
  return qe(
    e,
    De(e._zod.def, {
      get shape() {
        const s = {};
        for (const l in t) {
          if (!(l in r.shape)) throw new Error(`Unrecognized key: "${l}"`);
          t[l] && (s[l] = r.shape[l]);
        }
        return (Ke(this, "shape", s), s);
      },
      checks: [],
    }),
  );
}
function gi(e, t) {
  const r = e._zod.def,
    a = r.checks;
  if (a && a.length > 0)
    throw new Error(
      ".omit() cannot be used on object schemas containing refinements",
    );
  return qe(
    e,
    De(e._zod.def, {
      get shape() {
        const s = { ...e._zod.def.shape };
        for (const l in t) {
          if (!(l in r.shape)) throw new Error(`Unrecognized key: "${l}"`);
          t[l] && delete s[l];
        }
        return (Ke(this, "shape", s), s);
      },
      checks: [],
    }),
  );
}
function hi(e, t) {
  if (!vt(t))
    throw new Error("Invalid input to extend: expected a plain object");
  const r = e._zod.def.checks;
  if (r && r.length > 0) {
    const a = e._zod.def.shape;
    for (const s in t)
      if (Object.getOwnPropertyDescriptor(a, s) !== void 0)
        throw new Error(
          "Cannot overwrite keys on object schemas containing refinements. Use `.safeExtend()` instead.",
        );
  }
  return qe(
    e,
    De(e._zod.def, {
      get shape() {
        const a = { ...e._zod.def.shape, ...t };
        return (Ke(this, "shape", a), a);
      },
    }),
  );
}
function _i(e, t) {
  if (!vt(t))
    throw new Error("Invalid input to safeExtend: expected a plain object");
  return qe(
    e,
    De(e._zod.def, {
      get shape() {
        const r = { ...e._zod.def.shape, ...t };
        return (Ke(this, "shape", r), r);
      },
    }),
  );
}
function vi(e, t) {
  return qe(
    e,
    De(e._zod.def, {
      get shape() {
        const r = { ...e._zod.def.shape, ...t._zod.def.shape };
        return (Ke(this, "shape", r), r);
      },
      get catchall() {
        return t._zod.def.catchall;
      },
      checks: [],
    }),
  );
}
function xi(e, t, r) {
  const a = t._zod.def.checks;
  if (a && a.length > 0)
    throw new Error(
      ".partial() cannot be used on object schemas containing refinements",
    );
  return qe(
    t,
    De(t._zod.def, {
      get shape() {
        const s = t._zod.def.shape,
          l = { ...s };
        if (r)
          for (const o in r) {
            if (!(o in s)) throw new Error(`Unrecognized key: "${o}"`);
            r[o] &&
              (l[o] = e ? new e({ type: "optional", innerType: s[o] }) : s[o]);
          }
        else
          for (const o in s)
            l[o] = e ? new e({ type: "optional", innerType: s[o] }) : s[o];
        return (Ke(this, "shape", l), l);
      },
      checks: [],
    }),
  );
}
function bi(e, t, r) {
  return qe(
    t,
    De(t._zod.def, {
      get shape() {
        const a = t._zod.def.shape,
          s = { ...a };
        if (r)
          for (const l in r) {
            if (!(l in s)) throw new Error(`Unrecognized key: "${l}"`);
            r[l] && (s[l] = new e({ type: "nonoptional", innerType: a[l] }));
          }
        else
          for (const l in a)
            s[l] = new e({ type: "nonoptional", innerType: a[l] });
        return (Ke(this, "shape", s), s);
      },
    }),
  );
}
function st(e, t = 0) {
  if (e.aborted === !0) return !0;
  for (let r = t; r < e.issues.length; r++)
    if (e.issues[r]?.continue !== !0) return !0;
  return !1;
}
function ga(e, t) {
  return t.map((r) => {
    var a;
    return ((a = r).path ?? (a.path = []), r.path.unshift(e), r);
  });
}
function qt(e) {
  return typeof e == "string" ? e : e?.message;
}
function Be(e, t, r) {
  const a = { ...e, path: e.path ?? [] };
  return (
    e.message ||
      (a.message =
        qt(e.inst?._zod.def?.error?.(e)) ??
        qt(t?.error?.(e)) ??
        qt(r.customError?.(e)) ??
        qt(r.localeError?.(e)) ??
        "Invalid input"),
    delete a.inst,
    delete a.continue,
    t?.reportInput || delete a.input,
    a
  );
}
function Gr(e) {
  return Array.isArray(e)
    ? "array"
    : typeof e == "string"
      ? "string"
      : "unknown";
}
function xt(...e) {
  const [t, r, a] = e;
  return typeof t == "string"
    ? { message: t, code: "custom", input: r, inst: a }
    : { ...t };
}
var ha = (e, t) => {
    ((e.name = "$ZodError"),
      Object.defineProperty(e, "_zod", { value: e._zod, enumerable: !1 }),
      Object.defineProperty(e, "issues", { value: t, enumerable: !1 }),
      (e.message = JSON.stringify(t, Rr, 2)),
      Object.defineProperty(e, "toString", {
        value: () => e.message,
        enumerable: !1,
      }));
  },
  _a = f("$ZodError", ha),
  va = f("$ZodError", ha, { Parent: Error });
function yi(e, t = (r) => r.message) {
  const r = {},
    a = [];
  for (const s of e.issues)
    s.path.length > 0
      ? ((r[s.path[0]] = r[s.path[0]] || []), r[s.path[0]].push(t(s)))
      : a.push(t(s));
  return { formErrors: a, fieldErrors: r };
}
function ji(e, t = (r) => r.message) {
  const r = { _errors: [] },
    a = (s) => {
      for (const l of s.issues)
        if (l.code === "invalid_union" && l.errors.length)
          l.errors.map((o) => a({ issues: o }));
        else if (l.code === "invalid_key") a({ issues: l.issues });
        else if (l.code === "invalid_element") a({ issues: l.issues });
        else if (l.path.length === 0) r._errors.push(t(l));
        else {
          let o = r,
            u = 0;
          for (; u < l.path.length; ) {
            const d = l.path[u];
            (u !== l.path.length - 1
              ? (o[d] = o[d] || { _errors: [] })
              : ((o[d] = o[d] || { _errors: [] }), o[d]._errors.push(t(l))),
              (o = o[d]),
              u++);
          }
        }
    };
  return (a(e), r);
}
var Br = (e) => (t, r, a, s) => {
  const l = a ? Object.assign(a, { async: !1 }) : { async: !1 },
    o = t._zod.run({ value: r, issues: [] }, l);
  if (o instanceof Promise) throw new it();
  if (o.issues.length) {
    const u = new (s?.Err ?? e)(o.issues.map((d) => Be(d, l, Ge())));
    throw (ma(u, s?.callee), u);
  }
  return o.value;
};
var Kr = (e) => async (t, r, a, s) => {
  const l = a ? Object.assign(a, { async: !0 }) : { async: !0 };
  let o = t._zod.run({ value: r, issues: [] }, l);
  if ((o instanceof Promise && (o = await o), o.issues.length)) {
    const u = new (s?.Err ?? e)(o.issues.map((d) => Be(d, l, Ge())));
    throw (ma(u, s?.callee), u);
  }
  return o.value;
};
var rr = (e) => (t, r, a) => {
    const s = a ? { ...a, async: !1 } : { async: !1 },
      l = t._zod.run({ value: r, issues: [] }, s);
    if (l instanceof Promise) throw new it();
    return l.issues.length
      ? {
          success: !1,
          error: new (e ?? _a)(l.issues.map((o) => Be(o, s, Ge()))),
        }
      : { success: !0, data: l.value };
  },
  Ni = rr(va),
  nr = (e) => async (t, r, a) => {
    const s = a ? Object.assign(a, { async: !0 }) : { async: !0 };
    let l = t._zod.run({ value: r, issues: [] }, s);
    return (
      l instanceof Promise && (l = await l),
      l.issues.length
        ? { success: !1, error: new e(l.issues.map((o) => Be(o, s, Ge()))) }
        : { success: !0, data: l.value }
    );
  },
  wi = nr(va),
  Si = (e) => (t, r, a) => {
    const s = a
      ? Object.assign(a, { direction: "backward" })
      : { direction: "backward" };
    return Br(e)(t, r, s);
  };
var zi = (e) => (t, r, a) => Br(e)(t, r, a);
var ki = (e) => async (t, r, a) => {
  const s = a
    ? Object.assign(a, { direction: "backward" })
    : { direction: "backward" };
  return Kr(e)(t, r, s);
};
var Ai = (e) => async (t, r, a) => Kr(e)(t, r, a);
var $i = (e) => (t, r, a) => {
  const s = a
    ? Object.assign(a, { direction: "backward" })
    : { direction: "backward" };
  return rr(e)(t, r, s);
};
var Ci = (e) => (t, r, a) => rr(e)(t, r, a);
var Ei = (e) => async (t, r, a) => {
  const s = a
    ? Object.assign(a, { direction: "backward" })
    : { direction: "backward" };
  return nr(e)(t, r, s);
};
var Oi = (e) => async (t, r, a) => nr(e)(t, r, a);
var Ii = /^[cC][^\s-]{8,}$/,
  Pi = /^[0-9a-z]+$/,
  Li = /^[0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{26}$/,
  Zi = /^[0-9a-vA-V]{20}$/,
  Ti = /^[A-Za-z0-9]{27}$/,
  Ri = /^[a-zA-Z0-9_-]{21}$/,
  Di =
    /^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/,
  qi =
    /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/,
  Pn = (e) =>
    e
      ? new RegExp(
          `^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-${e}[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$`,
        )
      : /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/,
  Fi =
    /^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/,
  Ui = "^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$";
function Vi() {
  return new RegExp(Ui, "u");
}
var Mi =
    /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/,
  Ji =
    /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/,
  Gi =
    /^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/([0-9]|[1-2][0-9]|3[0-2])$/,
  Bi =
    /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|::|([0-9a-fA-F]{1,4})?::([0-9a-fA-F]{1,4}:?){0,6})\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/,
  Ki =
    /^$|^(?:[0-9a-zA-Z+/]{4})*(?:(?:[0-9a-zA-Z+/]{2}==)|(?:[0-9a-zA-Z+/]{3}=))?$/,
  xa = /^[A-Za-z0-9_-]*$/,
  Hi = /^\+[1-9]\d{6,14}$/,
  ba =
    "(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))",
  Wi = new RegExp(`^${ba}$`);
function ya(e) {
  const t = "(?:[01]\\d|2[0-3]):[0-5]\\d";
  return typeof e.precision == "number"
    ? e.precision === -1
      ? `${t}`
      : e.precision === 0
        ? `${t}:[0-5]\\d`
        : `${t}:[0-5]\\d\\.\\d{${e.precision}}`
    : `${t}(?::[0-5]\\d(?:\\.\\d+)?)?`;
}
function Qi(e) {
  return new RegExp(`^${ya(e)}$`);
}
function Xi(e) {
  const t = ya({ precision: e.precision }),
    r = ["Z"];
  (e.local && r.push(""),
    e.offset && r.push("([+-](?:[01]\\d|2[0-3]):[0-5]\\d)"));
  const a = `${t}(?:${r.join("|")})`;
  return new RegExp(`^${ba}T(?:${a})$`);
}
var Yi = (e) => {
    const t = e
      ? `[\\s\\S]{${e?.minimum ?? 0},${e?.maximum ?? ""}}`
      : "[\\s\\S]*";
    return new RegExp(`^${t}$`);
  },
  eo = /^(?:true|false)$/i,
  to = /^[^A-Z]*$/,
  ro = /^[^a-z]*$/,
  Ee = f("$ZodCheck", (e, t) => {
    var r;
    (e._zod ?? (e._zod = {}),
      (e._zod.def = t),
      (r = e._zod).onattach ?? (r.onattach = []));
  }),
  no = f("$ZodCheckMaxLength", (e, t) => {
    var r;
    (Ee.init(e, t),
      (r = e._zod.def).when ??
        (r.when = (a) => {
          const s = a.value;
          return !Mr(s) && s.length !== void 0;
        }),
      e._zod.onattach.push((a) => {
        const s = a._zod.bag.maximum ?? Number.POSITIVE_INFINITY;
        t.maximum < s && (a._zod.bag.maximum = t.maximum);
      }),
      (e._zod.check = (a) => {
        const s = a.value;
        if (s.length <= t.maximum) return;
        const l = Gr(s);
        a.issues.push({
          origin: l,
          code: "too_big",
          maximum: t.maximum,
          inclusive: !0,
          input: s,
          inst: e,
          continue: !t.abort,
        });
      }));
  }),
  ao = f("$ZodCheckMinLength", (e, t) => {
    var r;
    (Ee.init(e, t),
      (r = e._zod.def).when ??
        (r.when = (a) => {
          const s = a.value;
          return !Mr(s) && s.length !== void 0;
        }),
      e._zod.onattach.push((a) => {
        const s = a._zod.bag.minimum ?? Number.NEGATIVE_INFINITY;
        t.minimum > s && (a._zod.bag.minimum = t.minimum);
      }),
      (e._zod.check = (a) => {
        const s = a.value;
        if (s.length >= t.minimum) return;
        const l = Gr(s);
        a.issues.push({
          origin: l,
          code: "too_small",
          minimum: t.minimum,
          inclusive: !0,
          input: s,
          inst: e,
          continue: !t.abort,
        });
      }));
  }),
  so = f("$ZodCheckLengthEquals", (e, t) => {
    var r;
    (Ee.init(e, t),
      (r = e._zod.def).when ??
        (r.when = (a) => {
          const s = a.value;
          return !Mr(s) && s.length !== void 0;
        }),
      e._zod.onattach.push((a) => {
        const s = a._zod.bag;
        ((s.minimum = t.length), (s.maximum = t.length), (s.length = t.length));
      }),
      (e._zod.check = (a) => {
        const s = a.value,
          l = s.length;
        if (l === t.length) return;
        const o = Gr(s),
          u = l > t.length;
        a.issues.push({
          origin: o,
          ...(u
            ? { code: "too_big", maximum: t.length }
            : { code: "too_small", minimum: t.length }),
          inclusive: !0,
          exact: !0,
          input: a.value,
          inst: e,
          continue: !t.abort,
        });
      }));
  }),
  ar = f("$ZodCheckStringFormat", (e, t) => {
    var r, a;
    (Ee.init(e, t),
      e._zod.onattach.push((s) => {
        const l = s._zod.bag;
        ((l.format = t.format),
          t.pattern &&
            (l.patterns ?? (l.patterns = new Set()),
            l.patterns.add(t.pattern)));
      }),
      t.pattern
        ? ((r = e._zod).check ??
          (r.check = (s) => {
            ((t.pattern.lastIndex = 0),
              !t.pattern.test(s.value) &&
                s.issues.push({
                  origin: "string",
                  code: "invalid_format",
                  format: t.format,
                  input: s.value,
                  ...(t.pattern ? { pattern: t.pattern.toString() } : {}),
                  inst: e,
                  continue: !t.abort,
                }));
          }))
        : ((a = e._zod).check ?? (a.check = () => {})));
  }),
  io = f("$ZodCheckRegex", (e, t) => {
    (ar.init(e, t),
      (e._zod.check = (r) => {
        ((t.pattern.lastIndex = 0),
          !t.pattern.test(r.value) &&
            r.issues.push({
              origin: "string",
              code: "invalid_format",
              format: "regex",
              input: r.value,
              pattern: t.pattern.toString(),
              inst: e,
              continue: !t.abort,
            }));
      }));
  }),
  oo = f("$ZodCheckLowerCase", (e, t) => {
    (t.pattern ?? (t.pattern = to), ar.init(e, t));
  }),
  lo = f("$ZodCheckUpperCase", (e, t) => {
    (t.pattern ?? (t.pattern = ro), ar.init(e, t));
  }),
  co = f("$ZodCheckIncludes", (e, t) => {
    Ee.init(e, t);
    const r = tr(t.includes),
      a = new RegExp(
        typeof t.position == "number" ? `^.{${t.position}}${r}` : r,
      );
    ((t.pattern = a),
      e._zod.onattach.push((s) => {
        const l = s._zod.bag;
        (l.patterns ?? (l.patterns = new Set()), l.patterns.add(a));
      }),
      (e._zod.check = (s) => {
        s.value.includes(t.includes, t.position) ||
          s.issues.push({
            origin: "string",
            code: "invalid_format",
            format: "includes",
            includes: t.includes,
            input: s.value,
            inst: e,
            continue: !t.abort,
          });
      }));
  }),
  uo = f("$ZodCheckStartsWith", (e, t) => {
    Ee.init(e, t);
    const r = new RegExp(`^${tr(t.prefix)}.*`);
    (t.pattern ?? (t.pattern = r),
      e._zod.onattach.push((a) => {
        const s = a._zod.bag;
        (s.patterns ?? (s.patterns = new Set()), s.patterns.add(r));
      }),
      (e._zod.check = (a) => {
        a.value.startsWith(t.prefix) ||
          a.issues.push({
            origin: "string",
            code: "invalid_format",
            format: "starts_with",
            prefix: t.prefix,
            input: a.value,
            inst: e,
            continue: !t.abort,
          });
      }));
  }),
  po = f("$ZodCheckEndsWith", (e, t) => {
    Ee.init(e, t);
    const r = new RegExp(`.*${tr(t.suffix)}$`);
    (t.pattern ?? (t.pattern = r),
      e._zod.onattach.push((a) => {
        const s = a._zod.bag;
        (s.patterns ?? (s.patterns = new Set()), s.patterns.add(r));
      }),
      (e._zod.check = (a) => {
        a.value.endsWith(t.suffix) ||
          a.issues.push({
            origin: "string",
            code: "invalid_format",
            format: "ends_with",
            suffix: t.suffix,
            input: a.value,
            inst: e,
            continue: !t.abort,
          });
      }));
  }),
  mo = f("$ZodCheckOverwrite", (e, t) => {
    (Ee.init(e, t),
      (e._zod.check = (r) => {
        r.value = t.tx(r.value);
      }));
  }),
  fo = class {
    constructor(e = []) {
      ((this.content = []), (this.indent = 0), this && (this.args = e));
    }
    indented(e) {
      ((this.indent += 1), e(this), (this.indent -= 1));
    }
    write(e) {
      if (typeof e == "function") {
        (e(this, { execution: "sync" }), e(this, { execution: "async" }));
        return;
      }
      const t = e
          .split(
            `
`,
          )
          .filter((s) => s),
        r = Math.min(...t.map((s) => s.length - s.trimStart().length)),
        a = t
          .map((s) => s.slice(r))
          .map((s) => " ".repeat(this.indent * 2) + s);
      for (const s of a) this.content.push(s);
    }
    compile() {
      const e = Function,
        t = this?.args,
        r = [...(this?.content ?? [""]).map((a) => `  ${a}`)];
      return new e(
        ...t,
        r.join(`
`),
      );
    }
  },
  go = { major: 4, minor: 3, patch: 6 },
  ie = f("$ZodType", (e, t) => {
    var r;
    (e ?? (e = {}),
      (e._zod.def = t),
      (e._zod.bag = e._zod.bag || {}),
      (e._zod.version = go));
    const a = [...(e._zod.def.checks ?? [])];
    e._zod.traits.has("$ZodCheck") && a.unshift(e);
    for (const s of a) for (const l of s._zod.onattach) l(e);
    if (a.length === 0)
      ((r = e._zod).deferred ?? (r.deferred = []),
        e._zod.deferred?.push(() => {
          e._zod.run = e._zod.parse;
        }));
    else {
      const s = (o, u, d) => {
          let v = st(o),
            x;
          for (const A of u) {
            if (A._zod.def.when) {
              if (!A._zod.def.when(o)) continue;
            } else if (v) continue;
            const N = o.issues.length,
              j = A._zod.check(o);
            if (j instanceof Promise && d?.async === !1) throw new it();
            if (x || j instanceof Promise)
              x = (x ?? Promise.resolve()).then(async () => {
                (await j, o.issues.length !== N && (v || (v = st(o, N))));
              });
            else {
              if (o.issues.length === N) continue;
              v || (v = st(o, N));
            }
          }
          return x ? x.then(() => o) : o;
        },
        l = (o, u, d) => {
          if (st(o)) return ((o.aborted = !0), o);
          const v = s(u, a, d);
          if (v instanceof Promise) {
            if (d.async === !1) throw new it();
            return v.then((x) => e._zod.parse(x, d));
          }
          return e._zod.parse(v, d);
        };
      e._zod.run = (o, u) => {
        if (u.skipChecks) return e._zod.parse(o, u);
        if (u.direction === "backward") {
          const v = e._zod.parse(
            { value: o.value, issues: [] },
            { ...u, skipChecks: !0 },
          );
          return v instanceof Promise ? v.then((x) => l(x, o, u)) : l(v, o, u);
        }
        const d = e._zod.parse(o, u);
        if (d instanceof Promise) {
          if (u.async === !1) throw new it();
          return d.then((v) => s(v, a, u));
        }
        return s(d, a, u);
      };
    }
    J(e, "~standard", () => ({
      validate: (s) => {
        try {
          const l = Ni(e, s);
          return l.success ? { value: l.data } : { issues: l.error?.issues };
        } catch {
          return wi(e, s).then((o) =>
            o.success ? { value: o.data } : { issues: o.error?.issues },
          );
        }
      },
      vendor: "zod",
      version: 1,
    }));
  }),
  Hr = f("$ZodString", (e, t) => {
    (ie.init(e, t),
      (e._zod.pattern =
        [...(e?._zod.bag?.patterns ?? [])].pop() ?? Yi(e._zod.bag)),
      (e._zod.parse = (r, a) => {
        if (t.coerce)
          try {
            r.value = String(r.value);
          } catch {}
        return (
          typeof r.value == "string" ||
            r.issues.push({
              expected: "string",
              code: "invalid_type",
              input: r.value,
              inst: e,
            }),
          r
        );
      }));
  }),
  ee = f("$ZodStringFormat", (e, t) => {
    (ar.init(e, t), Hr.init(e, t));
  }),
  ho = f("$ZodGUID", (e, t) => {
    (t.pattern ?? (t.pattern = qi), ee.init(e, t));
  }),
  _o = f("$ZodUUID", (e, t) => {
    if (t.version) {
      const r = { v1: 1, v2: 2, v3: 3, v4: 4, v5: 5, v6: 6, v7: 7, v8: 8 }[
        t.version
      ];
      if (r === void 0) throw new Error(`Invalid UUID version: "${t.version}"`);
      t.pattern ?? (t.pattern = Pn(r));
    } else t.pattern ?? (t.pattern = Pn());
    ee.init(e, t);
  }),
  vo = f("$ZodEmail", (e, t) => {
    (t.pattern ?? (t.pattern = Fi), ee.init(e, t));
  }),
  xo = f("$ZodURL", (e, t) => {
    (ee.init(e, t),
      (e._zod.check = (r) => {
        try {
          const a = r.value.trim(),
            s = new URL(a);
          (t.hostname &&
            ((t.hostname.lastIndex = 0),
            t.hostname.test(s.hostname) ||
              r.issues.push({
                code: "invalid_format",
                format: "url",
                note: "Invalid hostname",
                pattern: t.hostname.source,
                input: r.value,
                inst: e,
                continue: !t.abort,
              })),
            t.protocol &&
              ((t.protocol.lastIndex = 0),
              t.protocol.test(
                s.protocol.endsWith(":") ? s.protocol.slice(0, -1) : s.protocol,
              ) ||
                r.issues.push({
                  code: "invalid_format",
                  format: "url",
                  note: "Invalid protocol",
                  pattern: t.protocol.source,
                  input: r.value,
                  inst: e,
                  continue: !t.abort,
                })),
            t.normalize ? (r.value = s.href) : (r.value = a));
          return;
        } catch {
          r.issues.push({
            code: "invalid_format",
            format: "url",
            input: r.value,
            inst: e,
            continue: !t.abort,
          });
        }
      }));
  }),
  bo = f("$ZodEmoji", (e, t) => {
    (t.pattern ?? (t.pattern = Vi()), ee.init(e, t));
  }),
  yo = f("$ZodNanoID", (e, t) => {
    (t.pattern ?? (t.pattern = Ri), ee.init(e, t));
  }),
  jo = f("$ZodCUID", (e, t) => {
    (t.pattern ?? (t.pattern = Ii), ee.init(e, t));
  }),
  No = f("$ZodCUID2", (e, t) => {
    (t.pattern ?? (t.pattern = Pi), ee.init(e, t));
  }),
  wo = f("$ZodULID", (e, t) => {
    (t.pattern ?? (t.pattern = Li), ee.init(e, t));
  }),
  So = f("$ZodXID", (e, t) => {
    (t.pattern ?? (t.pattern = Zi), ee.init(e, t));
  }),
  zo = f("$ZodKSUID", (e, t) => {
    (t.pattern ?? (t.pattern = Ti), ee.init(e, t));
  }),
  ko = f("$ZodISODateTime", (e, t) => {
    (t.pattern ?? (t.pattern = Xi(t)), ee.init(e, t));
  }),
  Ao = f("$ZodISODate", (e, t) => {
    (t.pattern ?? (t.pattern = Wi), ee.init(e, t));
  }),
  $o = f("$ZodISOTime", (e, t) => {
    (t.pattern ?? (t.pattern = Qi(t)), ee.init(e, t));
  }),
  Co = f("$ZodISODuration", (e, t) => {
    (t.pattern ?? (t.pattern = Di), ee.init(e, t));
  }),
  Eo = f("$ZodIPv4", (e, t) => {
    (t.pattern ?? (t.pattern = Mi),
      ee.init(e, t),
      (e._zod.bag.format = "ipv4"));
  }),
  Oo = f("$ZodIPv6", (e, t) => {
    (t.pattern ?? (t.pattern = Ji),
      ee.init(e, t),
      (e._zod.bag.format = "ipv6"),
      (e._zod.check = (r) => {
        try {
          new URL(`http://[${r.value}]`);
        } catch {
          r.issues.push({
            code: "invalid_format",
            format: "ipv6",
            input: r.value,
            inst: e,
            continue: !t.abort,
          });
        }
      }));
  }),
  Io = f("$ZodCIDRv4", (e, t) => {
    (t.pattern ?? (t.pattern = Gi), ee.init(e, t));
  }),
  Po = f("$ZodCIDRv6", (e, t) => {
    (t.pattern ?? (t.pattern = Bi),
      ee.init(e, t),
      (e._zod.check = (r) => {
        const a = r.value.split("/");
        try {
          if (a.length !== 2) throw new Error();
          const [s, l] = a;
          if (!l) throw new Error();
          const o = Number(l);
          if (`${o}` !== l) throw new Error();
          if (o < 0 || o > 128) throw new Error();
          new URL(`http://[${s}]`);
        } catch {
          r.issues.push({
            code: "invalid_format",
            format: "cidrv6",
            input: r.value,
            inst: e,
            continue: !t.abort,
          });
        }
      }));
  });
function ja(e) {
  if (e === "") return !0;
  if (e.length % 4 !== 0) return !1;
  try {
    return (atob(e), !0);
  } catch {
    return !1;
  }
}
var Lo = f("$ZodBase64", (e, t) => {
  (t.pattern ?? (t.pattern = Ki),
    ee.init(e, t),
    (e._zod.bag.contentEncoding = "base64"),
    (e._zod.check = (r) => {
      ja(r.value) ||
        r.issues.push({
          code: "invalid_format",
          format: "base64",
          input: r.value,
          inst: e,
          continue: !t.abort,
        });
    }));
});
function Zo(e) {
  if (!xa.test(e)) return !1;
  const t = e.replace(/[-_]/g, (r) => (r === "-" ? "+" : "/"));
  return ja(t.padEnd(Math.ceil(t.length / 4) * 4, "="));
}
var To = f("$ZodBase64URL", (e, t) => {
    (t.pattern ?? (t.pattern = xa),
      ee.init(e, t),
      (e._zod.bag.contentEncoding = "base64url"),
      (e._zod.check = (r) => {
        Zo(r.value) ||
          r.issues.push({
            code: "invalid_format",
            format: "base64url",
            input: r.value,
            inst: e,
            continue: !t.abort,
          });
      }));
  }),
  Ro = f("$ZodE164", (e, t) => {
    (t.pattern ?? (t.pattern = Hi), ee.init(e, t));
  });
function Do(e, t = null) {
  try {
    const r = e.split(".");
    if (r.length !== 3) return !1;
    const [a] = r;
    if (!a) return !1;
    const s = JSON.parse(atob(a));
    return !(
      ("typ" in s && s?.typ !== "JWT") ||
      !s.alg ||
      (t && (!("alg" in s) || s.alg !== t))
    );
  } catch {
    return !1;
  }
}
var qo = f("$ZodJWT", (e, t) => {
    (ee.init(e, t),
      (e._zod.check = (r) => {
        Do(r.value, t.alg) ||
          r.issues.push({
            code: "invalid_format",
            format: "jwt",
            input: r.value,
            inst: e,
            continue: !t.abort,
          });
      }));
  }),
  Fo = f("$ZodBoolean", (e, t) => {
    (ie.init(e, t),
      (e._zod.pattern = eo),
      (e._zod.parse = (r, a) => {
        if (t.coerce)
          try {
            r.value = !!r.value;
          } catch {}
        const s = r.value;
        return (
          typeof s == "boolean" ||
            r.issues.push({
              expected: "boolean",
              code: "invalid_type",
              input: s,
              inst: e,
            }),
          r
        );
      }));
  }),
  Uo = f("$ZodUnknown", (e, t) => {
    (ie.init(e, t), (e._zod.parse = (r) => r));
  }),
  Vo = f("$ZodNever", (e, t) => {
    (ie.init(e, t),
      (e._zod.parse = (r, a) => (
        r.issues.push({
          expected: "never",
          code: "invalid_type",
          input: r.value,
          inst: e,
        }),
        r
      )));
  });
function Ln(e, t, r) {
  (e.issues.length && t.issues.push(...ga(r, e.issues)),
    (t.value[r] = e.value));
}
var Mo = f("$ZodArray", (e, t) => {
  (ie.init(e, t),
    (e._zod.parse = (r, a) => {
      const s = r.value;
      if (!Array.isArray(s))
        return (
          r.issues.push({
            expected: "array",
            code: "invalid_type",
            input: s,
            inst: e,
          }),
          r
        );
      r.value = Array(s.length);
      const l = [];
      for (let o = 0; o < s.length; o++) {
        const u = s[o],
          d = t.element._zod.run({ value: u, issues: [] }, a);
        d instanceof Promise ? l.push(d.then((v) => Ln(v, r, o))) : Ln(d, r, o);
      }
      return l.length ? Promise.all(l).then(() => r) : r;
    }));
});
function Qt(e, t, r, a, s) {
  if (e.issues.length) {
    if (s && !(r in a)) return;
    t.issues.push(...ga(r, e.issues));
  }
  e.value === void 0 ? r in a && (t.value[r] = void 0) : (t.value[r] = e.value);
}
function Na(e) {
  const t = Object.keys(e.shape);
  for (const a of t)
    if (!e.shape?.[a]?._zod?.traits?.has("$ZodType"))
      throw new Error(`Invalid element at key "${a}": expected a Zod schema`);
  const r = mi(e.shape);
  return {
    ...e,
    keys: t,
    keySet: new Set(t),
    numKeys: t.length,
    optionalKeys: new Set(r),
  };
}
function wa(e, t, r, a, s, l) {
  const o = [],
    u = s.keySet,
    d = s.catchall._zod,
    v = d.def.type,
    x = d.optout === "optional";
  for (const A in t) {
    if (u.has(A)) continue;
    if (v === "never") {
      o.push(A);
      continue;
    }
    const N = d.run({ value: t[A], issues: [] }, a);
    N instanceof Promise
      ? e.push(N.then((j) => Qt(j, r, A, t, x)))
      : Qt(N, r, A, t, x);
  }
  return (
    o.length &&
      r.issues.push({ code: "unrecognized_keys", keys: o, input: t, inst: l }),
    e.length ? Promise.all(e).then(() => r) : r
  );
}
var Jo = f("$ZodObject", (e, t) => {
    if ((ie.init(e, t), !Object.getOwnPropertyDescriptor(t, "shape")?.get)) {
      const o = t.shape;
      Object.defineProperty(t, "shape", {
        get: () => {
          const u = { ...o };
          return (Object.defineProperty(t, "shape", { value: u }), u);
        },
      });
    }
    const r = Vr(() => Na(t));
    J(e._zod, "propValues", () => {
      const o = t.shape,
        u = {};
      for (const d in o) {
        const v = o[d]._zod;
        if (v.values) {
          u[d] ?? (u[d] = new Set());
          for (const x of v.values) u[d].add(x);
        }
      }
      return u;
    });
    const a = Wt,
      s = t.catchall;
    let l;
    e._zod.parse = (o, u) => {
      l ?? (l = r.value);
      const d = o.value;
      if (!a(d))
        return (
          o.issues.push({
            expected: "object",
            code: "invalid_type",
            input: d,
            inst: e,
          }),
          o
        );
      o.value = {};
      const v = [],
        x = l.shape;
      for (const A of l.keys) {
        const N = x[A],
          j = N._zod.optout === "optional",
          F = N._zod.run({ value: d[A], issues: [] }, u);
        F instanceof Promise
          ? v.push(F.then((pe) => Qt(pe, o, A, d, j)))
          : Qt(F, o, A, d, j);
      }
      return s
        ? wa(v, d, o, u, r.value, e)
        : v.length
          ? Promise.all(v).then(() => o)
          : o;
    };
  }),
  Go = f("$ZodObjectJIT", (e, t) => {
    Jo.init(e, t);
    const r = e._zod.parse,
      a = Vr(() => Na(t)),
      s = (N) => {
        const j = new fo(["shape", "payload", "ctx"]),
          F = a.value,
          pe = (C) => {
            const ne = In(C);
            return `shape[${ne}]._zod.run({ value: input[${ne}], issues: [] }, ctx)`;
          };
        j.write("const input = payload.value;");
        const re = Object.create(null);
        let me = 0;
        for (const C of F.keys) re[C] = `key_${me++}`;
        j.write("const newResult = {};");
        for (const C of F.keys) {
          const ne = re[C],
            H = In(C),
            k = N[C]?._zod?.optout === "optional";
          (j.write(`const ${ne} = ${pe(C)};`),
            k
              ? j.write(`
        if (${ne}.issues.length) {
          if (${H} in input) {
            payload.issues = payload.issues.concat(${ne}.issues.map(iss => ({
              ...iss,
              path: iss.path ? [${H}, ...iss.path] : [${H}]
            })));
          }
        }
        
        if (${ne}.value === undefined) {
          if (${H} in input) {
            newResult[${H}] = undefined;
          }
        } else {
          newResult[${H}] = ${ne}.value;
        }
        
      `)
              : j.write(`
        if (${ne}.issues.length) {
          payload.issues = payload.issues.concat(${ne}.issues.map(iss => ({
            ...iss,
            path: iss.path ? [${H}, ...iss.path] : [${H}]
          })));
        }
        
        if (${ne}.value === undefined) {
          if (${H} in input) {
            newResult[${H}] = undefined;
          }
        } else {
          newResult[${H}] = ${ne}.value;
        }
        
      `));
        }
        (j.write("payload.value = newResult;"), j.write("return payload;"));
        const g = j.compile();
        return (C, ne) => g(N, C, ne);
      };
    let l;
    const o = Wt,
      u = !Tr.jitless,
      v = u && di.value,
      x = t.catchall;
    let A;
    e._zod.parse = (N, j) => {
      A ?? (A = a.value);
      const F = N.value;
      return o(F)
        ? u && v && j?.async === !1 && j.jitless !== !0
          ? (l || (l = s(t.shape)),
            (N = l(N, j)),
            x ? wa([], F, N, j, A, e) : N)
          : r(N, j)
        : (N.issues.push({
            expected: "object",
            code: "invalid_type",
            input: F,
            inst: e,
          }),
          N);
    };
  });
function Zn(e, t, r, a) {
  for (const l of e) if (l.issues.length === 0) return ((t.value = l.value), t);
  const s = e.filter((l) => !st(l));
  return s.length === 1
    ? ((t.value = s[0].value), s[0])
    : (t.issues.push({
        code: "invalid_union",
        input: t.value,
        inst: r,
        errors: e.map((l) => l.issues.map((o) => Be(o, a, Ge()))),
      }),
      t);
}
var Bo = f("$ZodUnion", (e, t) => {
    (ie.init(e, t),
      J(e._zod, "optin", () =>
        t.options.some((s) => s._zod.optin === "optional")
          ? "optional"
          : void 0,
      ),
      J(e._zod, "optout", () =>
        t.options.some((s) => s._zod.optout === "optional")
          ? "optional"
          : void 0,
      ),
      J(e._zod, "values", () => {
        if (t.options.every((s) => s._zod.values))
          return new Set(t.options.flatMap((s) => Array.from(s._zod.values)));
      }),
      J(e._zod, "pattern", () => {
        if (t.options.every((s) => s._zod.pattern)) {
          const s = t.options.map((l) => l._zod.pattern);
          return new RegExp(`^(${s.map((l) => Jr(l.source)).join("|")})$`);
        }
      }));
    const r = t.options.length === 1,
      a = t.options[0]._zod.run;
    e._zod.parse = (s, l) => {
      if (r) return a(s, l);
      let o = !1;
      const u = [];
      for (const d of t.options) {
        const v = d._zod.run({ value: s.value, issues: [] }, l);
        if (v instanceof Promise) (u.push(v), (o = !0));
        else {
          if (v.issues.length === 0) return v;
          u.push(v);
        }
      }
      return o ? Promise.all(u).then((d) => Zn(d, s, e, l)) : Zn(u, s, e, l);
    };
  }),
  Ko = f("$ZodIntersection", (e, t) => {
    (ie.init(e, t),
      (e._zod.parse = (r, a) => {
        const s = r.value,
          l = t.left._zod.run({ value: s, issues: [] }, a),
          o = t.right._zod.run({ value: s, issues: [] }, a);
        return l instanceof Promise || o instanceof Promise
          ? Promise.all([l, o]).then(([u, d]) => Tn(r, u, d))
          : Tn(r, l, o);
      }));
  });
function Dr(e, t) {
  if (e === t) return { valid: !0, data: e };
  if (e instanceof Date && t instanceof Date && +e == +t)
    return { valid: !0, data: e };
  if (vt(e) && vt(t)) {
    const r = Object.keys(t),
      a = Object.keys(e).filter((l) => r.indexOf(l) !== -1),
      s = { ...e, ...t };
    for (const l of a) {
      const o = Dr(e[l], t[l]);
      if (!o.valid)
        return { valid: !1, mergeErrorPath: [l, ...o.mergeErrorPath] };
      s[l] = o.data;
    }
    return { valid: !0, data: s };
  }
  if (Array.isArray(e) && Array.isArray(t)) {
    if (e.length !== t.length) return { valid: !1, mergeErrorPath: [] };
    const r = [];
    for (let a = 0; a < e.length; a++) {
      const s = e[a],
        l = t[a],
        o = Dr(s, l);
      if (!o.valid)
        return { valid: !1, mergeErrorPath: [a, ...o.mergeErrorPath] };
      r.push(o.data);
    }
    return { valid: !0, data: r };
  }
  return { valid: !1, mergeErrorPath: [] };
}
function Tn(e, t, r) {
  const a = new Map();
  let s;
  for (const u of t.issues)
    if (u.code === "unrecognized_keys") {
      s ?? (s = u);
      for (const d of u.keys) (a.has(d) || a.set(d, {}), (a.get(d).l = !0));
    } else e.issues.push(u);
  for (const u of r.issues)
    if (u.code === "unrecognized_keys")
      for (const d of u.keys) (a.has(d) || a.set(d, {}), (a.get(d).r = !0));
    else e.issues.push(u);
  const l = [...a].filter(([, u]) => u.l && u.r).map(([u]) => u);
  if ((l.length && s && e.issues.push({ ...s, keys: l }), st(e))) return e;
  const o = Dr(t.value, r.value);
  if (!o.valid)
    throw new Error(
      `Unmergable intersection. Error path: ${JSON.stringify(o.mergeErrorPath)}`,
    );
  return ((e.value = o.data), e);
}
var Ho = f("$ZodEnum", (e, t) => {
    ie.init(e, t);
    const r = pa(t.entries),
      a = new Set(r);
    ((e._zod.values = a),
      (e._zod.pattern = new RegExp(
        `^(${r
          .filter((s) => pi.has(typeof s))
          .map((s) => (typeof s == "string" ? tr(s) : s.toString()))
          .join("|")})$`,
      )),
      (e._zod.parse = (s, l) => {
        const o = s.value;
        return (
          a.has(o) ||
            s.issues.push({
              code: "invalid_value",
              values: r,
              input: o,
              inst: e,
            }),
          s
        );
      }));
  }),
  Wo = f("$ZodTransform", (e, t) => {
    (ie.init(e, t),
      (e._zod.parse = (r, a) => {
        if (a.direction === "backward") throw new da(e.constructor.name);
        const s = t.transform(r.value, r);
        if (a.async)
          return (s instanceof Promise ? s : Promise.resolve(s)).then(
            (l) => ((r.value = l), r),
          );
        if (s instanceof Promise) throw new it();
        return ((r.value = s), r);
      }));
  });
function Rn(e, t) {
  return e.issues.length && t === void 0 ? { issues: [], value: void 0 } : e;
}
var Sa = f("$ZodOptional", (e, t) => {
    (ie.init(e, t),
      (e._zod.optin = "optional"),
      (e._zod.optout = "optional"),
      J(e._zod, "values", () =>
        t.innerType._zod.values
          ? new Set([...t.innerType._zod.values, void 0])
          : void 0,
      ),
      J(e._zod, "pattern", () => {
        const r = t.innerType._zod.pattern;
        return r ? new RegExp(`^(${Jr(r.source)})?$`) : void 0;
      }),
      (e._zod.parse = (r, a) => {
        if (t.innerType._zod.optin === "optional") {
          const s = t.innerType._zod.run(r, a);
          return s instanceof Promise
            ? s.then((l) => Rn(l, r.value))
            : Rn(s, r.value);
        }
        return r.value === void 0 ? r : t.innerType._zod.run(r, a);
      }));
  }),
  Qo = f("$ZodExactOptional", (e, t) => {
    (Sa.init(e, t),
      J(e._zod, "values", () => t.innerType._zod.values),
      J(e._zod, "pattern", () => t.innerType._zod.pattern),
      (e._zod.parse = (r, a) => t.innerType._zod.run(r, a)));
  }),
  Xo = f("$ZodNullable", (e, t) => {
    (ie.init(e, t),
      J(e._zod, "optin", () => t.innerType._zod.optin),
      J(e._zod, "optout", () => t.innerType._zod.optout),
      J(e._zod, "pattern", () => {
        const r = t.innerType._zod.pattern;
        return r ? new RegExp(`^(${Jr(r.source)}|null)$`) : void 0;
      }),
      J(e._zod, "values", () =>
        t.innerType._zod.values
          ? new Set([...t.innerType._zod.values, null])
          : void 0,
      ),
      (e._zod.parse = (r, a) =>
        r.value === null ? r : t.innerType._zod.run(r, a)));
  }),
  Yo = f("$ZodDefault", (e, t) => {
    (ie.init(e, t),
      (e._zod.optin = "optional"),
      J(e._zod, "values", () => t.innerType._zod.values),
      (e._zod.parse = (r, a) => {
        if (a.direction === "backward") return t.innerType._zod.run(r, a);
        if (r.value === void 0) return ((r.value = t.defaultValue), r);
        const s = t.innerType._zod.run(r, a);
        return s instanceof Promise ? s.then((l) => Dn(l, t)) : Dn(s, t);
      }));
  });
function Dn(e, t) {
  return (e.value === void 0 && (e.value = t.defaultValue), e);
}
var el = f("$ZodPrefault", (e, t) => {
    (ie.init(e, t),
      (e._zod.optin = "optional"),
      J(e._zod, "values", () => t.innerType._zod.values),
      (e._zod.parse = (r, a) => (
        a.direction === "backward" ||
          (r.value === void 0 && (r.value = t.defaultValue)),
        t.innerType._zod.run(r, a)
      )));
  }),
  tl = f("$ZodNonOptional", (e, t) => {
    (ie.init(e, t),
      J(e._zod, "values", () => {
        const r = t.innerType._zod.values;
        return r ? new Set([...r].filter((a) => a !== void 0)) : void 0;
      }),
      (e._zod.parse = (r, a) => {
        const s = t.innerType._zod.run(r, a);
        return s instanceof Promise ? s.then((l) => qn(l, e)) : qn(s, e);
      }));
  });
function qn(e, t) {
  return (
    !e.issues.length &&
      e.value === void 0 &&
      e.issues.push({
        code: "invalid_type",
        expected: "nonoptional",
        input: e.value,
        inst: t,
      }),
    e
  );
}
var rl = f("$ZodCatch", (e, t) => {
    (ie.init(e, t),
      J(e._zod, "optin", () => t.innerType._zod.optin),
      J(e._zod, "optout", () => t.innerType._zod.optout),
      J(e._zod, "values", () => t.innerType._zod.values),
      (e._zod.parse = (r, a) => {
        if (a.direction === "backward") return t.innerType._zod.run(r, a);
        const s = t.innerType._zod.run(r, a);
        return s instanceof Promise
          ? s.then(
              (l) => (
                (r.value = l.value),
                l.issues.length &&
                  ((r.value = t.catchValue({
                    ...r,
                    error: { issues: l.issues.map((o) => Be(o, a, Ge())) },
                    input: r.value,
                  })),
                  (r.issues = [])),
                r
              ),
            )
          : ((r.value = s.value),
            s.issues.length &&
              ((r.value = t.catchValue({
                ...r,
                error: { issues: s.issues.map((l) => Be(l, a, Ge())) },
                input: r.value,
              })),
              (r.issues = [])),
            r);
      }));
  }),
  nl = f("$ZodPipe", (e, t) => {
    (ie.init(e, t),
      J(e._zod, "values", () => t.in._zod.values),
      J(e._zod, "optin", () => t.in._zod.optin),
      J(e._zod, "optout", () => t.out._zod.optout),
      J(e._zod, "propValues", () => t.in._zod.propValues),
      (e._zod.parse = (r, a) => {
        if (a.direction === "backward") {
          const l = t.out._zod.run(r, a);
          return l instanceof Promise
            ? l.then((o) => Ft(o, t.in, a))
            : Ft(l, t.in, a);
        }
        const s = t.in._zod.run(r, a);
        return s instanceof Promise
          ? s.then((l) => Ft(l, t.out, a))
          : Ft(s, t.out, a);
      }));
  });
function Ft(e, t, r) {
  return e.issues.length
    ? ((e.aborted = !0), e)
    : t._zod.run({ value: e.value, issues: e.issues }, r);
}
var al = f("$ZodReadonly", (e, t) => {
  (ie.init(e, t),
    J(e._zod, "propValues", () => t.innerType._zod.propValues),
    J(e._zod, "values", () => t.innerType._zod.values),
    J(e._zod, "optin", () => t.innerType?._zod?.optin),
    J(e._zod, "optout", () => t.innerType?._zod?.optout),
    (e._zod.parse = (r, a) => {
      if (a.direction === "backward") return t.innerType._zod.run(r, a);
      const s = t.innerType._zod.run(r, a);
      return s instanceof Promise ? s.then(Fn) : Fn(s);
    }));
});
function Fn(e) {
  return ((e.value = Object.freeze(e.value)), e);
}
var sl = f("$ZodCustom", (e, t) => {
  (Ee.init(e, t),
    ie.init(e, t),
    (e._zod.parse = (r, a) => r),
    (e._zod.check = (r) => {
      const a = r.value,
        s = t.fn(a);
      if (s instanceof Promise) return s.then((l) => Un(l, r, a, e));
      Un(s, r, a, e);
    }));
});
function Un(e, t, r, a) {
  if (!e) {
    const s = {
      code: "custom",
      input: r,
      inst: a,
      path: [...(a._zod.def.path ?? [])],
      continue: !a._zod.def.abort,
    };
    (a._zod.def.params && (s.params = a._zod.def.params), t.issues.push(xt(s)));
  }
}
var Vn,
  il = class {
    constructor() {
      ((this._map = new WeakMap()), (this._idmap = new Map()));
    }
    add(e, ...t) {
      const r = t[0];
      return (
        this._map.set(e, r),
        r && typeof r == "object" && "id" in r && this._idmap.set(r.id, e),
        this
      );
    }
    clear() {
      return ((this._map = new WeakMap()), (this._idmap = new Map()), this);
    }
    remove(e) {
      const t = this._map.get(e);
      return (
        t && typeof t == "object" && "id" in t && this._idmap.delete(t.id),
        this._map.delete(e),
        this
      );
    }
    get(e) {
      const t = e._zod.parent;
      if (t) {
        const r = { ...(this.get(t) ?? {}) };
        delete r.id;
        const a = { ...r, ...this._map.get(e) };
        return Object.keys(a).length ? a : void 0;
      }
      return this._map.get(e);
    }
    has(e) {
      return this._map.has(e);
    }
  };
function ol() {
  return new il();
}
(Vn = globalThis).__zod_globalRegistry ?? (Vn.__zod_globalRegistry = ol());
var _t = globalThis.__zod_globalRegistry;
function ll(e, t) {
  return new e({ type: "string", ...O(t) });
}
function cl(e, t) {
  return new e({
    type: "string",
    format: "email",
    check: "string_format",
    abort: !1,
    ...O(t),
  });
}
function Mn(e, t) {
  return new e({
    type: "string",
    format: "guid",
    check: "string_format",
    abort: !1,
    ...O(t),
  });
}
function ul(e, t) {
  return new e({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: !1,
    ...O(t),
  });
}
function dl(e, t) {
  return new e({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: !1,
    version: "v4",
    ...O(t),
  });
}
function pl(e, t) {
  return new e({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: !1,
    version: "v6",
    ...O(t),
  });
}
function ml(e, t) {
  return new e({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: !1,
    version: "v7",
    ...O(t),
  });
}
function fl(e, t) {
  return new e({
    type: "string",
    format: "url",
    check: "string_format",
    abort: !1,
    ...O(t),
  });
}
function gl(e, t) {
  return new e({
    type: "string",
    format: "emoji",
    check: "string_format",
    abort: !1,
    ...O(t),
  });
}
function hl(e, t) {
  return new e({
    type: "string",
    format: "nanoid",
    check: "string_format",
    abort: !1,
    ...O(t),
  });
}
function _l(e, t) {
  return new e({
    type: "string",
    format: "cuid",
    check: "string_format",
    abort: !1,
    ...O(t),
  });
}
function vl(e, t) {
  return new e({
    type: "string",
    format: "cuid2",
    check: "string_format",
    abort: !1,
    ...O(t),
  });
}
function xl(e, t) {
  return new e({
    type: "string",
    format: "ulid",
    check: "string_format",
    abort: !1,
    ...O(t),
  });
}
function bl(e, t) {
  return new e({
    type: "string",
    format: "xid",
    check: "string_format",
    abort: !1,
    ...O(t),
  });
}
function yl(e, t) {
  return new e({
    type: "string",
    format: "ksuid",
    check: "string_format",
    abort: !1,
    ...O(t),
  });
}
function jl(e, t) {
  return new e({
    type: "string",
    format: "ipv4",
    check: "string_format",
    abort: !1,
    ...O(t),
  });
}
function Nl(e, t) {
  return new e({
    type: "string",
    format: "ipv6",
    check: "string_format",
    abort: !1,
    ...O(t),
  });
}
function wl(e, t) {
  return new e({
    type: "string",
    format: "cidrv4",
    check: "string_format",
    abort: !1,
    ...O(t),
  });
}
function Sl(e, t) {
  return new e({
    type: "string",
    format: "cidrv6",
    check: "string_format",
    abort: !1,
    ...O(t),
  });
}
function zl(e, t) {
  return new e({
    type: "string",
    format: "base64",
    check: "string_format",
    abort: !1,
    ...O(t),
  });
}
function kl(e, t) {
  return new e({
    type: "string",
    format: "base64url",
    check: "string_format",
    abort: !1,
    ...O(t),
  });
}
function Al(e, t) {
  return new e({
    type: "string",
    format: "e164",
    check: "string_format",
    abort: !1,
    ...O(t),
  });
}
function $l(e, t) {
  return new e({
    type: "string",
    format: "jwt",
    check: "string_format",
    abort: !1,
    ...O(t),
  });
}
function Cl(e, t) {
  return new e({
    type: "string",
    format: "datetime",
    check: "string_format",
    offset: !1,
    local: !1,
    precision: null,
    ...O(t),
  });
}
function El(e, t) {
  return new e({
    type: "string",
    format: "date",
    check: "string_format",
    ...O(t),
  });
}
function Ol(e, t) {
  return new e({
    type: "string",
    format: "time",
    check: "string_format",
    precision: null,
    ...O(t),
  });
}
function Il(e, t) {
  return new e({
    type: "string",
    format: "duration",
    check: "string_format",
    ...O(t),
  });
}
function Pl(e, t) {
  return new e({ type: "boolean", ...O(t) });
}
function Ll(e) {
  return new e({ type: "unknown" });
}
function Zl(e, t) {
  return new e({ type: "never", ...O(t) });
}
function za(e, t) {
  return new no({ check: "max_length", ...O(t), maximum: e });
}
function Xt(e, t) {
  return new ao({ check: "min_length", ...O(t), minimum: e });
}
function ka(e, t) {
  return new so({ check: "length_equals", ...O(t), length: e });
}
function Tl(e, t) {
  return new io({
    check: "string_format",
    format: "regex",
    ...O(t),
    pattern: e,
  });
}
function Rl(e) {
  return new oo({ check: "string_format", format: "lowercase", ...O(e) });
}
function Dl(e) {
  return new lo({ check: "string_format", format: "uppercase", ...O(e) });
}
function ql(e, t) {
  return new co({
    check: "string_format",
    format: "includes",
    ...O(t),
    includes: e,
  });
}
function Fl(e, t) {
  return new uo({
    check: "string_format",
    format: "starts_with",
    ...O(t),
    prefix: e,
  });
}
function Ul(e, t) {
  return new po({
    check: "string_format",
    format: "ends_with",
    ...O(t),
    suffix: e,
  });
}
function ot(e) {
  return new mo({ check: "overwrite", tx: e });
}
function Vl(e) {
  return ot((t) => t.normalize(e));
}
function Ml() {
  return ot((e) => e.trim());
}
function Jl() {
  return ot((e) => e.toLowerCase());
}
function Gl() {
  return ot((e) => e.toUpperCase());
}
function Bl() {
  return ot((e) => ui(e));
}
function Kl(e, t, r) {
  return new e({ type: "array", element: t, ...O(r) });
}
function Hl(e, t, r) {
  return new e({ type: "custom", check: "custom", fn: t, ...O(r) });
}
function Wl(e) {
  const t = Ql(
    (r) => (
      (r.addIssue = (a) => {
        if (typeof a == "string") r.issues.push(xt(a, r.value, t._zod.def));
        else {
          const s = a;
          (s.fatal && (s.continue = !1),
            s.code ?? (s.code = "custom"),
            s.input ?? (s.input = r.value),
            s.inst ?? (s.inst = t),
            s.continue ?? (s.continue = !t._zod.def.abort),
            r.issues.push(xt(s)));
        }
      }),
      e(r.value, r)
    ),
  );
  return t;
}
function Ql(e, t) {
  const r = new Ee({ check: "custom", ...O(t) });
  return ((r._zod.check = e), r);
}
function Aa(e) {
  let t = e?.target ?? "draft-2020-12";
  return (
    t === "draft-4" && (t = "draft-04"),
    t === "draft-7" && (t = "draft-07"),
    {
      processors: e.processors ?? {},
      metadataRegistry: e?.metadata ?? _t,
      target: t,
      unrepresentable: e?.unrepresentable ?? "throw",
      override: e?.override ?? (() => {}),
      io: e?.io ?? "output",
      counter: 0,
      seen: new Map(),
      cycles: e?.cycles ?? "ref",
      reused: e?.reused ?? "inline",
      external: e?.external ?? void 0,
    }
  );
}
function de(e, t, r = { path: [], schemaPath: [] }) {
  var a;
  const s = e._zod.def,
    l = t.seen.get(e);
  if (l)
    return (
      l.count++,
      r.schemaPath.includes(e) && (l.cycle = r.path),
      l.schema
    );
  const o = { schema: {}, count: 1, cycle: void 0, path: r.path };
  t.seen.set(e, o);
  const u = e._zod.toJSONSchema?.();
  if (u) o.schema = u;
  else {
    const v = { ...r, schemaPath: [...r.schemaPath, e], path: r.path };
    if (e._zod.processJSONSchema) e._zod.processJSONSchema(t, o.schema, v);
    else {
      const A = o.schema,
        N = t.processors[s.type];
      if (!N)
        throw new Error(
          `[toJSONSchema]: Non-representable type encountered: ${s.type}`,
        );
      N(e, t, A, v);
    }
    const x = e._zod.parent;
    x && (o.ref || (o.ref = x), de(x, t, v), (t.seen.get(x).isParent = !0));
  }
  const d = t.metadataRegistry.get(e);
  return (
    d && Object.assign(o.schema, d),
    t.io === "input" &&
      _e(e) &&
      (delete o.schema.examples, delete o.schema.default),
    t.io === "input" &&
      o.schema._prefault &&
      ((a = o.schema).default ?? (a.default = o.schema._prefault)),
    delete o.schema._prefault,
    t.seen.get(e).schema
  );
}
function $a(e, t) {
  const r = e.seen.get(t);
  if (!r) throw new Error("Unprocessed schema. This is a bug in Zod.");
  const a = new Map();
  for (const o of e.seen.entries()) {
    const u = e.metadataRegistry.get(o[0])?.id;
    if (u) {
      const d = a.get(u);
      if (d && d !== o[0])
        throw new Error(
          `Duplicate schema id "${u}" detected during JSON Schema conversion. Two different schemas cannot share the same id when converted together.`,
        );
      a.set(u, o[0]);
    }
  }
  const s = (o) => {
      const u = e.target === "draft-2020-12" ? "$defs" : "definitions";
      if (e.external) {
        const x = e.external.registry.get(o[0])?.id,
          A = e.external.uri ?? ((j) => j);
        if (x) return { ref: A(x) };
        const N = o[1].defId ?? o[1].schema.id ?? `schema${e.counter++}`;
        return (
          (o[1].defId = N),
          { defId: N, ref: `${A("__shared")}#/${u}/${N}` }
        );
      }
      if (o[1] === r) return { ref: "#" };
      const d = `#/${u}/`,
        v = o[1].schema.id ?? `__schema${e.counter++}`;
      return { defId: v, ref: d + v };
    },
    l = (o) => {
      if (o[1].schema.$ref) return;
      const u = o[1],
        { ref: d, defId: v } = s(o);
      ((u.def = { ...u.schema }), v && (u.defId = v));
      const x = u.schema;
      for (const A in x) delete x[A];
      x.$ref = d;
    };
  if (e.cycles === "throw")
    for (const o of e.seen.entries()) {
      const u = o[1];
      if (u.cycle)
        throw new Error(`Cycle detected: #/${u.cycle?.join("/")}/<root>

Set the \`cycles\` parameter to \`"ref"\` to resolve cyclical schemas with defs.`);
    }
  for (const o of e.seen.entries()) {
    const u = o[1];
    if (t === o[0]) {
      l(o);
      continue;
    }
    if (e.external) {
      const d = e.external.registry.get(o[0])?.id;
      if (t !== o[0] && d) {
        l(o);
        continue;
      }
    }
    if (e.metadataRegistry.get(o[0])?.id) {
      l(o);
      continue;
    }
    if (u.cycle) {
      l(o);
      continue;
    }
    if (u.count > 1 && e.reused === "ref") {
      l(o);
      continue;
    }
  }
}
function Ca(e, t) {
  const r = e.seen.get(t);
  if (!r) throw new Error("Unprocessed schema. This is a bug in Zod.");
  const a = (o) => {
    const u = e.seen.get(o);
    if (u.ref === null) return;
    const d = u.def ?? u.schema,
      v = { ...d },
      x = u.ref;
    if (((u.ref = null), x)) {
      a(x);
      const N = e.seen.get(x),
        j = N.schema;
      if (
        (j.$ref &&
        (e.target === "draft-07" ||
          e.target === "draft-04" ||
          e.target === "openapi-3.0")
          ? ((d.allOf = d.allOf ?? []), d.allOf.push(j))
          : Object.assign(d, j),
        Object.assign(d, v),
        o._zod.parent === x)
      )
        for (const F in d)
          F === "$ref" || F === "allOf" || F in v || delete d[F];
      if (j.$ref && N.def)
        for (const F in d)
          F === "$ref" ||
            F === "allOf" ||
            (F in N.def &&
              JSON.stringify(d[F]) === JSON.stringify(N.def[F]) &&
              delete d[F]);
    }
    const A = o._zod.parent;
    if (A && A !== x) {
      a(A);
      const N = e.seen.get(A);
      if (N?.schema.$ref && ((d.$ref = N.schema.$ref), N.def))
        for (const j in d)
          j === "$ref" ||
            j === "allOf" ||
            (j in N.def &&
              JSON.stringify(d[j]) === JSON.stringify(N.def[j]) &&
              delete d[j]);
    }
    e.override({ zodSchema: o, jsonSchema: d, path: u.path ?? [] });
  };
  for (const o of [...e.seen.entries()].reverse()) a(o[0]);
  const s = {};
  if (
    (e.target === "draft-2020-12"
      ? (s.$schema = "https://json-schema.org/draft/2020-12/schema")
      : e.target === "draft-07"
        ? (s.$schema = "http://json-schema.org/draft-07/schema#")
        : e.target === "draft-04"
          ? (s.$schema = "http://json-schema.org/draft-04/schema#")
          : e.target,
    e.external?.uri)
  ) {
    const o = e.external.registry.get(t)?.id;
    if (!o) throw new Error("Schema is missing an `id` property");
    s.$id = e.external.uri(o);
  }
  Object.assign(s, r.def ?? r.schema);
  const l = e.external?.defs ?? {};
  for (const o of e.seen.entries()) {
    const u = o[1];
    u.def && u.defId && (l[u.defId] = u.def);
  }
  e.external ||
    (Object.keys(l).length > 0 &&
      (e.target === "draft-2020-12" ? (s.$defs = l) : (s.definitions = l)));
  try {
    const o = JSON.parse(JSON.stringify(s));
    return (
      Object.defineProperty(o, "~standard", {
        value: {
          ...t["~standard"],
          jsonSchema: {
            input: Yt(t, "input", e.processors),
            output: Yt(t, "output", e.processors),
          },
        },
        enumerable: !1,
        writable: !1,
      }),
      o
    );
  } catch {
    throw new Error("Error converting schema to JSON.");
  }
}
function _e(e, t) {
  const r = t ?? { seen: new Set() };
  if (r.seen.has(e)) return !1;
  r.seen.add(e);
  const a = e._zod.def;
  if (a.type === "transform") return !0;
  if (a.type === "array") return _e(a.element, r);
  if (a.type === "set") return _e(a.valueType, r);
  if (a.type === "lazy") return _e(a.getter(), r);
  if (
    a.type === "promise" ||
    a.type === "optional" ||
    a.type === "nonoptional" ||
    a.type === "nullable" ||
    a.type === "readonly" ||
    a.type === "default" ||
    a.type === "prefault"
  )
    return _e(a.innerType, r);
  if (a.type === "intersection") return _e(a.left, r) || _e(a.right, r);
  if (a.type === "record" || a.type === "map")
    return _e(a.keyType, r) || _e(a.valueType, r);
  if (a.type === "pipe") return _e(a.in, r) || _e(a.out, r);
  if (a.type === "object") {
    for (const s in a.shape) if (_e(a.shape[s], r)) return !0;
    return !1;
  }
  if (a.type === "union") {
    for (const s of a.options) if (_e(s, r)) return !0;
    return !1;
  }
  if (a.type === "tuple") {
    for (const s of a.items) if (_e(s, r)) return !0;
    return !!(a.rest && _e(a.rest, r));
  }
  return !1;
}
var Xl =
    (e, t = {}) =>
    (r) => {
      const a = Aa({ ...r, processors: t });
      return (de(e, a), $a(a, e), Ca(a, e));
    },
  Yt =
    (e, t, r = {}) =>
    (a) => {
      const { libraryOptions: s, target: l } = a ?? {},
        o = Aa({ ...(s ?? {}), target: l, io: t, processors: r });
      return (de(e, o), $a(o, e), Ca(o, e));
    },
  Yl = {
    guid: "uuid",
    url: "uri",
    datetime: "date-time",
    json_string: "json-string",
    regex: "",
  },
  ec = (e, t, r, a) => {
    const s = r;
    s.type = "string";
    const {
      minimum: l,
      maximum: o,
      format: u,
      patterns: d,
      contentEncoding: v,
    } = e._zod.bag;
    if (
      (typeof l == "number" && (s.minLength = l),
      typeof o == "number" && (s.maxLength = o),
      u &&
        ((s.format = Yl[u] ?? u),
        s.format === "" && delete s.format,
        u === "time" && delete s.format),
      v && (s.contentEncoding = v),
      d && d.size > 0)
    ) {
      const x = [...d];
      x.length === 1
        ? (s.pattern = x[0].source)
        : x.length > 1 &&
          (s.allOf = [
            ...x.map((A) => ({
              ...(t.target === "draft-07" ||
              t.target === "draft-04" ||
              t.target === "openapi-3.0"
                ? { type: "string" }
                : {}),
              pattern: A.source,
            })),
          ]);
    }
  },
  tc = (e, t, r, a) => {
    r.type = "boolean";
  },
  rc = (e, t, r, a) => {
    r.not = {};
  },
  nc = (e, t, r, a) => {},
  ac = (e, t, r, a) => {
    const s = e._zod.def,
      l = pa(s.entries);
    (l.every((o) => typeof o == "number") && (r.type = "number"),
      l.every((o) => typeof o == "string") && (r.type = "string"),
      (r.enum = l));
  },
  sc = (e, t, r, a) => {
    if (t.unrepresentable === "throw")
      throw new Error("Custom types cannot be represented in JSON Schema");
  },
  ic = (e, t, r, a) => {
    if (t.unrepresentable === "throw")
      throw new Error("Transforms cannot be represented in JSON Schema");
  },
  oc = (e, t, r, a) => {
    const s = r,
      l = e._zod.def,
      { minimum: o, maximum: u } = e._zod.bag;
    (typeof o == "number" && (s.minItems = o),
      typeof u == "number" && (s.maxItems = u),
      (s.type = "array"),
      (s.items = de(l.element, t, { ...a, path: [...a.path, "items"] })));
  },
  lc = (e, t, r, a) => {
    const s = r,
      l = e._zod.def;
    ((s.type = "object"), (s.properties = {}));
    const o = l.shape;
    for (const v in o)
      s.properties[v] = de(o[v], t, {
        ...a,
        path: [...a.path, "properties", v],
      });
    const u = new Set(Object.keys(o)),
      d = new Set(
        [...u].filter((v) => {
          const x = l.shape[v]._zod;
          return t.io === "input" ? x.optin === void 0 : x.optout === void 0;
        }),
      );
    (d.size > 0 && (s.required = Array.from(d)),
      l.catchall?._zod.def.type === "never"
        ? (s.additionalProperties = !1)
        : l.catchall
          ? l.catchall &&
            (s.additionalProperties = de(l.catchall, t, {
              ...a,
              path: [...a.path, "additionalProperties"],
            }))
          : t.io === "output" && (s.additionalProperties = !1));
  },
  cc = (e, t, r, a) => {
    const s = e._zod.def,
      l = s.inclusive === !1,
      o = s.options.map((u, d) =>
        de(u, t, { ...a, path: [...a.path, l ? "oneOf" : "anyOf", d] }),
      );
    l ? (r.oneOf = o) : (r.anyOf = o);
  },
  uc = (e, t, r, a) => {
    const s = e._zod.def,
      l = de(s.left, t, { ...a, path: [...a.path, "allOf", 0] }),
      o = de(s.right, t, { ...a, path: [...a.path, "allOf", 1] }),
      u = (d) => "allOf" in d && Object.keys(d).length === 1;
    r.allOf = [...(u(l) ? l.allOf : [l]), ...(u(o) ? o.allOf : [o])];
  },
  dc = (e, t, r, a) => {
    const s = e._zod.def,
      l = de(s.innerType, t, a),
      o = t.seen.get(e);
    t.target === "openapi-3.0"
      ? ((o.ref = s.innerType), (r.nullable = !0))
      : (r.anyOf = [l, { type: "null" }]);
  },
  pc = (e, t, r, a) => {
    const s = e._zod.def;
    de(s.innerType, t, a);
    const l = t.seen.get(e);
    l.ref = s.innerType;
  },
  mc = (e, t, r, a) => {
    const s = e._zod.def;
    de(s.innerType, t, a);
    const l = t.seen.get(e);
    ((l.ref = s.innerType),
      (r.default = JSON.parse(JSON.stringify(s.defaultValue))));
  },
  fc = (e, t, r, a) => {
    const s = e._zod.def;
    de(s.innerType, t, a);
    const l = t.seen.get(e);
    ((l.ref = s.innerType),
      t.io === "input" &&
        (r._prefault = JSON.parse(JSON.stringify(s.defaultValue))));
  },
  gc = (e, t, r, a) => {
    const s = e._zod.def;
    de(s.innerType, t, a);
    const l = t.seen.get(e);
    l.ref = s.innerType;
    let o;
    try {
      o = s.catchValue(void 0);
    } catch {
      throw new Error("Dynamic catch values are not supported in JSON Schema");
    }
    r.default = o;
  },
  hc = (e, t, r, a) => {
    const s = e._zod.def,
      l =
        t.io === "input"
          ? s.in._zod.def.type === "transform"
            ? s.out
            : s.in
          : s.out;
    de(l, t, a);
    const o = t.seen.get(e);
    o.ref = l;
  },
  _c = (e, t, r, a) => {
    const s = e._zod.def;
    de(s.innerType, t, a);
    const l = t.seen.get(e);
    ((l.ref = s.innerType), (r.readOnly = !0));
  },
  Ea = (e, t, r, a) => {
    const s = e._zod.def;
    de(s.innerType, t, a);
    const l = t.seen.get(e);
    l.ref = s.innerType;
  },
  vc = f("ZodISODateTime", (e, t) => {
    (ko.init(e, t), te.init(e, t));
  });
function xc(e) {
  return Cl(vc, e);
}
var bc = f("ZodISODate", (e, t) => {
  (Ao.init(e, t), te.init(e, t));
});
function yc(e) {
  return El(bc, e);
}
var jc = f("ZodISOTime", (e, t) => {
  ($o.init(e, t), te.init(e, t));
});
function Nc(e) {
  return Ol(jc, e);
}
var wc = f("ZodISODuration", (e, t) => {
  (Co.init(e, t), te.init(e, t));
});
function Sc(e) {
  return Il(wc, e);
}
var Oa = (e, t) => {
    (_a.init(e, t),
      (e.name = "ZodError"),
      Object.defineProperties(e, {
        format: { value: (r) => ji(e, r) },
        flatten: { value: (r) => yi(e, r) },
        addIssue: {
          value: (r) => {
            (e.issues.push(r), (e.message = JSON.stringify(e.issues, Rr, 2)));
          },
        },
        addIssues: {
          value: (r) => {
            (e.issues.push(...r),
              (e.message = JSON.stringify(e.issues, Rr, 2)));
          },
        },
        isEmpty: {
          get() {
            return e.issues.length === 0;
          },
        },
      }));
  },
  dd = f("ZodError", Oa),
  ze = f("ZodError", Oa, { Parent: Error }),
  zc = Br(ze),
  kc = Kr(ze),
  Ac = rr(ze),
  $c = nr(ze),
  Cc = Si(ze),
  Ec = zi(ze),
  Oc = ki(ze),
  Ic = Ai(ze),
  Pc = $i(ze),
  Lc = Ci(ze),
  Zc = Ei(ze),
  Tc = Oi(ze),
  oe = f(
    "ZodType",
    (e, t) => (
      ie.init(e, t),
      Object.assign(e["~standard"], {
        jsonSchema: { input: Yt(e, "input"), output: Yt(e, "output") },
      }),
      (e.toJSONSchema = Xl(e, {})),
      (e.def = t),
      (e.type = t.type),
      Object.defineProperty(e, "_def", { value: t }),
      (e.check = (...r) =>
        e.clone(
          De(t, {
            checks: [
              ...(t.checks ?? []),
              ...r.map((a) =>
                typeof a == "function"
                  ? {
                      _zod: {
                        check: a,
                        def: { check: "custom" },
                        onattach: [],
                      },
                    }
                  : a,
              ),
            ],
          }),
          { parent: !0 },
        )),
      (e.with = e.check),
      (e.clone = (r, a) => qe(e, r, a)),
      (e.brand = () => e),
      (e.register = (r, a) => (r.add(e, a), e)),
      (e.parse = (r, a) => zc(e, r, a, { callee: e.parse })),
      (e.safeParse = (r, a) => Ac(e, r, a)),
      (e.parseAsync = async (r, a) => kc(e, r, a, { callee: e.parseAsync })),
      (e.safeParseAsync = async (r, a) => $c(e, r, a)),
      (e.spa = e.safeParseAsync),
      (e.encode = (r, a) => Cc(e, r, a)),
      (e.decode = (r, a) => Ec(e, r, a)),
      (e.encodeAsync = async (r, a) => Oc(e, r, a)),
      (e.decodeAsync = async (r, a) => Ic(e, r, a)),
      (e.safeEncode = (r, a) => Pc(e, r, a)),
      (e.safeDecode = (r, a) => Lc(e, r, a)),
      (e.safeEncodeAsync = async (r, a) => Zc(e, r, a)),
      (e.safeDecodeAsync = async (r, a) => Tc(e, r, a)),
      (e.refine = (r, a) => e.check($u(r, a))),
      (e.superRefine = (r) => e.check(Cu(r))),
      (e.overwrite = (r) => e.check(ot(r))),
      (e.optional = () => Bn(e)),
      (e.exactOptional = () => hu(e)),
      (e.nullable = () => Kn(e)),
      (e.nullish = () => Bn(Kn(e))),
      (e.nonoptional = (r) => ju(e, r)),
      (e.array = () => Pa(e)),
      (e.or = (r) => uu([e, r])),
      (e.and = (r) => pu(e, r)),
      (e.transform = (r) => Hn(e, fu(r))),
      (e.default = (r) => xu(e, r)),
      (e.prefault = (r) => yu(e, r)),
      (e.catch = (r) => wu(e, r)),
      (e.pipe = (r) => Hn(e, r)),
      (e.readonly = () => ku(e)),
      (e.describe = (r) => {
        const a = e.clone();
        return (_t.add(a, { description: r }), a);
      }),
      Object.defineProperty(e, "description", {
        get() {
          return _t.get(e)?.description;
        },
        configurable: !0,
      }),
      (e.meta = (...r) => {
        if (r.length === 0) return _t.get(e);
        const a = e.clone();
        return (_t.add(a, r[0]), a);
      }),
      (e.isOptional = () => e.safeParse(void 0).success),
      (e.isNullable = () => e.safeParse(null).success),
      (e.apply = (r) => r(e)),
      e
    ),
  ),
  Ia = f("_ZodString", (e, t) => {
    (Hr.init(e, t),
      oe.init(e, t),
      (e._zod.processJSONSchema = (a, s, l) => ec(e, a, s, l)));
    const r = e._zod.bag;
    ((e.format = r.format ?? null),
      (e.minLength = r.minimum ?? null),
      (e.maxLength = r.maximum ?? null),
      (e.regex = (...a) => e.check(Tl(...a))),
      (e.includes = (...a) => e.check(ql(...a))),
      (e.startsWith = (...a) => e.check(Fl(...a))),
      (e.endsWith = (...a) => e.check(Ul(...a))),
      (e.min = (...a) => e.check(Xt(...a))),
      (e.max = (...a) => e.check(za(...a))),
      (e.length = (...a) => e.check(ka(...a))),
      (e.nonempty = (...a) => e.check(Xt(1, ...a))),
      (e.lowercase = (a) => e.check(Rl(a))),
      (e.uppercase = (a) => e.check(Dl(a))),
      (e.trim = () => e.check(Ml())),
      (e.normalize = (...a) => e.check(Vl(...a))),
      (e.toLowerCase = () => e.check(Jl())),
      (e.toUpperCase = () => e.check(Gl())),
      (e.slugify = () => e.check(Bl())));
  }),
  Rc = f("ZodString", (e, t) => {
    (Hr.init(e, t),
      Ia.init(e, t),
      (e.email = (r) => e.check(cl(Dc, r))),
      (e.url = (r) => e.check(fl(qc, r))),
      (e.jwt = (r) => e.check($l(tu, r))),
      (e.emoji = (r) => e.check(gl(Fc, r))),
      (e.guid = (r) => e.check(Mn(Jn, r))),
      (e.uuid = (r) => e.check(ul(Ut, r))),
      (e.uuidv4 = (r) => e.check(dl(Ut, r))),
      (e.uuidv6 = (r) => e.check(pl(Ut, r))),
      (e.uuidv7 = (r) => e.check(ml(Ut, r))),
      (e.nanoid = (r) => e.check(hl(Uc, r))),
      (e.guid = (r) => e.check(Mn(Jn, r))),
      (e.cuid = (r) => e.check(_l(Vc, r))),
      (e.cuid2 = (r) => e.check(vl(Mc, r))),
      (e.ulid = (r) => e.check(xl(Jc, r))),
      (e.base64 = (r) => e.check(zl(Xc, r))),
      (e.base64url = (r) => e.check(kl(Yc, r))),
      (e.xid = (r) => e.check(bl(Gc, r))),
      (e.ksuid = (r) => e.check(yl(Bc, r))),
      (e.ipv4 = (r) => e.check(jl(Kc, r))),
      (e.ipv6 = (r) => e.check(Nl(Hc, r))),
      (e.cidrv4 = (r) => e.check(wl(Wc, r))),
      (e.cidrv6 = (r) => e.check(Sl(Qc, r))),
      (e.e164 = (r) => e.check(Al(eu, r))),
      (e.datetime = (r) => e.check(xc(r))),
      (e.date = (r) => e.check(yc(r))),
      (e.time = (r) => e.check(Nc(r))),
      (e.duration = (r) => e.check(Sc(r))));
  });
function xe(e) {
  return ll(Rc, e);
}
var te = f("ZodStringFormat", (e, t) => {
    (ee.init(e, t), Ia.init(e, t));
  }),
  Dc = f("ZodEmail", (e, t) => {
    (vo.init(e, t), te.init(e, t));
  }),
  Jn = f("ZodGUID", (e, t) => {
    (ho.init(e, t), te.init(e, t));
  }),
  Ut = f("ZodUUID", (e, t) => {
    (_o.init(e, t), te.init(e, t));
  }),
  qc = f("ZodURL", (e, t) => {
    (xo.init(e, t), te.init(e, t));
  }),
  Fc = f("ZodEmoji", (e, t) => {
    (bo.init(e, t), te.init(e, t));
  }),
  Uc = f("ZodNanoID", (e, t) => {
    (yo.init(e, t), te.init(e, t));
  }),
  Vc = f("ZodCUID", (e, t) => {
    (jo.init(e, t), te.init(e, t));
  }),
  Mc = f("ZodCUID2", (e, t) => {
    (No.init(e, t), te.init(e, t));
  }),
  Jc = f("ZodULID", (e, t) => {
    (wo.init(e, t), te.init(e, t));
  }),
  Gc = f("ZodXID", (e, t) => {
    (So.init(e, t), te.init(e, t));
  }),
  Bc = f("ZodKSUID", (e, t) => {
    (zo.init(e, t), te.init(e, t));
  }),
  Kc = f("ZodIPv4", (e, t) => {
    (Eo.init(e, t), te.init(e, t));
  }),
  Hc = f("ZodIPv6", (e, t) => {
    (Oo.init(e, t), te.init(e, t));
  }),
  Wc = f("ZodCIDRv4", (e, t) => {
    (Io.init(e, t), te.init(e, t));
  }),
  Qc = f("ZodCIDRv6", (e, t) => {
    (Po.init(e, t), te.init(e, t));
  }),
  Xc = f("ZodBase64", (e, t) => {
    (Lo.init(e, t), te.init(e, t));
  }),
  Yc = f("ZodBase64URL", (e, t) => {
    (To.init(e, t), te.init(e, t));
  }),
  eu = f("ZodE164", (e, t) => {
    (Ro.init(e, t), te.init(e, t));
  }),
  tu = f("ZodJWT", (e, t) => {
    (qo.init(e, t), te.init(e, t));
  }),
  ru = f("ZodBoolean", (e, t) => {
    (Fo.init(e, t),
      oe.init(e, t),
      (e._zod.processJSONSchema = (r, a, s) => tc(e, r, a, s)));
  });
function nu(e) {
  return Pl(ru, e);
}
var au = f("ZodUnknown", (e, t) => {
  (Uo.init(e, t),
    oe.init(e, t),
    (e._zod.processJSONSchema = (r, a, s) => nc(e, r, a, s)));
});
function Gn() {
  return Ll(au);
}
var su = f("ZodNever", (e, t) => {
  (Vo.init(e, t),
    oe.init(e, t),
    (e._zod.processJSONSchema = (r, a, s) => rc(e, r, a, s)));
});
function iu(e) {
  return Zl(su, e);
}
var ou = f("ZodArray", (e, t) => {
  (Mo.init(e, t),
    oe.init(e, t),
    (e._zod.processJSONSchema = (r, a, s) => oc(e, r, a, s)),
    (e.element = t.element),
    (e.min = (r, a) => e.check(Xt(r, a))),
    (e.nonempty = (r) => e.check(Xt(1, r))),
    (e.max = (r, a) => e.check(za(r, a))),
    (e.length = (r, a) => e.check(ka(r, a))),
    (e.unwrap = () => e.element));
});
function Pa(e, t) {
  return Kl(ou, e, t);
}
var lu = f("ZodObject", (e, t) => {
  (Go.init(e, t),
    oe.init(e, t),
    (e._zod.processJSONSchema = (r, a, s) => lc(e, r, a, s)),
    J(e, "shape", () => t.shape),
    (e.keyof = () => er(Object.keys(e._zod.def.shape))),
    (e.catchall = (r) => e.clone({ ...e._zod.def, catchall: r })),
    (e.passthrough = () => e.clone({ ...e._zod.def, catchall: Gn() })),
    (e.loose = () => e.clone({ ...e._zod.def, catchall: Gn() })),
    (e.strict = () => e.clone({ ...e._zod.def, catchall: iu() })),
    (e.strip = () => e.clone({ ...e._zod.def, catchall: void 0 })),
    (e.extend = (r) => hi(e, r)),
    (e.safeExtend = (r) => _i(e, r)),
    (e.merge = (r) => vi(e, r)),
    (e.pick = (r) => fi(e, r)),
    (e.omit = (r) => gi(e, r)),
    (e.partial = (...r) => xi(La, e, r[0])),
    (e.required = (...r) => bi(Za, e, r[0])));
});
function qr(e, t) {
  return new lu({ type: "object", shape: e ?? {}, ...O(t) });
}
var cu = f("ZodUnion", (e, t) => {
  (Bo.init(e, t),
    oe.init(e, t),
    (e._zod.processJSONSchema = (r, a, s) => cc(e, r, a, s)),
    (e.options = t.options));
});
function uu(e, t) {
  return new cu({ type: "union", options: e, ...O(t) });
}
var du = f("ZodIntersection", (e, t) => {
  (Ko.init(e, t),
    oe.init(e, t),
    (e._zod.processJSONSchema = (r, a, s) => uc(e, r, a, s)));
});
function pu(e, t) {
  return new du({ type: "intersection", left: e, right: t });
}
var Fr = f("ZodEnum", (e, t) => {
  (Ho.init(e, t),
    oe.init(e, t),
    (e._zod.processJSONSchema = (a, s, l) => ac(e, a, s, l)),
    (e.enum = t.entries),
    (e.options = Object.values(t.entries)));
  const r = new Set(Object.keys(t.entries));
  ((e.extract = (a, s) => {
    const l = {};
    for (const o of a)
      if (r.has(o)) l[o] = t.entries[o];
      else throw new Error(`Key ${o} not found in enum`);
    return new Fr({ ...t, checks: [], ...O(s), entries: l });
  }),
    (e.exclude = (a, s) => {
      const l = { ...t.entries };
      for (const o of a)
        if (r.has(o)) delete l[o];
        else throw new Error(`Key ${o} not found in enum`);
      return new Fr({ ...t, checks: [], ...O(s), entries: l });
    }));
});
function er(e, t) {
  return new Fr({
    type: "enum",
    entries: Array.isArray(e) ? Object.fromEntries(e.map((r) => [r, r])) : e,
    ...O(t),
  });
}
var mu = f("ZodTransform", (e, t) => {
  (Wo.init(e, t),
    oe.init(e, t),
    (e._zod.processJSONSchema = (r, a, s) => ic(e, r, a, s)),
    (e._zod.parse = (r, a) => {
      if (a.direction === "backward") throw new da(e.constructor.name);
      r.addIssue = (l) => {
        if (typeof l == "string") r.issues.push(xt(l, r.value, t));
        else {
          const o = l;
          (o.fatal && (o.continue = !1),
            o.code ?? (o.code = "custom"),
            o.input ?? (o.input = r.value),
            o.inst ?? (o.inst = e),
            r.issues.push(xt(o)));
        }
      };
      const s = t.transform(r.value, r);
      return s instanceof Promise
        ? s.then((l) => ((r.value = l), r))
        : ((r.value = s), r);
    }));
});
function fu(e) {
  return new mu({ type: "transform", transform: e });
}
var La = f("ZodOptional", (e, t) => {
  (Sa.init(e, t),
    oe.init(e, t),
    (e._zod.processJSONSchema = (r, a, s) => Ea(e, r, a, s)),
    (e.unwrap = () => e._zod.def.innerType));
});
function Bn(e) {
  return new La({ type: "optional", innerType: e });
}
var gu = f("ZodExactOptional", (e, t) => {
  (Qo.init(e, t),
    oe.init(e, t),
    (e._zod.processJSONSchema = (r, a, s) => Ea(e, r, a, s)),
    (e.unwrap = () => e._zod.def.innerType));
});
function hu(e) {
  return new gu({ type: "optional", innerType: e });
}
var _u = f("ZodNullable", (e, t) => {
  (Xo.init(e, t),
    oe.init(e, t),
    (e._zod.processJSONSchema = (r, a, s) => dc(e, r, a, s)),
    (e.unwrap = () => e._zod.def.innerType));
});
function Kn(e) {
  return new _u({ type: "nullable", innerType: e });
}
var vu = f("ZodDefault", (e, t) => {
  (Yo.init(e, t),
    oe.init(e, t),
    (e._zod.processJSONSchema = (r, a, s) => mc(e, r, a, s)),
    (e.unwrap = () => e._zod.def.innerType),
    (e.removeDefault = e.unwrap));
});
function xu(e, t) {
  return new vu({
    type: "default",
    innerType: e,
    get defaultValue() {
      return typeof t == "function" ? t() : fa(t);
    },
  });
}
var bu = f("ZodPrefault", (e, t) => {
  (el.init(e, t),
    oe.init(e, t),
    (e._zod.processJSONSchema = (r, a, s) => fc(e, r, a, s)),
    (e.unwrap = () => e._zod.def.innerType));
});
function yu(e, t) {
  return new bu({
    type: "prefault",
    innerType: e,
    get defaultValue() {
      return typeof t == "function" ? t() : fa(t);
    },
  });
}
var Za = f("ZodNonOptional", (e, t) => {
  (tl.init(e, t),
    oe.init(e, t),
    (e._zod.processJSONSchema = (r, a, s) => pc(e, r, a, s)),
    (e.unwrap = () => e._zod.def.innerType));
});
function ju(e, t) {
  return new Za({ type: "nonoptional", innerType: e, ...O(t) });
}
var Nu = f("ZodCatch", (e, t) => {
  (rl.init(e, t),
    oe.init(e, t),
    (e._zod.processJSONSchema = (r, a, s) => gc(e, r, a, s)),
    (e.unwrap = () => e._zod.def.innerType),
    (e.removeCatch = e.unwrap));
});
function wu(e, t) {
  return new Nu({
    type: "catch",
    innerType: e,
    catchValue: typeof t == "function" ? t : () => t,
  });
}
var Su = f("ZodPipe", (e, t) => {
  (nl.init(e, t),
    oe.init(e, t),
    (e._zod.processJSONSchema = (r, a, s) => hc(e, r, a, s)),
    (e.in = t.in),
    (e.out = t.out));
});
function Hn(e, t) {
  return new Su({ type: "pipe", in: e, out: t });
}
var zu = f("ZodReadonly", (e, t) => {
  (al.init(e, t),
    oe.init(e, t),
    (e._zod.processJSONSchema = (r, a, s) => _c(e, r, a, s)),
    (e.unwrap = () => e._zod.def.innerType));
});
function ku(e) {
  return new zu({ type: "readonly", innerType: e });
}
var Au = f("ZodCustom", (e, t) => {
  (sl.init(e, t),
    oe.init(e, t),
    (e._zod.processJSONSchema = (r, a, s) => sc(e, r, a, s)));
});
function $u(e, t = {}) {
  return Hl(Au, e, t);
}
function Cu(e) {
  return Wl(e);
}
var Wn = {
    invalid_type: "invalid_type",
    too_big: "too_big",
    too_small: "too_small",
    invalid_format: "invalid_format",
    not_multiple_of: "not_multiple_of",
    unrecognized_keys: "unrecognized_keys",
    invalid_union: "invalid_union",
    invalid_key: "invalid_key",
    invalid_element: "invalid_element",
    invalid_value: "invalid_value",
    custom: "custom",
  },
  Qn;
Qn || (Qn = {});
var $r = xe().min(1, "Ce champ est requis"),
  Z = xe().optional().nullable(),
  Xn = xe()
    .min(1, "Ce champ est requis")
    .regex(
      /^[\w/-]+$/,
      "Format invalide (lettres, chiffres, - et / autorisés)",
    ),
  Eu = xe()
    .min(1, "La superficie est requise")
    .transform((e) => parseFloat(e.replace(",", ".")))
    .refine(
      (e) => e !== null && !isNaN(e) && e > 0,
      "La superficie doit être un nombre positif",
    )
    .refine(
      (e) => e <= 1e6,
      "La superficie doit être inférieure à 1 000 000 m²",
    ),
  Ou = xe()
    .optional()
    .nullable()
    .transform((e) => (e ? parseFloat(e.replace(",", ".")) : 0))
    .refine(
      (e) => !isNaN(e) && e >= 0,
      "Le prix doit être un nombre positif ou nul",
    ),
  Cr = xe()
    .optional()
    .nullable()
    .refine((e) => {
      if (!e) return !0;
      const t = e.trim();
      return (
        /^\d{2}\s*\/\s*\d{2}\s*\/\s*\d{4}$/.test(t) ||
        /^\d{4}-\d{2}-\d{2}$/.test(t)
      );
    }, "Format JJ/MM/AAAA ou AAAA-MM-JJ requis (ex: 29/12/1967)")
    .transform((e) => {
      if (!e) return "";
      const t = e.trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(t)) {
        const u = new Date(t);
        return isNaN(u.getTime()) ? "" : t;
      }
      const r = /^(\d{2})\s*\/\s*(\d{2})\s*\/\s*(\d{4})$/.exec(t);
      if (!r) return "";
      const [, a, s, l] = r,
        o = new Date(`${l}-${s}-${a}`);
      return isNaN(o.getTime()) ? "" : `${l}-${s}-${a}`;
    }),
  Ur = xe()
    .optional()
    .nullable()
    .refine(
      (e) => !e || /^(\+225|00225)?\s*\d{10}$/.test(e.replace(/\s/g, "")),
      "Format invalide (10 chiffres, ex: 0707084041)",
    ),
  Ta = xe()
    .optional()
    .nullable()
    .refine(
      (e) => !e || /^(CI|ci)\s*\d{8,11}$/.test(e.replace(/\s/g, "")),
      "Format CNI invalide (ex: CI 005274109)",
    ),
  ft = xe()
    .optional()
    .nullable()
    .refine((e) => !e || /^-?\d+(\.\d+)?$/.test(e), "Coordonnée GPS invalide")
    .refine((e) => {
      if (!e) return !0;
      const t = parseFloat(e);
      return !isNaN(t) && t >= -90 && t <= 90;
    }, "Latitude invalide (doit être entre -90 et 90)"),
  gt = xe()
    .optional()
    .nullable()
    .refine((e) => !e || /^-?\d+(\.\d+)?$/.test(e), "Coordonnée GPS invalide")
    .refine((e) => {
      if (!e) return !0;
      const t = parseFloat(e);
      return !isNaN(t) && t >= -180 && t <= 180;
    }, "Longitude invalide (doit être entre -180 et 180)"),
  Iu = er(["actif", "vendu", "litige", "reserve", "annule"]),
  Pu = qr({
    numero_lot: Xn,
    numero_ilot: Xn,
    nom_lotissement: $r.max(100, "Maximum 100 caractères"),
    village: $r.max(100, "Village requis"),
    quartier: Z,
    commune: Z,
    departement: Z,
    region: Z,
    ilot: Z,
    superficie: Eu,
    proprietaire_nom: $r.max(100, "Nom du propriétaire requis"),
    proprietaire_prenom: Z,
    proprietaire_naissance_date: Cr,
    proprietaire_naissance_lieu: Z,
    proprietaire_cni_numero: Ta,
    proprietaire_cni_date: Cr,
    proprietaire_cni_lieu: Z,
    proprietaire_profession: Z,
    proprietaire_telephone: Ur,
    chef_village: Z,
    arrete_prefectoral: Z,
    arrete_date: Cr,
    statut: Iu.default("actif"),
    date_cession: xe().optional(),
    prix_cession: Ou.optional(),
    latitude: Z,
    longitude: Z,
    gps_precision: Z,
    limite_nord_lat: Z,
    limite_nord_lng: Z,
    limite_sud_lat: Z,
    limite_sud_lng: Z,
    limite_est_lat: Z,
    limite_est_lng: Z,
    limite_ouest_lat: Z,
    limite_ouest_lng: Z,
    code_barre: Z,
    notes: xe().max(1e3, "Maximum 1000 caractères").optional(),
  }).superRefine((e, t) => {
    const r = new Date();
    if (e.proprietaire_naissance_date) {
      const a = new Date(e.proprietaire_naissance_date);
      if (
        (!isNaN(a.getTime()) &&
          a > r &&
          t.addIssue({
            code: Wn.custom,
            path: ["proprietaire_naissance_date"],
            message: "La date de naissance ne peut pas être dans le futur",
          }),
        e.date_cession)
      ) {
        const s = new Date(e.date_cession);
        !isNaN(s.getTime()) &&
          s < a &&
          t.addIssue({
            code: Wn.custom,
            path: ["date_cession"],
            message:
              "La date de cession ne peut pas être antérieure à la naissance",
          });
      }
    }
  }),
  Lu = qr({
    registre_volume: Z,
    registre_page: xe()
      .optional()
      .nullable()
      .refine((e) => !e || /^\d+$/.test(e), "Numéro de page invalide"),
    registre_ligne: xe()
      .optional()
      .nullable()
      .refine((e) => !e || /^\d+$/.test(e), "Numéro de ligne invalide"),
    numero_enregistrement: Z,
    attestation_type: er(["standard", "cession"]).default("standard"),
    mode_acquisition: er([
      "Héritage",
      "Donation",
      "Vente coutumière",
      "Autre",
    ]).optional(),
    historique_possession: Z,
    domicile: Z,
    cedant_nom: Z,
    cedant_prenom: Z,
    cedant_cni_numero: Ta,
    cedant_telephone: Ur,
    cedant_domicile: Z,
    limites_nord: Z,
    limites_sud: Z,
    limites_est: Z,
    limites_ouest: Z,
    gps_lat: ft,
    gps_lng: gt,
    gps_precision: xe()
      .optional()
      .nullable()
      .refine((e) => !e || /^\d+(\.\d+)?$/.test(e), "Précision invalide"),
    gps_nord_lat: ft,
    gps_nord_lng: gt,
    gps_sud_lat: ft,
    gps_sud_lng: gt,
    gps_est_lat: ft,
    gps_est_lng: gt,
    gps_ouest_lat: ft,
    gps_ouest_lng: gt,
    temoins: Pa(qr({ nom: Z, prenom: Z, profession: Z, telephone: Ur, cni: Z }))
      .optional()
      .nullable()
      .default([]),
    validation_agent_nom: Z,
    validation_chef_nom: Z,
    original: nu().default(!0),
  });
function Zu(e) {
  const t = Pu.safeParse(e);
  if (!t.success) {
    const r = {};
    return (
      t.error.issues.forEach((a) => {
        const s = a.path.join(".");
        r[s] || (r[s] = a.message);
      }),
      { success: !1, errors: r }
    );
  }
  return { success: !0, errors: null, parsedData: t.data };
}
function Tu(e) {
  const t = Lu.safeParse(e);
  if (!t.success) {
    const r = {};
    return (
      t.error.issues.forEach((a) => {
        const s = a.path.join(".");
        r[s] || (r[s] = a.message);
      }),
      { success: !1, errors: r }
    );
  }
  return { success: !0, errors: null, parsedData: t.data };
}
var at = (e) => (e ? oa.sanitize(e.trim()) : ""),
  he = (e) => {
    const t = at(e);
    return t || null;
  },
  Ru = (e) =>
    (e || []).map((t) => ({
      nom: at(t.nom),
      prenom: at(t.prenom),
      profession: at(t.profession || ""),
      telephone: at(t.telephone || ""),
      cni: at(t.cni || ""),
    }));
function Du(e) {
  const {
      attestationForm: t,
      config: r,
      signatureNonce: a,
      signatureIssuedAt: s,
      deviceId: l,
      baseAttestationId: o,
      isCession: u,
    } = e,
    d = ve(t.gps_lat),
    v = ve(t.gps_lng),
    x = ve(t.gps_precision),
    A = qu(t),
    N = ve(t.registre_page),
    j = ve(t.registre_ligne);
  return {
    p_lot_id: e.attestationLot.id,
    p_attestation_type: t.attestation_type,
    p_original: t.original,
    p_mode_acquisition: he(t.mode_acquisition),
    p_historique_possession: he(t.historique_possession),
    p_domicile: he(t.domicile),
    p_limites_nord: he(t.limites_nord),
    p_limites_sud: he(t.limites_sud),
    p_limites_est: he(t.limites_est),
    p_limites_ouest: he(t.limites_ouest),
    p_gps_lat: d,
    p_gps_lng: v,
    p_gps_precision: x,
    p_gps_points: A || [],
    p_registre_volume: he(t.registre_volume),
    p_registre_page: N,
    p_registre_ligne: j,
    p_numero_enregistrement: he(t.numero_enregistrement),
    p_temoins: Ru(t.temoins),
    p_validation_agent_nom: he(t.validation_agent_nom),
    p_validation_chef_nom: he(t.validation_chef_nom),
    p_signature_nonce: a,
    p_signature_issued_at: s,
    p_previous_attestation_id: o || null,
    p_last_modified_device_id: l,
    p_cedant_nom: u ? he(t.cedant_nom) : null,
    p_cedant_prenom: u ? he(t.cedant_prenom) : null,
    p_cedant_cni_numero: u ? he(t.cedant_cni_numero) : null,
    p_cedant_telephone: u ? he(t.cedant_telephone) : null,
    p_cedant_domicile: u ? he(t.cedant_domicile) : null,
  };
}
function qu(e) {
  const t = [
    { label: "Nord", lat: ve(e.gps_nord_lat), lng: ve(e.gps_nord_lng) },
    { label: "Sud", lat: ve(e.gps_sud_lat), lng: ve(e.gps_sud_lng) },
    { label: "Est", lat: ve(e.gps_est_lat), lng: ve(e.gps_est_lng) },
    { label: "Ouest", lat: ve(e.gps_ouest_lat), lng: ve(e.gps_ouest_lng) },
  ]
    .filter((r) => r.lat != null && r.lng != null)
    .map((r) => ({ label: r.label, lat: r.lat, lng: r.lng }));
  return t.length ? t : null;
}
var Fu = "OFFLINE_STORAGE_FULL",
  Uu = "egs-foncier-offline",
  Vu = 1,
  Te = "lots",
  Re = "queue",
  Ra = typeof window < "u",
  Fe = Ra && "indexedDB" in window,
  Er = null,
  Da = (e) =>
    new Promise((t, r) => {
      ((e.onsuccess = () => t(e.result)), (e.onerror = () => r(e.error)));
    }),
  lt = (e) =>
    new Promise((t, r) => {
      ((e.oncomplete = () => t()),
        (e.onerror = () => r(e.error)),
        (e.onabort = () => r(e.error)));
    }),
  Mu = (e) => {
    if (!e || typeof e != "object") return !1;
    const t = e.name || "",
      r = e.message || "";
    return t === "QuotaExceededError" || /quota/i.test(r);
  },
  sr = (e) => {
    if (Mu(e)) {
      const t = new Error("Offline storage quota exceeded");
      throw ((t.code = Fu), t);
    }
    throw e;
  },
  ct = () =>
    Fe
      ? (Er ||
          (Er = new Promise((e, t) => {
            const r = indexedDB.open(Uu, Vu);
            ((r.onupgradeneeded = () => {
              const a = r.result;
              (a.objectStoreNames.contains(Te) ||
                a.createObjectStore(Te, { keyPath: "id" }),
                a.objectStoreNames.contains(Re) ||
                  a.createObjectStore(Re, { keyPath: "id" }));
            }),
              (r.onsuccess = () => e(r.result)),
              (r.onerror = () => t(r.error)));
          })),
        Er)
      : Promise.reject(new Error("IndexedDB not available")),
  Ju = () => {
    if (!Ra) return "server";
    const e = "egs_device_id",
      t = window.localStorage.getItem(e);
    if (t) return t;
    let r = "";
    if (typeof crypto < "u" && typeof crypto.randomUUID == "function")
      try {
        r = crypto.randomUUID();
      } catch {
        r = "";
      }
    return (
      r || (r = `${Date.now()}-${Math.random().toString(16).slice(2)}`),
      window.localStorage.setItem(e, r),
      r
    );
  },
  Yn = async () => {
    if (!Fe) return [];
    try {
      const e = (await ct()).transaction(Te, "readonly"),
        t = await Da(e.objectStore(Te).getAll());
      return (await lt(e), t || []);
    } catch {
      return [];
    }
  },
  Vt = async (e) => {
    if (Fe)
      try {
        const t = (await ct()).transaction(Te, "readwrite");
        (t.objectStore(Te).put(e), await lt(t));
      } catch (t) {
        sr(t);
      }
  },
  ea = async (e) => {
    if (Fe)
      try {
        const t = (await ct()).transaction(Te, "readwrite"),
          r = t.objectStore(Te);
        (e.forEach((a) => r.put(a)), await lt(t));
      } catch (t) {
        sr(t);
      }
  },
  qa = async () => {
    if (!Fe) return [];
    try {
      const e = (await ct()).transaction(Re, "readonly"),
        t = await Da(e.objectStore(Re).getAll());
      return (await lt(e), t || []);
    } catch {
      return [];
    }
  },
  Mt = async (e) => {
    if (Fe)
      try {
        const t = (await ct()).transaction(Re, "readwrite");
        (t.objectStore(Re).put(e), await lt(t));
      } catch (t) {
        sr(t);
      }
  },
  ht = async (e) => {
    if (Fe)
      try {
        const t = (await ct()).transaction(Re, "readwrite");
        (t.objectStore(Re).delete(e), await lt(t));
      } catch (t) {
        sr(t);
      }
  },
  Gu = async () => (Fe ? (await qa()).length : 0),
  Or = {
    actif: { label: "Actif", color: "green" },
    vendu: { label: "Vendu", color: "blue" },
    litige: { label: "Litige", color: "red" },
    reserve: { label: "Réservé", color: "orange" },
    annule: { label: "Annulé", color: "gray" },
  },
  Jt = [
    "Sikensi",
    "Katadji",
    "Élibou",
    "Sahuyé",
    "Gomon",
    "Bécédi",
    "Braffouéby",
    "Badasso",
  ],
  Bu = (e) => {
    if (!e) return { label: "—", color: "gray" };
    if (e.deleted_at) return { label: "Archivé", color: "gray" };
    const t = String(e.statut || "brouillon").toLowerCase();
    return t === "valide"
      ? { label: "Validé", color: "green" }
      : t === "soumis"
        ? { label: "Soumis", color: "blue" }
        : t === "revoque"
          ? { label: "Révoqué", color: "red" }
          : t === "expire"
            ? { label: "Expiré", color: "orange" }
            : t === "annule"
              ? { label: "Annulé", color: "red" }
              : { label: e.statut || "Brouillon", color: "gray" };
  },
  Ir = {
    region: "",
    departement: "",
    commune: "",
    village: "",
    chef_village: "",
    arrete_prefectoral: "",
    nom_chef_signe: "",
    lieu_signature: "",
    logo_url: "",
  },
  Ze = () => {
    const e = new Date(),
      t = e.getTimezoneOffset() * 6e4;
    return new Date(e.getTime() - t).toISOString().slice(0, 10);
  },
  Gt = () => ({
    reference: "",
    numero_lot: "",
    numero_ilot: "",
    nom_lotissement: "",
    quartier: "",
    village: "",
    commune: "",
    departement: "",
    region: "",
    superficie: "",
    code_barre: "",
    proprietaire_nom: "",
    proprietaire_prenom: "",
    proprietaire_naissance_date: "",
    proprietaire_naissance_lieu: "",
    proprietaire_cni_numero: "",
    proprietaire_cni_date: "",
    proprietaire_cni_lieu: "",
    proprietaire_profession: "",
    proprietaire_telephone: "",
    chef_village: "",
    arrete_prefectoral: "",
    arrete_date: "",
    statut: "actif",
    date_cession: Ze(),
    prix_cession: "",
    notes: "",
  }),
  Bt = () => ({
    attestation_type: "standard",
    mode_acquisition: "",
    historique_possession: "",
    domicile: "",
    cedant_nom: "",
    cedant_prenom: "",
    cedant_cni_numero: "",
    cedant_telephone: "",
    cedant_domicile: "",
    limites_nord: "",
    limites_sud: "",
    limites_est: "",
    limites_ouest: "",
    gps_lat: "",
    gps_lng: "",
    gps_precision: "",
    gps_nord_lat: "",
    gps_nord_lng: "",
    gps_sud_lat: "",
    gps_sud_lng: "",
    gps_est_lat: "",
    gps_est_lng: "",
    gps_ouest_lat: "",
    gps_ouest_lng: "",
    registre_volume: "",
    registre_page: "",
    registre_ligne: "",
    numero_enregistrement: "",
    temoins: [
      { nom: "", prenom: "", profession: "", telephone: "", cni: "" },
      { nom: "", prenom: "", profession: "", telephone: "", cni: "" },
      { nom: "", prenom: "", profession: "", telephone: "", cni: "" },
    ],
    original: !0,
    validation_agent_nom: "",
    validation_chef_nom: "",
  }),
  Ku = [
    "CREATION",
    "MODIFICATION",
    "SUPPRESSION",
    "ARCHIVE",
    "RESTORE",
    "TRANSFERT",
    "SOUMISSION",
    "SOUMISSION_CHEF",
    "VALIDATION",
    "VALIDATION_CHEF",
    "SCAN_ORIGINAL",
    "ARCHIVAGE_ATTESTATION",
    "REEMISSION_CESSION",
    "IMPRESSION",
  ],
  Pr = (e) => {
    if (!e) return null;
    try {
      const t = JSON.parse(e);
      if (t && typeof t == "object") return t;
    } catch {}
    return null;
  },
  Lr = async (e) => {
    const t = e.length,
      r = t > 800 ? "M" : "H",
      a = t > 800 ? 280 : 240,
      s = t > 800 ? 2 : 1;
    return (
      await Js(
        () => import("./browser-BWJXYg3H.js").then((l) => ws(l.default, 1)),
        __vite__mapDeps([0, 1]),
      )
    ).toDataURL(e, { errorCorrectionLevel: r, width: a, margin: s });
  },
  Kt = ({ reference: e, control_number: t, hash_sha256: r, baseUrl: a }) => {
    const s =
        typeof window < "u" && window.location
          ? window.location.origin
          : "http://localhost",
      l = new URL("/verification-attestation", s);
    let o = l;
    if (a && a.trim())
      try {
        o = new URL(a, s);
      } catch {
        o = l;
      }
    const u = q(e || ""),
      d = q(t || ""),
      v = q(r || "");
    return (
      u && o.searchParams.set("ref", u),
      d && o.searchParams.set("control", d),
      v && o.searchParams.set("hash", v),
      o.toString()
    );
  },
  Hu = (e) => new Promise((t) => setTimeout(t, e)),
  Wu = (e, t, r, a, s, l, o) => {
    const u = a.gps_lat ? parseFloat(a.gps_lat) : null,
      d = a.gps_lng ? parseFloat(a.gps_lng) : null,
      v = a.gps_precision ? parseFloat(a.gps_precision) : null,
      x = e.type === "cession",
      A = a.registre_page ? parseInt(a.registre_page, 10) : null,
      N = a.registre_ligne ? parseInt(a.registre_ligne, 10) : null;
    return {
      reference: e.reference,
      numero_enregistrement: e.numero_enregistrement || e.reference,
      date_etablissement: Le(e.date_etablissement || Ze()),
      original: e.original,
      draft: e.statut !== "valide",
      region: r.region || t.region || "REGION",
      departement: r.departement || t.departement || "DEPARTEMENT",
      commune: r.commune || t.commune || "COMMUNE",
      village: r.village || t.village || "VILLAGE",
      quartier: t.quartier || "",
      lotissement: t.nom_lotissement || "",
      numero_lot: t.numero_lot || "",
      superficie_m2: t.superficie || 0,
      limites: {
        nord: a.limites_nord || "",
        sud: a.limites_sud || "",
        est: a.limites_est || "",
        ouest: a.limites_ouest || "",
      },
      coordonnees_gps:
        u != null && d != null
          ? { lat: u, lng: d, precision: v ?? void 0 }
          : void 0,
      gps_points: l || void 0,
      mode_acquisition: a.mode_acquisition || "",
      historique_possession: a.historique_possession || "",
      proprietaire_nom: t.proprietaire_nom || "",
      proprietaire_prenom: t.proprietaire_prenom || "",
      proprietaire_naissance_date: t.proprietaire_naissance_date || "",
      proprietaire_naissance_lieu: t.proprietaire_naissance_lieu || "",
      proprietaire_domicile: a.domicile || "",
      proprietaire_profession: t.proprietaire_profession || "",
      proprietaire_cni_numero: t.proprietaire_cni_numero || "",
      proprietaire_cni_date: t.proprietaire_cni_date || "",
      proprietaire_cni_lieu: t.proprietaire_cni_lieu || "",
      proprietaire_telephone: t.proprietaire_telephone || "",
      cedant_nom: (x && a.cedant_nom) || "",
      cedant_prenom: (x && a.cedant_prenom) || "",
      cedant_cni_numero: (x && a.cedant_cni_numero) || "",
      cedant_telephone: (x && a.cedant_telephone) || "",
      cedant_domicile: (x && a.cedant_domicile) || "",
      temoins: a.temoins.map((j) => ({
        nom: j.nom || "",
        prenom: j.prenom || "",
        profession: j.profession || "",
        telephone: j.telephone || "",
        cni: j.cni || "",
      })),
      chef_village: r.chef_village || t.chef_village || "",
      lieu_signature: r.lieu_signature || t.village || "",
      registre_volume: a.registre_volume || "",
      registre_page: isNaN(A) ? null : A,
      registre_ligne: isNaN(N) ? null : N,
      control_number: e.control_number || "",
      verification_url:
        o ||
        Kt({
          reference: e.reference,
          control_number: e.control_number || "",
          hash_sha256: e.hash_sha256 || "",
        }),
      qrDataUrl: s,
      hash_sha256: e.hash_sha256 || "",
      validation_agent_nom:
        e.validation_agent_nom || a.validation_agent_nom || "",
      validation_chef_nom:
        e.validation_chef_nom || a.validation_chef_nom || r.chef_village || "",
      logoUrl: r.logo_url || "",
      village_logo_url: r.village_logo_url || "",
      signatureUrl: e.signatureUrl || "",
      cachetUrl: e.cachetUrl || e.chef_empreinte_url || "",
      chef_nom: r.chef_village || t.chef_village || "",
      attestation_type: e.type || "standard",
      statut: e.statut || "soumis",
      lot_statut: t.statut,
      date_cession: (x && t.date_cession) || "",
      prix_cession: x ? t.prix_cession : void 0,
    };
  },
  Pe = null,
  ta = (e, t) => {
    const r = typeof e?.message == "string" ? e.message : "";
    return (
      (typeof e?.code == "string" ? e.code : "") === "42703" ||
      r.includes(`column "${t}" does not exist`)
    );
  },
  ra = (e) => {
    if (!e || typeof e != "object") return !1;
    const t = e.status,
      r = e.message || "";
    return t === 429 || /rate limit|too many requests/i.test(r);
  },
  I = async (e, t = 3, r = 500) => {
    let a = 0;
    for (;;) {
      try {
        const s = await e();
        if (!s?.error || !ra(s.error) || a >= t) return s;
      } catch (s) {
        if (!ra(s) || a >= t) throw s;
      }
      (await Hu(r * 2 ** a), (a += 1));
    }
  },
  na = (e) => {
    const t = {};
    return (
      e.forEach((r) => {
        const a = r.village || "—";
        (t[a] || (t[a] = { total: 0, count: 0 }),
          (t[a].total += Number(r.superficie || 0)),
          (t[a].count += 1));
      }),
      t
    );
  };
function pd() {
  const { settings: e } = Us(),
    { profile: t } = Ms(),
    [r, a] = (0, _.useState)([]),
    [s, l] = (0, _.useState)(!0),
    [o, u] = (0, _.useState)(""),
    [d, v] = (0, _.useState)(""),
    [x, A] = (0, _.useState)(""),
    [N, j] = (0, _.useState)(!1),
    [F, pe] = (0, _.useState)(!1),
    [re, me] = (0, _.useState)(null),
    [g, C] = (0, _.useState)(() => Gt()),
    [ne, H] = (0, _.useState)(!1),
    [k, R] = (0, _.useState)(Ir),
    [U, le] = (0, _.useState)(Ir),
    [He, bt] = (0, _.useState)(!1),
    [yt, jt] = (0, _.useState)(null),
    [ue, Nt] = (0, _.useState)(Jt[0]),
    [Ue, X] = (0, _.useState)(Jt),
    [fe, ke] = (0, _.useState)(!1),
    [wt, ir] = (0, _.useState)({}),
    [Wr, Qr] = (0, _.useState)(!1),
    [or, lr] = (0, _.useState)(null),
    [cr, ur] = (0, _.useState)(!1),
    [St, dr] = (0, _.useState)("info"),
    [Xr, W] = (0, _.useState)(null),
    [Yr, ce] = (0, _.useState)(null),
    [en, Oe] = (0, _.useState)(null),
    [Fa, zt] = (0, _.useState)(!1),
    [be, pr] = (0, _.useState)(null),
    [w, V] = (0, _.useState)(Bt()),
    [tn, kt] = (0, _.useState)(!1),
    [rn, We] = (0, _.useState)(null),
    [Ua, nn] = (0, _.useState)(!1),
    [an, Va] = (0, _.useState)(null),
    [Ma, sn] = (0, _.useState)(!1),
    [At, on] = (0, _.useState)(null),
    [ln, cn] = (0, _.useState)([]),
    [Ja, mr] = (0, _.useState)(!1),
    [un, fr] = (0, _.useState)(null),
    [Ga, $t] = (0, _.useState)({}),
    [gr, dn] = (0, _.useState)(!1),
    [Ie, hr] = (0, _.useState)([]),
    [Ba, _r] = (0, _.useState)(!1),
    [ut, Ct] = (0, _.useState)(1),
    [Ka, vr] = (0, _.useState)(0),
    [Et, pn] = (0, _.useState)(""),
    [mn, Ot] = (0, _.useState)(null),
    [Qe, It] = (0, _.useState)(1),
    [Pt] = (0, _.useState)(20),
    [xr] = (0, _.useState)(20),
    [fn, gn] = (0, _.useState)(0),
    [Lt, Ha] = (0, _.useState)(""),
    [K, hn] = (0, _.useState)(navigator.onLine),
    [Zt, _n] = (0, _.useState)(!1),
    [br, Wa] = (0, _.useState)(0),
    [Xe, yr] = (0, _.useState)(null),
    [vn, Tt] = (0, _.useState)(null),
    [Ve, Qa] = (0, _.useState)(!1),
    [xn, $e] = (0, _.useState)(null),
    Rt = (0, _.useMemo)(() => Ju(), []),
    bn = (0, _.useRef)(null),
    dt = Vs(t?.role, t?.access_level),
    L =
      dt === "admin" ||
      dt === "gestionnaire" ||
      dt === "gerant" ||
      dt === "secretaire";
  ((0, _.useEffect)(() => {
    (Ye(), et(), tt(), Nn(), yn(), jr());
  }, []),
    (0, _.useEffect)(() => {
      const i = setTimeout(() => {
        (Ha(o.trim()), It(1));
      }, 300);
      return () => clearTimeout(i);
    }, [o]),
    (0, _.useEffect)(() => {
      const i = () => {
          (hn(!0), jn(), Dt(), yn(), jr());
        },
        c = () => hn(!1);
      return (
        window.addEventListener("online", i),
        window.addEventListener("offline", c),
        () => {
          (window.removeEventListener("online", i),
            window.removeEventListener("offline", c));
        }
      );
    }, []),
    (0, _.useEffect)(() => {
      const i = (c) => {
        const h = c.target,
          b = h?.tagName?.toLowerCase();
        b === "input" ||
          b === "textarea" ||
          h?.isContentEditable ||
          (c.ctrlKey &&
            c.key.toLowerCase() === "n" &&
            (c.preventDefault(), L && wn()),
          c.ctrlKey &&
            c.key.toLowerCase() === "f" &&
            (c.preventDefault(), bn.current?.focus()));
      };
      return (
        window.addEventListener("keydown", i),
        () => window.removeEventListener("keydown", i)
      );
    }, [L]),
    (0, _.useEffect)(() => {
      It(1);
    }, [d, x, Ve]),
    (0, _.useEffect)(() => {
      tt();
    }, [Lt, d, x, Ve, Qe, K]),
    (0, _.useEffect)(() => {
      jr();
    }, [Ve, K]),
    (0, _.useEffect)(() => {
      gr && Ya();
    }, [gr, ut, Et]));
  const Xa = (i) => {
      let c = i.slice();
      if (
        (Ve || (c = c.filter((p) => !p.deleted_at)),
        d && (c = c.filter((p) => p.statut === d)),
        x && (c = c.filter((p) => p.village === x)),
        Lt)
      ) {
        const p = Lt.toLowerCase();
        c = c.filter((y) =>
          `${y.reference} ${y.numero_lot} ${y.nom_lotissement} ${y.village} ${y.proprietaire_nom} ${y.proprietaire_prenom}`
            .toLowerCase()
            .includes(p),
        );
      }
      c.sort(
        (p, y) =>
          new Date(y.created_at).getTime() - new Date(p.created_at).getTime(),
      );
      const h = c.length,
        b = (Qe - 1) * Pt;
      return { paged: c.slice(b, b + Pt), total: h };
    },
    Ye = async () => {
      const i = await Yn(),
        { paged: c, total: h } = Xa(i);
      (a(c), gn(h), ir(na(i)), lr(null));
    },
    et = async () => {
      Wa(await Gu());
    },
    yn = async () => {
      if (!K) {
        (X(Jt), ke(!1));
        return;
      }
      const { data: i, error: c } = await I(() =>
        z
          .from("foncier_villages")
          .select("name")
          .order("name", { ascending: !0 }),
      );
      c ? (X(Jt), ke(!1)) : i && (X(i.map((h) => h.name)), ke(!0));
    },
    jr = async () => {
      if (!K) {
        ir(na(await Yn()));
        return;
      }
      (Qr(!0), lr(null));
      const { data: i, error: c } = await I(() =>
        z.rpc("foncier_stats_by_village", { p_include_archived: Ve }),
      );
      if (c) lr("Impossible de charger les statistiques par village.");
      else {
        const h = {};
        ((i || []).forEach((b) => {
          h[b.village] = {
            total: Number(b.total_superficie || 0),
            count: Number(b.lots_count || 0),
          };
        }),
          ir(h));
      }
      Qr(!1);
    },
    Dt = async () => {
      if (!navigator.onLine) return;
      const { data: i, error: c } = await I(() =>
        z.rpc("search_foncier_lots", {
          p_search: "",
          p_village: "",
          p_quartier: "",
          p_lotissement: "",
          p_statut: "",
          p_sort: "created_at",
          p_dir: "desc",
          p_page: 1,
          p_limit: 1e3,
          p_include_archived: !0,
        }),
      );
      if (!c && i)
        try {
          await ea(i);
        } catch (h) {
          h?.code === "OFFLINE_STORAGE_FULL" &&
            Tt(
              "Stockage local plein: impossible de rafraîchir le cache hors-ligne.",
            );
        }
    },
    tt = async () => {
      if ((l(!0), W(null), $e(null), !K)) {
        (await Ye(), l(!1));
        return;
      }
      const { data: i, error: c } = await I(() =>
        z.rpc("search_foncier_lots", {
          p_search: Lt,
          p_village: x,
          p_quartier: "",
          p_lotissement: "",
          p_statut: d,
          p_sort: "created_at",
          p_dir: "desc",
          p_page: Qe,
          p_limit: Pt,
          p_include_archived: Ve,
        }),
      );
      if (c)
        (W("Impossible de charger les lots fonciers. Réessayez."), await Ye());
      else {
        const h = i || [];
        if (
          (a(h),
          gn(
            h.length > 0 && h[0].total_count !== void 0 ? h[0].total_count : 0,
          ),
          h.length > 0)
        )
          try {
            await ea(h);
          } catch (b) {
            b?.code === "OFFLINE_STORAGE_FULL" &&
              W("Stockage local plein: cache hors-ligne non mis à jour.");
          }
      }
      l(!1);
    },
    Ya = async () => {
      if ((_r(!0), Ot(null), !K)) {
        (Ot("Mode hors-ligne : journal d’audit indisponible."),
          hr([]),
          vr(0),
          _r(!1));
        return;
      }
      const i = (ut - 1) * xr,
        c = i + xr - 1;
      let h = z
        .from("foncier_audit")
        .select(
          "id, lot_id, action, performed_by, performed_at, old_values, new_values, foncier_lots:lot_id(reference, numero_lot, village)",
          { count: "exact" },
        )
        .order("performed_at", { ascending: !1 })
        .range(i, c);
      Et && (h = h.eq("action", Et));
      const { data: b, error: p, count: y } = await I(() => h);
      if (p) (Ot("Impossible de charger le journal d’audit."), hr([]), vr(0));
      else {
        const m = b || [],
          P = Array.from(
            new Set(m.map((E) => E.performed_by).filter((E) => !!E)),
          );
        let T = new Ar();
        if (P.length > 0) {
          const { data: E } = await I(() =>
            z.from("user_profiles").select("id, full_name").in("id", P),
          );
          T = new Ar((E || []).map((D) => [D.id, D.full_name || ""]));
        }
        (hr(
          m.map((E) => ({
            id: E.id,
            parcelle_id: E.lot_id,
            action: E.action,
            utilisateur_nom: (E.performed_by && T.get(E.performed_by)) || null,
            date_action: E.performed_at,
            details: E.new_values || E.old_values || null,
            foncier_lots: E.foncier_lots || null,
          })),
        ),
          vr(y ?? 0));
      }
      _r(!1);
    },
    jn = async () => {
      if (!navigator.onLine || Zt) return;
      (_n(!0), Tt(null));
      const i = await qa(),
        c = [];
      let h = 0;
      yr({ current: 0, total: i.length });
      const b = i.sort((p, y) =>
        (p.client_updated_at || "").localeCompare(y.client_updated_at || ""),
      );
      for (let p = 0; p < b.length; p++) {
        const y = b[p];
        try {
          if (
            (yr({ current: p + 1, total: b.length }), y.op === "upsert_lot")
          ) {
            let m = y.payload;
            if (!m.lotissement_id || !m.ilot_id) {
              const { data: G, error: B } = await I(() =>
                z.rpc("ensure_foncier_hierarchy", {
                  p_village: m.village || "",
                  p_lotissement: m.nom_lotissement || "",
                  p_ilot: m.numero_ilot || "",
                }),
              );
              if (!B && G) {
                const Ne = Array.isArray(G) ? G[0] : G;
                m = {
                  ...m,
                  lotissement_id:
                    Ne?.lotissement_id || m.lotissement_id || null,
                  ilot_id: Ne?.ilot_id || m.ilot_id || null,
                };
              } else if (B) {
                h++;
                continue;
              }
            }
            const { data: P, error: T } = await I(() =>
              z
                .from("foncier_lots")
                .select("id, updated_at, client_updated_at, row_version")
                .eq("id", m.id)
                .maybeSingle(),
            );
            if (T) {
              h++;
              continue;
            }
            const E = Number(P?.row_version || 0),
              D = Number(m?.row_version || 0);
            if (P && E > D) {
              c.push(`${m.reference || m.id} (version serveur plus récente)`);
              continue;
            }
            const Y = new Date(
                P?.client_updated_at || P?.updated_at || 0,
              ).getTime(),
              Q = new Date(
                y.client_updated_at || m.client_updated_at || m.updated_at || 0,
              ).getTime();
            if (P && Y > Q) {
              c.push(`${m.reference || m.id} (modifié sur le serveur)`);
              continue;
            }
            let M;
            if (P) {
              const { error: G } = await I(() =>
                z
                  .from("foncier_lots")
                  .update(m)
                  .eq("id", m.id)
                  .eq("row_version", m?.row_version ?? 1),
              );
              M = G;
            } else {
              const { error: G } = await I(() =>
                z.from("foncier_lots").insert(m),
              );
              M = G;
            }
            if (M) {
              h++;
              continue;
            }
            await ht(y.id);
          }
          if (y.op === "soft_delete_lot") {
            const m = y.payload,
              { error: P } = await I(() =>
                z.rpc("soft_delete_foncier_lot", {
                  p_lot_id: m.id,
                  p_reason: m.deleted_reason || "archivage",
                }),
              );
            if (P) {
              h++;
              continue;
            }
            await ht(y.id);
          }
          if (y.op === "restore_lot") {
            const m = y.payload,
              { error: P } = await I(() =>
                z.rpc("restore_foncier_lot", { p_lot_id: m.id }),
              );
            if (P) {
              h++;
              continue;
            }
            await ht(y.id);
          }
          if (y.op === "audit_log") {
            const { error: m } = await I(() => si(z, y.payload));
            if (m) {
              h++;
              continue;
            }
            await ht(y.id);
          }
          if (y.op === "pending_attestation") {
            const {
                attestation: m,
                temoins: P,
                control_number: T,
                payloadToSign: E,
                desired_status: D,
              } = y.payload,
              Y = D || m.statut || "soumis",
              Q = E || y.payload?.payloadBase || {},
              { data: M, error: G } = await I(() =>
                z
                  .from("foncier_attestations")
                  .select("id, signature_numerique, statut, version")
                  .eq("id", m.id)
                  .maybeSingle(),
              );
            if (G) {
              h++;
              continue;
            }
            const { data: B, error: Ne } = await I(() =>
              z
                .from("foncier_attestations")
                .select("version")
                .eq("lot_id", m.lot_id)
                .order("version", { ascending: !1 })
                .limit(1),
            );
            if (!Ne) {
              const se = (B && B[0] && B[0].version) || 0;
              Number(m.version || 1) <= se &&
                ((m.version = se + 1), (Q.version = m.version));
            }
            (m.signature_nonce || (m.signature_nonce = Je()),
              m.signature_issued_at ||
                (m.signature_issued_at = new Date().toISOString()),
              (Q.signature_nonce = m.signature_nonce),
              (Q.signature_issued_at = m.signature_issued_at),
              Y === "valide" && (Q.statut = "valide"));
            const ye = { ...Q };
            delete ye.hash_sha256;
            const ae = await Bs(JSON.stringify(ye)),
              we = { ...ye, hash_sha256: ae },
              $ = JSON.stringify(we);
            if (
              ((m.qr_payload = $),
              (m.hash_sha256 = ae),
              (m.control_number = T),
              Y !== "valide" && (m.statut = Y),
              M)
            ) {
              const { error: se, data: Ae } = await I(() =>
                z
                  .from("foncier_attestations")
                  .update({
                    qr_payload: $,
                    hash_sha256: ae,
                    control_number: T,
                    statut: Y === "valide" ? m.statut : Y,
                    updated_at: new Date().toISOString(),
                    client_updated_at: new Date().toISOString(),
                    last_modified_device_id: Rt,
                  })
                  .eq("id", m.id)
                  .select()
                  .single(),
              );
              if (se) {
                h++;
                continue;
              }
            } else {
              const { error: se, data: Ae } = await I(() =>
                z.from("foncier_attestations").insert(m).select().single(),
              );
              if (se) {
                h++;
                continue;
              }
            }
            const { data: Se } = await I(() =>
              z
                .from("foncier_attestation_temoins")
                .select("id")
                .eq("attestation_id", m.id)
                .limit(1),
            );
            if (!Se || Se.length === 0) {
              const { error: se } = await I(() =>
                z.from("foncier_attestation_temoins").insert(P),
              );
              if (se) {
                h++;
                continue;
              }
            }
            if (
              Y === "valide" &&
              (!M?.signature_numerique || M?.statut !== "valide")
            ) {
              const se = await Sn(m.id, we);
              if (!se) {
                h++;
                continue;
              }
              const { error: Ae } = await I(() =>
                z
                  .from("foncier_attestations")
                  .update({
                    qr_payload: $,
                    signature_numerique: se,
                    hash_sha256: ae,
                    control_number: T,
                    statut: "valide",
                    signature_nonce: m.signature_nonce,
                    signature_issued_at: m.signature_issued_at,
                    updated_at: new Date().toISOString(),
                    client_updated_at: new Date().toISOString(),
                    last_modified_device_id: Rt,
                  })
                  .eq("id", m.id),
              );
              if (Ae) {
                h++;
                continue;
              }
              await I(() =>
                Ce(z, {
                  lotId: m.lot_id,
                  action: "VALIDATION_CHEF",
                  details: { attestation_id: m.id, reference: m.reference },
                }),
              );
            }
            (Y !== "valide" &&
              (await I(() =>
                Ce(z, {
                  lotId: m.lot_id,
                  action: "SOUMISSION_CHEF",
                  details: { attestation_id: m.id, reference: m.reference },
                }),
              )),
              await ht(y.id));
          }
        } catch {
          h++;
        }
      }
      (c.length > 0
        ? Tt(
            `Conflits détectés : ${c.length} lot(s). Les versions serveur ont été conservées.`,
          )
        : h > 0 &&
          Tt(
            `${h} erreur(s) de synchronisation. Les items en erreur seront réessayés.`,
          ),
        await et(),
        await Dt(),
        yr(null),
        _n(!1));
    },
    es = () => {
      if (!L) {
        W("Accès refusé. Vous ne pouvez pas consulter l'audit.");
        return;
      }
      (pn(""), Ct(1), Ot(null), dn(!0));
    },
    ts = (i) => {
      (Va(i), nn(!0));
    },
    rs = async (i) => {
      if (!i.length) {
        $t({});
        return;
      }
      const { data: c, error: h } = await I(() =>
        z
          .from("media_usage")
          .select("entity_id, media_files!inner(url, original_name)")
          .eq("entity_type", "foncier_attestation")
          .eq("usage_type", "attestation_scan")
          .in("entity_id", i),
      );
      if (h) {
        $t({});
        return;
      }
      const b = {};
      ((c || []).forEach((p) => {
        const y = p?.media_files;
        p?.entity_id &&
          y?.url &&
          (b[p.entity_id] = {
            url: y.url,
            original_name: y.original_name || "Scan",
          });
      }),
        $t(b));
    },
    ns = async (i) => {
      if (!L) {
        W("Accès refusé. Vous ne pouvez pas consulter l'historique.");
        return;
      }
      if (!K) {
        W("Connexion requise pour consulter l’historique.");
        return;
      }
      (on(i), sn(!0), mr(!0), fr(null));
      const c =
          "id, reference, version, statut, created_at, date_etablissement, deleted_at, validation_chef_date",
        h =
          "id, reference, version, statut, created_at, date_etablissement, validation_chef_date",
        b = (T) =>
          I(() =>
            z
              .from("foncier_attestations")
              .select(T ? c : h)
              .eq("lot_id", i.id)
              .order("created_at", { ascending: !1 }),
          ),
        p = Pe !== !1;
      let { data: y, error: m } = await b(p);
      if (
        (m && ta(m, "deleted_at")
          ? ((Pe = !1), ({ data: y, error: m } = await b(!1)))
          : !m && p && Pe === null && (Pe = !0),
        m)
      ) {
        (fr("Impossible de charger l’historique des attestations."), mr(!1));
        return;
      }
      const P = y || [];
      (cn(P), await rs(P.map((T) => T.id)), mr(!1));
    },
    as = (i) => {
      const c = i.replace(/"/g, '""');
      return /[;"\n]/.test(c) ? `"${c}"` : c;
    },
    ss = () => {
      if (!Ie.length) return;
      const i = [
          "Date",
          "Action",
          "Utilisateur",
          "Référence",
          "Lot",
          "Village",
          "Détails",
        ],
        c = Ie.map((m) => {
          const P = Array.isArray(m.foncier_lots)
            ? m.foncier_lots[0]
            : m.foncier_lots;
          return [
            Le(m.date_action),
            m.action,
            m.utilisateur_nom || "",
            P?.reference || "",
            P?.numero_lot || "",
            P?.village || "",
            JSON.stringify(m.details || {}),
          ]
            .map(as)
            .join(";");
        }),
        h = [i.join(";"), ...c].join(`
`),
        b = new Blob([`\uFEFF${h}`], { type: "text/csv;charset=utf-8" }),
        p = URL.createObjectURL(b),
        y = document.createElement("a");
      ((y.href = p),
        (y.download = `audit-foncier-${Ze()}.csv`),
        y.click(),
        URL.revokeObjectURL(p));
    },
    is = () => {
      Ie.length &&
        Hs({
          title: "Journal d'audit foncier",
          generated_at: Le(Ze()),
          rows: Ie.map((i) => {
            const c = Array.isArray(i.foncier_lots)
              ? i.foncier_lots[0]
              : i.foncier_lots;
            return {
              date_action: Le(i.date_action),
              action: i.action,
              utilisateur_nom: i.utilisateur_nom || "",
              parcelle_reference: c?.reference || "",
              village: c?.village || "",
              details: JSON.stringify(i.details || {}),
            };
          }),
          logoUrl: e.logo_url,
        });
    },
    Nn = async (i = ue) => {
      if ((Oe(null), !K))
        return (Oe("Mode hors-ligne : configuration non actualisée."), U);
      const { data: c, error: h } = await I(() =>
        z.from("foncier_village_config").select("key, value").eq("village", i),
      );
      if (h)
        return (Oe("Impossible de charger la configuration du village."), null);
      const b = { ...Ir, village: i };
      return (
        (c || []).forEach((p) => {
          Object.prototype.hasOwnProperty.call(b, p.key) &&
            (b[p.key] = p.value || "");
        }),
        le(b),
        bt(!0),
        jt(i),
        Nt(i),
        b
      );
    },
    Me = async (i = ue) => (!K || (He && yt === i) ? U : (await Nn(i)) || U),
    Nr = async (i, c) => {
      const h = c?.select || "*, foncier_attestation_temoins(*)",
        b = c?.includeArchived ?? !1,
        p = (P) =>
          I(() => {
            let T = z
              .from("foncier_attestations")
              .select(h)
              .eq("lot_id", i)
              .order("created_at", { ascending: !1 })
              .limit(1);
            return (!b && P && (T = T.is("deleted_at", null)), T.maybeSingle());
          }),
        y = Pe !== !1;
      let m = await p(y);
      return (
        m.error && ta(m.error, "deleted_at")
          ? ((Pe = !1), (m = await p(!1)))
          : !m.error && y && Pe === null && (Pe = !0),
        m
      );
    },
    wn = async () => {
      if (!L) {
        W("Accès refusé. Vous ne pouvez pas créer de lot foncier.");
        return;
      }
      const i = await Me(ue);
      (C({
        ...Gt(),
        reference: mt(),
        village: i.village || ue,
        commune: i.commune,
        departement: i.departement,
        region: i.region,
        chef_village: i.chef_village,
        arrete_prefectoral: i.arrete_prefectoral,
      }),
        me(null),
        ce(null),
        dr("info"),
        j(!0));
    },
    os = (i) => {
      if (!L) {
        W("Accès refusé. Vous ne pouvez pas modifier les lots fonciers.");
        return;
      }
      if (i.deleted_at) {
        W("Ce lot est archivé. Restaurez-le avant modification.");
        return;
      }
      (C({
        reference: i.reference,
        numero_lot: i.numero_lot,
        numero_ilot: i.numero_ilot,
        nom_lotissement: i.nom_lotissement,
        quartier: i.quartier,
        village: i.village,
        commune: i.commune,
        departement: i.departement,
        region: i.region,
        superficie: String(i.superficie),
        code_barre: "",
        proprietaire_nom: i.proprietaire_nom,
        proprietaire_prenom: i.proprietaire_prenom,
        proprietaire_naissance_date: i.proprietaire_naissance_date,
        proprietaire_naissance_lieu: i.proprietaire_naissance_lieu,
        proprietaire_cni_numero: i.proprietaire_cni_numero,
        proprietaire_cni_date: i.proprietaire_cni_date,
        proprietaire_cni_lieu: i.proprietaire_cni_lieu,
        proprietaire_profession: i.proprietaire_profession,
        proprietaire_telephone: i.proprietaire_telephone,
        chef_village: i.chef_village,
        arrete_prefectoral: i.arrete_prefectoral,
        arrete_date: i.arrete_date,
        statut: i.statut,
        date_cession: i.date_cession || Ze(),
        prix_cession: String(i.prix_cession),
        notes: i.notes,
      }),
        me(i.id),
        ce(null),
        dr("info"),
        j(!0));
    },
    ls = async () => {
      if (!L) {
        W("Accès refusé. Vous ne pouvez pas modifier la configuration.");
        return;
      }
      (R({ ...(await Me(ue)) }), Oe(null), pe(!0));
    },
    cs = async (i) => {
      (Nt(i), R({ ...(await Me(i)) }));
    },
    wr = async (i) => {
      if (!L) {
        W("Accès refusé. Vous ne pouvez pas générer d’attestation.");
        return;
      }
      if (i.deleted_at) {
        W("Lot archivé. Restaurez-le avant génération.");
        return;
      }
      const c = await Me(i.village || ue);
      (pr(i),
        V({
          ...Bt(),
          attestation_type: i.statut === "vendu" ? "cession" : "standard",
          validation_agent_nom: t?.full_name || "",
          validation_chef_nom: c.nom_chef_signe || c.chef_village || "",
        }),
        We(null),
        zt(!0));
    },
    Sn = async (i, c) => {
      try {
        const { data: h, error: b } = await I(() =>
          z.functions.invoke("attestation-sign", {
            body: { attestation_id: i, payload: JSON.stringify(c) },
          }),
        );
        return b ? "" : h?.signature || "";
      } catch {
        return "";
      }
    },
    pt = (i, c, h) => {
      V((b) => ({
        ...b,
        temoins: b.temoins.map((p, y) => (y === i ? { ...p, [c]: h } : p)),
      }));
    },
    us = async (i, c, h) => {
      const b = await Me(i.village || ue),
        p = Tu(c);
      if (!p.success && p.errors)
        return { success: !1, error: Object.values(p.errors)[0], config: b };
      const y = p.parsedData;
      if (!y)
        return {
          success: !1,
          error: "Validation de l'attestation impossible.",
          config: b,
        };
      const m = c.attestation_type === "cession" ? "cession" : "standard",
        P = m === "cession";
      if (P && !h)
        return {
          success: !1,
          error: "Connexion requise pour réémettre une attestation de cession.",
          config: b,
        };
      if (P) {
        const D = q(c.cedant_nom || ""),
          Y = q(c.cedant_prenom || ""),
          Q = q(c.cedant_cni_numero || "");
        if (!D || !Y)
          return {
            success: !1,
            error:
              "Pour une cession, les nom et prénoms du cédant sont requis.",
            config: b,
          };
        if (!Q)
          return {
            success: !1,
            error: "Pour une cession, la CNI du cédant est requise.",
            config: b,
          };
      }
      if (!h)
        return {
          success: !1,
          error:
            "Connexion requise : la référence officielle, le numéro de contrôle et le hash sont générés côté serveur dans une transaction sécurisée.",
          config: b,
        };
      const T = ve(c.registre_page),
        E = ve(c.registre_ligne);
      return c.registre_page.trim() && T === null
        ? { success: !1, error: "La page du registre est invalide.", config: b }
        : c.registre_ligne.trim() && E === null
          ? {
              success: !1,
              error: "La ligne du registre est invalide.",
              config: b,
            }
          : {
              success: !0,
              config: b,
              parsedAttestation: y,
              attestationType: m,
              isCessionAttestation: P,
              registrePage: T,
              registreLigne: E,
            };
    },
    ds = async (i, c, h, b, p) => {
      let y = null;
      if (p) {
        const { data: G, error: B } = await Nr(i.id, {
          includeArchived: !1,
          select:
            "id, reference, version, numero_enregistrement, control_number, statut",
        });
        if (B)
          return {
            success: !1,
            error: "Impossible de charger l'attestation précédente.",
          };
        if (!G)
          return {
            success: !1,
            error: "Aucune attestation active à réémettre pour cette cession.",
          };
        y = G;
      }
      const m = Je(),
        P = new Date().toISOString(),
        T = q(w.validation_agent_nom || t?.full_name || ""),
        E = q(
          w.validation_chef_nom || h.nom_chef_signe || h.chef_village || "",
        ),
        D = Du({
          attestationForm: c,
          attestationLot: i,
          config: h,
          signatureNonce: m,
          signatureIssuedAt: P,
          deviceId: Rt,
          baseAttestationId: y?.id ?? null,
          isCession: p,
        }),
        { data: Y, error: Q } = await I(() =>
          z.rpc("create_foncier_attestation_atomic", D),
        ),
        M = Array.isArray(Y) ? Y[0] : Y;
      return Q || !M
        ? {
            success: !1,
            error: Q?.message || "Création de l'attestation impossible.",
          }
        : (await I(() =>
            Ce(z, {
              lotId: i.id,
              action: "SOUMISSION_CHEF",
              details: { attestation_id: M.id, reference: M.reference },
            }),
          ),
          p &&
            y &&
            (await I(() =>
              Ce(z, {
                lotId: i.id,
                action: "ARCHIVAGE_ATTESTATION",
                details: { attestation_id: y.id, reference: y.reference },
              }),
            ),
            await I(() =>
              Ce(z, {
                lotId: i.id,
                action: "REEMISSION_CESSION",
                details: {
                  attestation_id: M.id,
                  reference: M.reference,
                  archived_attestation_id: y.id,
                },
              }),
            )),
          {
            success: !0,
            createdAttestation: M,
            baseAttestation: y,
            agentName: T,
            chefName: E,
            attestationType: b,
          });
    },
    ps = async (i) => {
      const c = Kt({
          reference: i.reference,
          control_number: i.control_number || "",
          hash_sha256: i.hash_sha256 || "",
        }),
        h = await Lr(c);
      let b = i.statut || "soumis";
      const p = Pr(i.qr_payload) || {};
      try {
        (await Sn(i.id, p))
          ? (b = "valide")
          : $e(
              "Attestation créée. Signature numérique non appliquée, le document reste soumis.",
            );
      } catch {
        $e(
          "Attestation créée. Signature numérique en attente ou indisponible.",
        );
      }
      return {
        qrDataUrl: h,
        qrVerificationUrl: c,
        finalStatus: b,
        payloadToSign: p,
      };
    },
    ms = async (i, c, h, b, p, y, m, P, T, E) => {
      $n(
        Wu(
          {
            ...i,
            original: b.original,
            statut: m,
            type: P,
            validation_agent_nom: T,
            validation_chef_nom: E,
          },
          c,
          h,
          b,
          p,
          gpsPoints,
          y,
        ),
      );
      const { error: D } = await I(() =>
        Ce(z, {
          lotId: c.id,
          action: "IMPRESSION",
          details: { attestation_id: i.id, reference: i.reference },
        }),
      );
      if (D)
        try {
          (await Mt({
            id: Je(),
            op: "audit_log",
            payload: {
              lot_id: c.id,
              action: "IMPRESSION",
              details: { attestation_id: i.id, reference: i.reference },
            },
            client_updated_at: new Date().toISOString(),
          }),
            await et(),
            $e("Impression OK. Journalisation en attente de synchronisation."));
        } catch {
          $e("Impression OK, mais journalisation impossible.");
        }
    },
    fs = async () => {
      if (!be) return;
      We(null);
      const i = await us(be, w, K);
      if (!i.success) {
        We(i.error);
        return;
      }
      const {
        config: c,
        parsedAttestation: h,
        attestationType: b,
        isCessionAttestation: p,
      } = i;
      kt(!0);
      try {
        const y = await ds(be, h, c, b, p);
        if (!y.success) {
          (kt(!1), We(y.error));
          return;
        }
        const { createdAttestation: m, agentName: P, chefName: T } = y,
          E = await ps(m);
        (await ms(
          m,
          be,
          c,
          w,
          E.qrDataUrl,
          E.qrVerificationUrl,
          E.finalStatus,
          b,
          P,
          T,
        ),
          kt(!1),
          zt(!1),
          pr(null),
          V(Bt()));
      } catch {
        (kt(!1),
          We(
            "Une erreur inattendue s'est produite lors de la génération de l'attestation.",
          ));
      }
    },
    gs = async () => {
      if ((ce(null), !L)) {
        ce("Accès refusé. Vous ne pouvez pas modifier les lots fonciers.");
        return;
      }
      const i = Zu(g);
      if (!i.success && i.errors) {
        const $ = Object.values(i.errors)[0];
        ce($);
        return;
      }
      const c = i.parsedData;
      if (!c) {
        ce("Validation impossible. Veuillez vérifier les champs.");
        return;
      }
      const h = g.village.trim();
      if (h.length < 2 || h.length > 100) {
        ce("Le nom du village doit contenir entre 2 et 100 caractères.");
        return;
      }
      const b = Number(c.superficie || 0),
        p = Number(c.prix_cession || 0),
        y = c.proprietaire_naissance_date || "",
        m = c.proprietaire_cni_date || "",
        P = c.arrete_date || "",
        T = r.find(
          ($) =>
            $.village === g.village &&
            $.nom_lotissement === g.nom_lotissement &&
            $.numero_ilot === g.numero_ilot &&
            $.numero_lot === g.numero_lot &&
            $.id !== re,
        );
      if (T) {
        ce(`Un lot existe déjà avec ces caractéristiques : ${T.reference}.`);
        return;
      }
      if (K) {
        const { data: $, error: Se } = await I(() =>
          z
            .from("foncier_lots")
            .select("id, reference")
            .eq("village", g.village)
            .eq("nom_lotissement", g.nom_lotissement)
            .eq("numero_ilot", g.numero_ilot)
            .eq("numero_lot", g.numero_lot)
            .neq("id", re || "00000000-0000-0000-0000-000000000000")
            .is("deleted_at", null)
            .maybeSingle(),
        );
        if ($) {
          ce(`Un lot existe déjà avec ces caractéristiques : ${$.reference}.`);
          return;
        }
        const { data: se, error: Ae } = await I(() =>
          z.rpc("check_foncier_duplicate", {
            p_village: g.village,
            p_lotissement: g.nom_lotissement,
            p_ilot: g.numero_ilot || "",
            p_lot: g.numero_lot,
            p_exclude_lot_id: re || null,
          }),
        );
        if (se && se.length > 0 && se[0].is_duplicate) {
          ce(
            `Un lot existe déjà avec ces caractéristiques : ${se[0].existing_reference}. Doublon détecté par le système.`,
          );
          return;
        }
      }
      H(!0);
      let E = null;
      if (K) {
        const { data: $, error: Se } = await I(() =>
          z.rpc("ensure_foncier_hierarchy", {
            p_village: q(g.village),
            p_lotissement: q(g.nom_lotissement),
            p_ilot: q(g.numero_ilot),
          }),
        );
        if (Se) {
          (ce(
            `Impossible de créer la hiérarchie foncière : ${Se.message || "Vérifiez que le village, le lotissement et l'îlot sont valides."}`,
          ),
            H(!1));
          return;
        }
        if (!$) {
          (ce(
            "Impossible de créer la hiérarchie foncière. Aucune donnée retournée.",
          ),
            H(!1));
          return;
        }
        E = Array.isArray($) ? $[0] : $;
      }
      const D = new Date().toISOString(),
        Y = g.date_cession || Ze(),
        Q = re || Je(),
        M = r.find(($) => $.id === re),
        G = !!(
          re &&
          M &&
          (M.village !== g.village ||
            M.nom_lotissement !== g.nom_lotissement ||
            M.numero_ilot !== g.numero_ilot ||
            M.numero_lot !== g.numero_lot)
        );
      let B = g.reference?.trim() || mt();
      if ((G && ((B = mt()), C(($) => ({ ...$, reference: B }))), K)) {
        const { data: $, error: Se } = await I(() =>
          z
            .from("foncier_lots")
            .select("id")
            .eq("reference", B)
            .neq("id", re || "00000000-0000-0000-0000-000000000000")
            .maybeSingle(),
        );
        if ($) {
          const se = mt();
          (C((Ae) => ({ ...Ae, reference: se })),
            ce(
              "Référence déjà utilisée. Une nouvelle référence a été générée, veuillez réessayer.",
            ),
            H(!1));
          return;
        }
      }
      const Ne = {
        id: Q,
        reference: B,
        numero_lot: q(g.numero_lot),
        numero_ilot: q(g.numero_ilot),
        nom_lotissement: q(g.nom_lotissement),
        quartier: q(g.quartier),
        village: q(g.village),
        lotissement_id: E?.lotissement_id || null,
        ilot_id: E?.ilot_id || null,
        commune: q(g.commune),
        departement: q(g.departement),
        region: q(g.region),
        superficie: b,
        code_barre: "",
        proprietaire_nom: q(g.proprietaire_nom),
        proprietaire_prenom: q(g.proprietaire_prenom),
        proprietaire_naissance_date: q(y),
        proprietaire_naissance_lieu: q(g.proprietaire_naissance_lieu),
        proprietaire_cni_numero: q(g.proprietaire_cni_numero),
        proprietaire_cni_date: q(m),
        proprietaire_cni_lieu: q(g.proprietaire_cni_lieu),
        proprietaire_profession: q(g.proprietaire_profession),
        proprietaire_telephone: q(g.proprietaire_telephone),
        chef_village: q(g.chef_village),
        arrete_prefectoral: q(g.arrete_prefectoral),
        arrete_date: q(P),
        statut: g.statut,
        date_cession: Y,
        prix_cession: p,
        notes: oa.sanitize(g.notes),
        client_updated_at: D,
        last_modified_device_id: Rt,
        updated_at: D,
        created_at: M?.created_at || D,
        deleted_at: M?.deleted_at || null,
        row_version: M?.row_version ?? 1,
        retention_until: M?.retention_until ?? null,
      };
      if (!K)
        try {
          (await Vt(Ne),
            await Mt({
              id: Je(),
              op: "upsert_lot",
              payload: Ne,
              client_updated_at: D,
            }),
            await et(),
            $e("Lot enregistré hors-ligne. Synchronisation en attente."),
            H(!1),
            j(!1),
            C(Gt()),
            me(null),
            await Ye());
          return;
        } catch ($) {
          ($?.code === "OFFLINE_STORAGE_FULL"
            ? ce("Stockage local plein. Libérez de l’espace puis réessayez.")
            : ce("Impossible de sauvegarder hors-ligne."),
            H(!1));
          return;
        }
      let ye = null,
        ae = null,
        we = null;
      if (re) {
        const $ = await I(() =>
          z
            .from("foncier_lots")
            .update(Ne)
            .eq("id", re)
            .eq("row_version", M?.row_version ?? 1)
            .select("*")
            .single(),
        );
        ((ye = $.data),
          (ae = $.error?.message || null),
          (we = $.error?.code || null));
      } else {
        const $ = await I(() =>
          z.from("foncier_lots").insert(Ne).select("*").single(),
        );
        ((ye = $.data),
          (ae = $.error?.message || null),
          (we = $.error?.code || null));
      }
      if (ae) {
        let $;
        (we === "23505" ||
        ae.includes("duplicate") ||
        ae.includes("déjà") ||
        ae.includes("unique")
          ? ae.includes("foncier_lots_unique_location")
            ? ($ =
                "Un lot existe déjà avec ces caractéristiques (village, lotissement, îlot, lot). Veuillez vérifier les saisies ou contacter un administrateur.")
            : ae.includes("reference")
              ? ($ =
                  "Un lot avec cette référence existe déjà. Veuillez rafraîchir la page et réessayer.")
              : ($ =
                  "Un doublon a été détecté. Vérifiez que ce lot n'existe pas déjà.")
          : ae.includes("hiérarchie") || ae.includes("hierarchy")
            ? ($ =
                "Erreur de hiérarchie foncière. Vérifiez les données du village.")
            : ae.includes("constraint") || ae.includes("contrainte")
              ? ($ =
                  "Erreur de contrainte de clé étrangère. Vérifiez que le lotissement et l'îlot existent.")
              : ($ = `Erreur: ${ae}`),
          ce($),
          H(!1));
        return;
      }
      if (re && !ye) {
        (ce("Conflit de version détecté. Rafraîchissez la liste et réessayez."),
          H(!1));
        return;
      }
      (ye && (await Vt(ye)), H(!1), j(!1), C(Gt()), me(null), tt());
    },
    hs = async (i) => {
      if (!L) {
        W("Accès refusé. Vous ne pouvez pas archiver les lots fonciers.");
        return;
      }
      if (!confirm("Archiver ce lot foncier ?")) return;
      W(null);
      const c = new Date().toISOString();
      if (!K) {
        const b = {
          ...i,
          deleted_at: c,
          deleted_reason: "archivage",
          client_updated_at: c,
        };
        try {
          (await Vt(b),
            await Mt({
              id: Je(),
              op: "soft_delete_lot",
              payload: { id: i.id, deleted_reason: "archivage" },
              client_updated_at: c,
            }),
            await et(),
            $e("Lot archivé hors-ligne. Synchronisation en attente."),
            await Ye());
          return;
        } catch (p) {
          W(
            p?.code === "OFFLINE_STORAGE_FULL"
              ? "Stockage local plein. Archivage hors-ligne impossible."
              : "Archivage hors-ligne impossible.",
          );
          return;
        }
      }
      const { error: h } = await I(() =>
        z.rpc("soft_delete_foncier_lot", {
          p_lot_id: i.id,
          p_reason: "archivage",
        }),
      );
      if (h) {
        W("Archivage impossible. Vérifiez vos droits ou réessayez.");
        return;
      }
      (await Dt(), tt());
    },
    _s = async (i) => {
      if (!L) {
        W("Accès refusé. Vous ne pouvez pas restaurer les lots fonciers.");
        return;
      }
      if (!confirm("Restaurer ce lot foncier ?")) return;
      W(null);
      const c = new Date().toISOString();
      if (!K) {
        const b = {
          ...i,
          deleted_at: null,
          deleted_reason: null,
          client_updated_at: c,
        };
        try {
          (await Vt(b),
            await Mt({
              id: Je(),
              op: "restore_lot",
              payload: { id: i.id },
              client_updated_at: c,
            }),
            await et(),
            $e("Lot restauré hors-ligne. Synchronisation en attente."),
            await Ye());
          return;
        } catch (p) {
          W(
            p?.code === "OFFLINE_STORAGE_FULL"
              ? "Stockage local plein. Restauration hors-ligne impossible."
              : "Restauration hors-ligne impossible.",
          );
          return;
        }
      }
      const { error: h } = await I(() =>
        z.rpc("restore_foncier_lot", { p_lot_id: i.id }),
      );
      if (h) {
        W("Restauration impossible. Vérifiez vos droits ou réessayez.");
        return;
      }
      (await Dt(), tt());
    },
    vs = async () => {
      if (!L) {
        Oe("Accès refusé. Vous ne pouvez pas modifier la configuration.");
        return;
      }
      if (!K) {
        Oe("Connexion requise pour sauvegarder la configuration.");
        return;
      }
      (ur(!0), Oe(null));
      const i = Object.entries(k).map(([h, b]) => ({
          village: ue,
          key: h,
          value: b,
          updated_at: new Date().toISOString(),
        })),
        { error: c } = await I(() =>
          z
            .from("foncier_village_config")
            .upsert(i, { onConflict: "village,key" }),
        );
      if (c) {
        (ur(!1),
          Oe("Sauvegarde impossible. Vérifiez vos droits ou réessayez."));
        return;
      }
      (ur(!1), pe(!1), le(k), bt(!0), jt(ue));
    },
    xs = async (i) => {
      const c = await Me(i.village || ue);
      if (!K) {
        (W(
          "Hors ligne : utilisez le bouton Attestation pour générer un brouillon.",
        ),
          await wr(i));
        return;
      }
      const { data: h, error: b } = await Nr(i.id, {
        includeArchived: !1,
        select: "*, foncier_attestation_temoins(*)",
      });
      if (b) {
        W("Impossible de charger l’attestation moderne. Réessayez.");
        return;
      }
      if (!h) {
        ($e("Aucune attestation moderne trouvée. Veuillez la créer."),
          await wr(i));
        return;
      }
      const p = h,
        y = (p.foncier_attestation_temoins || []).map((je) => ({
          nom: je.nom,
          prenom: je.prenom,
          profession: je.profession || "",
          telephone: je.telephone || "",
          cni: je.cni || "",
        })),
        m = Pr(p.qr_payload),
        P = Kt({
          reference: p.reference,
          control_number: p.control_number || "",
          hash_sha256: p.hash_sha256 || "",
          baseUrl: String(m?.verification_url || ""),
        }),
        T = await Lr(P),
        E = m?.village || {},
        D = m?.parcelle || {},
        Y = D.limites || {},
        Q = D.coordonnees_gps || null,
        M = Array.isArray(D.gps_points) ? D.gps_points : null,
        G = m?.titulaire || {},
        B = m?.acquisition || {},
        Ne = m?.autorites || {},
        ye = m?.validation || {},
        ae = m?.registre || {},
        we = m?.cession || {},
        $ = we.cedant || {},
        Se = String(m?.attestation_type || "") || p.type || "",
        se = Se.toLowerCase(),
        Ae = Array.isArray(m?.temoins) ? m?.temoins : null,
        Ns =
          Ae && Ae.length
            ? Ae.map((je) => ({
                nom: String(je.nom || ""),
                prenom: String(je.prenom || ""),
                profession: String(je.profession || ""),
                telephone: String(je.telephone || ""),
                cni: String(je.cni || ""),
              }))
            : y;
      if (
        ($n({
          reference: p.reference,
          numero_enregistrement:
            m?.numero_enregistrement || p.numero_enregistrement || p.reference,
          date_etablissement: Le(p.date_etablissement || Ze()),
          original: typeof m?.original == "boolean" ? m?.original : !0,
          draft: p.statut !== "valide",
          region: String(E.region || c.region || i.region || "REGION"),
          departement: String(
            E.departement || c.departement || i.departement || "DEPARTEMENT",
          ),
          commune: String(E.commune || c.commune || i.commune || "COMMUNE"),
          village: String(E.village || c.village || i.village || "VILLAGE"),
          quartier: String(E.quartier || i.quartier || ""),
          lotissement: String(E.lotissement || i.nom_lotissement || ""),
          numero_lot: String(E.numero_lot || i.numero_lot || ""),
          superficie_m2:
            typeof D.superficie_m2 == "number"
              ? D.superficie_m2
              : i.superficie || 0,
          limites: {
            nord: String(Y.nord || p.limites_nord || ""),
            sud: String(Y.sud || p.limites_sud || ""),
            est: String(Y.est || p.limites_est || ""),
            ouest: String(Y.ouest || p.limites_ouest || ""),
          },
          coordonnees_gps:
            Q && Q.lat != null && Q.lng != null
              ? {
                  lat: Number(Q.lat),
                  lng: Number(Q.lng),
                  precision: Q.precision ?? void 0,
                }
              : p.gps_lat != null && p.gps_lng != null
                ? {
                    lat: Number(p.gps_lat),
                    lng: Number(p.gps_lng),
                    precision: p.gps_precision ?? void 0,
                  }
                : void 0,
          gps_points: M || p.gps_points || void 0,
          mode_acquisition: String(B.mode || p.mode_acquisition || ""),
          historique_possession: String(
            B.historique || p.historique_possession || "",
          ),
          proprietaire_nom: String(G.nom || i.proprietaire_nom || ""),
          proprietaire_prenom: String(G.prenom || i.proprietaire_prenom || ""),
          proprietaire_naissance_date: String(
            G.naissance_date || i.proprietaire_naissance_date || "",
          ),
          proprietaire_naissance_lieu: String(
            G.naissance_lieu || i.proprietaire_naissance_lieu || "",
          ),
          proprietaire_domicile: String(G.domicile || p.domicile || ""),
          proprietaire_profession: String(
            G.profession || i.proprietaire_profession || "",
          ),
          proprietaire_cni_numero: String(
            G.cni_numero || i.proprietaire_cni_numero || "",
          ),
          proprietaire_cni_date: String(
            G.cni_date || i.proprietaire_cni_date || "",
          ),
          proprietaire_cni_lieu: String(
            G.cni_lieu || i.proprietaire_cni_lieu || "",
          ),
          proprietaire_telephone: String(
            G.telephone || i.proprietaire_telephone || "",
          ),
          cedant_nom: String($.nom || p.cedant_nom || ""),
          cedant_prenom: String($.prenom || p.cedant_prenom || ""),
          cedant_cni_numero: String($.cni_numero || p.cedant_cni_numero || ""),
          cedant_telephone: String($.telephone || p.cedant_telephone || ""),
          cedant_domicile: String($.domicile || p.cedant_domicile || ""),
          temoins: Ns,
          chef_village: String(
            Ne.chef_village || c.chef_village || i.chef_village || "",
          ),
          lieu_signature: String(
            Ne.lieu_signature || c.lieu_signature || i.village || "",
          ),
          registre_volume: String(ae.volume || p.registre_volume || ""),
          registre_page: ae.page ?? p.registre_page,
          registre_ligne: ae.ligne ?? p.registre_ligne,
          control_number: p.control_number || "",
          verification_url: P,
          qrDataUrl: T,
          hash_sha256: p.hash_sha256 || "",
          validation_agent_nom: String(
            ye.agent_nom || p.validation_agent_nom || "",
          ),
          validation_chef_nom: String(
            ye.chef_nom || p.validation_chef_nom || "",
          ),
          logoUrl: c.logo_url || "",
          village_logo_url: c.village_logo_url || "",
          chef_nom: String(
            ye.chef_nom || c.chef_village || i.chef_village || "",
          ),
          attestation_type: Se,
          statut: p.statut,
          lot_statut: i.statut,
          date_cession: we.date_cession
            ? String(we.date_cession)
            : se === "cession"
              ? String(i.date_cession || "")
              : "",
          prix_cession:
            typeof we.prix_cession == "number"
              ? we.prix_cession
              : se === "cession"
                ? i.prix_cession
                : void 0,
        }),
        K)
      ) {
        const { error: je } = await I(() =>
          Ce(z, {
            lotId: i.id,
            action: "IMPRESSION",
            details: { type: "attestation_moderne", reference: p.reference },
          }),
        );
        je && W("Impression effectuée, mais journalisation impossible.");
      }
    },
    bs = async (i) => {
      const c = await Me(i.village || ue);
      if (!K) {
        W("Hors ligne : l'annexe technique nécessite les données complètes.");
        return;
      }
      const { data: h, error: b } = await Nr(i.id, {
        includeArchived: !1,
        select: "*, foncier_attestation_temoins(*)",
      });
      if (b) {
        W("Impossible de charger l'attestation.");
        return;
      }
      if (!h) {
        $e("Aucune attestation trouvée. Générez-la d'abord.");
        return;
      }
      const p = h,
        y = Pr(p.qr_payload),
        m = Kt({
          reference: p.reference,
          control_number: p.control_number || "",
          hash_sha256: p.hash_sha256 || "",
          baseUrl: String(y?.verification_url || ""),
        }),
        P = await Lr(m),
        T = y?.parcelle || {},
        E = T.limites || {},
        D = T.coordonnees_gps || null,
        Y = Array.isArray(T.gps_points) ? T.gps_points : null,
        Q = Array.isArray(y?.temoins) ? y?.temoins : null,
        M = (p.foncier_attestation_temoins || []).map((B) => ({
          nom: B.nom,
          prenom: B.prenom,
          profession: B.profession || "",
          telephone: B.telephone || "",
          cni: B.cni || "",
        })),
        G =
          Q && Q.length
            ? Q.map((B) => ({
                nom: String(B.nom || ""),
                prenom: String(B.prenom || ""),
                profession: String(B.profession || ""),
                telephone: String(B.telephone || ""),
                cni: String(B.cni || ""),
              }))
            : M;
      Ws({
        reference: p.reference,
        numero_enregistrement: p.numero_enregistrement || p.reference,
        date_etablissement: Le(p.date_etablissement || Ze()),
        original: !0,
        region: c.region || i.region || "REGION",
        departement: c.departement || i.departement || "DEPARTEMENT",
        commune: c.commune || i.commune || "COMMUNE",
        village: c.village || i.village || "VILLAGE",
        quartier: i.quartier,
        lotissement: i.nom_lotissement,
        numero_lot: i.numero_lot,
        superficie_m2: i.superficie || 0,
        limites: {
          nord: String(E.nord || p.limites_nord || ""),
          sud: String(E.sud || p.limites_sud || ""),
          est: String(E.est || p.limites_est || ""),
          ouest: String(E.ouest || p.limites_ouest || ""),
        },
        coordonnees_gps:
          D && D.lat != null && D.lng != null
            ? {
                lat: Number(D.lat),
                lng: Number(D.lng),
                precision: D.precision ?? void 0,
              }
            : void 0,
        gps_points: Y || p.gps_points || void 0,
        mode_acquisition: String(p.mode_acquisition || ""),
        historique_possession: String(p.historique_possession || ""),
        proprietaire_nom: i.proprietaire_nom || "",
        proprietaire_prenom: i.proprietaire_prenom || "",
        proprietaire_naissance_date: i.proprietaire_naissance_date || "",
        proprietaire_naissance_lieu: i.proprietaire_naissance_lieu || "",
        proprietaire_domicile: String(p.domicile || ""),
        proprietaire_profession: i.proprietaire_profession || "",
        proprietaire_cni_numero: i.proprietaire_cni_numero || "",
        proprietaire_cni_date: i.proprietaire_cni_date || "",
        proprietaire_cni_lieu: i.proprietaire_cni_lieu || "",
        proprietaire_telephone: i.proprietaire_telephone || "",
        temoins: G,
        chef_village: c.chef_village || i.chef_village || "",
        lieu_signature: c.lieu_signature || i.village || "",
        registre_volume: String(p.registre_volume || ""),
        registre_page: p.registre_page,
        registre_ligne: p.registre_ligne,
        control_number: p.control_number || "",
        verification_url: m,
        qrDataUrl: P,
        hash_sha256: p.hash_sha256 || "",
        validation_agent_nom: String(p.validation_agent_nom || ""),
        validation_chef_nom: String(p.validation_chef_nom || ""),
        logoUrl: c.logo_url || "",
        village_logo_url: c.village_logo_url || "",
        chef_nom: c.chef_village || i.chef_village || "",
        attestation_type: p.type || "",
        statut: p.statut,
        date_cession: i.date_cession || "",
        prix_cession: i.prix_cession,
      });
    },
    Sr = Math.max(1, Math.ceil(fn / Pt)),
    zr = Math.max(1, Math.ceil(Ka / xr)),
    ys = (0, _.useMemo)(() => g.reference || mt(), [g.reference]),
    js = (i) => {
      const c = i.trim();
      return !c || /^\d{4}-\d{2}-\d{2}$/.test(c) ? !0 : Ks(c);
    },
    kr = (i, c) => {
      i.trim() &&
        (js(i) ||
          ce(
            `Date invalide pour ${c}. Format attendu JJ / MM / AAAA ou AAAA-MM-JJ.`,
          ));
    },
    S =
      "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400",
    ge = "disabled:opacity-50 disabled:cursor-not-allowed";
  return (0, n.jsxs)("div", {
    className: "space-y-4",
    children: [
      (0, n.jsxs)("div", {
        className:
          "flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between",
        children: [
          (0, n.jsxs)("div", {
            className:
              "flex flex-col sm:flex-row sm:flex-wrap gap-2 flex-1 w-full",
            children: [
              (0, n.jsxs)("div", {
                className: "relative w-full sm:w-auto sm:min-w-[240px]",
                children: [
                  (0, n.jsx)(Es, {
                    size: 16,
                    className:
                      "absolute left-3 top-1/2 -translate-y-1/2 text-gray-400",
                  }),
                  (0, n.jsx)("input", {
                    ref: bn,
                    type: "text",
                    placeholder: "Réf, lot, propriétaire...",
                    value: o,
                    onChange: (i) => u(i.target.value),
                    className:
                      "pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 w-full sm:w-64",
                  }),
                ],
              }),
              (0, n.jsxs)("select", {
                value: d,
                onChange: (i) => v(i.target.value),
                className:
                  "px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none bg-white w-full sm:w-auto",
                children: [
                  (0, n.jsx)("option", { value: "", children: "Tous statuts" }),
                  Object.entries(Or).map(([i, c]) =>
                    (0, n.jsx)("option", { value: i, children: c.label }, i),
                  ),
                ],
              }),
              (0, n.jsxs)("select", {
                value: x,
                onChange: (i) => A(i.target.value),
                className:
                  "px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none bg-white w-full sm:w-auto",
                children: [
                  (0, n.jsx)("option", {
                    value: "",
                    children: "Tous villages",
                  }),
                  Ue.map((i) =>
                    (0, n.jsx)("option", { value: i, children: i }, i),
                  ),
                ],
              }),
              !fe &&
                K &&
                (0, n.jsxs)("span", {
                  className: "text-xs text-orange-600 flex items-center gap-1",
                  children: [
                    (0, n.jsx)(An, { size: 12, className: "animate-spin" }),
                    " Chargement...",
                  ],
                }),
              (0, n.jsxs)("label", {
                className:
                  "inline-flex items-center gap-2 px-2 text-xs text-gray-600",
                children: [
                  (0, n.jsx)("input", {
                    type: "checkbox",
                    checked: Ve,
                    onChange: (i) => Qa(i.target.checked),
                  }),
                  "Afficher archivés",
                ],
              }),
            ],
          }),
          (0, n.jsxs)("div", {
            className: "flex gap-2",
            children: [
              (0, n.jsxs)("div", {
                className: `flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium ${K ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`,
                children: [
                  K
                    ? (0, n.jsx)(Ps, { size: 14 })
                    : (0, n.jsx)(Zs, { size: 14 }),
                  K ? "En ligne" : "Hors ligne",
                ],
              }),
              (0, n.jsxs)("button", {
                onClick: () => {
                  jn();
                },
                disabled: !K || Zt || br === 0,
                title: K
                  ? br === 0
                    ? "Aucune synchronisation en attente"
                    : void 0
                  : "Hors ligne",
                className: `flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors ${ge}`,
                children: [
                  (0, n.jsx)(An, {
                    size: 16,
                    className: Zt ? "animate-spin" : "",
                  }),
                  Zt ? "Sync..." : `Sync (${br})`,
                ],
              }),
              Xe &&
                Xe.total > 0 &&
                (0, n.jsxs)("div", {
                  className:
                    "flex items-center gap-2 px-3 py-2.5 rounded-xl bg-blue-50 text-blue-700 text-xs font-medium",
                  children: [
                    (0, n.jsxs)("div", {
                      className: "flex items-center gap-1",
                      children: [
                        (0, n.jsx)("div", {
                          className:
                            "w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin",
                        }),
                        (0, n.jsxs)("span", {
                          children: ["Sync: ", Xe.current, "/", Xe.total],
                        }),
                      ],
                    }),
                    (0, n.jsx)("div", {
                      className:
                        "flex-1 w-24 h-2 bg-blue-200 rounded-full overflow-hidden",
                      children: (0, n.jsx)("div", {
                        className:
                          "h-full bg-blue-600 transition-all duration-300",
                        style: { width: `${(Xe.current / Xe.total) * 100}%` },
                      }),
                    }),
                  ],
                }),
              (0, n.jsxs)("button", {
                onClick: es,
                disabled: !L,
                title: L ? void 0 : "Accès réservé",
                className: `flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors ${ge}`,
                children: [(0, n.jsx)(zn, { size: 16 }), " Audit"],
              }),
              (0, n.jsxs)("button", {
                onClick: ls,
                disabled: !L,
                title: L ? void 0 : "Accès réservé",
                className: `flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors ${ge}`,
                children: [(0, n.jsx)(ks, { size: 16 }), " Config Village"],
              }),
              (0, n.jsxs)("button", {
                onClick: wn,
                disabled: !L,
                title: L ? void 0 : "Accès réservé",
                className: `flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium hover:opacity-90 transition-opacity ${ge}`,
                style: {
                  backgroundColor: e.primary_color,
                  color: "var(--color-on-primary)",
                },
                children: [(0, n.jsx)(Ts, { size: 16 }), " Nouveau Lot"],
              }),
            ],
          }),
        ],
      }),
      Xr &&
        (0, n.jsx)("div", {
          role: "alert",
          className:
            "p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700",
          children: Xr,
        }),
      xn &&
        (0, n.jsx)("div", {
          className:
            "p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700",
          children: xn,
        }),
      vn &&
        (0, n.jsx)("div", {
          className:
            "p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700",
          children: vn,
        }),
      or &&
        (0, n.jsx)("div", {
          className:
            "p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700",
          children: or,
        }),
      Wr &&
        (0, n.jsx)("div", {
          className:
            "p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-600",
          children: "Chargement des statistiques par village...",
        }),
      !Wr &&
        !or &&
        Object.keys(wt).length > 0 &&
        (0, n.jsx)("div", {
          className: "flex flex-wrap gap-2 text-xs text-gray-600",
          children: Object.entries(wt).map(([i, c]) =>
            (0, n.jsxs)(
              "div",
              {
                className:
                  "px-2 py-1 rounded-lg border border-gray-200 bg-white",
                children: [
                  (0, n.jsx)("span", {
                    className: "font-semibold",
                    children: i,
                  }),
                  " : ",
                  Cn(c.total),
                  " m² (",
                  c.count,
                  ")",
                ],
              },
              i,
            ),
          ),
        }),
      (0, n.jsx)("div", {
        className:
          "bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden",
        children: s
          ? (0, n.jsx)("div", {
              className: "flex items-center justify-center h-48",
              children: (0, n.jsx)("div", {
                className: "animate-spin rounded-full h-8 w-8 border-b-2",
                style: { borderColor: e.primary_color },
              }),
            })
          : r.length === 0
            ? (0, n.jsxs)("div", {
                className:
                  "flex flex-col items-center justify-center h-48 text-gray-400",
                children: [
                  (0, n.jsx)(Ar, { size: 40, className: "mb-2 opacity-30" }),
                  (0, n.jsx)("p", {
                    className: "text-sm",
                    children: "Aucun lot foncier enregistré",
                  }),
                ],
              })
            : (0, n.jsx)("div", {
                className: "overflow-x-auto",
                children: (0, n.jsxs)("table", {
                  className: "w-full egs-table",
                  children: [
                    (0, n.jsx)("thead", {
                      children: (0, n.jsxs)("tr", {
                        className: "bg-gray-50 border-b border-gray-100",
                        children: [
                          (0, n.jsx)("th", {
                            className:
                              "text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase",
                            children: "Référence",
                          }),
                          (0, n.jsx)("th", {
                            className:
                              "text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase",
                            children: "Lot · Îlot",
                          }),
                          (0, n.jsx)("th", {
                            className:
                              "text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell",
                            children: "Lotissement",
                          }),
                          (0, n.jsx)("th", {
                            className:
                              "text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell",
                            children: "Propriétaire",
                          }),
                          (0, n.jsx)("th", {
                            className:
                              "text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell",
                            children: "Superficie",
                          }),
                          (0, n.jsx)("th", {
                            className:
                              "text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden xl:table-cell",
                            children: "Prix/m²",
                          }),
                          (0, n.jsx)("th", {
                            className:
                              "text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase",
                            children: "Statut",
                          }),
                          (0, n.jsx)("th", { className: "px-4 py-3" }),
                        ],
                      }),
                    }),
                    (0, n.jsx)("tbody", {
                      className: "divide-y divide-gray-50",
                      children: r.map((i) => {
                        const c = !!i.deleted_at,
                          h = c
                            ? { label: "Archivé", color: "gray" }
                            : Or[i.statut] || {
                                label: i.statut || "Inconnu",
                                color: "gray",
                              },
                          b =
                            i.superficie && i.prix_cession
                              ? `${Cn(i.prix_cession / i.superficie)} FCFA`
                              : "—";
                        return (0, n.jsxs)(
                          "tr",
                          {
                            className: `transition-colors ${c ? "bg-gray-50/50" : "hover:bg-gray-50"}`,
                            children: [
                              (0, n.jsx)("td", {
                                className: "px-4 py-3",
                                children: (0, n.jsxs)("div", {
                                  className: "flex items-center gap-1.5",
                                  children: [
                                    (0, n.jsx)(kn, {
                                      size: 14,
                                      className: "text-gray-400 flex-shrink-0",
                                    }),
                                    (0, n.jsx)("span", {
                                      className: "table-key",
                                      children: i.reference,
                                    }),
                                  ],
                                }),
                              }),
                              (0, n.jsxs)("td", {
                                className: "px-4 py-3",
                                children: [
                                  (0, n.jsxs)("div", {
                                    className:
                                      "text-sm font-medium text-gray-800",
                                    children: ["Lot ", i.numero_lot],
                                  }),
                                  (0, n.jsxs)("div", {
                                    className: "text-xs text-gray-400",
                                    children: ["Îlot ", i.numero_ilot],
                                  }),
                                ],
                              }),
                              (0, n.jsxs)("td", {
                                className: "px-4 py-3 hidden md:table-cell",
                                children: [
                                  (0, n.jsx)("div", {
                                    className: "text-sm text-gray-700",
                                    children: i.nom_lotissement,
                                  }),
                                  (0, n.jsx)("div", {
                                    className: "text-xs text-gray-400",
                                    children: i.village,
                                  }),
                                ],
                              }),
                              (0, n.jsx)("td", {
                                className: "px-4 py-3 hidden sm:table-cell",
                                children: (0, n.jsxs)("span", {
                                  className: "text-sm text-gray-700",
                                  children: [
                                    i.proprietaire_prenom,
                                    " ",
                                    i.proprietaire_nom,
                                  ],
                                }),
                              }),
                              (0, n.jsx)("td", {
                                className:
                                  "px-4 py-3 text-sm text-gray-600 hidden lg:table-cell",
                                children: i.superficie
                                  ? `${i.superficie} m²`
                                  : "—",
                              }),
                              (0, n.jsx)("td", {
                                className:
                                  "px-4 py-3 text-sm text-gray-600 hidden xl:table-cell",
                                children: b,
                              }),
                              (0, n.jsx)("td", {
                                className: "px-4 py-3",
                                children: (0, n.jsx)(Zr, {
                                  label: h.label,
                                  color: h.color,
                                }),
                              }),
                              (0, n.jsx)("td", {
                                className: "px-4 py-3",
                                children: (0, n.jsxs)("div", {
                                  className:
                                    "flex items-center gap-1 justify-end",
                                  children: [
                                    (0, n.jsx)("button", {
                                      onClick: () => wr(i),
                                      disabled: !L || c,
                                      title: L
                                        ? c
                                          ? "Lot archivé"
                                          : "Attestation Coutumière"
                                        : "Accès réservé",
                                      "aria-label": L
                                        ? c
                                          ? "Lot archivé"
                                          : "Attestation coutumière"
                                        : "Accès réservé",
                                      className: `p-1.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors ${ge}`,
                                      children: (0, n.jsx)(aa, { size: 15 }),
                                    }),
                                    (0, n.jsx)("button", {
                                      onClick: () => ts(i.id),
                                      disabled: !L || c,
                                      title: L
                                        ? c
                                          ? "Lot archivé"
                                          : "Validation Chef"
                                        : "Accès réservé",
                                      "aria-label": L
                                        ? c
                                          ? "Lot archivé"
                                          : "Validation Chef"
                                        : "Accès réservé",
                                      className: `p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors ${ge}`,
                                      children: (0, n.jsx)(Ht, { size: 15 }),
                                    }),
                                    (0, n.jsx)("button", {
                                      onClick: () => xs(i),
                                      title: "Imprimer attestation officielle",
                                      "aria-label":
                                        "Imprimer attestation officielle",
                                      className:
                                        "p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors",
                                      children: (0, n.jsx)(As, { size: 15 }),
                                    }),
                                    (0, n.jsx)("button", {
                                      onClick: () => bs(i),
                                      title:
                                        "Imprimer annexe technique (GPS, limites, témoins)",
                                      "aria-label": "Imprimer annexe technique",
                                      className:
                                        "p-1.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors",
                                      children: (0, n.jsx)(Cs, { size: 15 }),
                                    }),
                                    (0, n.jsx)("button", {
                                      onClick: () => ns(i),
                                      disabled: !L || c,
                                      title: L
                                        ? c
                                          ? "Lot archivé"
                                          : "Historique attestations"
                                        : "Accès réservé",
                                      "aria-label": L
                                        ? c
                                          ? "Lot archivé"
                                          : "Historique attestations"
                                        : "Accès réservé",
                                      className: `p-1.5 rounded-lg text-gray-400 hover:text-slate-600 hover:bg-slate-50 transition-colors ${ge}`,
                                      children: (0, n.jsx)(zn, { size: 15 }),
                                    }),
                                    (0, n.jsx)("button", {
                                      onClick: () => os(i),
                                      disabled: !L || c,
                                      title: L
                                        ? c
                                          ? "Lot archivé"
                                          : "Modifier"
                                        : "Accès réservé",
                                      "aria-label": L
                                        ? c
                                          ? "Lot archivé"
                                          : "Modifier"
                                        : "Accès réservé",
                                      className: `p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors ${ge}`,
                                      children: (0, n.jsx)(Os, { size: 15 }),
                                    }),
                                    c
                                      ? (0, n.jsx)("button", {
                                          onClick: () => _s(i),
                                          disabled: !L,
                                          title: L
                                            ? "Restaurer"
                                            : "Accès réservé",
                                          "aria-label": L
                                            ? "Restaurer"
                                            : "Accès réservé",
                                          className: `p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors ${ge}`,
                                          children: (0, n.jsx)(Ss, {
                                            size: 15,
                                          }),
                                        })
                                      : (0, n.jsx)("button", {
                                          onClick: () => hs(i),
                                          disabled: !L,
                                          title: L
                                            ? "Archiver"
                                            : "Accès réservé",
                                          "aria-label": L
                                            ? "Archiver"
                                            : "Accès réservé",
                                          className: `p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors ${ge}`,
                                          children: (0, n.jsx)(Is, {
                                            size: 15,
                                          }),
                                        }),
                                  ],
                                }),
                              }),
                            ],
                          },
                          i.id,
                        );
                      }),
                    }),
                  ],
                }),
              }),
      }),
      !s &&
        r.length > 0 &&
        (0, n.jsxs)("div", {
          className:
            "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-gray-500",
          children: [
            (0, n.jsxs)("div", {
              children: [
                "Total: ",
                (0, n.jsx)("span", {
                  className: "font-medium text-gray-700",
                  children: fn,
                }),
                " lots",
              ],
            }),
            (0, n.jsxs)("div", {
              className: "flex items-center gap-2",
              children: [
                (0, n.jsx)("button", {
                  onClick: () => It((i) => Math.max(1, i - 1)),
                  disabled: Qe <= 1,
                  className: `px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors ${ge}`,
                  children: "Précédent",
                }),
                (0, n.jsxs)("span", {
                  className: "text-gray-600",
                  children: ["Page ", Qe, " / ", Sr],
                }),
                (0, n.jsx)("button", {
                  onClick: () => It((i) => Math.min(Sr, i + 1)),
                  disabled: Qe >= Sr,
                  className: `px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors ${ge}`,
                  children: "Suivant",
                }),
              ],
            }),
          ],
        }),
      (0, n.jsx)(rt, {
        isOpen: N,
        onClose: () => j(!1),
        title: re ? "Modifier le Lot Foncier" : "Nouveau Lot Foncier",
        size: "lg",
        children: (0, n.jsxs)("div", {
          className: "space-y-4",
          children: [
            Yr &&
              (0, n.jsx)("div", {
                role: "alert",
                className:
                  "p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700",
                children: Yr,
              }),
            (0, n.jsx)("div", {
              className: "flex gap-1 bg-gray-100 p-1 rounded-xl",
              children: [
                { id: "info", label: "Lot & Localisation" },
                { id: "proprietaire", label: "Propriétaire" },
                { id: "admin", label: "Administratif" },
              ].map((i) =>
                (0, n.jsx)(
                  "button",
                  {
                    onClick: () => dr(i.id),
                    className: `flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${St === i.id ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`,
                    children: i.label,
                  },
                  i.id,
                ),
              ),
            }),
            St === "info" &&
              (0, n.jsxs)("div", {
                className: "space-y-3",
                children: [
                  (0, n.jsxs)("div", {
                    className: "grid grid-cols-3 gap-3",
                    children: [
                      (0, n.jsxs)("div", {
                        children: [
                          (0, n.jsx)("label", {
                            className:
                              "block text-xs font-medium text-gray-600 mb-1",
                            children: "N° de Lot *",
                          }),
                          (0, n.jsx)("input", {
                            type: "text",
                            maxLength: 10,
                            value: g.numero_lot,
                            onChange: (i) =>
                              C({ ...g, numero_lot: i.target.value }),
                            className: S,
                            placeholder: "ex: 662A",
                          }),
                        ],
                      }),
                      (0, n.jsxs)("div", {
                        children: [
                          (0, n.jsx)("label", {
                            className:
                              "block text-xs font-medium text-gray-600 mb-1",
                            children: "N° d'Îlot *",
                          }),
                          (0, n.jsx)("input", {
                            type: "text",
                            maxLength: 10,
                            value: g.numero_ilot,
                            onChange: (i) =>
                              C({ ...g, numero_ilot: i.target.value }),
                            className: S,
                            placeholder: "ex: 62",
                          }),
                        ],
                      }),
                      (0, n.jsxs)("div", {
                        children: [
                          (0, n.jsx)("label", {
                            className:
                              "block text-xs font-medium text-gray-600 mb-1",
                            children: "Superficie (m²) *",
                          }),
                          (0, n.jsx)("input", {
                            type: "number",
                            value: g.superficie,
                            onChange: (i) =>
                              C({ ...g, superficie: i.target.value }),
                            className: S,
                            placeholder: "ex: 1229",
                            step: "0.01",
                            min: "0.01",
                          }),
                        ],
                      }),
                    ],
                  }),
                  (0, n.jsxs)("div", {
                    className:
                      "p-3 bg-blue-50 border border-blue-200 rounded-xl",
                    children: [
                      (0, n.jsxs)("div", {
                        className: "flex items-center gap-2 mb-1",
                        children: [
                          (0, n.jsx)(kn, {
                            size: 16,
                            className: "text-blue-600",
                          }),
                          (0, n.jsx)("label", {
                            className:
                              "block text-xs font-semibold text-blue-800",
                            children:
                              "Référence du Lot (générée automatiquement)",
                          }),
                        ],
                      }),
                      (0, n.jsx)("div", {
                        className: "text-lg font-mono font-bold text-blue-900",
                        children: ys,
                      }),
                      (0, n.jsx)("div", {
                        className: "text-[11px] text-blue-600 mt-1",
                        children: "Format: FONC-YYYY-MM-DD-XXXXX",
                      }),
                    ],
                  }),
                  (0, n.jsxs)("div", {
                    children: [
                      (0, n.jsx)("label", {
                        className:
                          "block text-xs font-medium text-gray-600 mb-1",
                        children: "Nom du Lotissement *",
                      }),
                      (0, n.jsx)("input", {
                        type: "text",
                        maxLength: 100,
                        value: g.nom_lotissement,
                        onChange: (i) =>
                          C({ ...g, nom_lotissement: i.target.value }),
                        className: S,
                        placeholder: "ex: TAABO-EXTENSION",
                      }),
                    ],
                  }),
                  (0, n.jsxs)("div", {
                    className: "grid grid-cols-2 gap-3",
                    children: [
                      (0, n.jsxs)("div", {
                        children: [
                          (0, n.jsx)("label", {
                            className:
                              "block text-xs font-medium text-gray-600 mb-1",
                            children: "Quartier",
                          }),
                          (0, n.jsx)("input", {
                            type: "text",
                            maxLength: 100,
                            value: g.quartier,
                            onChange: (i) =>
                              C({ ...g, quartier: i.target.value }),
                            className: S,
                          }),
                        ],
                      }),
                      (0, n.jsxs)("div", {
                        children: [
                          (0, n.jsx)("label", {
                            className:
                              "block text-xs font-medium text-gray-600 mb-1",
                            children: "Village *",
                          }),
                          (0, n.jsxs)("select", {
                            value: g.village,
                            onChange: (i) =>
                              C({ ...g, village: i.target.value }),
                            className: S,
                            children: [
                              (0, n.jsx)("option", {
                                value: "",
                                children: "Sélectionner un village",
                              }),
                              g.village &&
                                !Ue.includes(g.village) &&
                                (0, n.jsx)("option", {
                                  value: g.village,
                                  children: g.village,
                                }),
                              Ue.map((i) =>
                                (0, n.jsx)(
                                  "option",
                                  { value: i, children: i },
                                  i,
                                ),
                              ),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                  (0, n.jsxs)("div", {
                    className: "grid grid-cols-3 gap-3",
                    children: [
                      (0, n.jsxs)("div", {
                        children: [
                          (0, n.jsx)("label", {
                            className:
                              "block text-xs font-medium text-gray-600 mb-1",
                            children: "Commune",
                          }),
                          (0, n.jsx)("input", {
                            type: "text",
                            maxLength: 100,
                            value: g.commune,
                            onChange: (i) =>
                              C({ ...g, commune: i.target.value }),
                            className: S,
                          }),
                        ],
                      }),
                      (0, n.jsxs)("div", {
                        children: [
                          (0, n.jsx)("label", {
                            className:
                              "block text-xs font-medium text-gray-600 mb-1",
                            children: "Département",
                          }),
                          (0, n.jsx)("input", {
                            type: "text",
                            maxLength: 100,
                            value: g.departement,
                            onChange: (i) =>
                              C({ ...g, departement: i.target.value }),
                            className: S,
                          }),
                        ],
                      }),
                      (0, n.jsxs)("div", {
                        children: [
                          (0, n.jsx)("label", {
                            className:
                              "block text-xs font-medium text-gray-600 mb-1",
                            children: "Région",
                          }),
                          (0, n.jsx)("input", {
                            type: "text",
                            maxLength: 100,
                            value: g.region,
                            onChange: (i) =>
                              C({ ...g, region: i.target.value }),
                            className: S,
                          }),
                        ],
                      }),
                    ],
                  }),
                  (0, n.jsxs)("div", {
                    className: "grid grid-cols-2 gap-3",
                    children: [
                      (0, n.jsxs)("div", {
                        children: [
                          (0, n.jsx)("label", {
                            className:
                              "block text-xs font-medium text-gray-600 mb-1",
                            children: "Statut",
                          }),
                          (0, n.jsx)("select", {
                            value: g.statut,
                            onChange: (i) =>
                              C({ ...g, statut: i.target.value }),
                            className: S,
                            children: Object.entries(Or).map(([i, c]) =>
                              (0, n.jsx)(
                                "option",
                                { value: i, children: c.label },
                                i,
                              ),
                            ),
                          }),
                        ],
                      }),
                      (0, n.jsxs)("div", {
                        children: [
                          (0, n.jsx)("label", {
                            className:
                              "block text-xs font-medium text-gray-600 mb-1",
                            children: "Date de Cession",
                          }),
                          (0, n.jsx)("input", {
                            type: "date",
                            value: g.date_cession,
                            onChange: (i) =>
                              C({ ...g, date_cession: i.target.value }),
                            className: S,
                          }),
                        ],
                      }),
                    ],
                  }),
                  (0, n.jsxs)("div", {
                    className: "grid grid-cols-2 gap-3",
                    children: [
                      (0, n.jsxs)("div", {
                        children: [
                          (0, n.jsx)("label", {
                            className:
                              "block text-xs font-medium text-gray-600 mb-1",
                            children: "Prix de Cession (FCFA) *",
                          }),
                          (0, n.jsx)("input", {
                            type: "number",
                            min: "1",
                            value: g.prix_cession,
                            onChange: (i) =>
                              C({ ...g, prix_cession: i.target.value }),
                            className: S,
                          }),
                        ],
                      }),
                      (0, n.jsxs)("div", {
                        children: [
                          (0, n.jsx)("label", {
                            className:
                              "block text-xs font-medium text-gray-600 mb-1",
                            children: "Sécurité d’attestation",
                          }),
                          (0, n.jsx)("div", {
                            className:
                              "h-10 px-3 rounded-lg border border-blue-200 bg-blue-50 text-xs text-blue-800 flex items-center",
                            children:
                              "QR code de vérification généré automatiquement à l’émission de l’attestation",
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            St === "proprietaire" &&
              (0, n.jsxs)("div", {
                className: "space-y-3",
                children: [
                  (0, n.jsxs)("div", {
                    className: "grid grid-cols-2 gap-3",
                    children: [
                      (0, n.jsxs)("div", {
                        children: [
                          (0, n.jsx)("label", {
                            className:
                              "block text-xs font-medium text-gray-600 mb-1",
                            children: "Prénom",
                          }),
                          (0, n.jsx)("input", {
                            type: "text",
                            maxLength: 100,
                            value: g.proprietaire_prenom,
                            onChange: (i) =>
                              C({ ...g, proprietaire_prenom: i.target.value }),
                            className: S,
                          }),
                        ],
                      }),
                      (0, n.jsxs)("div", {
                        children: [
                          (0, n.jsx)("label", {
                            className:
                              "block text-xs font-medium text-gray-600 mb-1",
                            children: "Nom *",
                          }),
                          (0, n.jsx)("input", {
                            type: "text",
                            maxLength: 100,
                            value: g.proprietaire_nom,
                            onChange: (i) =>
                              C({ ...g, proprietaire_nom: i.target.value }),
                            className: S,
                          }),
                        ],
                      }),
                    ],
                  }),
                  (0, n.jsxs)("div", {
                    className: "grid grid-cols-2 gap-3",
                    children: [
                      (0, n.jsxs)("div", {
                        children: [
                          (0, n.jsx)("label", {
                            className:
                              "block text-xs font-medium text-gray-600 mb-1",
                            children: "Date de Naissance",
                          }),
                          (0, n.jsx)("input", {
                            type: "text",
                            value: g.proprietaire_naissance_date,
                            onChange: (i) =>
                              C({
                                ...g,
                                proprietaire_naissance_date: i.target.value,
                              }),
                            onBlur: (i) =>
                              kr(i.target.value, "la date de naissance"),
                            className: S,
                            placeholder: "ex: 29 / 12 / 1967",
                          }),
                        ],
                      }),
                      (0, n.jsxs)("div", {
                        children: [
                          (0, n.jsx)("label", {
                            className:
                              "block text-xs font-medium text-gray-600 mb-1",
                            children: "Lieu de Naissance",
                          }),
                          (0, n.jsx)("input", {
                            type: "text",
                            maxLength: 100,
                            value: g.proprietaire_naissance_lieu,
                            onChange: (i) =>
                              C({
                                ...g,
                                proprietaire_naissance_lieu: i.target.value,
                              }),
                            className: S,
                            placeholder: "ex: ANYAMA",
                          }),
                        ],
                      }),
                    ],
                  }),
                  (0, n.jsxs)("div", {
                    children: [
                      (0, n.jsx)("label", {
                        className:
                          "block text-xs font-medium text-gray-600 mb-1",
                        children: "N° CNI / Passeport / AI / CR / CC",
                      }),
                      (0, n.jsx)("input", {
                        type: "text",
                        maxLength: 20,
                        value: g.proprietaire_cni_numero,
                        onChange: (i) =>
                          C({ ...g, proprietaire_cni_numero: i.target.value }),
                        className: S,
                        placeholder: "ex: CI 005274109",
                      }),
                    ],
                  }),
                  (0, n.jsxs)("div", {
                    className: "grid grid-cols-2 gap-3",
                    children: [
                      (0, n.jsxs)("div", {
                        children: [
                          (0, n.jsx)("label", {
                            className:
                              "block text-xs font-medium text-gray-600 mb-1",
                            children: "Date Émission CNI",
                          }),
                          (0, n.jsx)("input", {
                            type: "text",
                            value: g.proprietaire_cni_date,
                            onChange: (i) =>
                              C({
                                ...g,
                                proprietaire_cni_date: i.target.value,
                              }),
                            onBlur: (i) =>
                              kr(i.target.value, "la date d'émission CNI"),
                            className: S,
                            placeholder: "ex: 20 / 12 / 2022",
                          }),
                        ],
                      }),
                      (0, n.jsxs)("div", {
                        children: [
                          (0, n.jsx)("label", {
                            className:
                              "block text-xs font-medium text-gray-600 mb-1",
                            children: "Lieu Émission CNI",
                          }),
                          (0, n.jsx)("input", {
                            type: "text",
                            maxLength: 100,
                            value: g.proprietaire_cni_lieu,
                            onChange: (i) =>
                              C({
                                ...g,
                                proprietaire_cni_lieu: i.target.value,
                              }),
                            className: S,
                            placeholder: "ex: Abidjan",
                          }),
                        ],
                      }),
                    ],
                  }),
                  (0, n.jsxs)("div", {
                    className: "grid grid-cols-2 gap-3",
                    children: [
                      (0, n.jsxs)("div", {
                        children: [
                          (0, n.jsx)("label", {
                            className:
                              "block text-xs font-medium text-gray-600 mb-1",
                            children: "Profession",
                          }),
                          (0, n.jsx)("input", {
                            type: "text",
                            maxLength: 100,
                            value: g.proprietaire_profession,
                            onChange: (i) =>
                              C({
                                ...g,
                                proprietaire_profession: i.target.value,
                              }),
                            className: S,
                            placeholder: "ex: CHEF D'ENTREPRISE",
                          }),
                        ],
                      }),
                      (0, n.jsxs)("div", {
                        children: [
                          (0, n.jsx)("label", {
                            className:
                              "block text-xs font-medium text-gray-600 mb-1",
                            children: "Téléphone",
                          }),
                          (0, n.jsx)("input", {
                            type: "tel",
                            maxLength: 20,
                            value: g.proprietaire_telephone,
                            onChange: (i) =>
                              C({
                                ...g,
                                proprietaire_telephone: i.target.value,
                              }),
                            className: S,
                            placeholder: "ex: 0707084041",
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            St === "admin" &&
              (0, n.jsxs)("div", {
                className: "space-y-3",
                children: [
                  (0, n.jsx)("div", {
                    className:
                      "p-3 bg-blue-50 rounded-xl text-xs text-blue-700",
                    children:
                      "Ces informations sont pré-remplies depuis la configuration du village. Modifiez si nécessaire.",
                  }),
                  (0, n.jsxs)("div", {
                    children: [
                      (0, n.jsx)("label", {
                        className:
                          "block text-xs font-medium text-gray-600 mb-1",
                        children: "Chef du Village",
                      }),
                      (0, n.jsx)("input", {
                        type: "text",
                        maxLength: 120,
                        value: g.chef_village,
                        onChange: (i) =>
                          C({ ...g, chef_village: i.target.value }),
                        className: S,
                      }),
                    ],
                  }),
                  (0, n.jsxs)("div", {
                    children: [
                      (0, n.jsx)("label", {
                        className:
                          "block text-xs font-medium text-gray-600 mb-1",
                        children: "N° Arrêté Préfectoral",
                      }),
                      (0, n.jsx)("input", {
                        type: "text",
                        maxLength: 150,
                        value: g.arrete_prefectoral,
                        onChange: (i) =>
                          C({ ...g, arrete_prefectoral: i.target.value }),
                        className: S,
                      }),
                    ],
                  }),
                  (0, n.jsxs)("div", {
                    children: [
                      (0, n.jsx)("label", {
                        className:
                          "block text-xs font-medium text-gray-600 mb-1",
                        children: "Date Arrêté",
                      }),
                      (0, n.jsx)("input", {
                        type: "text",
                        value: g.arrete_date,
                        onChange: (i) =>
                          C({ ...g, arrete_date: i.target.value }),
                        onBlur: (i) =>
                          kr(i.target.value, "la date de l’arrêté"),
                        className: S,
                        placeholder: "ex: 05 / 08 / 2024",
                      }),
                    ],
                  }),
                  (0, n.jsxs)("div", {
                    children: [
                      (0, n.jsx)("label", {
                        className:
                          "block text-xs font-medium text-gray-600 mb-1",
                        children: "Notes",
                      }),
                      (0, n.jsx)("textarea", {
                        maxLength: 1e3,
                        value: g.notes,
                        onChange: (i) => C({ ...g, notes: i.target.value }),
                        rows: 3,
                        className: `${S} resize-none`,
                      }),
                    ],
                  }),
                ],
              }),
            (0, n.jsxs)("div", {
              className: "flex gap-3 pt-2",
              children: [
                (0, n.jsx)("button", {
                  onClick: () => j(!1),
                  className:
                    "flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors",
                  children: "Annuler",
                }),
                (0, n.jsx)("button", {
                  onClick: gs,
                  disabled:
                    ne ||
                    !L ||
                    !g.numero_lot.trim() ||
                    !g.proprietaire_nom.trim(),
                  className:
                    "flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity",
                  style: {
                    backgroundColor: e.primary_color,
                    color: "var(--color-on-primary)",
                  },
                  children: ne ? "Enregistrement..." : "Enregistrer",
                }),
              ],
            }),
          ],
        }),
      }),
      (0, n.jsx)(rt, {
        isOpen: F,
        onClose: () => pe(!1),
        title: "Configuration du Village / Attestation",
        children: (0, n.jsxs)("div", {
          className: "space-y-3",
          children: [
            (0, n.jsx)("div", {
              className:
                "p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700",
              children:
                "Ces valeurs sont utilisées par défaut lors de la création de lots et l'impression d'attestations.",
            }),
            (0, n.jsxs)("div", {
              children: [
                (0, n.jsx)("label", {
                  className: "block text-xs font-medium text-gray-600 mb-1",
                  children: "Village",
                }),
                (0, n.jsx)("select", {
                  value: ue,
                  onChange: (i) => {
                    cs(i.target.value);
                  },
                  className: S,
                  children: Ue.map((i) =>
                    (0, n.jsx)("option", { value: i, children: i }, i),
                  ),
                }),
              ],
            }),
            en &&
              (0, n.jsx)("div", {
                role: "alert",
                className:
                  "p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700",
                children: en,
              }),
            [
              {
                key: "region",
                label: "Région",
                placeholder: "ex: REGION DE L'AGNEBY-TIASSA",
              },
              {
                key: "departement",
                label: "Département",
                placeholder: "ex: DEPARTEMENT DE TAABO",
              },
              {
                key: "commune",
                label: "Commune",
                placeholder: "ex: COMMUNE DE TAABO",
              },
              {
                key: "village",
                label: "Village",
                placeholder: "ex: VILLAGE DE KOKOTI-KOUAMEKRO",
              },
              {
                key: "chef_village",
                label: "Nom du Chef du Village",
                placeholder: "ex: Nanan YAO Kouamé Roger",
              },
              {
                key: "arrete_prefectoral",
                label: "N° Arrêté Préfectoral",
                placeholder:
                  "ex: N°21/R.AT/D-TAA/P-TAA/SG/Div I du 05 août 2024",
              },
              {
                key: "nom_chef_signe",
                label: "Nom signataire (majuscules)",
                placeholder: "ex: NANAN YAO KOUAME ROGER",
              },
              {
                key: "lieu_signature",
                label: "Lieu de Signature",
                placeholder: "ex: Kokoti-Kouamékro",
              },
            ].map((i) =>
              (0, n.jsxs)(
                "div",
                {
                  children: [
                    (0, n.jsx)("label", {
                      className: "block text-xs font-medium text-gray-600 mb-1",
                      children: i.label,
                    }),
                    (0, n.jsx)("input", {
                      type: "text",
                      value: k[i.key] || "",
                      onChange: (c) => R({ ...k, [i.key]: c.target.value }),
                      className: S,
                      placeholder: i.placeholder,
                    }),
                  ],
                },
                i.key,
              ),
            ),
            (0, n.jsxs)("div", {
              className: "border-t border-gray-200 pt-4 mt-4",
              children: [
                (0, n.jsx)("label", {
                  className: "block text-sm font-semibold text-gray-700 mb-3",
                  children: "Logo officiel du village",
                }),
                (0, n.jsx)(ei, {
                  villageName: ue,
                  currentLogoUrl: k.logo_url || "",
                  onLogoUploaded: (i) => R({ ...k, logo_url: i }),
                  onError: (i) => Oe(i),
                  disabled: cr || !L,
                }),
                (0, n.jsxs)("div", {
                  className: "mt-4 grid grid-cols-2 gap-4",
                  children: [
                    (0, n.jsxs)("div", {
                      children: [
                        (0, n.jsx)("label", {
                          className:
                            "block text-xs font-medium text-gray-600 mb-1",
                          children: "Couleur principale",
                        }),
                        (0, n.jsxs)("div", {
                          className: "flex gap-2",
                          children: [
                            (0, n.jsx)("input", {
                              type: "color",
                              value: k.primary_color || "#1e3a5f",
                              onChange: (i) =>
                                R({ ...k, primary_color: i.target.value }),
                              className:
                                "w-10 h-10 rounded border border-gray-300 cursor-pointer",
                            }),
                            (0, n.jsx)("input", {
                              type: "text",
                              value: k.primary_color || "#1e3a5f",
                              onChange: (i) =>
                                R({ ...k, primary_color: i.target.value }),
                              className:
                                "flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono",
                              placeholder: "#1e3a5f",
                            }),
                          ],
                        }),
                      ],
                    }),
                    (0, n.jsxs)("div", {
                      children: [
                        (0, n.jsx)("label", {
                          className:
                            "block text-xs font-medium text-gray-600 mb-1",
                          children: "Style de layout",
                        }),
                        (0, n.jsxs)("select", {
                          value: k.layout_preference || "modern",
                          onChange: (i) =>
                            R({ ...k, layout_preference: i.target.value }),
                          className:
                            "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm",
                          children: [
                            (0, n.jsx)("option", {
                              value: "modern",
                              children: "Moderne (épuré)",
                            }),
                            (0, n.jsx)("option", {
                              value: "classic",
                              children: "Classique (orné)",
                            }),
                            (0, n.jsx)("option", {
                              value: "minimal",
                              children: "Minimaliste",
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
                (k.logo_url || k.primary_color) &&
                  (0, n.jsxs)("div", {
                    className:
                      "mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200",
                    children: [
                      (0, n.jsx)("p", {
                        className: "text-xs font-medium text-gray-600 mb-3",
                        children: "Aperçu du rendu :",
                      }),
                      (0, n.jsxs)("div", {
                        className: "flex items-center gap-4",
                        children: [
                          (0, n.jsx)(ti, {
                            logoUrl: k.logo_url,
                            villageName: ue,
                            size: "lg",
                            primaryColor: k.primary_color || "#1e3a5f",
                          }),
                          (0, n.jsxs)("div", {
                            children: [
                              (0, n.jsx)("p", {
                                className:
                                  "text-sm font-semibold text-gray-800",
                                children: ue,
                              }),
                              (0, n.jsxs)("p", {
                                className: "text-xs text-gray-500",
                                children: [
                                  "Style : ",
                                  k.layout_preference || "modern",
                                ],
                              }),
                              (0, n.jsx)("div", {
                                className: "mt-2 w-24 h-6 rounded",
                                style: {
                                  backgroundColor: k.primary_color || "#1e3a5f",
                                },
                              }),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
              ],
            }),
            (0, n.jsxs)("div", {
              className: "flex gap-3 pt-2",
              children: [
                (0, n.jsx)("button", {
                  onClick: () => pe(!1),
                  className:
                    "flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors",
                  children: "Annuler",
                }),
                (0, n.jsx)("button", {
                  onClick: vs,
                  disabled: cr || !L,
                  className:
                    "flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity",
                  style: {
                    backgroundColor: e.primary_color,
                    color: "var(--color-on-primary)",
                  },
                  children: cr ? "Sauvegarde..." : "Sauvegarder",
                }),
              ],
            }),
          ],
        }),
      }),
      (0, n.jsx)(rt, {
        isOpen: Fa,
        onClose: () => {
          (zt(!1), pr(null), V(Bt()), We(null));
        },
        title: "Attestation de Propriété Villageoise",
        size: "xl",
        children: (0, n.jsxs)("div", {
          className: "space-y-5",
          children: [
            rn &&
              (0, n.jsx)("div", {
                role: "alert",
                className:
                  "p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700",
                children: rn,
              }),
            (0, n.jsx)("div", {
              className: "rounded-xl border border-blue-100 bg-blue-50 p-4",
              children: (0, n.jsxs)("div", {
                className: "flex flex-col gap-2",
                children: [
                  (0, n.jsx)("div", {
                    className:
                      "text-xs uppercase tracking-wide text-blue-700 font-semibold",
                    children: "Résumé du lot",
                  }),
                  (0, n.jsxs)("div", {
                    className:
                      "grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-900",
                    children: [
                      (0, n.jsxs)("div", {
                        children: [
                          (0, n.jsx)("span", {
                            className: "font-semibold",
                            children: "Référence:",
                          }),
                          " ",
                          be?.reference || "—",
                        ],
                      }),
                      (0, n.jsxs)("div", {
                        children: [
                          (0, n.jsx)("span", {
                            className: "font-semibold",
                            children: "Propriétaire:",
                          }),
                          " ",
                          be?.proprietaire_prenom || "—",
                          " ",
                          be?.proprietaire_nom || "",
                        ],
                      }),
                      (0, n.jsxs)("div", {
                        children: [
                          (0, n.jsx)("span", {
                            className: "font-semibold",
                            children: "Village:",
                          }),
                          " ",
                          be?.village || "—",
                        ],
                      }),
                      (0, n.jsxs)("div", {
                        children: [
                          (0, n.jsx)("span", {
                            className: "font-semibold",
                            children: "Lotissement:",
                          }),
                          " ",
                          be?.nom_lotissement || "—",
                        ],
                      }),
                      (0, n.jsxs)("div", {
                        children: [
                          (0, n.jsx)("span", {
                            className: "font-semibold",
                            children: "Numéro lot:",
                          }),
                          " ",
                          be?.numero_lot || "—",
                        ],
                      }),
                      (0, n.jsxs)("div", {
                        children: [
                          (0, n.jsx)("span", {
                            className: "font-semibold",
                            children: "Superficie:",
                          }),
                          " ",
                          be?.superficie ? `${be.superficie} m²` : "—",
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            }),
            be?.statut === "vendu" &&
              (0, n.jsx)("div", {
                className:
                  "p-3 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-xs",
                children:
                  "Lot marqué comme vendu. Cette attestation sera générée en mode cession.",
              }),
            (0, n.jsxs)("div", {
              className: "rounded-xl border border-gray-200 bg-white p-4",
              children: [
                (0, n.jsx)("div", {
                  className:
                    "text-xs font-semibold text-gray-500 uppercase mb-3",
                  children: "Type d’attestation",
                }),
                (0, n.jsxs)("select", {
                  value: w.attestation_type,
                  onChange: (i) =>
                    V({ ...w, attestation_type: i.target.value }),
                  className: S,
                  children: [
                    (0, n.jsx)("option", {
                      value: "standard",
                      children: "Propriété coutumière",
                    }),
                    (0, n.jsx)("option", {
                      value: "cession",
                      children: "Cession de droits coutumiers",
                    }),
                  ],
                }),
                w.attestation_type === "cession" &&
                  (0, n.jsx)("p", {
                    className: "text-xs text-amber-600 mt-2",
                    children:
                      "Réémission avec nouvelle référence officielle, nouveau QR sécurisé et archivage de l’ancienne attestation.",
                  }),
              ],
            }),
            (0, n.jsxs)("div", {
              className: "grid grid-cols-1 xl:grid-cols-2 gap-4",
              children: [
                (0, n.jsxs)("div", {
                  className: "rounded-xl border border-gray-200 bg-white p-4",
                  children: [
                    (0, n.jsx)("div", {
                      className:
                        "text-xs font-semibold text-gray-500 uppercase mb-3",
                      children: "Enregistrement",
                    }),
                    (0, n.jsxs)("div", {
                      className: "grid grid-cols-3 gap-3",
                      children: [
                        (0, n.jsxs)("div", {
                          children: [
                            (0, n.jsx)("label", {
                              className:
                                "block text-xs font-medium text-gray-600 mb-1",
                              children: "Volume registre",
                            }),
                            (0, n.jsx)("input", {
                              type: "text",
                              value: w.registre_volume,
                              onChange: (i) =>
                                V({ ...w, registre_volume: i.target.value }),
                              className: S,
                            }),
                          ],
                        }),
                        (0, n.jsxs)("div", {
                          children: [
                            (0, n.jsx)("label", {
                              className:
                                "block text-xs font-medium text-gray-600 mb-1",
                              children: "Page",
                            }),
                            (0, n.jsx)("input", {
                              type: "text",
                              value: w.registre_page,
                              onChange: (i) =>
                                V({ ...w, registre_page: i.target.value }),
                              className: S,
                            }),
                          ],
                        }),
                        (0, n.jsxs)("div", {
                          children: [
                            (0, n.jsx)("label", {
                              className:
                                "block text-xs font-medium text-gray-600 mb-1",
                              children: "Ligne",
                            }),
                            (0, n.jsx)("input", {
                              type: "text",
                              value: w.registre_ligne,
                              onChange: (i) =>
                                V({ ...w, registre_ligne: i.target.value }),
                              className: S,
                            }),
                          ],
                        }),
                      ],
                    }),
                    (0, n.jsxs)("div", {
                      className: "mt-3",
                      children: [
                        (0, n.jsx)("label", {
                          className:
                            "block text-xs font-medium text-gray-600 mb-1",
                          children: "Numéro d'enregistrement",
                        }),
                        (0, n.jsx)("input", {
                          type: "text",
                          value: w.numero_enregistrement,
                          onChange: (i) =>
                            V({ ...w, numero_enregistrement: i.target.value }),
                          className: S,
                        }),
                      ],
                    }),
                  ],
                }),
                (0, n.jsxs)("div", {
                  className: "rounded-xl border border-gray-200 bg-white p-4",
                  children: [
                    (0, n.jsx)("div", {
                      className:
                        "text-xs font-semibold text-gray-500 uppercase mb-3",
                      children: "Acquisition & Domicile",
                    }),
                    (0, n.jsxs)("div", {
                      className: "grid grid-cols-2 gap-3",
                      children: [
                        (0, n.jsxs)("div", {
                          children: [
                            (0, n.jsx)("label", {
                              className:
                                "block text-xs font-medium text-gray-600 mb-1",
                              children: "Mode d'acquisition",
                            }),
                            (0, n.jsxs)("select", {
                              value: w.mode_acquisition,
                              onChange: (i) =>
                                V({ ...w, mode_acquisition: i.target.value }),
                              className: S,
                              children: [
                                (0, n.jsx)("option", {
                                  value: "",
                                  children: "Sélectionner",
                                }),
                                (0, n.jsx)("option", {
                                  value: "Héritage",
                                  children: "Héritage",
                                }),
                                (0, n.jsx)("option", {
                                  value: "Donation",
                                  children: "Donation",
                                }),
                                (0, n.jsx)("option", {
                                  value: "Vente coutumière",
                                  children: "Vente coutumière",
                                }),
                                (0, n.jsx)("option", {
                                  value: "Autre",
                                  children: "Autre",
                                }),
                              ],
                            }),
                          ],
                        }),
                        (0, n.jsxs)("div", {
                          children: [
                            (0, n.jsx)("label", {
                              className:
                                "block text-xs font-medium text-gray-600 mb-1",
                              children: "Domicile du détenteur",
                            }),
                            (0, n.jsx)("input", {
                              type: "text",
                              value: w.domicile,
                              onChange: (i) =>
                                V({ ...w, domicile: i.target.value }),
                              className: S,
                            }),
                          ],
                        }),
                      ],
                    }),
                    (0, n.jsxs)("div", {
                      className: "mt-3",
                      children: [
                        (0, n.jsx)("label", {
                          className:
                            "block text-xs font-medium text-gray-600 mb-1",
                          children: "Historique de possession",
                        }),
                        (0, n.jsx)("textarea", {
                          value: w.historique_possession,
                          onChange: (i) =>
                            V({ ...w, historique_possession: i.target.value }),
                          rows: 3,
                          className: `${S} resize-none`,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            w.attestation_type === "cession" &&
              (0, n.jsxs)("div", {
                className:
                  "rounded-xl border border-amber-200 bg-amber-50/40 p-4",
                children: [
                  (0, n.jsx)("div", {
                    className:
                      "text-xs font-semibold text-amber-700 uppercase mb-3",
                    children: "Cédant (droits coutumiers)",
                  }),
                  (0, n.jsxs)("div", {
                    className: "grid grid-cols-1 md:grid-cols-5 gap-3",
                    children: [
                      (0, n.jsx)("input", {
                        type: "text",
                        value: w.cedant_nom,
                        onChange: (i) =>
                          V({ ...w, cedant_nom: i.target.value }),
                        className: S,
                        placeholder: "Nom",
                      }),
                      (0, n.jsx)("input", {
                        type: "text",
                        value: w.cedant_prenom,
                        onChange: (i) =>
                          V({ ...w, cedant_prenom: i.target.value }),
                        className: S,
                        placeholder: "Prénoms",
                      }),
                      (0, n.jsx)("input", {
                        type: "text",
                        value: w.cedant_cni_numero,
                        onChange: (i) =>
                          V({ ...w, cedant_cni_numero: i.target.value }),
                        className: S,
                        placeholder: "CNI",
                      }),
                      (0, n.jsx)("input", {
                        type: "text",
                        value: w.cedant_telephone,
                        onChange: (i) =>
                          V({ ...w, cedant_telephone: i.target.value }),
                        className: S,
                        placeholder: "Téléphone",
                      }),
                      (0, n.jsx)("input", {
                        type: "text",
                        value: w.cedant_domicile,
                        onChange: (i) =>
                          V({ ...w, cedant_domicile: i.target.value }),
                        className: S,
                        placeholder: "Domicile",
                      }),
                    ],
                  }),
                  (0, n.jsx)("p", {
                    className: "text-[11px] text-amber-700 mt-2",
                    children:
                      "Les informations du cédant sont obligatoires pour une attestation de cession.",
                  }),
                ],
              }),
            (0, n.jsxs)("div", {
              className: "rounded-xl border border-gray-200 bg-white p-4",
              children: [
                (0, n.jsx)("div", {
                  className:
                    "text-xs font-semibold text-gray-500 uppercase mb-3",
                  children: "Limites & Coordonnées GPS",
                }),
                (0, n.jsxs)("div", {
                  className: "grid grid-cols-2 gap-3",
                  children: [
                    (0, n.jsxs)("div", {
                      children: [
                        (0, n.jsx)("label", {
                          className:
                            "block text-xs font-medium text-gray-600 mb-1",
                          children: "Limite Nord",
                        }),
                        (0, n.jsx)("input", {
                          type: "text",
                          value: w.limites_nord,
                          onChange: (i) =>
                            V({ ...w, limites_nord: i.target.value }),
                          className: S,
                        }),
                      ],
                    }),
                    (0, n.jsxs)("div", {
                      children: [
                        (0, n.jsx)("label", {
                          className:
                            "block text-xs font-medium text-gray-600 mb-1",
                          children: "Limite Sud",
                        }),
                        (0, n.jsx)("input", {
                          type: "text",
                          value: w.limites_sud,
                          onChange: (i) =>
                            V({ ...w, limites_sud: i.target.value }),
                          className: S,
                        }),
                      ],
                    }),
                    (0, n.jsxs)("div", {
                      children: [
                        (0, n.jsx)("label", {
                          className:
                            "block text-xs font-medium text-gray-600 mb-1",
                          children: "Limite Est",
                        }),
                        (0, n.jsx)("input", {
                          type: "text",
                          value: w.limites_est,
                          onChange: (i) =>
                            V({ ...w, limites_est: i.target.value }),
                          className: S,
                        }),
                      ],
                    }),
                    (0, n.jsxs)("div", {
                      children: [
                        (0, n.jsx)("label", {
                          className:
                            "block text-xs font-medium text-gray-600 mb-1",
                          children: "Limite Ouest",
                        }),
                        (0, n.jsx)("input", {
                          type: "text",
                          value: w.limites_ouest,
                          onChange: (i) =>
                            V({ ...w, limites_ouest: i.target.value }),
                          className: S,
                        }),
                      ],
                    }),
                  ],
                }),
                (0, n.jsxs)("div", {
                  className: "grid grid-cols-3 gap-3 mt-3",
                  children: [
                    (0, n.jsxs)("div", {
                      children: [
                        (0, n.jsx)("label", {
                          className:
                            "block text-xs font-medium text-gray-600 mb-1",
                          children: "Latitude",
                        }),
                        (0, n.jsx)("input", {
                          type: "text",
                          value: w.gps_lat,
                          onChange: (i) => V({ ...w, gps_lat: i.target.value }),
                          className: S,
                        }),
                      ],
                    }),
                    (0, n.jsxs)("div", {
                      children: [
                        (0, n.jsx)("label", {
                          className:
                            "block text-xs font-medium text-gray-600 mb-1",
                          children: "Longitude",
                        }),
                        (0, n.jsx)("input", {
                          type: "text",
                          value: w.gps_lng,
                          onChange: (i) => V({ ...w, gps_lng: i.target.value }),
                          className: S,
                        }),
                      ],
                    }),
                    (0, n.jsxs)("div", {
                      children: [
                        (0, n.jsx)("label", {
                          className:
                            "block text-xs font-medium text-gray-600 mb-1",
                          children: "Précision (m)",
                        }),
                        (0, n.jsx)("input", {
                          type: "text",
                          value: w.gps_precision,
                          onChange: (i) =>
                            V({ ...w, gps_precision: i.target.value }),
                          className: S,
                        }),
                      ],
                    }),
                  ],
                }),
                (0, n.jsxs)("div", {
                  className: "mt-4",
                  children: [
                    (0, n.jsx)("div", {
                      className:
                        "text-xs font-semibold text-gray-500 uppercase mb-2",
                      children: "GPS des limites",
                    }),
                    (0, n.jsx)("div", {
                      className: "space-y-2",
                      children: [
                        {
                          label: "Nord",
                          latKey: "gps_nord_lat",
                          lngKey: "gps_nord_lng",
                        },
                        {
                          label: "Sud",
                          latKey: "gps_sud_lat",
                          lngKey: "gps_sud_lng",
                        },
                        {
                          label: "Est",
                          latKey: "gps_est_lat",
                          lngKey: "gps_est_lng",
                        },
                        {
                          label: "Ouest",
                          latKey: "gps_ouest_lat",
                          lngKey: "gps_ouest_lng",
                        },
                      ].map((i) =>
                        (0, n.jsxs)(
                          "div",
                          {
                            className: "grid grid-cols-3 gap-3",
                            children: [
                              (0, n.jsxs)("div", {
                                className: "col-span-1",
                                children: [
                                  (0, n.jsxs)("label", {
                                    className:
                                      "block text-xs font-medium text-gray-600 mb-1",
                                    children: ["Limite ", i.label],
                                  }),
                                  (0, n.jsx)("input", {
                                    type: "text",
                                    value: w[i.latKey],
                                    onChange: (c) =>
                                      V({ ...w, [i.latKey]: c.target.value }),
                                    className: S,
                                    placeholder: "Latitude",
                                  }),
                                ],
                              }),
                              (0, n.jsxs)("div", {
                                className: "col-span-1",
                                children: [
                                  (0, n.jsx)("label", {
                                    className:
                                      "block text-xs font-medium text-gray-600 mb-1",
                                    children: " ",
                                  }),
                                  (0, n.jsx)("input", {
                                    type: "text",
                                    value: w[i.lngKey],
                                    onChange: (c) =>
                                      V({ ...w, [i.lngKey]: c.target.value }),
                                    className: S,
                                    placeholder: "Longitude",
                                  }),
                                ],
                              }),
                              (0, n.jsx)("div", {
                                className: "col-span-1 flex items-end",
                                children: (0, n.jsx)("div", {
                                  className: "text-xs text-gray-400",
                                  children: "Précision < 5m recommandée",
                                }),
                              }),
                            ],
                          },
                          i.label,
                        ),
                      ),
                    }),
                  ],
                }),
              ],
            }),
            (0, n.jsxs)("div", {
              className: "rounded-xl border border-gray-200 bg-white p-4",
              children: [
                (0, n.jsx)("div", {
                  className:
                    "text-xs font-semibold text-gray-500 uppercase mb-3",
                  children: "Témoins",
                }),
                (0, n.jsx)("div", {
                  className: "space-y-3",
                  children: w.temoins.map((i, c) =>
                    (0, n.jsxs)(
                      "div",
                      {
                        className: "rounded-lg border border-gray-100 p-3",
                        children: [
                          (0, n.jsxs)("div", {
                            className:
                              "text-[11px] font-semibold text-gray-500 mb-2",
                            children: ["Témoin ", c + 1],
                          }),
                          (0, n.jsxs)("div", {
                            className: "grid grid-cols-1 md:grid-cols-5 gap-3",
                            children: [
                              (0, n.jsx)("input", {
                                type: "text",
                                value: i.nom,
                                onChange: (h) => pt(c, "nom", h.target.value),
                                className: S,
                                placeholder: "Nom",
                              }),
                              (0, n.jsx)("input", {
                                type: "text",
                                value: i.prenom,
                                onChange: (h) =>
                                  pt(c, "prenom", h.target.value),
                                className: S,
                                placeholder: "Prénom",
                              }),
                              (0, n.jsx)("input", {
                                type: "text",
                                value: i.profession,
                                onChange: (h) =>
                                  pt(c, "profession", h.target.value),
                                className: S,
                                placeholder: "Profession",
                              }),
                              (0, n.jsx)("input", {
                                type: "text",
                                value: i.telephone,
                                onChange: (h) =>
                                  pt(c, "telephone", h.target.value),
                                className: S,
                                placeholder: "Téléphone",
                              }),
                              (0, n.jsx)("input", {
                                type: "text",
                                value: i.cni,
                                onChange: (h) => pt(c, "cni", h.target.value),
                                className: S,
                                placeholder: "CNI/Passeport",
                              }),
                            ],
                          }),
                        ],
                      },
                      `temoin-${c}`,
                    ),
                  ),
                }),
              ],
            }),
            (0, n.jsxs)("div", {
              className: "grid grid-cols-1 xl:grid-cols-2 gap-4",
              children: [
                (0, n.jsxs)("div", {
                  className: "rounded-xl border border-gray-200 bg-white p-4",
                  children: [
                    (0, n.jsx)("div", {
                      className:
                        "text-xs font-semibold text-gray-500 uppercase mb-3",
                      children: "Validation",
                    }),
                    (0, n.jsxs)("div", {
                      className: "grid grid-cols-2 gap-3",
                      children: [
                        (0, n.jsxs)("div", {
                          children: [
                            (0, n.jsx)("label", {
                              className:
                                "block text-xs font-medium text-gray-600 mb-1",
                              children: "Agent responsable",
                            }),
                            (0, n.jsx)("input", {
                              type: "text",
                              value: w.validation_agent_nom,
                              onChange: (i) =>
                                V({
                                  ...w,
                                  validation_agent_nom: i.target.value,
                                }),
                              className: S,
                            }),
                          ],
                        }),
                        (0, n.jsxs)("div", {
                          children: [
                            (0, n.jsx)("label", {
                              className:
                                "block text-xs font-medium text-gray-600 mb-1",
                              children: "Chef du village",
                            }),
                            (0, n.jsx)("input", {
                              type: "text",
                              value: w.validation_chef_nom,
                              onChange: (i) =>
                                V({
                                  ...w,
                                  validation_chef_nom: i.target.value,
                                }),
                              className: S,
                            }),
                          ],
                        }),
                      ],
                    }),
                    (0, n.jsx)("div", {
                      className: "text-[11px] text-gray-500 mt-2",
                      children:
                        "La validation est effectuée par le Chef (signature physique), puis le scan est ajouté.",
                    }),
                  ],
                }),
                (0, n.jsxs)("div", {
                  className: "rounded-xl border border-gray-200 bg-white p-4",
                  children: [
                    (0, n.jsx)("div", {
                      className:
                        "text-xs font-semibold text-gray-500 uppercase mb-3",
                      children: "Document",
                    }),
                    (0, n.jsx)("label", {
                      className: "block text-xs font-medium text-gray-600 mb-1",
                      children: "État",
                    }),
                    (0, n.jsxs)("select", {
                      value: w.original ? "original" : "copie",
                      onChange: (i) =>
                        V({ ...w, original: i.target.value === "original" }),
                      className: S,
                      children: [
                        (0, n.jsx)("option", {
                          value: "original",
                          children: "Original",
                        }),
                        (0, n.jsx)("option", {
                          value: "copie",
                          children: "Copie",
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            (0, n.jsxs)("div", {
              className: "flex gap-3 pt-2",
              children: [
                (0, n.jsx)("button", {
                  onClick: () => zt(!1),
                  className:
                    "flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors",
                  children: "Annuler",
                }),
                (0, n.jsx)("button", {
                  onClick: () => fs(),
                  disabled: tn || !L,
                  className:
                    "flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors",
                  children: tn ? "Traitement..." : "Soumettre & Imprimer",
                }),
              ],
            }),
          ],
        }),
      }),
      (0, n.jsx)(rt, {
        isOpen: Ma,
        onClose: () => {
          (sn(!1), on(null), cn([]), $t({}), fr(null));
        },
        title: "Historique des attestations",
        size: "xl",
        children: (0, n.jsxs)("div", {
          className: "space-y-4",
          children: [
            un &&
              (0, n.jsx)("div", {
                role: "alert",
                className:
                  "p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700",
                children: un,
              }),
            At &&
              (0, n.jsxs)("div", {
                className:
                  "rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700",
                children: [
                  (0, n.jsx)("span", {
                    className: "font-semibold",
                    children: "Lot:",
                  }),
                  " ",
                  At.numero_lot,
                  " · ",
                  At.village,
                  (0, n.jsx)("span", {
                    className: "mx-2 text-gray-400",
                    children: "|",
                  }),
                  (0, n.jsx)("span", {
                    className: "font-semibold",
                    children: "Réf parcelle:",
                  }),
                  " ",
                  At.reference,
                ],
              }),
            Ja
              ? (0, n.jsx)("div", {
                  className: "flex items-center justify-center h-40",
                  children: (0, n.jsx)("div", {
                    className: "animate-spin rounded-full h-8 w-8 border-b-2",
                    style: { borderColor: e.primary_color },
                  }),
                })
              : ln.length === 0
                ? (0, n.jsx)("div", {
                    className:
                      "flex flex-col items-center justify-center h-40 text-gray-400",
                    children: (0, n.jsx)("p", {
                      className: "text-sm",
                      children: "Aucune attestation disponible",
                    }),
                  })
                : (0, n.jsx)("div", {
                    className:
                      "overflow-x-auto border border-gray-100 rounded-xl",
                    children: (0, n.jsxs)("table", {
                      className: "w-full egs-table",
                      children: [
                        (0, n.jsx)("thead", {
                          children: (0, n.jsxs)("tr", {
                            className: "bg-gray-50 border-b border-gray-100",
                            children: [
                              (0, n.jsx)("th", {
                                className:
                                  "text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase",
                                children: "Version",
                              }),
                              (0, n.jsx)("th", {
                                className:
                                  "text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase",
                                children: "Référence",
                              }),
                              (0, n.jsx)("th", {
                                className:
                                  "text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase",
                                children: "Date",
                              }),
                              (0, n.jsx)("th", {
                                className:
                                  "text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase",
                                children: "Statut",
                              }),
                              (0, n.jsx)("th", {
                                className:
                                  "text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase",
                                children: "Scan",
                              }),
                            ],
                          }),
                        }),
                        (0, n.jsx)("tbody", {
                          className: "divide-y divide-gray-50",
                          children: ln.map((i) => {
                            const c = Bu(i),
                              h = Ga[i.id],
                              b = i.date_etablissement || i.created_at;
                            return (0, n.jsxs)(
                              "tr",
                              {
                                className: "hover:bg-gray-50 transition-colors",
                                children: [
                                  (0, n.jsxs)("td", {
                                    className:
                                      "px-4 py-3 text-sm text-gray-700",
                                    children: ["V", i.version || 1],
                                  }),
                                  (0, n.jsx)("td", {
                                    className: "px-4 py-3 table-key",
                                    children: i.reference,
                                  }),
                                  (0, n.jsx)("td", {
                                    className:
                                      "px-4 py-3 text-sm text-gray-600",
                                    children: Le(b),
                                  }),
                                  (0, n.jsx)("td", {
                                    className: "px-4 py-3",
                                    children: (0, n.jsx)(Zr, {
                                      label: c.label,
                                      color: c.color,
                                    }),
                                  }),
                                  (0, n.jsx)("td", {
                                    className:
                                      "px-4 py-3 text-sm text-gray-600",
                                    children: h
                                      ? (0, n.jsx)("a", {
                                          href: h.url,
                                          target: "_blank",
                                          rel: "noreferrer",
                                          className:
                                            "text-blue-600 hover:underline",
                                          children: h.original_name || "Ouvrir",
                                        })
                                      : "—",
                                  }),
                                ],
                              },
                              i.id,
                            );
                          }),
                        }),
                      ],
                    }),
                  }),
          ],
        }),
      }),
      (0, n.jsx)(rt, {
        isOpen: Ua,
        onClose: () => nn(!1),
        title: "Workflow de Validation",
        size: "xl",
        children:
          an &&
          (0, n.jsx)(ci, {
            lotId: an,
            userId: t?.id || null,
            userName: t?.full_name || null,
            isAdmin: dt === "admin",
            isOnline: K,
            onWorkflowComplete: () => {
              tt();
            },
          }),
      }),
      (0, n.jsx)(rt, {
        isOpen: gr,
        onClose: () => dn(!1),
        title: "Journal d'audit foncier",
        size: "xl",
        children: (0, n.jsxs)("div", {
          className: "space-y-4",
          children: [
            mn &&
              (0, n.jsx)("div", {
                role: "alert",
                className:
                  "p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700",
                children: mn,
              }),
            (0, n.jsxs)("div", {
              className: "flex flex-wrap items-center gap-2",
              children: [
                (0, n.jsxs)("select", {
                  value: Et,
                  onChange: (i) => {
                    (pn(i.target.value), Ct(1));
                  },
                  className:
                    "px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none bg-white",
                  children: [
                    (0, n.jsx)("option", {
                      value: "",
                      children: "Toutes actions",
                    }),
                    Ku.map((i) =>
                      (0, n.jsx)("option", { value: i, children: i }, i),
                    ),
                  ],
                }),
                (0, n.jsx)("button", {
                  onClick: is,
                  disabled: !Ie.length,
                  className: `px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors ${ge}`,
                  children: "Imprimer (PDF)",
                }),
                (0, n.jsx)("button", {
                  onClick: ss,
                  disabled: !Ie.length,
                  className: `px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors ${ge}`,
                  children: "Export CSV",
                }),
              ],
            }),
            Ba
              ? (0, n.jsx)("div", {
                  className: "flex items-center justify-center h-40",
                  children: (0, n.jsx)("div", {
                    className: "animate-spin rounded-full h-8 w-8 border-b-2",
                    style: { borderColor: e.primary_color },
                  }),
                })
              : Ie.length === 0
                ? (0, n.jsx)("div", {
                    className:
                      "flex flex-col items-center justify-center h-40 text-gray-400",
                    children: (0, n.jsx)("p", {
                      className: "text-sm",
                      children: "Aucun audit disponible",
                    }),
                  })
                : (0, n.jsx)("div", {
                    className:
                      "overflow-x-auto border border-gray-100 rounded-xl",
                    children: (0, n.jsxs)("table", {
                      className: "w-full egs-table",
                      children: [
                        (0, n.jsx)("thead", {
                          children: (0, n.jsxs)("tr", {
                            className: "bg-gray-50 border-b border-gray-100",
                            children: [
                              (0, n.jsx)("th", {
                                className:
                                  "text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase",
                                children: "Date",
                              }),
                              (0, n.jsx)("th", {
                                className:
                                  "text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase",
                                children: "Action",
                              }),
                              (0, n.jsx)("th", {
                                className:
                                  "text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase",
                                children: "Utilisateur",
                              }),
                              (0, n.jsx)("th", {
                                className:
                                  "text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase",
                                children: "Parcelle",
                              }),
                              (0, n.jsx)("th", {
                                className:
                                  "text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase",
                                children: "Village",
                              }),
                            ],
                          }),
                        }),
                        (0, n.jsx)("tbody", {
                          className: "divide-y divide-gray-50",
                          children: Ie.map((i) => {
                            const c = Array.isArray(i.foncier_lots)
                              ? i.foncier_lots[0]
                              : i.foncier_lots;
                            return (0, n.jsxs)(
                              "tr",
                              {
                                className: "hover:bg-gray-50 transition-colors",
                                children: [
                                  (0, n.jsx)("td", {
                                    className:
                                      "px-4 py-3 text-sm text-gray-600",
                                    children: Le(i.date_action),
                                  }),
                                  (0, n.jsx)("td", {
                                    className:
                                      "px-4 py-3 text-sm text-gray-700",
                                    children: i.action,
                                  }),
                                  (0, n.jsx)("td", {
                                    className:
                                      "px-4 py-3 text-sm text-gray-700",
                                    children: i.utilisateur_nom || "—",
                                  }),
                                  (0, n.jsx)("td", {
                                    className: "px-4 py-3 table-key",
                                    children: c?.reference || "—",
                                  }),
                                  (0, n.jsx)("td", {
                                    className:
                                      "px-4 py-3 text-sm text-gray-700",
                                    children: c?.village || "—",
                                  }),
                                ],
                              },
                              i.id,
                            );
                          }),
                        }),
                      ],
                    }),
                  }),
            (0, n.jsxs)("div", {
              className: "flex items-center justify-between pt-2",
              children: [
                (0, n.jsxs)("span", {
                  className: "text-xs text-gray-500",
                  children: ["Page ", ut, " / ", zr],
                }),
                (0, n.jsxs)("div", {
                  className: "flex gap-2",
                  children: [
                    (0, n.jsx)("button", {
                      onClick: () => Ct((i) => Math.max(1, i - 1)),
                      disabled: ut <= 1,
                      className: `px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors ${ge}`,
                      children: "Précédent",
                    }),
                    (0, n.jsx)("button", {
                      onClick: () => Ct((i) => Math.min(zr, i + 1)),
                      disabled: ut >= zr,
                      className: `px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors ${ge}`,
                      children: "Suivant",
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      }),
    ],
  });
}
export { pd as default };
