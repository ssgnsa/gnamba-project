import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Upload,
  Trash2,
  X,
  Images,
  HardDrive,
  Calendar,
  Grid3x3 as Grid3X3,
  List,
  Star,
  Tag,
  ChevronDown,
  Filter,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import type { MediaFile } from "../types";
import { useBranding } from "../hooks/useBranding";
import MediaCard from "../components/media/MediaCard";
import MediaUploader from "../components/media/MediaUploader";
import MediaDetailModal from "../components/media/MediaDetailModal";
import BrandAssetsManager from "../components/media/BrandAssetsManager";
import SiteMediaAssignments from "../components/media/SiteMediaAssignments";

const CATEGORIES: { value: string; label: string }[] = [
  { value: "all", label: "Toutes" },
  { value: "brand_assets", label: "Actifs de marque" },
  { value: "site_vitrine", label: "Vitrine" },
  { value: "hero_backgrounds", label: "Hero" },
  { value: "realisations", label: "Réalisations" },
  { value: "projets_btp", label: "Projets BTP" },
  { value: "immobilier", label: "Immobilier" },
  { value: "services", label: "Services" },
  { value: "equipe", label: "Équipe" },
  { value: "documents", label: "Documents" },
  { value: "autre", label: "Autre" },
];

const SORT_OPTIONS = [
  { value: "date_desc", label: "Plus récent" },
  { value: "date_asc", label: "Plus ancien" },
  { value: "name_asc", label: "Nom A-Z" },
  { value: "size_desc", label: "Plus grand" },
];

type MainTab = "library" | "brand" | "assignments";

export default function Media() {
  const { primaryColor } = useBranding();
  const [mainTab, setMainTab] = useState<MainTab>("library");
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("date_desc");
  const [tagFilter, setTagFilter] = useState("");
  const [allTags, setAllTags] = useState<string[]>([]);
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showUpload, setShowUpload] = useState(false);
  const [detail, setDetail] = useState<MediaFile | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<MediaFile | null>(null);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    let query = supabase.from("media_files").select("*");

    if (category !== "all") query = query.eq("category", category);

    const [orderCol, orderDir] = (() => {
      switch (sort) {
        case "date_asc":
          return ["upload_date", true];
        case "name_asc":
          return ["original_name", true];
        case "size_desc":
          return ["size", false];
        default:
          return ["upload_date", false];
      }
    })();

    query = query.order(orderCol as string, { ascending: orderDir as boolean });
    const { data } = await query;
    const mediaFiles = (data as MediaFile[]) || [];
    setFiles(mediaFiles);

    const tags = Array.from(
      new Set(mediaFiles.flatMap((f) => f.tags || [])),
    ).sort();
    setAllTags(tags);
    setLoading(false);
  }, [category, sort]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleUploadComplete = (uploaded: MediaFile[]) => {
    setFiles((prev) => [...uploaded, ...prev]);
    setShowUpload(false);
    const newTags = Array.from(
      new Set([...allTags, ...uploaded.flatMap((f) => f.tags || [])]),
    ).sort();
    setAllTags(newTags);
  };

  const handleDelete = async (file: MediaFile) => {
    await supabase.storage.from("media").remove([file.filename]);
    await supabase.from("media_files").delete().eq("id", file.id);
    setFiles((prev) => prev.filter((f) => f.id !== file.id));
    setDeleteConfirm(null);
    if (detail?.id === file.id) setDetail(null);
  };

  const handleUpdate = (updated: MediaFile) => {
    setFiles((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
    if (detail?.id === updated.id) setDetail(updated);
  };

  const filtered = files.filter((f) => {
    const matchesSearch =
      f.original_name.toLowerCase().includes(search.toLowerCase()) ||
      (f.alt_text && f.alt_text.toLowerCase().includes(search.toLowerCase())) ||
      (f.description &&
        f.description.toLowerCase().includes(search.toLowerCase()));
    const matchesTag = !tagFilter || (f.tags && f.tags.includes(tagFilter));
    return matchesSearch && matchesTag;
  });

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestion des médias
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {files.length} image{files.length > 1 ? "s" : ""} ·{" "}
            {formatSize(totalSize)} utilisés
          </p>
        </div>
        {mainTab === "library" && (
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity shadow-sm"
            style={{ backgroundColor: primaryColor }}
          >
            <Upload size={16} />
            Téléverser
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            icon: Images,
            color: "blue",
            value: files.length,
            label: "Images totales",
          },
          {
            icon: HardDrive,
            color: "green",
            value: formatSize(totalSize),
            label: "Stockage utilisé",
          },
          {
            icon: Star,
            color: "amber",
            value: files.filter((f) => f.is_brand_asset).length,
            label: "Actifs de marque",
          },
          {
            icon: Calendar,
            color: "rose",
            value:
              files.length > 0
                ? new Date(files[0].upload_date).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "short",
                  })
                : "—",
            label: "Dernier upload",
          },
        ].map(({ icon: Icon, color, value, label }) => (
          <div
            key={label}
            className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3"
          >
            <div
              className={`w-10 h-10 rounded-xl bg-${color}-50 flex items-center justify-center`}
            >
              <Icon size={18} className={`text-${color}-600`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="border-b border-gray-200">
        <div className="flex gap-1">
          {(
            [
              { id: "library", label: "Bibliothèque", icon: Images },
              { id: "brand", label: "Actifs de marque", icon: Star },
              { id: "assignments", label: "Assignations", icon: Tag },
            ] as {
              id: MainTab;
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
                onClick={() => setMainTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                  mainTab === tab.id
                    ? "text-gray-900"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
                style={
                  mainTab === tab.id
                    ? { borderColor: primaryColor, color: primaryColor }
                    : {}
                }
              >
                <Icon size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {mainTab === "library" && (
        <>
          {showUpload && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-gray-900">
                  Téléverser des images
                </h2>
                <button
                  onClick={() => setShowUpload(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
              <MediaUploader
                onUploadComplete={handleUploadComplete}
                onClose={() => setShowUpload(false)}
              />
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[180px]">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto max-w-lg">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setCategory(c.value)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                      category === c.value
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {c.label}
                    {c.value !== "all" && (
                      <span
                        className={`ml-1 ${category === c.value ? "text-blue-200" : "text-gray-400"}`}
                      >
                        ({files.filter((f) => f.category === c.value).length})
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 ml-auto">
                {allTags.length > 0 && (
                  <div className="relative">
                    <button
                      onClick={() => setShowTagMenu(!showTagMenu)}
                      className={`flex items-center gap-1.5 px-3 py-2 border rounded-lg text-xs font-medium transition-colors ${
                        tagFilter
                          ? "border-blue-400 bg-blue-50 text-blue-700"
                          : "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      <Filter size={12} />
                      {tagFilter ? `#${tagFilter}` : "Tags"}
                      <ChevronDown size={10} />
                    </button>
                    {showTagMenu && (
                      <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-2 z-10 min-w-[150px] max-h-48 overflow-y-auto">
                        <button
                          onClick={() => {
                            setTagFilter("");
                            setShowTagMenu(false);
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
                              setShowTagMenu(false);
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
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 bg-gray-50"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 transition-colors ${viewMode === "grid" ? "bg-blue-600 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}
                  >
                    <Grid3X3 size={14} />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 transition-colors ${viewMode === "list" ? "bg-blue-600 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}
                  >
                    <List size={14} />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <Images size={64} className="mb-4 opacity-20" />
                  <p className="text-base font-medium text-gray-500">
                    {search || tagFilter
                      ? "Aucun résultat pour votre recherche"
                      : "Aucune image dans cette catégorie"}
                  </p>
                  {!search && !tagFilter && (
                    <button
                      onClick={() => setShowUpload(true)}
                      className="text-blue-600 hover:underline text-sm mt-1"
                    >
                      Téléversez vos premières images
                    </button>
                  )}
                </div>
              ) : viewMode === "grid" ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {filtered.map((file) => (
                    <MediaCard
                      key={file.id}
                      file={file}
                      onDetail={setDetail}
                      onDelete={(f) => setDeleteConfirm(f)}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  {filtered.map((file) => (
                    <div
                      key={file.id}
                      onClick={() => setDetail(file)}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group cursor-pointer"
                    >
                      <img
                        src={file.url}
                        alt={file.original_name}
                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {file.original_name}
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-gray-400">
                            {formatSize(file.size)} ·{" "}
                            {new Date(file.upload_date).toLocaleDateString(
                              "fr-FR",
                            )}
                          </p>
                          {file.tags?.slice(0, 3).map((t) => (
                            <span key={t} className="text-xs text-blue-500">
                              #{t}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {file.is_brand_asset && (
                          <Star
                            size={13}
                            className="text-amber-500 fill-amber-500"
                          />
                        )}
                        <span className="text-xs text-gray-500 capitalize hidden sm:block">
                          {file.category.replace(/_/g, " ")}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirm(file);
                          }}
                          className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {filtered.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
                {filtered.length} image{filtered.length > 1 ? "s" : ""} affichée
                {filtered.length > 1 ? "s" : ""}
                {(search || tagFilter) &&
                  ` · filtré par ${[search && `"${search}"`, tagFilter && `#${tagFilter}`].filter(Boolean).join(", ")}`}
              </div>
            )}
          </div>
        </>
      )}

      {mainTab === "brand" && <BrandAssetsManager />}

      {mainTab === "assignments" && <SiteMediaAssignments />}

      {detail && (
        <MediaDetailModal
          file={detail}
          onClose={() => setDetail(null)}
          onDelete={(f) => {
            setDeleteConfirm(f);
            setDetail(null);
          }}
          onUpdate={handleUpdate}
        />
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={20} className="text-red-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 text-center mb-1">
              Supprimer l'image
            </h3>
            <p className="text-sm text-gray-500 text-center mb-5">
              Cette action supprimera définitivement{" "}
              <strong>"{deleteConfirm.original_name}"</strong> de la
              bibliothèque et de tous les emplacements où elle est utilisée.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-xl hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
