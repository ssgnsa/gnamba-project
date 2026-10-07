/**
 * DATA LAYER — Finance Repository
 */

import { dbClient, withRetry } from "./client";
import type { QueryResult } from "./client";
import { Finance } from "../types";

type FinanceInsert = Omit<Finance, "id" | "created_at" | "updated_at">;
type FinanceUpdate = Partial<FinanceInsert>;

export const financeRepository = {
  async getAll(): Promise<QueryResult<Finance[]>> {
    return (await withRetry(() =>
      dbClient
        .from("finances")
        .select("*, clients(nom, prenom), projects(nom)")
        .order("date_transaction", { ascending: false }),
    )) as QueryResult<Finance[]>;
  },

  async getById(id: string): Promise<QueryResult<Finance>> {
    return (await withRetry(() =>
      dbClient
        .from("finances")
        .select("*, clients(nom, prenom), projects(nom)")
        .eq("id", id)
        .maybeSingle(),
    )) as QueryResult<Finance>;
  },

  async create(payload: FinanceInsert): Promise<QueryResult<null>> {
    return (await withRetry(() =>
      dbClient.from("finances").insert(payload),
    )) as QueryResult<null>;
  },

  async update(id: string, payload: FinanceUpdate): Promise<QueryResult<null>> {
    return (await withRetry(() =>
      dbClient.from("finances").update(payload).eq("id", id),
    )) as QueryResult<null>;
  },

  async delete(id: string): Promise<QueryResult<null>> {
    return (await withRetry(() =>
      dbClient.from("finances").delete().eq("id", id),
    )) as QueryResult<null>;
  },
};
