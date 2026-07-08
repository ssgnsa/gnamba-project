import { useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  Bot,
  CheckCheck,
  Copy,
  FileText,
  Rocket,
  ShieldCheck,
  Terminal,
  Gauge,
  Database,
} from "lucide-react";

type CommandItem = {
  label: string;
  command: string;
  description: string;
};

type PhaseItem = {
  id: number;
  title: string;
  subtitle: string;
  accent: string;
};

const COMMANDS: CommandItem[] = [
  {
    label: "État",
    command: "npm run codex -- status",
    description: "Affiche l’état consolidé du serveur et du contexte.",
  },
  {
    label: "Santé",
    command: "npm run codex -- health",
    description: "Produit le diagnostic de santé et les recommandations.",
  },
  {
    label: "Plan",
    command: "npm run codex -- plan",
    description: "Affiche le plan de migration par phase.",
  },
  {
    label: "Docs",
    command: "npm run codex -- docs",
    description: "Génère les guides dans docs/.codex-generated/",
  },
];

const PHASES: PhaseItem[] = [
  {
    id: 0,
    title: "Préparation",
    subtitle: "Gel, backup, inventaire",
    accent: "from-emerald-500 to-teal-500",
  },
  {
    id: 1,
    title: "Isolation",
    subtitle: "Réseau et stack cible",
    accent: "from-sky-500 to-cyan-500",
  },
  {
    id: 2,
    title: "Migration",
    subtitle: "Schéma, données, auth",
    accent: "from-amber-500 to-orange-500",
  },
  {
    id: 3,
    title: "Bascule",
    subtitle: "API et services hérités",
    accent: "from-fuchsia-500 to-pink-500",
  },
  {
    id: 4,
    title: "Nettoyage",
    subtitle: "Suppression du superflu",
    accent: "from-slate-500 to-slate-700",
  },
  {
    id: 5,
    title: "Validation",
    subtitle: "Tests et documentation",
    accent: "from-indigo-500 to-violet-500",
  },
];

function CommandCard({
  item,
  copied,
  onCopy,
}: {
  item: CommandItem;
  copied: string | null;
  onCopy: (command: string) => void;
}) {
  const isCopied = copied === item.command;
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-5 shadow-[0_20px_80px_rgba(15,23,42,0.25)] backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">
            <Terminal size={12} />
            {item.label}
          </div>
          <p className="mt-3 text-sm text-slate-300">{item.description}</p>
        </div>
        <button
          type="button"
          onClick={() => onCopy(item.command)}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
        >
          {isCopied ? <CheckCheck size={14} /> : <Copy size={14} />}
          {isCopied ? "Copié" : "Copier"}
        </button>
      </div>
      <code className="mt-4 block rounded-xl bg-black/35 px-4 py-3 text-sm text-emerald-300">
        {item.command}
      </code>
    </div>
  );
}

export default function CodexAssistant() {
  const [copied, setCopied] = useState<string | null>(null);

  const metrics = useMemo(
    () => [
      {
        label: "Score cible",
        value: "100/100",
        note: "Diagnostic et migration",
        icon: Gauge,
      },
      {
        label: "Phases",
        value: "6",
        note: "Préparation à validation",
        icon: Activity,
      },
      {
        label: "Docs générées",
        value: "3",
        note: "Architecture, migration, dépannage",
        icon: FileText,
      },
      {
        label: "Stack cible",
        value: "API locale Core",
        note: "DB, Kong, Auth, Storage, Flux",
        icon: Database,
      },
    ],
    [],
  );

  const handleCopy = async (command: string) => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(command);
      window.setTimeout(() => {
        setCopied((current) => (current === command ? null : current));
      }, 1200);
    } catch {
      setCopied(null);
    }
  };

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-slate-800 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.22),_transparent_38%),linear-gradient(145deg,_#020617_0%,_#0f172a_50%,_#111827_100%)] p-6 md:p-8 text-white shadow-[0_30px_100px_rgba(15,23,42,0.35)]">
        <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.06)_45%,transparent_90%)] opacity-60" />
        <div className="relative grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-100">
              <Bot size={14} />
              Assistant Codex
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-semibold tracking-tight md:text-5xl">
                Le centre d’orchestration EGS pour la santé, la migration et la doc.
              </h2>
              <p className="max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
                Cette vue regroupe l’assistant Codex côté frontend EGS: navigation vers les commandes,
                phases de migration, et artefacts générés. Les exécutions réelles restent côté CLI,
                ce qui garde le dashboard léger et sûr.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                <ShieldCheck size={13} />
                Rollback d’abord
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-sky-400/10 px-3 py-1 text-xs font-semibold text-sky-200">
                <Rocket size={13} />
                Migration progressive
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
                <FileText size={13} />
                Docs auto-générées
              </span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {metrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <div
                  key={metric.label}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-white/50">
                        {metric.label}
                      </p>
                      <p className="mt-1 text-xl font-semibold">{metric.value}</p>
                    </div>
                    <div className="rounded-2xl bg-white/10 p-3 text-cyan-200">
                      <Icon size={18} />
                    </div>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-slate-300">
                    {metric.note}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Commandes
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-slate-900">
                Commandes rapides Codex
              </h3>
            </div>
            <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
              <Terminal size={18} />
            </div>
          </div>
          <div className="mt-5 grid gap-4">
            {COMMANDS.map((item) => (
              <CommandCard
                key={item.command}
                item={item}
                copied={copied}
                onCopy={handleCopy}
              />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              Flux
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-900">
              Déroulé conseillé
            </h3>
            <div className="mt-5 space-y-3">
              {PHASES.map((phase) => (
                <div
                  key={phase.id}
                  className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-slate-50/80 p-4"
                >
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${phase.accent} text-sm font-bold text-white shadow-lg`}
                  >
                    {phase.id}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{phase.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{phase.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-cyan-200 bg-gradient-to-br from-cyan-50 to-sky-50 p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">
              Artefacts
            </p>
            <h3 className="mt-2 text-xl font-semibold text-slate-900">
              Documentation générée
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-700">
              <li className="flex items-center gap-2">
                <ArrowRight size={14} className="text-cyan-600" />
                <span>Architecture et cartographie du système</span>
              </li>
              <li className="flex items-center gap-2">
                <ArrowRight size={14} className="text-cyan-600" />
                <span>Guide de migration et séquence des phases</span>
              </li>
              <li className="flex items-center gap-2">
                <ArrowRight size={14} className="text-cyan-600" />
                <span>Procédures de dépannage et de rollback</span>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
