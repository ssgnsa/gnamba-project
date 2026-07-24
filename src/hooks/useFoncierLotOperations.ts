import { useState, useEffect } from 'react';
import type { FoncierLot } from '@/types';

export const useFoncierLotOperations = (lots: FoncierLot[]) => {
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [filterVillage, setFilterVillage] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(lots.length);
  const [villageStats, setVillageStats] = useState<Record<string, { total: number; count: number }>>({});
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    setTotalCount(lots.length);
  }, [lots]);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), 200);
    return () => clearTimeout(timeout);
  }, [search]);

  const applyLocalFilters = (rows: FoncierLot[]) => {
    let filtered = [...rows];

    if (!showArchived) {
      filtered = filtered.filter((lot) => !lot.deleted_at);
    }

    if (filterStatut) {
      filtered = filtered.filter((lot) => lot.statut === filterStatut);
    }

    if (filterVillage) {
      filtered = filtered.filter((lot) => lot.village === filterVillage);
    }

    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      filtered = filtered.filter((lot) =>
        `${lot.reference} ${lot.numero_lot} ${lot.nom_lotissement} ${lot.village} ${lot.proprietaire_nom} ${lot.proprietaire_prenom}`
          .toLowerCase()
          .includes(query),
      );
    }

    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const paged = filtered.slice(start, start + pageSize);

    return { paged, total };
  };

  return {
    loading,
    setLoading,
    search,
    setSearch,
    debouncedSearch,
    setDebouncedSearch,
    filterStatut,
    setFilterStatut,
    filterVillage,
    setFilterVillage,
    showArchived,
    setShowArchived,
    page,
    setPage,
    pageSize,
    totalCount,
    setTotalCount,
    villageStats,
    setVillageStats,
    statsLoading,
    setStatsLoading,
    statsError,
    setStatsError,
    applyLocalFilters,
  };
};
