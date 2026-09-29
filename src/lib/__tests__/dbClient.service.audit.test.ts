import { beforeEach, describe, expect, it, vi } from "vitest";

const { getAuditMock } = vi.hoisted(() => ({ getAuditMock: vi.fn() }));

vi.mock("../../api/client", () => ({
  apiClient: { foncier: { getAudit: getAuditMock } },
}));
vi.mock("../../data/tableClient", () => ({ default: {} }));

import { dataService } from "../dbClient.service";

describe("dataService.getAudit", () => {
  beforeEach(() => getAuditMock.mockReset());

  it("uses the API's page contract and unwraps its paginated response", async () => {
    const auditRows = [{ id: "event-1", entity_type: "foncier_lot" }];
    getAuditMock.mockResolvedValue({
      data: {
        items: auditRows,
        total: 47,
        page: 2,
        page_size: 20,
        total_pages: 3,
      },
      error: null,
      count: 1,
    });

    const result = await dataService.getAudit(2, 20, "update");

    const query = getAuditMock.mock.calls[0][0] as URLSearchParams;
    expect(query.get("page")).toBe("2");
    expect(query.get("page_size")).toBe("20");
    expect(query.get("action")).toBe("update");
    expect(result).toEqual({ data: auditRows, error: null, count: 47 });
  });
});
