/** useCRUD — Hook générique pour les opérations CRUD.
 * Signature : useCRUD<T>({ list, create, update, remove, autoLoad? })
 * Retourne : { items, loading, error, create, update, remove, reload, setItems }
 * Gère : loading state, error state, re-fetch après mutation.
 * Type-safe avec generics TypeScript.
 */
import { useState, useEffect, useCallback } from "react";

interface UseCRUDResult<T extends { id: number | string }> {
  items: T[];
  loading: boolean;
  error: string | null;
  create: (data: any) => Promise<void>;
  update: (id: string, data: any) => Promise<void>;
  remove: (id: string) => Promise<void>;
  reload: () => Promise<void>;
  setItems: (items: T[]) => void;
}

interface UseCRUDOptions<T> {
  list?: () => Promise<T[]>;
  create?: (data: any) => Promise<T>;
  update?: (id: string, data: any) => Promise<T>;
  remove?: (id: string) => Promise<void>;
  autoLoad?: boolean;
}

export function useCRUD<T extends { id: number | string }>(options: UseCRUDOptions<T> = {}): UseCRUDResult<T> {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Chargement initial
  useEffect(() => {
    if (options.autoLoad !== false) {
      loadList();
    }
  }, []);

  const loadList = useCallback(async () => {
    if (!options.list) return;
    setLoading(true);
    try {
      const data = await options.list!();
      setItems(data);
    } catch (err: any) {
      setError(err.message || "Erreur inattendue");
    } finally {
      setLoading(false);
    }
  }, [options.list]);

  const create = useCallback(async (data: any) => {
    setLoading(true);
    setError(null);
    try {
      if (options.create) {
        const result = await options.create!(data);
        setItems((prev) => [...prev, result]);
      }
    } catch (err: any) {
      setError(err.message || "Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  }, [options.create]);

  const update = useCallback(async (id: string, data: any) => {
    setLoading(true);
    setError(null);
    try {
      if (options.update) {
        const result = await options.update!(id, data);
        setItems((prev) => prev.map((item) => (item.id === id ? result : item)));
      }
    } catch (err: any) {
      setError(err.message || "Erreur lors de la mise à jour");
    } finally {
      setLoading(false);
    }
  }, [options.update]);

  const remove = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      if (options.remove) {
        await options.remove!(id);
      }
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      setError(err.message || "Erreur lors de la suppression");
    } finally {
      setLoading(false);
    }
  }, [options.remove]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (options.list) {
        const data = await options.list!();
        setItems(data);
      }
    } catch (err: any) {
      setError(err.message || "Erreur lors du rechargement");
    } finally {
      setLoading(false);
    }
  }, [options.list]);

  return {
    items,
    loading,
    error,
    create,
    update,
    remove,
    reload,
    setItems,
  };
}