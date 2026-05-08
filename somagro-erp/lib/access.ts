import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import type { UserRole } from "@/types";

export type ModuleAccess =
  | "dashboard"
  | "analytics"
  | "livestock"
  | "crops"
  | "constructions"
  | "inventory"
  | "inventory-movements"
  | "sales"
  | "finance"
  | "tasks"
  | "vitrine"
  | "settings";

const ALL_MODULES: ModuleAccess[] = [
  "dashboard",
  "analytics",
  "livestock",
  "crops",
  "constructions",
  "inventory",
  "inventory-movements",
  "sales",
  "finance",
  "tasks",
  "vitrine",
  "settings",
];

export const ACCESS_BY_ROLE: Record<UserRole, ModuleAccess[]> = {
  admin: ALL_MODULES,
  manager: [
    "dashboard",
    "analytics",
    "livestock",
    "crops",
    "constructions",
    "inventory",
    "inventory-movements",
    "sales",
    "finance",
    "tasks",
    "vitrine",
  ],
  accountant: [
    "dashboard",
    "inventory",
    "inventory-movements",
    "sales",
    "finance",
    "tasks",
  ],
  technician: [
    "dashboard",
    "constructions",
    "inventory",
    "inventory-movements",
    "tasks",
  ],
  veterinarian: ["dashboard", "livestock", "analytics", "tasks"],
  worker: [
    "dashboard",
    "livestock",
    "crops",
    "inventory",
    "inventory-movements",
    "tasks",
  ],
  visitor: [],
};

type AccessProfile = {
  role: UserRole;
  is_active: boolean;
  tenant_id: string | null;
};

export async function getAccessProfile() {
  const supabase = createServerSupabase();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("role, is_active, tenant_id")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (!profile) return null;

  return {
    role: (profile.role as UserRole) ?? "visitor",
    is_active: profile.is_active ?? false,
    tenant_id: profile.tenant_id ?? null,
  } as AccessProfile;
}

export async function requireAccess(module: ModuleAccess) {
  const supabase = createServerSupabase();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role, is_active")
    .eq("id", authData.user.id)
    .maybeSingle();

  const role = (profile?.role as UserRole) ?? "visitor";
  const isActive = profile?.is_active ?? false;

  if (!profile || !isActive || role === "visitor") {
    redirect("/");
  }

  const allowed = ACCESS_BY_ROLE[role] ?? [];
  if (!allowed.includes(module)) {
    redirect("/dashboard");
  }

  return { role };
}
