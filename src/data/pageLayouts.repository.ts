/**
 * DATA LAYER — Page Layouts Repository
 */

import { dbClient, withRetry } from "./client";
import type { QueryResult } from "./client";

type PageLayoutRow = {
  id: string;
  page_slug: string;
  layout_json: unknown;
  is_published: boolean;
  published_at?: string | null;
};

export const pageLayoutsRepository = {
  async getBySlug(pageSlug: string): Promise<QueryResult<PageLayoutRow>> {
    return (await withRetry(() =>
      dbClient
        .from("page_layouts")
        .select("*")
        .eq("page_slug", pageSlug)
        .maybeSingle(),
    )) as QueryResult<PageLayoutRow>;
  },

  async save(
    pageSlug: string,
    layoutJson: unknown,
    isPublished: boolean,
  ): Promise<QueryResult<null>> {
    return (await withRetry(() =>
      dbClient.from("page_layouts").upsert(
        {
          page_slug: pageSlug,
          layout_json: layoutJson,
          is_published: isPublished,
        },
        { onConflict: "page_slug" },
      ),
    )) as QueryResult<null>;
  },

  async publish(
    pageSlug: string,
    layoutJson: unknown,
  ): Promise<QueryResult<null>> {
    return (await withRetry(() =>
      dbClient.from("page_layouts").upsert(
        {
          page_slug: pageSlug,
          layout_json: layoutJson,
          is_published: true,
          published_at: new Date().toISOString(),
        },
        { onConflict: "page_slug" },
      ),
    )) as QueryResult<null>;
  },
};
