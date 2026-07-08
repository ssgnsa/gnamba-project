import { describe, it, expect } from "vitest";
import { normalizeTenantRow } from "./tenants.repository";

describe("tenantsRepository", () => {
  it("normalizeTenantRow should correctly map parties row to TenantRecord", () => {
    const partyRow = {
      id: "uuid-tenant-1",
      nom: "Dufour",
      prenom: "Marie",
      email: "marie.dufour@example.com",
      telephone: "+225 08 98 76 54",
      party_type: "personne_physique",
      source_table: "locataires",
      source_id: "old-locataire-id-456",
      created_at: "2026-01-15T08:00:00Z",
      updated_at: "2026-07-02T09:00:00Z",
    };

    const result = normalizeTenantRow(partyRow);

    expect(result).toMatchObject({
      id: "uuid-tenant-1",
      nom: "Dufour",
      prenom: "Marie",
      email: "marie.dufour@example.com",
      telephone: "+225 08 98 76 54",
      property_id: null,
      date_debut_contrat: null,
      date_fin_contrat: null,
      loyer: 0,
      depot_garantie: 0,
      statut: "inactif",
      source_table: "locataires",
      source_id: "old-locataire-id-456",
      created_at: "2026-01-15T08:00:00Z",
      updated_at: "2026-07-02T09:00:00Z",
    });
  });

  it("normalizeTenantRow should provide defaults for missing fields", () => {
    const minimalRow = {
      id: "uuid-tenant-minimal",
    };

    const result = normalizeTenantRow(minimalRow);

    expect(result.id).toBe("uuid-tenant-minimal");
    expect(result.nom).toBe("");
    expect(result.prenom).toBe("");
    expect(result.email).toBe("");
    expect(result.telephone).toBe("");
    expect(result.property_id).toBeNull();
    expect(result.statut).toBe("inactif");
    expect(result.loyer).toBe(0);
    expect(result.depot_garantie).toBe(0);
  });
});
