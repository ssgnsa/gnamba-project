/**
 * DATA LAYER — Visitors Repository
 */

import { dbClient, withRetry } from "./client";
import type { QueryResult } from "./client";
import type { UserProfile, Visite, Visiteur } from "../types";

type VisitorRow = Visiteur;
type VisitRow = Visite;
type EmployeeProfileRow = UserProfile;

export const visitorsRepository = {
  async getVisiteurs(): Promise<QueryResult<VisitorRow[]>> {
    return (await withRetry(() =>
      dbClient
        .from("visiteurs")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(100),
    )) as QueryResult<VisitorRow[]>;
  },

  async getVisitesDuJour(): Promise<QueryResult<VisitRow[]>> {
    return (await withRetry(() =>
      dbClient
        .from("visites_du_jour")
        .select("*")
        .order("date_arrivee", { ascending: false }),
    )) as QueryResult<VisitRow[]>;
  },

  async getVisitesEnCours(): Promise<QueryResult<VisitRow[]>> {
    return (await withRetry(() =>
      dbClient
        .from("visites_en_cours")
        .select("*")
        .order("date_arrivee", { ascending: false }),
    )) as QueryResult<VisitRow[]>;
  },

  async getEmployes(): Promise<QueryResult<EmployeeProfileRow[]>> {
    return (await withRetry(() =>
      dbClient
        .from("user_profiles")
        .select("*")
        .not("role", "eq", "admin")
        .order("full_name"),
    )) as QueryResult<EmployeeProfileRow[]>;
  },

  async upsertVisiteur(
    payload: Record<string, unknown>,
  ): Promise<QueryResult<null>> {
    return (await withRetry(() =>
      dbClient.from("visiteurs").upsert(payload, { onConflict: "id" }),
    )) as QueryResult<null>;
  },

  async deleteVisiteur(id: string): Promise<QueryResult<null>> {
    return (await withRetry(() =>
      dbClient.from("visiteurs").delete().eq("id", id),
    )) as QueryResult<null>;
  },

  async upsertVisite(
    payload: Record<string, unknown>,
  ): Promise<QueryResult<null>> {
    return (await withRetry(() =>
      dbClient.from("visites").upsert(payload, { onConflict: "id" }),
    )) as QueryResult<null>;
  },

  async deleteVisite(id: string): Promise<QueryResult<null>> {
    return (await withRetry(() =>
      dbClient.from("visites").delete().eq("id", id),
    )) as QueryResult<null>;
  },
};
