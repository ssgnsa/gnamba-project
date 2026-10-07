import React, { useState, useEffect } from 'react';
import { apiClient } from '@/api/client';
import { Button, Input, Label, Select, Textarea } from '@/components/ui';

interface PartyFormValues {
  type: 'particulier' | 'entreprise' | 'employe';
  first_name: string;
  last_name: string;
  telephone: string;
  email: string;
  adresse: string;
  nom_entreprise?: string;
  siret?: string;
  poste?: string;
  date_embauche?: string;
  salaire?: string;
}

export interface UniversalClientFormProps {
  onSuccess: (partyId: string) => void;
  onCancel?: () => void;
  initialData?: Partial<PartyFormValues>;
  mode: 'create' | 'edit';
  partyIdToEdit?: string;
}

export const UniversalClientForm: React.FC<UniversalClientFormProps> = ({
  onSuccess,
  onCancel,
  initialData = {},
  mode = 'create',
  partyIdToEdit
}) => {
  const [values, setValues] = useState<PartyFormValues>({
    type: initialData.type || 'particulier',
    first_name: initialData.first_name || '',
    last_name: initialData.last_name || '',
    telephone: initialData.telephone || '',
    email: initialData.email || '',
    adresse: initialData.adresse || '',
    nom_entreprise: initialData.nom_entreprise || '',
    siret: initialData.siret || '',
    poste: initialData.poste || '',
    date_embauche: initialData.date_embauche || '',
    salaire: initialData.salaire || '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

useEffect(() => {
    if (mode === 'edit' && partyIdToEdit) {
      const loadPartyData = async () => {
        setLoading(true);
        try {
          const result = await apiClient.request<any>(`/clients/${partyIdToEdit}`);
          const party = Array.isArray(result.data) ? result.data[0] : result.data;
          if (party && !result.error) {
            setValues({
              type: party.type || 'particulier',
              first_name: party.first_name || '',
              last_name: party.last_name || '',
              telephone: party.telephone || '',
              email: party.email || '',
              adresse: party.adresse || '',
              nom_entreprise: party.nom_entreprise || '',
              siret: party.siret || '',
              poste: party.poste || '',
              date_embauche: party.date_embauche || '',
              salaire: party.salaire || '',
            });
          } else {
            setError('Erreur lors du chargement des données du client');
          }
        } catch (err) {
          setError('Erreur lors du chargement des données du client');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };

      void loadPartyData();
    }
  }, [mode, partyIdToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validation de base
      if (!values.first_name.trim() || !values.last_name.trim()) {
        setError('Le prénom et le nom sont obligatoires');
        setLoading(false);
        return;
      }

      let result: { data?: any; error?: string | null };
      if (mode === 'edit' && partyIdToEdit) {
        result = await apiClient.request(`/clients/${partyIdToEdit}`, {
          method: 'PATCH',
          body: JSON.stringify(values),
        });
      } else {
        result = await apiClient.request('/clients', {
          method: 'POST',
          body: JSON.stringify(values),
        });
      }

      if (result.error) {
        throw new Error(result.error);
      }

      const partyId = mode === 'edit' && partyIdToEdit
        ? partyIdToEdit
        : result.data?.id || result.data?.[0]?.id || '';

      setLoading(false);
      onSuccess(partyId);
    } catch (err) {
      setLoading(false);
      const message = err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement';
      setError(message);
    }
  };

  // Champs spécifiques selon le type
  const isEntreprise = values.type === 'entreprise';
  const isEmploye = values.type === 'employe';

  return (
    <div className="space-y-6">
      {!loading && error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="type">Type de client</Label>
          <Select
            id="type"
            value={values.type}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              setValues(prev => ({ ...prev, type: e.target.value as PartyFormValues['type'] }));
            }}
            options={[
              { value: 'particulier', label: 'Particulier' },
              { value: 'entreprise', label: 'Entreprise' },
              { value: 'employe', label: 'Employé' },
            ]}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="first_name">Prénom *</Label>
            <Input
              id="first_name"
              value={values.first_name}
              onChange={(e) => setValues(prev => ({ ...prev, first_name: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="last_name">Nom *</Label>
            <Input
              id="last_name"
              value={values.last_name}
              onChange={(e) => setValues(prev => ({ ...prev, last_name: e.target.value }))}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="telephone">Téléphone</Label>
            <Input
              id="telephone"
              value={values.telephone}
              onChange={(e) => setValues(prev => ({ ...prev, telephone: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={values.email}
              onChange={(e) => setValues(prev => ({ ...prev, email: e.target.value }))}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="adresse">Adresse</Label>
          <Textarea
            id="adresse"
            value={values.adresse}
            onChange={(e) => setValues(prev => ({ ...prev, adresse: e.target.value }))}
          />
        </div>

        {isEntreprise && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nom_entreprise">Nom de l'entreprise</Label>
                <Input
                  id="nom_entreprise"
                  value={values.nom_entreprise || ''}
                  onChange={(e) => setValues(prev => ({ ...prev, nom_entreprise: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="siret">SIRET</Label>
                <Input
                  id="siret"
                  value={values.siret || ''}
                  onChange={(e) => setValues(prev => ({ ...prev, siret: e.target.value }))}
                />
              </div>
            </div>
          </>
        )}

        {isEmploye && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="poste">Poste</Label>
                <Input
                  id="poste"
                  value={values.poste || ''}
                  onChange={(e) => setValues(prev => ({ ...prev, poste: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="date_embauche">Date d'embauche</Label>
                <Input
                  id="date_embauche"
                  type="date"
                  value={values.date_embauche || ''}
                  onChange={(e) => setValues(prev => ({ ...prev, date_embauche: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="salaire">Salaire</Label>
              <Input
                id="salaire"
                type="number"
                value={values.salaire || ''}
                onChange={(e) => setValues(prev => ({ ...prev, salaire: e.target.value }))}
              />
            </div>
          </>
        )}

        <div className="flex justify-end space-x-3">
          {mode === 'edit' && onCancel && (
            <Button type="button" onClick={onCancel} className="bg-white text-slate-700 border border-slate-200 hover:bg-slate-50">
              Annuler
            </Button>
          )}
          <Button type="submit" disabled={loading} className={loading ? 'opacity-70' : ''}>
            {loading ? 'Chargement...' : mode === 'edit' ? 'Mettre à jour' : 'Créer'}
          </Button>
        </div>
      </form>
    </div>
  );
};