import { createBrowserClient } from "@supabase/ssr";

type BrowserSupabaseConfig = {
  url?: string;
  anonKey?: string;
  mode?: string;
};

const browserConfig: BrowserSupabaseConfig | undefined =
  typeof window !== "undefined"
    ? (window as { __SOMAGRO_SUPABASE__?: BrowserSupabaseConfig })
        .__SOMAGRO_SUPABASE__
    : undefined;

const supabaseUrl =
  browserConfig?.url ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey =
  browserConfig?.anonKey ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables.");
}

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
