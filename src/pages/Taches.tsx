import { useEffect, useState, useRef, useCallback } from "react";
import {
  Plus,
  Search,
  CreditCard as Edit,
  Trash2,
  CheckSquare,
  Clock,
  AlertCircle,
  Eye,
  User,
  ListChecks,
  Timer,
  Flag,
  AlertOctagon,
  BarChart3,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { Task, Employee, Project } from "../types";
import Modal from "../components/ui/Modal";
import Badge from "../components/ui/Badge";
import KPICard from "../components/dashboard/KPICard";
import { useSettings } from "../context/SettingsContext";
import { useAuth } from "../context/AuthContext";
import {
  getDemoBlockMessage,
  shouldBlockDestructiveAction,
} from "../lib/demoMode";

const prioriteConfig: Record<
  string,
  { label: string; color: "gray" | "blue" | "orange" | "red" }
> = {
  basse: { label: "Basse", color: "gray" },
  normale: { label: "Normale", color: "blue" },
  haute: { label: "Haute", color: "orange" },
  urgente: { label: "Urgente", color: "red" },
};

const statutConfig: Record<
  string,
  { label: string; color: "gray" | "blue" | "green" | "red" }
> = {
  a_faire: { label: "À Faire", color: "gray" },
  en_cours: { label: "En Cours", color: "blue" },
  termine: { label: "Terminé", color: "green" },
  annule: { label: "Annulé", color: "red" },
};

const emptyForm = {
  titre: "",
  description: "",
  assignee_id: "",
  priorite: "normale" as Task["priorite"],
  statut: "a_faire" as Task["statut"],
  date_echeance: "",
  project_id: "",
};

export default function Taches() {
  const { settings } = useSettings();
  const { user, profile } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<
    Array<Pick<Employee, "id" | "nom" | "prenom">>
  >([]);
  const [projects, setProjects] = useState<Array<Pick<Project, "id" | "nom">>>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState("");
  const [filterPriorite, setFilterPriorite] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [showAllTasks, setShowAllTasks] = useState(false);
  const [userEmployeeId, setUserEmployeeId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [pageNotice, setPageNotice] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const destructiveActionsDisabled = shouldBlockDestructiveAction(
    user,
    profile,
  );

  // Trouver l'employé connecté par email
  useEffect(() => {
    const findUserEmployee = async () => {
      if (!user?.email) return;
      const { data } = await supabase
        .from("employees")
        .select("id")
        .ilike("email", user.email)
        .maybeSingle();
      if (data) setUserEmployeeId(data.id);
    };
    findUserEmployee();
  }, [user]);

  // Shortcuts clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+N : Nouvelle tâche
      if (e.ctrlKey && e.key === "n") {
        e.preventDefault();
        openAdd();
      }
      // Ctrl+F : Rechercher
      if (e.ctrlKey && e.key === "f") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      // Échap : Fermer modal
      if (e.key === "Escape" && modalOpen) {
        setModalOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modalOpen]);

  const fetchData = useCallback(async () => {
    setLoading(true);

    // Construire la requête pour filtrer par employé si nécessaire
    let taskQuery = supabase
      .from("tasks")
      .select("*, employees(nom, prenom), projects(nom)");

    // Si l'utilisateur est un employé et n'a pas activé "voir tout", filtrer ses tâches
    const canViewAll =
      profile?.role === "admin" ||
      profile?.role === "gestionnaire" ||
      profile?.access_level === "admin" ||
      profile?.access_level === "gerant";
    const shouldFilter = userEmployeeId && !showAllTasks && !canViewAll;

    if (shouldFilter) {
      // Filtrer par assignee_id OU afficher les tâches non assignées
      taskQuery = taskQuery.or(
        `assignee_id.eq.${userEmployeeId},assignee_id.is.null`,
      );
    }

    const [taskRes, empRes, projRes] = await Promise.all([
      taskQuery.order("created_at", { ascending: false }),
      supabase
        .from("employees")
        .select("id, nom, prenom")
        .eq("statut", "actif")
        .order("nom"),
      supabase.from("projects").select("id, nom").order("nom"),
    ]);
    setTasks(taskRes.data || []);
    setEmployees(
      (empRes.data as Array<Pick<Employee, "id" | "nom" | "prenom">>) || [],
    );
    setProjects((projRes.data as Array<Pick<Project, "id" | "nom">>) || []);
    setLoading(false);
  }, [profile?.access_level, profile?.role, showAllTasks, userEmployeeId]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const openAdd = () => {
    setForm(emptyForm);
    setEditingId(null);
    setFormErrors({});
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (t: Task) => {
    setForm({
      titre: t.titre,
      description: t.description,
      assignee_id: t.assignee_id || "",
      priorite: t.priorite,
      statut: t.statut,
      date_echeance: t.date_echeance || "",
      project_id: t.project_id || "",
    });
    setEditingId(t.id);
    setFormErrors({});
    setFormError(null);
    setModalOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!form.titre.trim()) {
      errors.titre = "Le titre est obligatoire";
    } else if (form.titre.length < 5) {
      errors.titre = "Le titre doit contenir au moins 5 caractères";
    }

    if (form.date_echeance) {
      const echeance = new Date(form.date_echeance);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (echeance < today) {
        errors.date_echeance =
          "La date d'échéance ne peut pas être dans le passé";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    // Validation complète
    if (!validateForm()) {
      setFormError("Veuillez corriger les erreurs ci-dessous");
      return;
    }

    setFormError(null);
    setSaving(true);

    try {
      const payload = {
        titre: form.titre,
        description: form.description,
        assignee_id: form.assignee_id || null,
        priorite: form.priorite,
        statut: form.statut,
        date_echeance: form.date_echeance || null,
        project_id: form.project_id || null,
        updated_at: new Date().toISOString(),
      };

      if (editingId) {
        const { error } = await supabase
          .from("tasks")
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
        setPageNotice("✅ Tâche modifiée avec succès");
      } else {
        const { error } = await supabase.from("tasks").insert(payload);
        if (error) throw error;
        setPageNotice("✅ Tâche créée avec succès");
      }

      setSaving(false);
      setModalOpen(false);
      fetchData();

      // Clear notice after 3 seconds
      setTimeout(() => setPageNotice(null), 3000);
    } catch (error: any) {
      setSaving(false);
      setFormError(error.message || "Une erreur est survenue. Réessayez.");
    }
  };

  const handleDelete = async (id: string) => {
    if (destructiveActionsDisabled) {
      window.alert(getDemoBlockMessage());
      return;
    }
    if (!confirm("Supprimer cette tâche ?")) return;
    await supabase.from("tasks").delete().eq("id", id);
    fetchData();
  };

  const handleQuickStatus = async (id: string, statut: Task["statut"]) => {
    await supabase
      .from("tasks")
      .update({ statut, updated_at: new Date().toISOString() })
      .eq("id", id);
    fetchData();
  };

  const filtered = tasks.filter((t) => {
    const matchSearch = `${t.titre} ${t.description}`
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchStatut = !filterStatut || t.statut === filterStatut;
    const matchPriorite = !filterPriorite || t.priorite === filterPriorite;
    return matchSearch && matchStatut && matchPriorite;
  });

  const isOverdue = (t: Task) =>
    t.date_echeance &&
    new Date(t.date_echeance) < new Date() &&
    t.statut !== "termine";

  // Statistics dashboard calculations
  const totalTasks = tasks.length;
  const aFaireCount = tasks.filter((t) => t.statut === "a_faire").length;
  const enCoursCount = tasks.filter((t) => t.statut === "en_cours").length;
  const termineesCount = tasks.filter((t) => t.statut === "termine").length;
  const urgentesCount = tasks.filter(
    (t) => t.priorite === "urgente" && t.statut !== "termine",
  ).length;
  const enRetardCount = tasks.filter((t) => isOverdue(t)).length;

  // Priority breakdown percentages
  const prioriteBreakdown = Object.entries(prioriteConfig).map(
    ([key, config]) => {
      const count = tasks.filter((t) => t.priorite === key).length;
      const percentage =
        totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0;
      return {
        key,
        label: config.label,
        color: config.color,
        count,
        percentage,
      };
    },
  );

  // Calculer les tâches non terminées pour affichage
  const unfinishedCount = tasks.filter((t) => t.statut !== "termine").length;

  return (
    <div className="space-y-4">
      {/* Statistics Dashboard */}
      {!loading && tasks.length > 0 && (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <KPICard
              label="Total tâches"
              value={String(totalTasks)}
              icon={ListChecks}
              color="blue"
            />
            <KPICard
              label="À faire"
              value={String(aFaireCount)}
              icon={Flag}
              color="slate"
            />
            <KPICard
              label="En cours"
              value={String(enCoursCount)}
              icon={Timer}
              color="amber"
            />
            <KPICard
              label="Terminées"
              value={String(termineesCount)}
              icon={CheckSquare}
              color="emerald"
            />
            <KPICard
              label="Urgentes"
              value={String(urgentesCount)}
              icon={AlertOctagon}
              color={urgentesCount > 0 ? "red" : "slate"}
            />
            <KPICard
              label="En retard"
              value={String(enRetardCount)}
              icon={AlertCircle}
              color={enRetardCount > 0 ? "red" : "slate"}
            />
          </div>

          {/* Priority Breakdown */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 size={16} className="text-slate-500" />
              <h3 className="text-sm font-semibold text-slate-700">
                Répartition par priorité
              </h3>
            </div>
            <div className="space-y-2.5">
              {prioriteBreakdown.map(({ label, color, count, percentage }) => {
                const barColorMap: Record<string, string> = {
                  gray: "bg-gray-400",
                  blue: "bg-blue-500",
                  orange: "bg-orange-500",
                  red: "bg-red-500",
                };
                const textColorMap: Record<string, string> = {
                  gray: "text-gray-600",
                  blue: "text-blue-600",
                  orange: "text-orange-600",
                  red: "text-red-600",
                };
                return (
                  <div key={color} className="flex items-center gap-3">
                    <span
                      className={`text-xs font-medium w-16 text-right ${textColorMap[color]}`}
                    >
                      {label}
                    </span>
                    <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${barColorMap[color]}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-slate-600 w-12">
                      {count}
                    </span>
                    <span className="text-xs text-slate-400 w-10">
                      {percentage}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 flex-1 w-full">
          <div className="relative w-full sm:w-auto sm:min-w-[220px]">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 w-full sm:w-64"
            />
          </div>
          <select
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none bg-white w-full sm:w-auto"
          >
            <option value="">Tous statuts</option>
            {Object.entries(statutConfig).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
          <select
            value={filterPriorite}
            onChange={(e) => setFilterPriorite(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none bg-white w-full sm:w-auto"
          >
            <option value="">Toutes priorités</option>
            {Object.entries(prioriteConfig).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 w-full xl:w-auto">
          {/* Toggle pour voir toutes les tâches (admin/gestionnaire) */}
          {(profile?.role === "admin" ||
            profile?.role === "gestionnaire" ||
            profile?.access_level === "admin" ||
            profile?.access_level === "gerant") && (
            <button
              onClick={() => setShowAllTasks(!showAllTasks)}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-opacity ${
                showAllTasks
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              <Eye size={16} />
              {showAllTasks ? "Voir mes tâches" : "Voir toutes les tâches"}
            </button>
          )}
          {/* Badge pour les employés */}
          {userEmployeeId && !showAllTasks && (
            <div className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 text-blue-700 text-sm font-medium">
              <User size={16} />
              <span>Mes tâches ({unfinishedCount} à faire)</span>
            </div>
          )}
          <button
            onClick={openAdd}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
            style={{
              backgroundColor: settings.primary_color,
              color: "var(--color-on-primary)",
            }}
          >
            <Plus size={16} /> Nouvelle Tâche
          </button>
        </div>
      </div>

      {/* Alertes pour tâches non terminées */}
      {unfinishedCount > 0 && userEmployeeId && !showAllTasks && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle
            className="text-amber-600 flex-shrink-0 mt-0.5"
            size={20}
          />
          <div>
            <p className="text-sm font-medium text-amber-800">
              Vous avez {unfinishedCount} tâche{unfinishedCount > 1 ? "s" : ""}{" "}
              non terminée{unfinishedCount > 1 ? "s" : ""}
            </p>
            <p className="text-xs text-amber-600 mt-1">
              Concentrez-vous sur les tâches prioritaires et celles en retard
            </p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {loading ? (
          <div className="flex items-center justify-center h-48 bg-white rounded-2xl border border-gray-100">
            <div
              className="animate-spin rounded-full h-8 w-8 border-b-2"
              style={{ borderColor: settings.primary_color }}
            ></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 bg-white rounded-2xl border border-gray-100 text-gray-400">
            <CheckSquare size={40} className="mb-2 opacity-30" />
            <p className="text-sm">Aucune tâche</p>
          </div>
        ) : (
          filtered.map((t) => {
            const p = prioriteConfig[t.priorite];
            const s = statutConfig[t.statut];
            const overdue = isOverdue(t);
            const isUnfinished = t.statut !== "termine";

            // Style pour attirer l'attention sur les tâches non terminées
            const cardClasses = `bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition-all ${
              overdue
                ? "border-red-300 bg-red-50/30 ring-2 ring-red-200"
                : isUnfinished
                  ? "border-l-4 border-l-blue-400 border-y-gray-100 border-r-gray-100"
                  : "border-gray-100 opacity-75"
            }`;

            return (
              <div key={t.id} className={cardClasses}>
                <div className="flex items-start gap-3">
                  <button
                    onClick={() =>
                      handleQuickStatus(
                        t.id,
                        t.statut === "termine" ? "a_faire" : "termine",
                      )
                    }
                    className={`mt-0.5 w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors ${
                      t.statut === "termine"
                        ? "border-green-500 bg-green-500"
                        : "border-gray-300 hover:border-green-400 hover:bg-green-50"
                    }`}
                    title={
                      t.statut === "termine"
                        ? "Marquer comme à faire"
                        : "Marquer comme terminé"
                    }
                  >
                    {t.statut === "termine" && (
                      <span className="text-white text-xs">✓</span>
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div
                      className={`text-sm font-medium ${t.statut === "termine" ? "line-through text-gray-400" : "text-gray-800"}`}
                    >
                      {t.titre}
                      {overdue && (
                        <span className="ml-2 text-xs text-red-600 font-semibold">
                          ⚠ EN RETARD
                        </span>
                      )}
                      {isUnfinished && t.priorite === "urgente" && (
                        <span className="ml-2 text-xs text-red-600 font-semibold">
                          🔥 URGENT
                        </span>
                      )}
                    </div>
                    {t.description && (
                      <div className="text-xs text-gray-500 mt-0.5 truncate">
                        {t.description}
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <Badge label={p.label} color={p.color} />
                      <Badge label={s.label} color={s.color} />
                      {t.employees && (
                        <span className="text-xs text-gray-400">
                          {(t.employees as any).prenom}{" "}
                          {(t.employees as any).nom}
                        </span>
                      )}
                      {t.date_echeance && (
                        <span
                          className={`flex items-center gap-1 text-xs ${overdue ? "text-red-600 font-medium" : "text-gray-400"}`}
                        >
                          {overdue ? (
                            <AlertCircle size={12} />
                          ) : (
                            <Clock size={12} />
                          )}
                          {new Date(t.date_echeance).toLocaleDateString(
                            "fr-FR",
                            {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            },
                          )}
                          {overdue && (
                            <span className="font-semibold">(Dépassé)</span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => openEdit(t)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Notification de succès/erreur */}
      {pageNotice && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 flex items-center gap-2">
          <CheckSquare size={16} />
          {pageNotice}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setFormErrors({});
          setFormError(null);
          setModalOpen(false);
        }}
        title={editingId ? "Modifier la Tâche" : "Nouvelle Tâche"}
      >
        <div className="space-y-4">
          {/* Message d'erreur global */}
          {formError && (
            <div
              role="alert"
              className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2"
            >
              <AlertCircle size={16} />
              {formError}
            </div>
          )}

          <div>
            <label
              htmlFor="task-titre"
              className="block text-xs font-medium text-gray-600 mb-1"
            >
              Titre *
            </label>
            <input
              id="task-titre"
              type="text"
              value={form.titre}
              onChange={(e) => setForm({ ...form, titre: e.target.value })}
              placeholder="Ex: Préparer le rapport mensuel"
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-blue-400 ${
                formErrors.titre
                  ? "border-red-300 focus:ring-red-100"
                  : "border-gray-200 focus:ring-blue-100"
              }`}
              aria-required="true"
              aria-invalid={!!formErrors.titre}
              aria-describedby={
                formErrors.titre ? "task-titre-error" : undefined
              }
            />
            {formErrors.titre && (
              <p
                id="task-titre-error"
                className="mt-1 text-xs text-red-600"
                role="alert"
              >
                {formErrors.titre}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="task-description"
              className="block text-xs font-medium text-gray-600 mb-1"
            >
              Description
            </label>
            <textarea
              id="task-description"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={3}
              placeholder="Décrivez la tâche en détail..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="task-assignee"
                className="block text-xs font-medium text-gray-600 mb-1"
              >
                Assigné à
              </label>
              <select
                id="task-assignee"
                value={form.assignee_id}
                onChange={(e) =>
                  setForm({ ...form, assignee_id: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              >
                <option value="">Non assigné</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.prenom} {e.nom}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="task-project"
                className="block text-xs font-medium text-gray-600 mb-1"
              >
                Projet
              </label>
              <select
                id="task-project"
                value={form.project_id}
                onChange={(e) =>
                  setForm({ ...form, project_id: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              >
                <option value="">Sélectionner un projet...</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nom}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label
                htmlFor="task-priorite"
                className="block text-xs font-medium text-gray-600 mb-1"
              >
                Priorité
              </label>
              <select
                id="task-priorite"
                value={form.priorite}
                onChange={(e) =>
                  setForm({
                    ...form,
                    priorite: e.target.value as Task["priorite"],
                  })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              >
                {Object.entries(prioriteConfig).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="task-statut"
                className="block text-xs font-medium text-gray-600 mb-1"
              >
                Statut
              </label>
              <select
                id="task-statut"
                value={form.statut}
                onChange={(e) =>
                  setForm({ ...form, statut: e.target.value as Task["statut"] })
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
              <label
                htmlFor="task-echeance"
                className="block text-xs font-medium text-gray-600 mb-1"
              >
                Échéance
              </label>
              <input
                id="task-echeance"
                type="date"
                value={form.date_echeance}
                onChange={(e) =>
                  setForm({ ...form, date_echeance: e.target.value })
                }
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-blue-400 ${
                  formErrors.date_echeance
                    ? "border-red-300 focus:ring-red-100"
                    : "border-gray-200 focus:ring-blue-100"
                }`}
                aria-invalid={!!formErrors.date_echeance}
                aria-describedby={
                  formErrors.date_echeance ? "task-echeance-error" : undefined
                }
              />
              {formErrors.date_echeance && (
                <p
                  id="task-echeance-error"
                  className="mt-1 text-xs text-red-600"
                  role="alert"
                >
                  {formErrors.date_echeance}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => {
                setFormErrors({});
                setFormError(null);
                setModalOpen(false);
              }}
              type="button"
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form.titre.trim()}
              type="button"
              className="flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2"
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
