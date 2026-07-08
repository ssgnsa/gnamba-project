/**
 * DATA LAYER — Users Repository
 * Source unique pour user_profiles.
 */

import { dbClient, withRetry } from "./dbClient";

export interface UserProfileUpdate {
  full_name?: string;
  role?: string;
  access_level?: string;
  telephone?: string;
  avatar_url?: string;
}

export const usersRepository = {
  async getById(id: string) {
    return withRetry(() =>
      dbClient.from("user_profiles").select("*").eq("id", id).maybeSingle(),
    );
  },

  async getAll() {
    return withRetry(() =>
      dbClient
        .from("user_profiles")
        .select("*")
        .order("full_name", { ascending: true }),
    );
  },

  async update(id: string, payload: UserProfileUpdate) {
    return withRetry(() =>
      dbClient
        .from("user_profiles")
        .update(payload)
        .eq("id", id)
        .select()
        .single(),
    );
  },

  async getByRole(role: string) {
    return withRetry(() =>
      dbClient
        .from("user_profiles")
        .select("id, full_name, role, access_level")
        .eq("role", role)
        .order("full_name"),
    );
  },

  async getAgents() {
    return withRetry(() =>
      dbClient
        .from("user_profiles")
        .select("id, full_name, role, access_level")
        .in("role", ["admin", "gestionnaire", "gerant"])
        .order("full_name"),
    );
  },
};
