import { apiClient } from "../api/client";
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
  // In local mode, audit logs are handled by the backend
  try {
    await apiClient.request('/media/audit', {
      method: 'POST',
      body: JSON.stringify({
        media_id: mediaId,
        action,
        actor_id: actorId,
        metadata,
      }),
    });
  } catch {
    // Ignore audit logging errors
  }
}

export async function getMediaUsages(mediaId: string): Promise<MediaUsage[]> {
  const result = await apiClient.request<MediaUsage[]>(
    `/media/usage?media_id=${encodeURIComponent(mediaId)}`,
  );
  if (result.error || !result.data) return [];
  return result.data;
}

export async function assignMedia(
  mediaId: string,
  entityType: string,
  entityId: string | null,
  usageType: string,
  label?: string,
): Promise<{ error: string | null }> {
  const result = await apiClient.request<{
    status: string;
    message?: string;
  }>("/media/usage", {
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

export async function removeAssignment(
  usageId: string,
): Promise<{ error: string | null }> {
  const result = await apiClient.request<{ status: string }>(
    `/media/usage/${encodeURIComponent(usageId)}`,
    { method: "DELETE" },
  );
  return { error: result.error || null };
}

export async function getBrandAsset(
  type: BrandAssetType,
): Promise<MediaFile | null> {
  const result = await apiClient.request<MediaFile[]>(
    "/media/brand-assets",
  );
  if (result.error || !result.data) return null;
  const match = result.data.find((item) => item.brand_asset_type === type);
  return match ? ({ ...match, url: match.url || "" } as MediaFile) : null;
}

export async function setBrandAsset(
  mediaId: string,
  type: BrandAssetType,
  _userId: string,
): Promise<{ error: string | null }> {
  const settingsKeyByType: Record<BrandAssetType, string> = {
    logo_principal: "logo_url",
    logo_secondaire: "brand_logo_dark",
    favicon: "brand_favicon_url",
    watermark: "brand_watermark_url",
  };

  const clear = await apiClient.request<MediaFile[]>("/media");
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

export async function getUsageForSlot(
  entityType: string,
  entityId: string | null,
  usageType: string,
): Promise<MediaFile | null> {
  const result = await apiClient.request<MediaFile[]>(
    `/media/usage?entity_type=${encodeURIComponent(entityType)}&usage_type=${encodeURIComponent(usageType)}${entityId ? `&entity_id=${encodeURIComponent(entityId)}` : ""}`,
  );
  if (result.error || !result.data || result.data.length === 0) return null;
  return result.data[0] || null;
}

export async function getMediaVersions(
  mediaId: string,
): Promise<MediaVersion[]> {
  const result = await apiClient.request<MediaVersion[]>
    (`/media/${encodeURIComponent(mediaId)}/versions`);
  if (result.error || !result.data) return [];
  return result.data;
}

export async function replaceMediaFile(
  mediaId: string,
  newFile: File,
  _userId: string,
): Promise<{ data: MediaFile | null; error: string | null }> {
  const result = await apiClient.media.replace(mediaId, newFile);
  return {
    data: result.data ?? null,
    error: result.error || null,
  };
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