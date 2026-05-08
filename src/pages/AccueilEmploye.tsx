import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { supabase } from "../lib/supabase";
import {
  MessageDirection,
  EmployePresence,
  Visite,
  StatsJournalieres,
  ActiviteJournal,
  MessageDirectionType,
  MessageDirectionStatut,
} from "../types";
import {
  Users,
  FileText,
  Bell,
  Calendar,
  Clock,
  TrendingUp,
  Building2,
  UserCheck,
  Menu,
  X,
  Plus,
  Edit2,
  Trash2,
  Send,
  Settings,
  Eye,
  EyeOff,
  LayoutDashboard,
  ChevronLeft,
} from "lucide-react";
import BrandLogo from "../components/BrandLogo";

const getPriorityRank = (value?: string | null) => {
  switch (value) {
    case "URGENTE":
      return 4;
    case "HAUTE":
      return 3;
    case "NORMALE":
      return 2;
    case "BASSE":
      return 1;
    default:
      return 0;
  }
};

const sortMessages = (items: MessageDirection[]) => {
  return [...items].sort((a, b) => {
    const priorityDiff =
      getPriorityRank(b.priorite) - getPriorityRank(a.priorite);
    if (priorityDiff !== 0) return priorityDiff;
    const dateA = new Date(a.date_publication || a.created_at).getTime();
    const dateB = new Date(b.date_publication || b.created_at).getTime();
    if (dateB !== dateA) return dateB - dateA;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
};

export default function AccueilEmploye() {
  const { user, profile, signOut } = useAuth();
  const { settings } = useSettings();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [messageDirection, setMessageDirection] =
    useState<MessageDirection | null>(null);
  const [employesEnLigne, setEmployesEnLigne] = useState<EmployePresence[]>([]);
  const [visitesEnCours, setVisitesEnCours] = useState<Visite[]>([]);
  const [activitesRecentes, setActivitesRecentes] = useState<ActiviteJournal[]>(
    [],
  );
  const [stats, setStats] = useState<StatsJournalieres | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Admin messages
  const [showAdminMessages, setShowAdminMessages] = useState(false);
  const [messages, setMessages] = useState<MessageDirection[]>([]);
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [editingMessage, setEditingMessage] = useState<MessageDirection | null>(
    null,
  );
  const [targetEmployees, setTargetEmployees] = useState<
    { id: string; full_name: string; department: string }[]
  >([]);
  const [targetServices, setTargetServices] = useState<string[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [ciblesTous, setCiblesTous] = useState(true);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [messageFormSaving, setMessageFormSaving] = useState(false);
  const [messageFormError, setMessageFormError] = useState<string | null>(null);

  // Raccourci clavier (Alt + ← pour retour)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === "ArrowLeft") {
        e.preventDefault();
        window.dispatchEvent(
          new CustomEvent("egs:navigate", { detail: "dashboard" }),
        );
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Horloge temps réel
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDateFr = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return date.toLocaleDateString("fr-FR", options);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  useEffect(() => {
    if (!showMessageForm) return;
    const fetchTargets = async () => {
      const { data } = await supabase
        .from("user_profiles")
        .select("id, full_name, department")
        .order("full_name");
      if (data) {
        setTargetEmployees(
          data as { id: string; full_name: string; department: string }[],
        );
        const services = Array.from(
          new Set(
            data
              .map((item) => (item.department || "").trim())
              .filter((item) => item.length > 0),
          ),
        ).sort((a, b) => a.localeCompare(b, "fr"));
        setTargetServices(services);
      }
    };
    fetchTargets();
  }, [showMessageForm]);

  useEffect(() => {
    if (!showMessageForm) return;
    if (editingMessage) {
      setCiblesTous(editingMessage.cibles_tous_employes ?? true);
      setSelectedServices(editingMessage.cibles_services || []);
      setSelectedEmployees(editingMessage.cibles_employes || []);
    } else {
      setCiblesTous(true);
      setSelectedServices([]);
      setSelectedEmployees([]);
    }
    setEmployeeSearch("");
  }, [showMessageForm, editingMessage]);

  const isMessageForUser = useCallback(
    (msg: MessageDirection) => {
      if (msg.cibles_tous_employes) return true;
      const userId = profile?.id;
      const department = profile?.department;
      const targetEmployees = Array.isArray(msg.cibles_employes)
        ? msg.cibles_employes
        : [];
      const targetServices = Array.isArray(msg.cibles_services)
        ? msg.cibles_services
        : [];
      if (userId && targetEmployees.includes(userId)) return true;
      if (department && targetServices.includes(department)) return true;
      return false;
    },
    [profile],
  );

  const fetchData = useCallback(async () => {
    const issues: string[] = [];
    const trackIssue = (label: string, error: unknown) => {
      if (import.meta.env.DEV)
        console.error(`Erreur chargement ${label}:`, error);
      issues.push(label);
    };

    try {
      const nowIso = new Date().toISOString();
      setDataError(null);

      const { data: messages, error: messagesError } = await supabase
        .from("messages_direction")
        .select("*")
        .eq("statut", "PUBLIE")
        .lte("date_publication", nowIso)
        .order("date_publication", { ascending: false })
        .limit(50);

      if (messagesError) {
        trackIssue("messages de direction", messagesError);
        setMessageDirection(null);
      } else if (messages && messages.length > 0) {
        const validMessages = messages.filter((msg) => {
          if (msg.date_expiration) {
            return new Date(msg.date_expiration).getTime() >= Date.now();
          }
          return true;
        });
        const targetedMessages = validMessages.filter(isMessageForUser);
        const sortedMessages = sortMessages(targetedMessages);
        setMessageDirection(sortedMessages[0] || null);
      } else {
        setMessageDirection(null);
      }

      const { data: presence, error: presenceError } = await supabase
        .from("employes_presence")
        .select("*")
        .eq("statut", "EN_LIGNE")
        .order("last_activity", { ascending: false })
        .limit(8);

      if (presenceError) {
        trackIssue("presence employes", presenceError);
        setEmployesEnLigne([]);
      } else if (presence) {
        setEmployesEnLigne(presence);
      }

      const { data: visites, error: visitesError } = await supabase
        .from("visites_en_cours")
        .select("*")
        .limit(5);

      if (visitesError) {
        trackIssue("visites en cours", visitesError);
        setVisitesEnCours([]);
      } else if (visites) {
        setVisitesEnCours(visites);
      }

      const { data: activites, error: activitesError } = await supabase
        .from("activites_journal")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      if (activitesError) {
        trackIssue("activites recentes", activitesError);
        setActivitesRecentes([]);
      } else if (activites) {
        setActivitesRecentes(activites);
      }

      const { data: statsData, error: statsError } = await supabase
        .from("stats_journalieres")
        .select("*")
        .single();

      if (statsError) {
        trackIssue("statistiques journalieres", statsError);
        setStats(null);
      } else if (statsData) {
        setStats(statsData);
      }

      if (issues.length > 0) {
        setDataError(`Chargement partiel: ${issues.join(", ")}.`);
      }
    } catch (error) {
      if (import.meta.env.DEV)
        console.error("Erreur chargement données accueil:", error);
      setDataError("Impossible de charger les donnees de l’espace employe.");
    } finally {
      setLoading(false);
    }
  }, [isMessageForUser]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Navigation via CustomEvent (système existant)
  const handleNavigate = (page: string) => {
    window.dispatchEvent(new CustomEvent("egs:navigate", { detail: page }));
  };

  // Navigation vers le dashboard (pour admin/gestionnaire)
  const goToDashboard = () => {
    window.dispatchEvent(
      new CustomEvent("egs:navigate", { detail: "dashboard" }),
    );
  };

  const quickActions = [
    {
      label: "Registre Visiteur",
      icon: "📝",
      action: () =>
        window.dispatchEvent(
          new CustomEvent("egs:navigate", { detail: "registre" }),
        ),
      tone: "primary",
    },
    {
      label: "Nouvelle Parcelle",
      icon: "🏠",
      action: () => handleNavigate("foncier"),
      tone: "secondary",
    },
    {
      label: "Générer Attestation",
      icon: "📄",
      action: () => handleNavigate("foncier"),
      tone: "primary",
    },
    {
      label: "Immobilier",
      icon: "🏢",
      action: () => handleNavigate("immobilier"),
      tone: "secondary",
    },
    {
      label: "Finances",
      icon: "💰",
      action: () => handleNavigate("finances"),
      tone: "primary",
    },
    {
      label: "Documents",
      icon: "📁",
      action: () => handleNavigate("documents"),
      tone: "secondary",
    },
  ];

  const getMessageTypeConfig = (type: MessageDirectionType) => {
    switch (type) {
      case "FELICITATION":
        return {
          bg: "from-green-500/10 to-emerald-500/10",
          border: "border-green-500/30",
          icon: "🎉",
        };
      case "ALERTE":
        return {
          bg: "from-red-500/10 to-orange-500/10",
          border: "border-red-500/30",
          icon: "⚠️",
        };
      case "MOTIVATION":
        return {
          bg: "from-blue-500/10 to-purple-500/10",
          border: "border-blue-500/30",
          icon: "💪",
        };
      default:
        return {
          bg: "from-gray-500/10 to-slate-500/10",
          border: "border-gray-500/30",
          icon: "📢",
        };
    }
  };

  // Admin: Fetch messages
  const fetchMessages = useCallback(async () => {
    const { data } = await supabase
      .from("messages_direction")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setMessages(sortMessages(data));
  }, []);

  const toggleService = (service: string) => {
    setSelectedServices((prev) =>
      prev.includes(service)
        ? prev.filter((s) => s !== service)
        : [...prev, service],
    );
  };

  const toggleEmployee = (employeeId: string) => {
    setSelectedEmployees((prev) =>
      prev.includes(employeeId)
        ? prev.filter((id) => id !== employeeId)
        : [...prev, employeeId],
    );
  };

  // Admin: Save message
  const handleSaveMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const titre = String(formData.get("titre") || "").trim();
    const contenu = String(formData.get("contenu") || "").trim();

    const ciblesTousEmployes = ciblesTous;
    if (
      !ciblesTousEmployes &&
      selectedEmployees.length === 0 &&
      selectedServices.length === 0
    ) {
      setMessageFormError("Sélectionnez au moins un service ou un employé.");
      return;
    }
    if (!titre || !contenu) {
      setMessageFormError("Le titre et le contenu sont obligatoires.");
      return;
    }

    setMessageFormSaving(true);
    setMessageFormError(null);

    const messageData = {
      titre,
      contenu,
      type: formData.get("type") as MessageDirectionType,
      priorite: formData.get("priorite") as "BASSE" | "NORMALE" | "HAUTE",
      cibles_tous_employes: ciblesTousEmployes,
      cibles_services: ciblesTousEmployes ? [] : selectedServices,
      cibles_employes: ciblesTousEmployes ? [] : selectedEmployees,
      date_expiration: (formData.get("date_expiration") as string) || null,
      statut: "PUBLIE" as MessageDirectionStatut,
      date_publication: new Date().toISOString(),
    };

    try {
      if (editingMessage) {
        const { error } = await supabase
          .from("messages_direction")
          .update(messageData)
          .eq("id", editingMessage.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("messages_direction")
          .insert(messageData);
        if (error) throw error;
      }

      setShowMessageForm(false);
      setEditingMessage(null);
      setMessageFormError(null);
      await fetchMessages();
    } catch (error: any) {
      setMessageFormError(
        error.message || "Impossible d’enregistrer ce message pour le moment.",
      );
    } finally {
      setMessageFormSaving(false);
    }
  };

  // Admin: Delete message
  const handleDeleteMessage = async (id: string) => {
    if (!confirm("Supprimer ce message ?")) return;
    await supabase.from("messages_direction").delete().eq("id", id);
    fetchMessages();
  };

  // Admin: Toggle message status
  const handleToggleMessage = async (message: MessageDirection) => {
    await supabase
      .from("messages_direction")
      .update({ statut: message.statut === "PUBLIE" ? "BROUILLON" : "PUBLIE" })
      .eq("id", message.id);
    fetchMessages();
  };

  // Check if user is admin or gestionnaire
  const isAdmin = profile?.role === "admin" || profile?.role === "gestionnaire";
  const targetsDisabled = ciblesTous;
  const filteredEmployees = targetEmployees.filter((emp) => {
    const term = employeeSearch.trim().toLowerCase();
    if (!term) return true;
    const name = (emp.full_name || "").toLowerCase();
    const dept = (emp.department || "").toLowerCase();
    return name.includes(term) || dept.includes(term);
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de votre espace...</p>
        </div>
      </div>
    );
  }

  const messageConfig = messageDirection
    ? getMessageTypeConfig(messageDirection.type)
    : null;
  const logoInitials = (settings.app_company || settings.app_title || "EG")
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <button
                onClick={goToDashboard}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                title="Retour au tableau de bord (Alt + ←)"
              >
                <ChevronLeft size={18} />
                <span className="hidden sm:inline text-sm">
                  Tableau de bord
                </span>
              </button>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center overflow-hidden flex-shrink-0">
                <BrandLogo
                  tone="dark"
                  alt={settings.app_company || "Logo"}
                  className="w-full h-full object-cover"
                  fallback={
                    <span className="text-white font-bold">{logoInitials}</span>
                  }
                />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">
                  {settings.app_company || "Gnamba Services"}
                </h1>
                <p className="text-xs text-gray-500">Espace Employé</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {isAdmin && (
                <button
                  onClick={() => {
                    setShowAdminMessages(!showAdminMessages);
                    if (!showAdminMessages) fetchMessages();
                  }}
                  className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors text-sm font-medium"
                >
                  <Settings size={16} />
                  Messages
                </button>
              )}
              {isAdmin && (
                <button
                  onClick={goToDashboard}
                  className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors text-sm font-medium"
                >
                  <LayoutDashboard size={16} />
                  Tableau de bord
                </button>
              )}
              <div className="hidden md:flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    {profile?.full_name || user?.email}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {profile?.poste || profile?.department || "Employé"}
                  </p>
                </div>
                <button
                  onClick={signOut}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Déconnexion
                </button>
              </div>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {dataError && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {dataError}
          </div>
        </div>
      )}

      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 px-4 py-4 space-y-3">
          {quickActions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => {
                action.action();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <span className="text-2xl">{action.icon}</span>
              <span className="font-medium text-gray-700">{action.label}</span>
            </button>
          ))}
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
          >
            <span className="text-xl">🚪</span>
            <span className="font-medium">Déconnexion</span>
          </button>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <section className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Horloge */}
          <div className="md:col-span-1 bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-10 left-10 w-32 h-32 border-4 border-white rounded-full"></div>
              <div className="absolute bottom-10 right-10 w-24 h-24 border-4 border-white rounded-full"></div>
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <Clock size={20} className="opacity-80" />
                <span className="text-sm font-medium opacity-80">
                  Heure locale
                </span>
              </div>
              <div className="text-center py-6">
                <div className="text-3xl sm:text-4xl font-bold tracking-tight mb-2 font-mono">
                  {formatTime(currentTime)}
                </div>
                <div className="text-sm sm:text-sm opacity-90 capitalize">
                  {formatDateFr(currentTime)}
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 text-xs opacity-75">
                <Building2 size={14} />
                <span>Siège - Agnéby-Tiassa</span>
              </div>
            </div>
          </div>

          {/* Message de la Direction */}
          <div className="md:col-span-2 bg-white rounded-3xl p-6 shadow-lg border border-gray-100 relative overflow-hidden">
            {messageDirection ? (
              <>
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${messageConfig?.bg}`}
                ></div>
                <div
                  className={`relative z-10 h-full border-2 ${messageConfig?.border} rounded-2xl p-6`}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <span className="text-4xl">{messageConfig?.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h2 className="text-lg font-semibold text-gray-900">
                          {messageDirection.titre}
                        </h2>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            messageDirection.priorite === "HAUTE"
                              ? "bg-red-100 text-red-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {messageDirection.priorite}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        Publié le{" "}
                        {new Date(
                          messageDirection.date_publication,
                        ).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </div>
                  <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
                    {messageDirection.contenu}
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      La Direction Générale
                    </span>
                    <span className="text-xs text-gray-400">
                      {messageDirection.type}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <FileText size={48} className="mx-auto mb-3 opacity-30" />
                  <p>Aucun message de la direction</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Widgets Collaboratifs */}
        <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Équipe en ligne */}
          <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                <Users size={18} className="text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Équipe en ligne</h3>
            </div>
            <div className="flex -space-x-2 mb-3">
              {employesEnLigne.slice(0, 5).map((emp, idx) => (
                <div
                  key={idx}
                  className="w-10 h-10 rounded-full border-2 border-white bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white text-xs font-bold"
                  title={emp.full_name || "Utilisateur"}
                >
                  {(emp.full_name || "U").charAt(0)}
                </div>
              ))}
              {employesEnLigne.length > 5 && (
                <div className="w-10 h-10 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-gray-600 text-xs font-medium">
                  +{employesEnLigne.length - 5}
                </div>
              )}
            </div>
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-green-600">
                {employesEnLigne.length}
              </span>{" "}
              collègues connectés
            </p>
          </div>

          {/* Visites en cours */}
          <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <UserCheck size={18} className="text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Visites en cours</h3>
            </div>
            {visitesEnCours.length > 0 ? (
              <div className="space-y-2">
                {visitesEnCours.slice(0, 3).map((visite, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-gray-700 truncate flex-1">
                      {visite.visiteurs?.nom_complet}
                    </span>
                  </div>
                ))}
                {visitesEnCours.length > 3 && (
                  <p className="text-xs text-gray-500">
                    +{visitesEnCours.length - 3} autres
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Aucune visite en cours</p>
            )}
          </div>

          {/* Statistiques du jour */}
          <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <TrendingUp size={18} className="text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Aujourd'hui</h3>
            </div>
            {stats ? (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Visiteurs</span>
                  <span className="font-semibold text-gray-900">
                    {stats.total_visiteurs}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Badges</span>
                  <span className="font-semibold text-gray-900">
                    {stats.badges_imprimes}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Activités</span>
                  <span className="font-semibold text-gray-900">
                    {stats.activites_du_jour}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Données indisponibles</p>
            )}
          </div>

          {/* Alertes & Rappels */}
          <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                <Bell size={18} className="text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Rappels</h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-start gap-2 text-sm">
                <Calendar
                  size={16}
                  className="text-gray-400 mt-0.5 flex-shrink-0"
                />
                <span className="text-gray-700">
                  Point hebdomadaire - Vendredi 15h
                </span>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <Clock
                  size={16}
                  className="text-gray-400 mt-0.5 flex-shrink-0"
                />
                <span className="text-gray-700">
                  Clôture mensuelle - 25 du mois
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Accès Rapides */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 tracking-tight">
            Accès Rapides
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action, idx) => (
              <button
                key={idx}
                onClick={action.action}
                className={`group relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br ${
                  action.tone === "primary"
                    ? "from-[var(--color-primary-600)] to-[var(--color-primary-700)]"
                    : "from-[var(--color-primary-700)] to-[var(--color-primary-800)]"
                } text-[color:var(--color-on-primary)] shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]`}
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative z-10 flex items-center gap-4">
                  <span className="text-3xl">{action.icon}</span>
                  <span className="text-base font-semibold">
                    {action.label}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Activités Récentes */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 tracking-tight">
            Activités Récentes
          </h2>
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
            {activitesRecentes.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {activitesRecentes.map((activite, idx) => (
                  <div
                    key={idx}
                    className="p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl flex-shrink-0">
                        {activite.icone}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900">
                            {activite.titre}
                          </h4>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              activite.priorite === "URGENTE"
                                ? "bg-red-100 text-red-700"
                                : activite.priorite === "HAUTE"
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {activite.priorite}
                          </span>
                        </div>
                        {activite.description && (
                          <p className="text-sm text-gray-600 truncate">
                            {activite.description}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(activite.created_at).toLocaleString(
                            "fr-FR",
                          )}
                          {activite.auteur_nom && ` • ${activite.auteur_nom}`}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-400">
                <FileText size={40} className="mx-auto mb-3 opacity-30" />
                <p>Aucune activité récente</p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Footer Stats */}
      <footer className="bg-white border-t border-gray-200 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {stats?.total_visiteurs || 0}
              </div>
              <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">
                Visiteurs aujourd'hui
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {stats?.employes_presents || 0}
              </div>
              <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">
                Employés présents
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {stats?.activites_du_jour || 0}
              </div>
              <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">
                Activités du jour
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Modal Admin Messages */}
      {showAdminMessages && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Gestion des Messages
                </h2>
                <p className="text-sm text-gray-500">
                  Publiez des messages pour les employés
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingMessage(null);
                    setMessageFormError(null);
                    setShowMessageForm(true);
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 flex items-center gap-2"
                >
                  <Plus size={16} />
                  Nouveau
                </button>
                <button
                  onClick={() => setShowAdminMessages(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6">
              {messages.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <FileText size={48} className="mx-auto mb-4 opacity-30" />
                  <p>Aucun message</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((msg) => {
                    const config = getMessageTypeConfig(msg.type);
                    return (
                      <div
                        key={msg.id}
                        className={`p-4 rounded-xl border-2 ${config.border} ${config.bg}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xl">{config.icon}</span>
                              <h3 className="font-bold text-gray-900">
                                {msg.titre}
                              </h3>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  msg.priorite === "HAUTE"
                                    ? "bg-red-100 text-red-700"
                                    : msg.priorite === "NORMALE"
                                      ? "bg-blue-100 text-blue-700"
                                      : "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {msg.priorite}
                              </span>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  msg.statut === "PUBLIE"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {msg.statut}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 mb-2">
                              {msg.contenu.substring(0, 150)}
                              {msg.contenu.length > 150 ? "..." : ""}
                            </p>
                            <div className="flex gap-4 text-xs text-gray-500">
                              <span>
                                📅{" "}
                                {new Date(
                                  msg.date_publication,
                                ).toLocaleDateString("fr-FR")}
                              </span>
                              <span>
                                👥{" "}
                                {msg.cibles_tous_employes
                                  ? "Tous les employés"
                                  : "Ciblé"}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-1 ml-4">
                            <button
                              onClick={() => handleToggleMessage(msg)}
                              className="p-2 hover:bg-white/50 rounded-lg"
                              title={
                                msg.statut === "PUBLIE"
                                  ? "Dépublier"
                                  : "Publier"
                              }
                            >
                              {msg.statut === "PUBLIE" ? (
                                <EyeOff size={16} />
                              ) : (
                                <Eye size={16} />
                              )}
                            </button>
                            <button
                              onClick={() => {
                                setEditingMessage(msg);
                                setMessageFormError(null);
                                setShowMessageForm(true);
                              }}
                              className="p-2 hover:bg-white/50 rounded-lg text-blue-600"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteMessage(msg.id)}
                              className="p-2 hover:bg-white/50 rounded-lg text-red-600"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Formulaire Message */}
      {showMessageForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl">
            <form onSubmit={handleSaveMessage}>
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingMessage ? "Modifier le message" : "Nouveau message"}
                </h2>
              </div>

              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {messageFormError && (
                  <div
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                  >
                    {messageFormError}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Titre *
                  </label>
                  <input
                    name="titre"
                    defaultValue={editingMessage?.titre || ""}
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="ex: Bienvenue aux nouveaux"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contenu *
                  </label>
                  <textarea
                    name="contenu"
                    defaultValue={editingMessage?.contenu || ""}
                    required
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="Votre message..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type *
                    </label>
                    <select
                      name="type"
                      defaultValue={editingMessage?.type || "INFORMATION"}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="INFORMATION">Information</option>
                      <option value="FELICITATION">Félicitation</option>
                      <option value="ALERTE">Alerte</option>
                      <option value="MOTIVATION">Motivation</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priorité *
                    </label>
                    <select
                      name="priorite"
                      defaultValue={editingMessage?.priorite || "NORMALE"}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="BASSE">Basse</option>
                      <option value="NORMALE">Normale</option>
                      <option value="HAUTE">Haute</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date d'expiration (optionnel)
                  </label>
                  <input
                    name="date_expiration"
                    type="date"
                    defaultValue={
                      editingMessage?.date_expiration?.split("T")[0] || ""
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    name="cibles_tous_employes"
                    type="checkbox"
                    checked={ciblesTous}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setCiblesTous(checked);
                      if (checked) {
                        setSelectedServices([]);
                        setSelectedEmployees([]);
                      }
                    }}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label className="text-sm text-gray-700">
                    Publier pour tous les employés
                  </label>
                </div>

                <div
                  className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${targetsDisabled ? "opacity-50 pointer-events-none" : ""}`}
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cibler par service
                    </label>
                    {targetServices.length === 0 ? (
                      <p className="text-xs text-gray-500">
                        Aucun service disponible.
                      </p>
                    ) : (
                      <div className="border border-gray-200 rounded-lg p-2 max-h-40 overflow-y-auto space-y-1">
                        {targetServices.map((service) => (
                          <label
                            key={service}
                            className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-50"
                          >
                            <input
                              type="checkbox"
                              checked={selectedServices.includes(service)}
                              onChange={() => toggleService(service)}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">
                              {service}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cibler des employés
                    </label>
                    <input
                      type="text"
                      value={employeeSearch}
                      onChange={(e) => setEmployeeSearch(e.target.value)}
                      placeholder="Rechercher un employé"
                      className="w-full px-3 py-2 mb-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                    <div className="border border-gray-200 rounded-lg p-2 max-h-40 overflow-y-auto space-y-1">
                      {filteredEmployees.length === 0 ? (
                        <p className="text-xs text-gray-500 px-2 py-2">
                          Aucun employé trouvé.
                        </p>
                      ) : (
                        filteredEmployees.map((emp) => (
                          <label
                            key={emp.id}
                            className="flex items-center justify-between gap-2 px-2 py-1 rounded hover:bg-gray-50"
                          >
                            <span className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={selectedEmployees.includes(emp.id)}
                                onChange={() => toggleEmployee(emp.id)}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700">
                                {emp.full_name}
                              </span>
                            </span>
                            <span className="text-xs text-gray-400">
                              {emp.department || "—"}
                            </span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                </div>
                {!ciblesTous && (
                  <p className="text-xs text-gray-500">
                    Sélectionnez au moins un service ou un employé pour cibler
                    la publication.
                  </p>
                )}
              </div>

              <div className="p-6 border-t border-gray-200 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowMessageForm(false);
                    setEditingMessage(null);
                    setMessageFormError(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={messageFormSaving}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  <Send size={16} />
                  {messageFormSaving
                    ? "Enregistrement..."
                    : editingMessage
                      ? "Mettre à jour"
                      : "Publier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
