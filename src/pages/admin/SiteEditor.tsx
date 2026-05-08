import { useState, useEffect } from "react";
import {
  Globe,
  CreditCard as Edit3,
  Plus,
  Trash2,
  Image,
  MessageSquare,
  Save,
  X,
  Eye,
  Check,
  Layers,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import MediaPicker from "../../components/media/MediaPicker";
import PageBuilder from "../../components/page-builder/PageBuilder";

interface SiteContent {
  id: string;
  section: string;
  key: string;
  value: string;
  content_type: string;
  label: string;
}

interface Realisation {
  id: string;
  title: string;
  description: string;
  category: string;
  year: number;
  location: string;
  featured: boolean;
  sort_order: number;
  image_url?: string;
}

interface ContactMessage {
  id: string;
  name: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
}

type Tab = "builder" | "contenu" | "realisations" | "messages";

const sections = [
  { id: "hero", label: "Page d'accueil (Hero)" },
  { id: "about", label: "À propos" },
  { id: "services", label: "Services" },
  { id: "contact", label: "Contact" },
  { id: "footer", label: "Pied de page" },
];

const categories = ["btp", "immobilier", "foncier", "fournitures"];

export default function SiteEditor() {
  const [activeTab, setActiveTab] = useState<Tab>("builder");
  const [activeSection, setActiveSection] = useState("hero");
  const [contents, setContents] = useState<SiteContent[]>([]);
  const [realisations, setRealisations] = useState<Realisation[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editingReal, setEditingReal] = useState<Partial<Realisation> | null>(
    null,
  );
  const [selectedMsg, setSelectedMsg] = useState<ContactMessage | null>(null);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    const [c, r, m] = await Promise.all([
      supabase.from("site_content").select("*").order("section").order("key"),
      supabase.from("site_realisations").select("*").order("sort_order"),
      supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);
    if (c.data) setContents(c.data);
    if (r.data) setRealisations(r.data);
    if (m.data) setMessages(m.data);
  };

  const sectionContents = contents.filter((c) => c.section === activeSection);

  const updateContent = (id: string, value: string) => {
    setContents((prev) => prev.map((c) => (c.id === id ? { ...c, value } : c)));
  };

  const saveContents = async () => {
    setSaving(true);
    setSaveError(null);

    try {
      const toSave = contents.filter((c) => c.section === activeSection);
      for (const item of toSave) {
        const { error } = await supabase
          .from("site_content")
          .update({ value: item.value, updated_at: new Date().toISOString() })
          .eq("id", item.id);

        if (error) throw error;
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (error: any) {
      setSaveError(
        error.message || "Impossible d’enregistrer le contenu pour le moment.",
      );
    } finally {
      setSaving(false);
    }
  };

  const saveRealisation = async () => {
    if (!editingReal || !editingReal.title?.trim()) {
      setSaveError("Le titre de la réalisation est obligatoire.");
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      const payload = {
        title: editingReal.title.trim(),
        description: editingReal.description || "",
        category: editingReal.category || "btp",
        year: editingReal.year || new Date().getFullYear(),
        location: editingReal.location || "",
        featured: editingReal.featured || false,
        image_url: editingReal.image_url || null,
      };

      if (editingReal.id) {
        const { error } = await supabase
          .from("site_realisations")
          .update(payload)
          .eq("id", editingReal.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("site_realisations").insert({
          ...payload,
          sort_order: realisations.length + 1,
        });
        if (error) throw error;
      }

      await fetchAll();
      setEditingReal(null);
    } catch (error: any) {
      setSaveError(
        error.message ||
          "Impossible d’enregistrer cette réalisation pour le moment.",
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteRealisation = async (id: string) => {
    if (!confirm("Supprimer cette réalisation ?")) return;
    await supabase.from("site_realisations").delete().eq("id", id);
    setRealisations((prev) => prev.filter((r) => r.id !== id));
  };

  const markMessageRead = async (id: string) => {
    await supabase
      .from("contact_messages")
      .update({ status: "read" })
      .eq("id", id);
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: "read" } : m)),
    );
    if (selectedMsg?.id === id)
      setSelectedMsg((prev) => (prev ? { ...prev, status: "read" } : null));
  };

  const newMessages = messages.filter((m) => m.status === "new").length;

  return (
    <div
      className={
        activeTab === "builder"
          ? "flex flex-col overflow-hidden"
          : "space-y-6 p-6"
      }
      style={activeTab === "builder" ? { height: "calc(100vh - 73px)" } : {}}
    >
      <div
        className={`flex items-center justify-between flex-wrap gap-3 flex-shrink-0 ${activeTab === "builder" ? "px-6 pt-6" : ""}`}
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Globe size={24} className="text-teal-600" />
            Éditeur du Site Vitrine
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Gérez le contenu et la mise en page de votre site public
          </p>
        </div>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 text-gray-600 hover:text-teal-700 hover:border-teal-300 rounded-xl text-sm font-medium transition"
        >
          <Eye size={14} />
          Voir le site
        </a>
      </div>

      <div
        className={`border-b border-gray-200 flex-shrink-0 ${activeTab === "builder" ? "px-6" : ""}`}
      >
        <div className="flex gap-1">
          {(
            [
              { id: "builder", label: "Constructeur de pages", icon: Layers },
              { id: "contenu", label: "Contenu", icon: Edit3 },
              { id: "realisations", label: "Réalisations", icon: Image },
              {
                id: "messages",
                label: `Messages${newMessages > 0 ? ` (${newMessages})` : ""}`,
                icon: MessageSquare,
              },
            ] as {
              id: Tab;
              label: string;
              icon: React.ComponentType<{
                size?: number | string;
                className?: string;
              }>;
            }[]
          ).map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-teal-600 text-teal-700"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <Icon size={15} />
                {tab.label}
                {tab.id === "messages" && newMessages > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {newMessages}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === "builder" && (
        <div className="flex-1 overflow-hidden">
          <PageBuilder />
        </div>
      )}

      {/* Content tab */}
      {activeTab === "contenu" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="space-y-1">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setSaveError(null);
                  setActiveSection(s.id);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                  activeSection === s.id
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-gray-900">
                  {sections.find((s) => s.id === activeSection)?.label}
                </h3>
                <button
                  onClick={saveContents}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition"
                >
                  {saved ? <Check size={14} /> : <Save size={14} />}
                  {saved
                    ? "Enregistré !"
                    : saving
                      ? "Enregistrement..."
                      : "Enregistrer"}
                </button>
              </div>

              {saveError && (
                <div
                  role="alert"
                  className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {saveError}
                </div>
              )}

              <div className="space-y-4">
                {sectionContents.map((item) => (
                  <div key={item.id}>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      {item.label || item.key}
                    </label>
                    {item.content_type === "html" || item.value.length > 100 ? (
                      <textarea
                        value={item.value}
                        onChange={(e) => updateContent(item.id, e.target.value)}
                        rows={4}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition resize-none"
                      />
                    ) : (
                      <input
                        value={item.value}
                        onChange={(e) => updateContent(item.id, e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
                      />
                    )}
                  </div>
                ))}
                {sectionContents.length === 0 && (
                  <p className="text-gray-400 text-sm text-center py-6">
                    Aucun contenu éditable pour cette section.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Realisations tab */}
      {activeTab === "realisations" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => {
                setSaveError(null);
                setEditingReal({
                  title: "",
                  description: "",
                  category: "btp",
                  year: new Date().getFullYear(),
                  location: "",
                  featured: false,
                });
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-sm font-semibold transition"
            >
              <Plus size={15} />
              Nouvelle réalisation
            </button>
          </div>

          {editingReal && (
            <div className="bg-white rounded-2xl border border-blue-200 shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-4">
                {editingReal.id ? "Modifier" : "Nouvelle"} réalisation
              </h3>
              {saveError && (
                <div
                  role="alert"
                  className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {saveError}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Titre *
                  </label>
                  <input
                    value={editingReal.title || ""}
                    onChange={(e) =>
                      setEditingReal({ ...editingReal, title: e.target.value })
                    }
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Catégorie
                  </label>
                  <select
                    value={editingReal.category || "btp"}
                    onChange={(e) =>
                      setEditingReal({
                        ...editingReal,
                        category: e.target.value,
                      })
                    }
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Localisation
                  </label>
                  <input
                    value={editingReal.location || ""}
                    onChange={(e) =>
                      setEditingReal({
                        ...editingReal,
                        location: e.target.value,
                      })
                    }
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Année
                  </label>
                  <input
                    type="number"
                    value={editingReal.year || new Date().getFullYear()}
                    onChange={(e) =>
                      setEditingReal({
                        ...editingReal,
                        year: parseInt(e.target.value),
                      })
                    }
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Description
                </label>
                <textarea
                  value={editingReal.description || ""}
                  onChange={(e) =>
                    setEditingReal({
                      ...editingReal,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition resize-none"
                />
              </div>
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Image de la réalisation
                </label>
                <div className="flex items-center gap-3">
                  {editingReal.image_url ? (
                    <div className="relative">
                      <img
                        src={editingReal.image_url}
                        alt="Réalisation"
                        className="w-20 h-14 rounded-xl object-cover border-2 border-gray-200"
                      />
                      <button
                        onClick={() =>
                          setEditingReal({ ...editingReal, image_url: "" })
                        }
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
                    {editingReal.image_url
                      ? "Changer l'image"
                      : "Sélectionner une image"}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <input
                  type="checkbox"
                  id="featured"
                  checked={editingReal.featured || false}
                  onChange={(e) =>
                    setEditingReal({
                      ...editingReal,
                      featured: e.target.checked,
                    })
                  }
                  className="rounded"
                />
                <label htmlFor="featured" className="text-sm text-gray-700">
                  Mettre en avant sur la page d'accueil
                </label>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={saveRealisation}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-sm font-semibold transition"
                >
                  <Save size={14} />
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </button>
                <button
                  onClick={() => {
                    setSaveError(null);
                    setEditingReal(null);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl text-sm font-medium transition"
                >
                  <X size={14} />
                  Annuler
                </button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full egs-table">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Titre
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">
                    Image
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">
                    Catégorie
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">
                    Lieu
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">
                    Année
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {realisations.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {r.title}
                        </span>
                        {r.featured && (
                          <span className="bg-amber-100 text-amber-700 text-xs px-1.5 py-0.5 rounded-md font-medium">
                            Phare
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      {r.image_url ? (
                        <img
                          src={r.image_url}
                          alt={r.title}
                          className="w-14 h-10 rounded-lg object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="w-14 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                          <Image size={14} className="text-gray-300" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <span className="bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full font-medium">
                        {r.category.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 hidden lg:table-cell">
                      {r.location}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 hidden md:table-cell">
                      {r.year}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSaveError(null);
                            setEditingReal(r);
                          }}
                          className="p-1.5 text-gray-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => deleteRealisation(r.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {realisations.length === 0 && (
              <div className="text-center py-12 text-gray-400 text-sm">
                Aucune réalisation ajoutée
              </div>
            )}
          </div>
        </div>
      )}

      {/* Messages tab */}
      {activeTab === "messages" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            {messages.map((msg) => (
              <button
                key={msg.id}
                onClick={() => {
                  setSelectedMsg(msg);
                  if (msg.status === "new") markMessageRead(msg.id);
                }}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  selectedMsg?.id === msg.id
                    ? "border-blue-300 bg-blue-50"
                    : "border-gray-100 bg-white hover:border-gray-200"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-gray-900 truncate">
                        {msg.name}
                      </span>
                      {msg.status === "new" && (
                        <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {msg.subject || msg.email}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(msg.created_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 font-medium ${
                      msg.status === "new"
                        ? "bg-blue-100 text-blue-700"
                        : msg.status === "replied"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {msg.status === "new"
                      ? "Nouveau"
                      : msg.status === "replied"
                        ? "Répondu"
                        : "Lu"}
                  </span>
                </div>
              </button>
            ))}
            {messages.length === 0 && (
              <div className="text-center py-12 text-gray-400 text-sm bg-white rounded-xl border border-gray-100">
                Aucun message
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            {selectedMsg ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">
                      {selectedMsg.name}
                    </h3>
                    <div className="flex flex-wrap gap-3 mt-1 text-sm text-gray-500">
                      <span>{selectedMsg.email}</span>
                      {selectedMsg.phone && <span>· {selectedMsg.phone}</span>}
                    </div>
                    {selectedMsg.subject && (
                      <p className="text-sm font-medium text-blue-700 mt-1">
                        {selectedMsg.subject}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(selectedMsg.created_at).toLocaleString("fr-FR")}
                  </span>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                    {selectedMsg.message}
                  </p>
                </div>
                <div className="flex gap-3 mt-4">
                  <a
                    href={`mailto:${selectedMsg.email}?subject=Re: ${selectedMsg.subject || "Votre message"}`}
                    onClick={() =>
                      supabase
                        .from("contact_messages")
                        .update({ status: "replied" })
                        .eq("id", selectedMsg.id)
                    }
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-sm font-semibold transition"
                  >
                    Répondre par email
                  </a>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center justify-center h-64">
                <div className="text-center text-gray-400">
                  <MessageSquare
                    size={32}
                    className="mx-auto mb-2 opacity-40"
                  />
                  <p className="text-sm">Sélectionnez un message</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showImagePicker && (
        <MediaPicker
          onSelect={(file) => {
            setEditingReal((prev) =>
              prev ? { ...prev, image_url: file.url } : prev,
            );
            setShowImagePicker(false);
          }}
          onClose={() => setShowImagePicker(false)}
          defaultCategory="realisations"
          title="Sélectionner une image de réalisation"
        />
      )}
    </div>
  );
}
