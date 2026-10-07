// src/lib/dbClient.service.ts
import { apiClient } from '../api/client';
import type { ApiResult } from '../api/client'; // on va l'exporter depuis client.ts

// On redéfinit le type pour l'usage interne
type TableName = 'media_files' | 'media_versions' | 'media_usage' | 'media_audit_logs'
  | 'brand_assets' | 'site_settings' | 'users' | 'clients' | 'leads'
  | 'foncier_lots' | 'foncier_lotissements' | 'foncier_ilots' | 'foncier_audit_logs'
  | 'projects' | 'tasks' | 'documents' | 'finances' | 'fournisseurs'
  | 'fournitures' | 'immobilier' | 'tenants' | 'registre_visiteurs'
  | string; // pour les tables non listées

// Mapper table → endpoint (à adapter selon votre API)
function tableToEndpoint(table: TableName): string {
  const map: Record<string, string> = {
    media_files: '/api/v1/media',
    media_versions: '/api/v1/media/versions',
    media_usage: '/api/v1/media/usage',
    media_audit_logs: '/api/v1/media/audit',
    brand_assets: '/api/v1/media/brand-assets',
    site_settings: '/api/v1/settings',
    users: '/api/v1/users',
    clients: '/api/v1/clients',
    leads: '/api/v1/leads',
    foncier_lots: '/api/v1/foncier/lots',
    foncier_lotissements: '/api/v1/foncier/lotissements',
    foncier_ilots: '/api/v1/foncier/ilots',
    foncier_audit_logs: '/api/v1/foncier/audit',
    projects: '/api/v1/projects',
    tasks: '/api/v1/tasks',
    documents: '/api/v1/documents',
    finances: '/api/v1/finances',
    fournisseurs: '/api/v1/fournisseurs',
    fournitures: '/api/v1/fournitures',
    immobilier: '/api/v1/immobilier',
    tenants: '/api/v1/tenants',
    registre_visiteurs: '/api/v1/registre-visiteurs',
  };
  return map[table] || `/api/v1/${table}`;
}

// Construction d'une requête avec filtres
class QueryBuilder {
  private endpoint: string;
  private filters: string[] = [];
  private order: string[] = [];
  private limitVal?: number;

  constructor(table: TableName) {
    this.endpoint = tableToEndpoint(table);
  }

  select(columns: string) {
    // On ignore les colonnes pour l'instant, on récupère tout
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push(`${column}=${encodeURIComponent(value)}`);
    return this;
  }

  neq(column: string, value: any) {
    this.filters.push(`${column}!=${encodeURIComponent(value)}`);
    return this;
  }

  gt(column: string, value: any) {
    this.filters.push(`${column}>${encodeURIComponent(value)}`);
    return this;
  }

  gte(column: string, value: any) {
    this.filters.push(`${column}>=${encodeURIComponent(value)}`);
    return this;
  }

  lt(column: string, value: any) {
    this.filters.push(`${column}<${encodeURIComponent(value)}`);
    return this;
  }

  lte(column: string, value: any) {
    this.filters.push(`${column}<=${encodeURIComponent(value)}`);
    return this;
  }

  like(column: string, pattern: string) {
    this.filters.push(`${column}=${encodeURIComponent(pattern)}`); // à adapter si besoin
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.order.push(`${column} ${options?.ascending ? 'asc' : 'desc'}`);
    return this;
  }

  limit(n: number) {
    this.limitVal = n;
    return this;
  }

  async then<T = any>(): Promise<{ data: T[] | null; error: any }> {
    let url = this.endpoint;
    const params = new URLSearchParams();
    if (this.filters.length) params.set('filter', this.filters.join(';'));
    if (this.order.length) params.set('order', this.order.join(','));
    if (this.limitVal) params.set('limit', String(this.limitVal));
    const qs = params.toString();
    if (qs) url += '?' + qs;
    const result = await apiClient.request<any[]>(url);
    if (result.error) {
      return { data: null, error: result.error };
    }
    return { data: result.data || [], error: null };
  }

  // Pour les insert/update/delete
  insert(data: any) {
    return apiClient.request(this.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }

  update(data: any) {
    // L'update nécessite un ID dans l'URL ; on le passe via une méthode update({id, ...})
    // Pour simplifier, on suppose qu'on a un eq('id', id) avant
    // On va construire l'URL avec l'ID
    const idFilter = this.filters.find(f => f.startsWith('id='));
    if (!idFilter) throw new Error('update nécessite un filtre id=...');
    const id = idFilter.split('=')[1];
    const url = `${this.endpoint}/${id}`;
    return apiClient.request(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }

  delete() {
    const idFilter = this.filters.find(f => f.startsWith('id='));
    if (!idFilter) throw new Error('delete nécessite un filtre id=...');
    const id = idFilter.split('=')[1];
    const url = `${this.endpoint}/${id}`;
    return apiClient.request(url, { method: 'DELETE' });
  }
}

// La fonction from retourne un QueryBuilder
function from(table: TableName) {
  return new QueryBuilder(table);
}

// On expose également des méthodes directes pour des actions courantes
async function getMedia(id: string) {
  return apiClient.media.get(id);
}

// etc.

export const dbClient = {
  from,
  // Ajouter d'autres helpers si nécessaire
};

export default dbClient;