/**
 * DATA LAYER — Dashboard Repository
 */

import { dbClient, withRetry } from "./client";
import apiClient from "../api/client";
import type { QueryResult } from "./client";

export const dashboardRepository = {
  async getPropertyCount(): Promise<QueryResult<null>> {
    return (await withRetry(() =>
      dbClient.from("properties").select("id", { count: "exact", head: true }),
    )) as QueryResult<null>;
  },

  async getPendingRentPayments(): Promise<
    QueryResult<Array<{ montant: number }>>
  > {
    return (await withRetry(() =>
      dbClient
        .from("rent_payments")
        .select("montant")
        .in("statut", ["en_attente", "retard", "partiel"]),
    )) as QueryResult<Array<{ montant: number }>>;
  },

  async updateProperty(
    id: string,
    payload: Record<string, unknown>,
  ): Promise<QueryResult<null>> {
    const result = await apiClient.immobilier.properties.update(id, payload);
    return {
      data: result.data ? null : null,
      error: result.error,
      count: result.count,
    } as QueryResult<null>;
  },
};
