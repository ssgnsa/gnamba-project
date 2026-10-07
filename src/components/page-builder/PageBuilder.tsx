import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Save,
  Globe,
  Eye,
  Monitor,
  Tablet,
  Smartphone,
  Undo2,
  Redo2,
  Plus,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Check,
  Loader2,
  Copy,
  Type,
  Image,
  Zap,
  Layout,
  Trash2,
  Maximize2,
  PanelLeftClose,
  PanelLeftOpen,
  FileText,
} from "lucide-react";
import { apiClient } from "../../api/client";
import {
  PageSection,
  SectionType,
  ViewportMode,
  PAGE_SLUGS,
  SECTION_META,
  defaultProps,
} from "./types";
import SectionPreview from "./SectionPreview";
import PropertiesPanel from "./PropertiesPanel";
import { bumpContentVersion } from "../../hooks/useContentVersion";

// Template type for quick page setup
interface PageTemplateSection {
  type: SectionType;
  props: any;
}

interface PageTemplates {
  [key: string]: PageTemplateSection[];
}

const VIEWPORT_WIDTHS: Record<ViewportMode, string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "375px",
};

// Section categories for organized sidebar
const SECTION_CATEGORIES: Record<string, { label: string; icon: any; types: SectionType[] }> = {
  layout: {
    label: "Structure",
    icon: Layout,
    types: ["hero", "cta", "cta-band"],
  },
  content: {
    label: "Contenu",
    icon: Type,
    types: ["text", "services", "gallery", "testimonials", "faq"],
  },
  dynamic: {
    label: "Dynamique (BDD)",
    icon: Zap,
    types: ["featured-lots", "site-realisations", "trust-signals", "advantages", "stats-bar"],
  },
  media_contact: {
    label: "Média & Contact",
    icon: Image,
    types: ["contact", "contact-form", "footer"],
  },
};

// Page templates for quick setup
const PAGE_TEMPLATES: PageTemplates = {
  accueil: [
    { type: "hero", props: { title: "BTP, immobilier et foncier sécurisés", subtitle: "Votre partenaire de confiance pour vos projets de construction, d'investissement et de valorisation.", cta_text: "Nous contacter", cta_url: "/contact", bg_image_url: "", overlay_opacity: 60 } },
    { type: "stats-bar", props: { title: "", items: [{ label: "Projets réalisés", value: "50+", icon: "hard-hat" }, { label: "Clients accompagnés", value: "100+", icon: "users" }, { label: "Années d'expertise", value: "5+", icon: "award" }, { label: "Régions couvertes", value: "3", icon: "globe" }] } },
    { type: "featured-lots", props: { title: "Lots à Vendre — Sélection Premium", subtitle: "Sélection de lots actuellement mis en avant pour vos projets d'achat, d'investissement ou de revente.", limit: 3, show_category: true, show_status: true, show_price: true, show_surface: true, show_location: true, cta_text: "Voir tous les lots", cta_url: "/lots-disponibles" } },
    { type: "site-realisations", props: { title: "Projets Réalisés", subtitle: "Découvrez nos dernières réalisations dans le BTP, l'immobilier, le foncier et les fournitures.", limit: 3, show_category: true, show_year: true, show_location: true, cta_text: "Voir tout", cta_url: "/realisations" } },
    { type: "trust-signals", props: { title: "Pourquoi nous faire confiance ?", subtitle: "", items: [{ icon: "shield", label: "Transactions sécurisées", description: "Vérification juridique complète" }, { icon: "zap", label: "Réponse sous 24h", description: "Devis et suivi ultra-rapides" }, { icon: "globe", label: "Couverture nationale", description: "Présence sur 3 régions ivoiriennes" }, { icon: "target", label: "Résultats garantis", description: "Engagement satisfaction client" }] } },
    { type: "advantages", props: { title: "Pourquoi Choisir GNAMBA SERVICES ?", subtitle: "Notre approche met la réactivité, la proximité et un suivi clair au service de vos projets.", items: [{ icon: "award", title: "Expertise terrain", description: "Plus de 5 ans d'expérience dans le BTP, l'immobilier et le foncier en Côte d'Ivoire." }, { icon: "users", title: "Réactivité locale", description: "Des professionnels disponibles et joignables rapidement pour faire avancer vos dossiers." }, { icon: "check-circle", title: "Un seul interlocuteur", description: "Un guichet unique pour la construction, l'immobilier, le foncier et les fournitures." }, { icon: "star", title: "Suivi jusqu'au résultat", description: "Un accompagnement sur mesure à chaque étape, de la première prise de contact à la livraison." }] } },
    { type: "cta-band", props: { title: "Prêt à Concrétiser Votre Projet ?", subtitle: "Parlez-nous de votre projet pour recevoir une proposition claire, rapide et adaptée au contexte ivoirien.", bg_color: "#1e3a5f", primary_button_text: "Demander un devis", primary_button_url: "/contact", secondary_button_text: "Voir nos réalisations", secondary_button_url: "/realisations" } },
    { type: "contact-form", props: { title: "Parlons de votre projet", subtitle: "Notre équipe vous accompagne rapidement pour tout projet de construction, achat, vente ou sécurisation foncière.", show_phone: true, show_email: true, phone: "+225 07 77 96 01 49", email: "contact@gnambaservices.ci" } },
    { type: "footer", props: { logo_url: "", tagline: "Votre partenaire de confiance", links: [{ label: "Accueil", url: "/" }, { label: "Services", url: "/services" }, { label: "Contact", url: "/contact" }], copyright: `© ${new Date().getFullYear()} Gnamba Services. Tous droits réservés.`, show_social: true } },
  ],
  about: [
    { type: "hero", props: { title: "À propos de nous", subtitle: "Découvrez notre histoire et nos valeurs", cta_text: "Nos services", cta_url: "/services", bg_image_url: "", overlay_opacity: 60 } },
    { type: "text", props: { title: "Notre histoire", content: "Fondée en 2021, GNAMBA SERVICES accompagne particuliers et entreprises en Côte d'Ivoire.", align: "left" } },
    { type: "advantages", props: { title: "Nos Valeurs", subtitle: "", items: [{ icon: "award", title: "Expertise", description: "Une équipe d'experts passionnés" }, { icon: "users", title: "Proximité", description: "À l'écoute de vos besoins" }, { icon: "check-circle", title: "Transparence", description: "Des échanges clairs et honnêtes" }, { icon: "star", title: "Résultat", description: "Votre satisfaction, notre priorité" }] } },
  ],
  services: [
    { type: "hero", props: { title: "Nos Services", subtitle: "Des solutions complètes pour vos projets", cta_text: "Demander un devis", cta_url: "/contact", bg_image_url: "", overlay_opacity: 60 } },
    { type: "services", props: { title: "Nos Domaines d'Expertise", subtitle: "Une offre complète", items: [{ icon: "🏗️", title: "Construction BTP", description: "Réalisation de bâtiments résidentiels et commerciaux" }, { icon: "🏠", title: "Gestion Immobilière", description: "Location et gestion de patrimoine immobilier" }, { icon: "🗺️", title: "Foncier", description: "Acquisition et valorisation de terrains" }, { icon: "📦", title: "Fournitures", description: "Équipements et consommables professionnels" }] } },
  ],
  realisations: [
    { type: "hero", props: { title: "Nos Réalisations", subtitle: "Découvrez nos projets accomplis", cta_text: "Nous contacter", cta_url: "/contact", bg_image_url: "", overlay_opacity: 60 } },
    { type: "site-realisations", props: { title: "Projets Réalisés", subtitle: "", limit: 6, show_category: true, show_year: true, show_location: true, cta_text: "", cta_url: "" } },
  ],
  contact: [
    { type: "hero", props: { title: "Contactez-nous", subtitle: "Notre équipe est à votre disposition", cta_text: "", cta_url: "", bg_image_url: "", overlay_opacity: 60 } },
    { type: "contact-form", props: { title: "Envoyez-nous un message", subtitle: "Nous vous répondrons dans les plus brefs délais.", show_phone: true, show_email: true, phone: "+225 07 77 96 01 49", email: "contact@gnambaservices.ci" } },
  ],
};

function nanoid(): string {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
}

export default function PageBuilder() {
  const [currentSlug, setCurrentSlug] = useState<string>("accueil");
  const [sections, setSections] = useState<PageSection[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewport, setViewport] = useState<ViewportMode>("desktop");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [published, setPublished] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [history, setHistory] = useState<PageSection[][]>([[]]);
  const [historyIdx, setHistoryIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showProperties, setShowProperties] = useState(true);
  const [fullScreenPreview, setFullScreenPreview] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Template state
  const [showTemplates, setShowTemplates] = useState(false);

  // Better section preview with memoization
  const sectionPreviews = useMemo(() => {
    const previews: Record<string, JSX.Element> = {};
    sections.forEach((section) => {
      previews[section.id] = <SectionPreview key={section.id} section={section} />;
    });
    return previews;
  }, [sections]);

  const loadLayout = useCallback(async (slug: string) => {
    setLoading(true);
    setSelectedId(null);
    const { data, error } = await apiClient.pageLayouts.get(slug);
    if (data && !error) {
      const loaded: PageSection[] = Array.isArray(data.layout_json)
        ? data.layout_json
        : [];
      setSections(loaded);
      setIsPublished(data.is_published);
      setHistory([loaded]);
      setHistoryIdx(0);
    } else {
      setSections([]);
      setIsPublished(false);
      setHistory([[]]);
      setHistoryIdx(0);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadLayout(currentSlug);
  }, [currentSlug, loadLayout]);

  const pushHistory = (newSections: PageSection[]) => {
    const newHistory = history.slice(0, historyIdx + 1);
    newHistory.push(newSections);
    setHistory(newHistory);
    setHistoryIdx(newHistory.length - 1);
    setSections(newSections);
  };

  const applyTemplate = (template: PageTemplateSection[]) => {
    const newSections: PageSection[] = template.map((t, index) => ({
      id: nanoid(),
      type: t.type,
      order: index,
      props: t.props,
    }));
    pushHistory(newSections);
    setSelectedId(newSections[0]?.id || null);
    setShowTemplates(false);
    setTimeout(
      () => canvasRef.current?.lastElementChild?.scrollIntoView({ behavior: "smooth" }),
      50,
    );
  };

  const undo = () => {
    if (historyIdx > 0) {
      setHistoryIdx(historyIdx - 1);
      setSections(history[historyIdx - 1]);
    }
  };

  const redo = () => {
    if (historyIdx < history.length - 1) {
      setHistoryIdx(historyIdx + 1);
      setSections(history[historyIdx + 1]);
    }
  };

  const addSection = (type: SectionType) => {
    const newSection: PageSection = {
      id: nanoid(),
      type,
      order: sections.length,
      props: defaultProps(type),
    };
    pushHistory([...sections, newSection]);
    setSelectedId(newSection.id);
    setTimeout(
      () =>
        canvasRef.current?.lastElementChild?.scrollIntoView({
          behavior: "smooth",
        }),
      50,
    );
  };

  const duplicateSection = (id: string) => {
    const section = sections.find((s) => s.id === id);
    if (!section) return;
    const newSection: PageSection = {
      ...section,
      id: nanoid(),
      order: sections.indexOf(section) + 1,
    };
    const newSections = [...sections];
    newSections.splice(sections.indexOf(section) + 1, 0, newSection);
    pushHistory(newSections.map((s, i) => ({ ...s, order: i })));
    setSelectedId(newSection.id);
  };

  const updateSection = (updated: PageSection) => {
    const newSections = sections.map((s) =>
      s.id === updated.id ? updated : s,
    );
    pushHistory(newSections);
  };

  const deleteSection = (id: string) => {
    pushHistory(sections.filter((s) => s.id !== id));
    setSelectedId(null);
  };

  const moveSection = (idx: number, dir: -1 | 1) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= sections.length) return;
    const arr = [...sections];
    [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
    pushHistory(arr.map((s, i) => ({ ...s, order: i })));
  };

  const handleDragStart = (idx: number) => setDraggedIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOverIdx(idx);
  };
  const handleDrop = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === idx) {
      setDraggedIdx(null);
      setDragOverIdx(null);
      return;
    }
    const arr = [...sections];
    const [moved] = arr.splice(draggedIdx, 1);
    arr.splice(idx, 0, moved);
    pushHistory(arr.map((s, i) => ({ ...s, order: i })));
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  const saveLayout = async () => {
    setSaving(true);
    const result = await apiClient.pageLayouts.upsert({
      page_slug: currentSlug,
      page_name: PAGE_SLUGS.find((p) => p.slug === currentSlug)?.label || currentSlug,
      layout_json: sections,
      is_published: isPublished,
    });
    setSaving(false);
    if (!result.error && result.data) {
      setIsPublished(result.data.is_published);
      setSaved(true);
      bumpContentVersion(); // Invalidate caches across all clients
      setTimeout(() => setSaved(false), 2500);
    }
  };

  const publishLayout = async () => {
    setPublishing(true);
    const { error, data } = await apiClient.pageLayouts.publish(currentSlug);
    setPublishing(false);
    if (!error) {
      setIsPublished(true);
      // Reload to get fresh data from server including is_published
      if (data) {
        const { data: freshData } = await apiClient.pageLayouts.get(currentSlug);
        if (freshData) setIsPublished(freshData.is_published);
      }
      bumpContentVersion(); // Invalidate caches across all clients
      setPublished(true);
      setTimeout(() => setPublished(false), 2500);
    }
  };

  const selectedSection = sections.find((s) => s.id === selectedId) ?? null;

  return (
    <div className="flex flex-col h-full bg-slate-100">
      <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-slate-200 flex-shrink-0 gap-3 flex-wrap">
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
          {PAGE_SLUGS.map((p) => (
            <button
              key={p.slug}
              onClick={() => setCurrentSlug(p.slug)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${currentSlug === p.slug ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 rounded-xl p-1">
          {(["desktop", "tablet", "mobile"] as ViewportMode[]).map((v) => (
            <button
              key={v}
              onClick={() => setViewport(v)}
              className={`p-1.5 rounded-lg transition-all ${viewport === v ? "bg-white shadow-sm text-slate-800" : "text-slate-400 hover:text-slate-600"}`}
              title={v}
            >
              {v === "desktop" ? (
                <Monitor size={15} />
              ) : v === "tablet" ? (
                <Tablet size={15} />
              ) : (
                <Smartphone size={15} />
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={undo}
            disabled={historyIdx === 0}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 disabled:opacity-30 transition-colors"
            title="Annuler (Ctrl+Z)"
          >
            <Undo2 size={15} />
          </button>
          <button
            onClick={redo}
            disabled={historyIdx === history.length - 1}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 disabled:opacity-30 transition-colors"
            title="Rétablir (Ctrl+Y)"
          >
            <Redo2 size={15} />
          </button>
          <button
            onClick={saveLayout}
            disabled={saving}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${saved ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 hover:bg-slate-200 text-slate-700"}`}
          >
            {saving ? (
              <Loader2 size={13} className="animate-spin" />
            ) : saved ? (
              <Check size={13} />
            ) : (
              <Save size={13} />
            )}
            {saved ? "Enregistré" : "Enregistrer"}
          </button>
          <button
            onClick={publishLayout}
            disabled={publishing}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${published ? "bg-emerald-500 text-white" : "bg-teal-600 hover:bg-teal-700 text-white"}`}
          >
            {publishing ? (
              <Loader2 size={13} className="animate-spin" />
            ) : published ? (
              <Check size={13} />
            ) : (
              <Globe size={13} />
            )}
            {published ? "Publié !" : "Publier"}
          </button>
          <button
            onClick={() => setFullScreenPreview(!fullScreenPreview)}
            className={`p-1.5 rounded-lg text-slate-400 hover:text-slate-600 transition-colors ${fullScreenPreview ? "bg-teal-50 text-teal-700" : ""}`}
            title={fullScreenPreview ? "Quitter l'aperçu plein écran" : "Aperçu plein écran"}
          >
            {fullScreenPreview ? <Maximize2 size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Collapsible */}
        {showSidebar && (
          <div className="w-56 bg-white border-r border-slate-200 flex flex-col flex-shrink-0 transition-all duration-300">
            <div className="p-3 border-b border-slate-100 flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Composants
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowTemplates(!showTemplates)}
                  className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all"
                  title={showTemplates ? "Masquer les modèles" : "Modèles de page"}
                >
                  <FileText size={14} />
                </button>
                <button
                  onClick={() => setShowSidebar(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100"
                  title="Masquer le panneau"
                >
                  <PanelLeftClose size={14} />
                </button>
              </div>
            </div>

            {showTemplates && (
              <div className="p-2 border-b border-slate-100 bg-slate-50">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Modèles rapides
                </p>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {Object.entries(PAGE_TEMPLATES).map(([slug, template]) => (
                    <button
                      key={slug}
                      onClick={() => applyTemplate(template)}
                      className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left hover:bg-teal-50 hover:border-teal-200 border border-transparent transition-all"
                    >
                      <Layout size={14} className="text-teal-600 flex-shrink-0" />
                      <span className="text-xs font-medium text-slate-700 capitalize truncate">
                        {PAGE_SLUGS.find(p => p.slug === slug)?.label || slug}
                      </span>
                      <span className="ml-auto text-xs text-slate-400">{template.length} sections</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-2 space-y-3">
              {Object.entries(SECTION_CATEGORIES).map(([catKey, category]) => (
                <details key={catKey} className="group" open={true}>
                  <summary className="flex items-center gap-2 px-2 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide cursor-pointer select-none">
                    <category.icon size={12} className="text-slate-400" />
                    {category.label}
                    <span className="ml-auto text-slate-300">▸</span>
                  </summary>
                  <div className="space-y-1 mt-1 pl-4 border-l border-slate-100">
                    {category.types.map((type) => {
                      const meta = SECTION_META[type];
                      return (
                        <button
                          key={type}
                          onClick={() => addSection(type)}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left hover:bg-teal-50 hover:border-teal-200 border border-transparent transition-all group"
                        >
                          <span className="text-lg flex-shrink-0">{meta.icon}</span>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-700 group-hover:text-teal-700">
                              {meta.label}
                            </p>
                            <p className="text-xs text-slate-400 truncate">
                              {meta.description}
                            </p>
                          </div>
                          <Plus
                            size={12}
                            className="ml-auto text-slate-300 group-hover:text-teal-500 flex-shrink-0"
                          />
                        </button>
                      );
                    })}
                  </div>
                </details>
              ))}
            </div>
            {isPublished && (
              <div className="p-3 border-t border-slate-100">
                <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-xl border border-emerald-200">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                  <span className="text-xs text-emerald-700 font-medium">
                    Page publiée
                  </span>
                </div>
              </div>
            )}
          </div>
        )} {!showSidebar && (
          <button
            onClick={() => setShowSidebar(true)}
            className="w-8 bg-white border-r border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"
            title="Afficher le panneau"
          >
            <PanelLeftOpen size={18} className="text-slate-400" />
          </button>
        )}

        {/* Canvas Area */}
        <div className="flex-1 overflow-auto p-4 flex justify-center relative">
          {fullScreenPreview && (
            <button
              onClick={() => setFullScreenPreview(false)}
              className="fixed top-4 right-4 z-50 p-2 bg-white rounded-xl shadow-lg hover:bg-slate-50 transition-colors"
              title="Quitter l'aperçu plein écran"
            >
              <Maximize2 size={18} className="text-slate-600" />
            </button>
          )}

          <div
            className={`transition-all duration-300 bg-white shadow-xl rounded-2xl overflow-hidden ${fullScreenPreview ? "w-full max-w-none shadow-none rounded-none" : ""}`}
            style={{
              width: fullScreenPreview ? "100%" : VIEWPORT_WIDTHS[viewport],
              minWidth: fullScreenPreview ? undefined : viewport === "desktop" ? 600 : undefined,
              maxWidth: "100%",
            }}
          >
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 size={28} className="animate-spin text-teal-500" />
              </div>
            ) : sections.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-3">
                <Eye size={36} className="text-slate-300" />
                <p className="text-sm font-medium">Page vide</p>
                <p className="text-xs text-center max-w-48">
                  Cliquez sur un composant dans le panneau gauche pour l'ajouter
                  à la page
                </p>
              </div>
            ) : (
              <div ref={canvasRef}>
                {sections.map((section, idx) => (
                  <div
                    key={section.id}
                    draggable
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDrop={(e) => handleDrop(e, idx)}
                    onClick={() => setSelectedId(section.id)}
                    className={`relative group cursor-pointer transition-all ${
                      selectedId === section.id
                        ? "ring-2 ring-teal-500 ring-offset-0"
                        : "hover:ring-2 hover:ring-slate-300"
                    } ${dragOverIdx === idx && draggedIdx !== idx ? "border-t-2 border-teal-500" : ""}`}
                  >
                    <div
                      className={`absolute top-2 left-2 z-20 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${selectedId === section.id ? "opacity-100" : ""}`}
                    >
                      <div className="flex items-center gap-1 bg-teal-600 text-white text-xs font-semibold px-2 py-1 rounded-lg shadow-sm">
                        <GripVertical size={11} />
                        {SECTION_META[section.type].label}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveSection(idx, -1);
                        }}
                        disabled={idx === 0}
                        className="bg-white shadow-sm rounded p-1 text-slate-500 hover:text-slate-800 disabled:opacity-30"
                        title="Monter"
                      >
                        <ChevronUp size={12} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveSection(idx, 1);
                        }}
                        disabled={idx === sections.length - 1}
                        className="bg-white shadow-sm rounded p-1 text-slate-500 hover:text-slate-800 disabled:opacity-30"
                        title="Descendre"
                      >
                        <ChevronDown size={12} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateSection(section.id);
                        }}
                        className="bg-white shadow-sm rounded p-1 text-slate-500 hover:text-slate-800"
                        title="Dupliquer"
                      >
                        <Copy size={12} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("Supprimer cette section ?")) deleteSection(section.id);
                        }}
                        className="bg-white shadow-sm rounded p-1 text-red-500 hover:text-red-700"
                        title="Supprimer"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    {sectionPreviews[section.id]}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Properties Panel - Collapsible */}
        {showProperties && (
          <div
            className={`w-72 bg-white border-l border-slate-200 flex-shrink-0 transition-all ${
              selectedSection ? "" : "opacity-50"
            }`}
          >
            {selectedSection ? (
              <PropertiesPanel
                section={selectedSection}
                onChange={updateSection}
                onDelete={() => deleteSection(selectedSection.id)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 p-6 text-center">
                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
                  <Eye size={20} className="text-slate-300" />
                </div>
                <p className="text-sm font-medium text-slate-500">
                  Aucun élément sélectionné
                </p>
                <p className="text-xs mt-1">
                  Cliquez sur une section pour modifier ses propriétés
                </p>
              </div>
            )}
          </div>
        )} {!showProperties && selectedSection && (
          <button
            onClick={() => setShowProperties(true)}
            className="w-8 bg-white border-l border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"
            title="Afficher les propriétés"
          >
            <PanelLeftOpen size={18} className="text-slate-400" />
          </button>
        )}
      </div>
    </div>
  );
}
