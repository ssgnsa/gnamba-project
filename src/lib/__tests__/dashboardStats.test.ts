import { describe, expect, it, vi } from "vitest";
import { fetchLatestDailyStats } from "../dashboardStats";

describe("fetchLatestDailyStats", () => {
  it("requests the latest row without using single() on a multi-row view", async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi
        .fn()
        .mockResolvedValue({ data: { date: "2026-07-01" }, error: null }),
    };

    const dbClient = {
      from: vi.fn().mockReturnValue(chain),
    } as any;

    const result = await fetchLatestDailyStats(dbClient);

    expect(dbClient.from).toHaveBeenCalledWith("stats_journalieres");
    expect(chain.select).toHaveBeenCalledWith("*");
    expect(chain.order).toHaveBeenCalledWith("date", { ascending: false });
    expect(chain.limit).toHaveBeenCalledWith(1);
    expect(chain.maybeSingle).toHaveBeenCalled();
    expect(result.error).toBeNull();
  });

  it("normalizes missing values to safe defaults", async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi
        .fn()
        .mockResolvedValue({ data: { date: null }, error: null }),
    };

    const dbClient = {
      from: vi.fn().mockReturnValue(chain),
    } as any;

    const result = await fetchLatestDailyStats(dbClient);

    expect(result.data).toEqual({
      date: "",
      total_visiteurs: 0,
      visiteurs_actuels: 0,
      badges_imprimes: 0,
      employes_presents: 0,
      activites_du_jour: 0,
    });
    expect(result.error).toBeNull();
  });
});
