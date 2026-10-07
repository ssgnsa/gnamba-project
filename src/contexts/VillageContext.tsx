// /contexts/VillageContext.tsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import type { Village } from "../types/village";
import { loadVillages, findVillageById } from "../types/village";

interface VillageContextType {
  villages: Village[];
  currentVillage: Village | null;
  isLoading: boolean;
  error: string | null;
  setCurrentVillageId: (id: string) => void;
  refreshVillages: () => Promise<void>;
}

const VillageContext = createContext<VillageContextType | undefined>(undefined);

interface VillageProviderProps {
  children: ReactNode;
}

export function VillageProvider({ children }: VillageProviderProps) {
  const [villagesData, setVillagesData] = useState<Village[]>([]);
  const [currentVillageId, setCurrentVillageId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les villages depuis villages.json
  const loadVillageData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await loadVillages();
      setVillagesData(data.villages.filter((v) => v.active));
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des villages";
      setError(message);
      if (import.meta.env.DEV)
        console.error("VillageContext: Erreur chargement villages:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Charger au montage
  useEffect(() => {
    loadVillageData();
  }, [loadVillageData]);

  // Trouver le village courant par ID
  const currentVillage = currentVillageId
    ? findVillageById(villagesData, currentVillageId) || null
    : null;

  const refreshVillages = useCallback(async () => {
    await loadVillageData();
  }, [loadVillageData]);

  const value: VillageContextType = {
    villages: villagesData,
    currentVillage,
    isLoading,
    error,
    setCurrentVillageId,
    refreshVillages,
  };

  return (
    <VillageContext.Provider value={value}>{children}</VillageContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useVillageContext() {
  const context = useContext(VillageContext);
  if (context === undefined) {
    throw new Error("useVillageContext must be used within a VillageProvider");
  }
  return context;
}

// Hook utilitaire pour accéder aux données d'un village spécifique
// eslint-disable-next-line react-refresh/only-export-components
export function useVillage(villageId: string) {
  const { villages, isLoading, error } = useVillageContext();

  const village = villageId ? findVillageById(villages, villageId) : null;

  return {
    village,
    isLoading,
    error,
  };
}
