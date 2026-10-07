/**
 * Hook personnalisé pour la logique du module Paramètres
 * Sépare la logique métier du composant UI
 */

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useSettings } from "@/context/SettingsContext";
import { apiClient } from "@/api/client";
import { validateSettings } from "@/utils/validation";
import type { BrandSettings, ValidationError } from "@/types";

interface UseParametresReturn {
  form: BrandSettings;
  settings: BrandSettings;
  hasChanges: boolean;
  changedKeys: (keyof BrandSettings)[];
  saving: boolean;
  refreshing: boolean;
  loading: boolean;
  saveError: string | null;
  saved: boolean;
  showValidationWarnings: boolean;
  validationErrors: ValidationError[];
  releaseInfo: any;
  setForm: React.Dispatch<React.SetStateAction<BrandSettings>>;
  setShowValidationWarnings: React.Dispatch<React.SetStateAction<boolean>>;
  handleSave: () => Promise<void>;
  handleReset: () => void;
  handleReload: () => Promise<void>;
  handleChange: (field: keyof BrandSettings, value: string) => void;
}

const CACHE_KEYS = {
  DRAFT: "egs:settings:draft",
  RELEASE_INFO: "egs:release:info",
} as const;

const DRAFT_SAVE_DELAY = 1000; // ms

export function useParametres(): UseParametresReturn {
  const { settings, refreshSettings, updateSettings, loading: settingsLoading } = useSettings();
  
  const [form, setForm] = useState<BrandSettings>(() => {
    // Charger le brouillon depuis localStorage au montage
    if (typeof window !== "undefined") {
      try {
        const draft = localStorage.getItem(CACHE_KEYS.DRAFT);
        if (draft) {
          const parsed = JSON.parse(draft);
          return { ...settings, ...parsed };
        }
      } catch {
        // Ignore parse errors
      }
    }
    return settings;
  });

  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [showValidationWarnings, setShowValidationWarnings] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [releaseInfo, setReleaseInfo] = useState<any>(null);
  const draftSaveTimeoutRef = useRef<NodeJS.Timeout>();

  // Auto-save draft to localStorage with debounce
  useEffect(() => {
    if (draftSaveTimeoutRef.current) {
      clearTimeout(draftSaveTimeoutRef.current);
    }
    draftSaveTimeoutRef.current = setTimeout(() => {
      if (typeof window !== "undefined") {
        localStorage.setItem(CACHE_KEYS.DRAFT, JSON.stringify(form));
      }
    }, DRAFT_SAVE_DELAY);
    return () => {
      if (draftSaveTimeoutRef.current) {
        clearTimeout(draftSaveTimeoutRef.current);
      }
    };
  }, [form]);

  // Clear draft on successful save
  const clearDraft = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(CACHE_KEYS.DRAFT);
    }
  }, []);

  // Compute changed keys
  const changedKeys = useMemo(() => {
    return (Object.keys(form) as (keyof BrandSettings)[]).filter((key) => {
      const current = `${form[key] ?? ""}`;
      const original = `${settings[key] ?? ""}`;
      return current !== original;
    });
  }, [form, settings]);

  const hasChanges = changedKeys.length > 0;

  // Load release info
  useEffect(() => {
    let cancelled = false;
    const loadReleaseInfo = async () => {
      try {
        const cached = typeof window !== "undefined" 
          ? sessionStorage.getItem(CACHE_KEYS.RELEASE_INFO) 
          : null;
        if (cached) {
          setReleaseInfo(JSON.parse(cached));
          return;
        }
        const result = await apiClient.version();
        if (!cancelled && !result.error && result.data) {
          setReleaseInfo(result.data);
          sessionStorage.setItem(CACHE_KEYS.RELEASE_INFO, JSON.stringify(result.data));
        }
      } catch {
        // Silently fail
      }
    };
    loadReleaseInfo();
    return () => { cancelled = true; };
  }, []);

  // Warn before unload if unsaved changes
  useEffect(() => {
    if (!hasChanges) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
      return "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasChanges]);

  const handleSave = useCallback(async () => {
    if (!hasChanges) return;

    // Validate
    const validation = validateSettings(form);
    setValidationErrors(validation.errors);

    if (!validation.valid) {
      setShowValidationWarnings(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      const updates: Partial<BrandSettings> = {};
      changedKeys.forEach((key) => {
        updates[key] = form[key];
      });
      await updateSettings(updates);
      clearDraft();
      setSaved(true);
      setShowValidationWarnings(false);
      setValidationErrors([]);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue";
      setSaveError(`Échec de la sauvegarde: ${message}`);
      console.error("Erreur lors de la sauvegarde:", error);
    } finally {
      setSaving(false);
    }
  }, [hasChanges, form, changedKeys, updateSettings, clearDraft]);

  const handleReset = useCallback(() => {
    if (window.confirm("Réinitialiser tous les paramètres aux valeurs par défaut ?")) {
      setForm(settings);
      clearDraft();
      setValidationErrors([]);
      setShowValidationWarnings(false);
    }
  }, [settings, clearDraft]);

  // Keyboard shortcut: Ctrl+S / Cmd+S to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s" && hasChanges && !saving) {
        e.preventDefault();
        handleSave();
      }
      if (e.key === "Escape" && hasChanges) {
        handleReset();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasChanges, saving, handleSave, handleReset]);

  const handleReload = async () => {
    setRefreshing(true);
    try {
      await refreshSettings();
      setForm(settings);
      clearDraft();
    } finally {
      setRefreshing(false);
    }
  };

  const handleChange = useCallback((field: keyof BrandSettings, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear field error on change
    if (validationErrors.some((e) => e.field === field)) {
      setValidationErrors((prev) => prev.filter((e) => e.field !== field));
    }
  }, [validationErrors]);

  return {
    form,
    settings,
    hasChanges,
    changedKeys,
    saving,
    refreshing,
    loading: settingsLoading,
    saveError,
    saved,
    showValidationWarnings,
    validationErrors,
    releaseInfo,
    setForm,
    setShowValidationWarnings,
    handleSave,
    handleReset,
    handleReload,
    handleChange,
  };
}
