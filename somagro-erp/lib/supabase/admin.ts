import { createClient } from "@supabase/supabase-js";
import { resolveSupabaseConfig } from "./config";

function resolveServiceRoleKey(mode: "cloud" | "local") {
  if (mode === "local") {
    return (
      process.env.SUPABASE_LOCAL_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      ""
    );
  }
  return process.env.SUPABASE_SERVICE_ROLE_KEY || "";
}

export function createAdminSupabase(host?: string) {
  const { url, mode } = resolveSupabaseConfig(host);
  const serviceRoleKey = resolveServiceRoleKey(mode);

  if (!serviceRoleKey) {
    throw new Error("Missing Supabase service role key.");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
