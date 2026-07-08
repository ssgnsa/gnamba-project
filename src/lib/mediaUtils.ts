import { apiClient } from "../api/client";
import { isSelfHostedMode } from "./selfHosted";
import dbClient from "../data/tableClient";
import type {
  MediaFile,
  MediaUsage,
  MediaVersion,
  MediaAuditAction,
  BrandAssetType,
} from "../types";

export async function logMediaAction(
  action: MediaAuditAction,
  mediaId: string | null,
  actorId: string | null,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  if (isSelfHostedMode()) return;

  await dbClient.from("media_audit_logs").insert({
    media_id: mediaId,
    action,
    actor_id: actorId,
    metadata,
  });
}

export async function getMediaUsages(mediaId: string): Promise<MediaUsage[]> {
  if (isSelfHostedMode()) {
    const result = await apiClient.request<MediaUsage[]>(
      `/api/v1/media/usage?media_id=${encodeURIComponent(mediaId)}`,
    );
    if (result.error || !result.data) return [];
    return result.data;
  }

  const { data } = await dbClient
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
  if (isSelfHostedMode()) {
    const result = await apiClient.request<{
      status: string;
      message?: string;
    }>("/api/v1/media/usage", {
      method: "POST",
      body: JSON.stringify({
        media_id: mediaId,
        entity_type: entityType,
        entity_id: entityId,
        usage_type: usageType,
        label: label || "",
      }),
    });
    return { error: result.error || null };
  }

  let query = dbClient
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
    const { error } = await dbClient
      .from("media_usage")
      .update({ media_id: mediaId, label: label || "" })
      .eq("id", existing.data[0].id);
    return { error: error?.message || null };
  }

  const { error } = await dbClient.from("media_usage").insert({
    media_id: mediaId,
    entity_type: entityType,
    entity_id: entityId,
    usage_type: usageType,
    label: label || "",
  });
  return { error: error?.message || null };
}

export async function removeAssignment(
  usageId: string,
): Promise<{ error: string | null }> {
  if (isSelfHostedMode()) {
    const result = await apiClient.request<{ status: string }>(
      `/api/v1/media/usage/${encodeURIComponent(usageId)}`,
      { method: "DELETE" },
    );
    return { error: result.error || null };
  }

  const { error } = await dbClient
    .from("media_usage")
    .delete()
    .eq("id", usageId);
  return { error: error?.message || null };
}

export async function getBrandAsset(
  type: BrandAssetType,
): Promise<MediaFile | null> {
  if (isSelfHostedMode()) {
    const result = await apiClient.request<MediaFile[]>(
      "/api/v1/media/brand-assets",
    );
    if (result.error || !result.data) return null;
    const match = result.data.find((item) => item.brand_asset_type === type);
    return match ? ({ ...match, url: match.url || "" } as MediaFile) : null;
  }

  const { data } = await dbClient
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
  const settingsKeyByType: Record<BrandAssetType, string> = {
    logo_principal: "logo_url",
    logo_secondaire: "brand_logo_dark",
    favicon: "brand_favicon_url",
    watermark: "brand_watermark_url",
  };

  if (isSelfHostedMode()) {
    const clear = await apiClient.request<MediaFile[]>("/api/v1/media");
    if (clear.data) {
      const previous = clear.data.filter((item) => item.brand_asset_type === type);
      for (const item of previous) {
        await apiClient.media.update(item.id, {
          is_brand_asset: false,
          brand_asset_type: null,
        });
      }
    }

    const assign = await apiClient.media.update(mediaId, {
      is_brand_asset: true,
      brand_asset_type: type,
    });

    if (assign.error || !assign.data) {
      return { error: assign.error || "Impossible d'assigner l'actif de marque." };
    }

    const settingKey = settingsKeyByType[type];
    if (settingKey) {
      const setting = await apiClient.settings.upsert([
        { key: settingKey, value: assign.data.url || "" },
      ]);
      if (setting.error) return { error: setting.error };
    }

    const usage = await assignMedia(
      mediaId,
      "brand",
      null,
      type,
      type.replace("_", " "),
    );
    return { error: usage.error };
  }

  const { error: clearError } = await dbClient
    .from("media_files")
    .update({ is_brand_asset: false, brand_asset_type: null })
    .eq("brand_asset_type", type);

  if (clearError) {
    return { error: clearError.message };
  }

  const { error: assignError } = await dbClient
    .from("media_files")
    .update({
      is_brand_asset: true,
      brand_asset_type: type,
      updated_at: new Date().toISOString(),
    })
    .eq("id", mediaId);

  if (assignError) {
    return { error: assignError.message };
  }

  const { data: file, error: fileError } = await dbClient
    .from("media_files")
    .select("url")
    .eq("id", mediaId)
    .maybeSingle();

  if (fileError) {
    return { error: fileError.message };
  }

  const settingKey = settingsKeyByType[type];
  if (file && settingKey) {
    const { error: settingsError } = await dbClient
      .from("app_settings")
      .upsert({ key: settingKey, value: file.url }, { onConflict: "key" });

    if (settingsError) {
      return { error: settingsError.message };
    }
  }

  const { error: usageError } = await assignMedia(
    mediaId,
    "brand",
    null,
    type,
    type.replace("_", " "),
  );

  if (usageError) {
    return { error: usageError };
  }

  try {
    await logMediaAction("metadata_update", mediaId, userId, {
      brand_asset_type: type,
    });
  } catch (logError) {
    if (import.meta.env.DEV) {
      console.warn("Impossible d'enregistrer l'audit du média:", logError);
    }
  }

  return { error: null };
}

export async function getUsageForSlot(
  entityType: string,
  entityId: string | null,
  usageType: string,
): Promise<MediaFile | null> {
  if (isSelfHostedMode()) {
    const result = await apiClient.request<MediaFile[]>(
      `/api/v1/media/usage?entity_type=${encodeURIComponent(entityType)}&usage_type=${encodeURIComponent(usageType)}${entityId ? `&entity_id=${encodeURIComponent(entityId)}` : ""}`,
    );
    if (result.error || !result.data || result.data.length === 0) return null;
    return result.data[0] || null;
  }

  let query = dbClient
    .from("media_usage")
    .select("media_id, media_files!inner(*)")
    .eq("entity_type", entityType)
    .eq("usage_type", usageType)
    .is("media_files.deleted_at", null);

  if (entityId) {
    query = query.eq("entity_id", entityId);
  } else {
    query = query.is("entity_id", null);
  }

  const { data } = await query.maybeSingle();
  if (!data) return null;
  const file = (
    data as unknown as { media_files: MediaFile & { public_url?: string } }
  ).media_files;
  if (!file || (file as MediaFile & { deleted_at?: string | null }).deleted_at)
    return null;
  // Compatibilité ancien schéma : certaines images ont public_url mais url vide
  if (!file.url && (file as { public_url?: string }).public_url) {
    file.url = (file as { public_url?: string }).public_url!;
  }
  return file;
}

export async function getMediaVersions(
  mediaId: string,
): Promise<MediaVersion[]> {
  if (isSelfHostedMode()) {
    return [];
  }

  const { data } = await dbClient
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
  if (isSelfHostedMode()) {
    const result = await apiClient.media.replace(mediaId, newFile);
    return {
      data: result.data ?? null,
      error: result.error || null,
    };
  }

  const { data: existing } = await dbClient
    .from("media_files")
    .select("*")
    .eq("id", mediaId)
    .maybeSingle();

  if (!existing) return { data: null, error: "Media not found" };

  const { data: versionsData } = await dbClient
    .from("media_versions")
    .select("version_number")
    .eq("media_id", mediaId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextVersion =
    ((versionsData as { version_number: number } | null)?.version_number || 0) +
    1;

  await dbClient.from("media_versions").insert({
    media_id: mediaId,
    version_number: nextVersion,
    old_url: existing.url,
    old_filename: existing.filename,
    replaced_by: userId,
  });

  const ext = newFile.name.split(".").pop();
  const newFilename = `${existing.category}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

  const { error: uploadError } = await dbClient.storage
    .from("media")
    .upload(newFilename, newFile, {
      cacheControl: "31536000",
      upsert: false,
      contentType: newFile.type,
    });

  if (uploadError) return { data: null, error: uploadError.message };

  const {
    data: { publicUrl },
  } = dbClient.storage.from("media").getPublicUrl(newFilename);

  const { data: updated, error: dbError } = await dbClient
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

  if (dbError) {
    // ROLLBACK : supprimer le nouveau fichier du Storage car la DB a échoué
    await dbClient.storage.from("media").remove([newFilename]);
    return { data: null, error: dbError.message };
  }

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
      await dbClient
        .from("app_settings")
        .upsert({ key: settingKey, value: publicUrl }, { onConflict: "key" });
    }
  }

  await logMediaAction("replace", mediaId, userId, {
    old_filename: existing.filename,
    new_filename: newFilename,
    old_url: existing.url,
  });

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
  foncier_village: "Village (Logo)",
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
