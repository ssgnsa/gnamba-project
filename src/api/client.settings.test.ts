import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("apiClient settings", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("VITE_SELFHOSTED_MODE", "true");
    vi.stubEnv("VITE_API_URL", "https://api.gnambaservices.ci");
  });

  afterEach(() => {
    window.localStorage.clear();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("loads settings from the self-hosted API", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([{ key: "app_title", value: "EGS" }]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { apiClient } = await import("./client");
    const result = await apiClient.settings.getAll();

    expect(result.error).toBeNull();
    expect(result.data).toEqual([{ key: "app_title", value: "EGS" }]);
    expect(fetchMock).toHaveBeenCalled();
    const calledUrl = (fetchMock as any).mock.calls[0][0];
    expect(calledUrl).toBe("https://api.gnambaservices.ci/api/v1/settings");
  });

  it("sends upserts to the real /settings endpoint with the bulk payload", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: "ok", message: "Paramètres sauvegardés" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { apiClient } = await import("./client");
    const result = await apiClient.settings.upsert([
      { key: "app_title", value: "EGS" },
      { key: "primary_color", value: "#1e40af" },
    ]);

    expect(result.error).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://api.gnambaservices.ci/api/v1/settings",
    );
    expect(fetchMock.mock.calls[0][1]?.method).toBe("POST");
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({
      items: [
        { key: "app_title", value: "EGS" },
        { key: "primary_color", value: "#1e40af" },
      ],
    });
  });

  it("uses a GET query string for foncier lot searches instead of POST", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          items: [],
          total: 0,
          page: 1,
          page_size: 20,
          total_pages: 0,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { apiClient } = await import("./client");
    const result = await apiClient.foncier.getLots({
      search: "dupond",
      statut: "actif",
      page: 1,
      limit: 20,
    });

    expect(result.error).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://api.gnambaservices.ci/api/v1/foncier/lots?search=dupond&statut=actif&page=1&limit=20",
    );
    expect(fetchMock.mock.calls[0][1]?.method).toBeUndefined();
  });

  it("refreshes an expired local access token and retries once", async () => {
    window.localStorage.setItem("egs:local_auth_token", "expired-token");
    window.localStorage.setItem("egs:local_refresh_token", "refresh-token");

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ detail: "Token invalide" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            access_token: "fresh-token",
            refresh_token: "fresh-refresh-token",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify([{ key: "app_title", value: "EGS" }]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const { apiClient } = await import("./client");
    const result = await apiClient.settings.getAll();

    expect(result.error).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1][0]).toBe(
      "https://api.gnambaservices.ci/api/v1/auth/refresh",
    );
    expect(fetchMock.mock.calls[2][1]?.headers?.Authorization).toBe(
      "Bearer fresh-token",
    );
    expect(window.localStorage.getItem("egs:local_auth_token")).toBe(
      "fresh-token",
    );
  });
});
