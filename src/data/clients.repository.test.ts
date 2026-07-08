import { describe, it, expect } from "vitest";
import { normalizeClientRow } from "./clients.repository";

describe("clientsRepository", () => {
  it("normalizeClientRow should correctly map parties row to ClientRecord", () => {
    const partyRow = {
      id: "uuid-client-1",
      nom: "Dubois",
      prenom: "Jean",
      email: "jean.dubois@example.com",
      telephone: "+225 07 12 34 56",
      adresse: "123 Rue de la Paix, Abidjan",
      raison_sociale: null,
      party_type: "personne_physique",
      source_table: "clients",
      source_id: "old-client-id-123",
      created_at: "2026-07-01T10:00:00Z",
      updated_at: "2026-07-02T14:30:00Z",
    };

    const result = normalizeClientRow(partyRow);

    expect(result).toMatchObject({
      id: "uuid-client-1",
      nom: "Dubois",
      prenom: "Jean",
      email: "jean.dubois@example.com",
      telephone: "+225 07 12 34 56",
      adresse: "123 Rue de la Paix, Abidjan",
      type_client: "particulier",
      notes: "",
      source_table: "clients",
      source_id: "old-client-id-123",
      created_at: "2026-07-01T10:00:00Z",
      updated_at: "2026-07-02T14:30:00Z",
    });
  });

  it("normalizeClientRow should provide defaults for missing fields", () => {
    const minimalRow = {
      id: "uuid-minimal",
    };

    const result = normalizeClientRow(minimalRow);

    expect(result.id).toBe("uuid-minimal");
    expect(result.nom).toBe("");
    expect(result.prenom).toBe("");
    expect(result.email).toBe("");
    expect(result.telephone).toBe("");
    expect(result.adresse).toBe("");
    expect(result.type_client).toBe("particulier");
    expect(result.notes).toBe("");
  });
});
