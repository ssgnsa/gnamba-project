import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the client module
const mockDbClient = {
  from: vi.fn(),
  rpc: vi.fn(),
};
const mockWithRetry = vi.fn((fn) => fn());

vi.mock("./client.ts", () => ({
  dbClient: mockDbClient,
  withRetry: mockWithRetry,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("foncierRepository", () => {
  describe("getLotById", () => {
    it("should return error for invalid UUID", async () => {
      // We need to mock the validation module
      vi.doMock("./validation", () => ({
        isValidUuid: vi.fn().mockReturnValue(false),
      }));

      // Reset the module cache to get the mocked validation
      vi.resetModules();

      const { foncierRepository } = await import("./foncier.repository");
      const result = await foncierRepository.getLotById("invalid-id");
      expect(result.error).toBe("ID invalide");
      expect(result.data).toBeNull();
    });

    it("should call correct query for valid UUID", async () => {
      // Mock the validation to return true
      vi.doMock("./validation", () => ({
        isValidUuid: vi.fn().mockReturnValue(true),
      }));

      // Reset the module cache to get the mocked validation
      vi.resetModules();

      const mockResult = {
        data: { id: "valid-uuid", reference: "REF123" },
        error: null,
      };

      // Set up the mock chain for this test
      // from().select().eq().is().maybeSingle()
      const mockMaybeSingle = vi.fn().mockResolvedValue(mockResult);
      const mockIs = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockEq = vi.fn().mockReturnValue({ is: mockIs });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      mockDbClient.from.mockReturnValue({ select: mockSelect });

      // Reset the module cache to get the foncier repository with our mocks
      vi.resetModules();
      const { foncierRepository } = await import("./foncier.repository");
      const result = await foncierRepository.getLotById("valid-uuid");

      expect(mockDbClient.from).toHaveBeenCalledWith("foncier_lots");
      expect(mockSelect).toHaveBeenCalledWith(
        "id, reference, numero_lot, numero_ilot, nom_lotissement, quartier, village, commune, departement, region, superficie, code_barre, proprietaire_nom, proprietaire_prenom, proprietaire_naissance_date, proprietaire_naissance_lieu, proprietaire_cni_numero, proprietaire_cni_date, proprietaire_cni_lieu, proprietaire_profession, proprietaire_telephone, chef_village, arrete_prefectoral, arrete_date, statut, publier_sur_vitrine, date_cession, prix_cession, notes, created_at, updated_at, client_updated_at, deleted_at, deleted_by, deleted_reason, row_version, retention_until, last_modified_device_id"
      );
      expect(mockEq).toHaveBeenCalledWith("id", "valid-uuid");
      expect(mockIs).toHaveBeenCalledWith("deleted_at", null);
      expect(result.data?.id).toBe("valid-uuid");
    });
  });

  describe("saveLot", () => {
    it("should call update when isUpdate is true", async () => {
      // Mock the validation to return true
      vi.doMock("./validation", () => ({
        isValidUuid: vi.fn().mockReturnValue(true),
      }));

      // Reset the module cache to get the mocked validation
      vi.resetModules();

      const mockData = { id: "test-id", reference: "REF123", row_version: 2 };
      const mockResult = { data: mockData, error: null };

      // Set up the mock chain: from().update().eq("id",...).eq("row_version",...).select(...).single()
      const mockSingle = vi.fn().mockResolvedValue(mockResult);
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      // First .eq() call returns an object that also has .eq() (for the second .eq())
      const mockEq = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({ select: mockSelect }),
      });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });

      mockDbClient.from.mockReturnValue({ update: mockUpdate });

      // Reset the module cache to get the foncier repository with our mocks
      vi.resetModules();
      const { foncierRepository } = await import("./foncier.repository");
      const result = await foncierRepository.saveLot(mockData, true);

      expect(mockDbClient.from).toHaveBeenCalledWith("foncier_lots");
      expect(mockUpdate).toHaveBeenCalledWith(mockData);
      expect(mockEq).toHaveBeenCalledWith("id", "test-id");
      // Second eq is on the return of first eq; need to get the inner mock
      const mockEq2 = mockEq.mock.results[0].value.eq;
      expect(mockEq2).toHaveBeenCalledWith("row_version", 2);
      expect(mockSelect).toHaveBeenCalledWith(
        "id, reference, numero_lot, numero_ilot, nom_lotissement, quartier, village, commune, departement, region, superficie, code_barre, proprietaire_nom, proprietaire_prenom, proprietaire_naissance_date, proprietaire_naissance_lieu, proprietaire_cni_numero, proprietaire_cni_date, proprietaire_cni_lieu, proprietaire_profession, proprietaire_telephone, chef_village, arrete_prefectoral, arrete_date, statut, publier_sur_vitrine, date_cession, prix_cession, notes, created_at, updated_at, client_updated_at, deleted_at, deleted_by, deleted_reason, row_version, retention_until, last_modified_device_id"
      );
      expect(mockSingle).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });

    it("should call insert when isUpdate is false", async () => {
      // Mock the validation to return true
      vi.doMock("./validation", () => ({
        isValidUuid: vi.fn().mockReturnValue(true),
      }));

      // Reset the module cache to get the mocked validation
      vi.resetModules();

      const mockData = { reference: "REF123" };
      const mockResult = { data: mockData, error: null };

      // Set up the mock chain for this test
      // from().insert().select().single()
      const mockSingle = vi.fn().mockResolvedValue(mockResult);
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });

      mockDbClient.from.mockReturnValue({ insert: mockInsert });

      // Reset the module cache to get the foncier repository with our mocks
      vi.resetModules();
      const { foncierRepository } = await import("./foncier.repository");
      const result = await foncierRepository.saveLot(mockData, false);

      expect(mockDbClient.from).toHaveBeenCalledWith("foncier_lots");
      expect(mockInsert).toHaveBeenCalledWith(mockData);
      expect(mockSelect).toHaveBeenCalledWith(
        "id, reference, numero_lot, numero_ilot, nom_lotissement, quartier, village, commune, departement, region, superficie, code_barre, proprietaire_nom, proprietaire_prenom, proprietaire_naissance_date, proprietaire_naissance_lieu, proprietaire_cni_numero, proprietaire_cni_date, proprietaire_cni_lieu, proprietaire_profession, proprietaire_telephone, chef_village, arrete_prefectoral, arrete_date, statut, publier_sur_vitrine, date_cession, prix_cession, notes, created_at, updated_at, client_updated_at, deleted_at, deleted_by, deleted_reason, row_version, retention_until, last_modified_device_id"
      );
      expect(mockSingle).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });
  });

  describe("softDeleteLot", () => {
    it("should call the correct RPC", async () => {
      const mockResult = { data: null, error: null };
      mockDbClient.rpc.mockResolvedValue(mockResult);

      // Reset the module cache to get the foncier repository with our mocks
      vi.resetModules();
      const { foncierRepository } = await import("./foncier.repository");
      const result = await foncierRepository.softDeleteLot("test-id", "test reason");

      expect(mockDbClient.rpc).toHaveBeenCalledWith("soft_delete_foncier_lot", {
        p_lot_id: "test-id",
        p_reason: "test reason",
      });
      expect(result).toEqual(mockResult);
    });
  });
});
  describe("searchLots", () => {
    it("should return lots when search is successful", async () => {
      const mockResult = {
        data: [
          { id: "1", reference: "REF1" },
          { id: "2", reference: "REF2" },
        ],
        error: null,
      };

      mockDbClient.rpc.mockResolvedValue(mockResult);

      // Reset the module cache to get the foncier repository with our mocks
      vi.resetModules();
      const { foncierRepository } = await import("./foncier.repository");
      const result = await foncierRepository.searchLots({
        search: "test",
        village: "Village1",
        page: 1,
        limit: 10,
      });

      expect(mockDbClient.rpc).toHaveBeenCalledWith("search_foncier_lots", {
        p_search: "test",
        p_village: "Village1",
        p_quartier: "",
        p_lotissement: "",
        p_statut: "",
        p_sort: "created_at",
        p_dir: "desc",
        p_page: 1,
        p_limit: 10,
        p_include_archived: false,
      });
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0]?.reference).toBe("REF1");
      expect(result.error).toBeNull();
    });

    it("should return error when rpc fails", async () => {
      const mockResult = {
        data: null,
        error: { message: "Database error" },
      };

      mockDbClient.rpc.mockResolvedValue(mockResult);

      // Reset the module cache to get the foncier repository with our mocks
      vi.resetModules();
      const { foncierRepository } = await import("./foncier.repository");
      const result = await foncierRepository.searchLots();

      expect(mockDbClient.rpc).toHaveBeenCalledWith("search_foncier_lots", {
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
      expect(result.data).toBeNull();
      expect(result.error).toBe(mockResult.error);
    });
  });

  describe("getLotById", () => {
    it("should return null when lot not found", async () => {
      // Mock the validation to return true
      vi.doMock("./validation", () => ({
        isValidUuid: vi.fn().mockReturnValue(true),
      }));

      // Reset the module cache to get the mocked validation
      vi.resetModules();

      const mockResult = {
        data: null,
        error: null,
      };

      // Set up the mock chain for this test
      // from().select().eq().is().maybeSingle()
      const mockMaybeSingle = vi.fn().mockResolvedValue(mockResult);
      const mockIs = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockEq = vi.fn().mockReturnValue({ is: mockIs });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      mockDbClient.from.mockReturnValue({ select: mockSelect });

      // Reset the module cache to get the foncier repository with our mocks
      vi.resetModules();
      const { foncierRepository } = await import("./foncier.repository");
      const result = await foncierRepository.getLotById("valid-uuid");

      expect(mockDbClient.from).toHaveBeenCalledWith("foncier_lots");
      expect(mockSelect).toHaveBeenCalledWith(
        "id, reference, numero_lot, numero_ilot, nom_lotissement, quartier, village, commune, departement, region, superficie, code_barre, proprietaire_nom, proprietaire_prenom, proprietaire_naissance_date, proprietaire_naissance_lieu, proprietaire_cni_numero, proprietaire_cni_date, proprietaire_cni_lieu, proprietaire_profession, proprietaire_telephone, chef_village, arrete_prefectoral, arrete_date, statut, publier_sur_vitrine, date_cession, prix_cession, notes, created_at, updated_at, client_updated_at, deleted_at, deleted_by, deleted_reason, row_version, retention_until, last_modified_device_id"
      );
      expect(mockEq).toHaveBeenCalledWith("id", "valid-uuid");
      expect(mockIs).toHaveBeenCalledWith("deleted_at", null);
      expect(result.data).toBeNull();
      expect(result.error).toBeNull();
    });
  });
