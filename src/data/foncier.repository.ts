/**
 * DATA LAYER — Foncier Repository
 * Wrapper sur dataService existant pour unification progressive (Strangler Fig).
 * Les composants migrent de dbClient.from() direct vers foncierRepository.*
 */

import { dataService } from "../lib/dbClient.service";
import { dbClient, withRetry } from "./dbClient";

export interface LotSearchParams {
  search?: string;
  statut?: string;
  village?: string;
  quartier?: string;
  lotissement?: string;
  sort?: string;
  dir?: "asc" | "desc";
  page?: number;
  limit?: number;
  include_archived?: boolean;
}

export const foncierRepository = {
  async searchLots(params: LotSearchParams = {}) {
    return dataService.searchLots({
      search: params.search ?? "",
      village: params.village ?? "",
      quartier: params.quartier ?? "",
      lotissement: params.lotissement ?? "",
      statut: params.statut ?? "",
      sort: params.sort ?? "created_at",
      dir: params.dir ?? "desc",
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      include_archived: params.include_archived ?? false,
    });
  },

  async getLotById(id: string) {
    return dataService.getLotById(id);
  },

  async saveLot(data: Record<string, unknown>, isUpdate = false) {
    return dataService.saveLot(data as any, isUpdate);
  },

  async softDeleteLot(id: string, reason = "archivage") {
    return dataService.softDeleteLot(id, reason);
  },

  async restoreLot(id: string) {
    return dataService.restoreLot(id);
  },

  async getVillages() {
    return dataService.getVillages();
  },

  async getVillageStats(includeArchived = false) {
    return dataService.getVillageStats(includeArchived);
  },

  async checkDuplicate(params: {
    village: string;
    lotissement: string;
    ilot: string;
    lot: string;
    exclude_lot_id?: string | null;
  }) {
    return dataService.checkLotDuplicate(params);
  },

  async ensureHierarchy(params: {
    village: string;
    lotissement: string;
    ilot: string;
  }) {
    return dataService.ensureHierarchy(params);
  },

  async getLatestAttestation(lotId: string, includeArchived = false) {
    return dataService.getLatestAttestationForLot(lotId, includeArchived);
  },

  async createAttestation(payload: Record<string, unknown>) {
    return dataService.createAttestationAtomic(payload);
  },

  async getAudit(params: {
    page: number;
    pageSize: number;
    actionFilter?: string;
  }) {
    return dataService.getAudit(params);
  },

  async getVillagesList() {
    return withRetry(() =>
      dbClient
        .from("foncier_villages")
        .select("id, nom, logo_url, region, commune, departement")
        .order("nom"),
    );
  },
};
