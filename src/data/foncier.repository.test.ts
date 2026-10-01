import { beforeEach, describe, expect, it, vi } from "vitest";

const { service } = vi.hoisted(() => ({
  service: {
    searchLots: vi.fn(),
    getLotById: vi.fn(),
    saveLot: vi.fn(),
    softDeleteLot: vi.fn(),
    getVillagesList: vi.fn(),
    restoreLot: vi.fn(),
    getVillageStats: vi.fn(),
    checkLotDuplicate: vi.fn(),
    ensureHierarchy: vi.fn(),
    getAudit: vi.fn(),
    createAttestationAtomic: vi.fn(),
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

  it("delegates lot reads and writes to the API service", async () => {
    service.getLotById.mockResolvedValue({ data: { id: "lot-1" }, error: null });
    service.saveLot.mockResolvedValue({ data: { id: "lot-1" }, error: null });
    service.softDeleteLot.mockResolvedValue({ data: null, error: null });

    await foncierRepository.getLotById("lot-1");
    await foncierRepository.saveLot({ id: "lot-1" }, true);
    await foncierRepository.softDeleteLot("lot-1", "archivage test");

    expect(service.getLotById).toHaveBeenCalledWith("lot-1");
    expect(service.saveLot).toHaveBeenCalledWith({ id: "lot-1" }, true);
    expect(service.softDeleteLot).toHaveBeenCalledWith("lot-1", "archivage test");
  });

  it("loads village options through the authenticated Foncier API service", async () => {
    const response = { data: [], error: null, count: 0 };
    service.getVillagesList.mockResolvedValue(response);

    await expect(foncierRepository.getVillagesList()).resolves.toBe(response);
    expect(service.getVillagesList).toHaveBeenCalledOnce();
  });

  it("delegates lot restoration to the API service", async () => {
    service.restoreLot.mockResolvedValue({ data: { id: "lot-1" }, error: null });

    await expect(foncierRepository.restoreLot("lot-1")).resolves.toEqual({
      data: { id: "lot-1" },
      error: null,
    });
    expect(service.restoreLot).toHaveBeenCalledWith("lot-1");
  });

  it("passes the archived-lot flag to village statistics", async () => {
    service.getVillageStats.mockResolvedValue({ data: [], error: null });

    await foncierRepository.getVillageStats(true);

    expect(service.getVillageStats).toHaveBeenCalledWith(true);
  });

  it("delegates duplicate checks with their exclusion identifier", async () => {
    const params = {
      village: "Sikensi",
      lotissement: "Centre",
      ilot: "A",
      lot: "12",
      exclude_lot_id: "lot-1",
    };
    service.checkLotDuplicate.mockResolvedValue({ data: false, error: null });

    await foncierRepository.checkDuplicate(params);

    expect(service.checkLotDuplicate).toHaveBeenCalledWith(params);
  });

  it("delegates hierarchy creation to the API service", async () => {
    const hierarchy = { village: "Sikensi", lotissement: "Centre", ilot: "A" };
    service.ensureHierarchy.mockResolvedValue({ data: hierarchy, error: null });

    await foncierRepository.ensureHierarchy(hierarchy);

    expect(service.ensureHierarchy).toHaveBeenCalledWith(hierarchy);
  });

  it("passes audit paging and action filters to the API service", async () => {
    service.getAudit.mockResolvedValue({ data: [], error: null, count: 0 });

    await foncierRepository.getAudit({ page: 2, pageSize: 25, actionFilter: "create" });

    expect(service.getAudit).toHaveBeenCalledWith(2, 25, "create");
  });
});
