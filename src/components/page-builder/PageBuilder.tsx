import { useState, useEffect, useCallback, useRef } from "react";
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
} from "lucide-react";
import { supabase } from "../../lib/supabase";
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

const VIEWPORT_WIDTHS: Record<ViewportMode, string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "375px",
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
  const canvasRef = useRef<HTMLDivElement>(null);

  const loadLayout = useCallback(async (slug: string) => {
    setLoading(true);
    setSelectedId(null);
    const { data } = await supabase
      .from("page_layouts")
      .select("*")
      .eq("page_slug", slug)
      .maybeSingle();
    if (data) {
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
    const { error } = await supabase
      .from("page_layouts")
      .upsert(
        {
          page_slug: currentSlug,
          layout_json: sections,
          is_published: isPublished,
        },
        { onConflict: "page_slug" },
      );
    setSaving(false);
    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  };

  const publishLayout = async () => {
    setPublishing(true);
    const { error } = await supabase
      .from("page_layouts")
      .upsert(
        {
          page_slug: currentSlug,
          layout_json: sections,
          is_published: true,
          published_at: new Date().toISOString(),
        },
        { onConflict: "page_slug" },
      );
    setPublishing(false);
    if (!error) {
      setIsPublished(true);
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
          >
            <Undo2 size={15} />
          </button>
          <button
            onClick={redo}
            disabled={historyIdx === history.length - 1}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 disabled:opacity-30 transition-colors"
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
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-56 bg-white border-r border-slate-200 flex flex-col flex-shrink-0">
          <div className="p-3 border-b border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Composants
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {(
              Object.entries(SECTION_META) as [
                SectionType,
                (typeof SECTION_META)[SectionType],
              ][]
            ).map(([type, meta]) => (
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

        <div className="flex-1 overflow-auto p-4 flex justify-center">
          <div
            className="transition-all duration-300 bg-white shadow-xl rounded-2xl overflow-hidden"
            style={{
              width: VIEWPORT_WIDTHS[viewport],
              minWidth: viewport === "desktop" ? 600 : undefined,
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
                      >
                        <ChevronDown size={12} />
                      </button>
                    </div>
                    <SectionPreview section={section} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div
          className={`w-72 bg-white border-l border-slate-200 flex-shrink-0 transition-all ${selectedSection ? "" : "opacity-50"}`}
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
      </div>
    </div>
  );
}
