import { beforeEach, describe, it, expect, vi } from "vitest";

const { requestMock, mediaUpdateMock, mediaReplaceMock, settingsUpsertMock } = vi.hoisted(() => ({
  requestMock: vi.fn(),
  mediaUpdateMock: vi.fn(),
  mediaReplaceMock: vi.fn(),
  settingsUpsertMock: vi.fn(),
}));

vi.mock("../../api/client", () => ({
  apiClient: {
    request: requestMock,
    media: { update: mediaUpdateMock, replace: mediaReplaceMock },
    settings: { upsert: settingsUpsertMock },
  },
}));

import { apiClient } from "../../api/client";
import {
  getMediaUsages,
  getMediaVersions,
  getUsageForSlot,
  getBrandAsset,
  setBrandAsset,
  replaceMediaFile,
} from "../mediaUtils";

describe("mediaUtils REST client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requestMock.mockResolvedValue({ data: [], error: null, status: 200 });
  });

  it("loads media usage records through the API", async () => {
    const rows = [{ id: "u1", media_id: "m1" }];
    requestMock.mockResolvedValueOnce({ data: rows, error: null, status: 200 });

    await expect(getMediaUsages("m1")).resolves.toEqual(rows);
    expect(apiClient.request).toHaveBeenCalledWith("/media/usage?media_id=m1");
  });

  it("loads media versions through the API", async () => {
    const rows = [{ id: "v1", media_id: "m1" }];
    requestMock.mockResolvedValueOnce({ data: rows, error: null, status: 200 });

    await expect(getMediaVersions("m1")).resolves.toEqual(rows);
    expect(apiClient.request).toHaveBeenCalledWith("/media/m1/versions");
  });

  it("returns the first media file assigned to a slot", async () => {
    const file = { id: "m1", url: "https://cdn.example/image.png" };
    requestMock.mockResolvedValueOnce({ data: [file], error: null, status: 200 });

    await expect(getUsageForSlot("site_section", null, "hero_image")).resolves.toEqual(file);
    expect(apiClient.request).toHaveBeenCalledWith(
      "/media/usage?entity_type=site_section&usage_type=hero_image",
    );
  });

  it("returns the requested brand asset from the API result", async () => {
    const logo = { id: "m1", url: "https://cdn.example/logo.png", brand_asset_type: "logo_principal" };
    requestMock.mockResolvedValueOnce({ data: [logo], error: null, status: 200 });

    await expect(getBrandAsset("logo_principal")).resolves.toEqual(logo);
    expect(apiClient.request).toHaveBeenCalledWith("/media/brand-assets");
  });

  it("returns settings errors when persisting a brand asset", async () => {
    requestMock.mockResolvedValueOnce({ data: [], error: null, status: 200 });
    mediaUpdateMock.mockResolvedValueOnce({
      data: { id: "media-1", url: "https://cdn.example/logo.png" },
      error: null,
      status: 200,
    });
    settingsUpsertMock.mockResolvedValueOnce({
      data: null,
      error: "settings update failed",
      status: 500,
    });

    await expect(setBrandAsset("media-1", "logo_principal", "user-1")).resolves.toEqual({
      error: "settings update failed",
    });
    expect(mediaUpdateMock).toHaveBeenCalledWith("media-1", {
      is_brand_asset: true,
      brand_asset_type: "logo_principal",
    });
  });

  it("uses the backend API for media replacement", async () => {
    const updated = { id: "m1", url: "https://cdn.example/new.png" };
    mediaReplaceMock.mockResolvedValueOnce({ data: updated, error: null, status: 200 });
    const file = new File(["hello"], "new.png", { type: "image/png" });

    await expect(replaceMediaFile("m1", file, "user-1")).resolves.toEqual({
      data: updated,
      error: null,
    });
    expect(apiClient.media.replace).toHaveBeenCalledWith("m1", file);
  });
});
