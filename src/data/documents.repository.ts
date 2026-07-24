/**
 * DATA LAYER — Documents Repository
 */

import { dbClient, withRetry } from "./client";
import type { QueryResult } from "./client";
import { Document } from "../types";

type DocumentInsert = Omit<
  Document,
  "id" | "created_at" | "clients" | "projects" | "taille_fichier"
> & {
  taille_fichier?: number;
};
type DocumentUpdate = Partial<DocumentInsert>;

export const documentsRepository = {
  async getAll(): Promise<QueryResult<Document[]>> {
    return (await withRetry(() =>
      dbClient
        .from("documents")
        .select("*, clients(nom, prenom), projects(nom)")
        .order("created_at", { ascending: false }),
    )) as QueryResult<Document[]>;
  },

  async create(payload: DocumentInsert): Promise<QueryResult<null>> {
    return (await withRetry(() =>
      dbClient.from("documents").insert(payload),
    )) as QueryResult<null>;
  },

  async update(
    id: string,
    payload: DocumentUpdate,
  ): Promise<QueryResult<null>> {
    return (await withRetry(() =>
      dbClient.from("documents").update(payload).eq("id", id),
    )) as QueryResult<null>;
  },

  async delete(id: string): Promise<QueryResult<null>> {
    return (await withRetry(() =>
      dbClient.from("documents").delete().eq("id", id),
    )) as QueryResult<null>;
  },
};
