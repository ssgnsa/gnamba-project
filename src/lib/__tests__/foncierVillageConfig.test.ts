import { describe, expect, it, vi, beforeEach } from "vitest";

const getAllMock = vi.fn();
const upsertMock = vi.fn();

vi.mock("../api/client", () => ({
  apiClient: {
    settings: {
      getAll: getAllMock,
      upsert: upsertMock,
    },
  },
}));

import { loadVillageConfig, saveVillageConfig } from "../foncierVillageConfig";

describe("foncier village config storage", () => {
  beforeEach(() => {
    getAllMock.mockReset();
    upsertMock.mockReset();
  });

  it("loads a village config from settings rows", async () => {
    getAllMock.mockResolvedValue({
      data: [
        { key: "foncier_village_config:Village A:chef_village", value: "Soro" },
        { key: "foncier_village_config:Village A:region", value: "Abidjan" },
      ],
      error: null,
      status: 200,
    });

    const config = await loadVillageConfig("Village A");

    expect(config?.chef_village).toBe("Soro");
    expect(config?.region).toBe("Abidjan");
  });

  it("persists a village config through settings upsert", async () => {
    upsertMock.mockResolvedValue({
      data: { status: "ok" },
      error: null,
      status: 200,
    });

    await saveVillageConfig("Village A", {
      region: "Abidjan",
      chef_village: "Soro",
      commune: "",
      village: "Village A",
      arrete_prefectoral: "",
      nom_chef_signe: "",
      lieu_signature: "",
      logo_url: "",
      village_logo_url: "",
      primary_color: "",
      layout_preference: "",
    } as any);

    expect(upsertMock).toHaveBeenCalledWith([
      { key: "foncier_village_config:Village A:region", value: "Abidjan" },
      { key: "foncier_village_config:Village A:chef_village", value: "Soro" },
    ]);
  });
});
