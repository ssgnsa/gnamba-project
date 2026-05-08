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
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import type { LeaseContract, Property, Tenant, RentPayment } from "../../types";
import Modal from "../../components/ui/Modal";
import { useSettings } from "../../context/SettingsContext";
import { useAuth } from "../../context/AuthContext";
import {
  getDemoBlockMessage,
  shouldBlockDestructiveAction,
} from "../../lib/demoMode";
import { generateReference } from "../../utils/reference";
import {
  getTenantName,
  getPropertyAddress,
  getContractStatusConfig,
  formatMontantImmo,
  generateMonthRange,
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
};

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
  tenantIdColumn: "locataire_id" | "tenant_id",
): Promise<{ created: number; skipped: number; error?: string }> {
  try {
    const end = contract.date_fin ? new Date(contract.date_fin) : new Date();
    end.setDate(1);

    const { data: existing, error: fetchError } = await supabase
      .from("rent_payments")
      .select("mois_concerne, mois_concerne_date")
      .eq("contract_id", contract.id);

    if (fetchError) throw fetchError;

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
    const paymentsToCreate: Partial<RentPayment>[] = [];

    for (const { mois, moisLabel, lastDay } of monthRange) {
      if (!existingMonths.has(moisLabel) && !existingMonths.has(mois)) {
        const payload: Partial<RentPayment> = {
          contract_id: contract.id,
          property_id: contract.property_id,
          montant: contract.loyer_mensuel + (contract.charges || 0),
          date_paiement: lastDay,
          date_echeance: lastDay,
          date_paiement_effectif: null,
          mois_concerne: moisLabel,
          mois_concerne_date: `${mois}-01`,
          mode_paiement: "especes",
          statut: "en_attente",
          notes: "",
          reference: generateReference("QTT"),
        };

        // Support both legacy and current tenant column names.
        (payload as Record<"locataire_id" | "tenant_id", string | null>)[
          tenantIdColumn
        ] = contract.locataire_id;
        paymentsToCreate.push(payload);
      }
    }

    if (paymentsToCreate.length > 0) {
      const { error: insertError } = await supabase
        .from("rent_payments")
        .insert(paymentsToCreate);
      if (insertError) throw insertError;
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

export default function ContractsTab({
  contracts,
  properties,
  tenants,
  search,
  tenantIdColumn,
  onRefresh,
}: Props) {
  const { settings } = useSettings();
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

    setSaving(true);
    setError(null);

    const payload: Record<string, unknown> = {
      property_id: form.property_id,
      date_debut: form.date_debut,
      date_fin: form.date_fin || null,
      loyer_mensuel: parseFloat(form.loyer_mensuel) || 0,
      charges: parseFloat(form.charges) || 0,
      depot_garantie: parseFloat(form.depot_garantie) || 0,
      statut: form.statut,
      notes: form.notes.trim() || null,
      updated_at: new Date().toISOString(),
    };
    payload[tenantIdColumn] = form.locataire_id;

    try {
      if (editingId) {
        const { error } = await supabase
          .from("lease_contracts")
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("lease_contracts").insert({
          ...payload,
          reference: generateReference("CTR"),
        });
        if (error) throw error;
      }
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
      window.alert(getDemoBlockMessage());
      return;
    }
    if (
      !confirm(
        "Supprimer ce contrat de location ?\n\nLes paiements associés ne seront pas supprimés mais ne seront plus liés à ce contrat.",
      )
    )
      return;
    try {
      const { error } = await supabase
        .from("lease_contracts")
        .delete()
        .eq("id", id);
      if (error) throw error;
      onRefresh();
    } catch (err: any) {
      alert(`Erreur lors de la suppression: ${err.message}`);
    }
  };

  const handleChangeStatus = async (
    c: LeaseContract,
    newStatus: LeaseContract["statut"],
  ) => {
    try {
      const { error } = await supabase
        .from("lease_contracts")
        .update({ statut: newStatus, updated_at: new Date().toISOString() })
        .eq("id", c.id);
      if (error) throw error;
      onRefresh();
    } catch (err: any) {
      alert(`Erreur lors du changement de statut: ${err.message}`);
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
                    Loyer
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

                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="table-key">{c.reference}</span>
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
                          {formatMontantImmo(c.loyer_mensuel)} FCFA
                        </span>
                        {c.charges > 0 && (
                          <span className="text-xs text-gray-400 block">
                            +{formatMontantImmo(c.charges)} FCFA charges
                          </span>
                        )}
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
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Bien Immobilier *
              </label>
              <select
                value={form.property_id}
                onChange={(e) =>
                  setForm({ ...form, property_id: e.target.value })
                }
                className={inputClass}
              >
                <option value="">Sélectionner un bien...</option>
                {(editingId ? properties : availableProperties).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.adresse}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Locataire *
              </label>
              <select
                value={form.locataire_id}
                onChange={(e) =>
                  setForm({ ...form, locataire_id: e.target.value })
                }
                className={inputClass}
              >
                <option value="">Sélectionner...</option>
                {tenants
                  .filter((t) => t.statut === "actif")
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.prenom} {t.nom}
                    </option>
                  ))}
              </select>
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
    </>
  );
}
