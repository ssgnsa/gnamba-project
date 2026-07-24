import { FC, useState } from 'react';
import { z } from 'zod';
import { foncierRepository } from '../../data/foncier.repository';
import { foncierLotFormSchema, type FoncierLotFormInput, validateFoncierForm } from '../../lib/foncierValidation';

interface FoncierLotFormProps {
  onClose: () => void;
  onSuccess: () => void;
  initialData?: Partial<FoncierLotFormInput>;
}

export const FoncierLotForm: FC<FoncierLotFormProps> = ({ onClose, onSuccess, initialData }) => {
  // Form state uses the input type of the schema (what the user sees in fields)
  type FormState = z.input<typeof foncierLotFormSchema>;

  // Empty form state matching the input type
  const emptyFormState: FormState = {
    numero_lot: '',
    numero_ilot: '',
    nom_lotissement: '',
    village: '',
    quartier: undefined,
    commune: undefined,
    departement: undefined,
    region: undefined,
    superficie: '',
    proprietaire_nom: '',
    proprietaire_prenom: undefined,
    proprietaire_naissance_date: undefined,
    proprietaire_naissance_lieu: undefined,
    proprietaire_cni_numero: undefined,
    proprietaire_cni_date: undefined,
    proprietaire_cni_lieu: undefined,
    proprietaire_profession: undefined,
    proprietaire_telephone: undefined,
    chef_village: undefined,
    arrete_prefectoral: undefined,
    arrete_date: undefined,
    statut: 'actif',
    date_cession: undefined,
    prix_cession: undefined,
    latitude: undefined,
    longitude: undefined,
    gps_precision: undefined,
    limite_nord_lat: undefined,
    limite_nord_lng: undefined,
    limite_sud_lat: undefined,
    limite_sud_lng: undefined,
    limite_est_lat: undefined,
    limite_est_lng: undefined,
    limite_ouest_lat: undefined,
    limite_ouest_lng: undefined,
    code_barre: undefined,
    notes: undefined,
  };

  // Helper to convert output type (from schema) to input type (for form)
  const convertOutputToInput = (data: Partial<FoncierLotFormInput>): FormState => {
    // Helper to convert ISO date string to DD/MM/YYYY
    const toDateString = (dateStr: string | undefined): string | undefined => {
      if (!dateStr) return undefined;
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return undefined;
      return date.toLocaleDateString('fr-CA', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).replace(/\//g, '/');
    };

    // Helper to convert number to string
    const numToString = (num: number | undefined): string | undefined => {
      return num !== undefined && !isNaN(num) ? String(num) : undefined;
    };

    return {
      ...emptyFormState,
      numero_lot: data.numero_lot ?? '',
      numero_ilot: data.numero_ilot ?? '',
      nom_lotissement: data.nom_lotissement ?? '',
      village: data.village ?? '',
      quartier: data.quartier ?? undefined,
      commune: data.commune ?? undefined,
      departement: data.departement ?? undefined,
      region: data.region ?? undefined,
      superficie: numToString(data.superficie) ?? '',
      proprietaire_nom: data.proprietaire_nom ?? '',
      proprietaire_prenom: data.proprietaire_prenom ?? undefined,
      proprietaire_naissance_date: toDateString(data.proprietaire_naissance_date),
      proprietaire_naissance_lieu: data.proprietaire_naissance_lieu ?? undefined,
      proprietaire_cni_numero: data.proprietaire_cni_numero ?? undefined,
      proprietaire_cni_date: toDateString(data.proprietaire_cni_date),
      proprietaire_cni_lieu: data.proprietaire_cni_lieu ?? undefined,
      proprietaire_profession: data.proprietaire_profession ?? undefined,
      proprietaire_telephone: data.proprietaire_telephone ?? undefined,
      chef_village: data.chef_village ?? undefined,
      arrete_prefectoral: data.arrete_prefectoral ?? undefined,
      arrete_date: toDateString(data.arrete_date),
      statut: data.statut ?? 'actif',
      date_cession: toDateString(data.date_cession),
      prix_cession: numToString(data.prix_cession) ?? undefined,
      latitude: typeof data.latitude === 'number' ? String(data.latitude) : undefined,
      longitude: typeof data.longitude === 'number' ? String(data.longitude) : undefined,
      gps_precision: typeof data.gps_precision === 'number' ? String(data.gps_precision) : undefined,
      limite_nord_lat: typeof data.limite_nord_lat === 'number' ? String(data.limite_nord_lat) : undefined,
      limite_nord_lng: typeof data.limite_nord_lng === 'number' ? String(data.limite_nord_lng) : undefined,
      limite_sud_lat: typeof data.limite_sud_lat === 'number' ? String(data.limite_sud_lat) : undefined,
      limite_sud_lng: typeof data.limite_sud_lng === 'number' ? String(data.limite_sud_lng) : undefined,
      limite_est_lat: typeof data.limite_est_lat === 'number' ? String(data.limite_est_lat) : undefined,
      limite_est_lng: typeof data.limite_est_lng === 'number' ? String(data.limite_est_lng) : undefined,
      limite_ouest_lat: typeof data.limite_ouest_lat === 'number' ? String(data.limite_ouest_lat) : undefined,
      limite_ouest_lng: typeof data.limite_ouest_lng === 'number' ? String(data.limite_ouest_lng) : undefined,
      code_barre: data.code_barre ?? undefined,
      notes: data.notes ?? undefined,
    };
  };

  const [formData, setFormData] = useState<FormState>(() => {
    if (!initialData) return emptyFormState;
    return convertOutputToInput(initialData);
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle form field changes
  const handleChange = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setFormData((prev: FormState) => ({
      ...prev,
      [field]: value,
    }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Use the validation helper function for consistent error handling
    const validationResult = validateFoncierForm(formData);
    if (!validationResult.success) {
      // Get first error message
      const firstError = Object.values(validationResult.errors ?? {})[0];
      setError(firstError || 'Validation failed');
      setLoading(false);
      return;
    }

    try {
      const parsedData = validationResult.parsedData;
      if (!parsedData) throw new Error('No parsed data from validation');

      // Ensure statut has a default value
      const saveData = {
        ...parsedData,
        statut: parsedData.statut || 'actif',
      };

      const result = await foncierRepository.saveLot(saveData, false);
      if (result.error) throw result.error;

      onSuccess();
    } catch (err: any) {
      console.error('Error saving lot:', err);
      setError(err.message || 'Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl mx-4 sm:mx-0 max-h-[90vh] overflow-y-auto">
        <div className="bg-white rounded-lg shadow-lg w-full max-w-[500px]">
          <div className="flex items-center justify-between p-4 border-b rounded-t-lg">
            <h3 className="text-lg font-semibold text-gray-900">
              {initialData ? 'Modifier le lot' : 'Nouveau lot foncier'}
            </h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
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
              {/* Lot Information */}
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Informations du lot</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de lot *</label>
                    <input
                      type="text"
                      value={formData.numero_lot ?? ''}
                      onChange={(e) => handleChange('numero_lot', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: LOT001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Numéro d'ilot *</label>
                    <input
                      type="text"
                      value={formData.numero_ilot ?? ''}
                      onChange={(e) => handleChange('numero_ilot', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: ILOT01"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom du lotissement *</label>
                    <input
                      type="text"
                      value={formData.nom_lotissement ?? ''}
                      onChange={(e) => handleChange('nom_lotissement', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: Villa Serena"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Village *</label>
                    <input
                      type="text"
                      value={formData.village ?? ''}
                      onChange={(e) => handleChange('village', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: Akoupé"
                    />
                  </div>
                </div>
              </div>

              {/* Characteristics */}
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Caractéristiques</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Superficie (m²) *</label>
                    <input
                      type="text"
                      value={formData.superficie ?? ''}
                      onChange={(e) => handleChange('superficie', e.target.value.replace(',', '.'))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: 500.5"
                    />
                  </div>
                </div>
              </div>

              {/* Owner */}
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Propriétaire</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                    <input
                      type="text"
                      value={formData.proprietaire_nom ?? ''}
                      onChange={(e) => handleChange('proprietaire_nom', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: KOUASSI"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                    <input
                      type="text"
                      value={formData.proprietaire_prenom ?? ''}
                      onChange={(e) => handleChange('proprietaire_prenom', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outine-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: Jean"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date de naissance (JJ/MM/AAAA)</label>
                    <input
                      type="text"
                      value={formData.proprietaire_naissance_date ?? ''}
                      onChange={(e) => handleChange('proprietaire_naissance_date', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outine-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: 29/12/1967"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lieu de naissance</label>
                    <input
                      type="text"
                      value={formData.proprietaire_naissance_lieu ?? ''}
                      onChange={(e) => handleChange('proprietaire_naissance_lieu', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outine-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Numéro CNI</label>
                    <input
                      type="text"
                      value={formData.proprietaire_cni_numero ?? ''}
                      onChange={(e) => handleChange('proprietaire_cni_numero', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outine-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: CI 005274109"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date CNI (JJ/MM/AAAA)</label>
                    <input
                      type="text"
                      value={formData.proprietaire_cni_date ?? ''}
                      onChange={(e) => handleChange('proprietaire_cni_date', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outine-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: 15/06/2020"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lieu CNI</label>
                    <input
                      type="text"
                      value={formData.proprietaire_cni_lieu ?? ''}
                      onChange={(e) => handleChange('proprietaire_cni_lieu', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outine-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: Abidjan"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Profession</label>
                    <input
                      type="text"
                      value={formData.proprietaire_profession ?? ''}
                      onChange={(e) => handleChange('proprietaire_profession', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outine-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: Agriculteur"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                  <input
                    type="text"
                    value={formData.proprietaire_telephone ?? ''}
                    onChange={(e) => handleChange('proprietaire_telephone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outine-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: 0707084041"
                  />
                </div>
              </div>

              {/* Administrative */}
              <div className="mt-6">
                <h4 className="font-medium text-gray-700 mb-2">Informations administratives</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Chef de village</label>
                    <input
                      type="text"
                      value={formData.chef_village ?? ''}
                      onChange={(e) => handleChange('chef_village', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outine-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: Nanan Koffi"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Arrêté préfectoral</label>
                    <input
                      type="text"
                      value={formData.arrete_prefectoral ?? ''}
                      onChange={(e) => handleChange('arrete_prefectoral', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outine-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: AP 2024-123"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date arrêté (JJ/MM/AAAA)</label>
                  <input
                    type="text"
                    value={formData.arrete_date ?? ''}
                    onChange={(e) => handleChange('arrete_date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outine-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: 10/03/2024"
                  />
                </div>
              </div>

              {/* Sale */}
              <div className="mt-6">
                <h4 className="font-medium text-gray-700 mb-2">Cession</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                    <select
                      value={formData.statut ?? 'actif'}
                      onChange={(e) => handleChange('statut', e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outine-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="actif">Actif</option>
                      <option value="vendu">Vendu</option>
                      <option value="litige">Litige</option>
                      <option value="reserve">Réserve</option>
                      <option value="annule">Annulé</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date de cession (JJ/MM/AAAA)</label>
                    <input
                      type="text"
                      value={formData.date_cession ?? ''}
                      onChange={(e) => handleChange('date_cession', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outine-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: 15/08/2024"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prix de cession (FCFA)</label>
                  <input
                    type="text"
                    value={formData.prix_cession ?? ''}
                    onChange={(e) => handleChange('prix_cession', e.target.value.replace(',', '.'))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outine-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: 5000000"
                  />
                </div>
              </div>

              {/* GPS */}
              <div className="mt-6">
                <h4 className="font-medium text-gray-700 mb-2">Coordonnées GPS</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                    <input
                      type="text"
                      value={formData.latitude ?? ''}
                      onChange={(e) => handleChange('latitude', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outine-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: 5.3456"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                    <input
                      type="text"
                      value={formData.longitude ?? ''}
                      onChange={(e) => handleChange('longitude', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outine-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: -4.2345"
                    />
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Précision GPS (m)</label>
                    <input
                      type="text"
                      value={formData.gps_precision ?? ''}
                      onChange={(e) => handleChange('gps_precision', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outine-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: 5"
                    />
                  </div>
                </div>
              </div>

              {/* Miscellaneous */}
              <div className="mt-6">
                <h4 className="font-medium text-gray-700 mb-2">Informations diverses</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Code barre</label>
                    <input
                      type="text"
                      value={formData.code_barre ?? ''}
                      onChange={(e) => handleChange('code_barre', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outine-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: 1234567890123"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={formData.notes ?? ''}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outine-none focus:ring-2 focus:ring-blue-500 h-20"
                    placeholder="Observations complémentaires..."
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Enregistrement...' : 'Enregistrer le lot'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
