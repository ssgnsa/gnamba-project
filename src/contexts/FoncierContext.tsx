import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from "react";
import { foncierRepository } from "@/data/foncier.repository";
import { useFoncierState } from "@/hooks/foncier";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface VillageRef { id: string; nom: string }
interface LotissementRef { id: string; nom: string; village_id: string }
interface IlotRef { id: string; nom: string; lotissement_id: string }
interface VillageWithStats {
  id: string;
  nom: string;
  code: string;
  region?: string | null;
  departement?: string | null;
  commune?: string | null;
  chef_nom?: string | null;
  arrete_prefectoral?: string | null;
  arrete_date?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  logo_url?: string | null;
  config_jsonb?: Record<string, unknown> | null;
}

interface FoncierContextValue {
  // Données cascade (filtrées automatiquement)
  villages: VillageRef[];
  lotissements: LotissementRef[];
  ilots: IlotRef[];

  // Sélections
  selectedVillage: string | null;
  selectedLotissement: string | null;
  selectedIlot: string | null;

  // chargement hiérarchie (global, seulement au mount)
  loadingHierarchy: boolean;

  // Données enrichies (fetch au changement)
  villageFull: VillageWithStats | null;
  villageFullLoading: boolean;

  // Actions (avec reset cascade automatique)
  setVillage: (id: string | null) => void;
  setLotissement: (id: string | null) => void;
  setIlot: (id: string | null) => void;

  // Événements inter-formulaires
  publishEvent: (type: string, payload?: any) => void;
  on: (type: string, callback: (payload: any) => void) => void;

  // Refresh (communication montante)
  refreshVillages: () => Promise<void>;
  refreshLotissements: () => Promise<void>;
  refreshIlots: () => Promise<void>;

  // Exposition du hook parent (compat)
  state: ReturnType<typeof useFoncierState>;
}

// ─────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────

const FoncierContext = createContext<FoncierContextValue | null>(null);

function useEventListeners() {
  const listenersRef = useRef<Map<string, ((payload: any) => void)[]>>(new Map());

  const publishEvent = useCallback((type: string, payload?: any) => {
    const listeners = listenersRef.current.get(type) || [];
    listeners.forEach((listener) => listener(payload));
  }, []);

  const on = useCallback((type: string, callback: (payload: any) => void) => {
    if (!listenersRef.current.has(type)) listenersRef.current.set(type, []);
    listenersRef.current.get(type)!.push(callback);
  }, []);

  const off = useCallback((type: string, callback: (payload: any) => void) => {
    if (!listenersRef.current.has(type)) return;
    listenersRef.current.set(
      type,
      listenersRef.current.get(type)!.filter((l) => l !== callback)
    );
  }, []);

  return { publishEvent, on, off };
}

// ─────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────

export function FoncierProvider({ children }: { children: ReactNode }) {
  const state = useFoncierState();

  const [villages, setVillages] = useState<VillageRef[]>([]);
  const [lotissements, setLotissements] = useState<LotissementRef[]>([]);
  const [ilots, setIlots] = useState<IlotRef[]>([]);

  const [selectedVillage, setSelectedVillage] = useState<string | null>(null);
  const [selectedLotissement, setSelectedLotissement] = useState<string | null>(null);
  const [selectedIlot, setSelectedIlot] = useState<string | null>(null);

  const [villageFull, setVillageFull] = useState<VillageWithStats | null>(null);
  const [villageFullLoading, setVillageFullLoading] = useState(false);

  // Nouvel : état de chargement hiérarchie (global, mount seulement)
  const [loadingHierarchy, setLoadingHierarchy] = useState(false);

  // Nouvel : mécanisme d'événements inter-formulaires
  const { publishEvent, on } = useEventListeners();

  // Nouvel : stockage des abonnements (pour cleanup)
  const eventListeners = useRef<Map<string, ((payload: any) => void)[]>>(new Map());

  // ─── Load hierarchy centralisée (mount initial) ───
  useEffect(() => {
    if (loadingHierarchy) return; // déjà en cours
    setLoadingHierarchy(true);
    ;(async () => {
      try {
        // 1. Villages
        const villagesRes = await foncierRepository.getVillagesList();
        if (!villagesRes.error && villagesRes.data) {
          setVillages(villagesRes.data.map((v: any) => ({ id: v.id, nom: v.nom })));
        }

        // 2. Lotissements (filtrés par village sélectionné au moment du chargement)
        const effectiveVillage = selectedVillage || undefined;
        const lotissementsRes = await foncierRepository.getLotissements();
        if (!lotissementsRes.error && lotissementsRes.data && effectiveVillage) {
          setLotissements(
            lotissementsRes.data
              .filter((l: any) => l.village_id === effectiveVillage)
              .map((l: any) => ({ id: l.id, nom: l.nom, village_id: l.village_id }))
          );
        } else {
          setLotissements(effectiveVillage ? [] : []);
        }

        // 3. Îlots (filtrés par lotissement sélectionné)
        const effectiveLotissement = selectedLotissement || undefined;
        const ilotsRes = await foncierRepository.getIlots();
        if (!ilotsRes.error && ilotsRes.data && effectiveLotissement) {
          setIlots(
            ilotsRes.data
              .filter((i: any) => i.lotissement_id === effectiveLotissement)
              .map((i: any) => ({
                id: i.id,
                nom: i.numero || i.nom,
                lotissement_id: i.lotissement_id,
              }))
          );
        } else {
          setIlots(effectiveLotissement ? [] : []);
        }

        // Événement : hiérarchie chargée
        publishEvent("hierarchy:loaded", {
          villageCount: villages.length,
          lotissementCount: lotissements.length,
          ilotCount: ilots.length,
        });
      } catch (err) {
        console.error("Erreur chargement hiérarchie foncière :", err);
      } finally {
        setLoadingHierarchy(false);
      }
    })();
  }, [loadingHierarchy, selectedVillage, selectedLotissement]);

  // ─── Cascade automatique (inchangé) ───
  const setVillage = useCallback((id: string | null) => {
    setSelectedVillage(id);
    setSelectedLotissement(null);
    setSelectedIlot(null);
    setLotissements([]);
    setIlots([]);
  }, []);

  const setLotissement = useCallback((id: string | null) => {
    setSelectedLotissement(id);
    setSelectedIlot(null);
    setIlots([]);
  }, []);

  const setIlot = useCallback((id: string | null) => {
    setSelectedIlot(id);
  }, []);

  // ─── Écouteurs d'événements (persistants) ───
  useEffect(() => {
    // Aucun listener global requis pour l'instant — le mécanisme
    // est destiné aux formulaires fils qui s'enregistrent via useFoncier().
    return () => {
      // Nettoyage optionnel futur
    };
  }, []);

  // ─── Effets de rafraîchissement (remplacent anciens refresh séparés) ───
  useEffect(() => { void refreshVillages(); }, [refreshVillages]);
  useEffect(() => { void refreshLotissements(); }, [refreshLotissements]);
  useEffect(() => { void refreshIlots(); }, [refreshIlots]);

  // ─── Valeur du contexte ───
  const value = useMemo<FoncierContextValue>(() => ({
    villages,
    lotissements,
    ilots,
    selectedVillage,
    selectedLotissement,
    selectedIlot,
    loadingHierarchy,
    villageFull,
    villageFullLoading,
    setVillage,
    setLotissement,
    setIlot,
    publishEvent,
    on,
    refreshVillages,
    refreshLotissements,
    refreshIlots,
    state,
  }), [
    villages,
    lotissements,
    ilots,
    selectedVillage,
    selectedLotissement,
    selectedIlot,
    loadingHierarchy,
    villageFull,
    villageFullLoading,
    setVillage,
    setLotissement,
    setIlot,
    publishEvent,
    on,
    refreshVillages,
    refreshLotissements,
    refreshIlots,
    state,
  ]);

  return <FoncierContext.Provider value={value}>{children}</FoncierContext.Provider>;
}

// ─────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────

export function useFoncier(): FoncierContextValue {
  const ctx = useContext(FoncierContext);
  if (!ctx) throw new Error("useFoncier must be used within <FoncierProvider>");
  return ctx;
}