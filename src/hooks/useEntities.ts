import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { entityRepository } from '../data/entity.repository';
import type { EntityResponse, EntityCreate, EntityUpdate, EntitySearchParams, PaginatedEntityResponse } from '../types';

const ENTITIES_KEY = ['entities'];
const ENTITY_KEY = (id: string) => ['entity', id];

export function useEntities(params: EntitySearchParams = {}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [...ENTITIES_KEY, params],
    queryFn: async () => {
      const result = await entityRepository.searchEntities(params);
      if (result.error || !result.data) throw new Error(result.error || 'Failed to load entities');
      return result.data as PaginatedEntityResponse;
    },
  });

  const invalidateEntities = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [...ENTITIES_KEY] });
  }, [queryClient]);

  return {
    ...query,
    invalidateEntities,
  };
}

export function useEntity(id: string | null) {
  const query = useQuery({
    queryKey: ENTITY_KEY(id ?? ''),
    queryFn: async () => {
      if (!id) throw new Error('Entity ID is required');
      const result = await entityRepository.getEntity(id);
      if (result.error || !result.data) throw new Error(result.error || 'Failed to load entity');
      return result.data as EntityResponse;
    },
    enabled: !!id,
  });

  return query;
}

export function useCreateEntity() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: EntityCreate) => {
      const result = await entityRepository.createEntity(data);
      if (result.error || !result.data) throw new Error(result.error || 'Failed to create entity');
      return result.data as EntityResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...ENTITIES_KEY] });
    },
  });

  return mutation;
}

export function useUpdateEntity() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: EntityUpdate }) => {
      const result = await entityRepository.updateEntity(id, data);
      if (result.error || !result.data) throw new Error(result.error || 'Failed to update entity');
      return result.data as EntityResponse;
    },
    onSuccess: (updatedEntity, variables) => {
      queryClient.invalidateQueries({ queryKey: [...ENTITIES_KEY] });
      queryClient.invalidateQueries({ queryKey: ENTITY_KEY(variables.id) });
      queryClient.setQueryData([ENTITY_KEY(variables.id)], updatedEntity);
    },
  });

  return mutation;
}

export function useDeleteEntity() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await entityRepository.deleteEntity(id);
      if (result.error) throw new Error(result.error || 'Failed to delete entity');
      return id;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [...ENTITIES_KEY] });
      queryClient.invalidateQueries({ queryKey: ENTITY_KEY(variables) });
    },
  });

  return mutation;
}