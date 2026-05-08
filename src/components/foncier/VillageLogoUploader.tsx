import { useState, useRef, useCallback } from "react";
import { Upload, X, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "../../lib/supabase";

interface VillageLogoUploaderProps {
  villageName: string;
  currentLogoUrl?: string;
  onLogoUploaded: (logoUrl: string) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

interface ValidationState {
  isValid: boolean;
  error?: string;
  fileName?: string;
  fileSize?: number;
  dimensions?: { width: number; height: number };
}

const MAX_FILE_SIZE = 500 * 1024; // 500KB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/svg+xml"];

/**
 * VillageLogoUploader - Composant d'upload de logo pour les villages
 *
 * Fonctionnalités :
 * - Validation côté client (format, taille, ratio)
 * - Preview immédiate
 * - Fallback avec initiales si logo indisponible
 * - Upload vers Supabase Storage
 * - Harmonisation avec primary_color du village
 */
export function VillageLogoUploader({
  villageName,
  currentLogoUrl,
  onLogoUploaded,
  onError,
  disabled = false,
}: VillageLogoUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [validation, setValidation] = useState<ValidationState>({
    isValid: false,
  });
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(
    currentLogoUrl,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Valide le fichier avant upload
   */
  const validateFile = useCallback((file: File): Promise<ValidationState> => {
    return new Promise((resolve) => {
      // Validation type
      if (!ALLOWED_TYPES.includes(file.type)) {
        resolve({
          isValid: false,
          error: "Format non supporté. Utilisez PNG, JPG ou SVG.",
        });
        return;
      }

      // Validation taille
      if (file.size > MAX_FILE_SIZE) {
        resolve({
          isValid: false,
          error: `Fichier trop volumineux (${(file.size / 1024).toFixed(0)}KB). Maximum 500KB.`,
        });
        return;
      }

      // Validation dimensions
      const img = new Image();
      img.onload = () => {
        const aspectRatio = img.width / img.height;
        const isSquare = aspectRatio >= 0.9 && aspectRatio <= 1.1;

        if (!isSquare) {
          resolve({
            isValid: false,
            error: `Ratio invalide (${img.width}x${img.height}). Utilisez une image carrée (1:1).`,
            fileName: file.name,
            fileSize: file.size,
            dimensions: { width: img.width, height: img.height },
          });
          return;
        }

        resolve({
          isValid: true,
          fileName: file.name,
          fileSize: file.size,
          dimensions: { width: img.width, height: img.height },
        });
      };

      img.onerror = () => {
        resolve({
          isValid: false,
          error: "Image corrompue ou illisible.",
        });
      };

      img.src = URL.createObjectURL(file);
    });
  }, []);

  /**
   * Upload du fichier vers Supabase Storage
   */
  const uploadToStorage = useCallback(
    async (file: File): Promise<string> => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Configuration Supabase manquante");
      }

      // Nom du fichier : village-name-logo.timestamp.ext
      const fileExt = file.name.split(".").pop();
      const cleanVillageName = villageName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .trim();
      const fileName = `${cleanVillageName}-logo.${Date.now()}.${fileExt}`;

      // Upload vers le bucket 'village-logos'
      const { error } = await supabase.storage
        .from("village-logos")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (error) {
        // Si le bucket n'existe pas, on essaie de créer une entrée directe en base
        if (error.message.includes("bucket")) {
          if (import.meta.env.DEV)
            console.warn(
              "Bucket village-logos non trouvé, fallback vers URL directe",
            );
          // Fallback : on retourne une URL data (base64) pour les petits fichiers
          return await fileToDataUrl(file);
        }
        throw error;
      }

      // Récupérer l'URL publique
      const { data: urlData } = supabase.storage
        .from("village-logos")
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    },
    [villageName],
  );

  /**
   * Convertit un fichier en Data URL (fallback)
   */
  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  /**
   * Gère l'upload d'un fichier
   */
  const handleFile = useCallback(
    async (file: File) => {
      if (disabled) return;

      setIsUploading(true);
      setValidation({ isValid: false });

      try {
        // Validation
        const validationResult = await validateFile(file);
        setValidation(validationResult);

        if (!validationResult.isValid) {
          onError?.(validationResult.error || "Validation échouée");
          setIsUploading(false);
          return;
        }

        // Upload
        const logoUrl = await uploadToStorage(file);
        setPreviewUrl(logoUrl);
        onLogoUploaded(logoUrl);

        // Reset après succès
        setTimeout(() => {
          setValidation({ isValid: false });
        }, 3000);
      } catch (error: any) {
        if (import.meta.env.DEV) console.error("Upload error:", error);
        const errorMsg = error.message || "Échec de l'upload. Réessayez.";
        setValidation({ isValid: false, error: errorMsg });
        onError?.(errorMsg);
      } finally {
        setIsUploading(false);
      }
    },
    [disabled, validateFile, uploadToStorage, onLogoUploaded, onError],
  );

  /**
   * Gère le drop d'un fichier
   */
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) {
        handleFile(file);
      }
    },
    [handleFile],
  );

  /**
   * Gère la sélection via input file
   */
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile],
  );

  /**
   * Supprime le logo actuel
   */
  const handleRemoveLogo = useCallback(() => {
    setPreviewUrl(undefined);
    setValidation({ isValid: false });
    onLogoUploaded("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [onLogoUploaded]);

  /**
   * Rendu du fallback avec initiales
   */
  const renderFallback = () => {
    const initials = villageName
      .split(" ")
      .map((word) => word[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

    return (
      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center border-4 border-amber-500/30">
        <span className="text-3xl font-bold text-white tracking-wider">
          {initials}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Zone de preview */}
      <div className="flex items-center gap-6">
        {/* Logo actuel ou fallback */}
        <div className="relative group">
          {previewUrl ? (
            <div className="relative">
              <img
                src={previewUrl}
                alt={`Logo de ${villageName}`}
                className="w-32 h-32 object-contain rounded-full border-4 border-amber-500/30 bg-white p-2"
              />
              {!disabled && (
                <button
                  onClick={handleRemoveLogo}
                  className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  title="Supprimer le logo"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ) : (
            renderFallback()
          )}
        </div>

        {/* Zone d'upload */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`flex-1 border-2 border-dashed rounded-xl p-6 text-center transition-all ${
            isDragging
              ? "border-blue-500 bg-blue-50"
              : disabled
                ? "border-gray-200 bg-gray-50"
                : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_TYPES.join(",")}
            onChange={handleFileSelect}
            disabled={disabled || isUploading}
            className="hidden"
          />

          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              <p className="text-sm text-gray-600">Upload en cours...</p>
            </div>
          ) : (
            <>
              <Upload
                size={32}
                className={`mx-auto mb-2 ${
                  isDragging ? "text-blue-500" : "text-gray-400"
                }`}
              />
              <p className="text-sm font-medium text-gray-700">
                Glissez-déposez ou cliquez pour uploader
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PNG, JPG ou SVG • Max 500KB • Format carré recommandé
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                className="mt-3 px-4 py-2 text-sm text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
              >
                Sélectionner un fichier
              </button>
            </>
          )}
        </div>
      </div>

      {/* Messages de validation */}
      {validation.isValid && validation.fileName && (
        <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          <CheckCircle size={16} />
          <span>
            {validation.fileName} ({(validation.fileSize! / 1024).toFixed(0)}KB)
            - {validation.dimensions?.width}x{validation.dimensions?.height}px
          </span>
        </div>
      )}

      {validation.error && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <AlertCircle size={16} />
          <span>{validation.error}</span>
        </div>
      )}

      {/* Recommandations */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
        <p className="text-xs font-medium text-blue-800 mb-1">
          💡 Recommandations :
        </p>
        <ul className="text-xs text-blue-700 space-y-0.5 list-disc list-inside">
          <li>Utilisez un logo au format SVG pour une qualité optimale</li>
          <li>Privilégiez un fond transparent (PNG)</li>
          <li>Format carré 1:1 (ex: 300x300px, 500x500px)</li>
          <li>Évitez les détails trop fins (lisibilité après impression)</li>
        </ul>
      </div>
    </div>
  );
}

/**
 * Composant de fallback pour afficher un logo village
 * (à utiliser dans les attestations, listes, etc.)
 */
interface VillageLogoDisplayProps {
  logoUrl?: string;
  villageName: string;
  size?: "sm" | "md" | "lg";
  primaryColor?: string;
  className?: string;
}

export function VillageLogoDisplay({
  logoUrl,
  villageName,
  size = "md",
  primaryColor = "#1e3a5f",
  className = "",
}: VillageLogoDisplayProps) {
  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-24 h-24",
    lg: "w-32 h-32",
  };

  const sizePixels = {
    sm: 48,
    md: 96,
    lg: 128,
  };

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={`Logo ${villageName}`}
        className={`${sizeClasses[size]} object-contain rounded-full border-2 border-amber-500/30 bg-white p-1 ${className}`}
        style={{ aspectRatio: "1/1" }}
      />
    );
  }

  // Fallback avec initiales
  const initials = villageName
    .split(" ")
    .map((word) => word[0])
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
