import { describe, expect, it } from "vitest";
import { normalizeLeadRow } from "./leads.repository";

describe("normalizeLeadRow", () => {
  it("maps party and lead detail rows to the lead shape used by the UI", () => {
    const row = {
      id: "party-1",
      nom: "Koffi",
      prenom: "Jean-Marc",
      email: "jean@example.com",
      telephone: "+2250700000000",
      adresse: "Abidjan",
      source_table: "leads",
      source_id: "lead-1",
      created_at: "2026-01-01T00:00:00.000Z",
      party_lead_details: [
        {
          source: "web",
          source_page: "/contact",
          source_form: "contact",
          score: 88,
          status: "active",
          channels_optin: {
            sms: true,
            whatsapp: true,
            email: false,
            telegram: false,
          },
          tags: ["vip"],
          last_interaction_at: "2026-01-02T00:00:00.000Z",
          created_at: "2026-01-01T00:00:00.000Z",
        },
      ],
    };

    expect(normalizeLeadRow(row as any)).toEqual(
      expect.objectContaining({
        id: "party-1",
        phone: "+2250700000000",
        first_name: "Jean-Marc",
        last_name: "Koffi",
        email: "jean@example.com",
        source: "web",
        source_page: "/contact",
        source_form: "contact",
        status: "active",
        score: 88,
        tags: ["vip"],
      }),
    );
  });
});
