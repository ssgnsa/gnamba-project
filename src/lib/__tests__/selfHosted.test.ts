import { afterEach, describe, expect, it, vi } from "vitest";
import { getLocalApiBaseUrl, isSelfHostedMode } from "../selfHosted";

describe("selfHosted runtime config", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses the official API endpoint by default and ignores localhost fallbacks", () => {
    vi.stubEnv("VITE_API_URL", "");
    vi.stubEnv("VITE_SELFHOSTED_MODE", "false");

    expect(getLocalApiBaseUrl()).toBe("https://api.gnambaservices.ci");
    expect(isSelfHostedMode()).toBe(false);
  });

  it("prefers an explicit API URL when provided", () => {
    vi.stubEnv("VITE_API_URL", "https://api.example.test");

    expect(getLocalApiBaseUrl()).toBe("https://api.example.test");
  });
});
