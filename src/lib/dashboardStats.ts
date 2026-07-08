export interface DailyStatsRow {
  date: string;
  total_visiteurs: number;
  visiteurs_actuels: number;
  badges_imprimes: number;
  employes_presents: number;
  activites_du_jour: number;
}

export interface DailyStatsResult {
  data: DailyStatsRow | null;
  error: Error | null;
}

export async function fetchLatestDailyStats(
  client: Pick<{ from: (table: string) => any }, "from"> = {
    from: () => null as never,
  },
): Promise<DailyStatsResult> {
  try {
    const { data, error } = await client
      .from("stats_journalieres")
      .select("*")
      .order("date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return { data: null, error };
    }

    const normalizedData = data
      ? ({
          date: data.date ?? "",
          total_visiteurs: data.total_visiteurs ?? 0,
          visiteurs_actuels: data.visiteurs_actuels ?? 0,
          badges_imprimes: data.badges_imprimes ?? 0,
          employes_presents: data.employes_presents ?? 0,
          activites_du_jour: data.activites_du_jour ?? 0,
        } as DailyStatsRow)
      : null;

    return { data: normalizedData, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error("Unknown error"),
    };
  }
}
