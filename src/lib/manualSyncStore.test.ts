import { describe, it, expect } from "vitest";
import { mergeManualCacheWithRemote } from "./manualSyncStore";

describe("mergeManualCacheWithRemote", () => {
  it("keeps local pending changes while adding fresh remote items", () => {
    const cached = [
      {
        id: "local-1",
        sync_status: "pending" as const,
        telephone: "+225 07000001",
      },
    ];

    const remote = [
      {
        id: "local-1",
        sync_status: "synced" as const,
        telephone: "+225 07000002",
      },
      {
        id: "remote-2",
        sync_status: "synced" as const,
        telephone: "+225 07000003",
      },
    ];

    const merged = mergeManualCacheWithRemote(cached, remote);

    expect(merged).toHaveLength(2);
    expect(merged.find((item) => item.id === "local-1")?.telephone).toBe(
      "+225 07000001",
    );
    expect(merged.find((item) => item.id === "remote-2")?.telephone).toBe(
      "+225 07000003",
    );
  });
});
