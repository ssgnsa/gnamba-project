import { useEffect, useState } from "react";
import {
  Plus,
  Trash2,
  Edit,
  Search,
  AlertCircle,
  Loader,
  Map,
} from "lucide-react";
import { foncierRepository } from "../data/foncier.repository";
import Modal from "../components/ui/Modal";
import { formatDateLong } from "../utils/reference";

interface Village {
  id: string;
  nom: string;
  region?: string;
  commune?: string;
  departement?: string;
  logo_url?: string;
  created_at?: string;
  updated_at?: string;
}

interface VillageForm {
  nom: string;
  region: string;
  commune: string;
  departement: string;
}

export default function FoncierVillages() {
  const [villages, setVillages] = useState<Village[]>([]);
  const [filteredVillages, setFilteredVillages] = useState<Village[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<VillageForm>({
    nom: "",
    region: "",
    commune: "",
    departement: "",
  });

  // Load villages
  useEffect(() => {
    loadVillages();
  }, []);

  // Filter villages based on search
  useEffect(() => {
    const filtered = villages.filter(
      (v) =>
        v.nom.toLowerCase().includes(search.toLowerCase()) ||
        (v.region?.toLowerCase().includes(search.toLowerCase()) || false) ||
        (v.commune?.toLowerCase().includes(search.toLowerCase()) || false)
    );
    setFilteredVillages(filtered);
  }, [search, villages]);

  const loadVillages = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await foncierRepository.getVillagesList();
      if (result.error) {
        setError("Erreur lors du chargement des villages");
        console.error(result.error);
      } else {
        setVillages((result.data as Village[]) || []);
      }
    } catch (err) {
      setError("Erreur lors du chargement des villages");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm({
      nom: "",
      region: "",
      commune: "",
      departement: "",
    });
    setError("");
    setShowModal(true);
  };

  const handleOpenEdit = async (village: Village) => {
    setEditingId(village.id);
    setForm({
      nom: village.nom || "",
      region: village.region || "",
      commune: village.commune || "",
      departement: village.departement || "",
    });
    setError("");
    setShowModal(true);
  };

  const handleSave = async () => {
    setError("");

    // Validation
    if (!form.nom.trim()) {
      setError("Le nom du village est requis");
      return;
    }

    setLoading(true);
    try {
      if (editingId) {
        // Update
        const result = await foncierRepository.updateVillage(editingId, {
          nom: form.nom.trim(),
          region: form.region.trim() || null,
          commune: form.commune.trim() || null,
          departement: form.departement.trim() || null,
        });

        if (result.error) {
          setError("Erreur lors de la mise à jour du village");
          console.error(result.error);
        } else {
          setShowModal(false);
          await loadVillages();
        }
      } else {
        // Create
        const result = await foncierRepository.createVillage({
          nom: form.nom.trim(),
          region: form.region.trim() || null,
          commune: form.commune.trim() || null,
          departement: form.departement.trim() || null,
        });

        if (result.error) {
          setError("Erreur lors de la création du village");
          console.error(result.error);
        } else {
          setShowModal(false);
          await loadVillages();
        }
      }
    } catch (err) {
      setError("Erreur lors de la sauvegarde du village");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (villageId: string, villageName: string) => {
    if (
      !window.confirm(
        `Êtes-vous sûr de vouloir supprimer le village "${villageName}" ? Cette action est irréversible.`
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const result = await foncierRepository.deleteVillage(villageId);

      if (result.error) {
        setError("Erreur lors de la suppression du village");
        console.error(result.error);
      } else {
        await loadVillages();
      }
    } catch (err) {
      setError("Erreur lors de la suppression du village");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-green-950 text-white shadow-sm">
        <div className="px-5 py-6 sm:px-7 sm:py-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
                <Map size={14} />
                Gestion Foncière
              </div>
              <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                Gestion des Villages
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/75 sm:text-base">
                Gérez vos villages, régions et communes pour les attributions
                foncières.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-center backdrop-blur-sm">
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/50">
                Total
              </div>
              <div className="mt-1 text-2xl font-bold">
                {filteredVillages.length}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Toolbar */}
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-9 pr-4 text-sm outline-none transition focus:border-green-400 focus:bg-white focus:ring-4 focus:ring-green-100"
            />
          </div>
          <button
            onClick={handleOpenCreate}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:shadow-md hover:from-green-700 hover:to-emerald-700 disabled:opacity-50"
          >
            <Plus size={16} />
            Nouveau Village
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex gap-3">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <Loader size={24} className="mx-auto animate-spin text-slate-400" />
        </div>
      )}

      {/* Villages List */}
      {!loading && filteredVillages.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
          {search
            ? "Aucun village ne correspond à votre recherche."
            : "Aucun village créé. Commencez par en créer un."}
        </div>
      )}

      {!loading && filteredVillages.length > 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Village
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Région
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Commune
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Département
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Créé
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredVillages.map((village) => (
                  <tr
                    key={village.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-3 text-sm font-medium text-slate-900">
                      {village.nom}
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-600">
                      {village.region || "—"}
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-600">
                      {village.commune || "—"}
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-600">
                      {village.departement || "—"}
                    </td>
                    <td className="px-6 py-3 text-xs text-slate-500">
                      {village.created_at
                        ? formatDateLong(village.created_at).split(" à ")[0]
                        : "—"}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(village)}
                          disabled={loading}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-600 hover:bg-blue-50 transition disabled:opacity-50"
                        >
                          <Edit size={14} />
                          Modifier
                        </button>
                        <button
                          onClick={() => handleDelete(village.id, village.nom)}
                          disabled={loading}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                        >
                          <Trash2 size={14} />
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? "Modifier le village" : "Créer un village"}
      >
        <div className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Nom du village *
            </label>
            <input
              type="text"
              value={form.nom}
              onChange={(e) => setForm({ ...form, nom: e.target.value })}
              placeholder="ex: Akouédo"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none transition focus:border-green-400 focus:bg-white focus:ring-4 focus:ring-green-100"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Région
              </label>
              <input
                type="text"
                value={form.region}
                onChange={(e) => setForm({ ...form, region: e.target.value })}
                placeholder="ex: Abidjan"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none transition focus:border-green-400 focus:bg-white focus:ring-4 focus:ring-green-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Commune
              </label>
              <input
                type="text"
                value={form.commune}
                onChange={(e) => setForm({ ...form, commune: e.target.value })}
                placeholder="ex: Plateau"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none transition focus:border-green-400 focus:bg-white focus:ring-4 focus:ring-green-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Département
              </label>
              <input
                type="text"
                value={form.departement}
                onChange={(e) =>
                  setForm({ ...form, departement: e.target.value })
                }
                placeholder="ex: Abidjan 1"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none transition focus:border-green-400 focus:bg-white focus:ring-4 focus:ring-green-100"
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-slate-200">
            <button
              onClick={() => setShowModal(false)}
              disabled={loading}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transition disabled:opacity-50"
            >
              {loading && <Loader size={14} className="animate-spin" />}
              {editingId ? "Modifier" : "Créer"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
