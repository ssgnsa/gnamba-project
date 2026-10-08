import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetLots, mockRequest, mockCreateLot } = vi.hoisted(() => ({
  mockGetLots: vi.fn(),
  mockRequest: vi.fn(),
  mockCreateLot: vi.fn(),
}));

vi.mock("../api/client.ts", () => ({
  apiClient: {
    foncier: { getLots: mockGetLots, createLot: mockCreateLot },
    request: mockRequest,
  },
}));

vi.mock("../data/tableClient.ts", () => ({ default: {} }));

import { foncierRepository } from "./dbClient.service";

describe("foncierRepository.searchLots", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateLot.mockReset();
  });

  it("extrait les lots et le total d'une réponse paginée", async () => {
    const lot = { id: "lot-1", reference: "LOT-TEST-1" };
    mockGetLots.mockResolvedValue({
      data: { items: [lot], total: 7, page: 1, page_size: 20, total_pages: 1 },
      error: null,
      count: 1,
    });

    const result = await foncierRepository.searchLots();

    expect(result.data).toEqual([lot]);
    expect(result.count).toBe(7);
  });

  it("préserve une réponse sous forme de tableau", async () => {
    const lot = { id: "lot-1", reference: "LOT-TEST-1" };
    mockGetLots.mockResolvedValue({ data: [lot], error: null, count: 1 });

    const result = await foncierRepository.searchLots();

    expect(result.data).toEqual([lot]);
    expect(result.count).toBe(1);
  });
});

describe("foncierRepository.getLatestAttestationForLot", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("extrait la dernière attestation d'une réponse paginée", async () => {
    const attestation = { id: "att-1", reference: "ATT-TEST-1" };
    mockRequest.mockResolvedValue({
      data: { items: [attestation], total: 1, page: 1, page_size: 1, total_pages: 1 },
      error: null,
      count: 1,
    });

    const result = await foncierRepository.getLatestAttestationForLot("lot-1");

    expect(result.data).toEqual(attestation);
    expect(result.count).toBe(1);
    expect(mockRequest).toHaveBeenCalledWith(
      expect.stringContaining("/foncier/attestations?lot_id=lot-1"),
    );
  });

  it("préserve une réponse sous forme de tableau", async () => {
    const attestation = { id: "att-1", reference: "ATT-TEST-1" };
    mockRequest.mockResolvedValue({ data: [attestation], error: null, count: 1 });

    const result = await foncierRepository.getLatestAttestationForLot("lot-1");

    expect(result.data).toEqual(attestation);
    expect(result.count).toBe(1);
  });
});

describe("foncierRepository.saveLot", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("crée un lot sous un îlot unique de la hiérarchie déjà enregistrée", async () => {
    mockRequest
      .mockResolvedValueOnce({
        data: [{ id: "village-1", nom: "Kokoti", commune: "Taabo" }],
        error: null,
      })
      .mockResolvedValueOnce({
        data: [{ id: "lotissement-1", nom: "Résidentiel" }],
        error: null,
      })
      .mockResolvedValueOnce({
        data: [{ id: "ilot-1", numero: "A" }],
        error: null,
      });
    mockCreateLot.mockResolvedValue({
      data: { id: "lot-1", reference: "LOT-001" },
      error: null,
    });

    const result = await foncierRepository.saveLot(
      {
        village: " Kokoti ",
        commune: "Taabo",
        nom_lotissement: "Résidentiel",
        numero_ilot: "A",
        numero_lot: "12",
        superficie: 300,
      },
      false,
    );

    expect(result.data).toEqual({ id: "lot-1", reference: "LOT-001" });
    expect(mockCreateLot).toHaveBeenCalledWith(
      expect.objectContaining({ ilot_id: "ilot-1", numero_lot: "12" }),
    );
  });

  it("refuse une création si le nom du village est ambigu", async () => {
    mockRequest.mockResolvedValueOnce({
      data: [
        { id: "village-1", nom: "Kokoti", commune: "Taabo" },
        { id: "village-2", nom: "Kokoti", commune: "Autre commune" },
      ],
      error: null,
    });

    const result = await foncierRepository.saveLot(
      {
        village: "Kokoti",
        nom_lotissement: "Résidentiel",
        numero_ilot: "A",
        numero_lot: "12",
        superficie: 300,
      },
      false,
    );

    expect(result.data).toBeNull();
    expect(result.error).toContain("Plusieurs villages correspondent");
    expect(mockRequest).toHaveBeenCalledTimes(1);
  });
});
