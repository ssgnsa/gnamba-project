/**
 * Database Client Service - Local API client with repository pattern
 * Provides typed access to all database operations via apiClient
 */
import type { FoncierLot, FoncierAttestation, FoncierVillage, UserProfile } from '../types';
import { apiClient } from '../api/client.ts';
import tableClient from '../data/tableClient.ts';

// Type for repository return values
export interface RepoResult<T> {
  data: T | null;
  error: string | null;
  count?: number | null;
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
    return { data: result.data as FoncierLot[], error: null, count: result.count };
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
    const data = result.data as FoncierAttestation[];
    return { data: data?.[0] ?? null, error: null, count: data?.length || 0 };
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
      const result = await apiClient.foncier.createLot(lotData);

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
    const from = (page - 1) * pageSize;

    const params = new URLSearchParams();
    params.append('offset', String(from));
    params.append('limit', String(pageSize));
    if (actionFilter) {
      params.append('action', actionFilter);
    }

    const result = await apiClient.foncier.getAudit(params);

    if (result.error) {
      return { data: null, error: result.error, count: null };
    }
    return { data: result.data as any[], error: null, count: result.count || 0 };
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
// Default export - compatibility shim using tableClient (which wraps apiClient)
export default tableClient as any;
