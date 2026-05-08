import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Search,
  CreditCard as Edit,
  Trash2,
  User,
  ChevronLeft,
  ChevronRight,
  HardHat,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { Client } from "../types";
import Modal from "../components/ui/Modal";
import Badge from "../components/ui/Badge";
import { useSettings } from "../context/SettingsContext";
import MobileCard from "../components/ui/MobileCard";
import { useAuth } from "../context/AuthContext";
import {
  getDemoBlockMessage,
  shouldBlockDestructiveAction,
} from "../lib/demoMode";

const CLIENTS_PER_PAGE = 20;

const typeLabels: Record<
  string,
  { label: string; color: "blue" | "green" | "orange" | "gray" }
> = {
  particulier: { label: "Particulier", color: "blue" },
  entreprise: { label: "Entreprise", color: "green" },
  promoteur_immobilier: { label: "Promoteur", color: "orange" },
  institution: { label: "Institution", color: "gray" },
};

const typeOptions = [
  { value: "", label: "Tous les types" },
  { value: "particulier", label: "Particulier" },
  { value: "entreprise", label: "Entreprise" },
  { value: "promoteur_immobilier", label: "Promoteur Immobilier" },
  { value: "institution", label: "Institution" },
];

const emptyForm = {
  nom: "",
  prenom: "",
  telephone: "",
  email: "",
  adresse: "",
  type_client: "particulier" as Client["type_client"],
  notes: "",
};

// Validation helpers
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const IVORIAN_PHONE_REGEX =
  /^(?:(?:\+225|00225|0)[\s-])?[56789]\d{2}[\s-]?\d{2}[\s-]?\d{2}[\s-]?\d{2}$/;

function validateEmail(email: string): string | null {
  if (!email) return null; // email is optional
  if (!EMAIL_REGEX.test(email.trim())) {
    return "Format d'email invalide.";
  }
  return null;
}

function validatePhone(phone: string): string | null {
  if (!phone.trim()) return "Le téléphone est obligatoire.";
  // Normalize: remove spaces and dashes for validation
  const normalized = phone.replace(/[\s-]/g, "");
  if (
    !IVORIAN_PHONE_REGEX.test(normalized) &&
    !IVORIAN_PHONE_REGEX.test(phone)
  ) {
    return "Format de téléphone invalide. Ex: +225 07 00 00 00 ou 07000000.";
  }
  return null;
}

export default function Clients() {
  const { settings } = useSettings();
  const { user, profile } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const destructiveActionsDisabled = shouldBlockDestructiveAction(
    user,
    profile,
  );

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });
    setClients(data || []);
    setLoading(false);
  };

  const openAdd = () => {
    setForm(emptyForm);
    setEditingId(null);
    setFormError(null);
    setModalOpen(true);
  };
  const openEdit = (c: Client) => {
    setForm({
      nom: c.nom,
      prenom: c.prenom,
      telephone: c.telephone,
      email: c.email,
      adresse: c.adresse,
      type_client: c.type_client,
      notes: c.notes,
    });
    setEditingId(c.id);
    setFormError(null);
    setModalOpen(true);
  };

  const handleSave = async () => {
    const phoneError = validatePhone(form.telephone);
    if (phoneError) {
      setFormError(phoneError);
      return;
    }
    const emailError = validateEmail(form.email);
    if (emailError) {
      setFormError(emailError);
      return;
    }
    if (!form.nom.trim()) {
      setFormError("Le nom est obligatoire.");
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      if (editingId) {
        const { error } = await supabase
          .from("clients")
          .update({ ...form, updated_at: new Date().toISOString() })
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("clients").insert(form);
        if (error) throw error;
      }
      setModalOpen(false);
      fetchClients();
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Impossible d'enregistrer ce client.",
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
    if (!confirm("Supprimer ce client ?")) return;
    await supabase.from("clients").delete().eq("id", id);
    fetchClients();
  };

  const navigateToProjets = useCallback((clientId: string) => {
    // Store the filter in sessionStorage so Projets can read it on mount
    sessionStorage.setItem("egs:filter_client_id", clientId);
    // Dispatch navigation event to switch to Projets page
    window.dispatchEvent(
      new CustomEvent("egs:navigate", { detail: "projets" }),
    );
  }, []);

  const filtered = clients.filter((c) => {
    const matchSearch = `${c.nom} ${c.prenom} ${c.telephone} ${c.email}`
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchType = !filterType || c.type_client === filterType;
    return matchSearch && matchType;
  });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / CLIENTS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * CLIENTS_PER_PAGE;
  const paginated = filtered.slice(startIndex, startIndex + CLIENTS_PER_PAGE);

  const goToPage = (page: number) => setCurrentPage(clamp(page, 1, totalPages));

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterType]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 flex-1 w-full sm:max-w-none">
          <div className="relative flex-1 w-full sm:max-w-sm">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Rechercher un client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-100)] focus:border-[var(--color-primary-400)]"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-100)] focus:border-[var(--color-primary-400)] bg-white w-full sm:w-auto"
          >
            {typeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--color-primary-300)] w-full sm:w-auto"
          style={{
            backgroundColor: settings.primary_color,
            color: "var(--color-on-primary)",
          }}
        >
          <Plus size={16} /> Nouveau Client
        </button>
      </div>

      <div className="egs-panel overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div
              className="animate-spin rounded-full h-8 w-8 border-b-2"
              style={{ borderColor: settings.primary_color }}
            ></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <User size={40} className="mb-2 opacity-30" />
            <p className="text-sm">Aucun client trouvé</p>
          </div>
        ) : (
          <>
            <div className="md:hidden p-3 space-y-3">
              {paginated.map((c) => {
                const t = typeLabels[c.type_client];
                return (
                  <MobileCard
                    key={c.id}
                    title={`${c.prenom} ${c.nom}`.trim() || c.nom}
                    subtitle={c.email || c.telephone || "Client"}
                    icon={
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{
                          backgroundColor: settings.primary_color,
                          color: "var(--color-on-primary)",
                        }}
                      >
                        {c.prenom[0]?.toUpperCase() ||
                          c.nom[0]?.toUpperCase() ||
                          "?"}
                      </div>
                    }
                    fields={[
                      { label: "Téléphone", value: c.telephone || "—" },
                      { label: "Email", value: c.email || "—" },
                      {
                        label: "Type",
                        value: <Badge label={t.label} color={t.color} />,
                      },
                      { label: "Adresse", value: c.adresse || "—" },
                    ]}
                    actions={
                      <>
                        <button
                          onClick={() => navigateToProjets(c.id)}
                          className="p-2 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                          title="Voir projets"
                        >
                          <HardHat size={16} />
                        </button>
                        <button
                          onClick={() => openEdit(c)}
                          className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    }
                  />
                );
              })}
            </div>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full egs-table">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Nom
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Téléphone
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">
                      Email
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">
                      Type
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">
                      Adresse
                    </th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginated.map((c) => {
                    const t = typeLabels[c.type_client];
                    return (
                      <tr
                        key={c.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                              style={{
                                backgroundColor: settings.primary_color,
                                color: "var(--color-on-primary)",
                              }}
                            >
                              {c.prenom[0]?.toUpperCase() ||
                                c.nom[0]?.toUpperCase() ||
                                "?"}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-800">
                                {c.prenom} {c.nom}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {c.telephone}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 hidden md:table-cell">
                          {c.email || "—"}
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <Badge label={t.label} color={t.color} />
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 hidden lg:table-cell max-w-[180px] truncate">
                          {c.adresse || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 justify-end">
                            <button
                              onClick={() => navigateToProjets(c.id)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                              title="Voir projets"
                            >
                              <HardHat size={15} />
                            </button>
                            <button
                              onClick={() => openEdit(c)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            >
                              <Edit size={15} />
                            </button>
                            <button
                              onClick={() => handleDelete(c.id)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
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
          </>
        )}
      </div>

      {/* Pagination Controls */}
      {filtered.length > CLIENTS_PER_PAGE && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white rounded-xl border border-gray-100 px-4 py-3">
          <p className="text-sm text-gray-500">
            {startIndex + 1}–
            {Math.min(startIndex + CLIENTS_PER_PAGE, filtered.length)} sur{" "}
            {filtered.length} clients
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => goToPage(safePage - 1)}
              disabled={safePage <= 1}
              className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Page précédente"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              // Show first, last, current, and surrounding pages; use ellipsis
              const showPage =
                page === 1 ||
                page === totalPages ||
                (page >= safePage - 1 && page <= safePage + 1);
              if (!showPage) return null;
              const showEllipsisBefore = page === safePage - 2;
              const showEllipsisAfter = page === safePage + 2;
              return (
                <span key={page} className="flex items-center">
                  {showEllipsisBefore && (
                    <span className="px-1 text-gray-400 text-sm">…</span>
                  )}
                  <button
                    onClick={() => goToPage(page)}
                    className={`min-w-[36px] h-9 rounded-lg text-sm font-medium transition-colors ${
                      page === safePage
                        ? "text-white"
                        : "text-gray-600 hover:bg-gray-50 border border-gray-200"
                    }`}
                    style={
                      page === safePage
                        ? {
                            backgroundColor: settings.primary_color,
                            color: "var(--color-on-primary)",
                          }
                        : {}
                    }
                  >
                    {page}
                  </button>
                  {showEllipsisAfter && (
                    <span className="px-1 text-gray-400 text-sm">…</span>
                  )}
                </span>
              );
            })}
            <button
              onClick={() => goToPage(safePage + 1)}
              disabled={safePage >= totalPages}
              className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Page suivante"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setFormError(null);
        }}
        title={editingId ? "Modifier le Client" : "Nouveau Client"}
      >
        <div className="space-y-4">
          {formError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {formError}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Prénom *
              </label>
              <input
                type="text"
                value={form.prenom}
                onChange={(e) => setForm({ ...form, prenom: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
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
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Téléphone *
            </label>
            <input
              type="tel"
              value={form.telephone}
              onChange={(e) => setForm({ ...form, telephone: e.target.value })}
              placeholder="+225 07 00 00 00"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
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
              placeholder="exemple@email.com"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Adresse
            </label>
            <input
              type="text"
              value={form.adresse}
              onChange={(e) => setForm({ ...form, adresse: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Type de Client
            </label>
            <select
              value={form.type_client}
              onChange={(e) =>
                setForm({
                  ...form,
                  type_client: e.target.value as Client["type_client"],
                })
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
            >
              <option value="particulier">Particulier</option>
              <option value="entreprise">Entreprise</option>
              <option value="promoteur_immobilier">Promoteur Immobilier</option>
              <option value="institution">Institution</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => {
                setModalOpen(false);
                setFormError(null);
              }}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form.nom.trim() || !form.telephone.trim()}
              className="flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
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

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
