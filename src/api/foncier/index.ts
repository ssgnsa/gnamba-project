// ============================================
// API CLIENT FONCIER - Couche REST standard
// Remplace appels Supabase directs
// Utilise le même client unifié que le reste de l'app
// ============================================

import { apiClient, type ApiResult } from "@/api/client";
import type {
  FoncierLot,
  FoncierAttestation,
  FoncierVillage,
  FoncierLotissement,
  FoncierIlot,
  ActivityLog,
} from "@/types";

// ============================================
// VILLAGES
// ============================================

export const villagesApi = {
  // Liste villages (avec stats optionnelles)
  list: (_params?: { actif?: boolean; commune?: string }): Promise<ApiResult<FoncierVillage[]>> =>
    apiClient.request("/foncier/villages", {
      method: "GET",
    }),

  // Liste villages avec stats (dashboard)
  listWithStats: (): Promise<ApiResult<(FoncierVillage & { stats: any })[]>> =>
    apiClient.request("/foncier/villages/with-stats", {
      method: "GET",
    }),

  // Détail village + config
  get: (id: string): Promise<ApiResult<FoncierVillage & { config: any }>> =>
    apiClient.request(`/foncier/villages/${id}`, {
      method: "GET",
    }),

  // Créer village (avec accès auto)
  create: (data: {
    nom: string;
    code: string;
    region?: string;
    departement?: string;
    commune?: string;
    chef_nom?: string;
    chef_telephone?: string;
    chef_email?: string;
    arrete_prefectoral?: string;
    arrete_date?: string;
    lieu_signature?: string;
    nom_signataire?: string;
    primary_color?: string;
    secondary_color?: string;
    layout_preference?: string;
    config_jsonb?: Record<string, any>;
    actif?: boolean;
  }): Promise<ApiResult<FoncierVillage>> =>
    apiClient.request("/foncier/villages", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Modifier village
  update: (id: string, data: Partial<FoncierVillage>): Promise<ApiResult<FoncierVillage>> =>
    apiClient.request(`/foncier/villages/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  // Supprimer village (sécurisé)
  delete: (id: string): Promise<ApiResult<void>> =>
    apiClient.request(`/foncier/villages/${id}`, { method: "DELETE" }),

  // Stats village (dashboard)
  stats: (_villageId?: string): Promise<ApiResult<any>> =>
    apiClient.request("/foncier/dashboard/stats", {
      method: "GET",
      // village_id as query param
    }).then(res => {
      // If villageId provided, filter client-side or use query param
      return res;
    }),
};

// ============================================
// LOTISSEMENTS
// ============================================

export const lotissementsApi = {
  list: (villageId: string): Promise<ApiResult<FoncierLotissement[]>> =>
    apiClient.request(`/foncier/villages/${villageId}/lotissements`, {
      method: "GET",
    }),

  get: (id: string): Promise<ApiResult<FoncierLotissement>> =>
    apiClient.request(`/foncier/lotissements/${id}`, {
      method: "GET",
    }),

  create: (villageId: string, data: { nom: string; code?: string; description?: string; superficie_totale?: number; nombre_lots_prevus?: number; arrete_lotissement?: string; arrete_date?: string }): Promise<ApiResult<FoncierLotissement>> =>
    apiClient.request(`/foncier/villages/${villageId}/lotissements`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<FoncierLotissement>): Promise<ApiResult<FoncierLotissement>> =>
    apiClient.request(`/foncier/lotissements/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: string): Promise<ApiResult<void>> =>
    apiClient.request(`/foncier/lotissements/${id}`, { method: "DELETE" }),
};

// ============================================
// ÎLOTS
// ============================================

export const ilotsApi = {
  list: (lotissementId: string): Promise<ApiResult<FoncierIlot[]>> =>
    apiClient.request(`/foncier/lotissements/${lotissementId}/ilots`, {
      method: "GET",
    }),

  get: (id: string): Promise<ApiResult<FoncierIlot>> =>
    apiClient.request(`/foncier/ilots/${id}`, {
      method: "GET",
    }),

  create: (lotissementId: string, data: { numero: string; description?: string; superficie_totale?: number }): Promise<ApiResult<FoncierIlot>> =>
    apiClient.request(`/foncier/lotissements/${lotissementId}/ilots`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<FoncierIlot>): Promise<ApiResult<FoncierIlot>> =>
    apiClient.request(`/foncier/ilots/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  delete: (id: string): Promise<ApiResult<void>> =>
    apiClient.request(`/foncier/ilots/${id}`, { method: "DELETE" }),
};

// ============================================
// LOTS
// ============================================

export const lotsApi = {
  // Recherche paginée avec filtres
  search: (params: {
    search?: string;
    statut?: string;
    village_id?: string;
    lotissement_id?: string;
    ilot_id?: string;
    page?: number;
    page_size?: number;
  }): Promise<ApiResult<{
    items: FoncierLot[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  }>> =>
    apiClient.request("/foncier/lots", {
      method: "GET",
      // Params as query string
    }).then(_result => {
      // Build query string manually since apiClient doesn't support params
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query.append(key, String(value));
        }
      });
      // Re-fetch with query string
      const path = `/foncier/lots?${query.toString()}`;
      return apiClient.request(path, { method: "GET" });
    }),

  // Détail lot complet (avec hiérarchie + proprio client + attestations)
  get: (id: string): Promise<ApiResult<FoncierLot & {
    hierarchy: { village: FoncierVillage; lotissement: FoncierLotissement; ilot: FoncierIlot };
    proprietaire_client: any;
    attestations: FoncierAttestation[];
  }>> =>
    apiClient.request(`/foncier/lots/${id}`, {
      method: "GET",
    }),

  // Créer lot (avec génération référence auto)
  create: (data: {
    ilot_id: string;
    numero_lot: string;
    superficie: number;
    prix?: number;
    proprietaire_client_id?: string;
    proprietaire_nom?: string;
    proprietaire_prenom?: string;
    proprietaire_naissance_date?: string;
    proprietaire_naissance_lieu?: string;
    proprietaire_cni_numero?: string;
    proprietaire_cni_date?: string;
    proprietaire_cni_lieu?: string;
    proprietaire_profession?: string;
    proprietaire_telephone?: string;
    proprietaire_email?: string;
    gps_lat?: number;
    gps_lng?: number;
    gps_precision?: number;
    gps_bornage?: Record<string, { lat: number; lng: number }>;
    chef_village?: string;
    arrete_prefectoral?: string;
    arrete_date?: string;
    publier_sur_vitrine?: boolean;
    date_cession?: string;
    prix_cession?: number;
    notes?: string;
  }): Promise<ApiResult<FoncierLot>> =>
    apiClient.request("/foncier/ilots/" + data.ilot_id + "/lots", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Modifier lot
  update: (id: string, data: Partial<FoncierLot>): Promise<ApiResult<FoncierLot>> =>
    apiClient.request(`/foncier/lots/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  // Archiver (soft delete)
  archive: (id: string, reason?: string): Promise<ApiResult<FoncierLot>> =>
    apiClient.request(`/foncier/lots/${id}/archive`, {
      method: "POST",
      body: JSON.stringify({ reason: reason || "archivage" }),
    }),

  // Restaurer
  restore: (id: string): Promise<ApiResult<FoncierLot>> =>
    apiClient.request(`/foncier/lots/${id}/restore`, { method: "POST" }),

  // Vérifier doublon
  checkDuplicate: (params: {
    village_id: string;
    lotissement_id: string;
    ilot_id: string;
    numero_lot: string;
    exclude_lot_id?: string;
  }): Promise<ApiResult<{ duplicates: FoncierLot[]; is_duplicate: boolean }>> =>
    apiClient.request("/foncier/lots/check-duplicate", {
      method: "POST",
      body: JSON.stringify(params),
    }),

  // Import CSV/Excel lotissement
  import: (ilotId: string, file: File, options?: { skipHeader?: boolean; delimiter?: string }): Promise<ApiResult<{ created: number; errors: string[] }>> => {
    const formData = new FormData();
    formData.append("file", file);
    if (options?.skipHeader) formData.append("skipHeader", "true");
    if (options?.delimiter) formData.append("delimiter", options.delimiter);
    return apiClient.request(`/foncier/ilots/${ilotId}/lots/import`, {
      method: "POST",
      body: formData,
      headers: {}, // Content-Type auto pour FormData
    });
  },

  // Export CSV
  export: (params?: { village_id?: string; statut?: string }): Promise<ApiResult<Blob>> =>
    apiClient.request("/foncier/lots/export", {
      method: "POST",
      body: JSON.stringify(params),
    }).then(({ data }) => data), // Retourne Blob pour téléchargement
};

// ============================================
// ATTESTATIONS
// ============================================

export const attestationsApi = {
  // Liste attestations d'un lot
  listByLot: (lotId: string): Promise<ApiResult<FoncierAttestation[]>> =>
    apiClient.request(`/foncier/lots/${lotId}/attestations`, {
      method: "GET",
    }),

  // Liste toutes attestations (paginée)
  search: (params: {
    lot_id?: string;
    statut?: string;
    page?: number;
    page_size?: number;
  }): Promise<ApiResult<{
    items: FoncierAttestation[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  }>> => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query.append(key, String(value));
      }
    });
    return apiClient.request(`/foncier/attestations?${query.toString()}`, {
      method: "GET",
    });
  },

  // Détail attestation complète
  get: (id: string): Promise<ApiResult<FoncierAttestation & { temoins: any[] }>> =>
    apiClient.request(`/foncier/attestations/${id}`, {
      method: "GET",
    }),

  // Créer attestation (brouillon)
  create: (lotId: string, data: {
    type?: "standard" | "cession" | "succession" | "mutation";
    mode_acquisition?: string;
    historique_possession?: string;
    domicile?: string;
    cedant_nom?: string;
    cedant_prenom?: string;
    cedant_cni_numero?: string;
    cedant_telephone?: string;
    cedant_domicile?: string;
    limites_nord?: string;
    limites_sud?: string;
    limites_est?: string;
    limites_ouest?: string;
    gps_lat?: number;
    gps_lng?: number;
    gps_precision?: number;
    gps_points?: any;
    registre_volume?: string;
    registre_page?: number;
    registre_ligne?: number;
    numero_enregistrement?: string;
    temoins?: Array<{ nom: string; prenom: string; profession?: string; telephone?: string; cni?: string }>;
    validation_agent_nom?: string;
    proprietaire_client_id?: string;
  }): Promise<ApiResult<FoncierAttestation>> =>
    apiClient.request(`/foncier/lots/${lotId}/attestations`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Modifier attestation (si brouillon)
  update: (id: string, data: Partial<FoncierAttestation>): Promise<ApiResult<FoncierAttestation>> =>
    apiClient.request(`/foncier/attestations/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  // Soumettre au Chef (Agent -> Chef)
  submit: (id: string, agentNom: string): Promise<ApiResult<FoncierAttestation>> =>
    apiClient.request(`/foncier/attestations/${id}/submit`, {
      method: "POST",
      body: JSON.stringify({ agent_nom: agentNom }),
    }),

  // Valider par Chef (signature physique)
  validate: (id: string, data: {
    chef_nom: string;
    signature_media_id?: string;
    empreinte_media_id?: string;
  }): Promise<ApiResult<FoncierAttestation>> =>
    apiClient.request(`/foncier/attestations/${id}/validate`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Scanner original (upload scan)
  uploadScan: (id: string, mediaId: string, originalName: string): Promise<ApiResult<{ scan_url: string }>> =>
    apiClient.request(`/foncier/attestations/${id}/scan`, {
      method: "POST",
      body: JSON.stringify({ media_id: mediaId, original_name: originalName }),
    }),

  // Générer PDF + QR Code
  generatePdf: (id: string): Promise<ApiResult<{ pdf_url: string; qr_payload: string; control_number: string }>> =>
    apiClient.request(`/foncier/attestations/${id}/generate-pdf`, {
      method: "POST",
    }),

  // Télécharger PDF
  downloadPdf: (id: string): Promise<ApiResult<Blob>> =>
    apiClient.request(`/foncier/attestations/${id}/pdf`, { method: "GET" }).then(({ data }) => data),

  // Révoquer
  revoke: (id: string, reason: string): Promise<ApiResult<FoncierAttestation>> =>
    apiClient.request(`/foncier/attestations/${id}/revoke`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),

  // Lien public vérification (pour Chef sans authentification)
  getPublicVerification: (reference: string): Promise<ApiResult<any>> =>
    apiClient.request(`/foncier/attestations/verify/${reference}`, {
      method: "GET",
    }),
};

// ============================================
// AUDIT / ACTIVITY LOGS
// ============================================

export const auditApi = {
  // Liste paginée avec filtres
  list: (params: {
    entity_type?: string;
    entity_id?: string;
    action?: string;
    user_id?: string;
    date_from?: string;
    date_to?: string;
    page?: number;
    page_size?: number;
  }): Promise<ApiResult<{
    items: ActivityLog[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  }>> => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query.append(key, String(value));
      }
    });
    return apiClient.request(`/foncier/audit?${query.toString()}`, {
      method: "GET",
    });
  },

  // Timeline par entité (lot + attestations + workflow)
  getTimeline: (entityType: string, entityId: string): Promise<ApiResult<{
    entity_type: string;
    entity_id: string;
    entity_reference: string;
    events: ActivityLog[];
  }>> =>
    apiClient.request(`/foncier/audit/timeline/${entityType}/${entityId}`, {
      method: "GET",
    }),

  // Export PDF rapport audit
  exportPdf: (params: { entity_type?: string; entity_id?: string; date_from?: string; date_to?: string }): Promise<ApiResult<Blob>> =>
    apiClient.request("/foncier/audit/export-pdf", { method: "POST", body: JSON.stringify(params) }).then(({ data }) => data),

  // Export CSV
  exportCsv: (params: { entity_type?: string; entity_id?: string; date_from?: string; date_to?: string }): Promise<ApiResult<Blob>> =>
    apiClient.request("/foncier/audit/export-csv", { method: "POST", body: JSON.stringify(params) }).then(({ data }) => data),
};

// ============================================
// SYNC OFFLINE
// ============================================

export const syncApi = {
  // Statut sync
  status: (): Promise<ApiResult<{
    pending: number;
    last_sync: string | null;
    last_error: string | null;
    queue_size: number;
  }>> =>
    apiClient.request("/foncier/sync/status", {
      method: "GET",
    }),

  // Forcer sync maintenant
  trigger: (): Promise<ApiResult<{ synced: number; failed: number; errors: string[] }>> =>
    apiClient.request("/foncier/sync/trigger", { method: "POST" }),

  // Obtenir file d'attente
  getQueue: (): Promise<ApiResult<any[]>> =>
    apiClient.request("/foncier/sync/queue", { method: "GET" }),

  // Résoudre conflit (choix version)
  resolveConflict: (queueItemId: string, resolution: "local" | "server" | "merge", mergedData?: any): Promise<ApiResult<void>> =>
    apiClient.request(`/foncier/sync/queue/${queueItemId}/resolve`, {
      method: "POST",
      body: JSON.stringify({ resolution, merged_data: mergedData }),
    }),

  // Nettoyer queue (items syncés > 30j)
  cleanup: (): Promise<ApiResult<{ deleted: number }>> =>
    apiClient.request("/foncier/sync/cleanup", { method: "POST" }),
};

// ============================================
// ACCÈS UTILISATEUR / VILLAGE
// ============================================

export const accessApi = {
  // Accorder accès
  grant: (userId: string, villageId: string, accessLevel: string): Promise<ApiResult<any>> =>
    apiClient.request(`/foncier/access/${userId}/villages/${villageId}`, {
      method: "POST",
      body: JSON.stringify({ access_level: accessLevel }),
    }),

  // Révoquer accès
  revoke: (userId: string, villageId: string): Promise<ApiResult<void>> =>
    apiClient.request(`/foncier/access/${userId}/villages/${villageId}`, {
      method: "DELETE",
    }),

  // Mes villages
  myVillages: (): Promise<ApiResult<{ accesses: any[] }>> =>
    apiClient.request("/foncier/access/me/villages", {
      method: "GET",
    }),

  // Utilisateurs d'un village
  villageUsers: (villageId: string): Promise<ApiResult<{ users: any[] }>> =>
    apiClient.request(`/foncier/villages/${villageId}/users`, {
      method: "GET",
    }),
};

// ============================================
// EXPORTS GROUPÉS
// ============================================

export const foncierApi = {
  villages: villagesApi,
  lotissements: lotissementsApi,
  ilots: ilotsApi,
  lots: lotsApi,
  attestations: attestationsApi,
  audit: auditApi,
  sync: syncApi,
  access: accessApi,
};

export default foncierApi;