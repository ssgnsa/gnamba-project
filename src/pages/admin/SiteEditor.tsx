import { useState, useEffect, useCallback } from "react";
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
  Type,
  Home,
} from "lucide-react";
import { apiClient } from "../../api/client";
import MediaPicker from "../../components/media/MediaPicker";
import PageBuilder from "../../components/page-builder/PageBuilder";
import { SECTION_META, PAGE_SLUGS } from "../../components/page-builder/types";
import { bumpContentVersion } from "../../hooks/useContentVersion";

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

interface Lot {
  id: string;
  titre: string;
  description: string;
  type_bien: string;
  prix_vente: number | null;
  superficie: number | null;
  ville: string;
  village: string;
  reference: string;
  statut: string;
  image_url: string | null;
  image_alt: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  ordre_affichage: number;
  publier_sur_vitrine: boolean;
  created_at: string;
  updated_at: string;
}

type Tab = "builder" | "overrides" | "realisations" | "messages" | "lots";

// PageSection type for overrides tab
interface PageSectionOverride {
  id: string;
  type: string;
  order: number;
  props: Record<string, any>;
}

// Map section types to display labels
const SECTION_TYPE_LABELS: Record<string, string> = {
  hero: "Hero / Bannière",
  text: "Bloc de texte",
  services: "Services",
  gallery: "Galerie",
  testimonials: "Témoignages",
  contact: "Contact",
  cta: "Appel à l'action",
  faq: "FAQ",
  footer: "Pied de page",
  "featured-lots": "Lots à la une",
  "site-realisations": "Réalisations",
  "trust-signals": "Signaux de confiance",
  advantages: "Avantages",
  "stats-bar": "Barre de stats",
  "cta-band": "Bandeau CTA",
  "contact-form": "Formulaire contact",
};

const categories = ["btp", "immobilier", "foncier", "fournitures"];

export default function SiteEditor() {
  const [activeTab, setActiveTab] = useState<Tab>("builder");
  const [contents, setContents] = useState<SiteContent[]>([]);
  const [realisations, setRealisations] = useState<Realisation[]>([]);
  const [lots, setLots] = useState<Lot[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [pageLayoutSections, setPageLayoutSections] = useState<PageSectionOverride[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editingReal, setEditingReal] = useState<Partial<Realisation> | null>(
    null,
  );
  const [editingLot, setEditingLot] = useState<Partial<Lot> | null>(null);
  const [selectedMsg, setSelectedMsg] = useState<ContactMessage | null>(null);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [selectedPageSlug, setSelectedPageSlug] = useState<string>("accueil");

  // Fetch current page layout for overrides tab
  const fetchPageLayout = useCallback(async (slug: string) => {
    try {
      const { data, error } = await apiClient.pageLayouts.get(slug);
      if (data && !error && data.layout_json) {
        setPageLayoutSections(data.layout_json as PageSectionOverride[]);
      } else {
        setPageLayoutSections([]);
      }
    } catch {
      setPageLayoutSections([]);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    const [c, r, l, m] = await Promise.all([
      apiClient.siteContent.getAll(),
      apiClient.request<Realisation[]>("/tables/site_realisations?order_by=sort_order"),
      apiClient.request<Lot[]>("/tables/vitrine_lots?order_by=ordre_affichage"),
      apiClient.request<ContactMessage[]>("/tables/contact_messages?order_by=created_at"),
    ]);
    if (c.data) setContents(c.data);
    if (r.data) setRealisations(r.data);
    if (l.data) setLots(l.data);
    if (m.data) setMessages(m.data);
  };

  // Fetch page layout when tab changes to overrides or page slug changes
  useEffect(() => {
    if (activeTab === "overrides") {
      fetchPageLayout(selectedPageSlug);
    }
  }, [activeTab, selectedPageSlug, fetchPageLayout]);

  const updateContent = (id: string, value: string) => {
    setContents((prev) => prev.map((c) => (c.id === id ? { ...c, value } : c)));
  };

  const saveContents = async () => {
    setSaving(true);
    setSaveError(null);

    try {
      // Save all site content overrides (not just activeSection)
      for (const item of contents) {
        const { error } = await apiClient.siteContent.set(item.section, item.key, item.value);

        if (error) throw error;
      }

      setSaved(true);
      bumpContentVersion(); // Invalidate caches across all clients
      setTimeout(() => setSaved(false), 2500);
    } catch (error: any) {
      setSaveError(
        error || "Impossible d’enregistrer le contenu pour le moment.",
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
        reference: `REAL-${Date.now()}`,
        titre: editingReal.title.trim(),
        description: editingReal.description || "",
        type_realisation: editingReal.category || "btp",
        statut: editingReal.featured ? "termine" : "brouillon",
        localisation: editingReal.location || "",
        ville: "",
        surface: null,
        budget_previsionnel: null,
        budget_reel: null,
        date_debut: null,
        date_fin_prevue: null,
        date_fin_reelle: null,
        chef_projet_id: null,
        equipe: [],
        photos: editingReal.image_url ? [editingReal.image_url] : [],
        documents: [],
        publier_vitrine: editingReal.featured,
        ordre_affichage: realisations.length + 1,
        tags: [],
        metadata_json: {},
      };

      if (editingReal.id) {
        const { error } = await apiClient.request(
          `/tables/site_realisations/${editingReal.id}`,
          {
            method: "PATCH",
            body: JSON.stringify(payload),
          },
        );
        if (error) throw error;
      } else {
        const { error } = await apiClient.request(
          "/tables/site_realisations",
          {
            method: "POST",
            body: JSON.stringify(payload),
          },
        );
        if (error) throw error;
      }

      await fetchAll();
      bumpContentVersion(); // Invalidate caches across all clients
      setEditingReal(null);
    } catch (error: any) {
      setSaveError(
        error ||
          "Impossible d’enregistrer cette réalisation pour le moment.",
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteRealisation = async (id: string) => {
    if (!confirm("Supprimer cette réalisation ?")) return;
    const { error } = await apiClient.request(
      `/tables/site_realisations/${id}`,
      {
        method: "DELETE",
      },
    );
    if (error) {
      setSaveError(error);
      return;
    }
    setRealisations((prev) => prev.filter((r) => r.id !== id));
  };

  const saveLot = async () => {
    if (!editingLot || !editingLot.titre?.trim()) {
      setSaveError("Le titre du lot est obligatoire.");
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      const payload = {
        titre: editingLot.titre.trim(),
        description: editingLot.description || "",
        type_bien: editingLot.type_bien || "immobilier",
        prix_vente: editingLot.prix_vente,
        superficie: editingLot.superficie,
        ville: editingLot.ville || "",
        village: editingLot.village || "",
        reference: editingLot.reference || `LOT-${Date.now()}`,
        statut: editingLot.statut || "disponible",
        image_url: editingLot.image_url,
        image_alt: editingLot.image_alt || editingLot.titre,
        contact_phone: editingLot.contact_phone,
        contact_email: editingLot.contact_email,
        ordre_affichage: editingLot.ordre_affichage || lots.length + 1,
        publier_sur_vitrine: editingLot.publier_sur_vitrine || false,
      };

      if (editingLot.id) {
        const { error } = await apiClient.request(
          `/tables/vitrine_lots/${editingLot.id}`,
          {
            method: "PATCH",
            body: JSON.stringify(payload),
          },
        );
        if (error) throw error;
      } else {
        const { error } = await apiClient.request(
          "/tables/vitrine_lots",
          {
            method: "POST",
            body: JSON.stringify(payload),
          },
        );
        if (error) throw error;
      }

      await fetchAll();
      bumpContentVersion(); // Invalidate caches across all clients
      setEditingLot(null);
    } catch (error: any) {
      setSaveError(
        error ||
          "Impossible d'enregistrer ce lot pour le moment.",
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteLot = async (id: string) => {
    if (!confirm("Supprimer ce lot ?")) return;
    const { error } = await apiClient.request(
      `/tables/vitrine_lots/${id}`,
      {
        method: "DELETE",
      },
    );
    if (error) {
      setSaveError(error);
      return;
    }
    setLots((prev) => prev.filter((l) => l.id !== id));
  };

  const markMessageRead = async (id: string) => {
    await apiClient.request(
      `/tables/contact_messages/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify({ status: "read" }),
      },
    );
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
              { id: "overrides", label: "Texte & Valeurs", icon: Type },
              { id: "realisations", label: "Réalisations", icon: Image },
              { id: "lots", label: "Lots à la une", icon: Home },
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

      {/* Overrides tab - shows dynamic sections from Page Builder layout */}
      {activeTab === "overrides" && (
        <div className="space-y-6 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Type size={22} className="text-teal-600" />
                Textes & Valeurs (Remplacements)
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Modifiez le contenu des sections de la page active. Ces valeurs écrasent les props par défaut du Page Builder.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <span className="font-medium">Page :</span>
                <select
                  value={selectedPageSlug}
                  onChange={(e) => setSelectedPageSlug(e.target.value)}
                  className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
                >
                  {PAGE_SLUGS.map((p) => (
                    <option key={p.slug} value={p.slug}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </label>
              <button
                onClick={saveContents}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition"
              >
                {saved ? <Check size={14} /> : <Save size={14} />}
                {saved ? "Enregistré !" : saving ? "Enregistrement..." : "Enregistrer tout"}
              </button>
            </div>
          </div>

          {saveError && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {saveError}
            </div>
          )}

          {pageLayoutSections.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
              <Type size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucune section trouvée
              </h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                La page &laquo;accueil&raquo; n'a pas de layout publié dans le Page Builder.
                Allez dans l'onglet <strong>Constructeur de pages</strong> pour créer et publier une mise en page.
              </p>
              <button
                onClick={() => setActiveTab("builder")}
                className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium transition"
              >
                <Layers size={15} />
                Aller au Constructeur
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {(() => {
                // Group sections by type, get unique types from layout
                const sectionTypes = Array.from(
                  new Set(pageLayoutSections.map((s) => s.type))
                );
                return sectionTypes.map((sectionType) => {
                  const sectionsOfType = pageLayoutSections.filter(
                    (s) => s.type === sectionType
                  );
                  const label =
                    SECTION_TYPE_LABELS[sectionType] || sectionType;
                  const meta = SECTION_META[sectionType as keyof typeof SECTION_META];

                  // Get all props keys used by sections of this type
                  const allPropsKeys = Array.from(
                    new Set(
                      sectionsOfType.flatMap((s) => Object.keys(s.props || {}))
                    )
                  );

                  return (
                    <div
                      key={sectionType}
                      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
                    >
                      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
                        <span className="text-2xl">{meta?.icon || "📦"}</span>
                        <div>
                          <h3 className="font-bold text-gray-900">
                            {label}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {sectionsOfType.length} section{sectionsOfType.length > 1 ? "s" : ""} du type <code className="bg-gray-100 px-1 rounded">{sectionType}</code>
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {allPropsKeys.map((propKey) => {
                          // Find the first non-empty value across sections of this type
                          const existingContent = contents.find(
                            (c) => c.section === sectionType && c.key === propKey
                          );
                          const defaultValue = sectionsOfType[0]?.props?.[propKey] ?? "";

                          return (
                            <div key={propKey}>
                              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                {propKey}
                                {existingContent && (
                                  <span className="ml-1.5 text-xs bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded">
                                    Personnalisé
                                  </span>
                                )}
                              </label>
                              <input
                                value={existingContent?.value ?? defaultValue ?? ""}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (existingContent) {
                                    updateContent(existingContent.id, value);
                                  } else {
                                    // Create new content entry
                                    const newId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
                                    const newContent: SiteContent = {
                                      id: newId,
                                      section: sectionType,
                                      key: propKey,
                                      value,
                                      content_type: "text",
                                      label: propKey,
                                    };
                                    setContents((prev) => [...prev, newContent]);
                                  }
                                }}
                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}
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
                        crossOrigin="anonymous"
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
                          crossOrigin="anonymous"
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

      {/* Lots tab */}
      {activeTab === "lots" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => {
                setSaveError(null);
                setEditingLot({
                  titre: "",
                  description: "",
                  type_bien: "immobilier",
                  prix_vente: null,
                  superficie: null,
                  ville: "",
                  village: "",
                  reference: `LOT-${Date.now()}`,
                  statut: "disponible",
                  image_url: null,
                  image_alt: "",
                  contact_phone: null,
                  contact_email: null,
                  ordre_affichage: lots.length + 1,
                  publier_sur_vitrine: false,
                });
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-sm font-semibold transition"
            >
              <Plus size={15} />
              Nouveau lot
            </button>
          </div>

          {editingLot && (
            <div className="bg-white rounded-2xl border border-blue-200 shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-4">
                {editingLot.id ? "Modifier" : "Nouveau"} lot
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
                    value={editingLot.titre || ""}
                    onChange={(e) =>
                      setEditingLot({ ...editingLot, titre: e.target.value })
                    }
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Type de bien
                  </label>
                  <select
                    value={editingLot.type_bien || "immobilier"}
                    onChange={(e) =>
                      setEditingLot({
                        ...editingLot,
                        type_bien: e.target.value,
                      })
                    }
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 bg-white"
                  >
                    <option value="btp">BTP</option>
                    <option value="immobilier">Immobilier</option>
                    <option value="foncier">Foncier</option>
                    <option value="fournitures">Fournitures</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Statut
                  </label>
                  <select
                    value={editingLot.statut || "disponible"}
                    onChange={(e) =>
                      setEditingLot({
                        ...editingLot,
                        statut: e.target.value,
                      })
                    }
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 bg-white"
                  >
                    <option value="disponible">Disponible</option>
                    <option value="reserve">Réservé</option>
                    <option value="vendu">Vendu</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Prix de vente (FCFA)
                  </label>
                  <input
                    type="number"
                    value={editingLot.prix_vente || ""}
                    onChange={(e) =>
                      setEditingLot({
                        ...editingLot,
                        prix_vente: e.target.value ? parseInt(e.target.value) : null,
                      })
                    }
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Superficie (m²)
                  </label>
                  <input
                    type="number"
                    value={editingLot.superficie || ""}
                    onChange={(e) =>
                      setEditingLot({
                        ...editingLot,
                        superficie: e.target.value ? parseInt(e.target.value) : null,
                      })
                    }
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Ville
                  </label>
                  <input
                    value={editingLot.ville || ""}
                    onChange={(e) =>
                      setEditingLot({
                        ...editingLot,
                        ville: e.target.value,
                      })
                    }
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Village / Quartier
                  </label>
                  <input
                    value={editingLot.village || ""}
                    onChange={(e) =>
                      setEditingLot({
                        ...editingLot,
                        village: e.target.value,
                      })
                    }
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Référence
                  </label>
                  <input
                    value={editingLot.reference || ""}
                    onChange={(e) =>
                      setEditingLot({
                        ...editingLot,
                        reference: e.target.value,
                      })
                    }
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Téléphone de contact
                  </label>
                  <input
                    value={editingLot.contact_phone || ""}
                    onChange={(e) =>
                      setEditingLot({
                        ...editingLot,
                        contact_phone: e.target.value,
                      })
                    }
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Email de contact
                  </label>
                  <input
                    type="email"
                    value={editingLot.contact_email || ""}
                    onChange={(e) =>
                      setEditingLot({
                        ...editingLot,
                        contact_email: e.target.value,
                      })
                    }
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Ordre d'affichage
                  </label>
                  <input
                    type="number"
                    value={editingLot.ordre_affichage || lots.length + 1}
                    onChange={(e) =>
                      setEditingLot({
                        ...editingLot,
                        ordre_affichage: parseInt(e.target.value) || 0,
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
                  value={editingLot.description || ""}
                  onChange={(e) =>
                    setEditingLot({
                      ...editingLot,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition resize-none"
                />
              </div>
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Image du lot
                </label>
                <div className="flex items-center gap-3">
                  {editingLot.image_url ? (
                    <div className="relative">
                      <img
                        src={editingLot.image_url}
                        alt="Lot"
                        crossOrigin="anonymous"
                        className="w-20 h-14 rounded-xl object-cover border-2 border-gray-200"
                      />
                      <button
                        onClick={() =>
                          setEditingLot({ ...editingLot, image_url: "" })
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
                    {editingLot.image_url
                      ? "Changer l'image"
                      : "Sélectionner une image"}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <input
                  type="checkbox"
                  id="publier_vitrine"
                  checked={editingLot.publier_sur_vitrine || false}
                  onChange={(e) =>
                    setEditingLot({
                      ...editingLot,
                      publier_sur_vitrine: e.target.checked,
                    })
                  }
                  className="rounded"
                />
                <label htmlFor="publier_vitrine" className="text-sm text-gray-700">
                  Publier sur la vitrine (page d'accueil)
                </label>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={saveLot}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-sm font-semibold transition"
                >
                  <Save size={14} />
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </button>
                <button
                  onClick={() => {
                    setSaveError(null);
                    setEditingLot(null);
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
                    Type
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">
                    Ville / Village
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">
                    Prix
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">
                    Statut
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {lots.map((lot) => (
                  <tr key={lot.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {lot.titre}
                        </span>
                        {lot.publier_sur_vitrine && (
                          <span className="bg-amber-100 text-amber-700 text-xs px-1.5 py-0.5 rounded-md font-medium">
                            Vitrine
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      {lot.image_url ? (
                        <img
                          src={lot.image_url}
                          alt={lot.titre}
                          crossOrigin="anonymous"
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
                        {lot.type_bien.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 hidden lg:table-cell">
                      {lot.ville} {lot.village && `, ${lot.village}`}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 hidden md:table-cell">
                      {lot.prix_vente
                        ? `${Number(lot.prix_vente).toLocaleString()} FCFA`
                        : "—"}
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          lot.statut === "disponible"
                            ? "bg-emerald-100 text-emerald-700"
                            : lot.statut === "reserve"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {lot.statut === "disponible"
                          ? "Disponible"
                          : lot.statut === "reserve"
                          ? "Réservé"
                          : "Vendu"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSaveError(null);
                            setEditingLot(lot);
                          }}
                          className="p-1.5 text-gray-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => deleteLot(lot.id)}
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
            {lots.length === 0 && (
              <div className="text-center py-12 text-gray-400 text-sm">
                Aucun lot ajouté
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
                    onClick={async () => {
                      await apiClient.request(
                        `/tables/contact_messages/${selectedMsg.id}`,
                        {
                          method: "PATCH",
                          body: JSON.stringify({ statut: "repondu" }),
                        },
                      );
                    }}
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
