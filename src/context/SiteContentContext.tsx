/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { apiClient } from "../api/client";
import { useContentVersion } from "../hooks/useContentVersion";

interface SiteContentRow {
  section: string;
  key: string;
  value: string;
}

interface SiteContentContextValue {
  get: (section: string, key: string, fallback?: string) => string;
  loading: boolean;
}

const SiteContentContext = createContext<SiteContentContextValue>({
  get: (_s, _k, fallback = "") => fallback,
  loading: true,
});

export function SiteContentProvider({ children }: { children: ReactNode }) {
  const [rows, setRows] = useState<SiteContentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const contentVersion = useContentVersion(); // Subscribe to content updates

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const result = await apiClient.siteContent.getAll();

        if (cancelled) return;
        if (result.data) setRows(result.data);
        if (result.error && import.meta.env.DEV)
          console.error(
            "SiteContentContext: error loading content",
            result.error,
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [contentVersion]); // Re-fetch when content version changes

  const get = (section: string, key: string, fallback = ""): string => {
    const row = rows.find((r) => r.section === section && r.key === key);
    return row?.value || fallback;
  };

  return (
    <SiteContentContext.Provider value={{ get, loading }}>
      {children}
    </SiteContentContext.Provider>
  );
}

export function useSiteContent() {
  return useContext(SiteContentContext);
}
