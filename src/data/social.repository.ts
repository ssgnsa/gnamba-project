/**
 * DATA LAYER — Social Repository
 */

import { dbClient, withRetry } from "./client";
import type { QueryResult } from "./client";

type SocialPlatform = "facebook" | "instagram" | "linkedin" | "x" | "telegram";

type ScheduledPostRow = {
  id: string;
  platform: SocialPlatform;
  content: string;
  [key: string]: unknown;
};

export const socialRepository = {
  async createPost(
    payload: Record<string, unknown>,
  ): Promise<QueryResult<null>> {
    return (await withRetry(() =>
      dbClient.from("social_posts").insert(payload),
    )) as QueryResult<null>;
  },

  async getScheduledPosts(
    nowIso: string,
  ): Promise<QueryResult<ScheduledPostRow[]>> {
    return (await withRetry(() =>
      dbClient
        .from("social_posts")
        .select("*")
        .eq("status", "scheduled")
        .lte("scheduled_at", nowIso)
        .limit(50),
    )) as QueryResult<ScheduledPostRow[]>;
  },

  async updatePost(
    id: string,
    payload: Record<string, unknown>,
  ): Promise<QueryResult<null>> {
    return (await withRetry(() =>
      dbClient.from("social_posts").update(payload).eq("id", id),
    )) as QueryResult<null>;
  },
};
