import { describe, it, expect, vi, beforeEach } from "vitest";
import { DataService } from "../dbClient.service";

const { mockSignAttestation } = vi.hoisted(() => ({
  mockSignAttestation: vi.fn(),
}));

vi.mock("../../api/client", () => ({
  apiClient: {
    foncier: {
      signAttestation: mockSignAttestation,
    },
  },
}));

// Mock API locale client
const mockDataClient = {
  rpc: vi.fn(),
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn(() => ({
            maybeSingle: vi.fn(),
          })),
          range: vi.fn(),
        })),
        is: vi.fn(() => ({
          maybeSingle: vi.fn(),
        })),
        in: vi.fn(),
        count: vi.fn(),
      })),
      order: vi.fn(() => ({
        limit: vi.fn(() => ({
          maybeSingle: vi.fn(),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(),
            })),
          })),
        })),
      })),
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(),
      })),
    })),
  })),
  functions: {
    invoke: vi.fn(),
  },
};

describe("DataService", () => {
  let service: DataService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new DataService(mockDataClient as any);
  });

  describe("searchLots", () => {
    it("should search lots successfully", async () => {
      const mockData = [
        {
          id: "1",
          reference: "TEST-001",
          village: "Sikensi",
          superficie: 1000,
        },
      ];

      mockDataClient.rpc.mockResolvedValue({
        data: mockData,
        error: null,
      });

      const result = await service.searchLots({
        search: "test",
        village: "Sikensi",
        quartier: "",
        lotissement: "",
        statut: "",
        sort: "created_at",
        dir: "desc",
        page: 1,
        limit: 20,
        include_archived: false,
      });

      expect(result.data).toEqual(mockData);
      expect(result.error).toBeNull();
      expect(mockDataClient.rpc).toHaveBeenCalledWith("search_foncier_lots", {
        p_search: "test",
        p_village: "Sikensi",
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

    it("should handle errors", async () => {
      mockDataClient.rpc.mockResolvedValue({
        data: null,
        error: { message: "Database error" },
      });

      const result = await service.searchLots({
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

      expect(result.data).toBeNull();
      expect(result.error).toBe("Database error");
    });
  });

  describe("getVillageStats", () => {
    it("should get village stats successfully", async () => {
      const mockData = [
        {
          village: "Sikensi",
          total_superficie: 5000,
          lots_count: 10,
        },
      ];

      mockDataClient.rpc.mockResolvedValue({
        data: mockData,
        error: null,
      });

      const result = await service.getVillageStats(false);

      expect(result.data).toEqual(mockData);
      expect(result.error).toBeNull();
      expect(mockDataClient.rpc).toHaveBeenCalledWith("foncier_stats_by_village", {
        p_include_archived: false,
      });
    });
  });

  describe("checkLotDuplicate", () => {
    it("should check for duplicates successfully", async () => {
      const mockData = [
        {
          id: "1",
          reference: "TEST-001",
        },
      ];

      mockDataClient.rpc.mockResolvedValue({
        data: mockData,
        error: null,
      });

      const result = await service.checkLotDuplicate({
        village: "Sikensi",
        lotissement: "Test",
        ilot: "A",
        lot: "25",
        exclude_lot_id: undefined,
      });

      expect(result.data).toEqual(mockData);
      expect(result.error).toBeNull();
      expect(mockDataClient.rpc).toHaveBeenCalledWith("check_foncier_duplicate", {
        p_village: "Sikensi",
        p_lotissement: "Test",
        p_ilot: "A",
        p_lot: "25",
        p_exclude_lot_id: null,
      });
    });
  });

  describe("saveLot", () => {
    it("should insert a new lot successfully", async () => {
      const mockLot = {
        id: "1",
        reference: "TEST-001",
        village: "Sikensi",
      };

      const mockQuery = {
        single: vi.fn().mockResolvedValue({
          data: mockLot,
          error: null,
        }),
      };

      mockDataClient.from.mockReturnValue({
        select: vi.fn(),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue(mockQuery),
        }),
      });

      const result = await service.saveLot(mockLot, false);

      expect(result.data).toEqual(mockLot);
      expect(result.error).toBeNull();
    });

    it("should update an existing lot successfully", async () => {
      const mockLot = {
        id: "1",
        reference: "TEST-001",
        village: "Sikensi",
        row_version: 1,
      };

      const mockQuery = {
        single: vi.fn().mockResolvedValue({
          data: mockLot,
          error: null,
        }),
      };

      const mockUpdateQuery = {
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue(mockQuery),
          }),
        }),
      };

      mockDataClient.from.mockReturnValue({
        update: vi.fn().mockReturnValue(mockUpdateQuery),
      } as any);

      const result = await service.saveLot(mockLot, true);

      expect(result.data).toEqual(mockLot);
      expect(result.error).toBeNull();
    });
  });

  describe("getAudit", () => {
    it("should get audit records successfully", async () => {
      const mockData = [
        {
          id: "1",
          action: "create",
          performed_at: "2024-01-01T00:00:00Z",
        },
      ];

      const mockRangeQuery = {
        eq: vi.fn().mockResolvedValue({
          data: mockData,
          error: null,
          count: 1,
        }),
      };

      const mockOrderQuery = {
        range: vi.fn().mockReturnValue(mockRangeQuery),
      };

      const mockSelectQuery = {
        order: vi.fn().mockReturnValue(mockOrderQuery),
      };

      mockDataClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue(mockSelectQuery),
      } as any);

      const result = await service.getAudit({
        page: 1,
        pageSize: 20,
        actionFilter: "create",
      });

      expect(result.data).toEqual(mockData);
      expect(result.error).toBeNull();
    });
  });

  describe("signAttestation", () => {
    it("should sign attestation successfully", async () => {
      const mockSignature = "test-signature";

      mockSignAttestation.mockResolvedValue({
        data: { signature: mockSignature },
        error: null,
      });

      const result = await service.signAttestation("attestation-id", {
        test: "data",
      });

      expect(result.data).toBe(mockSignature);
      expect(result.error).toBeNull();
      expect(mockSignAttestation).toHaveBeenCalledWith("attestation-id", {
        test: "data",
      });
    });

    it("should handle signing errors", async () => {
      mockSignAttestation.mockResolvedValue({
        data: null,
        error: "Signing failed",
      });

      const result = await service.signAttestation("attestation-id", {});

      expect(result.data).toBeNull();
      expect(result.error).toBe("Signing failed");
    });
  });
});
