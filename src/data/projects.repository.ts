/**
 * DATA LAYER — Projects Repository
 * Wrapper métier léger autour de la table `projects`.
 */

import { dbClient, withRetry } from "./client";
import { Project } from "../types";
import { apiError, fromQueryResult, type ApiResult } from "./result";
import { isValidUuid } from "./validation";

type ProjectInsert = Omit<Project, "id" | "created_at" | "updated_at">;
type ProjectUpdate = Partial<ProjectInsert>;

export const projectsRepository = {
  async getAll(): Promise<ApiResult<Project[]>> {
    const result = (await withRetry(() =>
      dbClient
        .from("projects")
        .select("*, clients(nom, prenom)")
        .order("created_at"),
    )) as { data: Project[] | null; error: unknown };
    const normalized = fromQueryResult<Project[]>(
      result,
      "Erreur chargement projets",
    );
    if (!normalized.data) {
      return { data: [], error: null };
    }
    return { data: normalized.data, error: null };
  },

  async getById(id: string): Promise<ApiResult<Project | null>> {
    if (!isValidUuid(id)) {
      return apiError("ID invalide");
    }
    const result = (await withRetry(() =>
      dbClient
        .from("projects")
        .select("*, clients(nom, prenom)")
        .eq("id", id)
        .maybeSingle(),
    )) as { data: Project | null; error: unknown };
    return fromQueryResult<Project>(result, "Erreur lecture projet");
  },

  async create(payload: ProjectInsert): Promise<ApiResult<null>> {
    const result = (await withRetry(() =>
      dbClient.from("projects").insert(payload),
    )) as { data: null; error: unknown };
    return fromQueryResult<null>(result, "Erreur création projet");
  },

  async update(id: string, payload: ProjectUpdate): Promise<ApiResult<null>> {
    if (!isValidUuid(id)) {
      return apiError("ID invalide");
    }
    const result = (await withRetry(() =>
      dbClient.from("projects").update(payload).eq("id", id),
    )) as { data: null; error: unknown };
    return fromQueryResult<null>(result, "Erreur mise à jour projet");
  },

  async delete(id: string): Promise<ApiResult<null>> {
    if (!isValidUuid(id)) {
      return apiError("ID invalide");
    }
    const result = (await withRetry(() =>
      dbClient.from("projects").delete().eq("id", id),
    )) as { data: null; error: unknown };
    return fromQueryResult<null>(result, "Erreur suppression projet");
  },
};
