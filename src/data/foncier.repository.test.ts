import { beforeEach, describe, expect, it, vi } from "vitest";

const { service } = vi.hoisted(() => ({
  service: {
    searchLots: vi.fn(),
    getLotById: vi.fn(),
    saveLot: vi.fn(),
    softDeleteLot: vi.fn(),
    getVillagesList: vi.fn(),
  },
}));

vi.mock("../lib/dbClient.service", () => ({ dataService: service }));

import { foncierRepository } from "./foncier.repository";

describe("foncierRepository REST adapter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("normalizes lot search defaults before delegating", async () => {
    const response = { data: [], error: null, count: 0 };
    service.searchLots.mockResolvedValue(response);

    await expect(foncierRepository.searchLots({ search: "test", page: 2 })).resolves.toBe(response);
    expect(service.searchLots).toHaveBeenCalledWith({
      search: "test",
      village: "",
      quartier: "",
      lotissement: "",
      statut: "",
      sort: "created_at",
      dir: "desc",
      page: 2,
      limit: 20,
      include_archived: false,
    });
  });

  it("delegates lot reads to the API service", async () => {
    service.getLotById.mockResolvedValue({ data: { id: "lot-1" }, error: null });

    await foncierRepository.getLotById("lot-1");

    expect(service.getLotById).toHaveBeenCalledWith("lot-1");
  });

  it("preserves API errors from lot reads", async () => {
    const response = { data: null, error: "Lot introuvable", count: null };
    service.getLotById.mockResolvedValue(response);

    await expect(foncierRepository.getLotById("missing-lot")).resolves.toBe(response);
  });

  it("delegates lot updates to the API service", async () => {
    service.saveLot.mockResolvedValue({ data: { id: "lot-1" }, error: null });

    await foncierRepository.saveLot({ id: "lot-1" }, true);

    expect(service.saveLot).toHaveBeenCalledWith({ id: "lot-1" }, true);
  });

  it("delegates lot creation to the API service", async () => {
    service.saveLot.mockResolvedValue({ data: { id: "new-lot" }, error: null });

    await foncierRepository.saveLot({ reference: "LOT-001" }, false);

    expect(service.saveLot).toHaveBeenCalledWith({ reference: "LOT-001" }, false);
  });

  it("delegates lot archival to the API service", async () => {
    service.softDeleteLot.mockResolvedValue({ data: null, error: null });

    await foncierRepository.softDeleteLot("lot-1", "archivage test");

    expect(service.softDeleteLot).toHaveBeenCalledWith("lot-1", "archivage test");
  });

  it("loads village options through the authenticated Foncier API service", async () => {
    const response = { data: [], error: null, count: 0 };
    service.getVillagesList.mockResolvedValue(response);

    await expect(foncierRepository.getVillagesList()).resolves.toBe(response);
    expect(service.getVillagesList).toHaveBeenCalledOnce();
  });
});
