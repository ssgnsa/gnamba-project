import { useState, useRef, useCallback, useEffect } from "react";
import { Upload, X, CheckCircle, AlertCircle, Image, Tag } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { apiClient } from "../../api/client";
import { isSelfHostedMode } from "../../lib/selfHosted";
import dbClient from "../../data/tableClient";
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
  foncier_villages: "Logos Villages",
  autre: "Autre",
};

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
];
const MAX_SIZE = 10 * 1024 * 1024;
const COMPRESS_TYPES = ["image/jpeg", "image/png", "image/webp"];
const COMPRESS_MAX_PX = 1920;
const THUMB_PX = 320;

interface CompressResult {
  file: File;
  width: number;
  height: number;
}

async function compressToWebP(
  file: File,
  maxPx: number,
  quality: number,
): Promise<CompressResult> {
  return new Promise((resolve) => {
    const img = new window.Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;
      if (width > maxPx || height > maxPx) {
        const ratio = Math.min(maxPx / width, maxPx / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve({
              file,
              width: img.naturalWidth,
              height: img.naturalHeight,
            });
            return;
          }
          const name = file.name.replace(/\.[^.]+$/, ".webp");
          resolve({
            file: new File([blob], name, { type: "image/webp" }),
            width,
            height,
          });
        },
        "image/webp",
        quality,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ file, width: 0, height: 0 });
    };
    img.src = objectUrl;
  });
}

export default function MediaUploader({
  category: defaultCategory = "autre",
  onUploadComplete,
  onClose,
}: MediaUploaderProps) {
  const { user, loading } = useAuth();
  const [dragging, setDragging] = useState(false);
  const [items, setItems] = useState<UploadItem[]>([]);
  const [altText, setAltText] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<Map<number, string>>(
    new Map(),
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  const addFiles = useCallback((files: FileList | File[]) => {
    const validFiles: UploadItem[] = [];
    Array.from(files).forEach((file) => {
      if (!ACCEPTED_TYPES.includes(file.type)) return;
      if (file.size > MAX_SIZE) return;
      validFiles.push({ file, progress: 0, status: "pending" });
    });
    setItems((prev) => {
      const newItems = [...prev, ...validFiles];
      setPreviewUrls((prevUrls) => {
        const map = new Map(prevUrls);
        validFiles.forEach((_, i) => {
          const idx = prev.length + i;
          map.set(idx, URL.createObjectURL(validFiles[i].file));
        });
        return map;
      });
      return newItems;
    });
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      addFiles(e.dataTransfer.files);
    },
    [addFiles],
  );

  const buildAutoAltText = (fileName: string) =>
    fileName.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();

  const addTag = (t: string) => {
    const tag = t.trim().toLowerCase().replace(/\s+/g, "-");
    if (tag && !tags.includes(tag)) setTags((prev) => [...prev, tag]);
  };

  const removeTag = (t: string) => setTags((prev) => prev.filter((x) => x !== t));

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const uploadAll = async () => {
    if (items.length === 0) return;
    setUploading(true);
    const uploaded: MediaFile[] = [];

    for (let i = 0; i < items.length; i++) {
      if (items[i].status === "done") continue;
      const item = items[i];

      setItems((prev) =>
        prev.map((it, idx) =>
          idx === i ? { ...it, status: "uploading", progress: 5 } : it,
        ),
      );

      const canCompress = COMPRESS_TYPES.includes(item.file.type);
      let imgWidth: number | null = null;
      let imgHeight: number | null = null;
      let mainFile: File;
      if (canCompress) {
        const result = await compressToWebP(item.file, COMPRESS_MAX_PX, 0.82);
        mainFile = result.file;
        imgWidth = result.width || null;
        imgHeight = result.height || null;
      } else {
        mainFile = item.file;
      }

      setItems((prev) =>
        prev.map((it, idx) => (idx === i ? { ...it, progress: 15 } : it)),
      );

      if (isSelfHostedMode()) {
        const effectiveAltText = altText || buildAutoAltText(mainFile.name);
        // minimal metadata: only alt_text and tags
        // Ensure we always send a browser `File` instance. Some environments
        // can supply Blobs or other objects (SSR/tools) — coerce to `File`
        // to keep the multipart contract stable.
        let fileToSend: File = mainFile as File;
        try {
          if (!(fileToSend instanceof File)) {
            // coerce: keep original name where possible
            const name = (mainFile as any).name || `upload-${Date.now()}`;
            fileToSend = new File([mainFile as Blob], name, { type: mainFile.type });
          }
        } catch (e) {
          // defensive fallback: create File from blob-like
          const name = (mainFile as any).name || `upload-${Date.now()}`;
          fileToSend = new File([mainFile as Blob], name, { type: mainFile.type });
        }

        const result = await apiClient.media.upload(fileToSend, {
          category: "autre",
          alt_text: effectiveAltText,
          description: "",
          tags,
        });

        if (result.error || !result.data) {
          setItems((prev) =>
            prev.map((it, idx) =>
              idx === i
                ? {
                    ...it,
                    status: "error",
                    error: result.error || "Échec de l'upload",
                  }
                : it,
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
                  result: result.data as MediaFile,
                }
              : it,
          ),
        );
        uploaded.push(result.data as MediaFile);
        continue;
      }

      const ext = mainFile.name.split(".").pop();
      const base = `autre/${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const filename = `${base}.${ext}`;

      const uploadContentType = canCompress
        ? "image/webp"
        : mainFile.type || "application/octet-stream";
      const { error: storageError } = await dbClient.storage
        .from("media")
        .upload(filename, mainFile, {
          cacheControl: "31536000",
          upsert: false,
          contentType: uploadContentType,
        });

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
        prev.map((it, idx) => (idx === i ? { ...it, progress: 60 } : it)),
      );

      const {
        data: { publicUrl },
      } = dbClient.storage.from("media").getPublicUrl(filename);

      let thumbnailUrl: string | null = null;
      let thumbFilename: string | null = null;
      if (canCompress) {
        const { file: thumbFile } = await compressToWebP(
          item.file,
          THUMB_PX,
          0.75,
        );
        thumbFilename = `${base}_thumb.webp`;
        const { error: thumbErr } = await dbClient.storage
          .from("media")
          .upload(thumbFilename, thumbFile, {
            cacheControl: "31536000",
            upsert: false,
            contentType: "image/webp",
          });
        if (!thumbErr) {
          const {
            data: { publicUrl: tUrl },
          } = dbClient.storage.from("media").getPublicUrl(thumbFilename);
          thumbnailUrl = tUrl;
        } else {
          thumbFilename = null;
        }
      }

      setItems((prev) =>
        prev.map((it, idx) => (idx === i ? { ...it, progress: 85 } : it)),
      );

      if (loading) {
        setItems((prev) =>
          prev.map((it, idx) =>
            idx === i
              ? {
                  ...it,
                  status: "error",
                  error: "Vérification de la session en cours…",
                }
              : it,
          ),
        );
        continue;
      }

      if (!user?.id) {
        setItems((prev) =>
          prev.map((it, idx) =>
            idx === i
              ? {
                  ...it,
                  status: "error",
                  error: "Vous devez être connecté pour publier ce fichier.",
                }
              : it,
          ),
        );
        continue;
      }

      const { data: mediaData, error: dbError } = await dbClient
        .from("media_files")
        .insert({
          filename,
          original_name: item.file.name,
          url: publicUrl,
          thumbnail_url: thumbnailUrl,
          category: "autre",
          uploaded_by: user?.id ?? null,
          size: mainFile.size,
          type: mainFile.type,
          alt_text: altText || buildAutoAltText(item.file.name),
          description: "",
          tags,
          width: imgWidth,
          height: imgHeight,
        })
        .select()
        .single();

      if (dbError) {
        const filesToRollback = [filename];
        if (thumbFilename) filesToRollback.push(thumbFilename);
        await dbClient.storage.from("media").remove(filesToRollback);

        setItems((prev) =>
          prev.map((it, idx) =>
            idx === i
              ? {
                  ...it,
                  status: "error",
                  error: `Erreur base de données — fichier supprimé du stockage. (${dbError.message})`,
                }
              : it,
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
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Texte alternatif</label>
        <input
          value={altText}
          onChange={(e) => setAltText(e.target.value)}
          placeholder="Optionnel — description pour SEO..."
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {tags.map((t) => (
              <span key={t} className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">
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
          accept=".jpg,.jpeg,.png,.webp,.gif,.pdf"
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
          JPG, PNG, WEBP, GIF, PDF — max 10 MB
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
                {item.status !== "error" && previewUrls.get(idx) ? (
                  <img
                    src={previewUrls.get(idx)}
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
