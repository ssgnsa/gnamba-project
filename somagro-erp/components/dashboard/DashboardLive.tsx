"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { DashboardSummary } from "@/lib/data/summary";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { RotatingCard } from "@/components/dashboard/RotatingCard";

const cardIcons = {
  herd: (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <path d="M4 14c1.5-2.5 4-4 8-4s6.5 1.5 8 4" />
      <path d="M6 14v4m12-4v4" />
      <path d="M9 9c0-2 1.5-3 3-3s3 1 3 3" />
    </svg>
  ),
  crops: (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <path d="M12 20V5" />
      <path d="M12 5c-3 0-5 2-5 5 3 0 5-2 5-5Z" />
      <path d="M12 5c3 0 5 2 5 5-3 0-5-2-5-5Z" />
    </svg>
  ),
  finance: (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <path d="M4 18h16" />
      <path d="M6 16V8m6 8V6m6 10v-4" />
    </svg>
  ),
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("fr-FR").format(value);
}

function formatCurrency(value: number) {
  return `${formatNumber(Math.round(value))} FCFA`;
}

type DashboardLiveProps = {
  initial: DashboardSummary;
};

export default function DashboardLive({ initial }: DashboardLiveProps) {
  const [summary, setSummary] = useState<DashboardSummary>(initial);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/dashboard/summary", {
        cache: "no-store",
      });
      if (!response.ok) return;
      const payload = (await response.json()) as DashboardSummary;
      setSummary(payload);
    } catch {
      // ignore refresh errors
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel("dashboard-live");

    const tables = [
      "lots",
      "animals",
      "livestock_events",
      "fields",
      "buildings",
      "financial_transactions",
      "inventory_items",
    ];

    tables.forEach((table) => {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => {
          refresh();
        },
      );
    });

    channel.subscribe();

    const interval = setInterval(refresh, 120000);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [refresh]);

  return (
    <div className="grid gap-8">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-emerald-800 to-lime-600 p-8 text-white shadow-lg animate-rise">
        <div className="pointer-events-none absolute -left-12 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl animate-float-soft" />
        <div className="pointer-events-none absolute -bottom-24 right-0 h-60 w-60 rounded-full bg-white/10 blur-3xl animate-float-soft" />
        <div className="relative grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-white/70">
              Centre de pilotage
            </p>
            <h1 className="mt-4 text-3xl font-semibold font-display md:text-4xl">
              SomAgro Premium pour operations agricoles multi-metiers.
            </h1>
            <p className="mt-4 text-sm text-white/80 md:text-base">
              Suivi en temps reel, alertes et decisions guidees pour elevage,
              cultures, infrastructures et finance.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button className="rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-900">
                Creer un lot
              </button>
              <button className="rounded-full border border-white/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                Planifier une intervention
              </button>
              <button className="rounded-full bg-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                Exporter le rapport
              </button>
            </div>
          </div>
          <div className="grid gap-4">
            <div className="rounded-2xl border border-white/20 bg-white/10 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/70">
                Pulse temps reel
              </p>
              <div className="mt-4 grid gap-3">
                {[
                  { label: "Elevage", value: summary.livestockScore },
                  { label: "Cultures", value: summary.cropsScore },
                  { label: "Constructions", value: summary.constructionsScore },
                ].map((item) => (
                  <div key={item.label} className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-white/80">
                      <span>{item.label}</span>
                      <span>{item.value}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/20">
                      <div
                        className="h-2 rounded-full bg-white"
                        style={{ width: `${item.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/70">
                Alertes critiques
              </p>
              <div className="mt-4 space-y-3 text-sm text-white/80">
                <div className="flex items-center justify-between">
                  <span>Mortalite 30j</span>
                  <span className="rounded-full bg-white/20 px-2 py-1 text-[10px] uppercase">
                    {summary.deathsCount}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Articles sous seuil</span>
                  <span className="rounded-full bg-white/20 px-2 py-1 text-[10px] uppercase">
                    {summary.inventoryAlerts}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Batiments operationnels</span>
                  <span className="rounded-full bg-white/20 px-2 py-1 text-[10px] uppercase">
                    {summary.operationalBuildings}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3 animate-rise animate-rise-delay-1">
        <RotatingCard
          label="Elevage"
          title="Effectifs actifs"
          metric={formatNumber(summary.totalAnimals)}
          hint={`${summary.totalLots} lots suivis`}
          backTitle="Routine prioritaire"
          backItems={[
            `Mortalite 30j: ${summary.mortalityRate}%`,
            "Recalibrer dose vaccins",
            "Audit temperature batiment B4",
          ]}
          accentClass="from-amber-500 to-rose-500"
          icon={cardIcons.herd}
        />
        <RotatingCard
          label="Cultures"
          title="Parcelles actives"
          metric={formatNumber(summary.activeFields)}
          hint={`Total parcelles: ${summary.totalFields}`}
          backTitle="Actions terrain"
          backItems={[
            "Irrigation parcelle C3",
            "Fertilisation parcelle A2",
            "Controle maladie serres",
          ]}
          accentClass="from-emerald-500 to-lime-400"
          icon={cardIcons.crops}
        />
        <RotatingCard
          label="Finance"
          title="Marge brute"
          metric={formatCurrency(summary.grossMargin)}
          hint="Projection fin de mois"
          backTitle="Decisions a prendre"
          backItems={[
            "Valider paiement fournisseur",
            "Bouclage ventes lot L-201",
            "Optimiser achats energie",
          ]}
          accentClass="from-sky-500 to-indigo-500"
          icon={cardIcons.finance}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-4 animate-rise animate-rise-delay-2">
        <MetricCard
          label="Mortalite 30j"
          value={`${summary.mortalityRate}%`}
          change={`${summary.deathsCount} cas`}
          helper="sur total animaux"
          tone="rose"
        />
        <MetricCard
          label="Parcelles actives"
          value={formatNumber(summary.activeFields)}
          change={`${summary.totalFields} total`}
          helper="campagne courante"
          tone="emerald"
        />
        <MetricCard
          label="Batiments operationnels"
          value={formatNumber(summary.operationalBuildings)}
          change={`${summary.totalBuildings} total`}
          helper="capacites ouvertes"
          tone="sky"
        />
        <MetricCard
          label="Stock critique"
          value={formatNumber(summary.inventoryAlerts)}
          change={summary.inventoryAlerts > 0 ? "alerte" : "stable"}
          helper="seuils min"
          tone="amber"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Production
              </p>
              <h2 className="mt-2 text-lg font-semibold text-slate-900">
                Calendrier des cycles
              </h2>
            </div>
            <button className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
              Voir planning
            </button>
          </div>
          <div className="mt-6 space-y-4">
            {[
              {
                label: "Mais - parcelle A2",
                value: "Semis",
                percent: "w-[72%]",
              },
              {
                label: "Tomate - serre 1",
                value: "Floraison",
                percent: "w-[55%]",
              },
              {
                label: "Manioc - bloc C",
                value: "Recolte",
                percent: "w-[88%]",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex items-center justify-between text-sm text-slate-700">
                  <span>{item.label}</span>
                  <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    {item.value}
                  </span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-white">
                  <div
                    className={`h-2 rounded-full bg-emerald-500 ${item.percent}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Activites
          </p>
          <h2 className="mt-2 text-lg font-semibold text-slate-900">
            Derniers evenements
          </h2>
          <div className="mt-4 space-y-4 text-sm text-slate-600">
            <div className="rounded-2xl border border-slate-200 p-4">
              <div className="flex items-center justify-between text-slate-900">
                <span className="font-medium">Synchronisation</span>
                <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  {new Date(summary.updatedAt).toLocaleTimeString("fr-FR")}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                Derniere mise a jour des indicateurs.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4">
              <div className="flex items-center justify-between text-slate-900">
                <span className="font-medium">Elevage</span>
                <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  30j
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                {summary.deathsCount} evenements de mortalite enregistres.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4">
              <div className="flex items-center justify-between text-slate-900">
                <span className="font-medium">Stock</span>
                <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  actuel
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                {summary.inventoryAlerts} articles sous seuil critique.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
