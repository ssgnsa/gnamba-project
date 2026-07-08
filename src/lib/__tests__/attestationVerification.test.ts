import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../apiConfig", () => ({
  resolveApiUrl: vi.fn(() => "https://api.gnambaservices.ci"),
  resolveApiAnonKey: vi.fn(() => "anon-key"),
}));

import {
  generateCanonicalVerificationUrl,
  generateVerificationUrl,
  verifyAttestation,
} from "../attestationVerification";

describe("attestationVerification helpers", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("builds sanitized public verification urls", () => {
    const url = generateVerificationUrl({
      ref: " apv-2026-001 ",
      control: " 0011223344 ",
      hash: " ABCDEF1234 ",
    });

    const parsed = new URL(url);
    expect(parsed.searchParams.get("ref")).toBe("APV-2026-001");
    expect(parsed.searchParams.get("control")).toBe("0011223344");
    expect(parsed.searchParams.get("hash")).toBe("abcdef1234");
    expect(parsed.pathname).toBe("/verification-attestation");
  });

  it("builds a canonical verification url on the provided domain", () => {
    const url = generateCanonicalVerificationUrl(
      { ref: " APV-2026-XYZ " },
      "gnambaservices.ci",
    );

    const parsed = new URL(url);
    expect(parsed.origin).toBe("https://gnambaservices.ci");
    expect(parsed.searchParams.get("ref")).toBe("APV-2026-XYZ");
  });

  it("calls the local FastAPI verification endpoint and returns the payload", async () => {
    const payload = {
      reference: "APV-2026-001",
      document_authentic: true,
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(payload),
    });

    vi.stubGlobal("fetch", fetchMock);

    const result = await verifyAttestation({ ref: " apv-2026-001 " });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [calledUrl, calledOpts] = (fetchMock as any).mock.calls[0];
    expect(calledUrl).toContain("/api/v1/foncier/attestations/verify");
    expect(calledUrl).toContain("ref=APV-2026-001");
    expect(calledOpts).toBeDefined();
    expect(calledOpts.headers).toBeUndefined();
    expect(result).toEqual(payload);
  });

  it("rejects empty lookups", async () => {
    await expect(verifyAttestation({})).rejects.toThrow(
      "Référence, numéro de contrôle ou hash requis.",
    );
  });
});
