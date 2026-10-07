/**
 * DATA LAYER — Suppliers Repository
 */

import { dbClient, withRetry } from "./client";
import type { QueryResult } from "./client";
import { Supplier } from "../types";

type SupplierInsert = Omit<Supplier, "id" | "created_at" | "updated_at">;
type SupplierUpdate = Partial<SupplierInsert>;

const normalizeEmailIdentity = (value: string): string =>
  value.trim().toLowerCase();

const normalizePhoneIdentity = (value: string): string => {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";

  const withoutCountryCode = digits.startsWith("225") ? digits.slice(3) : digits;
  const withoutLeadingZero = withoutCountryCode.startsWith("0")
    ? withoutCountryCode.slice(1)
    : withoutCountryCode;

  return withoutLeadingZero;
};

export function normalizeSupplierRow(row: Record<string, unknown>): Supplier {
  return {
    id: typeof row.id === "string" ? row.id : "",
    nom: typeof row.nom === "string" ? row.nom.trim() : "",
    telephone: typeof row.telephone === "string" ? row.telephone.trim() : "",
    email: typeof row.email === "string" ? row.email.trim().toLowerCase() : "",
    adresse: typeof row.adresse === "string" ? row.adresse.trim() : "",
    produits_fournis:
      typeof row.produits_fournis === "string"
        ? row.produits_fournis.trim()
        : "",
    statut:
      row.statut === "inactif" ? "inactif" : ("actif" as const),
    notes: typeof row.notes === "string" ? row.notes.trim() : "",
    created_at: typeof row.created_at === "string" ? row.created_at : "",
    updated_at: typeof row.updated_at === "string" ? row.updated_at : "",
  };
}

export function isSupplierDuplicateCandidate(
  existing: Pick<Supplier, "id" | "email" | "telephone">,
  candidate: Pick<Supplier, "id" | "email" | "telephone">,
): boolean {
  if (existing.id && candidate.id && existing.id === candidate.id) {
    return false;
  }

  const existingEmail = normalizeEmailIdentity(existing.email || "");
  const candidateEmail = normalizeEmailIdentity(candidate.email || "");
  const existingPhone = normalizePhoneIdentity(existing.telephone || "");
  const candidatePhone = normalizePhoneIdentity(candidate.telephone || "");

  if (candidateEmail && existingEmail && candidateEmail === existingEmail) {
    return true;
  }

  if (candidatePhone && existingPhone && candidatePhone === existingPhone) {
    return true;
  }

  return false;
}

const findDuplicateSupplier = async (
  email: string,
  phone: string,
  excludeId?: string | null,
) => {
  if (!email && !phone) return null;

  let query = dbClient.from("suppliers").select("id,email,telephone");
  if (email && phone) {
    query = query.or(`email.eq.${email},telephone.eq.${phone}`);
  } else if (email) {
    query = query.eq("email", email);
  } else {
    query = query.eq("telephone", phone);
  }

  const result = await query.limit(20);
  const rows = Array.isArray(result.data)
    ? (result.data as Record<string, unknown>[])
    : [];

  const candidate = { id: excludeId ?? "", email, telephone: phone };

  return rows.find((row) =>
    isSupplierDuplicateCandidate(
      {
        id: typeof row.id === "string" ? row.id : "",
        email: typeof row.email === "string" ? row.email : "",
        telephone: typeof row.telephone === "string" ? row.telephone : "",
      },
      candidate,
    ),
  );
};

export const suppliersRepository = {
  async getAll(): Promise<QueryResult<Supplier[]>> {
    const result = (await withRetry(() =>
      dbClient.from("suppliers").select("*").order("nom"),
    )) as QueryResult<Record<string, unknown>[]>;
    if (
      result.error &&
      /404|introuvable|not found/i.test(result.error.message)
    ) {
      return { data: [], error: null };
    }
    if (result.error) {
      return { data: null, error: result.error } as QueryResult<Supplier[]>;
    }
    if (!result.data) {
      return { data: [], error: null };
    }
    return {
      data: result.data.map((row) => normalizeSupplierRow(row)),
      error: null,
    };
  },

  async getById(id: string): Promise<QueryResult<Supplier>> {
    const result = (await withRetry(() =>
      dbClient.from("suppliers").select("*").eq("id", id).maybeSingle(),
    )) as QueryResult<Record<string, unknown> | null>;
    if (result.error) {
      return { data: null, error: result.error } as QueryResult<Supplier>;
    }
    if (!result.data) {
      return { data: null, error: null };
    }
    return {
      data: normalizeSupplierRow(result.data),
      error: null,
    };
  },

  async create(payload: SupplierInsert): Promise<QueryResult<null>> {
    return (await withRetry(async () => {
      const duplicate = await findDuplicateSupplier(
        payload.email || "",
        payload.telephone || "",
      );
      if (duplicate) {
        return {
          data: null,
          error: new Error(
            "Un fournisseur avec la même adresse email ou le même téléphone existe déjà.",
          ),
        } as QueryResult<null>;
      }

      return (await dbClient.from("suppliers").insert(payload)) as QueryResult<null>;
    })) as QueryResult<null>;
  },

  async update(
    id: string,
    payload: SupplierUpdate,
  ): Promise<QueryResult<null>> {
    return (await withRetry(async () => {
      if (payload.email || payload.telephone) {
        const duplicate = await findDuplicateSupplier(
          payload.email || "",
          payload.telephone || "",
          id,
        );
        if (duplicate) {
          return {
            data: null,
            error: new Error(
              "Un fournisseur avec la même adresse email ou le même téléphone existe déjà.",
            ),
          } as QueryResult<null>;
        }
      }

      return (await dbClient.from("suppliers").update(payload).eq("id", id)) as QueryResult<null>;
    })) as QueryResult<null>;
  },

  async delete(id: string): Promise<QueryResult<null>> {
    return (await withRetry(() =>
      dbClient.from("suppliers").delete().eq("id", id),
    )) as QueryResult<null>;
  },
};
