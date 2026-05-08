import { createClient, SupabaseClientOptions } from "@supabase/supabase-js";

// Support for both local and cloud Supabase instances
// Mode: VITE_SUPABASE_MODE = 'cloud' | 'local' | 'auto' (default)
const rawMode = String(import.meta.env.VITE_SUPABASE_MODE || "").toLowerCase();
const supabaseMode =
  rawMode === "local" || rawMode === "cloud" ? rawMode : "auto";

const resolveSupabaseUrl = () => {
  if (supabaseMode === "local") return import.meta.env.VITE_SUPABASE_LOCAL_URL;
  if (supabaseMode === "cloud") return import.meta.env.VITE_SUPABASE_URL;
  return (
    import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_LOCAL_URL
  );
};

const resolveSupabaseAnonKey = () => {
  if (supabaseMode === "local")
    return import.meta.env.VITE_SUPABASE_LOCAL_ANON_KEY;
  if (supabaseMode === "cloud") return import.meta.env.VITE_SUPABASE_ANON_KEY;
  return (
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    import.meta.env.VITE_SUPABASE_LOCAL_ANON_KEY
  );
};

const supabaseUrl = resolveSupabaseUrl();
const supabaseAnonKey = resolveSupabaseAnonKey();

const REMEMBER_ME_KEY = "egs:remember_me";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    `Configuration Supabase manquante (mode=${supabaseMode}). ` +
      "Vérifiez VITE_SUPABASE_MODE et les variables: " +
      "VITE_SUPABASE_URL / VITE_SUPABASE_LOCAL_URL / VITE_SUPABASE_ANON_KEY / VITE_SUPABASE_LOCAL_ANON_KEY",
  );
}

// Detect if using local Supabase for logging purposes
const isLocalSupabase =
  supabaseUrl.includes("localhost") || supabaseUrl.includes("127.0.0.1");
if (typeof console !== "undefined" && import.meta.env.DEV) {
  const label = isLocalSupabase ? "LOCAL" : "CLOUD";
  console.log(`🔧 [Supabase] Mode ${label} (${supabaseMode}) -`, supabaseUrl);
}

const resolveAuthStorage = () => {
  if (typeof window === "undefined") return undefined;
  const rememberMe = window.localStorage.getItem(REMEMBER_ME_KEY) === "true";
  return rememberMe ? window.localStorage : window.sessionStorage;
};

const authStorage =
  typeof window !== "undefined"
    ? {
        getItem: (key: string) => resolveAuthStorage()?.getItem(key) ?? null,
        setItem: (key: string, value: string) => {
          const storage = resolveAuthStorage();
          if (!storage) return;
          const other =
            storage === window.localStorage
              ? window.sessionStorage
              : window.localStorage;
          other?.removeItem(key);
          storage.setItem(key, value);
        },
        removeItem: (key: string) => {
          window.localStorage?.removeItem(key);
          window.sessionStorage?.removeItem(key);
        },
      }
    : undefined;

// Configuration avec timeouts améliorés pour connexions lentes
const supabaseOptions: SupabaseClientOptions<any> = {
  auth: {
    persistSession: true,
    storage: authStorage,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: "implicit",
  },
  global: {
    // Timeouts pour les requêtes HTTP (en ms)
    fetch: async (url: RequestInfo | URL, options?: RequestInit) => {
      const controller = new AbortController();
      // Timeout de 30 secondes pour les requêtes normales
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });
        return response;
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          if (import.meta.env.DEV)
            console.error("⏱️ Timeout Supabase (>30s):", url);
        }
        throw error;
      } finally {
        clearTimeout(timeoutId);
      }
    },
    // Headers pour optimiser les connexions
    headers: {
      "Content-Type": "application/json",
    },
  },
};

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  supabaseOptions,
);
