import { getLocalApiBaseUrl } from "./selfHosted";

export type ApiMode = "local" | "cloud";

/**
 * Resolve the API base URL using the centralized selfHosted helper.
 * This prevents ad-hoc fallbacks to localhost or private network addresses.
 */
export const resolveApiUrl = (): string | undefined => {
  const url = getLocalApiBaseUrl();
  return url ? url : undefined;
};

export const resolveApiAnonKey = (): string | undefined => {
  // Prefer explicit API key env; fall back to local keys if present (still controlled centrally).
  return (
    import.meta.env.VITE_API_KEY?.trim() ||
    import.meta.env.VITE_LOCAL_API_KEY?.trim() ||
    undefined
  );
};
