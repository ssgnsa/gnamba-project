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

  useEffect(() => {
    let cancelled = false;
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setLoading(false);
          return;
        }
        const session = data?.session ?? null;
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id).finally(() => {
            if (!cancelled) setLoading(false);
          });
        } else {
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        (async () => {
          await fetchProfile(session.user.id);
        })();
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
      if (error) return { error: error.message };
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

    const updateActivity = () => {
      window.localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
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
