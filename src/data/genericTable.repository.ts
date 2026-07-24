/**
 * DATA LAYER — Generic Table Repository
 */

import { dbClient, withRetry } from "./client";
import type { QueryResult } from "./client";

export const genericTableRepository = {
  async getAll<T = Record<string, unknown>>(
    table: string,
    options?: { select?: string; orderBy?: string; ascending?: boolean },
  ): Promise<QueryResult<T[]>> {
    return (await withRetry(() => {
      let query = dbClient.from(table).select(options?.select || "*");
      if (options?.orderBy) {
        query = query.order(options.orderBy, {
          ascending: options.ascending ?? true,
        });
      }
      return query;
    })) as QueryResult<T[]>;
  },

  async upsert(
    table: string,
    payload: Record<string, unknown>,
  ): Promise<QueryResult<null>> {
    return (await withRetry(() =>
      dbClient.from(table).upsert(payload, { onConflict: "id" }),
    )) as QueryResult<null>;
  },

  async delete(table: string, id: string): Promise<QueryResult<null>> {
    return (await withRetry(() =>
      dbClient.from(table).delete().eq("id", id),
    )) as QueryResult<null>;
  },
};
