import { useEffect, useState, useMemo } from "react";
import {
  Plus,
  Search,
  CreditCard as Edit,
  Trash2,
  UserCog,
  Image,
  X,
  Users,
  UserCheck,
  CalendarOff,
  Banknote,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { Employee } from "../types";
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
  { label: string; color: "green" | "gray" | "orange" }
> = {
  actif: { label: "Actif", color: "green" },
  inactif: { label: "Inactif", color: "gray" },
  conge: { label: "Congé", color: "orange" },
};

const emptyForm = {
  nom: "",
  prenom: "",
  poste: "",
  department: "",
  telephone: "",
  email: "",
  salaire: "",
  date_embauche: new Date().toISOString().split("T")[0],
  statut: "actif" as Employee["statut"],
  notes: "",
  photo_url: "",
};

export default function Employes() {
  const { settings } = useSettings();
  const { user, profile } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const destructiveActionsDisabled = shouldBlockDestructiveAction(
    user,
    profile,
  );

  useEffect(() => {
    fetchEmployees();
  }, []);

  const stats = useMemo(() => {
    const total = employees.length;
    const actifs = employees.filter((e) => e.statut === "actif").length;
    const conge = employees.filter((e) => e.statut === "conge").length;
    const masseSalariale = employees.reduce(
      (sum, e) => sum + (e.salaire || 0),
      0,
    );
    return { total, actifs, conge, masseSalariale };
  }, [employees]);

  const fetchEmployees = async () => {
    setLoading(true);
    const { data } = await supabase.from("employees").select("*").order("nom");
    setEmployees((data as Employee[]) || []);
    setLoading(false);
  };

  const openAdd = () => {
    setForm(emptyForm);
    setEditingId(null);
    setFormError(null);
    setModalOpen(true);
  };
  const openEdit = (e: Employee) => {
    setForm({
      nom: e.nom,
      prenom: e.prenom,
      poste: e.poste,
      department: e.department || "",
      telephone: e.telephone,
      email: e.email,
      salaire: String(e.salaire),
      date_embauche: e.date_embauche,
      statut: e.statut,
      notes: e.notes,
      photo_url: e.photo_url || "",
    });
    setEditingId(e.id);
    setFormError(null);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.nom.trim() || !form.poste.trim()) {
      setFormError("Le nom et le poste sont obligatoires.");
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        nom: form.nom,
        prenom: form.prenom,
        poste: form.poste,
        department: form.department || null,
        telephone: form.telephone,
        email: form.email,
        salaire: parseFloat(form.salaire) || 0,
        date_embauche: form.date_embauche,
        statut: form.statut,
        notes: form.notes,
        photo_url: form.photo_url || null,
        updated_at: new Date().toISOString(),
      };
      if (editingId) {
        const { error } = await supabase
          .from("employees")
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("employees").insert(payload);
        if (error) throw error;
      }
      setModalOpen(false);
      fetchEmployees();
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Impossible d’enregistrer cet employé.",
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
    if (!confirm("Supprimer cet employé ?")) return;
    await supabase.from("employees").delete().eq("id", id);
    fetchEmployees();
  };

  const filtered = employees.filter((e) => {
    const matchSearch = `${e.nom} ${e.prenom} ${e.poste} ${e.department || ""}`
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || e.statut === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-4">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Users size={20} className="text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">
                {stats.total}
              </div>
              <div className="text-xs text-gray-500">Total employés</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <UserCheck size={20} className="text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-green-700">
                {stats.actifs}
              </div>
              <div className="text-xs text-gray-500">Actifs</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
              <CalendarOff size={20} className="text-orange-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-700">
                {stats.conge}
              </div>
              <div className="text-xs text-gray-500">En congé</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <Banknote size={20} className="text-purple-600" />
            </div>
            <div>
              <div className="text-lg font-bold text-purple-700">
                {stats.masseSalariale.toLocaleString("fr-FR")}
              </div>
              <div className="text-xs text-gray-500">
                Masse salariale (FCFA)
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Rechercher un employé..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 bg-white"
          >
            <option value="all">Tous les statuts</option>
            {Object.entries(statutConfig).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
          <button
            onClick={openAdd}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium hover:opacity-90 transition-opacity"
            style={{
              backgroundColor: settings.primary_color,
              color: "var(--color-on-primary)",
            }}
          >
            <Plus size={16} /> Nouvel Employé
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
            <UserCog size={40} className="mb-2 opacity-30" />
            <p className="text-sm">Aucun employé</p>
          </div>
        ) : (
          <>
            <div className="md:hidden p-3 space-y-3">
              {filtered.map((e) => {
                const st = statutConfig[e.statut];
                return (
                  <MobileCard
                    key={e.id}
                    title={`${e.prenom} ${e.nom}`.trim() || e.nom}
                    subtitle={e.poste || "Employé"}
                    icon={
                      e.photo_url ? (
                        <img
                          src={e.photo_url}
                          alt={`${e.prenom} ${e.nom}`}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold"
                          style={{ backgroundColor: settings.secondary_color }}
                        >
                          {e.prenom[0]?.toUpperCase() ||
                            e.nom[0]?.toUpperCase() ||
                            "?"}
                        </div>
                      )
                    }
                    fields={[
                      { label: "Département", value: e.department || "—" },
                      { label: "Email", value: e.email || "—" },
                      { label: "Téléphone", value: e.telephone || "—" },
                      {
                        label: "Date embauche",
                        value: e.date_embauche
                          ? new Date(e.date_embauche).toLocaleDateString(
                              "fr-FR",
                            )
                          : "—",
                      },
                      {
                        label: "Salaire",
                        value: e.salaire
                          ? `${e.salaire.toLocaleString("fr-FR")} FCFA`
                          : "—",
                      },
                      {
                        label: "Statut",
                        value: <Badge label={st.label} color={st.color} />,
                      },
                    ]}
                    actions={
                      <>
                        <button
                          onClick={() => openEdit(e)}
                          className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(e.id)}
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
                      Employé
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                      Poste
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">
                      Département
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">
                      Téléphone
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">
                      Date embauche
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">
                      Salaire
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                      Statut
                    </th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((e) => {
                    const st = statutConfig[e.statut];
                    return (
                      <tr
                        key={e.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {e.photo_url ? (
                              <img
                                src={e.photo_url}
                                alt={`${e.prenom} ${e.nom}`}
                                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                              />
                            ) : (
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                                style={{
                                  backgroundColor: settings.secondary_color,
                                }}
                              >
                                {e.prenom[0]?.toUpperCase() ||
                                  e.nom[0]?.toUpperCase() ||
                                  "?"}
                              </div>
                            )}
                            <div>
                              <div className="text-sm font-medium text-gray-800">
                                {e.prenom} {e.nom}
                              </div>
                              <div className="text-xs text-gray-400">
                                {e.email || ""}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {e.poste}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 hidden lg:table-cell">
                          {e.department || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 hidden sm:table-cell">
                          {e.telephone || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 hidden md:table-cell">
                          {e.date_embauche
                            ? new Date(e.date_embauche).toLocaleDateString(
                                "fr-FR",
                              )
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">
                          {e.salaire
                            ? `${e.salaire.toLocaleString("fr-FR")} FCFA`
                            : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <Badge label={st.label} color={st.color} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 justify-end">
                            <button
                              onClick={() => openEdit(e)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            >
                              <Edit size={15} />
                            </button>
                            <button
                              onClick={() => handleDelete(e.id)}
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
        title={editingId ? "Modifier l'Employé" : "Nouvel Employé"}
      >
        <div className="space-y-4">
          {formError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {formError}
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Photo de profil
            </label>
            <div className="flex items-center gap-3">
              {form.photo_url ? (
                <div className="relative">
                  <img
                    src={form.photo_url}
                    alt="Photo"
                    className="w-16 h-16 rounded-xl object-cover border-2 border-gray-200"
                  />
                  <button
                    onClick={() => setForm({ ...form, photo_url: "" })}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <X size={10} />
                  </button>
                </div>
              ) : (
                <div className="w-16 h-16 rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                  <Image size={20} className="text-gray-300" />
                </div>
              )}
              <button
                type="button"
                onClick={() => setShowPhotoPicker(true)}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-medium rounded-lg transition-colors"
              >
                {form.photo_url ? "Changer la photo" : "Sélectionner une photo"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Prénom
              </label>
              <input
                type="text"
                value={form.prenom}
                onChange={(e) => setForm({ ...form, prenom: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
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
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Poste *
            </label>
            <input
              type="text"
              value={form.poste}
              onChange={(e) => setForm({ ...form, poste: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Département
            </label>
            <input
              type="text"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              placeholder="Ex: BTP, Immobilier, RH..."
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
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
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Salaire (FCFA)
              </label>
              <input
                type="number"
                value={form.salaire}
                onChange={(e) => setForm({ ...form, salaire: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Date d'embauche
              </label>
              <input
                type="date"
                value={form.date_embauche}
                onChange={(e) =>
                  setForm({ ...form, date_embauche: e.target.value })
                }
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
                  statut: e.target.value as Employee["statut"],
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
              disabled={saving || !form.nom.trim() || !form.poste.trim()}
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

      {showPhotoPicker && (
        <MediaPicker
          onSelect={(file) => {
            setForm((prev) => ({ ...prev, photo_url: file.url }));
            setShowPhotoPicker(false);
          }}
          onClose={() => setShowPhotoPicker(false)}
          defaultCategory="equipe"
          title="Sélectionner une photo de profil"
        />
      )}
    </div>
  );
}
