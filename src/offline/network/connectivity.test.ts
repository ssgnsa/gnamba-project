import { afterEach, describe, expect, it, vi } from "vitest";
import apiClient from "../../api/client";
import { connectivityManager } from "./connectivity";

vi.mock("../../api/client", () => ({
  default: { request: vi.fn() },
}));

describe("RuntimeConnectivityMonitor", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("pings a configured loopback API in development", async () => {
    vi.stubEnv("VITE_API_URL", "http://localhost:8000/api/v1");
    vi.mocked(apiClient.request).mockResolvedValue({
      data: { status: "ok" },
      error: null,
      status: 200,
    });

    const status = await connectivityManager.forceCheck();

    expect(apiClient.request).toHaveBeenCalledWith("/health");
    expect(status.isOnline).toBe(true);
    expect(status.error).toBeUndefined();
  });
});
