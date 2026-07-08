import { getLocalApiBaseUrl, isSelfHostedMode } from "../lib/selfHosted";
import type { BrandAssetType, MediaFile, UserProfile } from "../types";

const LOCAL_AUTH_TOKEN_KEY = "egs:local_auth_token";
const LOCAL_REFRESH_TOKEN_KEY = "egs:local_refresh_token";

export interface ApiAuthResponse {
  access_token?: string;
  refresh_token?: string;
  user?: UserProfile;
  message?: string;
}

export interface ApiResult<T> {
  data: T | null;
  error: string | null;
  status: number;
}

export interface ReleaseInfo {
  application?: string;
  git_commit?: string;
  branch?: string;
  build_date?: string;
  build_hash?: string;
  environment?: string;
}

export const getStoredLocalAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(LOCAL_AUTH_TOKEN_KEY);
};

const getStoredLocalRefreshToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(LOCAL_REFRESH_TOKEN_KEY);
};

export const persistLocalAuthToken = (
  accessToken: string,
  refreshToken?: string,
): void => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_AUTH_TOKEN_KEY, accessToken);
  if (refreshToken) {
    window.localStorage.setItem(LOCAL_REFRESH_TOKEN_KEY, refreshToken);
  }
};

export const clearStoredLocalAuthToken = (): void => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(LOCAL_AUTH_TOKEN_KEY);
  window.localStorage.removeItem(LOCAL_REFRESH_TOKEN_KEY);
};

const getAuthHeaders = (initHeaders?: HeadersInit): Headers => {
  const headers = new Headers(initHeaders);
  const token = getStoredLocalAuthToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return headers;
};

const parseApiResponse = async <T>(
  response: Response,
): Promise<ApiResult<T>> => {
  const text = await response.text();
  let payload: unknown = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text || null;
  }

  if (!response.ok) {
    const detail = (() => {
      if (payload && typeof payload === "object" && "detail" in payload) {
        return String((payload as { detail?: unknown }).detail ?? "");
      }
      if (typeof payload === "string") return payload;
      return "";
    })();
    return {
      data: null,
      error: detail || `Erreur HTTP ${response.status}`,
      status: response.status,
    };
  }

  return {
    data: (payload as T) ?? null,
    error: null,
    status: response.status,
  };
};

const refreshStoredLocalSession = async (): Promise<boolean> => {
  const refreshToken = getStoredLocalRefreshToken();
  if (!refreshToken) return false;

  try {
    const response = await fetch(
      `${getLocalApiBaseUrl()}/api/v1/auth/refresh`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      },
    );
    const result = await parseApiResponse<ApiAuthResponse>(response);
    if (result.error || !result.data?.access_token) {
      clearStoredLocalAuthToken();
      return false;
    }

    persistLocalAuthToken(result.data.access_token, result.data.refresh_token);
    return true;
  } catch {
    clearStoredLocalAuthToken();
    return false;
  }
};

const shouldRetryWithRefresh = (path: string, status: number): boolean =>
  status === 401 &&
  !path.startsWith("/api/v1/auth/login") &&
  !path.startsWith("/api/v1/auth/refresh") &&
  Boolean(getStoredLocalRefreshToken());

export const apiClient = {
  async request<T>(
    path: string,
    init: RequestInit = {},
  ): Promise<ApiResult<T>> {
    if (!isSelfHostedMode()) {
      return {
        data: null,
        error: "Le mode self-hosted est requis pour l'API unifiée.",
        status: 404,
      };
    }

    const buildHeaders = () => {
      const headers = getAuthHeaders(init.headers);
      if (
        !headers.has("Content-Type") &&
        init.body &&
        !(init.body instanceof FormData)
      ) {
        headers.set("Content-Type", "application/json");
      }
      return headers;
    };

    const send = () =>
      fetch(`${getLocalApiBaseUrl()}${path}`, {
        ...init,
        headers: buildHeaders(),
      });

    let result = await parseApiResponse<T>(await send());
    if (shouldRetryWithRefresh(path, result.status)) {
      const refreshed = await refreshStoredLocalSession();
      if (refreshed) {
        result = await parseApiResponse<T>(await send());
      }
    }
    return result;
  },

  version: {
    async get() {
      return apiClient.request<ReleaseInfo>("/api/v1/version");
    },
  },

  auth: {
    async login(
      email: string,
      password: string,
    ): Promise<ApiAuthResponse & { error?: string; code?: string }> {
      const result = await apiClient.request<ApiAuthResponse>(
        "/api/v1/auth/login",
        {
          method: "POST",
          body: JSON.stringify({ email, password }),
        },
      );
      if (result.error) {
        return {
          error: result.error,
          code: result.status === 401 ? "invalid_credentials" : undefined,
        };
      }
      return {
        ...(result.data ?? {}),
      };
    },

    async me() {
      return apiClient.request<Record<string, unknown>>("/api/v1/auth/me");
    },

    async refresh(refreshToken: string) {
      return apiClient.request<ApiAuthResponse>("/api/v1/auth/refresh", {
        method: "POST",
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
    },

    async logout() {
      return apiClient.request<{ status: string; message: string }>(
        "/api/v1/auth/logout",
        {
          method: "POST",
        },
      );
    },
  },

  foncier: {
    async signAttestation(
      attestationId: string,
      payload: Record<string, unknown>,
    ) {
      return apiClient.request<{ signature: string; algorithm: string }>(
        "/api/v1/foncier/attestations/sign",
        {
          method: "POST",
          body: JSON.stringify({
            attestation_id: attestationId,
            payload: JSON.stringify(payload),
          }),
        },
      );
    },
  },

  users: {
    async getAll() {
      return apiClient.request<UserProfile[]>("/api/v1/users");
    },

    async create(payload: Record<string, unknown>) {
      return apiClient.request<ApiAuthResponse>("/api/v1/users", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },

    async update(id: string, payload: Record<string, unknown>) {
      return apiClient.request<UserProfile>(`/api/v1/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    },

    async delete(id: string) {
      return apiClient.request<{ status: string; message: string }>(
        `/api/v1/users/${id}`,
        {
          method: "DELETE",
        },
      );
    },
  },

  settings: {
    async getAll() {
      return apiClient.request<Array<{ key: string; value: string }>>(
        "/api/v1/settings",
      );
    },

    async upsert(items: Array<{ key: string; value: string }>) {
      return apiClient.request<{ status: string; message: string }>(
        "/api/v1/settings",
        {
          method: "POST",
          body: JSON.stringify({ items }),
        },
      );
    },
  },

  siteContent: {
    async getAll() {
      return apiClient.request<
        Array<{ section: string; key: string; value: string }>
      >("/api/v1/site-content");
    },
  },

  media: {
    async getAll(includeDeleted = false) {
      const suffix = includeDeleted ? "?include_deleted=true" : "";
      return apiClient.request<MediaFile[]>(`/api/v1/media${suffix}`);
    },

    async get(id: string) {
      return apiClient.request<MediaFile>(`/api/v1/media/${id}`);
    },

    async upload(
      file: File,
      payload?: {
        category?: string;
        alt_text?: string;
        description?: string;
        tags?: string[];
      },
    ) {
      const formData = new FormData();
      formData.append("file", file);
      if (payload?.category) formData.append("category", payload.category);
      if (payload?.alt_text) formData.append("alt_text", payload.alt_text);
      if (payload?.description)
        formData.append("description", payload.description);
      if (payload?.tags?.length)
        formData.append("tags", payload.tags.join(","));
      return apiClient.request<MediaFile>("/api/v1/media", {
        method: "POST",
        body: formData,
      });
    },

    async update(id: string, payload: Record<string, unknown>) {
      return apiClient.request<MediaFile>(`/api/v1/media/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    },

    async delete(id: string) {
      return apiClient.request<{
        status: string;
        deleted_at: string | null;
        media_id: string;
      }>(`/api/v1/media/${id}`, { method: "DELETE" });
    },

    async restore(id: string) {
      return apiClient.request<MediaFile>(`/api/v1/media/${id}/restore`, {
        method: "POST",
      });
    },

    async purge(id: string) {
      return apiClient.request<{ status: string; media_id: string }>(
        `/api/v1/media/${id}/purge`,
        {
          method: "DELETE",
        },
      );
    },

    async replace(id: string, file: File) {
      const formData = new FormData();
      formData.append("file", file);
      return apiClient.request<MediaFile>(`/api/v1/media/${id}/replace`, {
        method: "POST",
        body: formData,
      });
    },

    async getBrandAssets() {
      return apiClient.request<
        Array<{ brand_asset_type: BrandAssetType; url: string }>
      >("/api/v1/media/brand-assets");
    },
  },

  async verifyTurnstile(token: string): Promise<boolean> {
    return Boolean(token);
  },
};

export default apiClient;
