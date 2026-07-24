/**
 * DATA LAYER — Media Repository
 */

import { dbClient, withRetry } from "./client";
import type { QueryResult } from "./client";
import type {
  MediaFile,
  MediaUsage,
  MediaVersion,
  MediaAuditAction,
  BrandAssetType,
} from "../types";

type MediaUsageJoin = {
  media_id: string;
  media_files: (MediaFile & { public_url?: string }) | null;
};

export const mediaRepository = {
  async getAll(
    params: {
      includeDeleted?: boolean;
      category?: string;
      orderBy?: string;
      ascending?: boolean;
      offset?: number;
      limit?: number;
    } = {},
  ): Promise<QueryResult<MediaFile[]>> {
    const {
      includeDeleted = false,
      category,
      orderBy = "upload_date",
      ascending = false,
      offset,
      limit,
    } = params;

    return (await withRetry(() => {
      let query = dbClient.from("media_files").select("*");
      query = includeDeleted ? query : query.is("deleted_at", null);
      if (category && category !== "all") {
        query = query.eq("category", category);
      }
      query = query.order(orderBy, { ascending });
      if (typeof offset === "number" && typeof limit === "number") {
        query = query.range(offset, offset + limit - 1);
      }
      return query;
    })) as QueryResult<MediaFile[]>;
  },

  async getTrashed(): Promise<QueryResult<MediaFile[]>> {
    return (await withRetry(() =>
      dbClient
        .from("media_files")
        .select("*")
        .not("deleted_at", "is", null)
        .order("deleted_at", { ascending: false }),
    )) as QueryResult<MediaFile[]>;
  },

  async updateMetadata(
    id: string,
    payload: Record<string, unknown>,
  ): Promise<QueryResult<MediaFile>> {
    return (await withRetry(() =>
      dbClient.from("media_files").update(payload).eq("id", id),
    )) as QueryResult<MediaFile>;
  },

  async softDelete(id: string, deletedAt: string): Promise<QueryResult<null>> {
    return (await withRetry(() =>
      dbClient
        .from("media_files")
        .update({ deleted_at: deletedAt })
        .eq("id", id),
    )) as QueryResult<null>;
  },

  async restore(id: string): Promise<QueryResult<null>> {
    return (await withRetry(() =>
      dbClient.from("media_files").update({ deleted_at: null }).eq("id", id),
    )) as QueryResult<null>;
  },

  async purge(file: MediaFile): Promise<QueryResult<null>> {
    const result = (await withRetry(() =>
      dbClient.from("media_files").delete().eq("id", file.id),
    )) as QueryResult<null>;
    const filesToRemove = [file.filename];
    if (file.thumbnail_url) {
      filesToRemove.push(file.filename.replace(/\.([^.]+)$/, "_thumb.webp"));
    }
    await dbClient.storage.from("media").remove(filesToRemove);
    return result;
  },

  async getById(mediaId: string): Promise<QueryResult<MediaFile>> {
    return (await withRetry(() =>
      dbClient.from("media_files").select("*").eq("id", mediaId).maybeSingle(),
    )) as QueryResult<MediaFile>;
  },

  async logAction(
    action: MediaAuditAction,
    mediaId: string | null,
    actorId: string | null,
    metadata: Record<string, unknown> = {},
  ): Promise<QueryResult<null>> {
    return (await withRetry(() =>
      dbClient.from("media_audit_logs").insert({
        media_id: mediaId,
        action,
        actor_id: actorId,
        metadata,
      }),
    )) as QueryResult<null>;
  },

  async getUsages(mediaId: string): Promise<MediaUsage[]> {
    const result = (await withRetry(() =>
      dbClient
        .from("media_usage")
        .select("*")
        .eq("media_id", mediaId)
        .order("created_at", { ascending: false }),
    )) as QueryResult<MediaUsage[]>;
    const { data } = result;
    return data || [];
  },

  async findUsageSlot(params: {
    entityType: string;
    entityId: string | null;
    usageType: string;
  }): Promise<MediaFile | null> {
    let query = dbClient
      .from("media_usage")
      .select("media_id, media_files!inner(*)")
      .eq("entity_type", params.entityType)
      .eq("usage_type", params.usageType)
      .is("media_files.deleted_at", null);

    if (params.entityId) {
      query = query.eq("entity_id", params.entityId);
    } else {
      query = query.is("entity_id", null);
    }

    const result = (await withRetry(() =>
      query.maybeSingle(),
    )) as QueryResult<MediaUsageJoin>;
    const { data } = result;
    if (!data) return null;
    const file = data.media_files;
    if (
      !file ||
      (file as MediaFile & { deleted_at?: string | null }).deleted_at
    )
      return null;
    if (!file.url && (file as { public_url?: string }).public_url) {
      file.url = (file as { public_url?: string }).public_url!;
    }
    return file;
  },

  async upsertUsage(
    payload: Record<string, unknown>,
  ): Promise<QueryResult<null>> {
    const existing = (await withRetry(() =>
      dbClient
        .from("media_usage")
        .select("id")
        .eq("entity_type", payload.entity_type as string)
        .eq("usage_type", payload.usage_type as string)
        .is("entity_id", payload.entity_id ?? null),
    )) as QueryResult<Array<{ id: string }>>;
    const existingRows = Array.isArray(existing.data) ? existing.data : [];
    if (existingRows.length > 0) {
      return (await withRetry(() =>
        dbClient
          .from("media_usage")
          .update({ media_id: payload.media_id, label: payload.label || "" })
          .eq("id", existingRows[0].id),
      )) as QueryResult<null>;
    }
    return (await withRetry(() =>
      dbClient.from("media_usage").insert(payload),
    )) as QueryResult<null>;
  },

  async deleteUsage(id: string): Promise<QueryResult<null>> {
    return (await withRetry(() =>
      dbClient.from("media_usage").delete().eq("id", id),
    )) as QueryResult<null>;
  },

  async getBrandAsset(type: BrandAssetType): Promise<MediaFile | null> {
    const result = (await withRetry(() =>
      dbClient
        .from("media_files")
        .select("*")
        .eq("is_brand_asset", true)
        .eq("brand_asset_type", type)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    )) as QueryResult<MediaFile>;
    const { data } = result;
    return data || null;
  },

  async clearBrandAssets(type: BrandAssetType): Promise<QueryResult<null>> {
    return (await withRetry(() =>
      dbClient
        .from("media_files")
        .update({ is_brand_asset: false, brand_asset_type: null })
        .eq("brand_asset_type", type),
    )) as QueryResult<null>;
  },

  async assignBrandAsset(
    mediaId: string,
    type: BrandAssetType,
  ): Promise<QueryResult<null>> {
    return (await withRetry(() =>
      dbClient
        .from("media_files")
        .update({
          is_brand_asset: true,
          brand_asset_type: type,
          updated_at: new Date().toISOString(),
        })
        .eq("id", mediaId),
    )) as QueryResult<null>;
  },

  async getMediaUrl(mediaId: string): Promise<string | null> {
    const result = (await withRetry(() =>
      dbClient
        .from("media_files")
        .select("url")
        .eq("id", mediaId)
        .maybeSingle(),
    )) as QueryResult<{ url?: string }>;
    const { data } = result;
    return data?.url || null;
  },

  async getVersions(mediaId: string): Promise<MediaVersion[]> {
    const result = (await withRetry(() =>
      dbClient
        .from("media_versions")
        .select("*")
        .eq("media_id", mediaId)
        .order("replaced_at", { ascending: false }),
    )) as QueryResult<MediaVersion[]>;
    const { data } = result;
    return data || [];
  },

  async getLatestVersionNumber(mediaId: string): Promise<number> {
    const result = (await withRetry(() =>
      dbClient
        .from("media_versions")
        .select("version_number")
        .eq("media_id", mediaId)
        .order("version_number", { ascending: false })
        .limit(1)
        .maybeSingle(),
    )) as QueryResult<{ version_number?: number }>;
    const { data } = result;
    return data?.version_number || 0;
  },

  async createVersion(
    payload: Record<string, unknown>,
  ): Promise<QueryResult<null>> {
    return (await withRetry(() =>
      dbClient.from("media_versions").insert(payload),
    )) as QueryResult<null>;
  },

  async updateAppSetting(
    key: string,
    value: string,
  ): Promise<QueryResult<null>> {
    return (await withRetry(() =>
      dbClient
        .from("app_settings")
        .upsert({ key, value }, { onConflict: "key" }),
    )) as QueryResult<null>;
  },
};
