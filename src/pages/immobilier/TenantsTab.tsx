import { useState, useMemo } from "react";
import {
  Plus,
  User,
  CreditCard as Edit,
  Trash2,
  Phone,
  Mail,
} from "lucide-react";
import type { Tenant, LeaseContract, Client } from "../../types";
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
import { isValidEmail, isValidPhone } from "../../lib/immobilier";
import {
  type ManualSyncStatus,
  normalizeManualStatus,
  readManualCache,
  writeManualCache,
} from "../../lib/manualSyncStore";
import { clientsRepository } from "../../lib/dbClient.service";
import { generateUUID } from "../../utils/reference";

const emptyForm = {
  client_id: "",
  nom: "",
  prenom: "",
  telephone: "",
  email: "",
  loyer: "",
  depot_garantie: "",
  statut: "actif" as Tenant["statut"],
};

const TENANTS_CACHE_KEY = "egs.immobilier.tenants.local_cache.v1";
const CLIENTS_CACHE_KEY = "egs.clients.local_cache.v1";

type LocalTenant = Tenant & {
  sync_status: ManualSyncStatus;
  sync_error: string | null;
  deleted_at: string | null;
};

function sortTenants(items: LocalTenant[]): LocalTenant[] {
  return [...items].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

interface Props {
  tenants: Tenant[];
  activeContracts: LeaseContract[];
  search: string;
  tenantTableName: "locataires" | "tenants";
  onRefresh: () => void;
}

export default function TenantsTab({
  tenants,
  activeContracts,
  search,
  tenantTableName: _tenantTableName,
  onRefresh,
}: Props) {
  const { settings } = useSettings();
  const { showToast } = useNotifications();
  const { user, profile } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [syncErrorModalOpen, setSyncErrorModalOpen] = useState(false);
  const [syncErrorContent, setSyncErrorContent] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const destructiveActionsDisabled = shouldBlockDestructiveAction(
    user,
    profile,
  );

  // Get clients from cache for tenant selection
  const clients = useMemo(() => {
    const cached = readManualCache<Client>(CLIENTS_CACHE_KEY);
    return cached.sort((a, b) => 
        `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`)
      );
  }, []);

  const localTenants = useMemo(() => {
    return readManualCache<LocalTenant>(TENANTS_CACHE_KEY) || [];
  }, []);

  const inputClass =
    "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400";

  const openAdd = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (t: Tenant) => {
    setForm({
      client_id: t.client_id || "",
      nom: t.nom,
      prenom: t.prenom,
      telephone: t.telephone || "",
      email: t.email || "",
      loyer: String(t.loyer || 0),
      depot_garantie: String(t.depot_garantie || 0),
      statut: t.statut,
    });
    setEditingId(t.id);
    setError(null);
    setModalOpen(true);
  };

  const handleClientChange = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setForm(prev => ({
        ...prev,
        nom: client.nom,
        prenom: client.prenom,
        telephone: client.telephone || "",
        email: client.email || "",
        client_id: client.id,
      }));
    }
  };

  const handleSave = async () => {
    if (!form.client_id.trim()) {
      setError("Le client est obligatoire (choisir dans la liste des clients)");
      return;
    }

    if (form.email && !isValidEmail(form.email)) {
      setError("Format d'email invalide");
      return;
    }

    if (form.telephone && !isValidPhone(form.telephone)) {
      setError("Format de téléphone invalide");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const now = new Date().toISOString();
      const cached = readManualCache<LocalTenant>(TENANTS_CACHE_KEY).map(
        (tenant) => ({
          ...tenant,
          sync_status: normalizeManualStatus(tenant.sync_status),
          sync_error: tenant.sync_error ?? null,
          deleted_at: tenant.deleted_at ?? null,
        }),
      );
      const existing = cached.find((tenant) => tenant.id === editingId);
      const selectedClient = clients.find(c => c.id === form.client_id);
      
      const localTenant: LocalTenant = {
        ...(existing ?? {}),
        id: existing?.id ?? generateUUID(),
        client_id: form.client_id.trim() || null,
        nom: selectedClient?.nom || form.nom.trim(),
        prenom: selectedClient?.prenom || form.prenom.trim(),
        telephone: form.telephone.trim() || null,
        email: form.email.trim() || null,
        property_id: existing?.property_id ?? null,
        date_debut_contrat: existing?.date_debut_contrat ?? null,
        date_fin_contrat: existing?.date_fin_contrat ?? null,
        loyer: parseFloat(form.loyer) || 0,
        depot_garantie: parseFloat(form.depot_garantie) || 0,
        statut: form.statut,
        created_at: existing?.created_at ?? now,
        updated_at: now,
        sync_status: "pending",
        sync_error: null,
        deleted_at: null,
      };

      const next = sortTenants(
        cached.filter((tenant) => tenant.id !== localTenant.id).concat(localTenant),
      );
      writeManualCache(TENANTS_CACHE_KEY, next);
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
      !confirm(
        "Supprimer ce locataire ?\n\nLes contrats associés seront également supprimés.",
      )
    )
      return;
    try {
      const now = new Date().toISOString();
      const cached = readManualCache<LocalTenant>(TENANTS_CACHE_KEY);
      const next = cached
        .map((tenant) => {
          if (tenant.id !== id) return tenant;
          if (normalizeManualStatus(tenant.sync_status) === "pending") {
            return null;
          }
          return {
            ...tenant,
            sync_status: "deleted" as const,
            deleted_at: now,
            updated_at: now,
            sync_error: null,
          };
        })
        .filter(Boolean) as LocalTenant[];
      writeManualCache(TENANTS_CACHE_KEY, sortTenants(next));
      onRefresh();
    } catch (err: any) {
      showToast("error","Erreur suppression",`Erreur lors de la suppression locale: ${err.message}`);
    }
  };

  const getTenantContract = (tenantId: string) =>
    activeContracts.find(
      (c) => c.locataire_id === tenantId && c.statut === "actif",
    );

  const getClientName = (tenant: Tenant) => {
    if (tenant.client) {
      return `${tenant.client.prenom} ${tenant.client.nom}`;
    }
    return `${tenant.prenom} ${tenant.nom}`;
  };

  const filtered = tenants.filter((t) => {
    const clientName = getClientName(t);
    const phone = (t.telephone || "").toLowerCase();
    const email = (t.email || "").toLowerCase();
    return (
      clientName.toLowerCase().includes(search.toLowerCase()) ||
      phone.includes(search.toLowerCase()) ||
      email.includes(search.toLowerCase())
    );
  });

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
          <Plus size={16} /> Nouveau Locataire
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <User size={40} className="mb-2 opacity-30" />
            <p className="text-sm">Aucun locataire enregistré</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full egs-table">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Locataire (Client)
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">
                    Contact
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Bien loué
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">
                    Loyer
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Statut
                  </th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((t) => {
                  const contract = getTenantContract(t.id);
                  const prop = contract?.properties;
                  const clientName = getClientName(t);

                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <User size={14} className="text-blue-600" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-800">
                                {clientName}
                              </span>
                              {(() => {
                                const local = localTenants.find((lt) => lt.id === t.id) || null;
                                const status = local ? normalizeManualStatus(local.sync_status) : null;
                                if (!status) return null;
                                const onClick = () => {
                                  if (local?.sync_error) {
                                    setSyncErrorContent(local.sync_error);
                                    setSyncErrorModalOpen(true);
                                  }
                                };
                                if (status === "pending") return <button onClick={onClick} title={local?.sync_error ?? ''}><Badge label="En attente" color="orange" /></button>;
                                if (status === "synced") return <button onClick={onClick} title={local?.sync_error ?? ''}><Badge label="Synced" color="green" /></button>;
                                if (status === "deleted") return <button onClick={onClick} title={local?.sync_error ?? ''}><Badge label="Supprimé" color="red" /></button>;
                                return local?.sync_error ? <button onClick={onClick} title={local?.sync_error ?? ''}><Badge label="Erreur" color="red" /></button> : null;
                              })()}
                            </div>
                            {t.client && (
                              <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                Client EGS
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <div className="space-y-0.5">
                          {t.telephone && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                              <Phone size={11} /> {t.telephone}
                            </div>
                          )}
                          {t.email && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                              <Mail size={11} /> {t.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {prop ? (
                          <span className="text-xs text-gray-700 font-medium">
                            {prop.adresse}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 italic">
                            Sans contrat actif
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {contract ? (
                          <span className="text-sm font-medium text-green-600">
                            {contract.loyer_mensuel.toLocaleString("fr-FR")}{" "}
                            FCFA
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          label={t.statut === "actif" ? "Actif" : "Inactif"}
                          color={t.statut === "actif" ? "green" : "gray"}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={() => openEdit(t)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Modifier"
                          >
                            <Edit size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(t.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Modifier le Locataire" : "Nouveau Locataire"}
      >
        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {error}
            </div>
          )}
          
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-2">
            <p className="text-sm text-blue-800 mb-2">
              <strong>Associer à un client EGS :</strong> Le locataire doit être un client enregistré.
              Le contrat de bail sera stocké dans le filebrowser.
            </p>
            <div>
              <SelectWithCreate
                value={form.client_id}
                onChange={(val) => handleClientChange(val)}
                options={clients.map((client) => ({ value: client.id, label: `${client.prenom} ${client.nom} (${client.telephone})` }))}
                placeholder="Sélectionner un client..."
                label="Client *"
                required
                createModalTitle="Nouveau Client (Locataire)"
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
                  return { value: newClient.id, label: `${data.prenom} ${data.nom} (${data.telephone})` };
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Prénom
              </label>
              <input
                type="text"
                value={form.prenom}
                onChange={(e) => setForm({ ...form, prenom: e.target.value })}
                className={inputClass}
                placeholder="Ex: Kouamé"
                readOnly={!!form.client_id}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Nom *
              </label>
              <input
                type="text"
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                className={inputClass}
                placeholder="Ex: Konan"
                readOnly={!!form.client_id}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Téléphone
              </label>
              <input
                type="tel"
                value={form.telephone}
                onChange={(e) =>
                  setForm({ ...form, telephone: e.target.value })
                }
                className={inputClass}
                placeholder="Ex: 07 07 07 07 07"
                readOnly={!!form.client_id}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={inputClass}
                placeholder="Ex: konan@example.com"
                readOnly={!!form.client_id}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Loyer par défaut (FCFA)
              </label>
              <input
                type="number"
                value={form.loyer}
                onChange={(e) =>
                  setForm({ ...form, loyer: e.target.value })
                }
                className={inputClass}
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Dépôt de garantie (FCFA)
              </label>
              <input
                type="number"
                value={form.depot_garantie}
                onChange={(e) =>
                  setForm({ ...form, depot_garantie: e.target.value })
                }
                className={inputClass}
                placeholder="0"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Statut
            </label>
            <select
              value={form.statut}
              onChange={(e) =>
                setForm({ ...form, statut: e.target.value as Tenant["statut"] })
              }
              className={inputClass}
            >
              <option value="actif">Actif</option>
              <option value="inactif">Inactif</option>
            </select>
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
              disabled={saving || !form.client_id.trim()}
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
      <Modal
        isOpen={syncErrorModalOpen}
        onClose={() => setSyncErrorModalOpen(false)}
        title={"Détails d'erreur de synchronisation"}
        size="sm"
      >
        <div className="text-sm text-gray-700">
          <pre className="whitespace-pre-wrap break-words text-xs bg-gray-50 p-3 rounded-md border border-gray-100">{syncErrorContent}</pre>
        </div>
      </Modal>
    </>
  );
}