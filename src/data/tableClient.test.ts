import { beforeEach, describe, expect, it, vi } from "vitest";

const { request } = vi.hoisted(() => ({
  request: vi.fn(),
}));

vi.mock("../api/client.ts", () => ({
  apiClient: { request },
}));

import tableClient from "./tableClient";

describe("tableClient métier", () => {
  beforeEach(() => {
    request.mockReset();
  });

  it("adapte les biens paginés depuis /immobilier/properties", async () => {
    request.mockResolvedValueOnce({
      data: {
        items: [{ id: "property-1", adresse: "Abidjan" }],
        total: 1,
        page: 1,
        page_size: 50,
        total_pages: 1,
      },
      error: null,
      status: 200,
    });

    const result = await tableClient.from("properties").select("*");

    expect(result.data).toEqual([{ id: "property-1", adresse: "Abidjan" }]);
    expect(request).toHaveBeenCalledWith(
      "/immobilier/properties",
    );
  });

  it("utilise la route tâche et transmet le filtre priorité", async () => {
    request.mockResolvedValueOnce({
      data: [{ id: "task-1", priorite: "urgente" }],
      error: null,
      status: 200,
    });

    const result = await tableClient
      .from("tasks")
      .select("*")
      .eq("priorite", "urgente");

    expect(result.data).toEqual([{ id: "task-1", priorite: "urgente" }]);
    expect(request).toHaveBeenCalledWith("/tasks?priorite=urgente");
  });

  it("conserve le total serveur pour les compteurs paginés", async () => {
    request.mockResolvedValueOnce({
      data: { items: [], total: 37, page: 1, page_size: 50, total_pages: 1 },
      error: null,
      status: 200,
    });

    const result = await tableClient
      .from("rent_payments")
      .select("id", { count: "exact", head: true });

    expect(result.data).toBeNull();
    expect(result.count).toBe(37);
    expect(request).toHaveBeenCalledWith("/immobilier/payments");
  });
});
