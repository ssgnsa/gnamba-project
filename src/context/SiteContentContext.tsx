/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { supabase } from "../lib/supabase";

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

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const { data, error } = await supabase
          .from("site_content")
          .select("section, key, value");

        if (cancelled) return;
        if (data) setRows(data);
        if (error && import.meta.env.DEV)
          console.error("SiteContentContext: error loading content", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
