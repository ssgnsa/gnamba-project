/**
 * DATA LAYER — Employees Repository
 */

import { dbClient, withRetry } from "./client";
import { Employee } from "../types";
import { apiError, fromQueryResult, type ApiResult } from "./result";
import { isValidUuid } from "./validation";

type EmployeeInsert = Omit<Employee, "id" | "created_at" | "updated_at">;
type EmployeeUpdate = Partial<EmployeeInsert>;

export const employeesRepository = {
  async getAll(): Promise<ApiResult<Employee[]>> {
    const result = (await withRetry(() =>
      dbClient.from("employees").select("*").order("nom"),
    )) as { data: Employee[] | null; error: unknown };
    const normalized = fromQueryResult<Employee[]>(
      result,
      "Erreur chargement employés",
    );
    if (
      normalized.error &&
      /404|introuvable|not found/i.test(normalized.error)
    ) {
      return { data: [], error: null };
    }
    if (!normalized.data) {
      return { data: [], error: null };
    }
    return { data: normalized.data, error: null };
  },

  async getById(id: string): Promise<ApiResult<Employee | null>> {
    if (!isValidUuid(id)) {
      return apiError("ID invalide");
    }
    const result = (await withRetry(() =>
      dbClient.from("employees").select("*").eq("id", id).maybeSingle(),
    )) as { data: Employee | null; error: unknown };
    return fromQueryResult<Employee>(result, "Erreur lecture employé");
  },

  async getByEmail(email: string): Promise<ApiResult<Employee | null>> {
    const result = (await withRetry(() =>
      dbClient
        .from("employees")
        .select("id, nom, prenom, email")
        .ilike("email", email)
        .maybeSingle(),
    )) as { data: Employee | null; error: unknown };
    return fromQueryResult<Employee>(
      result,
      "Erreur lecture employé par email",
    );
  },

  async create(payload: EmployeeInsert): Promise<ApiResult<null>> {
    const result = (await withRetry(() =>
      dbClient.from("employees").insert(payload),
    )) as { data: null; error: unknown };
    return fromQueryResult<null>(result, "Erreur création employé");
  },

  async update(id: string, payload: EmployeeUpdate): Promise<ApiResult<null>> {
    if (!isValidUuid(id)) {
      return apiError("ID invalide");
    }
    const result = (await withRetry(() =>
      dbClient.from("employees").update(payload).eq("id", id),
    )) as { data: null; error: unknown };
    return fromQueryResult<null>(result, "Erreur mise à jour employé");
  },

  async delete(id: string): Promise<ApiResult<null>> {
    if (!isValidUuid(id)) {
      return apiError("ID invalide");
    }
    const result = (await withRetry(() =>
      dbClient.from("employees").delete().eq("id", id),
    )) as { data: null; error: unknown };
    return fromQueryResult<null>(result, "Erreur suppression employé");
  },
};
