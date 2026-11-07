import { useCallback, useEffect, useMemo, useState } from "react";
import FoncierVillages from "./FoncierVillages";
import {
  Settings2,
  History,
  FileText,
  RefreshCw,
  CheckCircle,
  Files,
  Printer,
  Plus,
  MapPin,
} from "lucide-react";
import { apiClient } from "../api/client";
import { useSettings } from "../context/SettingsContext";
import { useAuth, resolveAccessLevel } from "../context/AuthContext";
import { useFoncierState } from "../hooks/foncier";
import { foncierRepository } from "@/data/foncier.repository";
import type { FoncierLot } from "@/types";
import {
  LotTable,
  LotFormModal,
  LotissementFormModal,
  AttestationModal,
  AttestationHistoryModal,
  ConfigModal,
  AuditModal,
} from "../components/foncier/parts";
import WorkflowValidation from "../components/foncier/WorkflowValidation";
export default function Foncier() {
  const { settings } = useSettings();
  const { profile } = useAuth();
  const accessLevel = resolveAccessLevel(profile?.role, profile?.access_level);
  const canManage =
    accessLevel === "admin" ||
    accessLevel === "gestionnaire" ||
    accessLevel === "gerant" ||
    accessLevel === "secretaire";

  // Use the new composite hook
  const state = useFoncierState();

  // Extract everything from state for easier access
  const {
    lots,
    villageStats,
    villageOptions,
    page,
    pageSize,
    totalPages,
    setPage,
    search,
    setSearch,
    debouncedSearch,
    filterStatut,
    setFilterStatut,
    filterVillage,
    setFilterVillage,
    showArchived,
    setShowArchived,
    loading,
    fetchData,
    loadCachedLots,
    refreshQueueCount,
    selectedVillage,
    setSelectedVillage,
    villageOptionsLoading,
    config,
    configLoading,
    deviceId,
    isOnline,
    syncing,
    syncPending,
    modalOpen,
    setModalOpen,
    editingId,
    form,
    saving,
    configModalOpen,
    setConfigModalOpen,
    activeTab,
    setActiveTab,
    pageError,
    setPageError,
    attestationModalOpen,
    setAttestationModalOpen,
    attestationLot,
    setAttestationLot,
    attestationSaving,
    setAttestationError,
    workflowModalOpen,
    setWorkflowModalOpen,
    workflowSelectedLot,
    attestationHistoryOpen,
    setAttestationHistoryOpen,
    attestationHistoryLot,
    setAttestationHistoryLot,
    attestationHistoryLoading,
    setAttestationHistoryRecords,
    setAttestationHistoryScans,
    setAttestationForm,
    auditModalOpen,
    setAuditModalOpen,
    auditLoading,
    searchInputRef,
    openAdd,
    openEdit,
    openAttestation,
    openWorkflow,
    openAttestationHistory,
    openConfig,
    openAudit,
    handleArchive,
    handleRestore,
    handlePrintAttestation,
    handlePrintAttestationAnnex,
  } = state;

  // Villages (objets) pour le select de création de lotissement (value = id, label = nom)
  const [lotissements, setLotissements] = useState<{ id: string; nom: string; code?: string }[]>([]);
  const [lotissementModalOpen, setLotissementModalOpen] = useState(false);
  const [loadingLotissements, setLoadingLotissements] = useState(false);

  // Hiérarchie Village → Lotissement → Îlot → Lot
  const [selectedLotissement, setSelectedLotissement] = useState<string | null>(null);
  const [selectedIlot, setSelectedIlot] = useState<string | null>(null);

  // Données pour les selects en cascade du formulaire de création de lot
  const [lotVillages, setLotVillages] = useState<{ id: string; nom: string }[]>([]);
  const [lotLotissements, setLotLotissements] = useState<{
    id: string;
    nom: string;
    village_id: string;
  }[]>([]);
  const [lotIlots, setLotIlots] = useState<{ id: string; nom: string; lotissement_id: string }[]>([]);
  const [lotHierarchyLoading, setLotHierarchyLoading] = useState(false);

  const loadLotHierarchy = useCallback(async () => {
    setLotHierarchyLoading(true);
    try {
      const villagesResult = await foncierRepository.getVillagesList();
      if (villagesResult.error) throw villagesResult.error;
      const villages = (villagesResult.data ?? []).map((v) => ({
        id: v.id,
        nom: v.nom,
      }));
      setLotVillages(villages);

      const [lotissementsResult, ilotsResult] = await Promise.all([
        foncierRepository.getLotissements(),
        foncierRepository.getIlots(),
      ]);
      if (lotissementsResult.error) throw lotissementsResult.error;
      if (ilotsResult.error) throw ilotsResult.error;
      setLotLotissements(
        (lotissementsResult.data ?? []).map((l) => ({
          id: l.id,
          nom: l.nom,
          village_id: l.village_id,
        })),
      );
      setLotIlots(
        (ilotsResult.data ?? []).map((i) => ({
          id: i.id,
          nom: i.nom,
          lotissement_id: i.lotissement_id,
        })),
      );
    } catch (err) {
      console.error("Error loading lot hierarchy:", err);
    } finally {
      setLotHierarchyLoading(false);
    }
  }, []);

  // Options de lotissements et îlots dérivées des lots chargés (filtrage côté client,
  // searchLots ne supportant pas le filtrage par lotissement_id / ilot_id côté serveur).
  const lotissementOptions = useMemo(() => {
    if (!selectedVillage) return [];
    const set = new Set<string>();
    lots.forEach((lot) => {
      if (lot.village === selectedVillage && lot.nom_lotissement) set.add(lot.nom_lotissement);
    });
    return Array.from(set).sort().map((nom) => ({ nom, id: nom }));
  }, [lots, selectedVillage]);

  const ilotOptions = useMemo(() => {
    if (!selectedVillage || !selectedLotissement) return [];
    const set = new Set<string>();
    lots.forEach((lot) => {
      if (
        lot.village === selectedVillage &&
        lot.nom_lotissement === selectedLotissement &&
        lot.numero_ilot
      ) {
        set.add(lot.numero_ilot);
      }
    });
    return Array.from(set).sort().map((numero) => ({ nom: `Îlot ${numero}`, id: numero }));
  }, [lots, selectedVillage, selectedLotissement]);

  // Reset les enfants quand un parent change (cascade)
  useEffect(() => {
    setSelectedLotissement(null);
    setSelectedIlot(null);
  }, [selectedVillage]);

  useEffect(() => {
    setSelectedIlot(null);
  }, [selectedLotissement]);

  const reloadVillages = async () => {
    setLoadingLotissements(true);
    try {
      const result = await foncierRepository.getVillages();
      if (result.error) throw result.error;
      setLotissements((result.data ?? []).map((v) => ({
        id: v.id,
        nom: v.nom,
        code: v.code,
      })));
    } catch (err) {
      console.error("Error loading villages for lotissement modal:", err);
    } finally {
      setLoadingLotissements(false);
    }
  };

  useEffect(() => {
    void reloadVillages();
  }, []);

  // Lots filtrés par la hiérarchie Village → Lotissement → Îlot (côté client)
  const filteredLots = useMemo(() => {
    let filtered = lots;
    if (selectedVillage) {
      filtered = filtered.filter((lot) => lot.village === selectedVillage);
    }
    if (selectedLotissement) {
      filtered = filtered.filter((lot) => lot.nom_lotissement === selectedLotissement);
    }
    if (selectedIlot) {
      filtered = filtered.filter((lot) => lot.numero_ilot === selectedIlot);
    }
    return filtered;
  }, [lots, selectedVillage, selectedLotissement, selectedIlot]);

  const handlePrintAttestationPdf = async (lot: FoncierLot) => {
    const token = apiClient.getStoredLocalAuthToken();
    if (!token) {
      alert("Vous devez être connecté pour imprimer le PDF.");
      return;
    }
    try {
      const res = await fetch(
        `/api/v1/foncier/attestations/${lot.id}/pdf`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.ok) {
        throw new Error(`Échec de l'impression (${res.status})`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `attestation-${lot.reference || lot.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Print PDF error:", err);
      alert("Impossible d'imprimer le PDF de l'attestation.");
    }
  };

  useEffect(() => {
    void loadCachedLots();
    void refreshQueueCount();
    void fetchData();
    void loadLotHierarchy();
  }, [fetchData, loadCachedLots, refreshQueueCount]);

  // Online/offline handlers (sync hook handles its own, but we need to trigger data refresh)
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || target?.isContentEditable) return;
      if (event.ctrlKey && event.key.toLowerCase() === "n") {
        event.preventDefault();
        if (canManage) void openAdd();
      }
      if (event.ctrlKey && event.key.toLowerCase() === "f") {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [canManage, openAdd, searchInputRef]);

  // Update attestation hook with deviceId from sync (if needed)
  // This is handled internally by the hooks

  // Render
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl" style={{ backgroundColor: settings.primary_color || "#1e3a5f" }}>
                <Files size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Gestion Foncière</h1>
                <p className="text-sm text-gray-500">Lots, villages, attestations et workflow de validation</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Online status */}
              {isOnline ? (
                <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  En ligne
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Hors ligne
                </span>
              )}
              
              {/* Sync indicator */}
              {syncPending > 0 && (
                <span className="inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                  <RefreshCw size={12} className={syncing ? "animate-spin" : ""} />
                  {syncPending} en attente
                </span>
              )}
              
              {/* Config button */}
              <button
                onClick={() => setActiveTab("config")}
                className="p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                title="Configuration des villages"
              >
                <Settings2 size={20} />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-t border-gray-100">
            <nav className="flex gap-1 pb-2" role="tablist">
              {[
                { id: "lots", label: "Lots", icon: Files },
                { id: "villages", label: "Villages", icon: Files },
                { id: "attestations", label: "Attestations", icon: FileText },
                { id: "workflow", label: "Validation", icon: CheckCircle },
                { id: "config", label: "Configuration", icon: Settings2 },
                { id: "audit", label: "Audit", icon: History },
              ].map((tab) => (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page error */}
        {pageError && (
          <div
            role="alert"
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center justify-between"
          >
            <span>{pageError}</span>
            <button onClick={() => setPageError(null)} className="text-red-500 hover:text-red-700">✕</button>
          </div>
        )}

        {/* Tab: Lots */}
        {activeTab === "lots" && (
          <>
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={() => { void reloadVillages(); setLotissementModalOpen(true); }}
              disabled={!canManage || !isOnline || !selectedVillage}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-white shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: settings.primary_color || "#1e3a5f" }}
              title={!canManage ? "Droits insuffisants" : !isOnline ? "Hors ligne : création indisponible" : undefined}
            >
              <Plus size={16} /> Nouveau Lotissement
            </button>
          </div>
          {/* Filtrage hiérarchique Village → Lotissement → Îlot (côté client) */}
          <LotTable
            lots={filteredLots}
            loading={loading}
            totalCount={filteredLots.length}
            page={page}
            pageSize={pageSize}
            totalPages={totalPages}
            search={search}
            setSearch={setSearch}
            filterStatut={filterStatut}
            setFilterStatut={setFilterStatut}
            filterVillage={filterVillage}
            setFilterVillage={setFilterVillage}
            showArchived={showArchived}
            setShowArchived={setShowArchived}
            setPage={setPage}
            debouncedSearch={debouncedSearch}
            villageOptions={villageOptions}
            villageStats={villageStats}
            isOnline={isOnline}
            canManage={canManage}
            profile={profile}
            accessLevel={accessLevel}
            settings={settings}
            onOpenAdd={openAdd}
            onOpenAttestation={openAttestation}
            onOpenWorkflow={openWorkflow}
            onPrintAttestation={handlePrintAttestation}
            onPrintAttestationAnnex={handlePrintAttestationAnnex}
            onOpenAttestationHistory={openAttestationHistory}
            onOpenEdit={openEdit}
            onHandleArchive={handleArchive}
            onHandleRestore={handleRestore}
            searchInputRef={searchInputRef}
            selectedVillage={selectedVillage}
            selectedLotissement={selectedLotissement}
            setSelectedLotissement={setSelectedLotissement}
            selectedIlot={selectedIlot}
            setSelectedIlot={setSelectedIlot}
            lotissementOptions={lotissementOptions}
            ilotOptions={ilotOptions}
          />
          </>
        )}
        {/* Tab: Villages */}
        {activeTab === "villages" && (
          <FoncierVillages />
        )}
        {/* Tab: Attestations */}
        {activeTab === "attestations" && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Gestion des attestations</h3>
                  <p className="text-sm text-gray-500">Consultez, imprimez et vérifiez les attestations de chaque lot.</p>
                </div>
                <button
                  onClick={() => setActiveTab("lots")}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Voir les lots
                </button>
              </div>

              {lots.length === 0 ? (
                <div className="text-sm text-gray-500">Aucune attestation disponible pour le moment.</div>
              ) : (
                <div className="space-y-3">
                  {lots.slice(0, 8).map((lot) => (
                    <div key={lot.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
                      <div>
                        <div className="font-medium text-gray-900">{lot.reference}</div>
                        <div className="text-sm text-gray-500">{lot.numero_lot} · {lot.village}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openAttestation(lot)}
                          className="px-3 py-2 text-sm rounded-lg border border-gray-200 text-gray-700 hover:bg-white"
                        >
                          Nouvelle attestation
                        </button>
                        <button
                          onClick={() => openAttestationHistory(lot)}
                          className="px-3 py-2 text-sm rounded-lg border border-gray-200 text-gray-700 hover:bg-white"
                          aria-label="Voir l'historique"
                        >
                          Voir l'historique
                        </button>
                        <button
                          onClick={() => handlePrintAttestation(lot)}
                          className="px-3 py-2 text-sm rounded-lg border border-gray-200 text-gray-700 hover:bg-white"
                        >
                          Imprimer
                        </button>
                        <button
                          onClick={() => handlePrintAttestationPdf(lot)}
                          className="px-3 py-2 text-sm rounded-lg border border-gray-200 text-gray-700 hover:bg-white"
                          aria-label="Imprimer le PDF"
                        >
                          <Printer size={14} /> PDF
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab: Workflow */}
        {activeTab === "workflow" && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Workflow de validation</h3>
                  <p className="text-sm text-gray-500">Soumission, validation du Chef de village et scan original.</p>
                </div>
                <button
                  onClick={() => setActiveTab("lots")}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  Voir les lots
                </button>
              </div>

              {lots.length === 0 ? (
                <div className="text-sm text-gray-500">Aucun lot disponible pour le workflow de validation.</div>
              ) : (
                <div className="space-y-3">
                  {lots.slice(0, 8).map((lot) => (
                    <div key={lot.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
                      <div>
                        <div className="font-medium text-gray-900">{lot.reference}</div>
                        <div className="text-sm text-gray-500">{lot.numero_lot} · {lot.village}</div>
                      </div>
                      <button
                        onClick={() => openWorkflow(lot.id)}
                        className="px-3 py-2 text-sm rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                        aria-label="Ouvrir la validation"
                      >
                        Valider ce lot
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab: Config */}
        {activeTab === "config" && (
          <div className="space-y-6">
            {/* Village selector */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuration du village</h3>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Village</label>
                  <select
                    value={selectedVillage}
                    onChange={(e) => setSelectedVillage(e.target.value)}
                    disabled={villageOptionsLoading}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner un village</option>
                    {villageOptions.map((v) => (
                      <option key={v} value={v}>
                        {v} ({villageStats[v]?.count || 0} lots)
                      </option>
                    ))}
                  </select>
                  {villageOptionsLoading && (
                    <p className="text-xs text-gray-500 mt-1">Chargement des villages...</p>
                  )}
                </div>
                <button
                  onClick={() => {
                    if (villageOptions.length === 0) {
                      openConfig("");
                      return;
                    }
                    openConfig(selectedVillage || villageOptions[0]);
                  }}
                  disabled={!canManage}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Settings2 size={16} /> Configurer
                </button>
                {villageOptions.length === 0 && (
                  <p className="mt-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5">
                    Aucun village enregistré. Créez un village d'abord.
                  </p>
                )}
              </div>
            </div>

            {/* Config modal handles the rest */}
          </div>
        )}

        {/* Tab: Audit */}
        {activeTab === "audit" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <History size={20} /> Journal d'audit foncier
              </h3>
              <button
                onClick={openAudit}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 flex items-center gap-2"
              >
                <History size={16} /> Ouvrir l'historique complet
              </button>
            </div>
            <p className="text-gray-500">L'historique complet des actions est disponible dans la modale d'audit.</p>
          </div>
        )}

        {/* Modals */}
        {/* Lot Form Modal */}
        <LotFormModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSuccess={fetchData}
          initialData={editingId ? form : undefined}
          isLoading={saving}
          villages={lotVillages}
          lotissements={lotLotissements}
          ilots={lotIlots}
          selectedVillage={selectedVillage || undefined}
          selectedLotissement={selectedLotissement || undefined}
          selectedIlot={selectedIlot || undefined}
          onIlotCreated={() => { void loadLotHierarchy(); }}
        />

        {/* Attestation Modal */}
        <AttestationModal
          isOpen={attestationModalOpen}
          onClose={() => {
            setAttestationModalOpen(false);
            setAttestationLot(null);
            setAttestationForm({});
            setAttestationError(null);
          }}
          onSuccess={fetchData}
          lot={attestationLot}
          isLoading={attestationSaving}
          villageConfig={config}
          profile={profile}
          isOnline={isOnline}
          canManage={canManage}
          _accessLevel={accessLevel}
          deviceId={deviceId}
        />

        {/* Attestation History Modal */}
        <AttestationHistoryModal
          isOpen={attestationHistoryOpen}
          onClose={() => {
            setAttestationHistoryOpen(false);
            setAttestationHistoryLot(null);
            setAttestationHistoryRecords([]);
            setAttestationHistoryScans({});
          }}
          lot={attestationHistoryLot}
          isLoading={attestationHistoryLoading}
          profile={profile}
          _accessLevel={accessLevel}
          canManage={canManage}
          isOnline={isOnline}
        />

        {/* Config Modal */}
        <ConfigModal
          isOpen={configModalOpen}
          onClose={() => setConfigModalOpen(false)}
          onSuccess={fetchData}
          selectedVillage={selectedVillage}
          initialConfig={config}
          isLoading={configLoading}
          accessLevel={accessLevel}
          profile={profile}
          canManage={canManage}
          isOnline={isOnline}
        />

        {/* Workflow Modal */}
        <div>
          {workflowModalOpen && workflowSelectedLot && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="relative w-full max-w-3xl mx-4 sm:mx-0 max-h-[90vh] overflow-y-auto">
                <div className="bg-white rounded-lg shadow-lg w-full">
                  <div className="flex items-center justify-between p-4 border-b rounded-t-lg">
                    <h3 className="text-lg font-semibold text-gray-900">Workflow de Validation</h3>
                    <button onClick={() => setWorkflowModalOpen(false)} className="text-gray-500 hover:text-gray-700 text-2xl leading-none">×</button>
                  </div>
                  <div className="p-4">
                    <WorkflowValidation
                      lotId={workflowSelectedLot}
                      userName={profile?.full_name ?? undefined}
                      isAdmin={profile?.role === "admin"}
                      isOnline={isOnline}
                      onWorkflowComplete={() => {
                        setWorkflowModalOpen(false);
                        void fetchData();
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Audit Modal */}
        <AuditModal
          isOpen={auditModalOpen}
          onClose={() => setAuditModalOpen(false)}
          isLoading={auditLoading}
          accessLevel={accessLevel}
          profile={profile}
          canManage={canManage}
        />

        {/* Lotissement creation modal */}
        <LotissementFormModal
          isOpen={lotissementModalOpen}
          onClose={() => setLotissementModalOpen(false)}
          onSuccess={() => {
            setLotissementModalOpen(false);
            void fetchData();
          }}
          villages={lotissements}
          isLoading={loading || loadingLotissements}
        />
      </main>
    </div>
  );
}
