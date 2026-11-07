import { useState } from "react";
import { X, AlertTriangle } from "lucide-react";
import { foncierRepository } from "@/data/foncier.repository";
import type { VillageWithStats } from "@/types/api.generated/villageWithStats";

interface Props {
  village: VillageWithStats | null;
  onClose: () => void;
  onSaved: () => void;
}

interface FormState {
  nom: string;
  code: string;
  region: string;
  departement: string;
  commune: string;
  chef_nom: string;
  chef_telephone: string;
  arrete_prefectoral: string;
  arrete_date: string;
  superficie_totale: string;
}

const empty: FormState = {
  nom: "", code: "", region: "", departement: "", commune: "",
  chef_nom: "", chef_telephone: "", arrete_prefectoral: "",
  arrete_date: "", superficie_totale: "",
};

export function VillageFormModal({ village, onClose, onSaved }: Props) {
  const isEdit = !!village;
  const [form, setForm] = useState<FormState>(() =>
    village
      ? {
          nom: village.nom ?? "",
          code: village.code ?? "",
          region: village.region ?? "",
          departement: village.departement ?? "",
          commune: village.commune ?? "",
          chef_nom: village.chef_nom ?? "",
          chef_telephone: village.chef_telephone ?? "",
          arrete_prefectoral: village.arrete_prefectoral ?? "",
          arrete_date: village.arrete_date ?? "",
          superficie_totale: village.superficie_totale?.toString() ?? "",
        }
      : empty
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setField = (key: keyof FormState, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const payload = {
      nom: form.nom.trim(),
      code: form.code.trim().toUpperCase(),
      region: form.region.trim() || undefined,
      departement: form.departement.trim() || undefined,
      commune: form.commune.trim() || undefined,
      chef_nom: form.chef_nom.trim() || undefined,
      chef_telephone: form.chef_telephone.trim() || undefined,
      arrete_prefectoral: form.arrete_prefectoral.trim() || undefined,
      arrete_date: form.arrete_date || undefined,
      superficie_totale: form.superficie_totale
        ? Number(form.superficie_totale)
        : undefined,
    };

    const { error: err } = isEdit
      ? await foncierRepository.updateVillage(village.id, payload)
      : await foncierRepository.createVillage(payload);

    setSaving(false);

    if (err) {
      setError(
        err.message?.includes("duplicate") || err.message?.includes("unique")
          ? "Un village avec ce nom ou ce code existe déjà."
          : err.message || "Erreur inconnue"
      );
      return;
    }
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-bold">
            {isEdit ? `Éditer "${village.nom}"` : "Nouveau village"}
          </h2>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-neutral-100">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-4 overflow-y-auto p-6">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
              <AlertTriangle size={16} />
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium">Nom *</label>
              <input
                required
                minLength={2}
                value={form.nom}
                onChange={(e) => setField("nom", e.target.value)}
                className="w-full rounded-xl border border-neutral-200 px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Code * (majuscules)</label>
              <input
                required
                value={form.code}
                onChange={(e) => setField("code", e.target.value.toUpperCase())}
                pattern="^[A-Z0-9]+$"
                minLength={2}
                maxLength={10}
                placeholder="ex: ABJCOCODY"
                className="w-full rounded-xl border border-neutral-200 px-3 py-2 font-mono"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Région</label>
              <input
                value={form.region}
                onChange={(e) => setField("region", e.target.value)}
                className="w-full rounded-xl border border-neutral-200 px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Département</label>
              <input
                value={form.departement}
                onChange={(e) => setField("departement", e.target.value)}
                className="w-full rounded-xl border border-neutral-200 px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Commune</label>
              <input
                value={form.commune}
                onChange={(e) => setField("commune", e.target.value)}
                className="w-full rounded-xl border border-neutral-200 px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Chef de village</label>
              <input
                value={form.chef_nom}
                onChange={(e) => setField("chef_nom", e.target.value)}
                className="w-full rounded-xl border border-neutral-200 px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Téléphone du chef</label>
              <input
                type="tel"
                value={form.chef_telephone}
                onChange={(e) => setField("chef_telephone", e.target.value)}
                className="w-full rounded-xl border border-neutral-200 px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Arrêté préfectoral</label>
              <input
                value={form.arrete_prefectoral}
                onChange={(e) => setField("arrete_prefectoral", e.target.value)}
                className="w-full rounded-xl border border-neutral-200 px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Date de l'arrêté</label>
              <input
                type="date"
                value={form.arrete_date}
                onChange={(e) => setField("arrete_date", e.target.value)}
                className="w-full rounded-xl border border-neutral-200 px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Superficie (ha)</label>
              <input
                type="number"
                step="0.01"
                value={form.superficie_totale}
                onChange={(e) => setField("superficie_totale", e.target.value)}
                className="w-full rounded-xl border border-neutral-200 px-3 py-2"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-semibold hover:bg-neutral-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {saving ? "Enregistrement…" : isEdit ? "Mettre à jour" : "Créer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}