import { describe, expect, it } from "vitest";
import { buildCreateUserEdgeFunctionHeaders } from "../adminUserCreation";

describe("buildCreateUserEdgeFunctionHeaders", () => {
  it("prefers the active session token over the anonymous key", () => {
    const headers = buildCreateUserEdgeFunctionHeaders({
      anonKey: "anon-key",
      sessionToken: "session-token",
    }) as Record<string, string>;

    expect(headers.Authorization).toBe("Bearer session-token");
  });

  it("falls back to the anonymous key when no session token exists", () => {
    const headers = buildCreateUserEdgeFunctionHeaders({
      anonKey: "anon-key",
      sessionToken: undefined,
    }) as Record<string, string>;

    expect(headers.Authorization).toBe("Bearer anon-key");
  });
});
