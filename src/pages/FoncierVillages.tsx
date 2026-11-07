import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Edit2, Archive, RotateCcw, AlertTriangle, MapPin } from "lucide-react";
import { foncierRepository } from "@/data/foncier.repository";
import type { VillageWithStats } from "@/types/api.generated/villageWithStats";
import { VillageFormModal } from "@/components/foncier/VillageFormModal";

type FilterMode = "actifs" | "inactifs" | "tous";

export default function FoncierVillages() {
  const [villages, setVillages] = useState<VillageWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterMode>("actifs");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVillage, setEditingVillage] = useState<VillageWithStats | null>(null);

  const loadVillages = async () => {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await foncierRepository.getAllVillagesWithStats();
    if (fetchError) {
      setError(fetchError.message);
      setVillages([]);
    } else {
      setVillages(data ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    void loadVillages();
  }, []);

  const filtered = useMemo(() => {
    return villages.filter((v) => {
      if (filter === "actifs" && !v.actif) return false;
      if (filter === "inactifs" && v.actif) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        v.nom?.toLowerCase().includes(q) ||
        v.code?.toLowerCase().includes(q) ||
        v.region?.toLowerCase().includes(q) ||
        v.commune?.toLowerCase().includes(q)
      );
    });
  }, [villages, search, filter]);

  const handleDeactivate = async (v: VillageWithStats) => {
    if (!confirm(`Désactiver "${v.nom}" ? Il restera consultable mais n'apparaîtra plus dans les listes actives.`)) return;
    const { error: err } = await foncierRepository.updateVillage(v.id, { actif: false });
    if (err) {
      alert(`Erreur : ${err.message}`);
    } else {
      await loadVillages();
    }
  };

  const handleReactivate = async (v: VillageWithStats) => {
    const { error: err } = await foncierRepository.updateVillage(v.id, { actif: true });
    if (err) {
      alert(`Erreur : ${err.message}`);
    } else {
      await loadVillages();
    }
  };

  const handleEdit = (v: VillageWithStats) => {
    setEditingVillage(v);
    setModalOpen(true);
  };

  const handleCreate = () => {
    setEditingVillage(null);
    setModalOpen(true);
  };

  const handleSaved = () => {
    setModalOpen(false);
    setEditingVillage(null);
    void loadVillages();
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Gestion des villages</h1>
          <p className="text-sm text-neutral-600">
            {villages.length} village(s) — {villages.filter((v) => v.actif).length} actif(s)
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
        >
          <Plus size={16} />
          Nouveau village
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, code, région, commune..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 pl-10 pr-4 py-2.5 text-sm"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as FilterMode)}
          className="rounded-xl border border-neutral-200 px-3 py-2.5 text-sm"
        >
          <option value="actifs">Actifs</option>
          <option value="inactifs">Inactifs</option>
          <option value="tous">Tous</option>
        </select>
      </div>

      {loading && <p className="text-sm text-neutral-500">Chargement…</p>}
      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-700">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="overflow-hidden rounded-xl border border-neutral-200">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-4 py-3">Village</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Localisation</th>
                <th className="px-4 py-3 text-center">Lotissements</th>
                <th className="px-4 py-3 text-center">Statut</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-neutral-500">
                    Aucun village ne correspond aux critères.
                  </td>
                </tr>
              )}
              {filtered.map((v) => (
                <tr key={v.id} className={v.actif ? "" : "bg-neutral-50 text-neutral-500"}>
                  <td className="px-4 py-3 font-medium">
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-neutral-400" />
                      {v.nom}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{v.code}</td>
                  <td className="px-4 py-3 text-xs">
                    {[v.commune, v.departement, v.region].filter(Boolean).join(" / ") || "—"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {(v as any).stats?.total_lots ?? 0}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-semibold ${
                        v.actif
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-neutral-200 text-neutral-600"
                      }`}
                    >
                      {v.actif ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => handleEdit(v)}
                        title="Éditer"
                        className="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100"
                      >
                        <Edit2 size={16} />
                      </button>
                      {v.actif ? (
                        <button
                          onClick={() => handleDeactivate(v)}
                          title="Désactiver"
                          className="rounded-lg p-2 text-amber-600 hover:bg-amber-50"
                        >
                          <Archive size={16} />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReactivate(v)}
                          title="Réactiver"
                          className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50"
                        >
                          <RotateCcw size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <VillageFormModal
          village={editingVillage}
          onClose={() => setModalOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}