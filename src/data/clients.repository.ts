/**
 * DATA LAYER — Clients Repository
 * Contract source of truth: the live `/api/v1/clients` entity API.
 */

import { apiClient } from "../api/client";
import { Client } from "../types/index.ts";

type ClientInsert = Omit<Client, "id" | "created_at" | "updated_at">;
type ClientUpdate = Partial<ClientInsert>;

export interface ClientRecord extends Client {
  source_table?: string;
  source_id?: string;
}

export function normalizeClientRow(row: Record<string, any>): ClientRecord {
  const notes =
    typeof row.notes === "string"
      ? row.notes
      : row.entity_metadata && typeof row.entity_metadata === "object"
        ? String(row.entity_metadata.notes ?? "")
        : "";

  const telephone =
    typeof row.telephone === "string"
      ? row.telephone
      : typeof row.phone === "string"
        ? row.phone
        : "";

  return {
    id: row.id ?? "",
    nom: row.nom ?? row.last_name ?? "",
    prenom: row.prenom ?? row.first_name ?? "",
    telephone,
    email: row.email ?? "",
    adresse: row.adresse ?? row.address ?? "",
    type_client: row.type_client ?? row.subtype ?? "particulier",
    notes,
    created_at: row.created_at ?? new Date().toISOString(),
    updated_at: row.updated_at ?? new Date().toISOString(),
    source_table: row.source_table ?? undefined,
    source_id: row.source_id ?? undefined,
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
  async getAll(filters: ClientFilters = {}): Promise<{
    data: {
      items: Client[];
      total: number;
      page: number;
      limit: number;
    } | null;
    error: unknown;
  }> {
    const query = new URLSearchParams();
    if (filters.search) query.set("search", filters.search);
    if (filters.type) query.set("type", filters.type);
    const limit = filters.limit ?? 50;
    const page = filters.page ?? 0;
    query.set("limit", String(limit));
    query.set("offset", String(page * limit));

    const result = await apiClient.request<any[]>(`/clients?${query.toString()}`);

    if (result.error || !result.data) {
      return { data: null, error: result.error ?? "Erreur inconnue" };
    }

    const items = Array.isArray(result.data)
      ? result.data.map(normalizeClientRow)
      : [];

    return {
      data: {
        items,
        total: items.length,
        page,
        limit,
      },
      error: null,
    };
  },

  async getById(id: string) {
    const result = await apiClient.clients.get(id);
    if (result.error || !result.data) {
      return { data: null, error: result.error ?? "Client introuvable" };
    }
    return { data: normalizeClientRow(result.data), error: null };
  },

  async create(payload: ClientInsert) {
    const result = await apiClient.clients.create({
      nom: payload.nom,
      prenom: payload.prenom,
      telephone: payload.telephone,
      email: payload.email,
      adresse: payload.adresse,
      type_client: payload.type_client,
      notes: payload.notes,
    });

    if (result.error || !result.data) {
      return { data: null, error: result.error ?? "Impossible de créer le client" };
    }

    return { data: normalizeClientRow(result.data), error: null };
  },

  async update(id: string, payload: ClientUpdate) {
    const result = await apiClient.clients.update(id, {
      nom: payload.nom,
      prenom: payload.prenom,
      telephone: payload.telephone,
      email: payload.email,
      adresse: payload.adresse,
      type_client: payload.type_client,
      notes: payload.notes,
    });

    if (result.error || !result.data) {
      return { data: null, error: result.error ?? "Impossible de mettre à jour le client" };
    }

    return { data: normalizeClientRow(result.data), error: null };
  },

  async delete(id: string) {
    const result = await apiClient.clients.delete(id);
    return {
      data: null,
      error: result.error,
    };
  },
};
