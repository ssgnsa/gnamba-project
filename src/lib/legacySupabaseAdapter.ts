// Lightweight legacy adapter for frontend Supabase usage.
// Acts as an indirection layer so we can migrate implementations later
// without touching all callers. Initially forwards to the existing
// `supabase` client exported from ./supabase.

import { supabase as realSupabase } from "./supabase";
import {
  isSelfHostedMode,
  getLocalStorageBaseUrl,
  getLocalApiBaseUrl,
} from "./selfHosted";
import { apiClient } from "../api/client";

// When not in self-hosted mode, just forward to the real Supabase client.
if (!isSelfHostedMode()) {
  export default realSupabase;
}

// Minimal adapter implementation for self-hosted mode.
// Maps a few commonly used Supabase client patterns to the unified `apiClient`.
const storageFrom = (bucket: string) => ({
  async upload(path: string, file: File, opts?: any) {
    // Use apiClient.media.upload and send category derived from path's prefix
    const category = path.split("/")[0] || undefined;
    return (await apiClient.media.upload(file, {
      category,
    })) as any;
  },

  getPublicUrl(path: string) {
    const base = getLocalStorageBaseUrl();
    const publicUrl = `${base}/${encodeURIComponent(path)}`;
    return { data: { publicUrl }, error: null };
  },

  async remove(paths: string[]) {
    // Best-effort delete using backend storage API.
    try {
      for (const p of paths) {
        // Attempt a DELETE against a conventional storage endpoint.
        await apiClient.request(
          `/api/v1/storage/media/${encodeURIComponent(p)}`,
          {
            method: "DELETE",
          },
        );
      }
      return { data: null, error: null };
    } catch (e) {
      return { data: null, error: (e as Error).message };
    }
  },
});

const adapter = {
  // RPC -> POST /api/v1/rpc/:name
  async rpc(name: string, params?: Record<string, any>) {
    const res = await apiClient.request<any>(
      `/api/v1/rpc/${encodeURIComponent(name)}`,
      {
        method: "POST",
        body: JSON.stringify(params || {}),
      },
    );
    return { data: res.data, error: res.error } as any;
  },

  // functions.invoke -> POST /api/v1/functions/:name
  functions: {
    async invoke(
      name: string,
      opts?: { body?: any; headers?: Record<string, string> },
    ) {
      const method = opts?.body ? "POST" : "GET";
      const res = await apiClient.request<any>(
        `/api/v1/functions/${encodeURIComponent(name)}`,
        {
          method,
          body: opts?.body ? JSON.stringify(opts.body) : undefined,
        },
      );
      return { data: res.data, error: res.error } as any;
    },
  },

  // Minimal storage facade
  storage: {
    from: storageFrom,
  },

  // Auth helpers mapped to apiClient.auth
  auth: {
    async signInWithPassword(creds: { email: string; password: string }) {
      return apiClient.auth.login(creds.email, creds.password);
    },
    async getUser() {
      return apiClient.auth.me();
    },
    async signOut() {
      return apiClient.auth.logout();
    },
  },
};

export default adapter as any;
