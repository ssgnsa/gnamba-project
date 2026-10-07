import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Search,
  CreditCard as Edit,
  Trash2,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Printer,
  Calendar,
  Download,
  X,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import dbClient from '../lib/dbClient.service';
import { clientsRepository } from '../lib/dbClient.service';
import { Finance, Client, Project } from "../types";
import Modal from "../components/ui/Modal";
import Badge from "../components/ui/Badge";
import SelectWithCreate from "../components/ui/SelectWithCreate";
import { useSettings } from "../context/SettingsContext";
import { useAuth } from "../context/AuthContext";
import {
  getDemoBlockMessage,
  shouldBlockDestructiveAction,
} from "../lib/demoMode";
import { generateReference } from "../utils/reference";
import { printRecu } from "../utils/print";
import MobileCard from "../components/ui/MobileCard";

const PAGE_SIZE = 50;

const modeLabels: Record<string, string> = {
  virement: "Virement",
  especes: "Espèces",
  mobile_money: "Mobile Money",
  cheque: "Chèque",
};

const categoriesRecettes = [
  "Paiement Client",
  "Loyer",
  "Vente Produits",
  "Autre Recette",
];
const categoriesDepenses = [
  "Salaires",
  "Matériaux",
  "Fournisseurs",
  "Transport",
  "Charges",
  "Autre Dépense",
];

const emptyForm = {
  type_transaction: "recette" as Finance["type_transaction"],
  categorie: "",
  montant: "",
  date_transaction: new Date().toISOString().split("T")[0],
  mode_paiement: "especes" as Finance["mode_paiement"],
  reference: "",
  description: "",
  client_id: "",
  project_id: "",
};

export default function Finances() {
  const { settings } = useSettings();
  const { user, profile } = useAuth();
  const [transactions, setTransactions] = useState<Finance[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const destructiveActionsDisabled = shouldBlockDestructiveAction(
    user,
    profile,
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const [finRes, cliRes, projRes] = await Promise.all([
        dbClient
          .from("finances")
          .select("*", { count: "exact" })
          .range(from, to)
          .order("date_transaction", { ascending: false }),
        clientsRepository.getAll(),
        dbClient.from("projects").select("id, nom").order("nom"),
      ]);
      setTransactions((finRes.data as Finance[]) || []);
      setTotalCount(finRes.count || finRes.data?.length || 0);
      setClients((cliRes.data as Client[]) || []);
      setProjects((projRes.data as Project[]) || []);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openAdd = () => {
    setForm({ ...emptyForm, reference: generateReference("FIN") });
    setEditingId(null);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (t: Finance) => {
    setForm({
      type_transaction: t.type_transaction,
      categorie: t.categorie,
      montant: String(t.montant),
      date_transaction: t.date_transaction,
      mode_paiement: t.mode_paiement,
      reference: t.reference,
      description: t.description,
      client_id: t.client_id || "",
      project_id: t.project_id || "",
    });
    setEditingId(t.id);
    setFormError(null);
    setModalOpen(true);
  };

  const handleSave = async () => {
    const parsedMontant = parseFloat(form.montant);
    if (!form.montant || isNaN(parsedMontant) || parsedMontant <= 0) {
      setFormError("Le montant doit être un nombre positif.");
      return;
    }
    if (!form.categorie) {
      setFormError("La catégorie est obligatoire.");
      return;
    }

    setFormError(null);
    setSaving(true);
    const ref = form.reference || generateReference("FIN");
    const payload = {
      type_transaction: form.type_transaction,
      categorie: form.categorie,
      montant: parsedMontant,
      date_transaction: form.date_transaction,
      mode_paiement: form.mode_paiement,
      reference: ref,
      description: form.description,
      client_id: form.client_id || null,
      project_id: form.project_id || null,
      statut: "valide",
      updated_at: new Date().toISOString(),
    };

    try {
      if (editingId) {
        const { error } = await dbClient
          .from("finances")
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await dbClient.from("finances").insert(payload);
        if (error) throw error;
      }

      setModalOpen(false);
      await fetchData();
    } catch (error: any) {
      setFormError(
        error.message || "Une erreur est survenue lors de l’enregistrement.",
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
    if (!confirm("Supprimer cette transaction ?")) return;
    const { error } = await dbClient.from("finances").delete().eq("id", id);
    if (error) {
      setFormError(error.message);
      return;
    }
    fetchData();
  };

  const handleRestore = async (id: string) => {
    if (!confirm("Restaurer cette transaction annulée ?")) return;
    const { error } = await dbClient
      .from("finances")
      .update({ statut: "valide" })
      .eq("id", id);
    if (error) {
      setFormError(error.message);
      return;
    }
    fetchData();
  };

  const handlePrintRecu = (t: Finance) => {
    const client = clients.find((c) => c.id === t.client_id);
    printRecu({
      reference: t.reference || generateReference("FIN"),
      client_nom: client ? `${client.prenom} ${client.nom}` : "—",
      description: t.description,
      montant: t.montant,
      date_transaction: new Date(t.date_transaction).toLocaleDateString(
        "fr-FR",
      ),
      mode_paiement: t.mode_paiement,
      categorie: t.categorie,
      appName: settings.app_title,
      appCompany: settings.app_company,
      logoUrl: settings.logo_url,
    });
  };

  // Filtre côté client (sur les données paginées) + exclut les annulées
  const filtered = transactions
    .filter((t) => t.statut !== "annule")
    .filter((t) => {
      const matchSearch = `${t.categorie} ${t.description} ${t.reference}`
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchType = !filterType || t.type_transaction === filterType;
      const matchDateFrom = ! dateFrom || t.date_transaction >= dateFrom;
      const matchDateTo = !dateTo || t.date_transaction <= dateTo;
      return matchSearch && matchType && matchDateFrom && matchDateTo;
    });

  // Toutes les transactions (inclure les annulées pour les totaux)
  const allForCalc = transactions.filter((t) => {
    const matchType = !filterType || t.type_transaction === filterType;
    const matchDateFrom = !dateFrom || t.date_transaction >= dateFrom;
    const matchDateTo = !dateTo || t.date_transaction <= dateTo;
    return matchType && matchDateFrom && matchDateTo;
  });

  const totalRecettes = allForCalc
    .filter((t) => t.type_transaction === "recette")
    .reduce((s, t) => s + t.montant, 0);
  const totalDepenses = allForCalc
    .filter((t) => t.type_transaction === "depense")
    .reduce((s, t) => s + t.montant, 0);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const exportCSV = () => {
    const headers = [
      "Date",
      "Type",
      "Catégorie",
      "Description",
      "Montant (FCFA)",
      "Mode paiement",
      "Référence",
      "Client",
      "Projet",
    ];
    const rows = filtered.map((t) => [
      new Date(t.date_transaction).toLocaleDateString("fr-FR"),
      t.type_transaction === "recette" ? "Recette" : "Dépense",
      t.categorie,
      t.description || "",
      t.montant.toFixed(2),
      modeLabels[t.mode_paiement || ""] || t.mode_paiement || "",
      t.reference,
      t.clients
        ? `${(t.clients as any)?.nom || ""} ${(t.clients as any)?.prenom || ""}`.trim()
        : "",
      t.projects ? (t.projects as any)?.nom || "" : "",
    ]);

    const csvContent = [
      headers.join(";"),
      ...rows.map((r) => r.map((v) => `"${v}"`).join(";")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `finances_egs_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const categories =
    form.type_transaction === "recette"
      ? categoriesRecettes
      : categoriesDepenses;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-4">
          <div className="p-3 bg-green-50 rounded-xl">
            <TrendingUp size={20} className="text-green-600" />
          </div>
          <div>
            <div className="text-xs text-gray-500">Total Recettes</div>
            <div className="font-bold text-green-600">
              {totalRecettes.toLocaleString("fr-FR")} FCFA
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-4">
          <div className="p-3 bg-red-50 rounded-xl">
            <TrendingDown size={20} className="text-red-600" />
          </div>
          <div>
            <div className="text-xs text-gray-500">Total Dépenses</div>
            <div className="font-bold text-red-600">
              {totalDepenses.toLocaleString("fr-FR")} FCFA
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-4">
          <div
            className="p-3 rounded-xl"
            style={{ backgroundColor: settings.primary_color + "15" }}
          >
            <DollarSign size={20} style={{ color: settings.primary_color }} />
          </div>
          <div>
            <div className="text-xs text-gray-500">Solde Net</div>
            <div
              className={`font-bold ${totalRecettes - totalDepenses >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {(totalRecettes - totalDepenses).toLocaleString("fr-FR")} FCFA
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-col sm:flex-row gap-2 flex-1 w-full">
          <div className="relative flex-1 w-full sm:max-w-sm">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none bg-white w-full sm:w-auto"
          >
            <option value="">Tous</option>
            <option value="recette">Recettes</option>
            <option value="depense">Dépenses</option>
          </select>
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-gray-500" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-2 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none bg-white"
              title="Date début"
            />
            <span className="text-gray-400 text-xs">→</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-2 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none bg-white"
              title="Date fin"
            />
            {(dateFrom || dateTo) && (
              <button
                onClick={() => {
                  setDateFrom("");
                  setDateTo("");
                }}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                title="Réinitialiser dates"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors w-full sm:w-auto"
          >
            <Download size={14} /> Export CSV
          </button>
          <button
            onClick={openAdd}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium hover:opacity-90 transition-opacity w-full sm:w-auto"
            style={{
              backgroundColor: settings.primary_color,
              color: "var(--color-on-primary)",
            }}
          >
            <Plus size={16} /> Nouvelle Transaction
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div
              className="animate-spin rounded-full h-8 w-8 border-b-2"
              style={{ borderColor: settings.primary_color }}
            ></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <DollarSign size={40} className="mb-2 opacity-30" />
            <p className="text-sm">Aucune transaction</p>
          </div>
        ) : (
          <>
            <div className="md:hidden p-3 space-y-3">
              {filtered.map((t) => (
                <MobileCard
                  key={t.id}
                  title={t.categorie}
                  subtitle={new Date(t.date_transaction).toLocaleDateString(
                    "fr-FR",
                  )}
                  icon={
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${t.type_transaction === "recette" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}
                    >
                      <DollarSign size={18} />
                    </div>
                  }
                  fields={[
                    {
                      label: "Type",
                      value: (
                        <Badge
                          label={
                            t.type_transaction === "recette"
                              ? "Recette"
                              : "Dépense"
                          }
                          color={
                            t.type_transaction === "recette" ? "green" : "red"
                          }
                        />
                      ),
                    },
                    {
                      label: "Mode",
                      value: modeLabels[t.mode_paiement] || "—",
                    },
                    { label: "Référence", value: t.reference || "—" },
                    {
                      label: "Montant",
                      value: (
                        <span
                          className={
                            t.type_transaction === "recette"
                              ? "text-green-600 font-semibold"
                              : "text-red-600 font-semibold"
                          }
                        >
                          {t.type_transaction === "recette" ? "+" : "-"}
                          {t.montant.toLocaleString("fr-FR")} FCFA
                        </span>
                      ),
                    },
                    { label: "Description", value: t.description || "—" },
                  ]}
                  actions={
                    <>
                      <button
                        onClick={() => handlePrintRecu(t)}
                        title="Imprimer Reçu"
                        className="p-2 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                      >
                        <Printer size={16} />
                      </button>
                      <button
                        onClick={() => openEdit(t)}
                        className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  }
                />
              ))}
            </div>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full egs-table">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">
                      Référence
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                      Type
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                      Catégorie
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">
                      Mode
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                      Montant
                    </th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((t) => (
                    <tr
                      key={t.id}
                      className={`hover:bg-gray-50 transition-colors ${t.statut === "annule" ? "opacity-50" : ""}`}
                    >
                      <td className="px-4 py-3 table-key hidden md:table-cell">
                        {t.reference || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(t.date_transaction).toLocaleDateString(
                          "fr-FR",
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Badge
                            label={
                              t.type_transaction === "recette"
                                ? "Recette"
                                : "Dépense"
                            }
                            color={
                              t.type_transaction === "recette" ? "green" : "red"
                            }
                          />
                          {t.statut === "annule" && (
                            <Badge label="Annulé" color="gray" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {t.categorie}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 hidden sm:table-cell">
                        {modeLabels[t.mode_paiement]}
                      </td>
                      <td
                        className={`px-4 py-3 text-sm font-semibold text-right ${t.type_transaction === "recette" ? "text-green-600" : "text-red-600"}`}
                      >
                        {t.type_transaction === "recette" ? "+" : "-"}
                        {t.montant.toLocaleString("fr-FR")} FCFA
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={() => handlePrintRecu(t)}
                            title="Imprimer Reçu"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                          >
                            <Printer size={15} />
                          </button>
                          {t.statut !== "annule" ? (
                            <>
                              <button
                                onClick={() => openEdit(t)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              >
                                <Edit size={15} />
                              </button>
                              <button
                                onClick={() => handleDelete(t.id)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 size={15} />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleRestore(t.id)}
                              title="Restaurer"
                              className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                            >
                              <RotateCcw size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
                <span className="text-xs text-gray-500">
                  {totalCount} transaction{totalCount > 1 ? "s" : ""} — Page {page + 1}/{totalPages}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="p-2 rounded-lg text-gray-500 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="p-2 rounded-lg text-gray-500 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setFormError(null);
          setModalOpen(false);
        }}
        title={editingId ? "Modifier la Transaction" : "Nouvelle Transaction"}
      >
        <div className="space-y-4">
          {formError && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {formError}
            </div>
          )}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <span className="text-xs text-gray-500">Référence unique</span>
            <span className="text-xs font-mono font-bold text-gray-700">
              {form.reference}
            </span>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(["recette", "depense"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() =>
                    setForm({ ...form, type_transaction: t, categorie: "" })
                  }
                  className={`py-2.5 rounded-xl text-sm font-medium border transition-colors ${form.type_transaction === t ? (t === "recette" ? "bg-green-50 border-green-400 text-green-700" : "bg-red-50 border-red-400 text-red-700") : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}
                >
                  {t === "recette" ? "Recette" : "Dépense"}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Catégorie *
              </label>
              <select
                value={form.categorie}
                onChange={(e) =>
                  setForm({ ...form, categorie: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              >
                <option value="">Sélectionner...</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Montant (FCFA) *
              </label>
              <input
                type="number"
                value={form.montant}
                onChange={(e) => setForm({ ...form, montant: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Date
              </label>
              <input
                type="date"
                value={form.date_transaction}
                onChange={(e) =>
                  setForm({ ...form, date_transaction: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
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
                    mode_paiement: e.target.value as Finance["mode_paiement"],
                  })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              >
                {Object.entries(modeLabels).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <SelectWithCreate
              value={form.client_id}
              onChange={(val) => setForm({ ...form, client_id: val })}
              options={clients.map((c) => ({ value: c.id, label: `${c.prenom} ${c.nom}` }))}
              placeholder="Sélectionner un client..."
              label="Client"
              createModalTitle="Nouveau Client"
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
                if (error) throw error;
                return { value: newClient.id, label: `${data.prenom} ${data.nom}` };
              }}
            />
          </div>
          <div>
            <SelectWithCreate
              value={form.project_id}
              onChange={(val) => setForm({ ...form, project_id: val })}
              options={projects.map((p) => ({ value: p.id, label: p.nom }))}
              placeholder="Aucun projet"
              label="Projet (optionnel)"
              createModalTitle="Nouveau Projet"
              createFields={[
                { key: "nom", label: "Nom du Projet", type: "text", placeholder: "Ex: Construction Villa", required: true },
                { key: "type_projet", label: "Type de Projet", type: "text", placeholder: "Construction, Rénovation...", required: false },
                { key: "localisation", label: "Localisation", type: "text", placeholder: "Ex: Cocody, Abidjan", required: false },
                { key: "budget", label: "Budget (FCFA)", type: "number", placeholder: "0", required: false },
                { key: "date_debut", label: "Date Début", type: "date", required: false },
                { key: "date_fin", label: "Date Fin", type: "date", required: false },
                { key: "statut", label: "Statut", type: "select", required: true, options: [
                  { value: "devis", label: "Devis" },
                  { value: "valide", label: "Validé" },
                  { value: "en_cours", label: "En Cours" },
                  { value: "termine", label: "Terminé" },
                  { value: "facture", label: "Facturé" },
                ]},
                { key: "description", label: "Description", type: "textarea", placeholder: "Description...", required: false },
                { key: "notes", label: "Notes", type: "textarea", placeholder: "Notes...", required: false },
              ]}
              validateCreateForm={(data) => {
                const errors: Record<string, string> = {};
                if (!data.nom?.trim()) errors.nom = "Le nom du projet est obligatoire";
                return Object.keys(errors).length > 0 ? errors : null;
              }}
              onCreate={async (data) => {
                const now = new Date().toISOString();
                const payload = {
                  nom: data.nom,
                  type_projet: data.type_projet || null,
                  localisation: data.localisation || null,
                  budget: parseFloat(data.budget) || 0,
                  date_debut: data.date_debut || null,
                  date_fin: data.date_fin || null,
                  statut: data.statut || "devis",
                  description: data.description || null,
                  notes: data.notes || null,
                  updated_at: now,
                };
                const { data: newProj, error } = await dbClient.from("projects").insert(payload).select("id").single();
                if (error) throw error;
                return { value: newProj.id, label: data.nom };
              }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Description
            </label>
            <input
              type="text"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Note, objet..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => {
                setFormError(null);
                setModalOpen(false);
              }}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form.montant || !form.categorie}
              className="flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
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
    </div>
  );
}
