/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
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

const ACCESS_LEVEL_MODULES: Record<AccessLevel, string[]> = {
  admin: ["*"],
  gerant: [
    "dashboard",
    "clients",
    "projets",
    "immobilier",
    "foncier",
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
  ],
  ouvrier: ["dashboard", "projets", "taches", "documents", "media", "registre"],
  visiteur: ["dashboard", "registre"],
  gestionnaire: [
    "dashboard",
    "clients",
    "projets",
    "immobilier",
    "foncier",
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
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  signIn: async () => ({ error: null }),
  signOut: async () => {},
  refreshProfile: async () => {},
  resetPassword: async () => ({ error: null }),
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const IDLE_TIMEOUT_MINUTES = Number(
    import.meta.env.VITE_IDLE_TIMEOUT_MINUTES ?? 30,
  );
  const IDLE_TIMEOUT_MS = Number.isFinite(IDLE_TIMEOUT_MINUTES)
    ? IDLE_TIMEOUT_MINUTES * 60 * 1000
    : 0;
  const LAST_ACTIVITY_KEY = "egs:last_activity_at";

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (data) setProfile(data as UserProfile);
    else setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  const purgeCorruptedSession = () => {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && (k.startsWith('sb-') || k.includes('supabase') || k === 'egs-supabase-auth')) keysToRemove.push(k);
      }
      keysToRemove.forEach(k => {
        window.localStorage.removeItem(k);
        window.sessionStorage.removeItem(k);
      });
    } catch { /* SSR */ }
  };

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        // getSession() est local (lit le storage) — pas de requête réseau
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
          // Pas de session en storage → pas de token, pas de call réseau
          if (!cancelled) setLoading(false);
          return;
        }

        // Session présente → valider côté serveur via getUser()
        const { data: { user: serverUser }, error: userError } = await supabase.auth.getUser();

        if (userError) {
          // Token invalide ou expiré → purger le storage corrompu
          purgeCorruptedSession();
          await supabase.auth.signOut({ scope: 'local' });
          if (!cancelled) setLoading(false);
          return;
        }

        if (cancelled) return;
        setSession(session);
        setUser(serverUser ?? null);
        if (serverUser) {
          await fetchProfile(serverUser.id);
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !session)) {
        purgeCorruptedSession();
      }
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        void fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(
    async (
      email: string,
      password: string,
    ): Promise<{ error: string | null }> => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        if (error.code === "email_not_confirmed") {
          return {
            error:
              "EMAIL_NOT_CONFIRMED: Ce compte existe mais n'est pas encore confirmé.",
          };
        }
        return { error: error.message };
      }
      return { error: null };
    },
    [],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  }, []);

  const resetPassword = useCallback(
    async (email: string): Promise<{ error: string | null }> => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) return { error: error.message };
      return { error: null };
    },
    [],
  );

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
  accessLevel?: AccessLevel,
): AccessLevel {
  if (accessLevel) return accessLevel;
  if (role === "admin") return "admin";
  if (role === "gestionnaire") return "gestionnaire";
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
