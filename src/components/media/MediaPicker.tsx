import { useState, useEffect, useCallback } from "react";
import { X, Search, Upload, Images, Tag, ChevronDown } from "lucide-react";
import { supabase } from "../../lib/supabase";
import type { MediaFile, MediaCategory } from "../../types";
import MediaCard from "./MediaCard";
import MediaUploader from "./MediaUploader";

const CATEGORIES: { value: string; label: string }[] = [
  { value: "all", label: "Toutes les catégories" },
  { value: "brand_assets", label: "Actifs de marque" },
  { value: "site_vitrine", label: "Site Vitrine" },
  { value: "hero_backgrounds", label: "Fonds Hero" },
  { value: "realisations", label: "Réalisations" },
  { value: "projets_btp", label: "Projets BTP" },
  { value: "immobilier", label: "Immobilier" },
  { value: "services", label: "Services" },
  { value: "equipe", label: "Équipe" },
  { value: "documents", label: "Documents" },
  { value: "autre", label: "Autre" },
];

interface MediaPickerProps {
  onSelect: (file: MediaFile) => void;
  onClose: () => void;
  defaultCategory?: MediaCategory;
  title?: string;
}

export default function MediaPicker({
  onSelect,
  onClose,
  defaultCategory,
  title,
}: MediaPickerProps) {
  const [tab, setTab] = useState<"library" | "upload">("library");
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(defaultCategory || "all");
  const [tagFilter, setTagFilter] = useState("");
  const [allTags, setAllTags] = useState<string[]>([]);
  const [selected, setSelected] = useState<MediaFile | null>(null);
  const [showTagFilter, setShowTagFilter] = useState(false);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("media_files")
      .select("*")
      .order("upload_date", { ascending: false });

    if (category && category !== "all") {
      query = query.eq("category", category);
    }

    const { data } = await query;
    const mediaFiles = (data as MediaFile[]) || [];
    setFiles(mediaFiles);

    const tags = Array.from(
      new Set(mediaFiles.flatMap((f) => f.tags || [])),
    ).sort();
    setAllTags(tags);
    setLoading(false);
  }, [category]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const filtered = files.filter((f) => {
    const matchesSearch =
      f.original_name.toLowerCase().includes(search.toLowerCase()) ||
      (f.alt_text && f.alt_text.toLowerCase().includes(search.toLowerCase())) ||
      (f.description &&
        f.description.toLowerCase().includes(search.toLowerCase()));
    const matchesTag = !tagFilter || (f.tags && f.tags.includes(tagFilter));
    return matchesSearch && matchesTag;
  });

  const handleUploadComplete = (uploaded: MediaFile[]) => {
    setFiles((prev) => [...uploaded, ...prev]);
    setTab("library");
  };

  const handleConfirm = () => {
    if (selected) onSelect(selected);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <Images size={18} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                {title || "Bibliothèque Média"}
              </h2>
              <p className="text-xs text-gray-500">
                Sélectionnez un fichier ou téléversez-en un nouveau
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex items-center gap-1 px-6 pt-4 flex-shrink-0">
          <button
            onClick={() => setTab("library")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === "library"
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Bibliothèque
          </button>
          <button
            onClick={() => setTab("upload")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              tab === "upload"
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Upload size={13} />
            Nouveau téléversement
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          {tab === "library" && (
            <>
              <div className="px-6 py-3 flex flex-wrap items-center gap-2 flex-shrink-0">
                <div className="relative flex-1 min-w-[180px]">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    placeholder="Rechercher un fichier..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                  />
                </div>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as MediaCategory)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 bg-gray-50"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
                {allTags.length > 0 && (
                  <div className="relative">
                    <button
                      onClick={() => setShowTagFilter(!showTagFilter)}
                      className={`flex items-center gap-1.5 px-3 py-2 border rounded-lg text-sm transition-colors ${
                        tagFilter
                          ? "border-blue-400 bg-blue-50 text-blue-700"
                          : "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      <Tag size={13} />
                      {tagFilter ? `#${tagFilter}` : "Tags"}
                      <ChevronDown size={12} />
                    </button>
                    {showTagFilter && (
                      <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-2 z-10 min-w-[160px] max-h-48 overflow-y-auto">
                        <button
                          onClick={() => {
                            setTagFilter("");
                            setShowTagFilter(false);
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50 rounded-lg"
                        >
                          Tous les tags
                        </button>
                        {allTags.map((t) => (
                          <button
                            key={t}
                            onClick={() => {
                              setTagFilter(t);
                              setShowTagFilter(false);
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg font-medium"
                          >
                            #{t}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto px-6 pb-4">
                {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <Images size={48} className="mb-3 opacity-30" />
                    <p className="text-sm font-medium">Aucun fichier trouvé</p>
                    <p className="text-xs mt-1">
                      {search || tagFilter
                        ? "Essayez d'autres critères"
                        : "Téléversez des fichiers pour les voir ici"}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-3">
                    {filtered.map((file) => (
                      <MediaCard
                        key={file.id}
                        file={file}
                        selectable
                        selected={selected?.id === file.id}
                        onSelect={(f) => setSelected(f)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {tab === "upload" && (
            <div className="px-6 py-4 flex-1 overflow-y-auto">
              <MediaUploader
                category={defaultCategory}
                onUploadComplete={handleUploadComplete}
              />
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50 flex-shrink-0">
          <div>
            {selected && (
              <div className="flex items-center gap-2">
                <img
                  src={selected.url}
                  alt=""
                  className="w-8 h-8 rounded-lg object-cover"
                />
                <div>
                  <span className="text-sm text-gray-700 font-medium truncate max-w-[200px] block">
                    {selected.original_name}
                  </span>
                  {selected.tags?.length > 0 && (
                    <span className="text-xs text-gray-400">
                      {selected.tags
                        .slice(0, 3)
                        .map((t) => `#${t}`)
                        .join(" ")}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selected}
              className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sélectionner
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
