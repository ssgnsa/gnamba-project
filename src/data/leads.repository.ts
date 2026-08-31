/**
 * DATA LAYER — Leads Repository
 * Source unique pour toutes les requêtes liées aux leads, visites, ventes, campagnes.
 */

import { dbClient, withRetry } from "./dbClient";

type LeadInsert = Record<string, unknown>;
type LeadUpdate = Record<string, unknown>;

export interface LeadRecord {
  id: string;
  phone: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  source: string | null;
  source_page: string | null;
  source_form: string | null;
  status: string | null;
  channels_optin: {
    sms: boolean;
    whatsapp: boolean;
    email: boolean;
    telegram: boolean;
  } | null;
  tags: string[];
  score: number;
  created_at: string | null;
  last_interaction_at: string | null;
  [key: string]: unknown;
}

export function normalizeLeadRow(row: Record<string, any>): LeadRecord {
  const leadDetails = Array.isArray(row.party_lead_details)
    ? row.party_lead_details[0]
    : null;
  return {
    id: row.id,
    phone: row.telephone ?? "",
    first_name: row.prenom ?? null,
    last_name: row.nom ?? null,
    email: row.email ?? null,
    source: leadDetails?.source ?? null,
    source_page: leadDetails?.source_page ?? null,
    source_form: leadDetails?.source_form ?? null,
    status: leadDetails?.status ?? "active",
    channels_optin: leadDetails?.channels_optin ?? null,
    tags: leadDetails?.tags ?? [],
    score: leadDetails?.score ?? 0,
    created_at: row.created_at ?? leadDetails?.created_at ?? null,
    last_interaction_at: leadDetails?.last_interaction_at ?? null,
    ...row,
  };
}

export interface LeadFilters {
  statut?: string;
  source?: string;
  agent_id?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const leadsRepository = {
  async getAll(filters: LeadFilters = {}) {
    return withRetry(async () => {
      let query = dbClient
        .from("parties")
        .select("*, party_roles(*), party_lead_details(*)", { count: "exact" }).order("created_at");

      if (filters.statut)
        query = query.eq("party_lead_details.status", filters.statut);
      if (filters.source)
        query = query.eq("party_lead_details.source", filters.source);
      if (filters.agent_id)
        query = query.eq("party_lead_details.agent_id", filters.agent_id);
      if (filters.search) {
        const q = `%${filters.search}%`;
        query = query.or(
          `telephone.ilike.${q},prenom.ilike.${q},nom.ilike.${q},email.ilike.${q}`,
        );
      }

      const page = filters.page ?? 1;
      const limit = filters.limit ?? 50;
      query = query.range((page - 1) * limit, page * limit - 1);

      const result = await query;
      return {
        data: {
          items: (result.data ?? []).map((row: Record<string, any>) =>
            normalizeLeadRow(row),
          ),
          total: result.count ?? 0,
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
        .select("*, party_roles(*), party_lead_details(*)")
        .eq("id", id)
        .maybeSingle();
      return {
        ...result,
        data: result.data ? normalizeLeadRow(result.data) : null,
      };
    });
  },

  async create(payload: LeadInsert) {
    return withRetry(async () => {
      const partyPayload = {
        party_type: "personne_physique",
        nom: payload.last_name ?? null,
        prenom: payload.first_name ?? null,
        email: payload.email ?? null,
        telephone: payload.phone ?? null,
        source_table: "leads",
        source_id: payload.id ?? null,
      };
      const partyResult = await dbClient
        .from("parties")
        .insert(partyPayload)
        .select("id")
        .single();
      if (partyResult.error || !partyResult.data?.id) {
        return partyResult as any;
      }
      const roleResult = await dbClient
        .from("party_roles")
        .insert({ party_id: partyResult.data.id, role: "lead" })
        .select("id")
        .single();
      if (roleResult.error) return roleResult as any;
      const detailsPayload = {
        party_id: partyResult.data.id,
        source: payload.source ?? null,
        source_page: payload.source_page ?? null,
        source_form: payload.source_form ?? null,
        score: payload.score ?? 0,
        status: payload.status ?? "active",
        channels_optin: payload.channels_optin ?? {},
        tags: payload.tags ?? [],
      };
      const detailsResult = await dbClient
        .from("party_lead_details")
        .insert(detailsPayload)
        .select()
        .single();
      return detailsResult as any;
    });
  },

  async update(id: string, payload: LeadUpdate) {
    return withRetry(async () => {
      const partyResult = await dbClient
        .from("parties")
        .update({
          nom: payload.last_name ?? null,
          prenom: payload.first_name ?? null,
          email: payload.email ?? null,
          telephone: payload.phone ?? null,
        })
        .eq("source_id", id)
        .select("id")
        .maybeSingle();
      if (partyResult.error || !partyResult.data?.id) {
        return partyResult as any;
      }
      const detailsPayload: Record<string, unknown> = {};
      if (payload.status !== undefined) detailsPayload.status = payload.status;
      if (payload.source !== undefined) detailsPayload.source = payload.source;
      if (payload.source_page !== undefined)
        detailsPayload.source_page = payload.source_page;
      if (payload.source_form !== undefined)
        detailsPayload.source_form = payload.source_form;
      if (payload.score !== undefined) detailsPayload.score = payload.score;
      if (payload.channels_optin !== undefined)
        detailsPayload.channels_optin = payload.channels_optin;
      if (payload.tags !== undefined) detailsPayload.tags = payload.tags;
      if (Object.keys(detailsPayload).length > 0) {
        await dbClient
          .from("party_lead_details")
          .update(detailsPayload)
          .eq("party_id", partyResult.data.id);
      }
      return { data: { id: partyResult.data.id }, error: null };
    });
  },

  async delete(id: string) {
    return withRetry(async () => {
      const partyResult = await dbClient
        .from("parties")
        .delete()
        .eq("source_id", id)
        .select("id");
      return partyResult;
    });
  },

  async getFunnelStats(startDate: string, endDate: string) {
    return withRetry(() =>
      dbClient.rpc("get_funnel_stats", {
        start_date: startDate,
        end_date: endDate,
      }),
    );
  },

  async getVisites(leadId?: string) {
    return withRetry(() => {
      let query = dbClient
        .from("visites_terrain")
        .select("*")
        .order("date_visite", { ascending: false });
      if (leadId) query = query.eq("lead_id", leadId);
      return query;
    });
  },

  async getVentes(filters: { statut?: string } = {}) {
    return withRetry(() => {
      let query = dbClient
        .from("ventes_foncieres")
        .select("*").order("created_at");
      if (filters.statut) query = query.eq("statut", filters.statut);
      return query;
    });
  },

  async getCampagnes() {
    return withRetry(() =>
      dbClient
        .from("campagnes_marketing")
        .select("*").order("created_at"),
    );
  },
};
