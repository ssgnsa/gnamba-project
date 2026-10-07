import type { FC } from 'react';
import { useFoncierLotOperations } from '@/hooks/useFoncierLotOperations';
import type { FoncierLot } from '@/types';

interface FoncierLotListProps {
  lots: FoncierLot[];
  onEdit: (lot: FoncierLot) => void;
  onArchive: (lot: FoncierLot) => void;
  onRestore: (lot: FoncierLot) => void;
  onOpenAttestation: (lot: FoncierLot) => void;
  onCreate: () => void;
  canManage: boolean;
}

const Icon: FC<{ label: string; className?: string }> = ({ label, className }) => (
  <span className={className} aria-hidden="true">
    {label}
  </span>
);

export const FoncierLotList: FC<FoncierLotListProps> = ({
  lots,
  onEdit,
  onArchive,
  onRestore,
  onOpenAttestation,
  onCreate,
  canManage,
}) => {
  const {
    loading,
    search,
    setSearch,
    filterStatut,
    setFilterStatut,
    filterVillage,
    setFilterVillage,
    showArchived,
    setShowArchived,
    page,
    setPage,
    pageSize,
    villageStats,
    statsLoading,
    statsError,
    applyLocalFilters,
  } = useFoncierLotOperations(lots);

  const { paged, total } = applyLocalFilters(lots);
  const totalPages = pageSize > 0 ? Math.ceil(total / pageSize) : 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-white">Liste des lots fonciers</h2>
          <p className="text-sm text-white/60">
            {total} lot{total !== 1 ? 's' : ''} trouvé{total !== 1 ? 's' : ''}
          </p>
        </div>

        {canManage && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCreate}
              className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Icon label="+" className="mr-2 h-4 w-4" />
              Nouveau lot
            </button>
          </div>
        )}
      </div>

      <div className="bg-white/5 rounded-lg p-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-white mb-1">Recherche</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="Référence, lot, propriétaire..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-1">Village</label>
            <select
              value={filterVillage}
              onChange={(e) => setFilterVillage(e.target.value)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              <option value="">Tous les villages</option>
              <option value="Abidjan">Abidjan</option>
              <option value="Bouaké">Bouaké</option>
              <option value="Daloa">Daloa</option>
              <option value="Yamoussoukro">Yamoussoukro</option>
              <option value="San Pedro">San Pedro</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-1">Statut</label>
            <select
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              <option value="">Tous les statuts</option>
              <option value="actif">Actif</option>
              <option value="vendu">Vendu</option>
              <option value="litige">Litige</option>
              <option value="reserve">Réservé</option>
              <option value="annule">Annulé</option>
            </select>
          </div>

          <div className="flex items-center">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
                className="mr-2 h-4 w-4 text-blue-500"
              />
              Afficher les lots archivés
            </label>
          </div>
        </div>
      </div>

      {!statsLoading && Object.keys(villageStats).length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          {Object.entries(villageStats).map(([village, stats]) => (
            <div key={village} className="bg-white/5 rounded-lg p-4">
              <div className="text-xs font-medium text-white/50 uppercase tracking-wider">
                {village}
              </div>
              <div className="mt-1 text-2xl font-bold text-white">
                {stats.count}/{stats.total}
              </div>
            </div>
          ))}
        </div>
      )}

      {statsLoading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-sm text-white/60">Chargement des statistiques...</p>
        </div>
      )}

      {statsError && (
        <div className="bg-red-500/20 rounded-lg p-4 mb-4">
          <p className="text-red-300 text-sm">{statsError}</p>
        </div>
      )}

      {total === 0 && !loading && !statsLoading && (
        <div className="text-center py-12">
          <p className="text-white/50">Aucun lot trouvé avec les filtres actuels</p>
        </div>
      )}

      {loading && !paged.length && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-sm text-white/60">Chargement des lots...</p>
        </div>
      )}

      {!loading && paged.length > 0 && (
        <div className="divide-y divide-white/10">
          {paged.map((lot) => (
            <div key={lot.id} className="py-4 hover:bg-white/5 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 h-8 w-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <Icon label="📍" className="h-4 w-4 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white truncate">
                        {lot.reference || `Lot ${lot.numero_lot}`}
                      </p>
                      <p className="text-xs text-white/50">
                        {lot.nom_lotissement} • {lot.numero_ilot} • {lot.village}
                      </p>
                    </div>
                  </div>

                  {!lot.deleted_at && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          lot.statut === 'actif'
                            ? 'bg-green-500/20 text-green-300'
                            : lot.statut === 'vendu'
                            ? 'bg-blue-500/20 text-blue-300'
                            : lot.statut === 'litige'
                            ? 'bg-red-500/20 text-red-300'
                            : lot.statut === 'reserve'
                            ? 'bg-orange-500/20 text-orange-300'
                            : 'bg-gray-500/20 text-gray-300'
                        }`}
                      >
                        {lot.statut.charAt(0).toUpperCase() + lot.statut.slice(1)}
                      </span>

                      {lot.date_cession && (
                        <span className="text-xs text-white/50">
                          {new Date(lot.date_cession).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                    </div>
                  )}

                  {lot.deleted_at && (
                    <p className="mt-2 text-xs text-red-400">
                      Archivé le {new Date(lot.deleted_at).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {!lot.deleted_at && canManage && (
                    <>
                      <button
                        type="button"
                        onClick={() => onEdit(lot)}
                        className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-xs font-medium text-blue-300 rounded-lg transition-colors"
                      >
                        Modifier
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenAttestation(lot)}
                        className="px-3 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-xs font-medium text-purple-300 rounded-lg transition-colors"
                      >
                        Attestation
                      </button>
                      <button
                        type="button"
                        onClick={() => onArchive(lot)}
                        className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-xs font-medium text-red-300 rounded-lg transition-colors"
                      >
                        Archiver
                      </button>
                    </>
                  )}

                  {lot.deleted_at && canManage && (
                    <button
                      type="button"
                      onClick={() => onRestore(lot)}
                      className="px-3 py-1 bg-green-500/20 hover:bg-green-500/30 text-xs font-medium text-green-300 rounded-lg transition-colors"
                    >
                      Restaurer
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && paged.length > 0 && (
        <div className="flex items-center justify-between mt-6 text-sm text-white/60">
          <div>
            Page {page} sur {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(Math.max(1, page - 1))}
              className="px-3 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-800/95 disabled:opacity-50"
            >
              Précédent
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              className="px-3 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-800/95 disabled:opacity-50"
            >
              Suivant
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
