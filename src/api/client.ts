/**
 * API Client - Centralized API communication layer
 * Provides typed access to all backend endpoints
 */

// Type for API responses
export interface ApiResult<T = any> {
  data: T | null;
  error: string | null;
  count?: number | null;
  status?: number;
  code?: string | null;
}

interface AuthResult {
  user: any;
  access_token?: string;
  code?: string;
  mfa_challenge_required?: boolean;
  aal?: string;
}

import { getLocalApiBaseUrl } from "../lib/selfHosted";

export function resolveApiBaseUrl(
  configuredBase = '/api/v1',
  origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173',
): string {
  const trimmed = configuredBase.replace(/\/+$/, '');
  const normalized = trimmed.endsWith('/api/v1')
    ? trimmed
    : `${trimmed}/api/v1`;

  const isLocalFrontend = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  const parsedApi = new URL(normalized, "http://placeholder.com");
  const isLocalApi = (parsedApi.hostname === "localhost" || parsedApi.hostname === "127.0.0.1") && parsedApi.port === "8000" && parsedApi.pathname === "/api/v1";

  // Page servée depuis une IP privée/LAN en HTTP (ex. http://<adresse-privée>) :
  // le reverse-proxy du même hôte expose l'API sur le port 80, donc une URL
  // relative suffit. Cela évite le CORS et l'URL publique (injoignable depuis
  // le réseau local). Détection faite à l'exécution sur l'origine de la page,
  // jamais via une URL en dur dans le bundle de production.
  if (origin.startsWith("http:") && isLocalPageOrigin(origin)) {
    return '/api/v1';
  }

  // A production page served over HTTPS must never issue an HTTP API request.
  // Falling back to the same-origin proxy also makes stale build-time values
  // such as a LAN development address harmless after deployment.
  if (origin.startsWith("https:") && normalized.startsWith("http:")) {
    return "/api/v1";
  }

  // When both the frontend and the API are local, use a relative URL so the
  // dev proxy (Vite) or the nginx reverse proxy (Docker) forwards to the API,
  // regardless of which port each runs on.
  if (isLocalFrontend && isLocalApi) {
    return '/api/v1';
  }

  return normalized;
}

// Détection à l'exécution d'une origine LAN (IP privée) servie en HTTP. La
// boucle locale (localhost/127.0.0.1) est gérée par la logique existante et
// n'entre pas dans ce cas : une page en localhost conserve l'URL API
// configurée. Aucune URL en dur ; seule l'origine courante de la page est
// inspectée. IPv6 non couvert (usage marginal ici), ajouter si nécessaire.
function isLocalPageOrigin(origin: string): boolean {
  try {
    const host = new URL(origin, "http://placeholder.com").hostname;
    const m = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/.exec(host);
    if (!m) return false;
    const a = Number(m[1]);
    const b = Number(m[2]);
    return (
      a === 10 ||
      (a === 192 && b === 168) ||
      (a === 172 && b >= 16 && b <= 31)
    );
  } catch {
    return false;
  }
}

// Core API client class
class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private accessToken: string | null = null;
  private refreshPromise: Promise<ApiResult<AuthResult>> | null = null;

  private buildQueryString(params?: Record<string, any>): string {
    if (!params) return '';

    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (Array.isArray(value)) {
        value.forEach((entry) => query.append(key, String(entry)));
        return;
      }
      query.append(key, String(value));
    });

    const serialized = query.toString();
    return serialized ? `?${serialized}` : '';
  }

  constructor() {
    this.baseUrl = resolveApiBaseUrl(getLocalApiBaseUrl());
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
    if (typeof window !== 'undefined') {
      // Remove bearer tokens persisted by releases predating HttpOnly refresh cookies.
      window.localStorage.removeItem('egs:local_auth_token');
      window.localStorage.removeItem('egs:local_refresh_token');
    }
  }

  private getAuthHeaders(): Record<string, string> {
    return this.accessToken ? { Authorization: `Bearer ${this.accessToken}` } : {};
  }

  private refreshSession(): Promise<ApiResult<AuthResult>> {
    if (!this.refreshPromise) {
      this.refreshPromise = this.auth.refresh().finally(() => {
        this.refreshPromise = null;
      });
    }
    return this.refreshPromise;
  }

  private shouldRefreshAfterUnauthorized(endpoint: string): boolean {
    // A rejected MFA code, password reset or logout must not rotate the
    // refresh cookie as a side effect. Protected business endpoints can still
    // transparently renew an expired access token.
    return endpoint === '/auth/me' || !endpoint.startsWith('/auth/');
  }

  private assertSecureCredentialTransport(endpoint: string): void {
    if (typeof window === 'undefined' || (!this.accessToken && !/^\/auth\//.test(endpoint))) return;
    const localHost = /^(localhost|127\.0\.0\.1|\[::1\])$/i.test(window.location.hostname);
    // Une origine LAN privée est servie en HTTP et l'API est jointe sur la même
    // origine via le reverse-proxy : pas d'exigence HTTPS, comme pour la boucle
    // locale. Les origines publiques doivent rester en HTTPS.
    const lanOrigin = isLocalPageOrigin(window.location.origin);
    const apiUrl = new URL(this.baseUrl, window.location.origin);
    if (!localHost && !lanOrigin && (window.location.protocol !== 'https:' || apiUrl.protocol !== 'https:')) {
      throw new Error('La connexion sécurisée HTTPS est obligatoire pour l’authentification.');
    }
  }

  async request<T = any>(endpoint: string, options: RequestInit = {}, retryWithSession = true): Promise<ApiResult<T>> {
    const doFetch = async (withAuth = true): Promise<Response> => {
      this.assertSecureCredentialTransport(endpoint);
      const isAuthBootstrap = endpoint === '/auth/refresh' || endpoint === '/auth/login';
      const headers = {
        ...this.defaultHeaders,
        ...((withAuth && !isAuthBootstrap) ? this.getAuthHeaders() : {}),
        ...options.headers,
      };

      if (options.body instanceof FormData) {
        delete (headers as Record<string, string>)['Content-Type'];
      }

      return fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        credentials: 'include',
        headers,
      });
    };

    try {
      let response = await doFetch();

      if (retryWithSession && response.status === 401 && typeof window !== 'undefined' && this.shouldRefreshAfterUnauthorized(endpoint)) {
        const refreshResult = await this.refreshSession();
        if (!refreshResult.error && refreshResult.data?.access_token) {
          this.persistLocalAuthToken(refreshResult.data.access_token);
          response = await doFetch();
        } else {
          this.clearStoredLocalAuthToken();
        }
      }

      if (!response.ok) {
        const errorText = await response.text();
        let errorPayload: { code?: string; detail?: string } = {};
        try {
          errorPayload = JSON.parse(errorText) as { code?: string; detail?: string };
        } catch {
          // Keep the raw response in the public error message below.
        }
        const detail = typeof errorPayload.detail === 'string' ? errorPayload.detail : errorText;
        return {
          data: null,
          error: `HTTP ${response.status}: ${detail}`,
          count: null,
          status: response.status,
          code: errorPayload.code ?? null,
        };
      }

      const data = await response.json();
      return { data, error: null, count: Array.isArray(data) ? data.length : 1, status: response.status };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error', count: null, status: 0 };
    }
  }

  async fetchStorageFile(fileUrl: string): Promise<Blob> {
    if (typeof window === 'undefined') throw new Error('Storage files are browser-only');
    this.assertSecureCredentialTransport('/storage/files');

    const parsed = new URL(fileUrl, window.location.origin);
    const prefix = '/storage/';
    if (!parsed.pathname.startsWith(prefix)) {
      throw new Error('URL de stockage invalide');
    }

    const endpoint = `/storage/files/${parsed.pathname.slice(prefix.length)}${parsed.search}`;
    const fetchFile = () => fetch(`${this.baseUrl}${endpoint}`, {
      headers: this.getAuthHeaders(),
      credentials: 'include',
    });

    let response = await fetchFile();
    if (response.status === 401) {
      const refreshResult = await this.refreshSession();
      if (!refreshResult.error && refreshResult.data?.access_token) {
        this.persistLocalAuthToken(refreshResult.data.access_token);
        response = await fetchFile();
      }
    }

    if (!response.ok) throw new Error(`Lecture du fichier refusée (${response.status})`);
    return response.blob();
  }

  // Auth module
  auth = {
    login: async (email: string, password: string) => this.request<AuthResult>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
    verifyMfa: async (code: string) => this.request<AuthResult>('/auth/mfa/verify', {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),
    logout: async () => this.request('/auth/logout', { method: 'POST' }),
    me: async () => this.request('/auth/me'),
    refresh: async () => this.request('/auth/refresh', { method: 'POST' }, false),
    requestPasswordReset: async (email: string) => this.request('/auth/password/forgot', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
    resetPassword: async (token: string, newPassword: string) => this.request('/auth/password/reset', {
      method: 'POST',
      body: JSON.stringify({ token, new_password: newPassword }),
    }),
    updatePassword: async (currentPassword: string, newPassword: string) => this.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    }),
  };

  // Named exports for backward compatibility
  async clearStoredLocalAuthToken() {
    this.accessToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('egs:local_auth_token');
      localStorage.removeItem('egs:local_refresh_token');
    }
    return { data: null, error: null, count: 1, status: 200 };
  }

  async persistLocalAuthToken(accessToken: string) {
    this.accessToken = accessToken;
    if (typeof window !== 'undefined') {
      localStorage.setItem('egs:local_auth_token', accessToken);
    }
    return { data: { access_token: accessToken }, error: null, count: 1, status: 200 };
  }

  getStoredLocalAuthToken(): string | null {
    if (!this.accessToken && typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('egs:local_auth_token');
    }
    return this.accessToken;
  }

  /**
   * Store an AAL1 token in memory only (no localStorage).
   * Used between /auth/login (mfa_challenge_required) and /auth/mfa/verify.
   * Never persisted — replaced by the AAL2 token after MFA verification.
   */
  setAccessTokenInMemory(accessToken: string): void {
    this.accessToken = accessToken;
  }

  // Settings module
  settings = {
    get: async (key?: string) => {
      const url = key ? `/settings/${key}` : '/settings';
      return this.request(url);
    },
    set: async (key: string, value: any) => {
      return this.request('/settings', {
        method: 'POST',
        body: JSON.stringify({ key, value }),
      });
    },
    getAll: async () => this.request('/settings'),
    getPublic: async () => this.request('/settings/public'),
    upsert: async (items: Array<{ key: string; value: string }>) => this.request('/settings', {
      method: 'POST',
      body: JSON.stringify({ items }),
    }),
  };

  // Foncier module
  foncier = {
    getLots: async (params?: Record<string, any>) => {
      const query = this.buildQueryString(params);
      return this.request(`/foncier/lots${query}`);
    },
    getLot: async (id: string) => this.request(`/foncier/lots/${id}`),
    createLot: async (data: any) => {
      const ilotId = data?.ilot_id;
      if (!ilotId) {
        return { data: null, error: 'ilot_id requis pour créer un lot', status: 400 } as ApiResult;
      }
      const payload = { ...data };
      delete payload.ilot_id;
      return this.request(`/foncier/ilots/${encodeURIComponent(ilotId)}/lots`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    updateLot: async (id: string, data: any) => this.request(`/foncier/lots/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    deleteLot: async (id: string) => this.request(`/foncier/lots/${id}`, { method: 'DELETE' }),
    signAttestation: async (attestationId: string, payload: any) => this.request(`/foncier/attestations/${attestationId}/sign`, { method: 'POST', body: JSON.stringify(payload) }),
    getLotissements: async () => this.request('/foncier/lotissements'),
    getIlots: async () => this.request('/foncier/ilots'),
    getVillages: async () => this.request('/foncier/villages'),
    getAssembly: async () => this.request('/foncier/assembly'),
    getAudit: async (params?: any) => {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, String(value));
          }
        });
      }
      const query = queryParams.toString();
      return this.request(`/foncier/audit${query ? `?${query}` : ''}`);
    },
    getVillageNames: async () => this.request('/foncier/villages/names'),
  };

  // Users module
  users = {
    getAll: async () => this.request('/users'),
    get: async (id: string) => this.request(`/users/${id}`),
    create: async (data: any) => this.request('/users', { method: 'POST', body: JSON.stringify(data) }),
    update: async (id: string, data: any) => this.request(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: async (id: string) => this.request(`/users/${id}`, { method: 'DELETE' }),
    getProfile: async (id: string) => this.request(`/users/${id}/profile`),
  };

  // Media module
  media = {
    getAll: async (params?: Record<string, any>) => {
      const query = this.buildQueryString(params);
      return this.request(`/media${query}`);
    },
    upload: async (file: File | Blob, metadata?: any) => {
      // Defensive: ensure we always send a browser `File` instance.
      if (!file) {
        return { data: null, error: 'No file provided', status: 400 } as ApiResult;
      }
      let fileToSend: File;
      try {
        if (typeof File !== 'undefined' && file instanceof File) {
          fileToSend = file;
        } else {
          const name = (file as any).name || `upload-${Date.now()}`;
          fileToSend = new File([file as Blob], name, { type: (file as any).type || 'application/octet-stream' });
        }
      } catch {
        const name = (file as any).name || `upload-${Date.now()}`;
        fileToSend = new File([file as Blob], name, { type: (file as any).type || 'application/octet-stream' });
      }

      const formData = new FormData();
      formData.append('file', fileToSend);

      const normalizedMetadata = {
        ...(metadata ?? {}),
        category: metadata?.category ?? 'autre',
        alt_text: metadata?.alt_text ?? metadata?.altText ?? '',
        description: metadata?.description ?? '',
        tags: Array.isArray(metadata?.tags) ? metadata.tags : (metadata?.tags ? String(metadata.tags).split(',') : []),
      };

      const category = normalizedMetadata.category;
      const altText = normalizedMetadata.alt_text || '';
      const description = normalizedMetadata.description || '';
      const tags = normalizedMetadata.tags || [];

      formData.append('category', String(category));
      formData.append('alt_text', String(altText));
      formData.append('description', String(description));
      formData.append('tags', Array.isArray(tags) ? tags.join(',') : String(tags ?? ''));

      formData.append('metadata', JSON.stringify({
        ...normalizedMetadata,
        file_name: fileToSend.name,
      }));

      return this.request('/media', {
        method: 'POST',
        body: formData,
        headers: {}, // Let browser set Content-Type with boundary
      });
    },
    replace: async (id: string, file: File | Blob, metadata?: any) => {
      if (!file) {
        return { data: null, error: 'No file provided', status: 400 } as ApiResult;
      }
      let fileToSend: File;
      try {
        if (typeof File !== 'undefined' && file instanceof File) {
          fileToSend = file;
        } else {
          const name = (file as any).name || `replace-${Date.now()}`;
          fileToSend = new File([file as Blob], name, { type: (file as any).type || 'application/octet-stream' });
        }
      } catch {
        const name = (file as any).name || `replace-${Date.now()}`;
        fileToSend = new File([file as Blob], name, { type: (file as any).type || 'application/octet-stream' });
      }

      const formData = new FormData();
      formData.append('file', fileToSend);

      if (metadata) {
        const category = metadata?.category ?? 'autre';
        const altText = metadata?.alt_text ?? metadata?.altText ?? '';
        const description = metadata?.description ?? '';
        const tags = metadata?.tags ?? [];

        formData.append('category', String(category));
        formData.append('alt_text', String(altText));
        formData.append('description', String(description));
        formData.append('tags', Array.isArray(tags) ? tags.join(',') : String(tags ?? ''));
        formData.append('metadata', JSON.stringify(metadata));
      }

      return this.request(`/media/${id}/replace`, {
        method: 'POST',
        body: formData,
        headers: {},
      });
    },
    update: async (id: string, data: any) => this.request(`/media/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: async (id: string) => this.request(`/media/${id}`, { method: 'DELETE' }),
    restore: async (id: string) => this.request(`/media/${id}/restore`, { method: 'POST' }),
    purge: async (id: string) => this.request(`/media/${id}/purge`, { method: 'DELETE' }),
    getBrandAssets: async () => this.request('/media/brand-assets'),
    getAudit: async (mediaId?: string) => this.request(`/media/audit${mediaId ? `?media_id=${mediaId}` : ''}`),
    getVersions: async (mediaId: string) => this.request(`/media/${mediaId}/versions`),
  };

  // Site content module
  siteContent = {
    get: async (section: string, key?: string) => {
      const url = key ? `/site-content/${section}/${key}` : `/site-content/${section}`;
      return this.request(url);
    },
    set: async (section: string, key: string, value: any) => this.request('/site-content', {
      method: 'POST',
      body: JSON.stringify({ section, key, value }),
    }),
    getAll: async () => this.request('/site-content'),
  };

  // Page layouts module
  pageLayouts = {
    getAll: async () => this.request('/page-layouts'),
    get: async (pageSlug: string) => this.request(`/page-layouts/${pageSlug}`),
    create: async (data: any) => this.request('/page-layouts', { method: 'POST', body: JSON.stringify(data) }),
    update: async (pageSlug: string, data: any) => this.request(`/page-layouts/${pageSlug}`, { method: 'PATCH', body: JSON.stringify(data) }),
    upsert: async (data: any) => this.request('/page-layouts', { method: 'POST', body: JSON.stringify(data) }),
    publish: async (pageSlug: string) => this.request(`/page-layouts/${pageSlug}/publish`, { method: 'PATCH' }),
  };

  // Projects module
  projects = {
    getAll: async () => this.request('/projects'),
    get: async (id: string) => this.request(`/projects/${id}`),
    create: async (data: any) => this.request('/projects', { method: 'POST', body: JSON.stringify(data) }),
    update: async (id: string, data: any) => this.request(`/projects/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: async (id: string) => this.request(`/projects/${id}`, { method: 'DELETE' }),
  };

  // Clients module
  clients = {
    getAll: async () => this.request('/clients'),
    get: async (id: string) => this.request(`/clients/${id}`),
    create: async (data: any) => this.request('/clients', { method: 'POST', body: JSON.stringify(data) }),
    update: async (id: string, data: any) => this.request(`/clients/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: async (id: string) => this.request(`/clients/${id}`, { method: 'DELETE' }),
  };

  // Leads module
  leads = {
    getAll: async () => this.request('/leads'),
    get: async (id: string) => this.request(`/leads/${id}`),
    create: async (data: any) => this.request('/leads', { method: 'POST', body: JSON.stringify(data) }),
    update: async (id: string, data: any) => this.request(`/leads/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: async (id: string) => this.request(`/leads/${id}`, { method: 'DELETE' }),
    convert: async (id: string, clientData: any) => this.request(`/leads/${id}/convert`, { method: 'POST', body: JSON.stringify(clientData) }),
  };

  // Finances module (backend uses singular /finance)
  finance = {
    getAll: async () => this.request('/finance'),
    get: async (id: string) => this.request(`/finance/${id}`),
    create: async (data: any) => this.request('/finance', { method: 'POST', body: JSON.stringify(data) }),
    update: async (id: string, data: any) => this.request(`/finance/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: async (id: string) => this.request(`/finance/${id}`, { method: 'DELETE' }),
  };

  // Immobilier module
  immobilier = {
    properties: {
      getAll: async (params?: { limit?: number; offset?: number }) =>
        this.request(`/immobilier/properties${this.buildQueryString(params)}`),
      get: async (id: string) => this.request(`/immobilier/properties/${id}`),
      create: async (data: any) =>
        this.request('/immobilier/properties', { method: 'POST', body: JSON.stringify(data) }),
      update: async (id: string, data: any) =>
        this.request(`/immobilier/properties/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
      transition: async (id: string, statut: string) =>
        this.request(`/immobilier/properties/${id}/transition`, {
          method: 'POST',
          body: JSON.stringify({ statut }),
        }),
      verifyLocality: async (id: string, data: { commune?: string | null; ville?: string | null; preuve_reference: string; anstat_code: string }) =>
        this.request(`/immobilier/properties/${id}/localite/verification`, { method: 'POST', body: JSON.stringify(data) }),
      publish: async (id: string) =>
        this.request(`/immobilier/properties/${id}/publish`, { method: 'POST' }),
      unpublish: async (id: string) =>
        this.request(`/immobilier/properties/${id}/unpublish`, { method: 'POST' }),
      delete: async (id: string) =>
        this.request(`/immobilier/properties/${id}`, { method: 'DELETE' }),
    },
    contracts: {
      getAll: async (params?: { limit?: number; offset?: number }) =>
        this.request(`/immobilier/contracts${this.buildQueryString(params)}`),
      get: async (id: string) => this.request(`/immobilier/contracts/${id}`),
      create: async (data: any) =>
        this.request('/immobilier/contracts', { method: 'POST', body: JSON.stringify(data) }),
      update: async (id: string, data: any) =>
        this.request(`/immobilier/contracts/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
      delete: async (id: string) =>
        this.request(`/immobilier/contracts/${id}`, { method: 'DELETE' }),
      generatePayments: async (id: string) =>
        this.request(`/immobilier/contracts/${id}/generate-payments`, { method: 'POST' }),
    },
    payments: {
      getAll: async (params?: { limit?: number; offset?: number }) =>
        this.request(`/immobilier/payments${this.buildQueryString(params)}`),
      get: async (id: string) => this.request(`/immobilier/payments/${id}`),
      create: async (data: any) =>
        this.request('/immobilier/payments', { method: 'POST', body: JSON.stringify(data) }),
      update: async (id: string, data: any) =>
        this.request(`/immobilier/payments/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
      delete: async (id: string) =>
        this.request(`/immobilier/payments/${id}`, { method: 'DELETE' }),
    },
  };

  // Tenants module (for backward compatibility)
  tenants = {
    getAll: async () => this.request('/tenants'),
    get: async (id: string) => this.request(`/tenants/${id}`),
    create: async (data: any) => this.request('/tenants', { method: 'POST', body: JSON.stringify(data) }),
    update: async (id: string, data: any) => this.request(`/tenants/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: async (id: string) => this.request(`/tenants/${id}`, { method: 'DELETE' }),
  };



  // Documents module - use tables API
  documents = {
    getAll: async () => this.request('/tables/documents'),
    get: async (id: string) => this.request(`/tables/documents/${id}`),
    create: async (data: any) => this.request('/tables/documents', { method: 'POST', body: JSON.stringify(data) }),
    update: async (id: string, data: any) => this.request(`/tables/documents/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: async (id: string) => this.request(`/tables/documents/${id}`, { method: 'DELETE' }),
  };

  // Tasks module
  tasks = {
    getAll: async () => this.request('/tasks'),
    get: async (id: string) => this.request(`/tasks/${id}`),
    create: async (data: any) => this.request('/tasks', { method: 'POST', body: JSON.stringify(data) }),
    update: async (id: string, data: any) => this.request(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: async (id: string) => this.request(`/tasks/${id}`, { method: 'DELETE' }),
  };

  // Employees module
  employees = {
    getAll: async () => this.request('/employees'),
    get: async (id: string) => this.request(`/employees/${id}`),
    create: async (data: any) => this.request('/employees', { method: 'POST', body: JSON.stringify(data) }),
    update: async (id: string, data: any) => this.request(`/employees/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: async (id: string) => this.request(`/employees/${id}`, { method: 'DELETE' }),
  };

  // Suppliers module
  suppliers = {
    getAll: async () => this.request('/suppliers'),
    get: async (id: string) => this.request(`/suppliers/${id}`),
    create: async (data: any) => this.request('/suppliers', { method: 'POST', body: JSON.stringify(data) }),
    update: async (id: string, data: any) => this.request(`/suppliers/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: async (id: string) => this.request(`/suppliers/${id}`, { method: 'DELETE' }),
  };





  // Audit - use specific audit endpoints (media/audit, foncier/audit)
  audit = {
    log: async (data: any) => this.request('/media/audit', { method: 'POST', body: JSON.stringify(data) }),
    get: async (params?: any) => this.request('/media/audit', {
      method: params ? 'POST' : 'GET',
      body: params ? JSON.stringify(params) : undefined,
    }),
  };

  // Verify Turnstile - backend doesn't have this endpoint yet
  verifyTurnstile = async (_token: string) => {
    return { data: { success: true }, error: null, count: 1, status: 200 };
  };

  // Version
  version = async () => this.request('/version');
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export named functions for backward compatibility
export const clearStoredLocalAuthToken = async () => {
  return apiClient.clearStoredLocalAuthToken();
};

export const persistLocalAuthToken = async (accessToken: string, _refreshToken?: string) => {
  return apiClient.persistLocalAuthToken(accessToken);
};

// Export types
export type { AuthResult };

// Default export for backward compatibility
export default apiClient;
