/**
 * DATA LAYER — Products Repository
 */

import { dbClient, withRetry } from "./client";
import type { QueryResult } from "./client";
import { Product } from "../types";

type ProductInsert = Omit<Product, "id" | "created_at" | "updated_at">;
type ProductUpdate = Partial<ProductInsert>;

export const productsRepository = {
  async getAll(): Promise<QueryResult<Product[]>> {
    const result = (await withRetry(() =>
      dbClient.from("products").select("*").order("nom"),
    )) as QueryResult<Product[]>;
    if (
      result.error &&
      /404|introuvable|not found/i.test(result.error.message)
    ) {
      return { data: [], error: null };
    }
    return result;
  },

  async getById(id: string): Promise<QueryResult<Product>> {
    return (await withRetry(() =>
      dbClient.from("products").select("*").eq("id", id).maybeSingle(),
    )) as QueryResult<Product>;
  },

  async create(payload: ProductInsert): Promise<QueryResult<null>> {
    return (await withRetry(() =>
      dbClient.from("products").insert(payload),
    )) as QueryResult<null>;
  },

  async update(id: string, payload: ProductUpdate): Promise<QueryResult<null>> {
    return (await withRetry(() =>
      dbClient.from("products").update(payload).eq("id", id),
    )) as QueryResult<null>;
  },

  async delete(id: string): Promise<QueryResult<null>> {
    return (await withRetry(() =>
      dbClient.from("products").delete().eq("id", id),
    )) as QueryResult<null>;
  },
};
