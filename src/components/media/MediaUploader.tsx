import { useState, useRef, useCallback } from "react";
import { Upload, X, CheckCircle, AlertCircle, Image, Tag } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import type { MediaCategory, MediaFile } from "../../types";

interface UploadItem {
  file: File;
  progress: number;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
  result?: MediaFile;
}

interface MediaUploaderProps {
  category?: MediaCategory;
  onUploadComplete?: (files: MediaFile[]) => void;
  onClose?: () => void;
}

const CATEGORY_LABELS: Record<MediaCategory, string> = {
  brand_assets: "Actifs de marque",
  site_vitrine: "Site Vitrine",
  hero_backgrounds: "Fonds Hero",
  realisations: "Réalisations",
  projets_btp: "Projets BTP",
  immobilier: "Immobilier",
  services: "Services",
  equipe: "Équipe",
  documents: "Documents",
  autre: "Autre",
};

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "application/pdf",
];
const MAX_SIZE = 10 * 1024 * 1024;

export default function MediaUploader({
  category: defaultCategory = "autre",
  onUploadComplete,
  onClose,
}: MediaUploaderProps) {
  const { user } = useAuth();
  const [dragging, setDragging] = useState(false);
  const [items, setItems] = useState<UploadItem[]>([]);
  const [category, setCategory] = useState<MediaCategory>(defaultCategory);
  const [altText, setAltText] = useState("");
  const [description, setDescription] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((files: FileList | File[]) => {
    const validFiles: UploadItem[] = [];
    Array.from(files).forEach((file) => {
      if (!ACCEPTED_TYPES.includes(file.type)) return;
      if (file.size > MAX_SIZE) return;
      validFiles.push({ file, progress: 0, status: "pending" });
    });
    setItems((prev) => [...prev, ...validFiles]);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      addFiles(e.dataTransfer.files);
    },
    [addFiles],
  );

  const addTag = () => {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, "-");
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
    setTagInput("");
  };

  const removeTag = (t: string) =>
    setTags((prev) => prev.filter((x) => x !== t));

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const uploadAll = async () => {
    if (!user || items.length === 0) return;
    setUploading(true);
    const uploaded: MediaFile[] = [];

    for (let i = 0; i < items.length; i++) {
      if (items[i].status === "done") continue;
      const item = items[i];
      const ext = item.file.name.split(".").pop();
      const filename = `${category}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

      setItems((prev) =>
        prev.map((it, idx) =>
          idx === i ? { ...it, status: "uploading", progress: 10 } : it,
        ),
      );

      const { error: storageError } = await supabase.storage
        .from("media")
        .upload(filename, item.file, { cacheControl: "3600", upsert: false });

      if (storageError) {
        setItems((prev) =>
          prev.map((it, idx) =>
            idx === i
              ? { ...it, status: "error", error: storageError.message }
              : it,
          ),
        );
        continue;
      }

      setItems((prev) =>
        prev.map((it, idx) => (idx === i ? { ...it, progress: 70 } : it)),
      );

      const {
        data: { publicUrl },
      } = supabase.storage.from("media").getPublicUrl(filename);

      const { data: mediaData, error: dbError } = await supabase
        .from("media_files")
        .insert({
          filename,
          original_name: item.file.name,
          url: publicUrl,
          category,
          uploaded_by: user.id,
          size: item.file.size,
          type: item.file.type,
          alt_text: altText,
          description,
          tags,
        })
        .select()
        .single();

      if (dbError) {
        setItems((prev) =>
          prev.map((it, idx) =>
            idx === i ? { ...it, status: "error", error: dbError.message } : it,
          ),
        );
        continue;
      }

      setItems((prev) =>
        prev.map((it, idx) =>
          idx === i
            ? {
                ...it,
                status: "done",
                progress: 100,
                result: mediaData as MediaFile,
              }
            : it,
        ),
      );
      uploaded.push(mediaData as MediaFile);
    }

    setUploading(false);
    if (uploaded.length > 0 && onUploadComplete) {
      onUploadComplete(uploaded);
    }
  };

  const pendingCount = items.filter((i) => i.status === "pending").length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Catégorie
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as MediaCategory)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            {(Object.keys(CATEGORY_LABELS) as MediaCategory[]).map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_LABELS[cat]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Texte alternatif
          </label>
          <input
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
            placeholder="Description pour SEO..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Description
        </label>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description de l'image..."
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          <Tag size={11} className="inline mr-1" />
          Tags
        </label>
        <div className="flex gap-2">
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder="Ajouter un tag..."
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={addTag}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium text-gray-600 transition-colors"
          >
            + Ajouter
          </button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {tags.map((t) => (
              <span
                key={t}
                className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full"
              >
                #{t}
                <button onClick={() => removeTag(t)}>
                  <X size={9} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          dragging
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/50"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.webp,.gif,.svg"
          className="hidden"
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />
        <Upload
          size={32}
          className={`mx-auto mb-3 ${dragging ? "text-blue-500" : "text-gray-400"}`}
        />
        <p className="text-sm font-medium text-gray-700">
          {dragging
            ? "Relâchez pour ajouter"
            : "Glissez-déposez vos images ici"}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          ou cliquez pour sélectionner
        </p>
        <p className="text-xs text-gray-400 mt-2">
          JPG, PNG, WEBP, GIF, SVG — max 10 MB
        </p>
      </div>

      {items.length > 0 && (
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2"
            >
              <div className="w-10 h-10 rounded-lg bg-gray-200 flex-shrink-0 overflow-hidden">
                {item.status !== "error" ? (
                  <img
                    src={URL.createObjectURL(item.file)}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Image size={16} className="text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-700 truncate">
                  {item.file.name}
                </p>
                <p className="text-xs text-gray-400">
                  {formatSize(item.file.size)}
                </p>
                {item.status === "uploading" && (
                  <div className="mt-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                )}
                {item.status === "error" && (
                  <p className="text-xs text-red-500 mt-0.5">{item.error}</p>
                )}
              </div>
              <div className="flex-shrink-0">
                {item.status === "done" && (
                  <CheckCircle size={16} className="text-green-500" />
                )}
                {item.status === "error" && (
                  <AlertCircle size={16} className="text-red-500" />
                )}
                {(item.status === "pending" || item.status === "uploading") && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setItems((prev) => prev.filter((_, i) => i !== idx));
                    }}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        {onClose && (
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            Annuler
          </button>
        )}
        <button
          onClick={uploadAll}
          disabled={uploading || pendingCount === 0}
          className="ml-auto flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Upload size={14} />
          {uploading
            ? "Envoi en cours..."
            : `Envoyer${pendingCount > 0 ? ` (${pendingCount})` : ""}`}
        </button>
      </div>
    </div>
  );
}
