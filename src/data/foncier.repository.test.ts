import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/api/client", () => ({
  apiClient: {
    foncier: {
      getLots: vi.fn(),
      getLot: vi.fn(),
      createLot: vi.fn(),
      updateLot: vi.fn(),
      getVillages: vi.fn(),
    },
    request: vi.fn(),
  },
}));

import { apiClient } from "@/api/client";
import { foncierRepository } from "./foncier.repository";

describe("foncierRepository (canonical, dbClient.service)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("normalizes lot search defaults before delegating to apiClient", async () => {
    const response = { data: [], error: null, count: 0 };
    apiClient.foncier.getLots.mockResolvedValue(response);

    await expect(foncierRepository.searchLots({ search: "test", page: 2 })).resolves.toStrictEqual(response);
    expect(apiClient.foncier.getLots).toHaveBeenCalledWith({
      search: "test",
      village: "",
      quartier: "",
      lotissement: "",
      statut: "",
      sort: "reference",
      dir: "asc",
      page: 2,
      limit: 20,
      include_archived: false,
    });
  });

  it("delegates lot reads and writes to the API client", async () => {
    apiClient.foncier.getLot.mockResolvedValue({ data: { id: "lot-1" }, error: null });
    apiClient.foncier.updateLot.mockResolvedValue({ data: { id: "lot-1" }, error: null });
    apiClient.request.mockResolvedValue({ data: null, error: null });

    await foncierRepository.getLotById("lot-1");
    await foncierRepository.saveLot({ id: "lot-1" } as any, true);
    await foncierRepository.softDeleteLot("lot-1", "archivage test");

    expect(apiClient.foncier.getLot).toHaveBeenCalledWith("lot-1");
    expect(apiClient.foncier.updateLot).toHaveBeenCalledWith("lot-1", { id: "lot-1" });
    expect(apiClient.request).toHaveBeenCalledWith("/rpc/soft_delete_foncier_lot", {
      method: "POST",
      body: JSON.stringify({ p_lot_id: "lot-1" }),
    });
  });

  it("loads village options through the authenticated Foncier API service", async () => {
    const response = { data: [], error: null, count: 0 };
    apiClient.foncier.getVillages.mockResolvedValue(response);

    await expect(foncierRepository.getVillagesList()).resolves.toStrictEqual(response);
    expect(apiClient.foncier.getVillages).toHaveBeenCalledOnce();
  });
});
