import { useEffect, useState, useCallback } from "react";
import { apiClient } from "../api/client";
import { useContentVersion } from "./useContentVersion";

interface SiteContentRow {
  section: string;
  key: string;
  value: string;
}

/**
 * Hook to fetch and provide site_content overrides for a specific page layout.
 * Returns a map of section -> key -> value for easy lookup by section components.
 */
export function useSiteContentOverrides(): {
  overrides: Map<string, Map<string, string>>;
  loading: boolean;
  refetch: () => Promise<void>;
  getOverride: (section: string, key: string, fallback?: string) => string;
} {
  const [overrides, setOverrides] = useState<Map<string, Map<string, string>>>(new Map());
  const [loading, setLoading] = useState(true);
  const contentVersion = useContentVersion(); // Subscribe to content updates

  const fetchOverrides = useCallback(async () => {
    try {
      const { data, error } = await apiClient.siteContent.getAll();
      if (!error && data) {
        const newOverrides = new Map<string, Map<string, string>>();
        for (const row of data as SiteContentRow[]) {
          if (!newOverrides.has(row.section)) {
            newOverrides.set(row.section, new Map());
          }
          newOverrides.get(row.section)!.set(row.key, row.value);
        }
        setOverrides(newOverrides);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchOverrides();
  }, [contentVersion, fetchOverrides]);

  const getOverride = useCallback(
    (section: string, key: string, fallback = ""): string => {
      const sectionMap = overrides.get(section);
      if (sectionMap) {
        const value = sectionMap.get(key);
        if (value !== undefined) return value;
      }
      return fallback;
    },
    [overrides],
  );

  return {
    overrides,
    loading,
    refetch: fetchOverrides,
    getOverride,
  };
}