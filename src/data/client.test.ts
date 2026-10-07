import { beforeEach, describe, expect, it, vi } from "vitest";

const { request } = vi.hoisted(() => ({
  request: vi.fn(),
}));

vi.mock("../api/client", () => ({
  apiClient: {
    request,
  },
}));

import dataClient from "./client";

describe("dataClient compatibility adapter", () => {
  beforeEach(() => {
    request.mockReset();
  });

  it("supports range pagination on select queries", async () => {
    request.mockResolvedValueOnce({
      data: [
        { id: "1", nom: "A" },
        { id: "2", nom: "B" },
        { id: "3", nom: "C" },
        { id: "4", nom: "D" },
      ],
      error: null,
      status: 200,
    });

    const result = await dataClient
      .from("employees")
      .select("*", { count: "exact" })
      .range(1, 2);

    expect(result.data).toEqual([
      { id: "2", nom: "B" },
      { id: "3", nom: "C" },
    ]);
    expect(result.count).toBe(4);
  });

  it("supports ilike and or filters client-side", async () => {
    request.mockResolvedValueOnce({
      data: [
        { id: "1", email: "alpha@example.com", assignee_id: null },
        { id: "2", email: "beta@example.com", assignee_id: "user-2" },
        { id: "3", email: "gamma@example.com", assignee_id: "user-3" },
      ],
      error: null,
      status: 200,
    });

    const result = await dataClient
      .from("employees")
      .select("*")
      .or("assignee_id.eq.user-2,assignee_id.is.null")
      .ilike("email", "%example.com%");

    expect(result.data).toEqual([
      { id: "1", email: "alpha@example.com", assignee_id: null },
      { id: "2", email: "beta@example.com", assignee_id: "user-2" },
    ]);
  });

  it("hydrates parties with related roles and lead details", async () => {
    request
      .mockResolvedValueOnce({
        data: [{ id: "party-1", nom: "Koffi" }],
        error: null,
        status: 200,
      })
      .mockResolvedValueOnce({
        data: [{ id: "role-1", party_id: "party-1", role: "client" }],
        error: null,
        status: 200,
      })
      .mockResolvedValueOnce({
        data: [{ id: "detail-1", party_id: "party-1", source: "web" }],
        error: null,
        status: 200,
      });

    const result = await dataClient
      .from("parties")
      .select("*, party_roles(*), party_lead_details(*)")
      .eq("party_roles.role", "client");

    expect(result.data).toEqual([
      {
        id: "party-1",
        nom: "Koffi",
        party_roles: [{ id: "role-1", party_id: "party-1", role: "client" }],
        party_lead_details: [
          { id: "detail-1", party_id: "party-1", source: "web" },
        ],
      },
    ]);
  });
});
