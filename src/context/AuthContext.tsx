/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { isSelfHostedMode } from "../lib/selfHosted";
import {
  apiClient,
  clearStoredLocalAuthToken,
  persistLocalAuthToken,
} from "../api/client";
import type { UserProfile, UserRole, AccessLevel } from "../types";

export const ACCESS_LEVEL_LABELS: Record<AccessLevel, string> = {
  admin: "Administrateur",
  gerant: "Gérant",
  secretaire: "Secrétaire",
  ouvrier: "Ouvrier",
  visiteur: "Visiteur",
  gestionnaire: "Gestionnaire",
  employe: "Employé",
};

const ACCESS_LEVEL_SET = new Set<AccessLevel>(
  Object.keys(ACCESS_LEVEL_LABELS) as AccessLevel[],
);

const ACCESS_LEVEL_MODULES: Record<AccessLevel, string[]> = {
  admin: ["*"],
  gerant: [
    "dashboard",
    "clients",
    "projets",
    "immobilier",
    "foncier",
    "catalogue-lots",
    "fournitures",
    "finances",
    "employes",
    "fournisseurs",
    "documents",
    "taches",
    "statistiques",
    "parametres",
    "media",
    "registre",
  ],
  secretaire: [
    "dashboard",
    "clients",
    "documents",
    "fournisseurs",
    "fournitures",
    "taches",
    "media",
    "registre",
    "immobilier",
    "foncier",
    "catalogue-lots",
  ],
  ouvrier: ["dashboard", "projets", "taches", "documents", "media", "registre"],
  visiteur: ["dashboard", "registre"],
  gestionnaire: [
    "dashboard",
    "clients",
    "projets",
    "immobilier",
    "foncier",
    "catalogue-lots",
    "fournitures",
    "finances",
    "employes",
    "fournisseurs",
    "documents",
    "taches",
    "statistiques",
    "parametres",
    "media",
    "registre",
  ],
  employe: ["dashboard", "projets", "taches", "documents", "media", "registre"],
};

// UserProfile is now imported from ../types

interface AuthContextType {
  user: UserProfile | null;
  session: null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null; code: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  changePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<{ error: string | null; code: string | null }>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  signIn: async () => ({ error: null, code: null }),
  signOut: async () => {},
  refreshProfile: async () => {},
  resetPassword: async () => ({ error: null }),
  changePassword: async () => ({ error: null, code: null }),
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const IDLE_TIMEOUT_MINUTES = Number(
    import.meta.env.VITE_IDLE_TIMEOUT_MINUTES ?? 0,
  );
  const IDLE_TIMEOUT_MS = Number.isFinite(IDLE_TIMEOUT_MINUTES)
    ? IDLE_TIMEOUT_MINUTES * 60 * 1000
    : 0;
  const LAST_ACTIVITY_KEY = "egs:last_activity_at";

  const getAccessTokenExpiryMs = (): number | null => {
    if (typeof window === "undefined") return null;
    const token = window.localStorage.getItem("egs:local_auth_token");
    if (!token) return null;
    try {
      const [, payload] = token.split(".");
      const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
      const padded = normalized.padEnd(
        normalized.length + ((4 - (normalized.length % 4)) % 4),
        "=",
      );
      const parsed = JSON.parse(window.atob(padded));
      return typeof parsed.exp === "number" ? parsed.exp * 1000 : null;
    } catch {
      return null;
    }
  };

  const refreshLocalSession = useCallback(async () => {
    if (typeof window === "undefined") return false;

    const refreshToken = window.localStorage.getItem("egs:local_refresh_token");
    if (!refreshToken) return false;

    try {
      const result = await apiClient.auth.refresh(refreshToken);
      if (result.error || !result.data?.access_token) {
        clearStoredLocalAuthToken();
        return false;
      }

      persistLocalAuthToken(
        result.data.access_token,
        result.data.refresh_token,
      );
      return true;
    } catch {
      clearStoredLocalAuthToken();
      return false;
    }
  }, []);

  const mapLocalUser = (payload: Record<string, any>): UserProfile => ({
    id: payload.id,
    email: payload.email,
    full_name: payload.full_name ?? payload.email,
    role: payload.role ?? "employe",
    access_level: payload.access_level ?? "employe",
    poste: payload.poste ?? null,
    department: payload.department ?? null,
    phone: payload.phone ?? null,
    avatar_url: payload.avatar_url ?? null,
  });

  const fetchProfile = async (_userId: string) => {
    if (isSelfHostedMode()) {
      const token = window.localStorage.getItem("egs:local_auth_token");
      if (!token) {
        setProfile(null);
        return;
      }

      const result = await apiClient.auth.me();
      if (!result.error && result.data?.user) {
        setProfile(result.data.user as UserProfile);
      } else {
        setProfile(null);
      }
      return;
    }

    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        if (isSelfHostedMode()) {
          const token = window.localStorage.getItem("egs:local_auth_token");
          if (!token) {
            if (!cancelled) setLoading(false);
            return;
          }

          let result = await apiClient.auth.me();

          if (result.status === 401) {
            const refreshed = await refreshLocalSession();
            if (refreshed) {
              result = await apiClient.auth.me();
            }
          }

          if (result.error || !result.data?.user) {
            clearStoredLocalAuthToken();
            if (!cancelled) setLoading(false);
            return;
          }

          const payload = result.data;
          if (cancelled) return;
          setSession(null);
          setUser(mapLocalUser(payload.user as Record<string, any>));
          setProfile(payload.user as UserProfile);
          return;
        }

        if (!cancelled) setLoading(false);
        return;
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void init();

    return () => {
      cancelled = true;
    };
  }, [refreshLocalSession]);

  const signIn = useCallback(
    async (
      email: string,
      password: string,
    ): Promise<{ error: string | null; code: string | null }> => {
      if (isSelfHostedMode()) {
        const result = await apiClient.auth.login(email, password);
        if (result.error || !result.data?.access_token) {
          return {
            code: result.data?.code ?? null,
            error: result.error || "Identifiants invalides",
          };
        }

        const access_token = result.data!.access_token!;
        const refresh_token = result.data!.refresh_token!;
        const user = result.data!.user;
        persistLocalAuthToken(access_token, refresh_token);
        setUser(mapLocalUser(user as Record<string, any>));
        setSession(null);
        setProfile(user as UserProfile);
        return { error: null, code: null };
      }

      return {
        error: "Le mode self-hosted est requis pour l’API locale.",
        code: null,
      };
    },
    [],
  );

  const signOut = useCallback(async () => {
    if (isSelfHostedMode()) {
      await apiClient.auth.logout().catch(() => undefined);
      clearStoredLocalAuthToken();
    }

    setUser(null);
    setSession(null);
    setProfile(null);

    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", "/");
      window.location.assign("/");
    }
  }, []);

  const resetPassword = useCallback(
    async (_email: string): Promise<{ error: string | null }> => {
      if (isSelfHostedMode()) {
        return {
          error: "La réinitialisation locale n'est pas encore implémentée.",
        };
      }

      return {
        error: "La réinitialisation locale n'est pas encore implémentée.",
      };
    },
    [],
  );

  const changePassword = useCallback(
    async (
      currentPassword: string,
      newPassword: string,
    ): Promise<{ error: string | null; code: string | null }> => {
      if (!isSelfHostedMode()) {
        return {
          error: "Le mode self-hosted est requis pour l’API locale.",
          code: null,
        };
      }

      const result = await apiClient.auth.updatePassword(
        currentPassword,
        newPassword,
      );

      if (result.error || !result.data) {
        return {
          code: result.status === 401 ? "invalid_current_password" : null,
          error:
            result.status === 401
              ? "Le mot de passe actuel est incorrect."
              : result.error || "Impossible de modifier le mot de passe.",
        };
      }

      return { error: null, code: null };
    },
    [],
  );

  useEffect(() => {
    if (!user || !isSelfHostedMode()) return;
    if (typeof window === "undefined") return;

    const refreshIfNeeded = async () => {
      const expiryMs = getAccessTokenExpiryMs();
      if (!expiryMs) return;
      if (expiryMs - Date.now() > 10 * 60 * 1000) return;

      const refreshed = await refreshLocalSession();
      if (!refreshed) {
        setUser(null);
        setSession(null);
        setProfile(null);
      }
    };

    void refreshIfNeeded();
    const interval = window.setInterval(refreshIfNeeded, 5 * 60 * 1000);

    return () => window.clearInterval(interval);
  }, [user, refreshLocalSession]);

  useEffect(() => {
    if (!user || !IDLE_TIMEOUT_MS || IDLE_TIMEOUT_MS <= 0) return;
    if (typeof window === "undefined") return;

    let lastWrite = 0;
    const THROTTLE_MS = 5_000;
    const updateActivity = () => {
      const now = Date.now();
      if (now - lastWrite < THROTTLE_MS) return;
      lastWrite = now;
      window.localStorage.setItem(LAST_ACTIVITY_KEY, String(now));
    };

    const events: Array<keyof WindowEventMap> = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
    ];
    events.forEach((event) =>
      window.addEventListener(event, updateActivity, { passive: true }),
    );
    updateActivity();

    const interval = window.setInterval(() => {
      const lastActivity = Number(
        window.localStorage.getItem(LAST_ACTIVITY_KEY) || 0,
      );
      if (!lastActivity) return;
      if (Date.now() - lastActivity > IDLE_TIMEOUT_MS) {
        window.localStorage.setItem("egs:logout_reason", "idle");
        void signOut();
      }
    }, 60 * 1000);

    return () => {
      events.forEach((event) =>
        window.removeEventListener(event, updateActivity),
      );
      window.clearInterval(interval);
    };
  }, [user, IDLE_TIMEOUT_MS, signOut]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signIn,
        signOut,
        refreshProfile,
        resetPassword,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function resolveAccessLevel(
  role: UserRole | undefined,
  accessLevel?: string | null,
): AccessLevel {
  if (role === "admin") return "admin";
  if (role === "gestionnaire") return "gestionnaire";
  if (
    typeof accessLevel === "string" &&
    ACCESS_LEVEL_SET.has(accessLevel as AccessLevel)
  ) {
    return accessLevel as AccessLevel;
  }
  return "employe";
}

export function hasAccess(
  role: UserRole | undefined,
  module: string,
  accessLevel?: AccessLevel,
): boolean {
  if (!role && !accessLevel) return false;
  const level = resolveAccessLevel(role, accessLevel);
  const allowed = ACCESS_LEVEL_MODULES[level] || [];
  if (allowed.includes("*")) return true;
  return allowed.includes(module);
}
