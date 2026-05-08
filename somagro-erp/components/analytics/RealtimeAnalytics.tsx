"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AnalyticsSnapshot } from "@/lib/data/analytics";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { formatNumber, formatPercent } from "@/lib/utils";

function buildLine(values: number[], width = 420, height = 160, padding = 16) {
  if (values.length === 0) return "";
  const max = Math.max(1, ...values);
  const step =
    values.length > 1 ? (width - padding * 2) / (values.length - 1) : 0;
  return values
    .map((value, index) => {
      const x = padding + index * step;
      const y = height - padding - (value / max) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");
}

type RealtimeAnalyticsProps = {
  initial: AnalyticsSnapshot;
};

export default function RealtimeAnalytics({ initial }: RealtimeAnalyticsProps) {
  const [snapshot, setSnapshot] = useState<AnalyticsSnapshot>(initial);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/analytics/snapshot", {
        cache: "no-store",
      });
      if (!response.ok) return;
      const payload = (await response.json()) as AnalyticsSnapshot;
      setSnapshot(payload);
    } catch {
      // ignore refresh errors
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel("analytics-live");

    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "counting_sessions" },
      () => {
        refresh();
      },
    );

    channel.subscribe();

    const interval = setInterval(refresh, 60000);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [refresh]);

  const series = useMemo(() => {
    const list = [...snapshot.sessions].sort(
      (a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
    );
    return list.slice(-12);
  }, [snapshot.sessions]);

  const entriesSeries = series.map((item) => Number(item.entries_count ?? 0));
  const exitsSeries = series.map((item) => Number(item.exits_count ?? 0));
  const netSeries = series.map((item, index) => {
    const net = item.net_change ?? entriesSeries[index] - exitsSeries[index];
    return Number(net ?? 0);
  });

  const entriesLine = buildLine(entriesSeries);
  const exitsLine = buildLine(exitsSeries);

  const maxNet = Math.max(1, ...netSeries.map((value) => Math.abs(value)));

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard
          label="Sessions IA"
          value={formatNumber(snapshot.totalSessions)}
          change="24 dernieres"
          helper="comptage"
          tone="emerald"
        />
        <MetricCard
          label="Confiance moyenne"
          value={formatPercent(snapshot.avgConfidence * 100, 1)}
          change="IA vision"
          helper="moyenne"
          tone="sky"
        />
        <MetricCard
          label="Entrees 24h"
          value={formatNumber(snapshot.entries24h)}
          change="animaux"
          helper="flux"
          tone="amber"
        />
        <MetricCard
          label="Alertes review"
          value={formatNumber(snapshot.pendingReview)}
          change="validation"
          helper="a verifier"
          tone="rose"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Flux temps reel
              </p>
              <h2 className="mt-2 text-lg font-semibold text-slate-900">
                Entrees vs sorties
              </h2>
            </div>
            <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
              maj {new Date(snapshot.updatedAt).toLocaleTimeString("fr-FR")}
            </span>
          </div>
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            {series.length === 0 ? (
              <p className="text-sm text-slate-500">
                Aucune session IA disponible.
              </p>
            ) : (
              <svg viewBox="0 0 420 160" className="h-40 w-full">
                <polyline
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                  points={entriesLine}
                />
                <polyline
                  fill="none"
                  stroke="#0ea5e9"
                  strokeWidth="2"
                  points={exitsLine}
                />
              </svg>
            )}
            <div className="mt-4 flex items-center gap-4 text-xs uppercase tracking-[0.2em] text-slate-500">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Entrees
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-sky-500" /> Sorties
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Net change
          </p>
          <h2 className="mt-2 text-lg font-semibold text-slate-900">
            Variation par session
          </h2>
          <div className="mt-6 flex items-end justify-between gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            {series.length === 0 ? (
              <p className="text-sm text-slate-500">Aucune donnee.</p>
            ) : (
              netSeries.map((value, index) => {
                const height = Math.round((Math.abs(value) / maxNet) * 88) + 12;
                const color = value >= 0 ? "bg-emerald-400" : "bg-rose-400";
                return (
                  <div
                    key={series[index].id}
                    className="flex flex-col items-center gap-2"
                  >
                    <div
                      className={`w-3 rounded-full ${color}`}
                      style={{ height }}
                    />
                    <span className="text-[10px] text-slate-500">{value}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Sessions
            </p>
            <h2 className="mt-2 text-lg font-semibold text-slate-900">
              Dernieres analyses IA
            </h2>
          </div>
          <button className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
            Exporter
          </button>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {series.length === 0 ? (
            <p className="text-sm text-slate-500">Aucune session recente.</p>
          ) : (
            series
              .slice()
              .reverse()
              .map((session) => (
                <div
                  key={session.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-center justify-between text-sm text-slate-700">
                    <span>{session.mode ?? "live"}</span>
                    <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      {session.status}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                    <span>Entrees: {session.entries_count ?? 0}</span>
                    <span>Sorties: {session.exits_count ?? 0}</span>
                    <span>Net: {session.net_change ?? 0}</span>
                  </div>
                </div>
              ))
          )}
        </div>
      </section>
    </div>
  );
}
