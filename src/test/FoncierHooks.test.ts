import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

// Mock des dépendances
const mockDataClient = {
  rpc: vi.fn(),
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        order: vi.fn(() => ({
          range: vi.fn(() => ({
            count: vi.fn(),
          })),
        })),
      })),
    })),
  })),
};

vi.mock("../lib/dbClient", () => ({
  dbClient: mockDataClient,
}));

vi.mock("../data/tableClient", () => ({
  default: mockDataClient,
}));

vi.mock("../hooks/useFoncierSync", () => ({
  withBackoff: vi.fn((fn) => fn()),
}));

describe("Foncier Hooks Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useFoncierData", () => {
    it("should fetch lots successfully", async () => {
      const { useFoncierData } = await import("../hooks/useFoncierData");
      const dbClient = (await import("../data/tableClient")).default;
      const { withBackoff } = await import("../hooks/useFoncierSync");

      const mockLots = [
        {
          id: "1",
          reference: "TEST-001",
          numero_lot: "25",
          nom_lotissement: "Test",
          village: "Sikensi",
          superficie: 1000,
          total_count: 1,
        },
      ];

      (dbClient.rpc as any).mockResolvedValue({
        data: mockLots,
        error: null,
      });

      (withBackoff as any).mockImplementation((fn: any) => fn());

      const { result: hookResult } = renderHook(() => useFoncierData());
      const result = await hookResult.current.fetchLots(
        "",
        "",
        "",
        false,
        1,
        20,
        true,
      );

      expect(result.error).toBeNull();
      expect(result.data).toEqual(mockLots);
      expect(result.total).toBe(1);
      expect(dbClient.rpc).toHaveBeenCalledWith("search_foncier_lots", {
        p_search: "",
        p_village: "",
        p_quartier: "",
        p_lotissement: "",
        p_statut: "",
        p_sort: "created_at",
        p_dir: "desc",
        p_page: 1,
        p_limit: 20,
        p_include_archived: false,
      });
    });

    it("should fetch village stats successfully", async () => {
      const { useFoncierData } = await import("../hooks/useFoncierData");
      const dbClient = (await import("../data/tableClient")).default;
      const { withBackoff } = await import("../hooks/useFoncierSync");

      const mockStats = [
        {
          village: "Sikensi",
          total_superficie: 5000,
          lots_count: 5,
        },
      ];

      (dbClient.rpc as any).mockResolvedValue({
        data: mockStats,
        error: null,
      });

      (withBackoff as any).mockImplementation((fn: any) => fn());

      const { result: hookResult } = renderHook(() => useFoncierData());
      const result = await hookResult.current.fetchVillageStats(false, true);

      expect(result.error).toBeNull();
      expect(result.data).toEqual({
        Sikensi: { total: 5000, count: 5 },
      });
    });

    it("should handle fetch errors", async () => {
      const { useFoncierData } = await import("../hooks/useFoncierData");
      const dbClient = (await import("../data/tableClient")).default;
      const { withBackoff } = await import("../hooks/useFoncierSync");

      const mockError = { message: "Database error" };

      (dbClient.rpc as any).mockResolvedValue({
        data: null,
        error: mockError,
      });

      (withBackoff as any).mockImplementation((fn: any) => fn());

      const { result: hookResult } = renderHook(() => useFoncierData());
      const result = await hookResult.current.fetchLots(
        "",
        "",
        "",
        false,
        1,
        20,
        true,
      );

      expect(result.error).toBe(mockError.message);
      expect(result.data).toBeNull();
      expect(result.total).toBe(0);
    });
  });

  describe("useFoncierAudit", () => {
    it("should fetch audit records successfully", async () => {
      const { useFoncierAudit } = await import("../hooks/useFoncierAudit");
      const dbClient = (await import("../data/tableClient")).default;
      const { withBackoff } = await import("../hooks/useFoncierSync");

      const mockAuditData = [
        {
          id: "1",
          lot_id: "lot-1",
          action: "create",
          performed_by: "user-1",
          performed_at: "2024-01-01T00:00:00Z",
          foncier_lots: {
            reference: "TEST-001",
            numero_lot: "25",
            village: "Sikensi",
          },
        },
      ];

      const mockProfilesData = [{ id: "user-1", full_name: "Test User" }];

      const mockQuery = {
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: mockAuditData,
          error: null,
          count: 1,
        }),
        eq: vi.fn().mockResolvedValue({
          data: mockAuditData,
          error: null,
          count: 1,
        }),
        in: vi.fn().mockResolvedValue({
          data: mockProfilesData,
          error: null,
        }),
      };

      (dbClient.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue(mockQuery),
      });

      (withBackoff as any).mockImplementation((fn: any) => fn());

      const { result: hookResult } = renderHook(() => useFoncierAudit());
      const result = await hookResult.current.fetchAudit(1, 20, "", true);

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].action).toBe("create");
      expect(result.total).toBe(1);
    });

    it("should handle offline mode", async () => {
      const { useFoncierAudit } = await import("../hooks/useFoncierAudit");

      const { result: hookResult } = renderHook(() => useFoncierAudit());
      const result = await hookResult.current.fetchAudit(1, 20, "", false);

      expect(result.error).toBe(
        "Mode hors-ligne : journal d'audit indisponible.",
      );
      expect(result.data).toBeNull();
      expect(result.total).toBe(0);
    });
  });
});
