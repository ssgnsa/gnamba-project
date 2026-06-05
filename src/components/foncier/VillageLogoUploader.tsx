import { useState, useEffect, useCallback } from "react";
import { Image } from "lucide-react";
import { assignMedia, getUsageForSlot } from "../../lib/mediaUtils";
import MediaPicker from "../media/MediaPicker";
import type { MediaFile } from "../../types";

interface VillageLogoUploaderProps {
  villageName: string;
  villageId?: string;
  currentLogoUrl?: string;
  onLogoUploaded: (logoUrl: string) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

/**
 * VillageLogoUploader — Sélecteur de logo village via le module Média centralisé.
 * Utilise MediaPicker (catégorie foncier_villages) + media_usage pour l'association.
 */
export function VillageLogoUploader({
  villageName,
  villageId,
  currentLogoUrl,
  onLogoUploaded,
  onError,
  disabled = false,
}: VillageLogoUploaderProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(currentLogoUrl);
  const [assigning, setAssigning] = useState(false);

  const entityId = (villageId ?? villageName).replace(/^(VILLAGE\s+DE\s+|VILLAGE\s+)/i, '').trim();

  const handleSelect = useCallback(
    async (file: MediaFile) => {
      setPickerOpen(false);
      setAssigning(true);
      try {
        const { error } = await assignMedia(
          file.id,
          "foncier_village",
          entityId,
          "logo",
          `Logo — ${villageName}`,
        );
        if (error) {
          onError?.(error);
          return;
        }
        setPreviewUrl(file.url);
        onLogoUploaded(file.url);
      } catch (err: any) {
        onError?.(err?.message ?? "Erreur lors de l'assignation du logo");
      } finally {
        setAssigning(false);
      }
    },
    [entityId, villageName, onLogoUploaded, onError],
  );

  const handleRemove = useCallback(() => {
    setPreviewUrl(undefined);
    onLogoUploaded("");
  }, [onLogoUploaded]);

  const initials = villageName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-6">
        <div className="relative group flex-shrink-0">
          {previewUrl ? (
            <>
              <img
                src={previewUrl}
                alt={`Logo ${villageName}`}
                className="w-32 h-32 object-contain rounded-full border-4 border-amber-500/30 bg-white p-2"
              />
              {!disabled && (
                <button
                  onClick={handleRemove}
                  className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  title="Retirer le logo"
                >
                  <span className="text-xs font-bold leading-none">✕</span>
                </button>
              )}
            </>
          ) : (
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center border-4 border-amber-500/30">
              <span className="text-3xl font-bold text-white tracking-wider">{initials}</span>
            </div>
          )}
        </div>

        <div className="flex-1 border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
          <Image size={32} className="mx-auto mb-2 text-gray-400" />
          <p className="text-sm font-medium text-gray-700 mb-1">
            Choisissez un logo depuis la bibliothèque média
          </p>
          <p className="text-xs text-gray-500 mb-3">
            Tous les médias sont gérés de façon centralisée
          </p>
          <button
            onClick={() => setPickerOpen(true)}
            disabled={disabled || assigning}
            className="px-4 py-2 text-sm text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
          >
            {assigning ? "Assignation..." : "Ouvrir la bibliothèque"}
          </button>
        </div>
      </div>

      {pickerOpen && (
        <MediaPicker
          defaultCategory="foncier_villages"
          title={`Logo du village — ${villageName}`}
          onSelect={handleSelect}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}

/**
 * VillageLogoDisplay — Affiche le logo d'un village depuis media_usage,
 * avec fallback sur logoUrl direct ou initiales.
 */
interface VillageLogoDisplayProps {
  logoUrl?: string;
  villageName: string;
  villageId?: string;
  size?: "sm" | "md" | "lg";
  primaryColor?: string;
  className?: string;
}

export function VillageLogoDisplay({
  logoUrl,
  villageName,
  villageId,
  size = "md",
  primaryColor = "#1e3a5f",
  className = "",
}: VillageLogoDisplayProps) {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(logoUrl ?? null);

  const entityId = (villageId ?? villageName).replace(/^(VILLAGE\s+DE\s+|VILLAGE\s+)/i, '').trim();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const media = await getUsageForSlot("foncier_village", entityId, "logo");
      if (!cancelled) {
        setResolvedUrl(media?.url ?? logoUrl ?? null);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [entityId, logoUrl]);

  const sizeClasses = { sm: "w-12 h-12", md: "w-24 h-24", lg: "w-32 h-32" };
  const sizePixels = { sm: 48, md: 96, lg: 128 };

  if (resolvedUrl) {
    return (
      <img
        src={resolvedUrl}
        alt={`Logo ${villageName}`}
        className={`${sizeClasses[size]} object-contain rounded-full border-2 border-amber-500/30 bg-white p-1 ${className}`}
        onError={() => setResolvedUrl(null)}
      />
    );
  }

  const initials = villageName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center border-2 border-amber-500/30 ${className}`}
      style={{
        background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`,
        aspectRatio: "1/1",
      }}
    >
      <span
        className="text-white font-bold tracking-wider"
        style={{ fontSize: sizePixels[size] * 0.35 }}
      >
        {initials}
      </span>
    </div>
  );
}
