/**
 * DATA LAYER — CMS Repository
 */

import { dbClient, withRetry } from "./client";
import type { QueryResult } from "./client";

type SiteContentRow = {
  id: string;
  section: string;
  key: string;
  value: string;
  content_type: string;
  label: string;
} & Record<string, unknown>;
type SiteRealisationRow = {
  id: string;
  title: string;
  description: string;
  category: string;
  year: number;
  location: string;
  featured: boolean;
  sort_order: number;
  image_url?: string | null;
} & Record<string, unknown>;
type ContactMessageRow = {
  id: string;
  name: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
} & Record<string, unknown>;

export const cmsRepository = {
  async getSiteContent(): Promise<QueryResult<SiteContentRow[]>> {
    const result = (await withRetry(() =>
      dbClient.from("site_content").select("*").order("section").order("key"),
    )) as QueryResult<SiteContentRow[]>;
    if (
      result.error &&
      /404|introuvable|not found/i.test(result.error.message)
    ) {
      return { data: [], error: null };
    }
    return result;
  },

  async saveSiteContent(id: string, value: string): Promise<QueryResult<null>> {
    return (await withRetry(() =>
      dbClient
        .from("site_content")
        .update({ value, updated_at: new Date().toISOString() })
        .eq("id", id),
    )) as QueryResult<null>;
  },

  async getRealisations(): Promise<QueryResult<SiteRealisationRow[]>> {
    return (await withRetry(() =>
      dbClient.from("site_realisations").select("*").order("sort_order"),
    )) as QueryResult<SiteRealisationRow[]>;
  },

  async saveRealisation(
    payload: Record<string, unknown>,
  ): Promise<QueryResult<null>> {
    return (await withRetry(() =>
      dbClient.from("site_realisations").insert(payload),
    )) as QueryResult<null>;
  },

  async updateRealisation(
    id: string,
    payload: Record<string, unknown>,
  ): Promise<QueryResult<null>> {
    return (await withRetry(() =>
      dbClient.from("site_realisations").update(payload).eq("id", id),
    )) as QueryResult<null>;
  },

  async deleteRealisation(id: string): Promise<QueryResult<null>> {
    return (await withRetry(() =>
      dbClient.from("site_realisations").delete().eq("id", id),
    )) as QueryResult<null>;
  },

  async getContactMessages(): Promise<QueryResult<ContactMessageRow[]>> {
    return (await withRetry(() =>
      dbClient
        .from("contact_messages")
        .select("*")
        .order("created_at"),
    )) as QueryResult<ContactMessageRow[]>;
  },

  async createContactMessage(
    payload: Record<string, unknown>,
  ): Promise<QueryResult<null>> {
    return (await withRetry(() =>
      dbClient.from("contact_messages").insert(payload),
    )) as QueryResult<null>;
  },

  async markContactMessageRead(id: string): Promise<QueryResult<null>> {
    return (await withRetry(() =>
      dbClient.from("contact_messages").update({ status: "read" }).eq("id", id),
    )) as QueryResult<null>;
  },
};
