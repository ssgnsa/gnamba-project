/**
 * ENTITY REPOSITORY
 * Typed access to entity operations via apiClient
 */

import { apiClient } from '../api/client';
import type { EntityResponse, EntityCreate, EntityUpdate, EntitySearchParams, PaginatedEntityResponse } from '../types';

// Type for repository return values
export interface RepoResult<T> {
  data: T | null;
  error: string | null;
  count?: number | null;
}

export const entityRepository = {
  /**
   * Search entities with filters and pagination
   */
  async searchEntities(params: EntitySearchParams = {}): Promise<RepoResult<PaginatedEntityResponse>> {
    // Convertir les paramètres en query string
    const queryParams = new URLSearchParams();

    if (params.search) queryParams.append('search', params.search);
    if (params.type) queryParams.append('type', params.type);
    if (params.subtype) queryParams.append('subtype', params.subtype);
    if (params.status) queryParams.append('status', params.status);
    if (params.has_phone !== undefined && params.has_phone !== null) queryParams.append('has_phone', String(params.has_phone));
    if (params.has_email !== undefined && params.has_email !== null) queryParams.append('has_email', String(params.has_email));
    if (params.has_company !== undefined && params.has_company !== null) queryParams.append('has_company', String(params.has_company));
    if (params.id_document_type) queryParams.append('id_document_type', params.id_document_type);
    if (params.id_document_number) queryParams.append('id_document_number', params.id_document_number);
    if (params.limit !== undefined) queryParams.append('limit', String(params.limit));
    if (params.offset !== undefined) queryParams.append('offset', String(params.offset));
    if (params.order_by) queryParams.append('order_by', params.order_by);
    if (params.descending !== undefined) queryParams.append('descending', String(params.descending));

    const queryString = queryParams.toString();
    const endpoint = `/api/v1/entities${queryString ? `?${queryString}` : ''}`;

    const result = await apiClient.request<PaginatedEntityResponse>(endpoint);

    if (result.error) {
      return { data: null, error: result.error, count: null };
    }

    return { data: result.data, error: null, count: result.data?.total || 0 };
  },

  /**
   * Get a single entity by ID
   */
  async getEntity(id: string): Promise<RepoResult<EntityResponse>> {
    const result = await apiClient.request<EntityResponse>(`/api/v1/entities/${id}`);

    if (result.error) {
      return { data: null, error: result.error, count: null };
    }

    return { data: result.data, error: null, count: 1 };
  },

  /**
   * Create a new entity
   */
  async createEntity(data: EntityCreate): Promise<RepoResult<EntityResponse>> {
    const result = await apiClient.request<EntityResponse>('/api/v1/entities', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (result.error) {
      return { data: null, error: result.error, count: null };
    }

    return { data: result.data, error: null, count: 1 };
  },

  /**
   * Update an existing entity
   */
  async updateEntity(id: string, data: EntityUpdate): Promise<RepoResult<EntityResponse>> {
    const result = await apiClient.request<EntityResponse>(`/api/v1/entities/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });

    if (result.error) {
      return { data: null, error: result.error, count: null };
    }

    return { data: result.data, error: null, count: 1 };
  },

  /**
   * Delete (soft delete) an entity
   */
  async deleteEntity(id: string): Promise<RepoResult<void>> {
    const result = await apiClient.request(`/api/v1/entities/${id}`, {
      method: 'DELETE',
    });

    if (result.error) {
      return { data: null, error: result.error, count: null };
    }

    return { data: null, error: null, count: 1 };
  }
};

// Export dataService object for backwards compatibility with existing imports
export const dataService = {
  ...entityRepository,
};