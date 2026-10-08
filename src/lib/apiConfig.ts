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
  // This self-hosted API uses JWT bearer auth; no public bundle API key exists.
  return undefined;
};
