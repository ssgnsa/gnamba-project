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
}

interface AuthResult {
  user: any;
  session: any;
  access_token?: string;
  refresh_token?: string;
  code?: string;
}

// Core API client class
class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

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
    const configuredBase = import.meta.env.VITE_API_URL || '/api/v1';
    const trimmed = configuredBase.replace(/\/+$/, '');
    this.baseUrl = trimmed.endsWith('/api/v1')
      ? trimmed
      : `${trimmed}/api/v1`;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  private getAuthHeaders(): Record<string, string> {
    if (typeof window === 'undefined') return {};
    const token = window.localStorage.getItem('egs:local_auth_token');
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
    return {};
  }

  async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<ApiResult<T>> {
    const doFetch = async (withAuth = true): Promise<Response> => {
      const headers = {
        ...this.defaultHeaders,
        ...(withAuth ? this.getAuthHeaders() : {}),
        ...options.headers,
      };

      if (options.body instanceof FormData) {
        delete (headers as Record<string, string>)['Content-Type'];
      }

      return fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });
    };

    try {
      let response = await doFetch();

      if (response.status === 401 && typeof window !== 'undefined') {
        const refreshToken = window.localStorage.getItem('egs:local_refresh_token');
        if (refreshToken) {
          const refreshResult = await this.auth.refresh(refreshToken);
          if (!refreshResult.error && refreshResult.data?.access_token) {
            this.persistLocalAuthToken(
              refreshResult.data.access_token,
              refreshResult.data.refresh_token ?? refreshToken,
            );
            response = await doFetch();
          } else {
            this.clearStoredLocalAuthToken();
          }
        }
      }

      if (!response.ok) {
        const errorText = await response.text();
        return { data: null, error: `HTTP ${response.status}: ${errorText}`, count: null, status: response.status };
      }

      const data = await response.json();
      return { data, error: null, count: Array.isArray(data) ? data.length : 1, status: response.status };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error', count: null, status: 0 };
    }
  }

  // Auth module
  auth = {
    login: async (email: string, password: string) => this.request<AuthResult>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
    logout: async () => this.request('/auth/logout', { method: 'POST' }),
    me: async () => this.request('/auth/me'),
    refresh: async (refreshToken: string) => this.request('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    }),
    resetPassword: async (email: string) => this.request('/auth/password/reset', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
    updatePassword: async (currentPassword: string, newPassword: string) => this.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    }),
  };

  // Named exports for backward compatibility
  async clearStoredLocalAuthToken() {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('egs:local_auth_token');
      window.localStorage.removeItem('egs:local_refresh_token');
    }
    return { data: null, error: null, count: 1, status: 200 };
  }

  async persistLocalAuthToken(accessToken: string, refreshToken: string) {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('egs:local_auth_token', accessToken);
      window.localStorage.setItem('egs:local_refresh_token', refreshToken);
    }
    return { data: { access_token: accessToken, refresh_token: refreshToken }, error: null, count: 1, status: 200 };
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
    createLot: async (data: any) => this.request('/foncier/lots', { method: 'POST', body: JSON.stringify(data) }),
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
      } catch (e) {
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
      } catch (e) {
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

export const persistLocalAuthToken = async (accessToken: string, refreshToken: string) => {
  return apiClient.persistLocalAuthToken(accessToken, refreshToken);
};

// Export types
export type { AuthResult };

// Default export for backward compatibility
export default apiClient;