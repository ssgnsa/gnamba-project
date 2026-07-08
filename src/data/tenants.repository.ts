/**
 * DATA LAYER — Tenants Repository
 * Source unique pour toutes les requêtes liées aux locataires.
 * Reads from the unified `parties` model with role='locataire'.
 */

import { dbClient, withRetry } from "./dbClient";
import { Tenant } from "../types";

type TenantInsert = Omit<Tenant, "id" | "created_at" | "updated_at">;
type TenantUpdate = Partial<TenantInsert>;

export interface TenantRecord extends Tenant {
  source_table?: string;
  source_id?: string;
}

/**
 * Normalize a parties row to Tenant shape expected by UI
 */
export function normalizeTenantRow(row: Record<string, any>): TenantRecord {
  return {
    id: row.id,
    nom: row.nom ?? "",
    prenom: row.prenom ?? "",
    telephone: row.telephone ?? "",
    email: row.email ?? "",
    property_id: row.property_id ?? null,
    date_debut_contrat: row.date_debut_contrat ?? null,
    date_fin_contrat: row.date_fin_contrat ?? null,
    loyer: row.loyer ?? 0,
    depot_garantie: row.depot_garantie ?? 0,
    statut: row.statut ?? "inactif",
    created_at: row.created_at ?? new Date().toISOString(),
    updated_at: row.updated_at ?? new Date().toISOString(),
    source_table: row.source_table,
    source_id: row.source_id,
    ...row,
  };
}

export interface TenantFilters {
  statut?: string;
  property_id?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const tenantsRepository = {
  async getAll(filters: TenantFilters = {}) {
    return withRetry(async () => {
      let query = dbClient
        .from("parties")
        .select("*, party_roles(*)", { count: "exact" })
        .eq("party_roles.role", "locataire")
        .order("created_at", { ascending: false });

      if (filters.statut) {
        query = query.eq("party_roles.status", filters.statut);
      }

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
          items: (result.data || []).map(normalizeTenantRow),
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
        .eq("party_roles.role", "locataire")
        .single();

      return {
        data: result.data ? normalizeTenantRow(result.data) : null,
        error: result.error,
      };
    });
  },

  async create(payload: TenantInsert) {
    return withRetry(async () => {
      const now = new Date().toISOString();

      // Insert into parties
      const partyResult = await dbClient
        .from("parties")
        .insert({
          party_type: "personne_physique",
          nom: payload.nom,
          prenom: payload.prenom,
          email: payload.email,
          telephone: payload.telephone,
          created_at: now,
          updated_at: now,
          source_table: "locataires",
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
        role: "locataire",
        status: payload.statut ?? "inactif",
        started_at: now,
        metadata: {
          property_id: payload.property_id,
          date_debut_contrat: payload.date_debut_contrat,
          date_fin_contrat: payload.date_fin_contrat,
          loyer: payload.loyer,
          depot_garantie: payload.depot_garantie,
        },
      });

      if (roleResult.error) {
        return { data: null, error: roleResult.error };
      }

      return {
        data: normalizeTenantRow({
          ...partyResult.data,
          property_id: payload.property_id,
          date_debut_contrat: payload.date_debut_contrat,
          date_fin_contrat: payload.date_fin_contrat,
          loyer: payload.loyer,
          depot_garantie: payload.depot_garantie,
          statut: payload.statut ?? "inactif",
        }),
        error: null,
      };
    });
  },

  async update(id: string, payload: TenantUpdate) {
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
          error: new Error("Tenant not found"),
        };
      }

      // Update metadata in party_roles
      if (
        payload.property_id ||
        payload.date_debut_contrat ||
        payload.date_fin_contrat ||
        payload.loyer ||
        payload.depot_garantie ||
        payload.statut
      ) {
        const roleResult = await dbClient
          .from("party_roles")
          .select("metadata")
          .eq("party_id", id)
          .eq("role", "locataire")
          .single();

        const metadata = roleResult.data?.metadata || {};
        if (payload.property_id) metadata.property_id = payload.property_id;
        if (payload.date_debut_contrat)
          metadata.date_debut_contrat = payload.date_debut_contrat;
        if (payload.date_fin_contrat)
          metadata.date_fin_contrat = payload.date_fin_contrat;
        if (payload.loyer) metadata.loyer = payload.loyer;
        if (payload.depot_garantie)
          metadata.depot_garantie = payload.depot_garantie;

        await dbClient
          .from("party_roles")
          .update({ metadata, status: payload.statut })
          .eq("party_id", id)
          .eq("role", "locataire");
      }

      return {
        data: normalizeTenantRow({
          ...updateResult.data,
          property_id: payload.property_id,
          date_debut_contrat: payload.date_debut_contrat,
          date_fin_contrat: payload.date_fin_contrat,
          loyer: payload.loyer,
          depot_garantie: payload.depot_garantie,
          statut: payload.statut,
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
