import { useState } from "react";
import {
  Plus,
  Building2,
  CreditCard as Edit,
  Trash2,
  User,
  History,
  X,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import type { Property, LeaseContract } from "../../types";
import Modal from "../../components/ui/Modal";
import Badge from "../../components/ui/Badge";
import { useSettings } from "../../context/SettingsContext";
import { useAuth } from "../../context/AuthContext";
import {
  getDemoBlockMessage,
  shouldBlockDestructiveAction,
} from "../../lib/demoMode";
import {
  getTenantName,
  getPropertyStatusConfig,
  getPropertyTypeLabel,
  formatMontantImmo,
  getContractStatusConfig,
} from "../../lib/immobilier";

const emptyForm = {
  type_bien: "appartement" as Property["type_bien"],
  adresse: "",
  proprietaire: "",
  valeur: "",
  loyer_mensuel: "",
  statut: "disponible" as Property["statut"],
  description: "",
};

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
      proprietaire: p.proprietaire || "",
      valeur: String(p.valeur),
      loyer_mensuel: String(p.loyer_mensuel),
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

    const payload = {
      type_bien: form.type_bien,
      adresse: form.adresse,
      proprietaire: form.proprietaire.trim() || null,
      valeur: parseFloat(form.valeur) || 0,
      loyer_mensuel: parseFloat(form.loyer_mensuel) || 0,
      statut: form.statut,
      description: form.description.trim() || null,
      updated_at: new Date().toISOString(),
    };

    try {
      if (editingId) {
        const { error } = await supabase
          .from("properties")
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("properties").insert(payload);
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
      !confirm("Supprimer ce bien immobilier ? Cette action est irréversible.")
    )
      return;
    try {
      const { error } = await supabase.from("properties").delete().eq("id", id);
      if (error) throw error;
      onRefresh();
    } catch (err: any) {
      alert(`Erreur lors de la suppression: ${err.message}`);
    }
  };

  const getActiveContract = (propertyId: string) =>
    activeContracts.find(
      (c) => c.property_id === propertyId && c.statut === "actif",
    );

  const getPropertyHistory = (propertyId: string) =>
    contractHistory.filter((c) => c.property_id === propertyId);

  const filtered = properties.filter((p) =>
    `${p.adresse} ${p.proprietaire} ${p.type_bien}`
      .toLowerCase()
      .includes(search.toLowerCase()),
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
              ? getTenantName(contract.locataires as any)
              : "";
            const historyCount = getPropertyHistory(p.id).length;

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
                {p.proprietaire && (
                  <div className="text-xs text-gray-400 mb-2">
                    Propriétaire: {p.proprietaire}
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
                        {formatMontantImmo(contract.loyer_mensuel)} FCFA/mois
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
                      </div>
                    )}
                    {p.valeur > 0 && (
                      <div className="text-xs text-gray-400">
                        {formatMontantImmo(p.valeur)} FCFA
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
                const tenantName = getTenantName(c.locataires as any);
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
                        {formatMontantImmo(c.loyer_mensuel)} FCFA/mois
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
                <option value="appartement">Appartement</option>
                <option value="villa">Villa</option>
                <option value="bureau">Bureau</option>
                <option value="commerce">Commerce</option>
                <option value="terrain">Terrain</option>
                <option value="autre">Autre</option>
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
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Propriétaire
            </label>
            <input
              type="text"
              value={form.proprietaire}
              onChange={(e) =>
                setForm({ ...form, proprietaire: e.target.value })
              }
              className={inputClass}
              placeholder="Nom du propriétaire"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Valeur (FCFA)
              </label>
              <input
                type="number"
                value={form.valeur}
                onChange={(e) => setForm({ ...form, valeur: e.target.value })}
                className={inputClass}
                placeholder="0"
              />
            </div>
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
              disabled={saving || !form.adresse.trim()}
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
