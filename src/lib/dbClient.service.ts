/**
 * Database Client Service - Local API client with repository pattern
 * Provides typed access to all database operations via apiClient
 */
import type { FoncierLot, FoncierAttestation, FoncierVillage, Finance, Product, UserProfile, VillageWithStats } from '../types';
import { apiClient } from '../api/client.ts';
import tableClient from '../data/tableClient.ts';

// Type for repository return values
export interface RepoResult<T> {
  data: T | null;
  error: string | null;
  count?: number | null;
}

const normalizeFoncierLabel = (value: unknown): string =>
  String(value ?? "")
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("fr-FR");

async function resolveExistingIlotId(
  lotData: Partial<FoncierLot>,
): Promise<{ ilotId?: string; error?: string }> {
  if (lotData.ilot_id) return { ilotId: String(lotData.ilot_id) };

  const villageName = normalizeFoncierLabel(lotData.village);
  const lotissementName = normalizeFoncierLabel(lotData.nom_lotissement);
  const ilotNumber = normalizeFoncierLabel(lotData.numero_ilot);
  if (!villageName || !lotissementName || !ilotNumber) {
    return { error: "Village, lotissement et îlot sont requis pour créer un lot." };
  }

  const getAll = async <T,>(path: string): Promise<T[] | string> => {
    const pageSize = 200;
    const rows: T[] = [];
    for (let offset = 0; ; offset += pageSize) {
      const separator = path.includes("?") ? "&" : "?";
      const result = await apiClient.request<T[]>(
        `${path}${separator}limit=${pageSize}&offset=${offset}`,
      );
      if (result.error) return result.error;
      const page = Array.isArray(result.data) ? result.data : [];
      rows.push(...page);
      if (page.length < pageSize) return rows;
    }
  };

  const villages = await getAll<{
    id: string;
    nom: string;
    commune?: string | null;
    departement?: string | null;
    region?: string | null;
  }>("/foncier/villages");
  if (typeof villages === "string") {
    return { error: `Impossible de charger les villages : ${villages}` };
  }
  const villageMatches = villages.filter((village) => {
    if (normalizeFoncierLabel(village.nom) !== villageName) return false;
    return (["commune", "departement", "region"] as const).every((field) => {
      const requested = normalizeFoncierLabel(lotData[field]);
      return !requested || normalizeFoncierLabel(village[field]) === requested;
    });
  });
  if (villageMatches.length !== 1) {
    return {
      error:
        villageMatches.length === 0
          ? "Village introuvable. Créez ou sélectionnez d’abord un village enregistré."
          : "Plusieurs villages correspondent. Précisez commune, département ou région.",
    };
  }

  const lotissements = await getAll<{
    id: string;
    nom: string;
  }>(`/foncier/villages/${encodeURIComponent(villageMatches[0].id)}/lotissements`);
  if (typeof lotissements === "string") {
    return { error: `Impossible de charger les lotissements : ${lotissements}` };
  }
  const lotissementMatches = lotissements.filter(
    (lotissement) => normalizeFoncierLabel(lotissement.nom) === lotissementName,
  );
  if (lotissementMatches.length !== 1) {
    return {
      error:
        lotissementMatches.length === 0
          ? "Lotissement introuvable dans ce village. Enregistrez-le d’abord."
          : "Plusieurs lotissements correspondent dans ce village; sélectionnez un identifiant précis.",
    };
  }

  const ilots = await apiClient.request<Array<{ id: string; numero: string }>>(
    `/foncier/lotissements/${encodeURIComponent(lotissementMatches[0].id)}/ilots`,
  );
  if (ilots.error) {
    return { error: `Impossible de charger les îlots : ${ilots.error}` };
  }
  const ilotMatches = (ilots.data ?? []).filter(
    (ilot) => normalizeFoncierLabel(ilot.numero) === ilotNumber,
  );
  if (ilotMatches.length !== 1) {
    return {
      error:
        ilotMatches.length === 0
          ? "Îlot introuvable dans ce lotissement. Enregistrez-le d’abord."
          : "Plusieurs îlots correspondent dans ce lotissement; sélectionnez un identifiant précis.",
    };
  }
  return { ilotId: ilotMatches[0].id };
}

// ============================================
// FONCIER REPOSITORIES
// ============================================

export const foncierRepository = {
  /**
   * Search lots with filters and pagination
   */
  async searchLots(params: {
    search?: string;
    village?: string;
    quartier?: string;
    lotissement?: string;
    statut?: string;
    sort?: string;
    dir?: 'asc' | 'desc';
    page?: number;
    limit?: number;
    include_archived?: boolean;
  } = {}): Promise<RepoResult<FoncierLot[]>> {
    const result = await apiClient.foncier.getLots({
      search: params.search || '',
      village: params.village || '',
      quartier: params.quartier || '',
      lotissement: params.lotissement || '',
      statut: params.statut || '',
      sort: params.sort || 'reference',
      dir: params.dir || 'asc',
      page: params.page || 1,
      limit: params.limit || 20,
      include_archived: params.include_archived || false,
    });

    if (result.error) {
      return { data: null, error: result.error, count: null };
    }

    const responseData = result.data as
      | FoncierLot[]
      | { items?: FoncierLot[]; total?: number }
      | null;
    const lots = Array.isArray(responseData)
      ? responseData
      : Array.isArray(responseData?.items)
        ? responseData.items
        : [];
    const count =
      !Array.isArray(responseData) && typeof responseData?.total === 'number'
        ? responseData.total
        : result.count;

    return { data: lots, error: null, count };
  },

  /**
   * Get a single lot by ID
   */
  async getLotById(id: string): Promise<RepoResult<FoncierLot>> {
    const result = await apiClient.foncier.getLot(id);

    if (result.error) {
      return { data: null, error: result.error, count: null };
    }
    return { data: result.data as FoncierLot, error: null, count: 1 };
  },

  /**
   * Get villages list
   */
  async getVillagesList(): Promise<RepoResult<FoncierVillage[]>> {
    const result = await apiClient.foncier.getVillages();

    if (result.error) {
      return { data: null, error: result.error, count: null };
    }
    return { data: result.data as FoncierVillage[], error: null, count: result.data?.length || 0 };
  },

  /**
   * Alias for getVillagesList (backwards compatibility)
   */
  async getVillages(): Promise<RepoResult<FoncierVillage[]>> {
    return this.getVillagesList();
  },

  /**
   * Récupère un village avec ses statistiques (nb_lotissements, nb_lots).
   */
  async getVillageWithStats(id: string): Promise<RepoResult<VillageWithStats>> {
    const result = await apiClient.request<VillageWithStats>(
      `/foncier/villages/${id}/with-stats`,
    );
    if (result.error) {
      return { data: null, error: result.error, count: null };
    }
    return { data: result.data as VillageWithStats, error: null, count: 1 };
  },

  /**
   * Liste tous les villages avec leurs statistiques (pour tableau CRUD).
   */
  async getAllVillagesWithStats(): Promise<RepoResult<VillageWithStats[]>> {
    const result = await apiClient.request<VillageWithStats[]>(
      '/foncier/villages/with-stats',
    );
    if (result.error) {
      return { data: null, error: result.error, count: null };
    }
    return {
      data: result.data as VillageWithStats[],
      error: null,
      count: result.data?.length || 0,
    };
  },

  /**
   * Create a new village
   */
  async createVillage(villageData: Partial<FoncierVillage>): Promise<RepoResult<FoncierVillage>> {
    const result = await apiClient.request<FoncierVillage>('/foncier/villages', {
      method: 'POST',
      body: JSON.stringify(villageData),
    });

    if (result.error) {
      return { data: null, error: result.error, count: null };
    }
    return { data: result.data as FoncierVillage, error: null, count: 1 };
  },

  /**
   * Update a village
   */
  async updateVillage(id: string, villageData: Partial<FoncierVillage>): Promise<RepoResult<FoncierVillage>> {
    const result = await apiClient.request<FoncierVillage>(`/foncier/villages/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(villageData),
    });

    if (result.error) {
      return { data: null, error: result.error, count: null };
    }
    return { data: result.data as FoncierVillage, error: null, count: 1 };
  },

  /**
   * Delete a village (soft delete)
   */
  async deleteVillage(id: string): Promise<RepoResult<void>> {
    const result = await apiClient.request(`/foncier/villages/${id}`, {
      method: 'DELETE',
    });

    if (result.error) {
      return { data: null, error: result.error, count: null };
    }
    return { data: null, error: null, count: 1 };
  },

  /**
   * Get lotissements
   */
  async getLotissements(): Promise<RepoResult<any[]>> {
    const result = await apiClient.foncier.getLotissements();

    if (result.error) {
      return { data: null, error: result.error, count: null };
    }
    return { data: result.data as any[], error: null, count: result.data?.length || 0 };
  },

  /**
   * Get îlots
   */
  async getIlots(): Promise<RepoResult<any[]>> {
    const result = await apiClient.foncier.getIlots();

    if (result.error) {
      return { data: null, error: result.error, count: null };
    }
    return { data: result.data as any[], error: null, count: result.data?.length || 0 };
  },

  /**
   * Check duplicate
   */
  async checkDuplicate(params: {
    village: string;
    lotissement: string;
    ilot: string;
    lot: string;
    exclude_lot_id?: string;
  }): Promise<RepoResult<any>> {
    const result = await apiClient.request('/rpc/check_foncier_duplicate', {
      method: 'POST',
      body: JSON.stringify({
        p_village: params.village,
        p_lotissement: params.lotissement,
        p_ilot: params.ilot,
        p_lot: params.lot,
        p_exclude_lot_id: params.exclude_lot_id || null,
      }),
    });

    if (result.error) {
      return { data: null, error: result.error, count: null };
    }
    return { data: result.data, error: null, count: 1 };
  },

  /**
   * Alias for checkDuplicate (backwards compatibility)
   */
  async checkLotDuplicate(params: {
    village: string;
    lotissement: string;
    ilot: string;
    lot: string;
    exclude_lot_id?: string | null;
  }): Promise<RepoResult<any>> {
    return this.checkDuplicate({
      village: params.village,
      lotissement: params.lotissement,
      ilot: params.ilot,
      lot: params.lot,
      exclude_lot_id: params.exclude_lot_id || undefined,
    });
  },

  /**
   * Get village stats
   */
  async getVillageStats(includeArchived: boolean = false): Promise<RepoResult<any>> {
    const result = await apiClient.request('/rpc/foncier_stats_by_village', {
      method: 'POST',
      body: JSON.stringify({ p_include_archived: includeArchived }),
    });

    if (result.error) {
      return { data: null, error: result.error, count: null };
    }
    return { data: result.data, error: null, count: Array.isArray(result.data) ? result.data.length : 0 };
  },

  /**
   * Soft delete lot
   */
  async softDeleteLot(lotId: string, _reason: string = 'archivage'): Promise<RepoResult<any>> {
    const result = await apiClient.request('/rpc/soft_delete_foncier_lot', {
      method: 'POST',
      body: JSON.stringify({ p_lot_id: lotId }),
    });

    if (result.error) {
      return { data: null, error: result.error, count: null };
    }
    return { data: result.data, error: null, count: 1 };
  },

  /**
   * Restore lot
   */
  async restoreLot(lotId: string): Promise<RepoResult<any>> {
    const result = await apiClient.request('/rpc/restore_foncier_lot', {
      method: 'POST',
      body: JSON.stringify({ p_lot_id: lotId }),
    });

    if (result.error) {
      return { data: null, error: result.error, count: null };
    }
    return { data: result.data, error: null, count: 1 };
  },

  /**
   * Ensure hierarchy
   */
  async ensureHierarchy(params: {
    village: string;
    lotissement: string;
    ilot: string;
  }): Promise<RepoResult<any>> {
    const result = await apiClient.request('/rpc/ensure_foncier_hierarchy', {
      method: 'POST',
      body: JSON.stringify({
        p_village: params.village,
        p_lotissement: params.lotissement,
        p_ilot: params.ilot,
      }),
    });

    if (result.error) {
      return { data: null, error: result.error, count: null };
    }
    return { data: result.data, error: null, count: 1 };
  },

  /**
   * Create attestation atomic
   */
  async createAttestationAtomic(payload: any): Promise<RepoResult<any>> {
    const result = await apiClient.request('/rpc/create_foncier_attestation_atomic', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (result.error) {
      return { data: null, error: result.error, count: null };
    }
    return { data: result.data, error: null, count: 1 };
  },

  /**
   * Get next attestation version
   */
  async getNextAttestationVersion(lotId: string): Promise<RepoResult<number>> {
    const result = await apiClient.request('/rpc/get_next_attestation_version', {
      method: 'POST',
      body: JSON.stringify({ p_lot_id: lotId }),
    });

    if (result.error) {
      return { data: null, error: result.error, count: null };
    }
    return { data: (result.data as number) || 1, error: null, count: 1 };
  },

  /**
   * Get attestations with filters
   */
  async getAttestations(filters: Record<string, any> = {}): Promise<RepoResult<FoncierAttestation[]>> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
    params.append('order_by', 'created_at');
    params.append('ascending', 'false');

    const result = await apiClient.request<FoncierAttestation[]>(`/foncier/attestations?${params.toString()}`);

    if (result.error) {
      return { data: null, error: result.error, count: null };
    }
    return { data: result.data as FoncierAttestation[], error: null, count: result.data?.length || 0 };
  },

  /**
   * Get latest attestation for lot
   */
  async getLatestAttestationForLot(
    lotId: string,
    includeArchived: boolean = false,
    _select: string = '*',
  ): Promise<RepoResult<FoncierAttestation | null>> {
    const params = new URLSearchParams();
    params.append('lot_id', lotId);
    params.append('order_by', 'created_at');
    params.append('ascending', 'false');
    params.append('limit', '1');
    if (!includeArchived) {
      params.append('deleted_at', 'null');
    }

    const result = await apiClient.request<FoncierAttestation[]>(`/foncier/attestations?${params.toString()}`);

    if (result.error) {
      return { data: null, error: result.error, count: null };
    }
    const responseData = result.data as
      | FoncierAttestation[]
      | { items?: FoncierAttestation[]; total?: number }
      | null;
    const attestations = Array.isArray(responseData)
      ? responseData
      : Array.isArray(responseData?.items)
        ? responseData.items
        : [];
    const count = Array.isArray(responseData)
      ? attestations.length
      : responseData?.total ?? attestations.length;

    return { data: attestations[0] ?? null, error: null, count };
  },

  /**
   * Save lot (insert or update)
   */
  async saveLot(lotData: Partial<FoncierLot>, isUpdate: boolean = false): Promise<RepoResult<FoncierLot>> {
    if (isUpdate) {
      const result = await apiClient.foncier.updateLot(lotData.id!, lotData);

      if (result.error) {
        return { data: null, error: result.error, count: null };
      }
      return { data: result.data as FoncierLot, error: null, count: 1 };
    } else {
      const hierarchy = await resolveExistingIlotId(lotData);
      if (!hierarchy.ilotId) {
        return { data: null, error: hierarchy.error ?? "Îlot introuvable.", count: null };
      }
      const result = await apiClient.foncier.createLot({
        ...lotData,
        ilot_id: hierarchy.ilotId,
      });

      if (result.error) {
        return { data: null, error: result.error, count: null };
      }
      return { data: result.data as FoncierLot, error: null, count: 1 };
    }
  },

  /**
   * Check lot reference exists
   */
  async checkLotReferenceExists(reference: string, excludeLotId?: string): Promise<RepoResult<any>> {
    const params = new URLSearchParams();
    params.append('reference', reference);
    if (excludeLotId) {
      params.append('exclude_id', excludeLotId);
    }

    const result = await apiClient.request(`/foncier/lots/exists?${params.toString()}`);

    if (result.error) {
      return { data: null, error: result.error, count: null };
    }
    return { data: result.data, error: null, count: result.data ? 1 : 0 };
  },

  /**
   * Get user profiles by IDs
   */
  async getUserProfiles(userIds: string[]): Promise<RepoResult<Record<string, UserProfile>>> {
    if (userIds.length === 0) {
      return { data: {}, error: null, count: 0 };
    }

    const result = await apiClient.users.getAll(); // Will need backend support for filtering by IDs

    if (result.error) {
      return { data: null, error: result.error, count: null };
    }
    const users = (result.data as UserProfile[]) || [];
    const filtered = users.filter(u => userIds.includes(u.id));
    const profiles = filtered.reduce((acc, p) => {
      acc[p.id] = p;
      return acc;
    }, {} as Record<string, UserProfile>);
    return { data: profiles, error: null, count: filtered.length };
  },

  /**
   * Get audit logs
   */
  async getAudit(page: number, pageSize: number, actionFilter?: string): Promise<RepoResult<any[]>> {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('page_size', String(pageSize));
    if (actionFilter) {
      params.append('action', actionFilter);
    }

    const result = await apiClient.foncier.getAudit(params);

    if (result.error) {
      return { data: null, error: result.error, count: null };
    }
    const response = result.data as { items?: any[]; total?: number } | null;
    return {
      data: response?.items ?? [],
      error: null,
      count: response?.total ?? 0,
    };
  },

  /**
   * Log audit
   */
  async logAudit(payload: {
    lotId: string;
    action: string;
    details?: Record<string, any>;
  }): Promise<RepoResult<any>> {
    return queryWithRetry(async () => {
      const result = await apiClient.request('/rpc/log_foncier_audit', {
        method: 'POST',
        body: JSON.stringify({
          p_lot_id: payload.lotId,
          p_action: payload.action,
          p_details: payload.details || null,
        }),
      });
      return { data: result.data, error: result.error || null, count: 1 };
    });
  },

  /**
   * Attach PDF metadata to attestation
   */
  async attachAttestationPdfMetadata(payload: {
    attestation_id: string;
    pdf_path: string;
    hash_sha256: string;
    verify_url: string;
    pdf_generated_at: string;
    printed_by: string | null;
  }): Promise<RepoResult<any>> {
    const result = await apiClient.request('/foncier/attestation_pdfs', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (result.error) {
      return { data: null, error: result.error, count: null };
    }
    return { data: result.data, error: null, count: 1 };
  },
};

// ============================================
// CLIENTS REPOSITORY
// ============================================

export const clientsRepository = {
  async getAll(): Promise<RepoResult<any[]>> {
    const result = await apiClient.clients.getAll();

    if (result.error) {
      return { data: null, error: result.error, count: null };
    }
    return { data: result.data as any[], error: null, count: result.data?.length || 0 };
  },

  async getById(id: string): Promise<RepoResult<any>> {
    const result = await apiClient.clients.get(id);

    if (result.error) {
      return { data: null, error: result.error, count: null };
    }
    return { data: result.data as any, error: null, count: result.data ? 1 : 0 };
  },

  async create(data: any): Promise<RepoResult<any>> {
    const result = await apiClient.clients.create(data);

    if (result.error) {
      return { data: null, error: result.error, count: null };
    }
    return { data: result.data as any, error: null, count: 1 };
  },

  async update(id: string, data: any): Promise<RepoResult<any>> {
    const result = await apiClient.clients.update(id, data);

    if (result.error) {
      return { data: null, error: result.error, count: null };
    }
    return { data: result.data as any, error: null, count: 1 };
  },

  async delete(id: string): Promise<RepoResult<any>> {
    const result = await apiClient.clients.delete(id);

    if (result.error) {
      return { data: null, error: result.error, count: null };
    }
    return { data: { id }, error: null, count: 1 };
  },
};

// ============================================
// LEADS REPOSITORY
// ============================================

export const leadsRepository = {
  async getAll(filters?: {
    statut?: string;
    limit?: number;
    offset?: number;
  }): Promise<RepoResult<any[]>> {
    const result = await apiClient.leads.getAll();

    if (result.error) {
      return { data: null, error: result.error, count: null };
    }
    let data = (result.data as any[]) || [];
    if (filters?.statut) {
      data = data.filter(l => l.statut === filters.statut);
    }
    if (filters?.limit && filters?.offset) {
      data = data.slice(filters.offset, filters.offset + filters.limit);
    } else if (filters?.limit) {
      data = data.slice(0, filters.limit);
    }
    return { data, error: null, count: data.length };
  },

  async getById(id: string): Promise<RepoResult<any>> {
    const result = await apiClient.leads.get(id);

    if (result.error) {
      return { data: null, error: result.error, count: null };
    }
    return { data: result.data as any, error: null, count: result.data ? 1 : 0 };
  },

  async create(data: any): Promise<RepoResult<any>> {
    const result = await apiClient.leads.create(data);

    if (result.error) {
      return { data: null, error: result.error, count: null };
    }
    return { data: result.data as any, error: null, count: 1 };
  },

  async update(id: string, data: any): Promise<RepoResult<any>> {
    const result = await apiClient.leads.update(id, data);

    if (result.error) {
      return { data: null, error: result.error, count: null };
    }
    return { data: result.data as any, error: null, count: 1 };
  },

  async delete(id: string): Promise<RepoResult<any>> {
    const result = await apiClient.leads.delete(id);

    if (result.error) {
      return { data: null, error: result.error, count: null };
    }
    return { data: { id }, error: null, count: 1 };
  },
};

// ============================================
// CAMPAIGNS REPOSITORY
// ============================================

export interface CampaignFilters {
  status?: string;
  limit?: number;
  offset?: number;
}

export const campaignsRepository = {
  async getAll(filters?: CampaignFilters): Promise<RepoResult<any[]>> {
    const result = await apiClient.request('/leads/campaigns', {
      method: filters ? 'POST' : 'GET',
      body: filters ? JSON.stringify(filters) : undefined,
    });

    if (result.error) {
      return { data: null, error: result.error, count: null };
    }
    return { data: result.data as any[], error: null, count: result.data?.length || 0 };
  },

  async getById(id: string): Promise<RepoResult<any>> {
    const result = await apiClient.request(`/leads/campaigns/${id}`);

    if (result.error) {
      return { data: null, error: result.error, count: null };
    }
    return { data: result.data as any, error: null, count: result.data ? 1 : 0 };
  },

  async create(data: any): Promise<RepoResult<any>> {
    const result = await apiClient.request('/leads/campaigns', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (result.error) {
      return { data: null, error: result.error, count: null };
    }
    return { data: result.data as any, error: null, count: 1 };
  },

  async update(id: string, data: any): Promise<RepoResult<any>> {
    const result = await apiClient.request(`/leads/campaigns/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });

    if (result.error) {
      return { data: null, error: result.error, count: null };
    }
    return { data: result.data as any, error: null, count: 1 };
  },

  async delete(id: string): Promise<RepoResult<any>> {
    const result = await apiClient.request(`/leads/campaigns/${id}`, {
      method: 'DELETE',
    });

    if (result.error) {
      return { data: null, error: result.error, count: null };
    }
    return { data: { id }, error: null, count: 1 };
  },

  async processCampaign(campaignId: string): Promise<RepoResult<any>> {
    const result = await apiClient.request(`/leads/campaigns/${campaignId}/process`, {
      method: 'POST',
    });

    if (result.error) {
      return { data: null, error: result.error, count: null };
    }
    return { data: result.data as any, error: null, count: 1 };
  },
};

// ============================================
// INTERACTIONS REPOSITORY
// ============================================

export interface InteractionFilters {
  leadId?: string;
  channel?: string;
  type?: string;
  limit?: number;
  offset?: number;
}

export const interactionsRepository = {
  async getAll(filters?: InteractionFilters): Promise<RepoResult<any[]>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    const result = await apiClient.request(`/leads/interactions?${params.toString()}`);

    if (result.error) {
      return { data: null, error: result.error, count: null };
    }
    return { data: result.data as any[], error: null, count: result.data?.length || 0 };
  },

  async getByLeadId(leadId: string, limit: number = 50): Promise<RepoResult<any[]>> {
    const result = await apiClient.request(
      `/leads/interactions?lead_id=${leadId}&limit=${limit}`
    );

    if (result.error) {
      return { data: null, error: result.error, count: null };
    }
    return { data: result.data as any[], error: null, count: result.data?.length || 0 };
  },

  async create(data: any): Promise<RepoResult<any>> {
    const result = await apiClient.request('/leads/interactions', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (result.error) {
      return { data: null, error: result.error, count: null };
    }
    return { data: result.data as any, error: null, count: 1 };
  },

  async getStats(leadId?: string): Promise<RepoResult<any>> {
    const params = leadId ? `?lead_id=${leadId}` : '';
    const result = await apiClient.request(`/leads/interactions/stats${params}`);

    if (result.error) {
      return { data: null, error: result.error, count: null };
    }
    return { data: result.data as any, error: null, count: 1 };
  },
};

// ============================================
// LEAD CONVERSION REPOSITORY
// ============================================

export const leadConversionRepository = {
  async convertToClient(leadId: string, clientData: any): Promise<RepoResult<any>> {
    const result = await apiClient.leads.convert(leadId, clientData);

    if (result.error) {
      return { data: null, error: result.error, count: null };
    }
    return { data: result.data as any, error: null, count: 1 };
  },
};

// ============================================
// TENANTS REPOSITORY
// ============================================

export const tenantsRepository = {
  async getAll(filters?: {
    limit?: number;
    offset?: number;
  }): Promise<RepoResult<any[]>> {
    const result = await apiClient.tenants.getAll();

    if (result.error) {
      return { data: null, error: result.error, count: null };
    }
    let data = (result.data as any[]) || [];
    if (filters?.limit && filters?.offset) {
      data = data.slice(filters.offset, filters.offset + filters.limit);
    } else if (filters?.limit) {
      data = data.slice(0, filters.limit);
    }
    return { data, error: null, count: data.length };
  },

  async getById(id: string): Promise<RepoResult<any>> {
    const result = await apiClient.tenants.get(id);

    if (result.error) {
      return { data: null, error: result.error, count: null };
    }
    return { data: result.data as any, error: null, count: result.data ? 1 : 0 };
  },

  async create(data: any): Promise<RepoResult<any>> {
    const result = await apiClient.tenants.create(data);

    if (result.error) {
      return { data: null, error: result.error, count: null };
    }
    return { data: result.data as any, error: null, count: 1 };
  },

  async update(id: string, data: any): Promise<RepoResult<any>> {
    const result = await apiClient.tenants.update(id, data);

    if (result.error) {
      return { data: null, error: result.error, count: null };
    }
    return { data: result.data as any, error: null, count: 1 };
  },

  async delete(id: string): Promise<RepoResult<any>> {
    const result = await apiClient.tenants.delete(id);

    if (result.error) {
      return { data: null, error: result.error, count: null };
    }
    return { data: { id }, error: null, count: 1 };
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Retry helper with exponential backoff
 */
async function withBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 100,
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxRetries) {
        throw lastError;
      }

      if (isRateLimitError(lastError)) {
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 100;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      throw lastError;
    }
  }

  throw lastError;
}

/**
 * Checks if an error is a rate limit error (429 or similar)
 */
function isRateLimitError(error: Error): boolean {
  return (
    error.message.includes('429') ||
    error.message.includes('rate limit') ||
    error.message.includes('Too Many Requests')
  );
}

/**
 * Execute query with retry logic
 */
async function queryWithRetry<T>(
  queryFn: () => Promise<{ data: T | null; error: string | null; count?: number | null }>,
): Promise<{ data: T | null; error: string | null; count: number | null }> {
  try {
    const result = await withBackoff(queryFn);
    return {
      data: result.data,
      error: result.error || null,
      count: result.count ?? null,
    };
  } catch (error) {
    if (import.meta.env.DEV) console.error('queryWithRetry error:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      count: null,
    };
  }
}

// Export helper functions
export { withBackoff, isRateLimitError };

// Export dataService object for backwards compatibility with existing imports
export const dataService = {
  ...foncierRepository,
  ...clientsRepository,
  ...leadsRepository,
  ...campaignsRepository,
  ...interactionsRepository,
  ...leadConversionRepository,
  ...tenantsRepository,
};

// Named export for supabase for backward compatibility
export const supabase = tableClient as any;

/** Canonical finance API. The legacy table-style field names stay in the
 * response during transition, while all writes use type_operation/date_operation.
 */
export const financeRepository = {
  async list(params: { limit: number; offset: number }) {
    const query = new URLSearchParams({
      limit: String(params.limit),
      offset: String(params.offset),
    });
    return apiClient.request<Finance[]>(`/finance?${query.toString()}`);
  },
  async create(payload: Record<string, unknown>) {
    return apiClient.request<Finance>("/finance", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  async update(id: string, payload: Record<string, unknown>) {
    return apiClient.request<Finance>(`/finance/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
};

/** Product API keeps references server generated and immutable. */
export const productRepository = {
  async list() {
    return apiClient.request<Product[]>("/products");
  },
  async create(payload: Record<string, unknown>) {
    return apiClient.request<Product>("/products", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  async update(id: string, payload: Record<string, unknown>) {
    return apiClient.request<Product>(`/products/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
  async delete(id: string) {
    return apiClient.request(`/products/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  },
};

// Default export - compatibility shim using tableClient (which wraps apiClient)
export default tableClient as any;
