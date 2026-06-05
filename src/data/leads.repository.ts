/**
 * DATA LAYER — Leads Repository
 * Source unique pour toutes les requêtes liées aux leads, visites, ventes, campagnes.
 */

import { dbClient, withRetry } from './client';

type LeadInsert = Record<string, unknown>;
type LeadUpdate = Record<string, unknown>;

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
        .from('leads')
        .select('*, user_profiles!agent_id(full_name)', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (filters.statut) query = query.eq('statut', filters.statut);
      if (filters.source) query = query.eq('source', filters.source);
      if (filters.agent_id) query = query.eq('agent_id', filters.agent_id);
      if (filters.search) {
        const q = `%${filters.search}%`;
        query = query.or(`phone.ilike.${q},first_name.ilike.${q},last_name.ilike.${q},email.ilike.${q}`);
      }

      const page = filters.page ?? 1;
      const limit = filters.limit ?? 50;
      query = query.range((page - 1) * limit, page * limit - 1);

      return query;
    });
  },

  async getById(id: string) {
    return withRetry(() =>
      dbClient
        .from('leads')
        .select('*')
        .eq('id', id)
        .maybeSingle(),
    );
  },

  async create(payload: LeadInsert) {
    return withRetry(() =>
      dbClient.from('leads').insert(payload).select().single(),
    );
  },

  async update(id: string, payload: LeadUpdate) {
    return withRetry(() =>
      dbClient.from('leads').update(payload).eq('id', id).select().single(),
    );
  },

  async delete(id: string) {
    return withRetry(() =>
      dbClient.from('leads').delete().eq('id', id),
    );
  },

  async getFunnelStats(startDate: string, endDate: string) {
    return withRetry(() =>
      dbClient.rpc('get_funnel_stats', {
        start_date: startDate,
        end_date: endDate,
      }),
    );
  },

  async getVisites(leadId?: string) {
    return withRetry(() => {
      let query = dbClient
        .from('visites_terrain')
        .select('*')
        .order('date_visite', { ascending: false });
      if (leadId) query = query.eq('lead_id', leadId);
      return query;
    });
  },

  async getVentes(filters: { statut?: string } = {}) {
    return withRetry(() => {
      let query = dbClient
        .from('ventes_foncieres')
        .select('*')
        .order('created_at', { ascending: false });
      if (filters.statut) query = query.eq('statut', filters.statut);
      return query;
    });
  },

  async getCampagnes() {
    return withRetry(() =>
      dbClient
        .from('campagnes_marketing')
        .select('*')
        .order('created_at', { ascending: false }),
    );
  },
};
