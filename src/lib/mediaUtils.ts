import { supabase } from "./supabase";
import type {
  MediaFile,
  MediaUsage,
  MediaVersion,
  BrandAssetType,
} from "../types";

export async function getMediaUsages(mediaId: string): Promise<MediaUsage[]> {
  const { data } = await supabase
    .from("media_usage")
    .select("*")
    .eq("media_id", mediaId)
    .order("created_at", { ascending: false });
  return (data as MediaUsage[]) || [];
}

export async function assignMedia(
  mediaId: string,
  entityType: string,
  entityId: string | null,
  usageType: string,
  label?: string,
): Promise<{ error: string | null }> {
  // FIX: Use .eq() instead of .is() when entityId is defined to prevent duplicates
  // .is() is for NULL checks only, .eq() is for value matching
  let query = supabase
    .from("media_usage")
    .select("id")
    .eq("entity_type", entityType)
    .eq("usage_type", usageType);

  if (entityId) {
    query = query.eq("entity_id", entityId);
  } else {
    query = query.is("entity_id", null);
  }

  const existing = await query;

  if (existing.data && existing.data.length > 0) {
    const { error } = await supabase
      .from("media_usage")
      .update({ media_id: mediaId, label: label || "" })
      .eq("id", existing.data[0].id);
    return { error: error?.message || null };
  }

  const { error } = await supabase.from("media_usage").insert({
    media_id: mediaId,
    entity_type: entityType,
    entity_id: entityId,
    usage_type: usageType,
    label: label || "",
  });
  return { error: error?.message || null };
}

export async function removeAssignment(usageId: string): Promise<void> {
  await supabase.from("media_usage").delete().eq("id", usageId);
}

export async function getBrandAsset(
  type: BrandAssetType,
): Promise<MediaFile | null> {
  const { data } = await supabase
    .from("media_files")
    .select("*")
    .eq("is_brand_asset", true)
    .eq("brand_asset_type", type)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as MediaFile) || null;
}

export async function setBrandAsset(
  mediaId: string,
  type: BrandAssetType,
  userId: string,
): Promise<{ error: string | null }> {
  void userId;
  const settingsKeyByType: Record<BrandAssetType, string> = {
    logo_principal: "logo_url",
    logo_secondaire: "brand_logo_dark",
    favicon: "brand_favicon_url",
    watermark: "brand_watermark_url",
  };

  await supabase
    .from("media_files")
    .update({ is_brand_asset: false, brand_asset_type: null })
    .eq("brand_asset_type", type);

  const { error } = await supabase
    .from("media_files")
    .update({
      is_brand_asset: true,
      brand_asset_type: type,
      updated_at: new Date().toISOString(),
    })
    .eq("id", mediaId);

  if (error) return { error: error.message };

  const { data: file } = await supabase
    .from("media_files")
    .select("url")
    .eq("id", mediaId)
    .maybeSingle();

  const settingKey = settingsKeyByType[type];
  if (file && settingKey) {
    await supabase
      .from("app_settings")
      .upsert({ key: settingKey, value: file.url }, { onConflict: "key" });
  }

  await assignMedia(mediaId, "brand", null, type, type.replace("_", " "));
  return { error: null };
}

export async function getUsageForSlot(
  entityType: string,
  entityId: string | null,
  usageType: string,
): Promise<MediaFile | null> {
  let query = supabase
    .from("media_usage")
    .select("media_id, media_files!inner(*)")
    .eq("entity_type", entityType)
    .eq("usage_type", usageType);

  if (entityId) {
    query = query.eq("entity_id", entityId);
  } else {
    query = query.is("entity_id", null);
  }

  const { data } = await query.maybeSingle();
  if (!data) return null;
  return (data as unknown as { media_files: MediaFile }).media_files || null;
}

export async function getMediaVersions(
  mediaId: string,
): Promise<MediaVersion[]> {
  const { data } = await supabase
    .from("media_versions")
    .select("*")
    .eq("media_id", mediaId)
    .order("replaced_at", { ascending: false });
  return (data as MediaVersion[]) || [];
}

export async function replaceMediaFile(
  mediaId: string,
  newFile: File,
  userId: string,
): Promise<{ data: MediaFile | null; error: string | null }> {
  const { data: existing } = await supabase
    .from("media_files")
    .select("*")
    .eq("id", mediaId)
    .maybeSingle();

  if (!existing) return { data: null, error: "Media not found" };

  const { data: versionsData } = await supabase
    .from("media_versions")
    .select("version_number")
    .eq("media_id", mediaId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextVersion =
    ((versionsData as { version_number: number } | null)?.version_number || 0) +
    1;

  await supabase.from("media_versions").insert({
    media_id: mediaId,
    version_number: nextVersion,
    old_url: existing.url,
    old_filename: existing.filename,
    replaced_by: userId,
  });

  const ext = newFile.name.split(".").pop();
  const newFilename = `${existing.category}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("media")
    .upload(newFilename, newFile, { cacheControl: "3600", upsert: false });

  if (uploadError) return { data: null, error: uploadError.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from("media").getPublicUrl(newFilename);

  const { data: updated, error: dbError } = await supabase
    .from("media_files")
    .update({
      filename: newFilename,
      url: publicUrl,
      size: newFile.size,
      type: newFile.type,
      updated_at: new Date().toISOString(),
    })
    .eq("id", mediaId)
    .select()
    .single();

  if (dbError) return { data: null, error: dbError.message };

  if (existing.brand_asset_type) {
    const settingsKeyByType: Record<BrandAssetType, string> = {
      logo_principal: "logo_url",
      logo_secondaire: "brand_logo_dark",
      favicon: "brand_favicon_url",
      watermark: "brand_watermark_url",
    };
    const assetType = existing.brand_asset_type as BrandAssetType;
    const settingKey = settingsKeyByType[assetType];
    if (settingKey) {
      await supabase
        .from("app_settings")
        .upsert({ key: settingKey, value: publicUrl }, { onConflict: "key" });
    }
  }

  return { data: updated as MediaFile, error: null };
}

export const USAGE_TYPE_LABELS: Record<string, string> = {
  logo_principal: "Logo principal",
  logo_secondaire: "Logo secondaire",
  favicon: "Favicon",
  watermark: "Filigrane",
  hero_background: "Fond hero",
  hero_image: "Image hero",
  about_image: "Image À propos",
  service_image: "Image service",
  realisation_image: "Image réalisation",
  cover: "Image de couverture",
  photo: "Photo",
  gallery: "Galerie",
  attestation_scan: "Scan attestation",
};

export const ENTITY_TYPE_LABELS: Record<string, string> = {
  brand: "Actifs de marque",
  site_section: "Site Vitrine",
  project: "Projet BTP",
  property: "Bien immobilier",
  employee: "Employé",
  product: "Produit",
  realisation: "Réalisation",
  foncier_attestation: "Attestation foncière",
};

/**
 * Applique un filigrane sur une image (pour génération de documents)
 * @param canvas - Le canvas contenant l'image originale
 * @param watermarkUrl - L'URL du filigrane
 * @returns Le canvas avec le filigrane appliqué
 */
export async function applyWatermark(
  canvas: HTMLCanvasElement,
  watermarkUrl: string,
  options: {
    opacity?: number;
    position?:
      | "center"
      | "bottom-right"
      | "bottom-left"
      | "top-right"
      | "top-left";
    scale?: number;
  } = {},
): Promise<HTMLCanvasElement> {
  const { opacity = 0.3, position = "center", scale = 0.5 } = options;

  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const watermark = new Image();
  watermark.crossOrigin = "anonymous";

  await new Promise((resolve, reject) => {
    watermark.onload = resolve;
    watermark.onerror = reject;
    watermark.src = watermarkUrl;
  });

  // Calculer la taille du filigrane
  const watermarkWidth = canvas.width * scale;
  const watermarkHeight = (watermark.height / watermark.width) * watermarkWidth;

  // Positionner le filigrane
  let x = 0;
  let y = 0;
  const padding = canvas.width * 0.05;

  switch (position) {
    case "center":
      x = (canvas.width - watermarkWidth) / 2;
      y = (canvas.height - watermarkHeight) / 2;
      break;
    case "bottom-right":
      x = canvas.width - watermarkWidth - padding;
      y = canvas.height - watermarkHeight - padding;
      break;
    case "bottom-left":
      x = padding;
      y = canvas.height - watermarkHeight - padding;
      break;
    case "top-right":
      x = canvas.width - watermarkWidth - padding;
      y = padding;
      break;
    case "top-left":
      x = padding;
      y = padding;
      break;
  }

  // Sauvegarder le contexte
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.drawImage(watermark, x, y, watermarkWidth, watermarkHeight);
  ctx.restore();

  return canvas;
}

/**
 * Génère un canvas avec un filigrane textuel
 * @param text - Le texte du filigrane
 * @param width - Largeur du canvas
 * @param height - Hauteur du canvas
 * @returns Le canvas avec le filigrane textuel
 */
export function createTextWatermark(
  text: string,
  width: number,
  height: number,
  options: {
    color?: string;
    fontSize?: number;
    opacity?: number;
    rotation?: number;
  } = {},
): HTMLCanvasElement {
  const {
    color = "rgba(0, 0, 0, 0.1)",
    fontSize = Math.min(width, height) / 10,
    opacity = 0.3,
    rotation = -45,
  } = options;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (!ctx) return canvas;

  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.fillStyle = color;
  ctx.globalAlpha = opacity;
  ctx.font = `bold ${fontSize}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 0, 0);
  ctx.restore();

  return canvas;
}
