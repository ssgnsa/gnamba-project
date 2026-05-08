import { useState } from "react";
import { Trash2, Eye, Check, Copy, Star, Tag, FileText } from "lucide-react";
import type { MediaFile } from "../../types";

const CATEGORY_LABELS: Record<string, string> = {
  brand_assets: "Actifs de marque",
  site_vitrine: "Vitrine",
  hero_backgrounds: "Hero",
  realisations: "Réalisations",
  projets_btp: "Projets BTP",
  immobilier: "Immobilier",
  services: "Services",
  equipe: "Équipe",
  documents: "Documents",
  autre: "Autre",
};

const CATEGORY_COLORS: Record<string, string> = {
  brand_assets: "bg-amber-100 text-amber-700",
  site_vitrine: "bg-blue-100 text-blue-700",
  hero_backgrounds: "bg-sky-100 text-sky-700",
  realisations: "bg-amber-100 text-amber-700",
  projets_btp: "bg-orange-100 text-orange-700",
  immobilier: "bg-green-100 text-green-700",
  services: "bg-cyan-100 text-cyan-700",
  equipe: "bg-pink-100 text-pink-700",
  documents: "bg-gray-100 text-gray-700",
  autre: "bg-slate-100 text-slate-700",
};

interface MediaCardProps {
  file: MediaFile;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (file: MediaFile) => void;
  onDelete?: (file: MediaFile) => void;
  onPreview?: (file: MediaFile) => void;
  onDetail?: (file: MediaFile) => void;
}

export default function MediaCard({
  file,
  selectable,
  selected,
  onSelect,
  onDelete,
  onPreview,
  onDetail,
}: MediaCardProps) {
  const [copied, setCopied] = useState(false);
  const [imgError, setImgError] = useState(false);
  const isImage =
    file.type?.startsWith("image/") ||
    /\.(png|jpe?g|gif|webp|svg)$/i.test(file.url || "");

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const copyUrl = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(file.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClick = () => {
    if (selectable && onSelect) onSelect(file);
    else if (onDetail) onDetail(file);
  };

  return (
    <div
      onClick={handleClick}
      className={`group relative rounded-xl overflow-hidden bg-white border-2 transition-all duration-200 ${
        selectable || onDetail ? "cursor-pointer" : ""
      } ${
        selected
          ? "border-blue-500 shadow-lg shadow-blue-100"
          : "border-gray-200 hover:border-gray-300 hover:shadow-md"
      }`}
    >
      <div className="aspect-square bg-gray-100 overflow-hidden relative">
        {isImage && !imgError ? (
          <img
            src={file.url}
            alt={file.alt_text || file.original_name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-2">
            <FileText size={28} />
            <span className="text-[10px] uppercase tracking-wide text-gray-400">
              {file.type?.includes("pdf") ? "PDF" : "Fichier"}
            </span>
          </div>
        )}

        {file.is_brand_asset && (
          <div className="absolute top-2 left-2">
            <span className="flex items-center gap-1 bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded-md font-medium shadow-sm">
              <Star size={9} />
              Actif de marque
            </span>
          </div>
        )}

        {selected && (
          <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center shadow-lg">
              <Check size={16} className="text-white" />
            </div>
          </div>
        )}

        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
          {onPreview && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPreview(file);
              }}
              className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors shadow-sm"
              title="Aperçu"
            >
              <Eye size={14} className="text-gray-700" />
            </button>
          )}
          <button
            onClick={copyUrl}
            className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors shadow-sm"
            title="Copier l'URL"
          >
            {copied ? (
              <Check size={14} className="text-green-600" />
            ) : (
              <Copy size={14} className="text-gray-700" />
            )}
          </button>
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(file);
              }}
              className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-red-50 transition-colors shadow-sm"
              title="Supprimer"
            >
              <Trash2 size={14} className="text-red-500" />
            </button>
          )}
        </div>
      </div>

      <div className="p-2.5">
        <p
          className="text-xs font-medium text-gray-800 truncate"
          title={file.original_name}
        >
          {file.original_name}
        </p>
        <div className="flex items-center justify-between mt-1">
          <span
            className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${CATEGORY_COLORS[file.category] || CATEGORY_COLORS.autre}`}
          >
            {CATEGORY_LABELS[file.category] || file.category}
          </span>
          <span className="text-xs text-gray-400">{formatSize(file.size)}</span>
        </div>
        {file.tags && file.tags.length > 0 && (
          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
            <Tag size={9} className="text-gray-300 flex-shrink-0" />
            {file.tags.slice(0, 3).map((t) => (
              <span key={t} className="text-xs text-gray-400">
                #{t}
              </span>
            ))}
            {file.tags.length > 3 && (
              <span className="text-xs text-gray-300">
                +{file.tags.length - 3}
              </span>
            )}
          </div>
        )}
        <p className="text-xs text-gray-400 mt-1">
          {formatDate(file.upload_date)}
        </p>
      </div>
    </div>
  );
}
