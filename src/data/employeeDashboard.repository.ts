/**
 * DATA LAYER — Employee Dashboard Repository
 */

import { dbClient, withRetry } from "./client";
import type { QueryResult } from "./client";
import type {
  ActiviteJournal,
  EmployePresence,
  MessageDirection,
  StatsJournalieres,
  Visite,
} from "../types";

export const employeeDashboardRepository = {
  async getPublishedMessages(
    nowIso: string,
  ): Promise<QueryResult<MessageDirection[]>> {
    return (await withRetry(() =>
      dbClient
        .from("messages_direction")
        .select("*")
        .eq("statut", "PUBLIE")
        .lte("date_publication", nowIso)
        .order("date_publication", { ascending: false })
        .limit(50),
    )) as QueryResult<MessageDirection[]>;
  },

  async getMessages(): Promise<QueryResult<MessageDirection[]>> {
    return (await withRetry(() =>
      dbClient
        .from("messages_direction")
        .select("*")
        .order("created_at", { ascending: false }),
    )) as QueryResult<MessageDirection[]>;
  },

  async createMessage(
    payload: Record<string, unknown>,
  ): Promise<QueryResult<null>> {
    return (await withRetry(() =>
      dbClient.from("messages_direction").insert(payload),
    )) as QueryResult<null>;
  },

  async updateMessage(
    id: string,
    payload: Record<string, unknown>,
  ): Promise<QueryResult<null>> {
    return (await withRetry(() =>
      dbClient.from("messages_direction").update(payload).eq("id", id),
    )) as QueryResult<null>;
  },

  async deleteMessage(id: string): Promise<QueryResult<null>> {
    return (await withRetry(() =>
      dbClient.from("messages_direction").delete().eq("id", id),
    )) as QueryResult<null>;
  },

  async toggleMessageStatus(
    id: string,
    statut: string,
  ): Promise<QueryResult<null>> {
    return (await withRetry(() =>
      dbClient.from("messages_direction").update({ statut }).eq("id", id),
    )) as QueryResult<null>;
  },

  async getEmployesEnLigne(): Promise<QueryResult<EmployePresence[]>> {
    return (await withRetry(() =>
      dbClient
        .from("employes_presence")
        .select("*")
        .eq("statut", "EN_LIGNE")
        .order("last_activity", { ascending: false })
        .limit(8),
    )) as QueryResult<EmployePresence[]>;
  },

  async getVisitesEnCours(): Promise<QueryResult<Visite[]>> {
    return (await withRetry(() =>
      dbClient.from("visites_en_cours").select("*").limit(5),
    )) as QueryResult<Visite[]>;
  },

  async getActivitesRecentes(): Promise<QueryResult<ActiviteJournal[]>> {
    return (await withRetry(() =>
      dbClient
        .from("activites_journal")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5),
    )) as QueryResult<ActiviteJournal[]>;
  },

  async getLatestDailyStats(): Promise<QueryResult<StatsJournalieres>> {
    return (await withRetry(() =>
      dbClient
        .from("stats_journalieres")
        .select("*")
        .order("date", { ascending: false })
        .limit(1)
        .maybeSingle(),
    )) as QueryResult<StatsJournalieres>;
  },
};
