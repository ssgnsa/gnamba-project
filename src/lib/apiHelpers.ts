import type { ApiResult } from "../data/result";

const base = import.meta.env.VITE_SELFHOSTED_MODE === "true"
  ? import.meta.env.VITE_LOCAL_API_URL || "http://localhost:8000"
  : import.meta.env.VITE_API_URL || "/api";

async function fetchJson<T>(path: string, init: RequestInit): Promise<ApiResult<T>> {
  const url = `${base}${path}`;
  const resp = await fetch(url, init);
  const text = await resp.text();
  const payload: unknown = text ? JSON.parse(text) : null;
  if (!resp.ok) {
    return {
      data: null,
      error: payload?.toString() ?? `HTTP ${resp.status}`,
      status: resp.status,
    };
  }
  return {
    data: payload as T,
    error: null,
    status: resp.status,
  };
}

export const apiGet = <T>(path: string) => fetchJson<T>(path, { method: "GET" });
export const apiPost = <T, U>(path: string, body?: U) =>
  fetchJson<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
export const apiPatch = <T, U>(path: string, body?: U) =>
  fetchJson<T>(path, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
export const apiDelete = <T>(path: string) =>
  fetchJson<T>(path, { method: "DELETE" });

export const apiHelper = {
  get: apiGet,
  post: apiPost,
  patch: apiPatch,
  delete: apiDelete,
};
export function getLocalApiBaseUrl(): string {
  return base;
}
