/**
 * DATA LAYER — Foncier Repository
 * Wrapper sur supabaseService existant pour unification progressive (Strangler Fig).
 * Les composants migrent de supabase.from() direct vers foncierRepository.*
 */

import { supabaseService } from '../lib/supabase.service';
import { dbClient, withRetry } from './client';

export interface LotSearchParams {
  search?: string;
  statut?: string;
  village?: string;
  quartier?: string;
  lotissement?: string;
  sort?: string;
  dir?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  include_archived?: boolean;
}

export const foncierRepository = {
  async searchLots(params: LotSearchParams = {}) {
    return supabaseService.searchLots({
      search: params.search ?? '',
      village: params.village ?? '',
      quartier: params.quartier ?? '',
      lotissement: params.lotissement ?? '',
      statut: params.statut ?? '',
      sort: params.sort ?? 'created_at',
      dir: params.dir ?? 'desc',
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      include_archived: params.include_archived ?? false,
    });
  },

  async getLotById(id: string) {
    return supabaseService.getLotById(id);
  },

  async saveLot(data: Record<string, unknown>, isUpdate = false) {
    return supabaseService.saveLot(data as any, isUpdate);
  },

  async softDeleteLot(id: string, reason = 'archivage') {
    return supabaseService.softDeleteLot(id, reason);
  },

  async restoreLot(id: string) {
    return supabaseService.restoreLot(id);
  },

  async getVillages() {
    return supabaseService.getVillages();
  },

  async getVillageStats(includeArchived = false) {
    return supabaseService.getVillageStats(includeArchived);
  },

  async checkDuplicate(params: {
    village: string;
    lotissement: string;
    ilot: string;
    lot: string;
    exclude_lot_id?: string | null;
  }) {
    return supabaseService.checkLotDuplicate(params);
  },

  async ensureHierarchy(params: {
    village: string;
    lotissement: string;
    ilot: string;
  }) {
    return supabaseService.ensureHierarchy(params);
  },

  async getLatestAttestation(lotId: string, includeArchived = false) {
    return supabaseService.getLatestAttestationForLot(lotId, includeArchived);
  },

  async createAttestation(payload: Record<string, unknown>) {
    return supabaseService.createAttestationAtomic(payload);
  },

  async getAudit(params: { page: number; pageSize: number; actionFilter?: string }) {
    return supabaseService.getAudit(params);
  },

  async getVillagesList() {
    return withRetry(() =>
      dbClient
        .from('foncier_villages')
        .select('id, name, logo_url, region, commune, departement')
        .order('name'),
    );
  },
};
