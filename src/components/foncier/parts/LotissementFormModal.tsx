import { FC, useState, useCallback, useContext } from "react";
import { foncierApi } from "@/api/foncier";
import { useFoncier } from "@/contexts/FoncierContext";

interface LotissementFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  isLoading?: boolean;
}

const emptyForm = {
  nom: "",
  code: "",
  description: "",
  superficie_totale: "",
  nombre_lots_prevus: "",
  arrete_lotissement: "",
  arrete_date: "",
};

export const LotissementFormModal: FC<LotissementFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  isLoading = false,
}) => {
  const { villages, selectedVillage, setVillage, publishEvent } = useFoncier();
  const [form, setForm] = useState({ ...emptyForm });
  const [selectedVillageId, setSelectedVillageId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = useCallback(
    (key: string, value: string) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      if (error) setError(null);
    },
    [error]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!selectedVillageId) {
      setError("Un village doit être sélectionné");
      setLoading(false);
      return;
    }
    if (!form.nom.trim()) {
      setError("Le nom du lotissement est obligatoire");
      setLoading(false);
      return;
    }

    try {
      // Sécurité : s'assurer que selectedVillageId est une chaîne valide
      // pour éviter l'erreur "replace is not a fonction" si un objet est passé par erreur
      const safeVillageId = typeof selectedVillageId === 'string' ? selectedVillageId : String(selectedVillageId || '');
      if (!safeVillageId) {
        setError("Un village doit être sélectionné");
        setLoading(false);
        return;
      }
      const res = await foncierApi.lotissements.create(safeVillageId, {
        nom: form.nom.trim(),
        code: form.code.trim() || undefined,
        description: form.description.trim() || undefined,
        superficie_totale: form.superficie_totale.trim()
          ? Number(form.superficie_totale)
          : undefined,
        nombre_lots_prevus: form.nombre_lots_prevus.trim()
          ? Number(form.nombre_lots_prevus)
          : undefined,
        arrete_lotissement: form.arrete_lotissement.trim() || undefined,
        arrete_date: form.arrete_date.trim() || undefined,
      });
      if (res.error) throw res.error;

      // Événement : lotissement créé — les autres formulaires peuvent réagir
      publishEvent("lotissement:created", { id: res.data?.id, nom: res.data?.nom });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Error creating lotissement:", err);
      setError(err.message || "Erreur lors de la création du lotissement");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl mx-4 sm:mx-0 max-h-[90vh] overflow-y-auto">
        <div className="bg-white rounded-lg shadow-lg w-full max-w-[520px]">
          <div className="flex items-center justify-between p-4 border-b rounded-t-lg">
            <h3 className="text-lg font-semibold text-gray-900">
              Nouveau lotissement
            </h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl leading-none">
              ×
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Village *
                </label>
                <select
                  value={selectedVillageId ?? ""}
                  onChange={(e) => setSelectedVillageId(typeof e.target.value === 'string' ? e.target.value : null)}
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sélectionner un village</option>
                  {villages.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.nom} {v.code ? `— ${v.code}` : ""}
                    </option>
                  ))}
                </select>
                {villages.length === 0 && (
                  <p className="mt-1 text-xs text-amber-600">
                    Aucun village disponible. Créez un village d'abord.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom du lotissement *
                  </label>
                  <input
                    type="text"
                    value={form.nom}
                    onChange={(e) => handleChange("nom", e.target.value)}
                    placeholder="Ex: Villa Serena"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Code
                  </label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) => handleChange("code", e.target.value.toUpperCase())}
                    placeholder="Ex: VS2024"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Superficie totale (m²)
                  </label>
                  <input
                    type="text"
                    value={form.superficie_totale}
                    onChange={(e) => handleChange("superficie_totale", e.target.value.replace(",", "."))}
                    placeholder="Ex: 5000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de lots prévus
                  </label>
                  <input
                    type="text"
                    value={form.nombre_lots_prevus}
                    onChange={(e) => handleChange("nombre_lots_prevus", e.target.value.replace(",", "."))}
                    placeholder="Ex: 25"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Arrêté lotissement
                  </label>
                  <input
                    type="text"
                    value={form.arrete_lotissement}
                    onChange={(e) => handleChange("arrete_lotissement", e.target.value)}
                    placeholder="Ex: AP 2024-001"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date arrêté (JJ/MM/AAAA)
                  </label>
                  <input
                    type="text"
                    value={form.arrete_date}
                    onChange={(e) => handleChange("arrete_date", e.target.value)}
                    placeholder="Ex: 10/03/2024"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="text-xs text-gray-500">
                Le village est transmis par son identifiant (évite l'erreur "replace is not a function"
                liée à un objet passé à la place d'une chaîne).
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading || isLoading}
                className="px-4 py-2.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading || isLoading || !selectedVillageId || !form.nom.trim()}
                className="px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Création..." : "Créer le lotissement"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
