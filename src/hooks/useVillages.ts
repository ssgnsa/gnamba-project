import { useState, useCallback, useEffect } from "react";
import { foncierRepository } from "../data/foncier.repository";
import { loadVillageConfig, saveVillageConfig } from "../lib/foncierVillageConfig";
import type { FoncierConfigMap } from "../components/foncier/FoncierConstants";
import type { MediaFile } from "../types";

interface UseVillagesOptions {
  accessLevel?: string;
  profile?: { id?: string | null; full_name?: string | null } | null;
}

interface UseVillagesReturn {
  // Village selection
  selectedVillage: string;
  setSelectedVillage: (village: string) => void;
  villageOptions: string[];
  villageOptionsLoading: boolean;
  loadVillageOptions: () => Promise<void>;
  
  // Config
  config: FoncierConfigMap;
  configLoading: boolean;
  configError: string | null;
  configLoaded: boolean;
  configLoadedVillage: string | null;
  loadConfig: (village: string) => Promise<void>;
  updateConfig: (updates: Partial<FoncierConfigMap>) => void;
  saveConfig: () => Promise<boolean>;
  setConfigError: (error: string | null) => void;
  
  // Logo
  logoUrl: string | undefined;
  setLogoUrl: (url: string | undefined) => void;
  logoLoading: boolean;
  uploadLogo: (file: MediaFile, villageName: string) => Promise<void>;
  removeLogo: () => void;
}

export function useVillages({ accessLevel: _accessLevel, profile: _profile }: UseVillagesOptions = {}): UseVillagesReturn {
  const [selectedVillage, setSelectedVillage] = useState("");
  const [villageOptions, setVillageOptions] = useState<string[]>([]);
  const [villageOptionsLoading, setVillageOptionsLoading] = useState(false);
  
  // Config state
  const [config, setConfig] = useState<FoncierConfigMap>(() => ({
    region: "",
    departement: "",
    commune: "",
    village: "",
    chef_village: "",
    arrete_prefectoral: "",
    nom_chef_signe: "",
    lieu_signature: "",
    logo_url: "",
    village_logo_url: "",
    primary_color: "",
    secondary_color: "",
    layout_preference: "",
    registre_volume: "",
    registre_next_numero: "",
    arrete_lotissement: "",
    arrete_date: "",
    limites_nord: "",
    limites_sud: "",
    limites_est: "",
    limites_ouest: "",
  }));
  const [configLoading, setConfigLoading] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);
  const [configLoaded, setConfigLoaded] = useState(false);
  const [configLoadedVillage, setConfigLoadedVillage] = useState<string | null>(null);
  
  // Logo state
  const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined);
  const [logoLoading, setLogoLoading] = useState(false);

  const loadVillageOptions = useCallback(async () => {
    if (villageOptions.length > 0) return;
    setVillageOptionsLoading(true);
    try {
      const result = (await foncierRepository.getVillagesList()) as { error?: unknown; data?: Array<{ nom?: string }> | null };
      if (result.error) throw result.error;
      const villages = (result.data ?? []).map((v) => v.nom ?? "").filter(Boolean).sort();
      setVillageOptions(villages);
      if (villages.length > 0 && !selectedVillage) {
        setSelectedVillage(villages[0]);
      }
    } catch (err) {
      console.error("Error loading village options:", err);
    } finally {
      setVillageOptionsLoading(false);
    }
  }, [villageOptions.length, selectedVillage]);

  // Auto-load on mount
  useEffect(() => {
    loadVillageOptions();
  }, [loadVillageOptions]);

  const loadConfig = useCallback(async (village: string) => {
    if (configLoaded && configLoadedVillage === village) return;
    
    setConfigLoading(true);
    setConfigError(null);
    
    try {
      // Try localStorage first (fast)
      const localConfig = (await loadVillageConfig(village)) ?? ({
        region: "",
        departement: "",
        commune: "",
        village,
        chef_village: "",
        arrete_prefectoral: "",
        nom_chef_signe: "",
        lieu_signature: "",
        logo_url: "",
        village_logo_url: "",
        primary_color: "",
        secondary_color: "",
        layout_preference: "",
        registre_volume: "",
        registre_next_numero: "",
        arrete_lotissement: "",
        arrete_date: "",
        limites_nord: "",
        limites_sud: "",
        limites_est: "",
        limites_ouest: "",
      } as FoncierConfigMap);

      // Also try to fetch from DB for latest
      let dbConfig: Partial<FoncierConfigMap> = {};
      try {
        const villageResult = (await foncierRepository.getVillagesList()) as {
          data?: Array<{ nom?: string; config_jsonb?: Partial<FoncierConfigMap> | null }> | null;
        };
        const villageData = villageResult.data?.find((v) => v.nom === village);
        if (villageData?.config_jsonb) {
          dbConfig = villageData.config_jsonb as Partial<FoncierConfigMap>;
        }
        const mergedConfig = { ...dbConfig, ...localConfig } as FoncierConfigMap;
        setConfig(mergedConfig);
        setLogoUrl((mergedConfig as any).logo_url || (localConfig as any).logo_url || undefined);
      } catch {
        setConfig(localConfig);
        setLogoUrl((localConfig as any).logo_url || undefined);
      }
      
      setConfigLoaded(true);
      setConfigLoadedVillage(village);
    } catch (err: any) {
      console.error("Error loading village config:", err);
      setConfigError(err.message || "Impossible de charger la configuration");
    } finally {
      setConfigLoading(false);
    }
  }, [configLoaded, configLoadedVillage]);

  // Auto-load config when village changes
  useEffect(() => {
    if (selectedVillage) {
      loadConfig(selectedVillage);
    }
  }, [selectedVillage, loadConfig]);

  const updateConfig = useCallback((updates: Partial<FoncierConfigMap>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
    setConfigError(null);
  }, []);

  const saveConfig = useCallback(async (): Promise<boolean> => {
    if (!selectedVillage) {
      setConfigError("Aucun village sélectionné");
      return false;
    }
    if (!config.village?.trim()) {
      setConfigError("Le nom du village est obligatoire");
      return false;
    }

    setConfigLoading(true);
    setConfigError(null);

    try {
      // Save to localStorage
      const saved = await saveVillageConfig(selectedVillage, config);
      if (!saved) throw new Error("Échec sauvegarde locale");

      // Try to persist to DB
      try {
        const villageResult = (await foncierRepository.getVillagesList()) as { data?: Array<{ id?: string; nom?: string }> | null };
        const villageData = villageResult.data?.find((v) => v.nom === selectedVillage);
        
        if (villageData?.id) {
          await foncierRepository.updateVillage(villageData.id, {
            config_jsonb: config,
            primary_color: config.primary_color || null,
            secondary_color: config.secondary_color || null,
            logo_url: config.logo_url || null,
            region: config.region || null,
            departement: config.departement || null,
            commune: config.commune || null,
            chef_village: config.chef_village || null,
            updated_at: new Date().toISOString(),
          } as any);
        }
      } catch (dbErr) {
        console.warn("DB save failed, using localStorage only:", dbErr);
      }

      return true;
    } catch (err: any) {
      console.error("Error saving config:", err);
      setConfigError(err.message || "Erreur lors de la sauvegarde");
      return false;
    } finally {
      setConfigLoading(false);
    }
  }, [selectedVillage, config]);

  const uploadLogo = useCallback(async (file: MediaFile, villageName: string) => {
    setLogoLoading(true);
    try {
      const entityId = villageName.replace(/^(VILLAGE\s+DE\s+|VILLAGE\s+)/i, "").trim();
      const { assignMedia } = await import("../lib/mediaUtils");
      const { error } = await assignMedia(
        file.id,
        "foncier_village",
        entityId,
        "logo",
        `Logo — ${villageName}`
      );
      if (error) throw new Error(error);
      
      setLogoUrl(file.url);
      updateConfig({ logo_url: file.url });
    } catch (err: any) {
      console.error("Error uploading logo:", err);
      setConfigError(err.message || "Erreur lors de l'upload du logo");
    } finally {
      setLogoLoading(false);
    }
  }, [updateConfig]);

  const removeLogo = useCallback(() => {
    setLogoUrl(undefined);
    updateConfig({ logo_url: "" });
  }, [updateConfig]);

  return {
    // Village selection
    selectedVillage,
    setSelectedVillage,
    villageOptions,
    villageOptionsLoading,
    loadVillageOptions,
    // Config
    config,
    configLoading,
    configError,
    configLoaded,
    configLoadedVillage,
    loadConfig,
    updateConfig,
    saveConfig,
    setConfigError,
    // Logo
    logoUrl,
    setLogoUrl,
    logoLoading,
    uploadLogo,
    removeLogo,
  };
}