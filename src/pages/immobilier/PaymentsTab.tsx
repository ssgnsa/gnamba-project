import { useState, useMemo } from "react";
import {
  Plus,
  DollarSign,
  CreditCard as Edit,
  Trash2,
  Printer,
  FileText,
  Download,
  Eye,
  Filter,
  CheckCircle,
  AlertCircle,
  Clock,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import type { RentPayment, Tenant, Property, LeaseContract } from "../../types";
import Modal from "../../components/ui/Modal";
import Badge from "../../components/ui/Badge";
import { useSettings } from "../../context/SettingsContext";
import { useAuth } from "../../context/AuthContext";
import {
  getDemoBlockMessage,
  shouldBlockDestructiveAction,
} from "../../lib/demoMode";
import { generateReference } from "../../utils/reference";
import { printQuittance, printRecuLoyer } from "../../utils/print";
import {
  getTenantName,
  getPropertyAddress,
  getPaymentStatusConfig,
  getPaymentModeLabel,
  formatMontantImmo,
} from "../../lib/immobilier";
import { formatMontant, formatDate } from "../../utils/reference";

const emptyForm = {
  contract_id: "",
  locataire_id: "",
  property_id: "",
  montant: "",
  date_paiement: new Date().toISOString().split("T")[0],
  date_echeance: "",
  date_paiement_effectif: "",
  mois_concerne: "",
  mois_concerne_date: "",
  mode_paiement: "especes" as RentPayment["mode_paiement"],
  statut: "paye" as RentPayment["statut"],
  notes: "",
  reference: "",
};

interface Props {
  payments: RentPayment[];
  contracts: LeaseContract[];
  tenants: Tenant[];
  properties: Property[];
  search: string;
  tenantIdColumn: "locataire_id" | "tenant_id";
  onRefresh: () => void;
}

type DateFilter = "all" | "this_month" | "last_month" | "this_year" | "custom";
type StatusFilter = "all" | "paye" | "en_attente" | "retard" | "partiel";
type OwnerFilter = "all" | string;

export default function PaymentsTab({
  payments,
  contracts,
  tenants,
  properties,
  search,
  tenantIdColumn,
  onRefresh,
}: Props) {
  const { settings } = useSettings();
  const { user, profile } = useAuth();

  // Filters
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [ownerFilter, setOwnerFilter] = useState<OwnerFilter>("all");
  const [customDateStart, setCustomDateStart] = useState("");
  const [customDateEnd, setCustomDateEnd] = useState("");

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Preview modal for remote verification
  const [previewOpen, setPreviewOpen] = useState(false);
  const destructiveActionsDisabled = shouldBlockDestructiveAction(
    user,
    profile,
  );

  const inputClass =
    "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400";
  const today = new Date().toISOString().split("T")[0];
  const currentMonth = today.slice(0, 7);

  // Get unique owners from properties
  const uniqueOwners = useMemo(() => {
    const owners = properties
      .map((p) => p.proprietaire)
      .filter((v, i, a) => v && v.trim() && a.indexOf(v) === i)
      .sort();
    return owners;
  }, [properties]);

  // Month label helpers
  const monthLabelFromInput = (monthValue: string) => {
    if (!monthValue) return "";
    const [year, month] = monthValue.split("-").map(Number);
    return new Date(year, month - 1, 1).toLocaleDateString("fr-FR", {
      month: "long",
      year: "numeric",
    });
  };

  const monthInputFromDate = (dateStr?: string | null) => {
    if (!dateStr) return "";
    return String(dateStr).slice(0, 7);
  };

  const lastDayFromMonth = (monthValue: string) => {
    if (!monthValue) return "";
    const [year, month] = monthValue.split("-").map(Number);
    return new Date(year, month, 0).toISOString().split("T")[0];
  };

  // Filter payments with advanced filters
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      // Search filter
      const tenantName = getTenantName(p.locataires as any);
      const searchMatch =
        `${tenantName} ${p.mois_concerne} ${p.reference || ""}`
          .toLowerCase()
          .includes(search.toLowerCase());

      if (!searchMatch) return false;

      // Status filter
      if (statusFilter !== "all" && p.statut !== statusFilter) return false;

      // Date filter
      if (dateFilter !== "all") {
        const paymentDate = p.date_paiement || p.date_echeance || "";
        const paymentMonth = paymentDate.slice(0, 7);

        if (dateFilter === "this_month" && paymentMonth !== currentMonth)
          return false;
        if (dateFilter === "last_month") {
          const lastMonth = new Date(
            new Date().getFullYear(),
            new Date().getMonth() - 1,
            1,
          )
            .toISOString()
            .slice(0, 7);
          if (paymentMonth !== lastMonth) return false;
        }
        if (dateFilter === "this_year") {
          const currentYear = new Date().getFullYear().toString();
          if (!paymentDate.startsWith(currentYear)) return false;
        }
        if (dateFilter === "custom" && customDateStart && customDateEnd) {
          if (paymentDate < customDateStart || paymentDate > customDateEnd)
            return false;
        }
      }

      // Owner filter
      if (ownerFilter !== "all") {
        const property = properties.find((prop) => prop.id === p.property_id);
        if (property?.proprietaire !== ownerFilter) return false;
      }

      return true;
    });
  }, [
    payments,
    search,
    statusFilter,
    dateFilter,
    ownerFilter,
    customDateStart,
    customDateEnd,
    properties,
    currentMonth,
  ]);

  // Last month paid payments for remote verification
  const lastMonthPaid = useMemo(() => {
    const lastMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth() - 1,
      1,
    )
      .toISOString()
      .slice(0, 7);

    return payments.filter((p) => {
      const paymentMonth = (p.date_paiement || p.date_echeance || "").slice(
        0,
        7,
      );
      return paymentMonth === lastMonth && p.statut === "paye";
    });
  }, [payments]);

  // Statistics
  const stats = useMemo(() => {
    const total = filteredPayments.length;
    const paid = filteredPayments.filter((p) => p.statut === "paye").length;
    const pending = filteredPayments.filter(
      (p) => p.statut === "en_attente",
    ).length;
    const late = filteredPayments.filter((p) => p.statut === "retard").length;
    const partial = filteredPayments.filter(
      (p) => p.statut === "partiel",
    ).length;

    const totalAmount = filteredPayments
      .filter((p) => p.statut === "paye")
      .reduce((sum, p) => sum + (p.montant || 0), 0);

    const pendingAmount = filteredPayments
      .filter((p) => p.statut === "en_attente" || p.statut === "retard")
      .reduce((sum, p) => sum + (p.montant || 0), 0);

    return { total, paid, pending, late, partial, totalAmount, pendingAmount };
  }, [filteredPayments]);

  // Open modals
  const openAdd = () => {
    const monthValue = today.slice(0, 7);
    setForm({
      ...emptyForm,
      reference: generateReference("QTT"),
      mois_concerne_date: monthValue,
      mois_concerne: monthLabelFromInput(monthValue),
      date_echeance: lastDayFromMonth(monthValue),
      date_paiement: today,
    });
    setEditingId(null);
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (pay: RentPayment) => {
    const monthValue = pay.mois_concerne_date
      ? String(pay.mois_concerne_date).slice(0, 7)
      : monthInputFromDate(pay.date_echeance || pay.date_paiement);
    setForm({
      contract_id: pay.contract_id || "",
      locataire_id: pay.locataire_id || "",
      property_id: pay.property_id || "",
      montant: String(pay.montant),
      date_paiement: pay.date_paiement || today,
      date_echeance: pay.date_echeance || "",
      date_paiement_effectif:
        pay.date_paiement_effectif ||
        (pay.statut === "paye" || pay.statut === "partiel"
          ? pay.date_paiement || today
          : ""),
      mois_concerne: pay.mois_concerne || monthLabelFromInput(monthValue),
      mois_concerne_date: monthValue,
      mode_paiement: pay.mode_paiement,
      statut: pay.statut,
      notes: pay.notes || "",
      reference: pay.reference || generateReference("QTT"),
    });
    setEditingId(pay.id);
    setError(null);
    setModalOpen(true);
  };

  const openPreview = () => setPreviewOpen(true);

  // Handle form changes
  const handleContractChange = (contractId: string) => {
    const contract = contracts.find((c) => c.id === contractId);
    if (contract) {
      setForm((f) => ({
        ...f,
        contract_id: contractId,
        locataire_id: contract.locataire_id,
        property_id: contract.property_id,
        montant: String(contract.loyer_mensuel + (contract.charges || 0)),
      }));
    } else {
      setForm((f) => ({ ...f, contract_id: "" }));
    }
  };

  // Save payment
  const handleSave = async () => {
    if (!form.montant || (!form.mois_concerne_date && !form.mois_concerne)) {
      setError("Le montant et le mois concerné sont obligatoires");
      return;
    }

    setSaving(true);
    setError(null);

    const monthValue = form.mois_concerne_date;
    const moisLabel = monthValue
      ? monthLabelFromInput(monthValue)
      : form.mois_concerne;
    const dateEcheance =
      form.date_echeance ||
      (monthValue ? lastDayFromMonth(monthValue) : form.date_paiement);
    const datePaiementEffectif =
      form.statut === "paye" || form.statut === "partiel"
        ? form.date_paiement_effectif || form.date_paiement || today
        : null;
    const datePaiement =
      datePaiementEffectif || dateEcheance || form.date_paiement || today;

    const payload: Record<string, unknown> = {
      contract_id: form.contract_id || null,
      property_id: form.property_id || null,
      montant: parseFloat(form.montant) || 0,
      date_paiement: datePaiement,
      date_echeance: dateEcheance || null,
      date_paiement_effectif: datePaiementEffectif,
      mois_concerne: moisLabel || "",
      mois_concerne_date: monthValue ? `${monthValue}-01` : null,
      mode_paiement: form.mode_paiement,
      statut: form.statut,
      notes: form.notes.trim() || null,
      reference: form.reference || generateReference("QTT"),
    };
    payload[tenantIdColumn] = form.locataire_id || null;

    try {
      if (editingId) {
        const { error } = await supabase
          .from("rent_payments")
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("rent_payments").insert(payload);
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

  // Delete payment
  const handleDelete = async (id: string) => {
    if (destructiveActionsDisabled) {
      window.alert(getDemoBlockMessage());
      return;
    }
    if (!confirm("Supprimer ce paiement ? Cette action est irréversible."))
      return;
    try {
      const { error } = await supabase
        .from("rent_payments")
        .delete()
        .eq("id", id);
      if (error) throw error;
      onRefresh();
    } catch (err: any) {
      alert(`Erreur lors de la suppression: ${err.message}`);
    }
  };

  // Document audit
  const updateDocumentAudit = async (
    id: string,
    type: "quittance" | "recu",
  ) => {
    const { data } = await supabase.auth.getUser();
    const userId = data?.user?.id ?? null;
    await supabase
      .from("rent_payments")
      .update({
        last_document_type: type,
        last_document_at: new Date().toISOString(),
        last_document_by: userId,
      })
      .eq("id", id);
  };

  // Print functions
  const resolvePaymentDate = (pay: RentPayment) =>
    pay.date_paiement_effectif ||
    pay.date_paiement ||
    pay.date_echeance ||
    today;

  const handlePrintQuittance = async (pay: RentPayment) => {
    if (pay.statut !== "paye") return;
    const tenantName = getTenantName(pay.locataires as any);
    const address = getPropertyAddress(pay.properties as any);

    printQuittance({
      reference: pay.reference || generateReference("QTT"),
      locataire_nom: tenantName.split(" ").pop() || tenantName,
      locataire_prenom:
        tenantName.split(" ").slice(0, -1).join(" ") || tenantName,
      bien_adresse: address,
      mois_concerne: pay.mois_concerne,
      montant: pay.montant,
      date_paiement: new Date(resolvePaymentDate(pay)).toLocaleDateString(
        "fr-FR",
      ),
      mode_paiement: pay.mode_paiement,
      appName: settings.app_title,
      appCompany: settings.app_company,
      logoUrl: settings.logo_url,
    });
    await updateDocumentAudit(pay.id, "quittance");
  };

  const handlePrintRecu = async (pay: RentPayment) => {
    if (pay.statut !== "paye" && pay.statut !== "partiel") return;
    const tenantName = getTenantName(pay.locataires as any);
    const address = getPropertyAddress(pay.properties as any);

    printRecuLoyer({
      reference: pay.reference || generateReference("QTT"),
      locataire_nom: tenantName.split(" ").pop() || tenantName,
      locataire_prenom:
        tenantName.split(" ").slice(0, -1).join(" ") || tenantName,
      bien_adresse: address,
      mois_concerne: pay.mois_concerne,
      montant: pay.montant,
      date_paiement: new Date(resolvePaymentDate(pay)).toLocaleDateString(
        "fr-FR",
      ),
      mode_paiement: pay.mode_paiement,
      appName: settings.app_title,
      appCompany: settings.app_company,
      logoUrl: settings.logo_url,
    });
    await updateDocumentAudit(pay.id, "recu");
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      "Référence",
      "Locataire",
      "Montant",
      "Mois",
      "Statut",
      "Mode",
      "Date",
    ];
    const rows = filteredPayments.map((p) => [
      p.reference || "",
      getTenantName(p.locataires as any),
      p.montant,
      p.mois_concerne,
      p.statut,
      p.mode_paiement,
      p.date_paiement,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `paiements_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">Total Paiements</p>
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
              <DollarSign size={24} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">Payés</p>
              <p className="text-2xl font-bold text-green-600">{stats.paid}</p>
              <p className="text-xs text-green-600 mt-1">
                {formatMontant(stats.totalAmount)} FCFA
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
              <CheckCircle size={24} className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">En Attente</p>
              <p className="text-2xl font-bold text-amber-600">
                {stats.pending}
              </p>
              <p className="text-xs text-amber-600 mt-1">
                {formatMontant(stats.pendingAmount)} FCFA
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
              <Clock size={24} className="text-amber-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">Retard</p>
              <p className="text-2xl font-bold text-red-600">{stats.late}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
              <AlertCircle size={24} className="text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={16} className="text-gray-500" />
          <span className="text-sm font-semibold text-gray-700">Filtres</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Date Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Période
            </label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as DateFilter)}
              className={inputClass}
            >
              <option value="all">Toute la période</option>
              <option value="this_month">Ce mois</option>
              <option value="last_month">Mois dernier</option>
              <option value="this_year">Cette année</option>
              <option value="custom">Personnalisé</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Statut
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className={inputClass}
            >
              <option value="all">Tous les statuts</option>
              <option value="paye">Payé</option>
              <option value="en_attente">En attente</option>
              <option value="retard">Retard</option>
              <option value="partiel">Partiel</option>
            </select>
          </div>

          {/* Owner Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Propriétaire
            </label>
            <select
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value as OwnerFilter)}
              className={inputClass}
            >
              <option value="all">Tous les propriétaires</option>
              {uniqueOwners.map((owner) => (
                <option key={owner} value={owner || undefined}>
                  {owner}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Date Range */}
          {dateFilter === "custom" && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Du
                </label>
                <input
                  type="date"
                  value={customDateStart}
                  onChange={(e) => setCustomDateStart(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Au
                </label>
                <input
                  type="date"
                  value={customDateEnd}
                  onChange={(e) => setCustomDateEnd(e.target.value)}
                  className={inputClass}
                />
              </div>
            </>
          )}
        </div>

        {/* Last Month Quick View */}
        {lastMonthPaid.length > 0 && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye size={18} className="text-green-600" />
                <div>
                  <p className="text-sm font-semibold text-green-800">
                    Paiements du mois dernier (vérification à distance)
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    {lastMonthPaid.length} loyer
                    {lastMonthPaid.length > 1 ? "s" : ""} payé
                    {lastMonthPaid.length > 1 ? "s" : ""} -{" "}
                    <span className="font-semibold">
                      {formatMontant(
                        lastMonthPaid.reduce(
                          (sum, p) => sum + (p.montant || 0),
                          0,
                        ),
                      )}{" "}
                      FCFA
                    </span>
                  </p>
                </div>
              </div>
              <button
                onClick={openPreview}
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                Voir détails
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {stats.pending > 0 && (
            <span className="px-3 py-1.5 bg-amber-50 text-amber-700 text-xs font-medium rounded-xl border border-amber-200">
              {stats.pending} loyer{stats.pending > 1 ? "s" : ""} en attente
            </span>
          )}
          {stats.late > 0 && (
            <span className="px-3 py-1.5 bg-red-50 text-red-700 text-xs font-medium rounded-xl border border-red-200">
              {stats.late} en retard
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Download size={16} /> Exporter
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium hover:opacity-90"
            style={{
              backgroundColor: settings.primary_color,
              color: "var(--color-on-primary)",
            }}
          >
            <Plus size={16} /> Nouveau Paiement
          </button>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {filteredPayments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <DollarSign size={40} className="mb-2 opacity-30" />
            <p className="text-sm">Aucun paiement enregistré</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full egs-table">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">
                    Référence
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Locataire
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">
                    Mois
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">
                    Mode
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Statut
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Montant
                  </th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredPayments.map((pay) => {
                  const tenantName = getTenantName(pay.locataires as any);
                  const statusCfg = getPaymentStatusConfig(pay.statut);
                  const modeLabel = getPaymentModeLabel(pay.mode_paiement);

                  return (
                    <tr
                      key={pay.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 table-key hidden md:table-cell">
                        {pay.reference || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {tenantName || "Locataire inconnu"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 hidden sm:table-cell">
                        {pay.mois_concerne}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 hidden lg:table-cell">
                        {modeLabel}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          label={statusCfg.label}
                          color={statusCfg.color as any}
                        />
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-right text-green-600">
                        {formatMontantImmo(pay.montant)} FCFA
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={() => handlePrintQuittance(pay)}
                            disabled={pay.statut !== "paye"}
                            title={
                              pay.statut === "paye"
                                ? "Imprimer Quittance"
                                : "Quittance disponible seulement si payé"
                            }
                            className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Printer size={15} />
                          </button>
                          <button
                            onClick={() => handlePrintRecu(pay)}
                            disabled={
                              pay.statut !== "paye" && pay.statut !== "partiel"
                            }
                            title={
                              pay.statut === "paye" || pay.statut === "partiel"
                                ? "Imprimer Reçu"
                                : "Reçu disponible pour paiement effectué"
                            }
                            className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <FileText size={15} />
                          </button>
                          <button
                            onClick={() => openEdit(pay)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Modifier"
                          >
                            <Edit size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(pay.id)}
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

      {/* Preview Modal for Remote Verification */}
      <Modal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title="Paiements du Mois Dernier - Vérification à Distance"
      >
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-green-800">
                Total Encaissé
              </span>
              <span className="text-lg font-bold text-green-600">
                {formatMontant(
                  lastMonthPaid.reduce((sum, p) => sum + (p.montant || 0), 0),
                )}{" "}
                FCFA
              </span>
            </div>
            <p className="text-xs text-green-600">
              {lastMonthPaid.length} paiements
            </p>
          </div>

          <div className="max-h-96 overflow-y-auto space-y-2">
            {lastMonthPaid.map((pay) => {
              const tenantName = getTenantName(pay.locataires as any);
              const address = getPropertyAddress(pay.properties as any);
              return (
                <div
                  key={pay.id}
                  className="p-3 bg-gray-50 rounded-xl border border-gray-200"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {tenantName}
                      </p>
                      <p className="text-xs text-gray-500">{address}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {pay.mois_concerne}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-600">
                        {formatMontantImmo(pay.montant)} FCFA
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(pay.date_paiement)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => setPreviewOpen(false)}
            className="w-full px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium transition-colors"
          >
            Fermer
          </button>
        </div>
      </Modal>

      {/* Add/Edit Payment Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Modifier le Paiement" : "Nouveau Paiement de Loyer"}
      >
        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {error}
            </div>
          )}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <span className="text-xs text-gray-500">Référence quittance</span>
            <span className="text-xs font-mono font-bold text-gray-700">
              {form.reference}
            </span>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Contrat lié{" "}
              <span className="text-gray-400 font-normal">(recommandé)</span>
            </label>
            <select
              value={form.contract_id}
              onChange={(e) => handleContractChange(e.target.value)}
              className={inputClass}
            >
              <option value="">Sélectionner un contrat...</option>
              {contracts
                .filter((c) => c.statut === "actif")
                .map((c) => {
                  const tenantName = getTenantName(c.locataires as any);
                  const address = getPropertyAddress(c.properties as any);
                  return (
                    <option key={c.id} value={c.id}>
                      {tenantName} — {address}
                    </option>
                  );
                })}
            </select>
          </div>
          {!form.contract_id && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Locataire
                </label>
                <select
                  value={form.locataire_id}
                  onChange={(e) =>
                    setForm({ ...form, locataire_id: e.target.value })
                  }
                  className={inputClass}
                >
                  <option value="">Sélectionner...</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.prenom} {t.nom}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Bien Immobilier
                </label>
                <select
                  value={form.property_id}
                  onChange={(e) =>
                    setForm({ ...form, property_id: e.target.value })
                  }
                  className={inputClass}
                >
                  <option value="">Sélectionner...</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.adresse}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Montant (FCFA) *
              </label>
              <input
                type="number"
                value={form.montant}
                onChange={(e) => setForm({ ...form, montant: e.target.value })}
                className={inputClass}
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Mois Concerné *
              </label>
              <input
                type="month"
                value={form.mois_concerne_date}
                onChange={(e) => {
                  const value = e.target.value;
                  setForm({
                    ...form,
                    mois_concerne_date: value,
                    mois_concerne: monthLabelFromInput(value),
                    date_echeance: value
                      ? lastDayFromMonth(value)
                      : form.date_echeance,
                  });
                }}
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
                Mode de Paiement
              </label>
              <select
                value={form.mode_paiement}
                onChange={(e) =>
                  setForm({
                    ...form,
                    mode_paiement: e.target
                      .value as RentPayment["mode_paiement"],
                  })
                }
                className={inputClass}
              >
                <option value="virement">Virement</option>
                <option value="especes">Espèces</option>
                <option value="mobile_money">Mobile Money</option>
                <option value="cheque">Chèque</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(form.statut === "paye" || form.statut === "partiel") && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Date de Paiement
                </label>
                <input
                  type="date"
                  value={form.date_paiement_effectif}
                  onChange={(e) =>
                    setForm({ ...form, date_paiement_effectif: e.target.value })
                  }
                  className={inputClass}
                />
              </div>
            )}
            <div
              className={
                form.statut === "paye" || form.statut === "partiel"
                  ? ""
                  : "col-span-2"
              }
            >
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
                <option value="paye">Payé</option>
                <option value="partiel">Partiel</option>
                <option value="en_attente">En Attente</option>
                <option value="retard">Retard</option>
              </select>
            </div>
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
                !form.montant ||
                (!form.mois_concerne_date && !form.mois_concerne)
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
