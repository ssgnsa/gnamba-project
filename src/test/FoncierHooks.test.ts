import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";

const { mockDataService } = vi.hoisted(() => ({
  mockDataService: {
    searchLots: vi.fn(),
    getVillageStats: vi.fn(),
    getAudit: vi.fn(),
  },
}));

vi.mock("../lib/dbClient.service", () => ({
  dataService: mockDataService,
}));

describe("Foncier Hooks Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useFoncierData", () => {
    it("should fetch lots successfully", async () => {
      const { useFoncierData } = await import("../hooks/useFoncierData");

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

      mockDataService.searchLots.mockResolvedValue({
        data: mockLots,
        error: null,
      });

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
      expect(mockDataService.searchLots).toHaveBeenCalledWith({
        search: "",
        village: "",
        quartier: "",
        lotissement: "",
        statut: "",
        sort: "created_at",
        dir: "desc",
        page: 1,
        limit: 20,
        include_archived: false,
      });
    });

    it("should fetch village stats successfully", async () => {
      const { useFoncierData } = await import("../hooks/useFoncierData");

      const mockStats = [
        {
          village: "Sikensi",
          total_superficie: 5000,
          lots_count: 5,
        },
      ];

      mockDataService.getVillageStats.mockResolvedValue({
        data: mockStats,
        error: null,
      });

      const { result: hookResult } = renderHook(() => useFoncierData());
      const result = await hookResult.current.fetchVillageStats(false, true);

      expect(result.error).toBeNull();
      expect(result.data).toEqual({
        Sikensi: { total: 5000, count: 5 },
      });
    });

    it("should handle fetch errors", async () => {
      const { useFoncierData } = await import("../hooks/useFoncierData");

      const mockError = { message: "Database error" };

      mockDataService.searchLots.mockResolvedValue({
        data: null,
        error: mockError,
      });

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

      expect(result.error).toEqual(mockError);
      expect(result.data).toBeNull();
      expect(result.total).toBe(0);
    });
  });

  describe("useFoncierAudit", () => {
    it("should fetch audit records successfully", async () => {
      const { useFoncierAudit } = await import("../hooks/useFoncierAudit");
      mockDataService.getAudit.mockResolvedValue({
        data: [{
          id: "1",
          entity_id: "lot-1",
          action: "create",
          user_name: "Test User",
          created_at: "2024-01-01T00:00:00Z",
          old_values: null,
          new_values: { statut: "actif" },
        }],
        error: null,
        count: 1,
      });

      const { result: hookResult } = renderHook(() => useFoncierAudit());
      let result!: Awaited<ReturnType<typeof hookResult.current.fetchAudit>>;
      await act(async () => {
        result = await hookResult.current.fetchAudit(1, 20, "", true);
      });

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].action).toBe("create");
      expect(result.data?.[0].utilisateur_nom).toBe("Test User");
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
