import type { User } from "@supabase/supabase-js";
import type { UserProfile } from "../types";

const DEMO_EMAIL = "demo@gnambaservices.ci";

export function isDemoModeEnabled(): boolean {
  const value = String(import.meta.env.VITE_DEMO_MODE || "")
    .toLowerCase()
    .trim();
  return (
    value === "1" || value === "true" || value === "demo" || value === "yes"
  );
}

export function isDemoUser(
  user?: User | null,
  profile?: UserProfile | null,
): boolean {
  const email = (profile?.email || user?.email || "").toLowerCase().trim();
  return email === DEMO_EMAIL;
}

export function shouldBlockDestructiveAction(
  user?: User | null,
  profile?: UserProfile | null,
): boolean {
  return isDemoModeEnabled() || isDemoUser(user, profile);
}

export function getDemoBlockMessage(): string {
  return "Action désactivée dans l’environnement de démonstration pour préserver les données.";
}
