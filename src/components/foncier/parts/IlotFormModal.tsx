import { FC, useState } from "react";
import { foncierRepository } from "@/data/foncier.repository";

interface IlotFormModalProps {
  isOpen: boolean;
  lotissementId: string;
  lotissementNom?: string;
  onClose: () => void;
  onSuccess: (newIlotId: string) => void;
}

export const IlotFormModal: FC<IlotFormModalProps> = ({
  isOpen,
  lotissementId,
  lotissementNom,
  onClose,
  onSuccess,
}) => {
  const [numero, setNumero] = useState("");
  const [description, setDescription] = useState("");
  const [superficie, setSuperficie] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!numero.trim()) {
      setError("Le numéro d'îlot est requis");
      return;
    }
    setLoading(true);
    const { data, error: err } = await foncierRepository.createIlot({
      lotissement_id: lotissementId,
      numero: numero.trim().toUpperCase(),
      description: description.trim() || undefined,
      superficie_totale: superficie ? Number(superficie) : undefined,
    });
    setLoading(false);
    if (err || !data) {
      setError(err?.message || "Erreur inconnue");
      return;
    }
    setNumero("");
    setDescription("");
    setSuperficie("");
    onSuccess(data.id);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="border-b px-6 py-4">
          <h2 className="text-lg font-bold">Nouvel îlot</h2>
          {lotissementNom && (
            <p className="text-sm text-neutral-500">Lotissement : {lotissementNom}</p>
          )}
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {error && (
            <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium">Numéro d'îlot *</label>
            <input
              required
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              placeholder="ex: ILOT02"
              className="w-full rounded-xl border border-neutral-200 px-3 py-2 font-mono"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Description</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Superficie (m²)</label>
            <input
              type="number"
              step="0.01"
              value={superficie}
              onChange={(e) => setSuperficie(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 px-3 py-2"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-semibold hover:bg-neutral-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? "Création…" : "Créer l'îlot"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};