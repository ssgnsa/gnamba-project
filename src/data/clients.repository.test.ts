import { describe, it, expect } from "vitest";
import { normalizeClientRow } from "./clients.repository";

describe("clientsRepository", () => {
  it("normalizeClientRow should correctly map API entity rows to ClientRecord", () => {
    const entityRow = {
      id: "uuid-client-1",
      first_name: "Jean",
      last_name: "Dubois",
      email: "jean.dubois@example.com",
      phone: "+225 07 12 34 56",
      address: "123 Rue de la Paix, Abidjan",
      subtype: "particulier",
      entity_metadata: { notes: "Client VIP" },
      created_at: "2026-07-01T10:00:00Z",
      updated_at: "2026-07-02T14:30:00Z",
    };

    const result = normalizeClientRow(entityRow);

    expect(result).toMatchObject({
      id: "uuid-client-1",
      nom: "Dubois",
      prenom: "Jean",
      email: "jean.dubois@example.com",
      telephone: "+225 07 12 34 56",
      adresse: "123 Rue de la Paix, Abidjan",
      type_client: "particulier",
      notes: "Client VIP",
      created_at: "2026-07-01T10:00:00Z",
      updated_at: "2026-07-02T14:30:00Z",
    });
  });

  it("normalizeClientRow should provide defaults for missing fields", () => {
    const minimalRow = { id: "uuid-minimal" };

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
