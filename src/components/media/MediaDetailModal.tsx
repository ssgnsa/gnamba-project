import { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  Download,
  Copy,
  Check,
  Trash2,
  Tag,
  Info,
  Clock,
  RefreshCw,
  ExternalLink,
  MapPin,
  Save,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import {
  getMediaUsages,
  getMediaVersions,
  replaceMediaFile,
  USAGE_TYPE_LABELS,
  ENTITY_TYPE_LABELS,
} from "../../lib/mediaUtils";
import type { MediaFile, MediaUsage, MediaVersion } from "../../types";

interface MediaDetailModalProps {
  file: MediaFile;
  onClose: () => void;
  onDelete: (file: MediaFile) => void;
  onUpdate: (file: MediaFile) => void;
}

type DetailTab = "info" | "usages" | "versions";

const CATEGORY_LABELS: Record<string, string> = {
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

export default function MediaDetailModal({
  file,
  onClose,
  onDelete,
  onUpdate,
}: MediaDetailModalProps) {
  const { user } = useAuth();
  const [tab, setTab] = useState<DetailTab>("info");
  const [usages, setUsages] = useState<MediaUsage[]>([]);
  const [versions, setVersions] = useState<MediaVersion[]>([]);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [replacing, setReplacing] = useState(false);
  const [altText, setAltText] = useState(file.alt_text || "");
  const [description, setDescription] = useState(file.description || "");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(file.tags || []);
  const replaceRef = useRef<HTMLInputElement>(null);

  const loadUsages = useCallback(async () => {
    const data = await getMediaUsages(file.id);
    setUsages(data);
  }, [file.id]);

  const loadVersions = useCallback(async () => {
    const data = await getMediaVersions(file.id);
    setVersions(data);
  }, [file.id]);

  useEffect(() => {
    if (tab === "usages") void loadUsages();
    if (tab === "versions") void loadVersions();
  }, [tab, loadUsages, loadVersions]);

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const copyUrl = async () => {
    await navigator.clipboard.writeText(file.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const saveMetadata = async () => {
    setSaving(true);
    const { data } = await supabase
      .from("media_files")
      .update({
        alt_text: altText,
        description,
        tags,
        updated_at: new Date().toISOString(),
      })
      .eq("id", file.id)
      .select()
      .single();
    if (data) onUpdate(data as MediaFile);
    setSaving(false);
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, "-");
    if (t && !tags.includes(t)) {
      setTags((prev) => [...prev, t]);
    }
    setTagInput("");
  };

  const removeTag = (t: string) =>
    setTags((prev) => prev.filter((x) => x !== t));

  const handleReplace = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !user) return;
    setReplacing(true);
    const { data, error } = await replaceMediaFile(
      file.id,
      e.target.files[0],
      user.id,
    );
    if (data) onUpdate(data);
    setReplacing(false);
    if (!error) loadVersions();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-gray-900 truncate">
              {file.original_name}
            </h2>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-xs text-gray-400">
                {formatSize(file.size)}
              </span>
              <span className="text-xs text-gray-400">{file.type}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">
                {CATEGORY_LABELS[file.category] || file.category}
              </span>
              {file.is_brand_asset && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium">
                  Actif de marque
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 ml-4">
            <a
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Ouvrir dans un nouvel onglet"
            >
              <ExternalLink size={16} />
            </a>
            <a
              href={file.url}
              download={file.original_name}
              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Télécharger"
            >
              <Download size={16} />
            </a>
            <button
              onClick={() => {
                onDelete(file);
                onClose();
              }}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Supprimer"
            >
              <Trash2 size={16} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-72 flex-shrink-0 bg-gray-50 flex items-center justify-center p-4 border-r border-gray-100">
            <div className="w-full egs-table">
              <img
                src={file.url}
                alt={file.alt_text || file.original_name}
                className="w-full rounded-xl object-contain max-h-64 shadow-sm"
              />
              <div className="mt-3 space-y-2">
                <button
                  onClick={copyUrl}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 hover:border-blue-300 transition-colors"
                >
                  {copied ? (
                    <Check size={13} className="text-green-500" />
                  ) : (
                    <Copy size={13} />
                  )}
                  {copied ? "URL copiée !" : "Copier l'URL"}
                </button>
                <input
                  ref={replaceRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.gif,.svg"
                  className="hidden"
                  onChange={handleReplace}
                />
                <button
                  onClick={() => replaceRef.current?.click()}
                  disabled={replacing}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-amber-50 hover:border-amber-300 transition-colors disabled:opacity-50"
                >
                  <RefreshCw
                    size={13}
                    className={replacing ? "animate-spin" : ""}
                  />
                  {replacing ? "Remplacement..." : "Remplacer l'image"}
                </button>
              </div>
              <p className="text-xs text-gray-400 font-mono break-all mt-3 text-center">
                {file.filename}
              </p>
            </div>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex gap-1 px-6 pt-4 border-b border-gray-100 flex-shrink-0">
              {(
                [
                  { id: "info", label: "Informations", icon: Info },
                  {
                    id: "usages",
                    label: `Usages${usages.length > 0 ? ` (${usages.length})` : ""}`,
                    icon: MapPin,
                  },
                  {
                    id: "versions",
                    label: `Historique${versions.length > 0 ? ` (${versions.length})` : ""}`,
                    icon: Clock,
                  },
                ] as {
                  id: DetailTab;
                  label: string;
                  icon: React.ComponentType<{
                    size?: number | string;
                    className?: string;
                  }>;
                }[]
              ).map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg border-b-2 transition-colors -mb-px ${
                      tab === t.id
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <Icon size={13} />
                    {t.label}
                  </button>
                );
              })}
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {tab === "info" && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      Texte alternatif (SEO)
                    </label>
                    <input
                      value={altText}
                      onChange={(e) => setAltText(e.target.value)}
                      placeholder="Description de l'image pour l'accessibilité..."
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      Description
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Description de l'image..."
                      rows={3}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      <Tag size={11} className="inline mr-1" />
                      Tags
                    </label>
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addTag();
                          }
                        }}
                        placeholder="Ajouter un tag (Entrée pour valider)"
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
                      />
                      <button
                        onClick={addTag}
                        className="px-3 py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Ajouter
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {tags.map((t) => (
                        <span
                          key={t}
                          className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs rounded-full font-medium"
                        >
                          #{t}
                          <button
                            onClick={() => removeTag(t)}
                            className="hover:text-blue-900 transition-colors"
                          >
                            <X size={10} />
                          </button>
                        </span>
                      ))}
                      {tags.length === 0 && (
                        <span className="text-xs text-gray-400">
                          Aucun tag. Ajoutez des tags pour faciliter la
                          recherche.
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                    {[
                      { label: "Taille", value: formatSize(file.size) },
                      { label: "Type", value: file.type },
                      {
                        label: "Uploadé le",
                        value: formatDate(file.upload_date),
                      },
                      {
                        label: "Modifié le",
                        value: formatDate(file.updated_at),
                      },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <p className="text-xs text-gray-400 font-medium">
                          {label}
                        </p>
                        <p className="text-sm text-gray-700 mt-0.5 font-mono">
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 flex justify-end">
                    <button
                      onClick={saveMetadata}
                      disabled={saving}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      <Save size={14} />
                      {saving ? "Enregistrement..." : "Enregistrer"}
                    </button>
                  </div>
                </div>
              )}

              {tab === "usages" && (
                <div className="space-y-3">
                  {usages.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                      <MapPin size={32} className="mx-auto mb-2 opacity-30" />
                      <p className="text-sm">
                        Cette image n'est assignée à aucun élément
                      </p>
                    </div>
                  ) : (
                    usages.map((usage) => (
                      <div
                        key={usage.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {USAGE_TYPE_LABELS[usage.usage_type] ||
                              usage.usage_type}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {ENTITY_TYPE_LABELS[usage.entity_type] ||
                              usage.entity_type}
                            {usage.entity_id &&
                              ` · ${usage.entity_id.slice(0, 8)}...`}
                          </p>
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(usage.created_at).toLocaleDateString(
                            "fr-FR",
                          )}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {tab === "versions" && (
                <div className="space-y-3">
                  {versions.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                      <Clock size={32} className="mx-auto mb-2 opacity-30" />
                      <p className="text-sm">
                        Aucun historique de remplacement
                      </p>
                      <p className="text-xs mt-1">
                        Utilisez "Remplacer l'image" pour créer une nouvelle
                        version
                      </p>
                    </div>
                  ) : (
                    versions.map((v) => (
                      <div
                        key={v.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                            <img
                              src={v.old_url}
                              alt=""
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display =
                                  "none";
                              }}
                            />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700">
                              Version {v.version_number}
                            </p>
                            <p className="text-xs text-gray-400">
                              {new Date(v.replaced_at).toLocaleString("fr-FR")}
                            </p>
                          </div>
                        </div>
                        <a
                          href={v.old_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <ExternalLink size={13} />
                        </a>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
