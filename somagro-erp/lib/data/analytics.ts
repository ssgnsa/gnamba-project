import { createServerSupabase } from "@/lib/supabase/server";

export type AnalyticsSession = {
  id: string;
  start_time: string;
  entries_count: number | null;
  exits_count: number | null;
  net_change: number | null;
  confidence_score: number | null;
  status: string;
  mode: string | null;
};

export type AnalyticsSnapshot = {
  updatedAt: string;
  sessions: AnalyticsSession[];
  totalSessions: number;
  avgConfidence: number;
  entries24h: number;
  net24h: number;
  pendingReview: number;
};

export async function getAnalyticsSnapshot(): Promise<AnalyticsSnapshot> {
  const supabase = createServerSupabase();
  const updatedAt = new Date().toISOString();

  try {
    const { data } = await supabase
      .from("counting_sessions")
      .select(
        "id, start_time, entries_count, exits_count, net_change, confidence_score, status, mode",
      )
      .order("start_time", { ascending: false })
      .limit(24);

    const sessions = (data ?? []) as AnalyticsSession[];
    const totalSessions = sessions.length;

    const confidenceValues = sessions
      .map((session) => Number(session.confidence_score ?? 0))
      .filter((value) => value > 0);

    const avgConfidence =
      confidenceValues.length > 0
        ? confidenceValues.reduce((sum, value) => sum + value, 0) /
          confidenceValues.length
        : 0;

    const since = new Date();
    since.setHours(since.getHours() - 24);

    const recentSessions = sessions.filter(
      (session) => new Date(session.start_time) >= since,
    );
    const entries24h = recentSessions.reduce(
      (sum, session) => sum + Number(session.entries_count ?? 0),
      0,
    );
    const net24h = recentSessions.reduce(
      (sum, session) => sum + Number(session.net_change ?? 0),
      0,
    );

    const pendingReview = sessions.filter(
      (session) => session.status === "pending_review",
    ).length;

    return {
      updatedAt,
      sessions,
      totalSessions,
      avgConfidence: Number(avgConfidence.toFixed(2)),
      entries24h,
      net24h,
      pendingReview,
    };
  } catch {
    return {
      updatedAt,
      sessions: [],
      totalSessions: 0,
      avgConfidence: 0,
      entries24h: 0,
      net24h: 0,
      pendingReview: 0,
    };
  }
}
