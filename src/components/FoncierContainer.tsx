import { FC, useState, useMemo, useEffect } from 'react';
import { foncierRepository } from '../lib/dbClient.service';
import type { FoncierLot } from '../types';
import { FoncierLotForm } from './foncier/FoncierLotForm';

export const FoncierContainer: FC = () => {
  const [lots, setLots] = useState<FoncierLot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingLot, setEditingLot] = useState<FoncierLot | null>(null);

  useEffect(() => {
    let active = true;

    const loadLots = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await foncierRepository.searchLots({
          page: 1,
          limit: 20,
          include_archived: false,
        });

        if (!active) return;

        if (result.error) {
          setError(typeof result.error === 'string' ? result.error : 'Erreur de chargement des lots');
          setLots([]);
          return;
        }

        setLots((result.data ?? []) as FoncierLot[]);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadLots();
    return () => {
      active = false;
    };
  }, []);

  const summary = useMemo(() => {
    const actifs = lots.filter((lot) => lot.statut === 'actif').length;
    const vendus = lots.filter((lot) => lot.statut === 'vendu').length;
    return { actifs, vendus, total: lots.length };
  }, [lots]);

  const handleOpenForm = (lot?: FoncierLot) => {
    setEditingLot(lot || null);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingLot(null);
  };

  const handleFormSubmit = async () => {
    // The form will handle submission internally and call onSuccess
    // We'll refresh the list when it's done
    setShowForm(false);
    setEditingLot(null);
    // Trigger a refresh
    const loadLots = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await foncierRepository.searchLots({
          page: 1,
          limit: 20,
          include_archived: false,
        });

        if (result.error) {
          setError(typeof result.error === 'string' ? result.error : 'Erreur de chargement des lots');
          setLots([]);
          return;
        }

        setLots((result.data ?? []) as FoncierLot[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };

    void loadLots();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Gestion des lots fonciers</h1>
          <p className="mt-1 text-sm text-white/70">Vue rapide du portefeuille foncier et des lots actifs.</p>
        </div>
        <button onClick={() => handleOpenForm()} className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors">
          + Nouveau lot
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-white/60">Lots total</p>
          <p className="mt-2 text-2xl font-semibold text-white">{summary.total}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-white/60">Actifs</p>
          <p className="mt-2 text-2xl font-semibold text-green-300">{summary.actifs}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-white/60">Vendus</p>
          <p className="mt-2 text-2xl font-semibold text-blue-300">{summary.vendus}</p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-lg border border-white/10 bg-white/5 p-6 text-sm text-white/70">Chargement des lots…</div>
      ) : error ? (
        <div className="rounded-lg border border-red-400/30 bg-red-500/10 p-6 text-sm text-red-200">{error}</div>
      ) : (
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <div className="grid gap-3">
            {lots.map((lot) => (
              <div key={lot.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-900/40 p-3">
                <div>
                  <p className="font-medium text-white">{lot.reference || `Lot ${lot.numero_lot}`}</p>
                  <p className="text-sm text-white/60">{lot.nom_lotissement} • {lot.village}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-wide text-white/70">{lot.statut}</span>
                  <button
                    onClick={() => handleOpenForm(lot)}
                    className="p-1 text-white/70 hover:text-white"
                    title="Modifier"
                  >
                    {/* Edit icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <FoncierLotForm
          onClose={handleCloseForm}
          onSuccess={handleFormSubmit}
          initialData={
            editingLot ? {
              numero_lot: editingLot.numero_lot || '',
              numero_ilot: editingLot.numero_ilot || '',
              nom_lotissement: editingLot.nom_lotissement || '',
              village: editingLot.village || '',
              quartier: editingLot.quartier,
              commune: editingLot.commune,
              departement: editingLot.departement,
              region: editingLot.region,
              superficie: editingLot.superficie, // Keep as number, don't convert to string
              proprietaire_nom: editingLot.proprietaire_nom || '',
              proprietaire_prenom: editingLot.proprietaire_prenom,
              proprietaire_naissance_date: editingLot.proprietaire_naissance_date, // Keep as ISO string
              proprietaire_naissance_lieu: editingLot.proprietaire_naissance_lieu,
              proprietaire_cni_numero: editingLot.proprietaire_cni_numero,
              proprietaire_cni_date: editingLot.proprietaire_cni_date, // Keep as ISO string
              proprietaire_cni_lieu: editingLot.proprietaire_cni_lieu,
              proprietaire_profession: editingLot.proprietaire_profession,
              proprietaire_telephone: editingLot.proprietaire_telephone,
              chef_village: editingLot.chef_village,
              arrete_prefectoral: editingLot.arrete_prefectoral,
              arrete_date: editingLot.arrete_date, // Keep as ISO string
              statut: editingLot.statut,
              date_cession: editingLot.date_cession, // Keep as ISO string
              prix_cession: editingLot.prix_cession, // Keep as number or undefined, don't convert to string
              latitude: typeof editingLot.latitude === 'number' ? String(editingLot.latitude) : undefined,
              longitude: typeof editingLot.longitude === 'number' ? String(editingLot.longitude) : undefined,
              gps_precision: typeof editingLot.gps_precision === 'number' ? String(editingLot.gps_precision) : undefined,
              limite_nord_lat: typeof editingLot.limite_nord_lat === 'number' ? String(editingLot.limite_nord_lat) : undefined,
              limite_nord_lng: typeof editingLot.limite_nord_lng === 'number' ? String(editingLot.limite_nord_lng) : undefined,
              limite_sud_lat: typeof editingLot.limite_sud_lat === 'number' ? String(editingLot.limite_sud_lat) : undefined,
              limite_sud_lng: typeof editingLot.limite_sud_lng === 'number' ? String(editingLot.limite_sud_lng) : undefined,
              limite_est_lat: typeof editingLot.limite_est_lat === 'number' ? String(editingLot.limite_est_lat) : undefined,
              limite_est_lng: typeof editingLot.limite_est_lng === 'number' ? String(editingLot.limite_est_lng) : undefined,
              limite_ouest_lat: typeof editingLot.limite_ouest_lat === 'number' ? String(editingLot.limite_ouest_lat) : undefined,
              limite_ouest_lng: typeof editingLot.limite_ouest_lng === 'number' ? String(editingLot.limite_ouest_lng) : undefined,
              code_barre: editingLot.code_barre,
              notes: editingLot.notes,
            } : undefined
          }
        />
      )}
    </div>
  );
};
