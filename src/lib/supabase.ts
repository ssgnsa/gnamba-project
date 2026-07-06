import type {
  SupabaseClient,
  SupabaseClientOptions,
} from "@supabase/supabase-js";
import { isSelfHostedMode } from "./selfHosted";
import {
  resolveSupabaseAnonKey,
  resolveSupabaseMode,
  resolveSupabaseUrl,
} from "./supabaseConfig";

const supabaseMode = resolveSupabaseMode();
const supabaseUrl = resolveSupabaseUrl();
const supabaseAnonKey = resolveSupabaseAnonKey();
const selfHostedMode = isSelfHostedMode();

const REMEMBER_ME_KEY = "egs:remember_me";

const notSupportedInSelfHostedMode = (operation: string): never => {
  throw new Error(
    `Le client Supabase legacy est désactivé en mode self-hosted. Utilisez src/api/client.ts ou un service backend pour ${operation}.`,
  );
};

const createLegacySupabaseProxy = (): SupabaseClient<any, any, any> =>
  new Proxy(
    {},
    {
      get(_target, prop) {
        switch (prop) {
          case "from":
            return () => notSupportedInSelfHostedMode("from()");
          case "rpc":
            return () => notSupportedInSelfHostedMode("rpc()");
          case "auth":
            return {
              getSession: () =>
                notSupportedInSelfHostedMode("auth.getSession()"),
              getUser: () => notSupportedInSelfHostedMode("auth.getUser()"),
              signInWithPassword: () =>
                notSupportedInSelfHostedMode("auth.signInWithPassword()"),
              signOut: () => notSupportedInSelfHostedMode("auth.signOut()"),
              resetPasswordForEmail: () =>
                notSupportedInSelfHostedMode("auth.resetPasswordForEmail()"),
              updateUser: () =>
                notSupportedInSelfHostedMode("auth.updateUser()"),
              onAuthStateChange: () =>
                notSupportedInSelfHostedMode("auth.onAuthStateChange()"),
            };
          case "storage":
            return {
              from: () => notSupportedInSelfHostedMode("storage.from()"),
            };
          case "functions":
            return {
              invoke: () => notSupportedInSelfHostedMode("functions.invoke()"),
            };
          case "channel":
            return () => notSupportedInSelfHostedMode("channel()");
          case "removeChannel":
            return () => undefined;
          default:
            return undefined;
        }
      },
    },
  ) as SupabaseClient<any, any, any>;

const isPublishableKey = (value: string | undefined): boolean =>
  typeof value === "string" && value.startsWith("sb_");

const isJwtToken = (value: string | undefined): boolean =>
  typeof value === "string" && value.split(".").length === 3;

const assertValidSupabaseConfig = (): {
  supabaseUrl: string;
  supabaseAnonKey: string;
} => {
  if (selfHostedMode) {
    return {
      supabaseUrl: "http://localhost:54321",
      supabaseAnonKey: "self-hosted-disabled",
    };
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    const missingVars = [];
    if (!supabaseUrl)
      missingVars.push(
        supabaseMode === "local"
          ? "VITE_SUPABASE_LOCAL_URL"
          : "VITE_SUPABASE_URL",
      );
    if (!supabaseAnonKey)
      missingVars.push(
        supabaseMode === "local"
          ? "VITE_SUPABASE_LOCAL_ANON_KEY"
          : "VITE_SUPABASE_ANON_KEY",
      );
    throw new Error(
      `Configuration Supabase incomplète (mode=${supabaseMode}). ` +
        `Variables manquantes: ${missingVars.join(", ")}. ` +
        `Vérifiez votre fichier .env`,
    );
  }

  if (supabaseMode === "local") {
    if (!isPublishableKey(supabaseAnonKey)) {
      const keyHint = isJwtToken(supabaseAnonKey)
        ? "VITE_SUPABASE_LOCAL_ANON_KEY contient un token JWT, pas une clé publishable."
        : "VITE_SUPABASE_LOCAL_ANON_KEY doit commencer par 'sb_'.";
      throw new Error(
        `Configuration Supabase invalide (mode=local). ${keyHint} ` +
          `Utilisez une clé publishable Supabase locale (sb_...) et non une clé JWT.`,
      );
    }
    try {
      new URL(supabaseUrl);
    } catch {
      throw new Error(
        `Configuration Supabase invalide (mode=local). VITE_SUPABASE_LOCAL_URL doit être une URL valide, par exemple http://localhost:54321.`,
      );
    }
  }

  return {
    supabaseUrl,
    supabaseAnonKey,
  };
};

const {
  supabaseUrl: validatedSupabaseUrl,
  supabaseAnonKey: validatedSupabaseAnonKey,
} = assertValidSupabaseConfig();

// Log contextuel selon le mode
if (typeof console !== "undefined" && import.meta.env.DEV) {
  const modeLabel = supabaseMode === "local" ? "LOCAL (tunnel)" : "CLOUD";
  console.log(`🔧 [Supabase] Mode ${modeLabel} -`, validatedSupabaseUrl);

  // Alerte si l'URL contient localhost en mode cloud
  if (supabaseMode === "cloud" && validatedSupabaseUrl.includes("localhost")) {
    console.warn(
      "⚠️ [Supabase] URL cloud contient 'localhost' - inaccessible depuis d'autres postes!",
      "Utilisez une URL réseau ou un tunnel",
    );
  }
}

// Nettoyage proactif des sessions stockées incompatibles (JWT provenant d'un autre
// environnement). On fait cela avant d'initialiser le client pour éviter d'envoyer
// des Authorization invalides depuis le navigateur qui provoquent des 401.
if (typeof window !== "undefined") {
  try {
    const candidateKeys = [
      // clés courantes utilisées par Supabase et notre app
      "supabase.auth.token",
      "supabase.auth.token-type",
      "supabase.auth.session",
      "egs-supabase-auth",
    ];

    const clearKey = (k: string) => {
      try {
        window.localStorage.removeItem(k);
      } catch {
        void 0;
      }
      try {
        window.sessionStorage.removeItem(k);
      } catch {
        void 0;
      }
    };

    for (const k of Object.keys(window.localStorage || {})) {
      try {
        const val = window.localStorage.getItem(k);
        if (!val) continue;
        // essaye de parser JSON; si contient access_token ressemblant à un JWT, supprime
        const parsed = JSON.parse(val);
        if (parsed && typeof parsed === "object") {
          const token =
            parsed?.access_token ||
            parsed?.currentSession?.access_token ||
            parsed?.token?.access_token;
          if (typeof token === "string" && token.startsWith("eyJ")) {
            clearKey(k);
          }
        }
      } catch {
        // non JSON ou autre -> ignore
        void 0;
      }
    }

    // aussi parcourir sessionStorage
    for (const k of Object.keys(window.sessionStorage || {})) {
      try {
        const val = window.sessionStorage.getItem(k);
        if (!val) continue;
        const parsed = JSON.parse(val);
        if (parsed && typeof parsed === "object") {
          const token =
            parsed?.access_token ||
            parsed?.currentSession?.access_token ||
            parsed?.token?.access_token;
          if (typeof token === "string" && token.startsWith("eyJ")) {
            clearKey(k);
          }
        }
      } catch {
        void 0;
      }
    }

    // supprime les clés connues explicitement
    for (const k of candidateKeys) clearKey(k);
  } catch (e) {
    // ne pas interrompre l'initialisation si le nettoyage échoue
    console.warn("[Supabase] Nettoyage sessions locales échoué:", e);
    void 0;
  }
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

const supabaseOptions: SupabaseClientOptions<any> = {
  auth: {
    persistSession: true,
    storage: authStorage,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storageKey: "egs-supabase-auth",
  },
  global: {
    fetch: async (url: RequestInfo | URL, options?: RequestInit) => {
      const controller = new AbortController();
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
  },
};

type SupabaseClientSingleton = SupabaseClient<any, any, any>;

const globalForSupabase = globalThis as typeof globalThis & {
  __EGS_SUPABASE_CLIENT__?: SupabaseClientSingleton;
};

// Lazy-load createClient only in cloud mode at runtime.
async function initializeCloudSupabaseClient(): Promise<SupabaseClientSingleton> {
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(
    validatedSupabaseUrl,
    validatedSupabaseAnonKey,
    supabaseOptions,
  );
}

// Export a lazy-loading proxy that initializes on first browser render.
export const supabase = selfHostedMode
  ? createLegacySupabaseProxy()
  : (new Proxy(
      {},
      {
        get: (target, prop) => {
          if (globalForSupabase.__EGS_SUPABASE_CLIENT__) {
            return (globalForSupabase.__EGS_SUPABASE_CLIENT__ as any)[prop];
          }
          console.warn(
            "[Supabase] Client not yet initialized. Call initializeCloudSupabaseClient() or ensure app renders with AuthContext first.",
          );
          return undefined;
        },
      },
    ) as SupabaseClientSingleton);

// Ensure client initializes on module load in cloud mode.
if (!selfHostedMode && typeof window !== "undefined") {
  initializeCloudSupabaseClient()
    .then((client) => {
      if (!globalForSupabase.__EGS_SUPABASE_CLIENT__) {
        globalForSupabase.__EGS_SUPABASE_CLIENT__ = client;
      }
    })
    .catch((err) => {
      console.error("[Supabase] Failed to initialize cloud client:", err);
    });
}
