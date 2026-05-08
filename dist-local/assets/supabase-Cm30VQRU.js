import { t as c } from "./supabase-vendor-Edgr6ZxE.js";
var s = "cloud".toLowerCase(),
  r = s === "local" || s === "cloud" ? s : "auto",
  u = () => {
    if (r !== "local") return "https://thykrnoqgylrbfupophs.supabase.co";
  },
  m = () => {
    if (r !== "local")
      return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRoeWtybm9xZ3lscmJmdXBvcGhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNTQ1MjMsImV4cCI6MjA4MzgzMDUyM30.WrL2Y8YwDCDzp-R8K7XJIYYqQid-JJICQ3DktM6nf-s";
  },
  t = u(),
  l = m(),
  d = "egs:remember_me";
if (!t || !l)
  throw new Error(
    `Configuration Supabase manquante (mode=${r}). Vérifiez VITE_SUPABASE_MODE et les variables: VITE_SUPABASE_URL / VITE_SUPABASE_LOCAL_URL / VITE_SUPABASE_ANON_KEY / VITE_SUPABASE_LOCAL_ANON_KEY`,
  );
t.includes("localhost") || t.includes("127.0.0.1");
var n = () => {
    if (!(typeof window > "u"))
      return window.localStorage.getItem(d) === "true"
        ? window.localStorage
        : window.sessionStorage;
  },
  p = {
    auth: {
      persistSession: !0,
      storage:
        typeof window < "u"
          ? {
              getItem: (e) => n()?.getItem(e) ?? null,
              setItem: (e, a) => {
                const o = n();
                o &&
                  ((o === window.localStorage
                    ? window.sessionStorage
                    : window.localStorage
                  )?.removeItem(e),
                  o.setItem(e, a));
              },
              removeItem: (e) => {
                (window.localStorage?.removeItem(e),
                  window.sessionStorage?.removeItem(e));
              },
            }
          : void 0,
      autoRefreshToken: !0,
      detectSessionInUrl: !0,
      flowType: "implicit",
    },
    global: {
      fetch: async (e, a) => {
        const o = new AbortController(),
          I = setTimeout(() => o.abort(), 3e4);
        try {
          return await fetch(e, { ...a, signal: o.signal });
        } catch (i) {
          throw (i instanceof Error && i.name, i);
        } finally {
          clearTimeout(I);
        }
      },
      headers: { "Content-Type": "application/json" },
    },
  },
  S = c(t, l, p);
export { S as t };
