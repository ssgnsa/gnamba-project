import { useMemo } from "react";
import {
  Plus,
  Search,
  Printer,
  FileText,
  History,
  Archive,
  RotateCcw,
  CheckCircle,
  Files,
  Edit
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import { FoncierLot } from "@/types";
import { formatMontant } from "@/utils/reference";

interface LotTableProps {
  lots: FoncierLot[];
  loading: boolean;
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  search: string;
  setSearch: (search: string) => void;
  filterStatut: string;
  setFilterStatut: (statut: string) => void;
  filterVillage: string;
  setFilterVillage: (village: string) => void;
  showArchived: boolean;
  setShowArchived: (show: boolean) => void;
  setPage: (page: number) => void;
  debouncedSearch: string;
  villageOptions: string[];
  villageStats: Record<string, { total: number; count: number }>;
  isOnline: boolean;
  canManage: boolean;
  settings: { primary_color?: string | null };
  onOpenAdd: () => void;
  onOpenAttestation: (lot: FoncierLot) => void;
  onOpenWorkflow: (lotId: string) => void;
  onPrintAttestation: (lot: FoncierLot) => void;
  onPrintAttestationAnnex: (lot: FoncierLot) => void;
  onOpenAttestationHistory: (lot: FoncierLot) => void;
  onOpenEdit: (lot: FoncierLot) => void;
  onHandleArchive: (lot: FoncierLot) => void;
  onHandleRestore: (lot: FoncierLot) => void;
  searchInputRef: React.RefObject<HTMLInputElement>;
  profile?: { role?: string; access_level?: string | number | null } | null;
  accessLevel?: string;
}

const disabledButtonClass = "disabled:opacity-50 disabled:cursor-not-allowed";

export function LotTable({
  lots,
  loading,
  totalCount,
  page,
  totalPages,
  search,
  setSearch,
  filterStatut,
  setFilterStatut,
  filterVillage,
  setFilterVillage,
  showArchived,
  setShowArchived,
  setPage,
  debouncedSearch,
  villageOptions,
  villageStats,
  isOnline,
  canManage,
  settings,
  onOpenAdd,
  onOpenAttestation,
  onOpenWorkflow,
  onPrintAttestation,
  onPrintAttestationAnnex,
  onOpenAttestationHistory,
  onOpenEdit,
  onHandleArchive,
  onHandleRestore,
  searchInputRef,
}: LotTableProps) {
  const statutConfig = {
    actif: { label: "Actif", color: "green" as const },
    vendu: { label: "Vendu", color: "blue" as const },
    litige: { label: "Litige", color: "red" as const },
    reserve: { label: "Réservé", color: "orange" as const },
    annule: { label: "Annulé", color: "gray" as const },
  };

  const getPrixM2 = (lot: FoncierLot) => {
    if (lot.prix_cession && lot.superficie) {
      return formatMontant(lot.prix_cession / lot.superficie) + "/m²";
    }
    return "—";
  };

  const displayedLots = useMemo(() => {
    if (loading) return [];
    return lots;
  }, [lots, loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: settings.primary_color || "#1e3a5f" }} />
      </div>
    );
  }

  if (displayedLots.length === 0 && !debouncedSearch && !filterStatut && !filterVillage) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <FileText size={48} className="mb-2 opacity-50" />
        <p className="text-sm">Aucun lot foncier trouvé.</p>
        <p className="text-xs mt-1">Commencez par créer un village dans l'onglet <strong>Configuration</strong>.</p>
      </div>
    );
  }

  if (displayedLots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <Search size={48} className="mb-2 opacity-50" />
        <p className="text-sm">Aucun lot ne correspond à vos critères de recherche.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenAdd}
            disabled={!canManage}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-white shadow-sm transition-colors ${disabledButtonClass}`}
            style={{ backgroundColor: settings.primary_color || "#1e3a5f" }}
          >
            <Plus size={16} /> Nouveau Lot
          </button>

          <div className="relative hidden sm:block">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Rechercher (réf, lot, lotissement, village, propriétaire)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-2 w-64 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none bg-white"
          >
            <option value="">Tous statuts</option>
            <option value="actif">Actif</option>
            <option value="vendu">Vendu</option>
            <option value="litige">Litige</option>
            <option value="reserve">Réservé</option>
            <option value="annule">Annulé</option>
          </select>

          <select
            value={filterVillage}
            onChange={(e) => setFilterVillage(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none bg-white"
          >
            <option value="">Tous villages</option>
            {villageOptions.map((v) => (
              <option key={v} value={v}>
                {v} ({villageStats[v]?.count || 0})
              </option>
            ))}
          </select>

          <label className="inline-flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Afficher archivés
          </label>
        </div>

        <div className="flex items-center gap-2">
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
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full egs-table">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 sticky top-0">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Référence</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">N° Lot</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Lotissement</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Village</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Propriétaire</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Superficie</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden xl:table-cell">Prix/m²</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Statut</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {displayedLots.map((lot) => {
              const isArchived = !!lot.deleted_at;
              const st = statutConfig[lot.statut || "actif"] || { label: lot.statut || "Actif", color: "gray" as const };
              const prixM2 = getPrixM2(lot);

              return (
                <tr key={lot.id} className={isArchived ? "bg-gray-50 opacity-60" : "hover:bg-gray-50"} >
                  <td className="px-4 py-3 table-key">{lot.reference}</td>
                  <td className="px-4 py-3 font-mono text-sm text-gray-700">{lot.numero_lot}</td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-700">{lot.nom_lotissement}</span>
                    {lot.numero_ilot && (
                      <span className="ml-1 text-xs text-gray-400">(Îlot {lot.numero_ilot})</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{lot.village}</td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-sm text-gray-700">
                      {lot.proprietaire_prenom} {lot.proprietaire_nom}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 hidden lg:table-cell">
                    {lot.superficie ? `${lot.superficie} m²` : "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 hidden xl:table-cell">
                    {prixM2}
                  </td>
                  <td className="px-4 py-3">
                    <Badge label={st.label} color={st.color} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => onOpenAttestation(lot)}
                        disabled={!canManage || isArchived}
                        title={
                          !canManage
                            ? "Accès réservé"
                            : isArchived
                              ? "Lot archivé"
                              : "Attestation Coutumière"
                        }
                        aria-label={
                          !canManage
                            ? "Accès réservé"
                            : isArchived
                              ? "Lot archivé"
                              : "Attestation coutumière"
                        }
                        className={`p-1.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors ${disabledButtonClass}`}
                      >
                        <FileText size={15} />
                      </button>
                      <button
                        onClick={() => onOpenWorkflow(lot.id)}
                        disabled={!canManage || isArchived}
                        title={
                          !canManage
                            ? "Accès réservé"
                            : isArchived
                              ? "Lot archivé"
                              : "Validation Chef"
                        }
                        aria-label={
                          !canManage
                            ? "Accès réservé"
                            : isArchived
                              ? "Lot archivé"
                              : "Validation Chef"
                        }
                        className={`p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors ${disabledButtonClass}`}
                      >
                        <CheckCircle size={15} />
                      </button>
                      <button
                        onClick={() => onPrintAttestation(lot)}
                        title="Imprimer attestation officielle"
                        aria-label="Imprimer attestation officielle"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                      >
                        <Printer size={15} />
                      </button>
                      <button
                        onClick={() => onPrintAttestationAnnex(lot)}
                        title="Imprimer annexe technique (GPS, limites, témoins)"
                        aria-label="Imprimer annexe technique"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                      >
                        <Files size={15} />
                      </button>
                      <button
                        onClick={() => onOpenAttestationHistory(lot)}
                        disabled={!canManage || isArchived}
                        title={
                          !canManage
                            ? "Accès réservé"
                            : isArchived
                              ? "Lot archivé"
                              : "Historique attestations"
                        }
                        aria-label={
                          !canManage
                            ? "Accès réservé"
                            : isArchived
                              ? "Lot archivé"
                              : "Historique attestations"
                        }
                        className={`p-1.5 rounded-lg text-gray-400 hover:text-slate-600 hover:bg-slate-50 transition-colors ${disabledButtonClass}`}
                      >
                        <History size={15} />
                      </button>
                      <button
                        onClick={() => onOpenEdit(lot)}
                        disabled={!canManage || isArchived}
                        title={
                          !canManage
                            ? "Accès réservé"
                            : isArchived
                              ? "Lot archivé"
                              : "Modifier"
                        }
                        aria-label={
                          !canManage
                            ? "Accès réservé"
                            : isArchived
                              ? "Lot archivé"
                              : "Modifier"
                        }
                        className={`p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors ${disabledButtonClass}`}
                      >
                        <Edit size={15} />
                      </button>
                      {isArchived ? (
                        <button
                          onClick={() => onHandleRestore(lot)}
                          disabled={!canManage}
                          title={!canManage ? "Accès réservé" : "Restaurer"}
                          aria-label={!canManage ? "Accès réservé" : "Restaurer"}
                          className={`p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors ${disabledButtonClass}`}
                        >
                          <RotateCcw size={15} />
                        </button>
                      ) : (
                        <button
                          onClick={() => onHandleArchive(lot)}
                          disabled={!canManage}
                          title={!canManage ? "Accès réservé" : "Archiver"}
                          aria-label={!canManage ? "Accès réservé" : "Archiver"}
                          className={`p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors ${disabledButtonClass}`}
                        >
                          <Archive size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!loading && lots.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-gray-500">
          <div>
            Total:{" "}
            <span className="font-medium text-gray-700">{totalCount}</span> lots
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className={`px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors ${disabledButtonClass}`}
            >
              Précédent
            </button>
            <span className="text-gray-600">
              Page {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className={`px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors ${disabledButtonClass}`}
            >
              Suivant
            </button>
          </div>
        </div>
      )}
    </div>
  );
}