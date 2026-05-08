import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
import { resolveSupabaseConfig } from "./config";

export function createServerSupabase() {
  const cookieStore = cookies();
  const host = headers().get("host") ?? "";
  const { url, anonKey } = resolveSupabaseConfig(host);

  return createServerClient(url, anonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: Record<string, unknown>) {
        cookieStore.set({ name, value, ...options });
      },
      remove(name: string, options: Record<string, unknown>) {
        cookieStore.set({ name, value: "", ...options, maxAge: 0 });
      },
    },
  });
}
