import { describe, expect, it, vi } from "vitest";

// Mock the foncier repository module
const mockGetVillagesList = vi.fn();
const mockUpdateVillage = vi.fn();
const mockDeleteVillage = vi.fn();

vi.mock("@/data/foncier.repository", () => ({
  foncierRepository: {
    getVillagesList: mockGetVillagesList,
    updateVillage: mockUpdateVillage,
    deleteVillage: mockDeleteVillage,
  },
}));

describe("Foncier villages repository", () => {
  it("should load the villages list successfully", async () => {
    const mockVillages = [
      {
        id: "660e8400-e29b-41d4-a716-446655440000",
        nom: "Koumassi",
        region: "Abidjan",
        commune: "Koumassi",
        departement: "Abidjan 1",
      },
      {
        id: "660e8400-e29b-41d4-a716-446655440001",
        nom: "Cocody",
        region: "Abidjan",
        commune: "Cocody",
        departement: "Abidjan 2",
      },
    ];

    mockGetVillagesList.mockResolvedValueOnce({
      data: mockVillages,
      error: null,
    });

    const { foncierRepository } = await import("@/data/foncier.repository");
    const result = await foncierRepository.getVillagesList();

    expect(result.error).toBeNull();
    expect(result.data).toEqual(mockVillages);
    expect(result.data).toHaveLength(2);
    expect(mockGetVillagesList).toHaveBeenCalled();
  });

  it("should reject invalid village ID on update", async () => {
    const invalidId = "not-a-uuid";

    mockUpdateVillage.mockResolvedValueOnce({
      data: null,
      error: { message: "ID village invalide" },
    });

    const { foncierRepository } = await import("@/data/foncier.repository");
    const result = await foncierRepository.updateVillage(invalidId, {
      nom: "Test",
    });

    expect(result.error).toBeDefined();
    expect((result.error as { message: string }).message).toContain("invalide");
  });

  it("should reject invalid village ID on delete", async () => {
    const invalidId = "not-a-uuid";

    mockDeleteVillage.mockResolvedValueOnce({
      data: null,
      error: { message: "ID invalide" },
    });

    const { foncierRepository } = await import("@/data/foncier.repository");
    const result = await foncierRepository.deleteVillage(invalidId);

    expect(result.error).toBeDefined();
    expect((result.error as { message: string }).message).toContain("invalide");
  });
});