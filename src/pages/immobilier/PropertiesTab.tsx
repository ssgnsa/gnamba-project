import { useState, useMemo } from "react";
import {
  Plus,
  Building2,
  CreditCard as Edit,
  Trash2,
  User,
  History,
  X,
} from "lucide-react";
import type { Property, LeaseContract, Client } from "../../types";
import Modal from "../../components/ui/Modal";
import Badge from "../../components/ui/Badge";
import SelectWithCreate from "../../components/ui/SelectWithCreate";
import { useSettings } from "../../context/SettingsContext";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import {
  getDemoBlockMessage,
  shouldBlockDestructiveAction,
} from "../../lib/demoMode";
import {
  type ManualSyncStatus,
  normalizeManualStatus,
  readManualCache,
  writeManualCache,
} from "../../lib/manualSyncStore";
import { generateUUID } from "../../utils/reference";
import { clientsRepository } from "../../lib/dbClient.service";
import {
  getTenantName,
  getPropertyStatusConfig,
  getPropertyTypeLabel,
  formatMontantImmo,
  getContractStatusConfig,
} from "../../lib/immobilier";

const emptyForm = {
  type_bien: "studio" as Property["type_bien"],
  adresse: "",
  proprietaire_id: "",
  loyer_mensuel: "",
  charges: "",
  statut: "disponible" as Property["statut"],
  description: "",
};

const PROPERTIES_CACHE_KEY = "egs.immobilier.properties.local_cache.v1";
const CLIENTS_CACHE_KEY = "egs.clients.local_cache.v1";

type LocalProperty = Property & {
  sync_status: ManualSyncStatus;
  sync_error: string | null;
  deleted_at: string | null;
};

function sortProperties(items: LocalProperty[]): LocalProperty[] {
  return [...items].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

interface Props {
  properties: Property[];
  activeContracts: LeaseContract[];
  contractHistory: LeaseContract[];
  search: string;
  onRefresh: () => void;
}

export default function PropertiesTab({
  properties,
  activeContracts,
  contractHistory,
  search,
  onRefresh,
}: Props) {
  const { settings } = useSettings();
  const { showToast } = useNotifications();
  const { user, profile } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [historyProperty, setHistoryProperty] = useState<Property | null>(null);
  const [error, setError] = useState<string | null>(null);
  const destructiveActionsDisabled = shouldBlockDestructiveAction(
    user,
    profile,
  );

  // Get clients from cache for owner selection
  const clients = useMemo(() => {
    const cached = readManualCache<Client>(CLIENTS_CACHE_KEY);
    return cached.sort((a, b) => 
      `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`)
    );
  }, []);

  const inputClass =
    "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400";

  const openAdd = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (p: Property) => {
    setForm({
      type_bien: p.type_bien,
      adresse: p.adresse,
      proprietaire_id: p.proprietaire_id || "",
      loyer_mensuel: String(p.loyer_mensuel),
      charges: String(p.charges || 0),
      statut: p.statut,
      description: p.description || "",
    });
    setEditingId(p.id);
    setError(null);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.adresse.trim()) {
      setError("L'adresse est obligatoire");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const now = new Date().toISOString();
      const cached = readManualCache<LocalProperty>(PROPERTIES_CACHE_KEY).map(
        (property) => ({
          ...property,
          sync_status: normalizeManualStatus(property.sync_status),
          sync_error: property.sync_error ?? null,
          deleted_at: property.deleted_at ?? null,
        }),
      );
      const existing = cached.find((property) => property.id === editingId);
      const localProperty: LocalProperty = {
        ...(existing ?? {}),
        id: existing?.id ?? generateUUID(),
        type_bien: form.type_bien,
        adresse: form.adresse.trim(),
        proprietaire_id: form.proprietaire_id.trim() || null,
        loyer_mensuel: parseFloat(form.loyer_mensuel) || 0,
        charges: parseFloat(form.charges) || 0,
        statut: form.statut,
        description: form.description.trim() || null,
        cover_image_url: existing?.cover_image_url ?? null,
        created_at: existing?.created_at ?? now,
        updated_at: now,
        sync_status: "pending",
        sync_error: null,
        deleted_at: null,
      };

      const next = sortProperties(
        cached.filter((property) => property.id !== localProperty.id).concat(localProperty),
      );
      writeManualCache(PROPERTIES_CACHE_KEY, next);
      setModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setError(
        err.message || "Une erreur est survenue lors de l'enregistrement",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (destructiveActionsDisabled) {
      showToast("error","Mode démo",getDemoBlockMessage());
      return;
    }
    if (
      !confirm("Supprimer ce bien immobilier ? Cette action est irréversible.")
    )
      return;
    try {
      const now = new Date().toISOString();
      const cached = readManualCache<LocalProperty>(PROPERTIES_CACHE_KEY);
      const next = cached
        .map((property) => {
          if (property.id !== id) return property;
          if (normalizeManualStatus(property.sync_status) === "pending") {
            return null;
          }
          return {
            ...property,
            sync_status: "deleted" as const,
            deleted_at: now,
            updated_at: now,
            sync_error: null,
          };
        })
        .filter(Boolean) as LocalProperty[];
      writeManualCache(PROPERTIES_CACHE_KEY, sortProperties(next));
      onRefresh();
    } catch (err: any) {
      showToast("error","Erreur suppression",`Erreur lors de la suppression locale: ${err.message}`);
    }
  };

  const getActiveContract = (propertyId: string) =>
    activeContracts.find(
      (c) => c.property_id === propertyId && c.statut === "actif",
    );

  const getPropertyHistory = (propertyId: string) =>
    contractHistory.filter((c) => c.property_id === propertyId);

  const getOwnerName = (property: Property) => {
    if (property.proprietaire_client) {
      return `${property.proprietaire_client.prenom} ${property.proprietaire_client.nom}`;
    }
    return property.proprietaire || "";
  };

  const filtered = properties.filter((p) =>
    `${p.adresse} ${getOwnerName(p)} ${p.type_bien}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  const propertyTypeOptions = [
    { value: "studio", label: "Studio" },
    { value: "chambre", label: "Chambre" },
    { value: "chambre-salon", label: "Chambre-Salon" },
    { value: "appartement", label: "Appartement" },
    { value: "terrain", label: "Terrain" },
    { value: "magasin", label: "Magasin" },
    { value: "bureau", label: "Bureau" },
    { value: "villa", label: "Villa" },
  ];

  return (
    <>
      <div className="flex justify-end mb-4">
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium hover:opacity-90"
          style={{
            backgroundColor: settings.primary_color,
            color: "var(--color-on-primary)",
          }}
        >
          <Plus size={16} /> Nouveau Bien
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-gray-400">
          <Building2 size={40} className="mb-2 opacity-30" />
          <p className="text-sm">Aucun bien immobilier</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => {
            const st = getPropertyStatusConfig(p.statut);
            const contract = getActiveContract(p.id);
            const tenant = contract
              ? getTenantName(contract.locataires)
              : "";
            const historyCount = getPropertyHistory(p.id).length;
            const ownerName = getOwnerName(p);

            return (
              <div
                key={p.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 rounded-xl bg-blue-50">
                    <Building2 size={20} className="text-blue-600" />
                  </div>
                  <Badge label={st.label} color={st.color} />
                </div>
                <div className="font-semibold text-gray-800 mb-1">
                  {getPropertyTypeLabel(p.type_bien)}
                </div>
                <div className="text-sm text-gray-500 mb-2 truncate">
                  {p.adresse}
                </div>
                {ownerName && (
                  <div className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                    <User size={11} className="text-gray-400" />
                    Propriétaire: {ownerName}
                  </div>
                )}

                {contract && tenant ? (
                  <div className="flex items-center gap-2 mb-2 py-2 px-3 bg-blue-50 rounded-xl">
                    <div className="w-7 h-7 rounded-full bg-blue-200 flex items-center justify-center flex-shrink-0">
                      <User size={12} className="text-blue-700" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-blue-800 truncate">
                        {tenant}
                      </p>
                      <p className="text-xs text-blue-600">
                        {formatMontantImmo(contract.loyer_mensuel + (contract.charges || 0))} FCFA/mois
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mb-2 py-2 px-3 bg-green-50 rounded-xl">
                    <p className="text-xs text-green-600 font-medium">
                      Pas de locataire actuel
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <div>
                    {p.loyer_mensuel > 0 && (
                      <div className="text-sm font-medium text-green-600">
                        {formatMontantImmo(p.loyer_mensuel)} FCFA/mois
                        {p.charges > 0 && (
                          <span className="text-xs text-gray-500 ml-1.5">
                            (+{formatMontantImmo(p.charges)} charges)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {historyCount > 0 && (
                      <button
                        onClick={() => setHistoryProperty(p)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                        title={`${historyCount} contrat(s) dans l'historique`}
                      >
                        <History size={15} />
                      </button>
                    )}
                    <button
                      onClick={() => openEdit(p)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      title="Modifier"
                    >
                      <Edit size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {historyProperty && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">
                Historique — {historyProperty.adresse}
              </h3>
              <button
                onClick={() => setHistoryProperty(null)}
                className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3">
              {getPropertyHistory(historyProperty.id).map((c) => {
                const tenantName = getTenantName(c.locataires);
                const statusConfig = getContractStatusConfig(c.statut);
                return (
                  <div
                    key={c.id}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl"
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <User size={14} className="text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {tenantName || "Locataire inconnu"}
                        </p>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusConfig.classes}`}
                        >
                          {statusConfig.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {c.date_debut} → {c.date_fin || "En cours"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatMontantImmo(c.loyer_mensuel + (c.charges || 0))} FCFA/mois
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Modifier le Bien" : "Nouveau Bien Immobilier"}
      >
        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Type de Bien
              </label>
              <select
                value={form.type_bien}
                onChange={(e) =>
                  setForm({
                    ...form,
                    type_bien: e.target.value as Property["type_bien"],
                  })
                }
                className={inputClass}
              >
                {propertyTypeOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Statut
              </label>
              <select
                value={form.statut}
                onChange={(e) =>
                  setForm({
                    ...form,
                    statut: e.target.value as Property["statut"],
                  })
                }
                className={inputClass}
              >
                <option value="disponible">Disponible</option>
                <option value="loue">Loué</option>
                <option value="en_vente">En Vente</option>
                <option value="vendu">Vendu</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Adresse *
            </label>
            <input
              type="text"
              value={form.adresse}
              onChange={(e) => setForm({ ...form, adresse: e.target.value })}
              className={inputClass}
              placeholder="Ex: Cocody, Rue des Jardins..."
            />
          </div>
          <div>
            <SelectWithCreate
              value={form.proprietaire_id}
              onChange={(val) => setForm({ ...form, proprietaire_id: val })}
              options={clients.map((c) => ({ value: c.id, label: `${c.prenom} ${c.nom} ${c.telephone ? `(${c.telephone})` : ""}` }))}
              placeholder="Sélectionner un client..."
              label="Propriétaire (Client) *"
              required
              createModalTitle="Nouveau Client (Propriétaire)"
              createFields={[
                { key: "prenom", label: "Prénom", type: "text", placeholder: "Prénom", required: true },
                { key: "nom", label: "Nom", type: "text", placeholder: "Nom", required: true },
                { key: "telephone", label: "Téléphone", type: "tel", placeholder: "+225 07 00 00 00", required: true },
                { key: "email", label: "Email", type: "email", placeholder: "email@exemple.com", required: false },
                { key: "adresse", label: "Adresse", type: "text", placeholder: "Adresse...", required: false },
                { key: "type_client", label: "Type de Client", type: "select", required: true, options: [
                  { value: "particulier", label: "Particulier" },
                  { value: "entreprise", label: "Entreprise" },
                  { value: "promoteur_immobilier", label: "Promoteur Immobilier" },
                  { value: "institution", label: "Institution" },
                ]},
                { key: "notes", label: "Notes", type: "textarea", placeholder: "Notes...", required: false },
              ]}
              validateCreateForm={(data) => {
                const errors: Record<string, string> = {};
                if (!data.prenom?.trim()) errors.prenom = "Le prénom est obligatoire";
                if (!data.nom?.trim()) errors.nom = "Le nom est obligatoire";
                if (!data.telephone?.trim()) errors.telephone = "Le téléphone est obligatoire";
                if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
                  errors.email = "Format d'email invalide";
                }
                return Object.keys(errors).length > 0 ? errors : null;
              }}
              onCreate={async (data) => {
                const now = new Date().toISOString();
                const payload = {
                  nom: data.nom,
                  prenom: data.prenom,
                  telephone: data.telephone,
                  email: data.email || null,
                  adresse: data.adresse || null,
                  type_client: data.type_client || "particulier",
                  notes: data.notes || null,
                  updated_at: now,
                };
                const { data: newClient, error } = await clientsRepository.create(payload);
                if (error) throw new Error(error);
                // Refresh clients list from cache
                const cached = readManualCache<Client>(CLIENTS_CACHE_KEY);
                const updated = [...cached, newClient].sort((a, b) =>
                  `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`)
                );
                writeManualCache(CLIENTS_CACHE_KEY, updated);
                return { value: newClient.id, label: `${data.prenom} ${data.nom} ${data.telephone ? `(${data.telephone})` : ""}` };
              }}
            />
            <p className="text-xs text-gray-500 mt-1">
              Le propriétaire doit être un client enregistré. Le contrat de mandat sera stocké dans le filebrowser.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Loyer/mois (FCFA)
              </label>
              <input
                type="number"
                value={form.loyer_mensuel}
                onChange={(e) =>
                  setForm({ ...form, loyer_mensuel: e.target.value })
                }
                className={inputClass}
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Charges/mois (FCFA)
              </label>
              <input
                type="number"
                value={form.charges}
                onChange={(e) =>
                  setForm({ ...form, charges: e.target.value })
                }
                className={inputClass}
                placeholder="0"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={3}
              className={`${inputClass} resize-none`}
              placeholder="Caractéristiques, équipements, etc."
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setModalOpen(false)}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form.adresse.trim() || !form.proprietaire_id.trim()}
              className="flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
              style={{
                backgroundColor: settings.primary_color,
                color: "var(--color-on-primary)",
              }}
            >
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}