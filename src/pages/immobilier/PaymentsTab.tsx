import { useState, useMemo } from "react";
import {
  Plus,
  CreditCard as Edit,
  Trash2,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  DollarSign,
  User,
} from "lucide-react";
import type { RentPayment, LeaseContract, Tenant, Property } from "../../types";
import Modal from "../../components/ui/Modal";
import SelectWithCreate from "../../components/ui/SelectWithCreate";
import { useSettings } from "../../context/SettingsContext";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import {
  getDemoBlockMessage,
  shouldBlockDestructiveAction,
} from "../../lib/demoMode";
import { generateReference, generateUUID } from "../../utils/reference";
import {
  type ManualSyncStatus,
  normalizeManualStatus,
  readManualCache,
  writeManualCache,
} from "../../lib/manualSyncStore";
import {
  getTenantName,
  formatMontantImmo,
  getPaymentStatusConfig,
} from "../../lib/immobilier";

const emptyForm = {
  contract_id: "",
  montant: "",
  date_paiement: "",
  date_echeance: "",
  mois_concerne: "",
  mode_paiement: "especes" as RentPayment["mode_paiement"],
  statut: "en_attente" as RentPayment["statut"],
  notes: "",
  locataire_id: "",
};

const PAYMENTS_CACHE_KEY = "egs.immobilier.payments.local_cache.v1";
const CONTRACTS_CACHE_KEY = "egs.immobilier.contracts.local_cache.v1";
const PROPERTIES_CACHE_KEY = "egs.immobilier.properties.local_cache.v1";
const TENANTS_CACHE_KEY = "egs.immobilier.tenants.local_cache.v1";

type LocalRentPayment = RentPayment & {
  updated_at: string;
  sync_status: ManualSyncStatus;
  sync_error: string | null;
  deleted_at: string | null;
};

function sortPayments(items: LocalRentPayment[]): LocalRentPayment[] {
  return [...items].sort(
    (a, b) =>
      new Date(b.date_paiement || b.created_at).getTime() -
      new Date(a.date_paiement || a.created_at).getTime(),
  );
}

// Get last month in YYYY-MM format
function getLastMonth(): string {
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return lastMonth.toISOString().slice(0, 7); // YYYY-MM
}

// Get due date (10th of current month)
function getDueDate(): string {
  const now = new Date();
  const dueDate = new Date(now.getFullYear(), now.getMonth(), 10);
  return dueDate.toISOString().split("T")[0];
}

interface Props {
  payments: RentPayment[];
  contracts: LeaseContract[];
  tenants: Tenant[];
  properties: Property[];
  search: string;
  onRefresh: () => void;
}

export default function PaymentsTab({
  payments: paymentsProp,
  contracts,
  tenants,
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
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<RentPayment["statut"] | "all">(
    "all",
  );
  const destructiveActionsDisabled = shouldBlockDestructiveAction(
    user,
    profile,
  );

  const inputClass =
    "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400";

  // Group payments by tenant/client
  const paymentsByTenant = useMemo(() => {
    const grouped: Record<string, RentPayment[]> = {};
    
    const filtered = paymentsProp.filter((p) =>
      `${p.reference} ${getTenantName(p.locataires as any)}`
        .toLowerCase()
        .includes(search.toLowerCase()),
    ).filter((p) => filterStatus === "all" || p.statut === filterStatus);

    for (const payment of filtered) {
      const tenantId = payment.locataire_id || '';
      const key = tenantId || `unknown-${payment.id}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(payment);
    }
    return grouped;
  }, [paymentsProp, search, filterStatus]);

  // Sort tenants by name for display
  const sortedTenantGroups = useMemo(() => {
    return Object.entries(paymentsByTenant)
      .map(([tenantId, payments]) => {
        // Find tenant info
        const firstPayment = payments[0];
        const contract = contracts.find(c => c.id === firstPayment.contract_id);
        const locataireId = contract?.locataire_id;
        const tenant = tenants.find(t => t.id === locataireId);
        const client = tenant?.client;
        const tenantName = client ? `${client.prenom} ${client.nom}` : getTenantName(({ prenom: tenant?.prenom, nom: tenant?.nom } as any));
        
        // Sort payments by date (newest first)
        const sortedPayments = [...payments].sort((a, b) => 
          new Date(b.date_paiement || b.created_at).getTime() - 
          new Date(a.date_paiement || a.created_at).getTime()
        );
        
        return { tenantId, tenantName, payments: sortedPayments, tenant, contract };
      })
      .sort((a, b) => a.tenantName.localeCompare(b.tenantName));
  }, [paymentsByTenant, contracts, tenants]);

  const openAdd = () => {
    const lastMonth = getLastMonth();
    const dueDate = getDueDate();
    setForm({
      ...emptyForm,
      date_paiement: new Date().toISOString().split("T")[0],
      date_echeance: dueDate,
      mois_concerne: lastMonth,
      locataire_id: "",
    });
    setEditingId(null);
    setError(null);
    setModalOpen(true);
  };

  const handleContractChange = (contractId: string) => {
    const contract = contracts.find((c) => c.id === contractId);
    if (contract) {
      const lastMonth = getLastMonth();
      const dueDate = getDueDate();
      setForm((f) => ({
        ...f,
        contract_id: contractId,
        locataire_id: contract.locataire_id || "",
        montant: String(contract.loyer_mensuel + (contract.charges || 0)),
        date_echeance: dueDate,
        mois_concerne: lastMonth,
      }));
    } else {
      setForm((f) => ({ ...f, contract_id: "", locataire_id: "", montant: "" }));
    }
  };

  const openEdit = (p: RentPayment) => {
    setForm({
      contract_id: p.contract_id || "",
      montant: String(p.montant),
      date_paiement: p.date_paiement || p.date_paiement_effectif || "",
      date_echeance: p.date_echeance || "",
      mois_concerne: p.mois_concerne || "",
      mode_paiement: p.mode_paiement,
      statut: p.statut,
      notes: p.notes || "",
      locataire_id: p.locataire_id || "",
    });
    setEditingId(p.id);
    setError(null);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.contract_id || !form.montant || !form.date_paiement) {
      setError("Contrat, montant et date de paiement sont obligatoires");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const now = new Date().toISOString();
      const cached = readManualCache<LocalRentPayment>(PAYMENTS_CACHE_KEY).map(
        (payment) => ({
          ...payment,
          sync_status: normalizeManualStatus(payment.sync_status),
          sync_error: payment.sync_error ?? null,
          deleted_at: payment.deleted_at ?? null,
        }),
      );
      const existing = cached.find((payment) => payment.id === editingId);
      const localPayment: LocalRentPayment = {
        ...(existing ?? {}),
        id: existing?.id ?? generateUUID(),
        reference: existing?.reference ?? generateReference("QTT"),
        contract_id: form.contract_id,
        property_id: existing?.property_id ?? "",
        montant: parseFloat(form.montant) || 0,
        date_paiement: form.date_paiement || "",
        date_echeance: form.date_echeance || null,
        mois_concerne: form.mois_concerne || "",
        mode_paiement: form.mode_paiement,
        statut: form.statut,
        notes: form.notes.trim() || null,
        locataire_id: form.locataire_id || null,
        sync_status: "pending",
        sync_error: null,
        deleted_at: null,
        date_paiement_effectif: null,
        created_at: existing?.created_at ?? now,
        updated_at: now,
      };

      const next = sortPayments(
        cached.filter((payment) => payment.id !== localPayment.id).concat(localPayment),
      );
      writeManualCache(PAYMENTS_CACHE_KEY, next);
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
    if (!confirm("Supprimer ce paiement ? Cette action est irréversible."))
      return;
    try {
      const now = new Date().toISOString();
      const cached = readManualCache<LocalRentPayment>(PAYMENTS_CACHE_KEY);
      const next = cached
        .map((payment) => {
          if (payment.id !== id) return payment;
          if (normalizeManualStatus(payment.sync_status) === "pending") {
            return null;
          }
          return {
            ...payment,
            sync_status: "deleted" as const,
            deleted_at: now,
            updated_at: now,
            sync_error: null,
          };
        })
        .filter(Boolean) as LocalRentPayment[];
      writeManualCache(PAYMENTS_CACHE_KEY, sortPayments(next));
      onRefresh();
    } catch (err: any) {
      showToast("error","Erreur suppression",`Erreur lors de la suppression locale: ${err.message}`);
    }
  };

  const handleStatusChange = async (p: RentPayment, newStatus: RentPayment["statut"]) => {
    try {
      const now = new Date().toISOString();
      const cached = readManualCache<LocalRentPayment>(PAYMENTS_CACHE_KEY);
      const next = cached.map((payment) =>
        payment.id === p.id
          ? {
              ...payment,
              statut: newStatus,
              updated_at: now,
              date_paiement_effectif:
                newStatus === "paye" ? new Date().toISOString().split("T")[0] : payment.date_paiement_effectif,
              sync_status:
                normalizeManualStatus(payment.sync_status) === "synced"
                  ? "pending"
                  : normalizeManualStatus(payment.sync_status),
            }
          : payment,
      );
      writeManualCache(PAYMENTS_CACHE_KEY, sortPayments(next));
      onRefresh();
    } catch (err: any) {
      showToast("error","Erreur",`Erreur lors du changement de statut: ${err.message}`);
    }
  };

  // Get active contracts for dropdown
  const activeContracts = contracts
    .filter((c) => c.statut === "actif")
    .sort((a, b) => {
      const contractTenantIdA = a.locataire_id;
      const contractTenantIdB = b.locataire_id;
      const tenantA = tenants.find((t) => t.id === contractTenantIdA);
      const tenantB = tenants.find((t) => t.id === contractTenantIdB);
      return getTenantName(tenantA).localeCompare(getTenantName(tenantB));
    });

  const totalCollected = paymentsProp
    .filter((p) => p.statut === "paye")
    .reduce((sum, p) => sum + p.montant, 0);
  const totalPending = paymentsProp
    .filter((p) => p.statut === "en_attente")
    .reduce((sum, p) => sum + p.montant, 0);
  const totalOverdue = paymentsProp
    .filter((p) => p.statut === "retard")
    .reduce((sum, p) => sum + p.montant, 0);

  return (
    <>
      <div className="mb-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle size={16} className="text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Encaissé</p>
                <p className="text-lg font-bold text-green-600">
                  {formatMontantImmo(totalCollected)} FCFA
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <Clock size={16} className="text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">En attente</p>
                <p className="text-lg font-bold text-amber-600">
                  {formatMontantImmo(totalPending)} FCFA
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                <XCircle size={16} className="text-red-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">En retard</p>
                <p className="text-lg font-bold text-red-600">
                  {formatMontantImmo(totalOverdue)} FCFA
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <DollarSign size={16} className="text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total</p>
                <p className="text-lg font-bold text-gray-800">
                  {formatMontantImmo(totalCollected + totalPending + totalOverdue)} FCFA
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1">
          <select
            value={filterStatus}
            onChange={(e) =>
              setFilterStatus(e.target.value as RentPayment["statut"] | "all")
            }
            className={inputClass}
          >
            <option value="all">Tous les statuts</option>
            <option value="en_attente">En attente</option>
            <option value="paye">Payé</option>
            <option value="en_retard">En retard</option>
            <option value="annule">Annulé</option>
          </select>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium hover:opacity-90 whitespace-nowrap"
          style={{
            backgroundColor: settings.primary_color,
            color: "var(--color-on-primary)",
          }}
        >
          <Plus size={16} /> Nouvelle Quittance
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {sortedTenantGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <FileText size={40} className="mb-2 opacity-30" />
            <p className="text-sm">Aucun paiement trouvé</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {sortedTenantGroups.map(({ tenantId, tenantName, payments, tenant, contract }) => {
              const commissionRate = contract?.commission_rate || 12;
              const ownerShare = 100 - commissionRate;
              
              return (
                <div key={tenantId} className="p-4">
                  {/* Tenant Header */}
                  <div className="mb-4 pb-3 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <User size={18} className="text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 text-lg">
                            {tenantName || "Locataire inconnu"}
                          </h3>
                          {tenant?.client && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                              Client EGS
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        {contract && (
                          <>
                            <span className="px-2 py-1 bg-green-50 text-green-700 rounded-lg font-medium">
                              Commission: {commissionRate}% (Entreprise)
                            </span>
                            <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg font-medium">
                              Propriétaire: {ownerShare}%
                            </span>
                          </>
                        )}
                        <span className="text-gray-500">{payments.length} paiement(s)</span>
                      </div>
                    </div>
                    {tenant?.telephone && (
                      <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                        📞 {tenant.telephone}
                      </p>
                    )}
                  </div>

                  {/* Payments table for this tenant */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                            Référence
                          </th>
                          <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                            Période
                          </th>
                          <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                            Montant
                          </th>
                          <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">
                            Part Entreprise
                          </th>
                          <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">
                            Part Propriétaire
                          </th>
                          <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">
                            Échéance
                          </th>
                          <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                            Mode
                          </th>
                          <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                            Statut
                          </th>
                          <th className="px-4 py-2"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {payments.map((p) => {
                          const statusCfg = getPaymentStatusConfig(p.statut);
                          const contractForPayment = contracts.find(c => c.id === p.contract_id);
                          const rate = contractForPayment?.commission_rate || 12;
                          const enterpriseShare = Math.round((p.montant * rate) / 100);
                          const ownerShareAmount = p.montant - enterpriseShare;
                          
                          return (
                            <tr
                              key={p.id}
                              className="hover:bg-gray-50 transition-colors"
                            >
                              <td className="px-4 py-3">
                                <span className="table-key">{p.reference}</span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-sm text-gray-700">
                                  {p.mois_concerne || "—"}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <span className="text-sm font-semibold text-green-600">
                                  {formatMontantImmo(p.montant)} FCFA
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right hidden md:table-cell">
                                <span className="text-sm text-blue-700 font-medium">
                                  {formatMontantImmo(enterpriseShare)} FCFA
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right hidden md:table-cell">
                                <span className="text-sm text-green-700 font-medium">
                                  {formatMontantImmo(ownerShareAmount)} FCFA
                                </span>
                              </td>
                              <td className="px-4 py-3 hidden sm:table-cell">
                                <span className="text-xs text-gray-500">
                                  {p.date_echeance ? new Date(p.date_echeance).toLocaleDateString("fr-FR") : "—"}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="inline-flex items-center gap-1 text-xs text-gray-600 bg-gray-50 px-2 py-0.5 rounded-full">
                                  <DollarSign size={10} /> {p.mode_paiement}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`text-xs px-2 py-1 rounded-full font-medium ${statusCfg.color === 'green' ? 'bg-green-100 text-green-700' : statusCfg.color === 'red' ? 'bg-red-100 text-red-700' : statusCfg.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' : 'bg-orange-100 text-orange-700'}`}
                                >
                                  {statusCfg.label}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1 justify-end">
                                  {p.statut === "en_attente" && (
                                    <button
                                      onClick={() =>
                                        handleStatusChange(p, "paye")
                                      }
                                      className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                                      title="Marquer comme payé"
                                    >
                                      <CheckCircle size={15} className="text-green-500" />
                                    </button>
                                  )}
                                  {p.statut === "retard" && (
                                    <button
                                      onClick={() =>
                                        handleStatusChange(p, "paye")
                                      }
                                      className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                                      title="Marquer comme payé"
                                    >
                                      <CheckCircle size={15} className="text-green-500" />
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
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Modifier le Paiement" : "Nouveau Paiement / Quittance"}
      >
        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {error}
            </div>
          )}
          
          {/* Auto-fill info banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
            <p className="text-xs text-blue-800">
              <strong>Période par défaut :</strong> Mois dernier ({getLastMonth()}) — 
              <strong>Échéance :</strong> 10 du mois en cours ({getDueDate().split("-").reverse().join("/")})
            </p>
          </div>

          <div>
            <SelectWithCreate
              value={form.contract_id}
              onChange={(val) => handleContractChange(val)}
              options={activeContracts.map((c) => {
                const contractTenantId = c.locataire_id;
                const tenant = tenants.find(
                  (t) => t.id === contractTenantId,
                );
                const locataireName = tenant
                  ? getTenantName(tenant)
                  : "Inconnu";
                return {
                  value: c.id,
                  label: `${c.reference} — ${locataireName} (${c.loyer_mensuel + (c.charges || 0)} FCFA)`
                };
              })}
              placeholder="Sélectionner un contrat..."
              label="Contrat de location *"
              required
              createModalTitle="Nouveau Contrat de Location"
              createFields={[
                { key: "property_id", label: "Bien Immobilier", type: "select", required: true },
                { key: "locataire_id", label: "Locataire", type: "select", required: true },
                { key: "date_debut", label: "Date début", type: "date", required: true },
                { key: "date_fin", label: "Date fin", type: "date", required: false },
                { key: "loyer_mensuel", label: "Loyer mensuel (FCFA)", type: "number", placeholder: "0", required: true },
                { key: "charges", label: "Charges (FCFA)", type: "number", placeholder: "0", required: false },
                { key: "depot_garantie", label: "Dépôt de garantie", type: "number", placeholder: "0", required: false },
                { key: "statut", label: "Statut", type: "select", required: true, options: [
                  { value: "actif", label: "Actif" },
                  { value: "termine", label: "Terminé" },
                  { value: "resilie", label: "Résilié" },
                  { value: "renouvele", label: "Renouvelé" },
                ]},
              ]}
              validateCreateForm={(data) => {
                const errors: Record<string, string> = {};
                if (!data.property_id) errors.property_id = "Le bien est obligatoire";
                if (!data.locataire_id) errors.locataire_id = "Le locataire est obligatoire";
                if (!data.date_debut) errors.date_debut = "La date de début est obligatoire";
                if (!data.loyer_mensuel) errors.loyer_mensuel = "Le loyer est obligatoire";
                return Object.keys(errors).length > 0 ? errors : null;
              }}
              onCreate={async (data) => {
                const now = new Date().toISOString();
                const payload = {
                  property_id: data.property_id,
                  locataire_id: data.locataire_id,
                  date_debut: data.date_debut,
                  date_fin: data.date_fin || null,
                  loyer_mensuel: parseFloat(data.loyer_mensuel) || 0,
                  charges: parseFloat(data.charges) || 0,
                  depot_garantie: parseFloat(data.depot_garantie) || 0,
                  statut: data.statut || "actif",
                  updated_at: now,
                };
                const cached = readManualCache<any>(CONTRACTS_CACHE_KEY);
                const newContract = { ...payload, id: generateUUID(), created_at: now, reference: generateReference("CTR"), sync_status: "pending", sync_error: null, deleted_at: null };
                writeManualCache(CONTRACTS_CACHE_KEY, [...cached, newContract]);
                return { value: newContract.id, label: `${newContract.reference} — ${tenants.find(t => t.id === data.locataire_id)?.prenom || "Locataire"} (${data.loyer_mensuel} FCFA)` };
              }}
              fetchCreateData={async () => {
                const cachedProps = readManualCache<any>(PROPERTIES_CACHE_KEY);
                const cachedTenants = readManualCache<any>(TENANTS_CACHE_KEY);
                return {
                  property_id: cachedProps
                    .filter((p: any) => p.statut === "disponible")
                    .map((p: any) => ({ value: p.id, label: p.adresse })),
                  locataire_id: cachedTenants
                    .filter((t: any) => t.statut === "actif")
                    .map((t: any) => ({ value: t.id, label: `${t.prenom} ${t.nom}` }))
                };
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Montant (FCFA) *
              </label>
              <input
                type="number"
                value={form.montant}
                onChange={(e) =>
                  setForm({ ...form, montant: e.target.value })
                }
                className={inputClass}
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Date de paiement *
              </label>
              <input
                type="date"
                value={form.date_paiement}
                onChange={(e) =>
                  setForm({ ...form, date_paiement: e.target.value })
                }
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Date d'échéance
              </label>
              <input
                type="date"
                value={form.date_echeance}
                onChange={(e) =>
                  setForm({ ...form, date_echeance: e.target.value })
                }
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Mois concerné (YYYY-MM)
              </label>
              <input
                type="month"
                value={form.mois_concerne}
                onChange={(e) =>
                  setForm({ ...form, mois_concerne: e.target.value })
                }
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Mode de paiement
              </label>
              <select
                value={form.mode_paiement}
                onChange={(e) =>
                  setForm({
                    ...form,
                    mode_paiement: e.target.value as RentPayment["mode_paiement"],
                  })
                }
                className={inputClass}
              >
                <option value="especes">Espèces</option>
                <option value="virement">Virement</option>
                <option value="mobile_money">Mobile Money</option>
                <option value="carte">Carte</option>
                <option value="cheque">Chèque</option>
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
                    statut: e.target.value as RentPayment["statut"],
                  })
                }
                className={inputClass}
              >
                <option value="en_attente">En attente</option>
                <option value="paye">Payé</option>
                <option value="en_retard">En retard</option>
                <option value="annule">Annulé</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className={`${inputClass} resize-none`}
              placeholder="Remarques, référence externe..."
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
              disabled={
                saving || !form.contract_id || !form.montant || !form.date_paiement
              }
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