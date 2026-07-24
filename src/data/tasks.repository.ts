/**
 * DATA LAYER — Tasks Repository
 */

import { dbClient, withRetry } from "./client";
import { Task } from "../types";
import { apiError, fromQueryResult, type ApiResult } from "./result";
import { isValidUuid } from "./validation";

type TaskInsert = Omit<Task, "id" | "created_at" | "updated_at">;
type TaskUpdate = Partial<TaskInsert> & {
  updated_at?: string;
};

export interface TaskFilters {
  assigneeId?: string | null;
  includeUnassigned?: boolean;
}

export const tasksRepository = {
  async getAll(filters: TaskFilters = {}): Promise<ApiResult<Task[]>> {
    const result = (await withRetry(() =>
      (() => {
        let query = dbClient
          .from("tasks")
          .select("*, employees(nom, prenom), projects(nom)");
        if (filters.assigneeId) {
          query = filters.includeUnassigned
            ? query.or(
                `assignee_id.eq.${filters.assigneeId},assignee_id.is.null`,
              )
            : query.eq("assignee_id", filters.assigneeId);
        }
        return query.order("created_at", { ascending: false });
      })(),
    )) as { data: Task[] | null; error: unknown };
    const normalized = fromQueryResult<Task[]>(
      result,
      "Erreur chargement tâches",
    );
    if (!normalized.data) {
      return { data: [], error: null };
    }
    return { data: normalized.data, error: null };
  },

  async getById(id: string): Promise<ApiResult<Task | null>> {
    if (!isValidUuid(id)) {
      return apiError("ID invalide");
    }
    const result = (await withRetry(() =>
      dbClient
        .from("tasks")
        .select("*, employees(nom, prenom), projects(nom)")
        .eq("id", id)
        .maybeSingle(),
    )) as { data: Task | null; error: unknown };
    return fromQueryResult<Task>(result, "Erreur lecture tâche");
  },

  async create(payload: TaskInsert): Promise<ApiResult<null>> {
    const result = (await withRetry(() =>
      dbClient.from("tasks").insert(payload),
    )) as { data: null; error: unknown };
    return fromQueryResult<null>(result, "Erreur création tâche");
  },

  async update(id: string, payload: TaskUpdate): Promise<ApiResult<null>> {
    if (!isValidUuid(id)) {
      return apiError("ID invalide");
    }
    const result = (await withRetry(() =>
      dbClient.from("tasks").update(payload).eq("id", id),
    )) as { data: null; error: unknown };
    return fromQueryResult<null>(result, "Erreur mise à jour tâche");
  },

  async delete(id: string): Promise<ApiResult<null>> {
    if (!isValidUuid(id)) {
      return apiError("ID invalide");
    }
    const result = (await withRetry(() =>
      dbClient.from("tasks").delete().eq("id", id),
    )) as { data: null; error: unknown };
    return fromQueryResult<null>(result, "Erreur suppression tâche");
  },
};
