export type SupabaseMode = "cloud" | "local" | "hybrid";

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  mode: "cloud" | "local";
}

function stripPort(host: string) {
  if (host.startsWith("[")) {
    const end = host.indexOf("]");
    if (end !== -1) {
      return host.slice(1, end);
    }
  }
  return host.split(":")[0];
}

function isPrivateIpv4(host: string) {
  if (host.startsWith("127.")) return true;
  if (host.startsWith("10.")) return true;
  if (host.startsWith("192.168.")) return true;
  if (host.startsWith("172.")) {
    const parts = host.split(".");
    const second = Number(parts[1] ?? 0);
    return second >= 16 && second <= 31;
  }
  return false;
}

function isLocalHost(host?: string) {
  if (!host) return false;
  const cleaned = stripPort(host).toLowerCase();
  if (cleaned === "localhost" || cleaned === "::1") return true;
  if (cleaned.endsWith(".local")) return true;
  return isPrivateIpv4(cleaned);
}

export function resolveSupabaseConfig(host?: string): SupabaseConfig {
  const mode = (process.env.SOMAGRO_SUPABASE_MODE ||
    process.env.NEXT_PUBLIC_SUPABASE_MODE ||
    "cloud") as SupabaseMode;

  const cloud = {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  };

  const local = {
    url: process.env.NEXT_PUBLIC_SUPABASE_LOCAL_URL ?? "",
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_LOCAL_ANON_KEY ?? "",
  };

  const preferLocal =
    mode === "local" || (mode === "hybrid" && isLocalHost(host));
  const primary = preferLocal ? local : cloud;
  const secondary = preferLocal ? cloud : local;
  const primaryMode: "local" | "cloud" = preferLocal ? "local" : "cloud";
  const secondaryMode: "local" | "cloud" = preferLocal ? "cloud" : "local";
  const selected: SupabaseConfig =
    primary.url && primary.anonKey
      ? { ...primary, mode: primaryMode }
      : { ...secondary, mode: secondaryMode };

  if (!selected.url || !selected.anonKey) {
    throw new Error("Missing Supabase configuration for SomAgro.");
  }

  return selected;
}
