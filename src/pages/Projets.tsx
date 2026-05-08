import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  CreditCard as Edit,
  Trash2,
  HardHat,
  Image,
  X,
  Users,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { Project, Client } from "../types";
import Modal from "../components/ui/Modal";
import Badge from "../components/ui/Badge";
import { useSettings } from "../context/SettingsContext";
import MediaPicker from "../components/media/MediaPicker";
import MobileCard from "../components/ui/MobileCard";
import { useAuth } from "../context/AuthContext";
import {
  getDemoBlockMessage,
  shouldBlockDestructiveAction,
} from "../lib/demoMode";

const statutConfig: Record<
  string,
  { label: string; color: "gray" | "blue" | "orange" | "green" | "yellow" }
> = {
  devis: { label: "Devis", color: "gray" },
  valide: { label: "Validé", color: "blue" },
  en_cours: { label: "En Cours", color: "orange" },
  termine: { label: "Terminé", color: "green" },
  facture: { label: "Facturé", color: "yellow" },
};

const emptyForm = {
  nom: "",
  client_id: "",
  localisation: "",
  type_projet: "",
  budget: "",
  date_debut: "",
  date_fin: "",
  statut: "devis" as Project["statut"],
  description: "",
  notes: "",
  cover_image_url: "",
};

export default function Projets() {
  const { settings } = useSettings();
  const { user, profile } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<
    Array<Pick<Client, "id" | "nom" | "prenom">>
  >([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState("");
  const [filterClientId, setFilterClientId] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const destructiveActionsDisabled = shouldBlockDestructiveAction(
    user,
    profile,
  );

  useEffect(() => {
    // Read client_id filter from sessionStorage (set by Clients.tsx "Voir projets" button)
    const storedClientId = sessionStorage.getItem("egs:filter_client_id");
    if (storedClientId) {
      setFilterClientId(storedClientId);
      sessionStorage.removeItem("egs:filter_client_id");
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [projRes, cliRes] = await Promise.all([
      supabase
        .from("projects")
        .select("*, clients(nom, prenom)")
        .order("created_at", { ascending: false }),
      supabase.from("clients").select("id, nom, prenom").order("nom"),
    ]);
    setProjects((projRes.data as Project[]) || []);
    setClients(
      (cliRes.data as Array<Pick<Client, "id" | "nom" | "prenom">>) || [],
    );
    setLoading(false);
  };

  const openAdd = () => {
    setForm(emptyForm);
    setEditingId(null);
    setFormError(null);
    setModalOpen(true);
  };
  const openEdit = (p: Project) => {
    setForm({
      nom: p.nom,
      client_id: p.client_id || "",
      localisation: p.localisation,
      type_projet: p.type_projet,
      budget: String(p.budget),
      date_debut: p.date_debut || "",
      date_fin: p.date_fin || "",
      statut: p.statut,
      description: p.description,
      notes: p.notes,
      cover_image_url: p.cover_image_url || "",
    });
    setEditingId(p.id);
    setFormError(null);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.nom.trim()) {
      setFormError("Le nom du projet est obligatoire.");
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        nom: form.nom,
        client_id: form.client_id || null,
        localisation: form.localisation,
        type_projet: form.type_projet,
        budget: parseFloat(form.budget) || 0,
        date_debut: form.date_debut || null,
        date_fin: form.date_fin || null,
        statut: form.statut,
        description: form.description,
        notes: form.notes,
        cover_image_url: form.cover_image_url || null,
        updated_at: new Date().toISOString(),
      };
      if (editingId) {
        const { error } = await supabase
          .from("projects")
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("projects").insert(payload);
        if (error) throw error;
      }
      setModalOpen(false);
      fetchData();
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Impossible d’enregistrer ce projet.",
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
    if (!confirm("Supprimer ce projet ?")) return;
    await supabase.from("projects").delete().eq("id", id);
    fetchData();
  };

  const filtered = projects.filter((p) => {
    const matchSearch = `${p.nom} ${p.localisation} ${p.type_projet}`
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchStatut = !filterStatut || p.statut === filterStatut;
    const matchClient = !filterClientId || p.client_id === filterClientId;
    return matchSearch && matchStatut && matchClient;
  });

  return (
    <div className="space-y-4">
      {filterClientId && (
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5">
          <Users size={16} className="text-blue-600 flex-shrink-0" />
          <span className="text-sm text-blue-700">
            Filtré par client :{" "}
            <strong>
              {clients.find((c) => c.id === filterClientId)?.prenom || ""}{" "}
              {clients.find((c) => c.id === filterClientId)?.nom || ""}
            </strong>
          </span>
          <button
            onClick={() => setFilterClientId("")}
            className="ml-auto p-1 rounded-lg text-blue-400 hover:text-blue-700 hover:bg-blue-100 transition-colors"
            title="Retirer le filtre"
          >
            <X size={14} />
          </button>
        </div>
      )}
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
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-100)] focus:border-[var(--color-primary-400)]"
            />
          </div>
          <select
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-100)] focus:border-[var(--color-primary-400)] bg-white w-full sm:w-auto"
          >
            <option value="">Tous les statuts</option>
            {Object.entries(statutConfig).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
          <select
            value={filterClientId}
            onChange={(e) => setFilterClientId(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-100)] focus:border-[var(--color-primary-400)] bg-white w-full sm:w-auto"
          >
            <option value="">Tous les clients</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.prenom} {c.nom}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--color-primary-300)] transition-opacity w-full sm:w-auto"
          style={{
            backgroundColor: settings.primary_color,
            color: "var(--color-on-primary)",
          }}
        >
          <Plus size={16} /> Nouveau Projet
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
            <HardHat size={40} className="mb-2 opacity-30" />
            <p className="text-sm">Aucun projet trouvé</p>
          </div>
        ) : (
          <>
            <div className="md:hidden p-3 space-y-3">
              {filtered.map((p) => {
                const st = statutConfig[p.statut];
                return (
                  <MobileCard
                    key={p.id}
                    title={p.nom}
                    subtitle={p.localisation || "Projet BTP"}
                    icon={
                      p.cover_image_url ? (
                        <img
                          src={p.cover_image_url}
                          alt={p.nom}
                          className="w-12 h-10 rounded-lg object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="w-12 h-10 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200">
                          <HardHat size={16} className="text-gray-400" />
                        </div>
                      )
                    }
                    fields={[
                      {
                        label: "Client",
                        value: p.clients
                          ? `${p.clients.prenom} ${p.clients.nom}`
                          : "—",
                      },
                      { label: "Type", value: p.type_projet || "—" },
                      {
                        label: "Budget",
                        value: p.budget
                          ? `${p.budget.toLocaleString("fr-FR")} FCFA`
                          : "—",
                      },
                      {
                        label: "Dates",
                        value: p.date_fin
                          ? `${p.date_debut || "—"} → ${p.date_fin}`
                          : p.date_debut || "—",
                      },
                      {
                        label: "Statut",
                        value: <Badge label={st.label} color={st.color} />,
                      },
                    ]}
                    actions={
                      <>
                        <button
                          onClick={() => openEdit(p)}
                          className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
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
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                      Projet
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">
                      Client
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">
                      Budget
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">
                      Dates
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                      Statut
                    </th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((p) => {
                    const st = statutConfig[p.statut];
                    return (
                      <tr
                        key={p.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {p.cover_image_url ? (
                              <img
                                src={p.cover_image_url}
                                alt={p.nom}
                                className="w-10 h-8 rounded-lg object-cover flex-shrink-0 border border-gray-200"
                              />
                            ) : (
                              <div className="w-10 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                                <HardHat size={12} className="text-gray-400" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-sm text-gray-800">
                                {p.nom}
                              </div>
                              <div className="text-xs text-gray-400">
                                {p.localisation || "—"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">
                          {p.clients
                            ? `${p.clients.prenom} ${p.clients.nom}`
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">
                          {p.budget
                            ? `${p.budget.toLocaleString("fr-FR")} FCFA`
                            : "—"}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <div className="text-xs text-gray-500">
                            {p.date_debut || "—"}
                          </div>
                          <div className="text-xs text-gray-400">
                            {p.date_fin ? `→ ${p.date_fin}` : ""}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge label={st.label} color={st.color} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 justify-end">
                            <button
                              onClick={() => openEdit(p)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            >
                              <Edit size={15} />
                            </button>
                            <button
                              onClick={() => handleDelete(p.id)}
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

      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setFormError(null);
        }}
        title={editingId ? "Modifier le Projet" : "Nouveau Projet"}
        size="lg"
      >
        <div className="space-y-4">
          {formError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {formError}
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Photo du chantier
            </label>
            <div className="flex items-center gap-3">
              {form.cover_image_url ? (
                <div className="relative">
                  <img
                    src={form.cover_image_url}
                    alt="Projet"
                    className="w-20 h-14 rounded-xl object-cover border-2 border-gray-200"
                  />
                  <button
                    onClick={() => setForm({ ...form, cover_image_url: "" })}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <X size={10} />
                  </button>
                </div>
              ) : (
                <div className="w-20 h-14 rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                  <Image size={18} className="text-gray-300" />
                </div>
              )}
              <button
                type="button"
                onClick={() => setShowImagePicker(true)}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-medium rounded-lg transition-colors"
              >
                {form.cover_image_url
                  ? "Changer l'image"
                  : "Sélectionner une image"}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Nom du Projet *
            </label>
            <input
              type="text"
              value={form.nom}
              onChange={(e) => setForm({ ...form, nom: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Client
              </label>
              <select
                value={form.client_id}
                onChange={(e) =>
                  setForm({ ...form, client_id: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              >
                <option value="">Sélectionner...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.prenom} {c.nom}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Type de Projet
              </label>
              <input
                type="text"
                value={form.type_projet}
                onChange={(e) =>
                  setForm({ ...form, type_projet: e.target.value })
                }
                placeholder="Construction, Rénovation..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Localisation
              </label>
              <input
                type="text"
                value={form.localisation}
                onChange={(e) =>
                  setForm({ ...form, localisation: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Budget (FCFA)
              </label>
              <input
                type="number"
                value={form.budget}
                onChange={(e) => setForm({ ...form, budget: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Date Début
              </label>
              <input
                type="date"
                value={form.date_debut}
                onChange={(e) =>
                  setForm({ ...form, date_debut: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Date Fin
              </label>
              <input
                type="date"
                value={form.date_fin}
                onChange={(e) => setForm({ ...form, date_fin: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
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
                  statut: e.target.value as Project["statut"],
                })
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
            >
              {Object.entries(statutConfig).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
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
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 resize-none"
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
              disabled={saving || !form.nom.trim()}
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

      {showImagePicker && (
        <MediaPicker
          onSelect={(file) => {
            setForm((prev) => ({ ...prev, cover_image_url: file.url }));
            setShowImagePicker(false);
          }}
          onClose={() => setShowImagePicker(false)}
          defaultCategory="projets_btp"
          title="Sélectionner une photo de chantier"
        />
      )}
    </div>
  );
}
