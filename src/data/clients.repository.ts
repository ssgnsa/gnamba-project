/**
 * DATA LAYER — Clients Repository
 * Source unique pour toutes les requêtes liées aux clients.
 * Reads from the unified `parties` model with role='client'.
 */

import { dbClient, withRetry } from "./dbClient";
import { Client } from "../types";

type ClientInsert = Omit<Client, "id" | "created_at" | "updated_at">;
type ClientUpdate = Partial<ClientInsert>;

export interface ClientRecord extends Client {
  source_table?: string;
  source_id?: string;
}

/**
 * Normalize a parties row to Client shape expected by UI
 */
export function normalizeClientRow(row: Record<string, any>): ClientRecord {
  return {
    id: row.id,
    nom: row.nom ?? "",
    prenom: row.prenom ?? "",
    telephone: row.telephone ?? "",
    email: row.email ?? "",
    adresse: row.adresse ?? "",
    type_client: row.type_client ?? "particulier",
    notes: row.notes ?? "",
    created_at: row.created_at ?? new Date().toISOString(),
    updated_at: row.updated_at ?? new Date().toISOString(),
    source_table: row.source_table,
    source_id: row.source_id,
    ...row,
  };
}

export interface ClientFilters {
  type?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const clientsRepository = {
  async getAll(filters: ClientFilters = {}) {
    return withRetry(async () => {
      let query = dbClient
        .from("parties")
        .select("*, party_roles(*)", { count: "exact" })
        .eq("party_roles.role", "client")
        .order("created_at", { ascending: false });

      if (filters.search) {
        const search = `%${filters.search}%`;
        query = query.or(
          `nom.ilike.${search},prenom.ilike.${search},email.ilike.${search},telephone.ilike.${search}`,
        );
      }

      const limit = filters.limit || 50;
      const page = filters.page || 0;
      const offset = page * limit;
      query = query.range(offset, offset + limit - 1);

      const result = await query;
      return {
        data: {
          items: (result.data || []).map(normalizeClientRow),
          total: result.count || 0,
          page,
          limit,
        },
        error: result.error,
      };
    });
  },

  async getById(id: string) {
    return withRetry(async () => {
      const result = await dbClient
        .from("parties")
        .select("*, party_roles(*)")
        .eq("id", id)
        .eq("party_roles.role", "client")
        .single();

      return {
        data: result.data ? normalizeClientRow(result.data) : null,
        error: result.error,
      };
    });
  },

  async create(payload: ClientInsert) {
    return withRetry(async () => {
      const now = new Date().toISOString();

      // Insert into parties
      const partyResult = await dbClient
        .from("parties")
        .insert({
          party_type:
            payload.type_client === "particulier"
              ? "personne_physique"
              : "entreprise",
          nom: payload.nom,
          prenom: payload.prenom,
          email: payload.email,
          telephone: payload.telephone,
          adresse: payload.adresse,
          created_at: now,
          updated_at: now,
          source_table: "clients",
          source_id: null,
        })
        .select()
        .single();

      if (partyResult.error) {
        return { data: null, error: partyResult.error };
      }

      if (!partyResult.data) {
        return {
          data: null,
          error: new Error("Failed to create party"),
        };
      }

      // Insert role
      const roleResult = await dbClient.from("party_roles").insert({
        party_id: partyResult.data.id,
        role: "client",
        status: "actif",
        started_at: now,
        metadata: {
          type_client: payload.type_client,
          notes: payload.notes,
        },
      });

      if (roleResult.error) {
        return { data: null, error: roleResult.error };
      }

      return {
        data: normalizeClientRow({
          ...partyResult.data,
          type_client: payload.type_client,
          notes: payload.notes,
        }),
        error: null,
      };
    });
  },

  async update(id: string, payload: ClientUpdate) {
    return withRetry(async () => {
      const now = new Date().toISOString();

      // Update parties table
      const updateResult = await dbClient
        .from("parties")
        .update({
          nom: payload.nom,
          prenom: payload.prenom,
          email: payload.email,
          telephone: payload.telephone,
          adresse: payload.adresse,
          updated_at: now,
        })
        .eq("id", id)
        .select()
        .single();

      if (updateResult.error) {
        return { data: null, error: updateResult.error };
      }

      if (!updateResult.data) {
        return {
          data: null,
          error: new Error("Client not found"),
        };
      }

      // Update metadata in party_roles if type_client or notes changed
      if (payload.type_client || payload.notes) {
        const roleResult = await dbClient
          .from("party_roles")
          .select("metadata")
          .eq("party_id", id)
          .eq("role", "client")
          .single();

        const metadata = roleResult.data?.metadata || {};
        if (payload.type_client) metadata.type_client = payload.type_client;
        if (payload.notes) metadata.notes = payload.notes;

        await dbClient
          .from("party_roles")
          .update({ metadata })
          .eq("party_id", id)
          .eq("role", "client");
      }

      return {
        data: normalizeClientRow({
          ...updateResult.data,
          type_client: payload.type_client,
          notes: payload.notes,
        }),
        error: null,
      };
    });
  },

  async delete(id: string) {
    return withRetry(async () => {
      const result = await dbClient.from("parties").delete().eq("id", id);

      return {
        data: null,
        error: result.error,
      };
    });
  },
};
