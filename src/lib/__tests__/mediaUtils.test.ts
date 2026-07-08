import { beforeEach, describe, it, expect, vi } from "vitest";

// Mock legacy adapter to avoid real network calls
vi.mock("../../data/tableClient", () => ({ default: { from: vi.fn() } }));
vi.mock("../../api/client", () => ({
  apiClient: {
    request: vi.fn(),
    media: { replace: vi.fn() },
  },
}));
vi.mock("../selfHosted", () => ({ isSelfHostedMode: vi.fn(() => false) }));
import dbClient from "../../data/tableClient";
import { apiClient } from "../../api/client";
import { isSelfHostedMode } from "../selfHosted";
import {
  getMediaUsages,
  getMediaVersions,
  getUsageForSlot,
  getBrandAsset,
  setBrandAsset,
  replaceMediaFile,
} from "../mediaUtils";

describe("mediaUtils (unit)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("getMediaUsages returns an array of usages", async () => {
    const mockData = [{ id: "u1", media_id: "m1" }];
    const chain: any = {
      select: () => chain,
      eq: () => chain,
      order: () => Promise.resolve({ data: mockData }),
    };
    (dbClient.from as any).mockReturnValue(chain);

    const res = await getMediaUsages("m1");
    expect(res).toEqual(mockData);
    expect(dbClient.from).toHaveBeenCalledWith("media_usage");
  });

  it("getMediaVersions returns versions list", async () => {
    const mockData = [{ id: "v1", media_id: "m1" }];
    const chain: any = {
      select: () => chain,
      eq: () => chain,
      order: () => Promise.resolve({ data: mockData }),
    };
    (dbClient.from as any).mockReturnValue(chain);

    const res = await getMediaVersions("m1");
    expect(res).toEqual(mockData);
    expect(dbClient.from).toHaveBeenCalledWith("media_versions");
  });

  it("getUsageForSlot returns media file when assigned", async () => {
    const mockData = { media_files: { id: "m1", url: "u" } };
    const chain: any = {
      select: () => chain,
      eq: () => chain,
      is: () => chain,
      maybeSingle: () => Promise.resolve({ data: mockData }),
    };
    (dbClient.from as any).mockReturnValue(chain);

    const res = await getUsageForSlot("site_section", null, "hero_image");
    expect(res).toEqual(mockData.media_files);
    expect(dbClient.from).toHaveBeenCalledWith("media_usage");
  });

  it("getBrandAsset returns the latest brand asset", async () => {
    const mockFile = { id: "m1", url: "u" };
    const chain: any = {
      select: () => chain,
      eq: () => chain,
      order: () => chain,
      limit: () => chain,
      maybeSingle: () => Promise.resolve({ data: mockFile }),
    };
    (dbClient.from as any).mockReturnValue(chain);

    const res = await getBrandAsset("logo_principal" as any);
    expect(res).toEqual(mockFile);
    expect(dbClient.from).toHaveBeenCalledWith("media_files");
  });

  it("setBrandAsset returns an error when the settings update fails", async () => {
    const createMediaChain = (mode: "update" | "select" = "update") => {
      const chain: any = {
        update: () => createMediaChain("update"),
        select: () => createMediaChain("select"),
        eq: () => {
          if (mode === "update") {
            return Promise.resolve({ error: null });
          }
          return createMediaChain("select");
        },
        maybeSingle: () =>
          Promise.resolve({ data: { url: "https://cdn.example/logo.png" } }),
      };
      return chain;
    };

    const appSettingsChain: any = {
      upsert: () =>
        Promise.resolve({ error: { message: "settings update failed" } }),
    };

    (dbClient.from as any).mockImplementation((table: string) => {
      if (table === "app_settings") return appSettingsChain;
      return createMediaChain();
    });

    const res = await setBrandAsset("media-1", "logo_principal", "user-1");

    expect(res).toEqual({ error: "settings update failed" });
  });

  it("uses the backend API for media usage lookups in self-hosted mode", async () => {
    (isSelfHostedMode as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      true,
    );
    (apiClient.request as any).mockResolvedValue({
      data: [
        {
          id: "u1",
          media_id: "m1",
          entity_type: "brand",
          usage_type: "logo_principal",
        },
      ],
      error: null,
      status: 200,
    });

    const res = await getMediaUsages("m1");

    expect(apiClient.request).toHaveBeenCalledWith(
      "/api/v1/media/usage?media_id=m1",
    );
    expect(res).toEqual([
      {
        id: "u1",
        media_id: "m1",
        entity_type: "brand",
        usage_type: "logo_principal",
      },
    ]);
  });

  it("uses the backend API for media replacement in self-hosted mode", async () => {
    (isSelfHostedMode as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      true,
    );
    (apiClient.media.replace as any).mockResolvedValue({
      data: { id: "m1", url: "https://cdn.example/new.png" },
      error: null,
      status: 200,
    });

    const file = new File(["hello"], "new.png", { type: "image/png" });
    const res = await replaceMediaFile("m1", file, "user-1");

    expect(apiClient.media.replace).toHaveBeenCalledWith("m1", file);
    expect(res).toEqual({
      data: { id: "m1", url: "https://cdn.example/new.png" },
      error: null,
    });
  });
});
