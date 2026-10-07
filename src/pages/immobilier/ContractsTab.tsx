import { useState } from "react";
import {
  Plus,
  FileText,
  CreditCard as Edit,
  Trash2,
  RefreshCw,
  CheckCircle,
  XCircle,
  Zap,
  AlertCircle,
  Percent,
  Calendar,
} from "lucide-react";
import type { LeaseContract, Property, Tenant, RentPayment, Client } from "../../types";
import dbClient from "../../lib/dbClient.service";
import { apiClient } from "../../api/client";
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
import { generateReference, generateUUID } from "../../utils/reference";
import { printContratBail } from "../../utils/print";
import {
  type ManualSyncStatus,
  normalizeManualStatus,
  readManualCache,
  writeManualCache,
} from "../../lib/manualSyncStore";
import { syncPendingImmobilier } from "../../lib/manualSyncRunner";
import {
  getTenantName,
  getPropertyAddress,
  getContractStatusConfig,
  formatMontantImmo,
  generateMonthRange,
  isDateRangeOverlap,
} from "../../lib/immobilier";

const emptyForm = {
  property_id: "",
  locataire_id: "",
  date_debut: "",
  date_fin: "",
  loyer_mensuel: "",
  charges: "",
  depot_garantie: "",
  statut: "actif" as LeaseContract["statut"],
  notes: "",
  commission_rate: "12",
  jour_echeance: "10",
};

const CONTRACTS_CACHE_KEY = "egs.immobilier.contracts.local_cache.v1";
const PROPERTIES_CACHE_KEY = "egs.immobilier.properties.local_cache.v1";
const PAYMENTS_CACHE_KEY = "egs.immobilier.payments.local_cache.v1";
const CLIENTS_CACHE_KEY = "egs.clients.local_cache.v1";
const TENANTS_CACHE_KEY = "egs.immobilier.tenants.local_cache.v1";

type LocalLeaseContract = LeaseContract & {
  sync_status: ManualSyncStatus;
  sync_error: string | null;
  deleted_at: string | null;
};
type LocalProperty = Property & {
  sync_status: ManualSyncStatus;
  sync_error: string | null;
  deleted_at: string | null;
};
type LocalRentPayment = RentPayment & {
  updated_at: string;
  sync_status: ManualSyncStatus;
  sync_error: string | null;
  deleted_at: string | null;
};

function sortContracts(items: LocalLeaseContract[]): LocalLeaseContract[] {
  return [...items].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

function sortPayments(items: LocalRentPayment[]): LocalRentPayment[] {
  return [...items].sort(
    (a, b) =>
      new Date(b.date_paiement || b.created_at).getTime() -
      new Date(a.date_paiement || a.created_at).getTime(),
  );
}

function sortProperties(items: LocalProperty[]): LocalProperty[] {
  return [...items].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

interface Props {
  contracts: LeaseContract[];
  properties: Property[];
  tenants: Tenant[];
  search: string;
  tenantIdColumn: "locataire_id" | "tenant_id";
  onRefresh: () => void;
}

async function generateMonthlyPayments(
  contract: LeaseContract,
  _tenantIdColumn: "locataire_id" | "tenant_id",
): Promise<{ created: number; skipped: number; error?: string }> {
  try {
    const end = contract.date_fin ? new Date(contract.date_fin) : new Date();
    end.setDate(1);

    const existing = readManualCache<LocalRentPayment>(PAYMENTS_CACHE_KEY);

    const existingMonths = new Set(
      (existing || []).flatMap(
        (p: Pick<RentPayment, "mois_concerne" | "mois_concerne_date">) => {
          const months: string[] = [];
          if (p.mois_concerne) months.push(p.mois_concerne);
          if (p.mois_concerne_date)
            months.push(String(p.mois_concerne_date).slice(0, 7));
          return months;
        },
      ),
    );

    const monthRange = generateMonthRange(
      contract.date_debut,
      contract.date_fin,
    );
    const paymentsToCreate: LocalRentPayment[] = [];

    for (const { mois, moisLabel, lastDay } of monthRange) {
      if (!existingMonths.has(moisLabel) && !existingMonths.has(mois)) {
          const payload: LocalRentPayment = {
            id: generateUUID(),
          contract_id: contract.id,
          property_id: contract.property_id,
          montant: contract.loyer_mensuel + (contract.charges || 0),
          date_paiement: lastDay,
          date_echeance: lastDay,
          mois_concerne: moisLabel,
          mois_concerne_date: `${mois}-01`,
          mode_paiement: "especes",
          statut: "en_attente",
          notes: "",
          reference: generateReference("QTT"),
          locataire_id: contract.locataire_id,
          sync_status: "pending",
          sync_error: null,
          deleted_at: null,
          date_paiement_effectif: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        paymentsToCreate.push(payload);
      }
    }

    if (paymentsToCreate.length > 0) {
      const cached = readManualCache<LocalRentPayment>(PAYMENTS_CACHE_KEY);
      const next = sortPayments(cached.concat(paymentsToCreate));
      writeManualCache(PAYMENTS_CACHE_KEY, next);
    }

    return { created: paymentsToCreate.length, skipped: existingMonths.size };
  } catch (err: any) {
    return {
      created: 0,
      skipped: 0,
      error: err.message || "Erreur lors de la génération",
    };
  }
}

function hasContractOverlap(
  contract: LeaseContract,
  existingContracts: LeaseContract[],
  currentId: string | null,
) {
  return existingContracts.some((other) => {
    if (other.id === currentId) return false;
    if (other.property_id !== contract.property_id) return false;
    if (other.statut !== "actif") return false;

    return isDateRangeOverlap(
      contract.date_debut,
      contract.date_fin,
      other.date_debut,
      other.date_fin,
    );
  });
}

async function updatePropertyStatus(
  propertyId: string,
  statut: "loue" | "disponible",
) {
  const cached = readManualCache<LocalProperty>(PROPERTIES_CACHE_KEY);
  const next = cached.map((property) =>
    property.id === propertyId
      ? {
          ...property,
          statut,
          sync_status:
            normalizeManualStatus(property.sync_status) === "synced"
              ? "pending"
              : normalizeManualStatus(property.sync_status),
          updated_at: new Date().toISOString(),
        }
      : property,
  );
  writeManualCache(PROPERTIES_CACHE_KEY, sortProperties(next));
}

export default function ContractsTab({
  contracts,
  properties,
  tenants,
  search,
  tenantIdColumn,
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
  const destructiveActionsDisabled = shouldBlockDestructiveAction(
    user,
    profile,
  );
  const [generating, setGenerating] = useState<string | null>(null);
  const [genResult, setGenResult] = useState<{
    created: number;
    skipped: number;
    error?: string;
  } | null>(null);
  const [syncErrorModalOpen, setSyncErrorModalOpen] = useState(false);
  const [syncErrorContent, setSyncErrorContent] = useState<string | null>(null);

  const inputClass =
    "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400";

  const openAdd = () => {
    setForm({
      ...emptyForm,
      date_debut: new Date().toISOString().split("T")[0],
    });
    setEditingId(null);
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (c: LeaseContract) => {
    setForm({
      property_id: c.property_id,
      locataire_id: c.locataire_id,
      date_debut: c.date_debut,
      date_fin: c.date_fin || "",
      loyer_mensuel: String(c.loyer_mensuel),
      charges: String(c.charges),
      depot_garantie: String(c.depot_garantie),
      statut: c.statut,
      notes: c.notes || "",
      commission_rate: String(c.commission_rate || 12),
      jour_echeance: String(c.jour_echeance || 10),
    });
    setEditingId(c.id);
    setError(null);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.property_id || !form.locataire_id || !form.date_debut) {
      setError("Le bien, le locataire et la date de début sont obligatoires");
      return;
    }

    const existingContract = editingId
      ? contracts.find((c) => c.id === editingId)
      : null;

    const proposedContract: LeaseContract = {
      id: editingId || "new",
      reference: existingContract?.reference || null,
      property_id: form.property_id,
      locataire_id: form.locataire_id,
      date_debut: form.date_debut,
      date_fin: form.date_fin || null,
      loyer_mensuel: parseFloat(form.loyer_mensuel) || 0,
      charges: parseFloat(form.charges) || 0,
      depot_garantie: parseFloat(form.depot_garantie) || 0,
      statut: form.statut,
      notes: form.notes.trim() || null,
      created_at: existingContract?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      commission_rate: parseFloat(form.commission_rate) || 12,
      jour_echeance: parseInt(form.jour_echeance) || 10,
    };

    if (form.statut === "actif" && hasContractOverlap(proposedContract, contracts, editingId)) {
      setError(
        "Ce bien possède déjà un contrat actif sur une période qui se chevauche.",
      );
      return;
    }

    // Validate commission rate
    const rate = parseFloat(form.commission_rate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      setError("Le taux de commission doit être entre 0 et 100%");
      return;
    }

    // Validate due date
    const dueDay = parseInt(form.jour_echeance);
    if (isNaN(dueDay) || dueDay < 1 || dueDay > 28) {
      setError("Le jour d'échéance doit être entre 1 et 28");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const now = new Date().toISOString();
      const cachedContracts = readManualCache<LocalLeaseContract>(CONTRACTS_CACHE_KEY).map(
        (contract) => ({
          ...contract,
          sync_status: normalizeManualStatus(contract.sync_status),
          sync_error: contract.sync_error ?? null,
          deleted_at: contract.deleted_at ?? null,
        }),
      );
      const existingLocalContract = cachedContracts.find((c) => c.id === editingId);
      const localContract: LocalLeaseContract = {
        ...(existingLocalContract ?? {}),
        id: existingLocalContract?.id ?? generateUUID(),
        reference: existingLocalContract?.reference ?? generateReference("CTR"),
        property_id: form.property_id,
        locataire_id: form.locataire_id,
        date_debut: form.date_debut,
        date_fin: form.date_fin || null,
        loyer_mensuel: parseFloat(form.loyer_mensuel) || 0,
        charges: parseFloat(form.charges) || 0,
        depot_garantie: parseFloat(form.depot_garantie) || 0,
        statut: form.statut,
        notes: form.notes.trim() || null,
        commission_rate: parseFloat(form.commission_rate) || 12,
        jour_echeance: parseInt(form.jour_echeance) || 10,
        created_at: existingLocalContract?.created_at || now,
        updated_at: now,
        sync_status: "pending",
        sync_error: null,
        deleted_at: null,
      };

      const nextContracts = sortContracts(
        cachedContracts
          .filter((contract) => contract.id !== localContract.id)
          .concat(localContract),
      );
      writeManualCache(CONTRACTS_CACHE_KEY, nextContracts);

      const targetPropertyId = form.property_id;
      if (form.statut === "actif") {
        await updatePropertyStatus(targetPropertyId, "loue");
      }

      // Check if this is a new active contract (not editing) that should trigger print
      const isNewActiveContract = !editingId && form.statut === "actif";

      if (editingId && existingContract) {
        const oldPropertyId = existingContract.property_id;
        if (oldPropertyId !== targetPropertyId) {
          const hasOtherActive = contracts.some(
            (c) =>
              c.id !== editingId &&
              c.property_id === oldPropertyId &&
              c.statut === "actif",
          );
          if (!hasOtherActive) {
            await updatePropertyStatus(oldPropertyId, "disponible");
          }
        }

        if (
          existingContract.statut === "actif" &&
          form.statut !== "actif"
        ) {
          const stillActive = contracts.some(
            (c) =>
              c.id !== editingId &&
              c.property_id === oldPropertyId &&
              c.statut === "actif",
          );
          if (!stillActive) {
            await updatePropertyStatus(oldPropertyId, "disponible");
          }
        }
      }

      setModalOpen(false);
      onRefresh();

      // If this was a new active contract, generate the lease contract for printing
      if (isNewActiveContract) {
        const property = properties.find((p) => p.id === form.property_id);
        const tenant = tenants.find((t) => t.id === form.locataire_id);
        
        if (property && tenant) {
          setTimeout(() => {
            const today = new Date().toLocaleDateString("fr-FR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            });
            
            const appName = settings.app_title || "EGS";
            const appCompany = settings.app_company || "Gnamba Services";
            const logoUrl = settings.logo_url ?? "";

            printContratBail({
              reference: localContract.reference || "",
              bailleur_nom: (property.proprietaire_client?.nom ?? "Propriétaire") as string,
              bailleur_prenom: (property.proprietaire_client?.prenom ?? "") as string,
              bailleur_adresse: "",
              bailleur_telephone: (property.proprietaire_client?.telephone ?? "") as string,
              bailleur_email: (property.proprietaire_client?.email ?? "") as string,
              bailleur_cni: "",
              locataire_nom: tenant.nom,
              locataire_prenom: tenant.prenom,
              locataire_adresse: tenant.client?.adresse || "",
              locataire_telephone: tenant.telephone || "",
              locataire_email: tenant.email || "",
              locataire_cni: "",
              locataire_profession: "",
              locataire_employeur: "",
              bien_adresse: property.adresse,
              bien_type: property.type_bien,
              bien_superficie: "",
              date_debut: form.date_debut,
              date_fin: form.date_fin || "",
              loyer_mensuel: parseFloat(form.loyer_mensuel) || 0,
              charges: parseFloat(form.charges) || 0,
              depot_garantie: parseFloat(form.depot_garantie) || 0,
              jour_paiement: parseInt(form.jour_echeance) || 10,
              date_etablissement: today,
              lieu_etablissement: property.adresse.split(",")[0] || "Abidjan",
              appName,
              appCompany,
              logoUrl,
            });
          }, 100);
        }
      }
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
      showToast("error","Mode d\u00e9mo",getDemoBlockMessage());
      return;
    }
    const contractToDelete = contracts.find((c) => c.id === id);
    if (
      !confirm(
        "Supprimer ce contrat de location ?\n\nLes paiements associés ne seront pas supprimés mais ne seront plus liés à ce contrat.",
      )
    )
      return;
    try {
      const now = new Date().toISOString();
      const cached = readManualCache<LocalLeaseContract>(CONTRACTS_CACHE_KEY);
      const next = cached
        .map((contract) => {
          if (contract.id !== id) return contract;
          if (normalizeManualStatus(contract.sync_status) === "pending") {
            return null;
          }
          return {
            ...contract,
            sync_status: "deleted" as const,
            deleted_at: now,
            updated_at: now,
            sync_error: null,
          };
        })
        .filter(Boolean) as LocalLeaseContract[];
      writeManualCache(CONTRACTS_CACHE_KEY, sortContracts(next));

      if (contractToDelete) {
        const stillActive = contracts.some(
          (c) =>
            c.id !== id &&
            c.property_id === contractToDelete.property_id &&
            c.statut === "actif",
        );
        if (!stillActive) {
          await updatePropertyStatus(contractToDelete.property_id, "disponible");
        }
      }

      onRefresh();
    } catch (err: any) {
      showToast("error","Erreur suppression",`Erreur lors de la suppression locale: ${err.message}`);
    }
  };

  const handleChangeStatus = async (
    c: LeaseContract,
    newStatus: LeaseContract["statut"],
  ) => {
    try {
      const cached = readManualCache<LocalLeaseContract>(CONTRACTS_CACHE_KEY);
      const next = cached.map((contract) =>
        contract.id === c.id
          ? {
              ...contract,
              statut: newStatus,
              updated_at: new Date().toISOString(),
              sync_status:
                normalizeManualStatus(contract.sync_status) === "synced"
                  ? "pending"
                  : normalizeManualStatus(contract.sync_status),
            }
          : contract,
      );
      writeManualCache(CONTRACTS_CACHE_KEY, sortContracts(next));

      if (newStatus === "actif") {
        await updatePropertyStatus(c.property_id, "loue");
      } else {
        const stillActive = contracts.some(
          (other) =>
            other.id !== c.id &&
            other.property_id === c.property_id &&
            other.statut === "actif",
        );
        if (!stillActive) {
          await updatePropertyStatus(c.property_id, "disponible");
        }
      }

      onRefresh();
    } catch (err: any) {
      showToast("error","Erreur statut",`Erreur lors du changement de statut: ${err.message}`);
    }
  };

  const handleGenerate = async (c: LeaseContract) => {
    setGenerating(c.id);
    const result = await generateMonthlyPayments(c, tenantIdColumn);
    setGenerating(null);
    setGenResult(result);
    onRefresh();
  };

  const filtered = contracts.filter((c) => {
    const tenantName = getTenantName(c.locataires as any);
    const address = getPropertyAddress(c.properties);
    return `${tenantName} ${address} ${c.reference}`
      .toLowerCase()
      .includes(search.toLowerCase());
  });

  const availableProperties = properties.filter(
    (p) =>
      p.statut === "disponible" ||
      (editingId &&
        contracts.find((c) => c.id === editingId)?.property_id === p.id),
  );

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
          <Plus size={16} /> Nouveau Contrat
        </button>
        <button
          onClick={async () => {
            try {
              showToast('info', 'Synchronisation', 'Synchronisation en cours...');
              const res = await syncPendingImmobilier();
              if (res.errors.length === 0) {
                showToast('success', 'Synchronisation', `Sync OK — ${res.tenantsSynced} locataire(s), ${res.contractsSynced} contrat(s)`);
              } else {
                showToast('info', 'Synchronisation partielle', `Sync partiel — ${res.errors.length} erreur(s)`);
                console.warn('Sync errors', res.errors);
              }
              onRefresh();
            } catch (err: any) {
              showToast('error', 'Synchronisation', err?.message || String(err));
            }
          }}
          className="ml-3 flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border"
        >
          <RefreshCw size={14} /> Synchroniser maintenant
        </button>
      </div>

      {genResult && (
        <div
          className={`mb-4 p-4 rounded-xl border flex items-center justify-between ${
            genResult.error
              ? "bg-red-50 border-red-200"
              : genResult.created > 0
                ? "bg-green-50 border-green-200"
                : "bg-gray-50 border-gray-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {genResult.error ? (
              <AlertCircle size={16} className="text-red-600" />
            ) : genResult.created > 0 ? (
              <CheckCircle size={16} className="text-green-600" />
            ) : null}
            <span className="text-sm text-gray-700">
              {genResult.error
                ? `Erreur: ${genResult.error}`
                : genResult.created > 0
                  ? `${genResult.created} loyer(s) généré(s) avec succès.`
                  : "Tous les loyers sont déjà générés pour cette période."}
          </span>
          </div>
          <button
            onClick={() => setGenResult(null)}
            className="text-gray-400 hover:text-gray-600"
          >
            <XCircle size={16} />
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <FileText size={40} className="mb-2 opacity-30" />
            <p className="text-sm">Aucun contrat de location</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full egs-table">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Référence
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Locataire
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">
                    Bien
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">
                    Période
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Loyer + Charges
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">
                    Commission
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">
                    Échéance
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Statut
                  </th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((c) => {
                  const tenantName = getTenantName(c.locataires as any);
                  const address = getPropertyAddress(c.properties);
                  const statusCfg = getContractStatusConfig(c.statut);
                  const totalRent = c.loyer_mensuel + (c.charges || 0);
                  const localContracts = readManualCache<LocalLeaseContract>(CONTRACTS_CACHE_KEY) || [];
                  const local = localContracts.find((lc) => lc.id === c.id) || null;
                  const localStatus = local ? normalizeManualStatus(local.sync_status) : null;
                  const renderSyncBadge = (status: string | null, error: string | null) => {
                    if (!status) return null;
                    if (status === "pending") return <Badge label={"En attente"} color="orange" />;
                    if (status === "synced") return <Badge label={"Synced"} color="green" />;
                    if (status === "deleted") return <Badge label={"Supprimé"} color="red" />;
                    return error ? <Badge label={"Erreur"} color="red" /> : <Badge label={String(status)} color="gray" />;
                  };

                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="table-key">{c.reference}</span>
                          {(() => {
                            const badgeNode = renderSyncBadge(localStatus, local?.sync_error ?? null);
                            if (!badgeNode) return null;
                            const onClick = () => {
                              if (local?.sync_error) {
                                setSyncErrorContent(local.sync_error);
                                setSyncErrorModalOpen(true);
                              }
                            };
                            return (
                              <span className="ml-2">
                                <button onClick={onClick} className="focus:outline-none" title={local?.sync_error ?? ''}>
                                  {badgeNode}
                                </button>
                              </span>
                            );
                          })()}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-700 font-medium">
                          {tenantName || "Locataire inconnu"}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs text-gray-500 truncate max-w-[180px] block">
                          {address || "Bien inconnu"}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-xs text-gray-500">
                          {c.date_debut} → {c.date_fin || "En cours"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-semibold text-green-600">
                          {formatMontantImmo(totalRent)} FCFA
                        </span>
                        {c.charges > 0 && (
                          <span className="text-xs text-gray-400 block">
                            +{formatMontantImmo(c.charges)} FCFA charges
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center hidden md:table-cell">
                        <span className="inline-flex items-center gap-1 text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                          <Percent size={10} /> {c.commission_rate || 12}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center hidden lg:table-cell">
                        <span className="inline-flex items-center gap-1 text-xs text-gray-600 bg-gray-50 px-2 py-0.5 rounded-full">
                          <Calendar size={10} /> {c.jour_echeance || 10}e
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${statusCfg.classes}`}
                        >
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          {c.statut === "actif" && (
                            <>
                              <button
                                onClick={() => handleGenerate(c)}
                                disabled={generating === c.id}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                                title="Générer les loyers mensuels"
                              >
                                {generating === c.id ? (
                                  <RefreshCw
                                    size={15}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <Zap size={15} />
                                )}
                              </button>
                              <button
                                onClick={() => handleChangeStatus(c, "termine")}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                                title="Terminer le contrat"
                              >
                                <CheckCircle size={15} />
                              </button>
                              <button
                                onClick={() => handleChangeStatus(c, "resilie")}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                title="Résilier le contrat"
                              >
                                <XCircle size={15} />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => openEdit(c)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Modifier"
                          >
                            <Edit size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(c.id)}
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
        title={
          editingId ? "Modifier le Contrat" : "Nouveau Contrat de Location"
        }
      >
        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <SelectWithCreate
                value={form.property_id}
                onChange={(val) => setForm({ ...form, property_id: val })}
                options={(editingId ? properties : availableProperties).map((p) => ({
                  value: p.id,
                  label: `${p.adresse} (${getPropertyAddress({ type_bien: p.type_bien } as Property)})`
                }))}
                placeholder="Sélectionner un bien..."
                label="Bien Immobilier *"
                required
                createModalTitle="Nouveau Bien Immobilier"
                createFields={[
                  { key: "adresse", label: "Adresse", type: "text", placeholder: "Ex: Cocody, Rue des Jardins...", required: true },
                  { key: "type_bien", label: "Type de Bien", type: "select", required: true, options: [
                    { value: "studio", label: "Studio" },
                    { value: "chambre", label: "Chambre" },
                    { value: "chambre-salon", label: "Chambre-Salon" },
                    { value: "appartement", label: "Appartement" },
                    { value: "terrain", label: "Terrain" },
                    { value: "magasin", label: "Magasin" },
                    { value: "bureau", label: "Bureau" },
                    { value: "villa", label: "Villa" },
                  ]},
                  { key: "loyer_mensuel", label: "Loyer/mois (FCFA)", type: "number", placeholder: "0", required: false },
                  { key: "charges", label: "Charges/mois (FCFA)", type: "number", placeholder: "0", required: false },
                  { key: "statut", label: "Statut", type: "select", required: true, options: [
                    { value: "disponible", label: "Disponible" },
                    { value: "loue", label: "Loué" },
                    { value: "en_vente", label: "En Vente" },
                    { value: "vendu", label: "Vendu" },
                  ]},
                  { key: "proprietaire_id", label: "Propriétaire", type: "select", required: false },
                  { key: "description", label: "Description", type: "textarea", placeholder: "Caractéristiques, équipements...", required: false },
                ]}
                validateCreateForm={(data) => {
                  const errors: Record<string, string> = {};
                  if (!data.adresse?.trim()) errors.adresse = "L'adresse est obligatoire";
                  return Object.keys(errors).length > 0 ? errors : null;
                }}
                onCreate={async (data) => {
                  const now = new Date().toISOString();
                  const payload = {
                    type_bien: data.type_bien || "studio",
                    adresse: data.adresse.trim(),
                    proprietaire_id: data.proprietaire_id || null,
                    loyer_mensuel: parseFloat(data.loyer_mensuel) || 0,
                    charges: parseFloat(data.charges) || 0,
                    statut: data.statut || "disponible",
                    description: data.description || null,
                    updated_at: now,
                  };
                  const { data: newProp, error } = await dbClient.from("properties").insert(payload).select("id").single();
                  if (error) throw error;
                  // Update local cache
                  const cached = readManualCache<any>(PROPERTIES_CACHE_KEY);
                  const updated = { ...newProp, sync_status: "pending", sync_error: null, deleted_at: null };
                  writeManualCache(PROPERTIES_CACHE_KEY, [...cached, updated]);
                  return { value: newProp.id, label: `${data.adresse} (${data.type_bien})` };
                }}
                // fetchCreateData to load proprietaires for the select
                fetchCreateData={async () => {
                  const cached = readManualCache<Client>(CLIENTS_CACHE_KEY);
                  return {
                    proprietaire_id: cached
                      .map(c => ({ value: c.id, label: `${c.prenom} ${c.nom}` }))
                  };
                }}
              />
            </div>
            <div>
              <SelectWithCreate
                value={form.locataire_id}
                onChange={(val) => setForm({ ...form, locataire_id: val })}
                options={tenants
                  .filter((t) => t.statut === "actif")
                  .map((t) => ({ value: t.id, label: `${t.prenom} ${t.nom}` }))}
                placeholder="Sélectionner..."
                label="Locataire *"
                required
                createModalTitle="Nouveau Locataire"
                createFields={[
                  { key: "client_id", label: "Client (obligatoire)", type: "select", required: true },
                  { key: "prenom", label: "Prénom", type: "text", placeholder: "Prénom", required: false },
                  { key: "nom", label: "Nom", type: "text", placeholder: "Nom", required: false },
                  { key: "telephone", label: "Téléphone", type: "tel", placeholder: "+225 07 00 00 00", required: false },
                  { key: "email", label: "Email", type: "email", placeholder: "email@exemple.com", required: false },
                  { key: "loyer", label: "Loyer (FCFA)", type: "number", placeholder: "0", required: false },
                  { key: "depot_garantie", label: "Dépôt de garantie", type: "number", placeholder: "0", required: false },
                  { key: "statut", label: "Statut", type: "select", required: true, options: [
                    { value: "actif", label: "Actif" },
                    { value: "inactif", label: "Inactif" },
                  ]},
                ]}
                validateCreateForm={(data) => {
                  const errors: Record<string, string> = {};
                  // If no client_id, require nom/prenom/telephone directly
                  if (!data.client_id && (!data.nom?.trim() || !data.prenom?.trim())) {
                    errors.nom = "Le nom est requis si aucun client n'est sélectionné";
                  }
                  return Object.keys(errors).length > 0 ? errors : null;
                }}
                onCreate={async (data) => {
                  const now = new Date().toISOString();
                  const nom = data.nom;
                  const prenom = data.prenom;
                  const telephone = data.telephone;
                  const email = data.email;

                  const tenantPayload = {
                    client_id: data.client_id || null,
                    nom: nom || "Locataire",
                    prenom: prenom || "",
                    telephone: telephone || null,
                    email: email || null,
                    property_id: null,
                    date_debut_contrat: null,
                    date_fin_contrat: null,
                    loyer: parseFloat(data.loyer) || 0,
                    depot_garantie: parseFloat(data.depot_garantie) || 0,
                    statut: data.statut || "actif",
                    updated_at: now,
                  };

                  // Create tenant in local cache
                  const cachedTenants = readManualCache<any>(TENANTS_CACHE_KEY);
                  const newTenant = {
                    ...tenantPayload,
                    id: generateUUID(),
                    created_at: now,
                    sync_status: "pending",
                    sync_error: null,
                    deleted_at: null,
                  };
                  writeManualCache(TENANTS_CACHE_KEY, [...cachedTenants, newTenant]);
                  // Confirmation toast
                  try {
                    showToast("success", "Locataire créé", `${prenom} ${nom} créé(e)`);
                  } catch (e) {
                    // ignore if notifications unavailable
                  }

                  // If online, try to persist to backend immediately: create client -> contract -> tenant linkage
                  if (typeof navigator !== "undefined" && navigator.onLine) {
                    try {
                      // Create client (entity) on backend
                      const clientPayload = {
                        type_client: "particulier",
                        nom: nom || undefined,
                        prenom: prenom || undefined,
                        telephone: telephone || undefined,
                        email: email || undefined,
                      };

                      const clientRes = await apiClient.clients.create(clientPayload);
                      if (clientRes.error || !clientRes.data) {
                        throw new Error(clientRes.error || "Erreur création client");
                      }
                      const createdClient = clientRes.data as any;

                      // If contract data present, create contract on backend
                      let createdContract: any = null;
                      if (form.property_id && form.date_debut) {
                        const contractPayload = {
                          property_id: form.property_id,
                          locataire_entity_id: createdClient.id,
                          date_debut: form.date_debut,
                          date_fin: form.date_fin || null,
                          loyer_mensuel: parseFloat(form.loyer_mensuel) || parseFloat(data.loyer) || 0,
                          charges_mensuelles: parseFloat(form.charges) || 0,
                          depot_garantie: parseFloat(form.depot_garantie) || 0,
                          statut: form.statut || "actif",
                          notes: form.notes?.trim() || null,
                          commission_rate: parseFloat(form.commission_rate) || 12,
                          jour_echeance: parseInt(form.jour_echeance) || 10,
                        };

                        const contractRes = await apiClient.request('/immobilier/contracts', {
                          method: 'POST',
                          body: JSON.stringify(contractPayload),
                        });
                        if (contractRes.error || !contractRes.data) {
                          throw new Error(contractRes.error || 'Erreur création contrat');
                        }
                        createdContract = contractRes.data as any;
                      }

                      // Create tenant linkage on backend (optional, but keep server-side mapping)
                      const tenantCreatePayload: any = { entity_id: createdClient.id };
                      if (createdContract) {
                        tenantCreatePayload.property_id = createdContract.property_id;
                        tenantCreatePayload.contract_id = createdContract.id;
                      } else if (form.property_id) {
                        tenantCreatePayload.property_id = form.property_id;
                      }

                      const tenantRes = await apiClient.request('/tenants', {
                        method: 'POST',
                        body: JSON.stringify(tenantCreatePayload),
                      });
                      if (tenantRes.error || !tenantRes.data) {
                        // Non-fatal: server may accept contract without tenant linkage
                        console.warn('Tenant linkage creation failed on server:', tenantRes.error);
                      }

                      // Mark local entries as synced
                      const updatedTenants = readManualCache<any>(TENANTS_CACHE_KEY).map((t: any) =>
                        t.id === newTenant.id ? { ...t, sync_status: 'synced' } : t,
                      );
                      writeManualCache(TENANTS_CACHE_KEY, updatedTenants);

                      if (createdContract) {
                        const cachedContracts = readManualCache<any>(CONTRACTS_CACHE_KEY);
                        const updatedContracts = cachedContracts.map((c: any) =>
                          c.locataire_id === newTenant.id || c.id === createdContract.id
                            ? { ...c, sync_status: 'synced' }
                            : c,
                        );
                        writeManualCache(CONTRACTS_CACHE_KEY, sortContracts(updatedContracts));
                      }

                      showToast('success', 'Synchronisation', 'Les données ont été enregistrées sur le serveur');
                    } catch (err: any) {
                      console.error('Persist backend failed:', err);
                      showToast('error', 'Synchronisation', `Échec synchronisation: ${err.message || err}`);
                      // keep local pending entries for later sync
                    }
                  }

                  // If the contract modal already has enough data, create the contract in the local cache too
                  try {
                    // `form` is in scope from the ContractsTab component and contains current contract inputs
                    if (form.property_id && form.date_debut) {
                      const cachedContracts = readManualCache<any>(CONTRACTS_CACHE_KEY);
                      const newContract = {
                        id: generateUUID(),
                        reference: generateReference("CTR"),
                        property_id: form.property_id,
                        locataire_id: newTenant.id,
                        date_debut: form.date_debut,
                        date_fin: form.date_fin || null,
                        loyer_mensuel: parseFloat(form.loyer_mensuel) || parseFloat(data.loyer) || 0,
                        charges: parseFloat(form.charges) || 0,
                        depot_garantie: parseFloat(form.depot_garantie) || 0,
                        statut: form.statut || "actif",
                        notes: form.notes?.trim() || null,
                        commission_rate: parseFloat(form.commission_rate) || 12,
                        jour_echeance: parseInt(form.jour_echeance) || 10,
                        created_at: now,
                        updated_at: now,
                        sync_status: "pending",
                        sync_error: null,
                        deleted_at: null,
                      };
                      writeManualCache(CONTRACTS_CACHE_KEY, sortContracts(cachedContracts.concat(newContract)));

                      // Update property status to 'loue' when creating an active contract
                      if (newContract.statut === "actif") {
                        await updatePropertyStatus(newContract.property_id, "loue");
                      }
                      try {
                        showToast("success", "Contrat créé", `Contrat ${newContract.reference} créé pour ${prenom} ${nom}`);
                      } catch (e) {
                        // ignore toast errors
                      }
                    }
                  } catch (err) {
                    // don't block tenant creation on contract failures
                    console.error("Failed to create linked contract:", err);
                  }

                  return { value: newTenant.id, label: `${prenom} ${nom}` };
                }}
                fetchCreateData={async () => {
                  const cached = readManualCache<Client>(CLIENTS_CACHE_KEY);
                  return {
                    client_id: cached
                      .map(c => ({ value: c.id, label: `${c.prenom} ${c.nom} (${c.telephone})` }))
                  };
                }}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Date début *
              </label>
              <input
                type="date"
                value={form.date_debut}
                onChange={(e) =>
                  setForm({ ...form, date_debut: e.target.value })
                }
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Date fin{" "}
                <span className="text-gray-400 font-normal">(optionnel)</span>
              </label>
              <input
                type="date"
                value={form.date_fin}
                onChange={(e) => setForm({ ...form, date_fin: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Loyer mensuel (FCFA)
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
                Charges (FCFA)
              </label>
              <input
                type="number"
                value={form.charges}
                onChange={(e) => setForm({ ...form, charges: e.target.value })}
                className={inputClass}
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Dépôt garantie
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
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Commission (%)*
                <span className="text-gray-400 font-normal"> (Part entreprise)</span>
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={form.commission_rate}
                onChange={(e) =>
                  setForm({ ...form, commission_rate: e.target.value })
                }
                className={inputClass}
                placeholder="12"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Jour d'échéance *
              </label>
              <input
                type="number"
                min="1"
                max="28"
                value={form.jour_echeance}
                onChange={(e) =>
                  setForm({ ...form, jour_echeance: e.target.value })
                }
                className={inputClass}
                placeholder="10"
              />
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
                    statut: e.target.value as LeaseContract["statut"],
                  })
                }
                className={inputClass}
              >
                <option value="actif">Actif</option>
                <option value="termine">Terminé</option>
                <option value="resilie">Résilié</option>
                <option value="renouvele">Renouvelé</option>
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
              placeholder="Conditions particulières, remarques..."
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
                saving ||
                !form.property_id ||
                !form.locataire_id ||
                !form.date_debut
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