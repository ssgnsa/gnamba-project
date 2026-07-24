/**
 * DATA LAYER — Public Lots Repository
 */

import { dbClient, withRetry } from "./client";
import type { QueryResult } from "./client";
import type { VitrineLot } from "../types";

type PublicLotRow = VitrineLot;
type OpportunityRow = { id: string } & Record<string, unknown>;

export const publicLotsRepository = {
  async getPublishedLots(): Promise<QueryResult<PublicLotRow[]>> {
    return (await withRetry(() =>
      dbClient
        .from("vitrine_lots")
        .select("*")
        .eq("publier_sur_vitrine", true)
        .order("ordre_affichage", { ascending: true })
        .order("created_at", { ascending: false })
        .limit(3),
    )) as QueryResult<PublicLotRow[]>;
  },

  async createOpportunity(
    payload: Record<string, unknown>,
  ): Promise<QueryResult<OpportunityRow>> {
    return (await withRetry(() =>
      dbClient.from("opportunites").insert(payload).select().single(),
    )) as QueryResult<OpportunityRow>;
  },

  async createFollowUpTask(
    payload: Record<string, unknown>,
  ): Promise<QueryResult<null>> {
    return (await withRetry(() =>
      dbClient.from("taches").insert(payload),
    )) as QueryResult<null>;
  },
};
