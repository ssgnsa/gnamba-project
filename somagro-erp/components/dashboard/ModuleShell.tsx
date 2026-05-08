import type { ReactNode } from "react";
import Link from "next/link";

interface ModuleAction {
  label: string;
  variant?: "primary" | "ghost" | "outline";
  href?: string;
}

interface ModuleShellProps {
  title: string;
  subtitle: string;
  tag?: string;
  tone?: string;
  actions?: ModuleAction[];
  actionsSlot?: ReactNode;
  children: ReactNode;
}

const actionStyles: Record<NonNullable<ModuleAction["variant"]>, string> = {
  primary: "bg-white text-slate-900 hover:bg-slate-100",
  outline: "border border-white/40 text-white hover:border-white",
  ghost: "bg-white/10 text-white hover:bg-white/20",
};

export default function ModuleShell({
  title,
  subtitle,
  tag,
  tone = "from-slate-900 via-slate-700 to-emerald-500",
  actions = [],
  actionsSlot,
  children,
}: ModuleShellProps) {
  return (
    <div className="grid gap-4 sm:gap-6">
      <section
        className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${tone} p-4 text-white shadow-lg sm:p-6 md:p-8`}
      >
        <div className="pointer-events-none absolute -left-24 -top-24 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 right-0 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            {tag ? (
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/70 sm:text-xs sm:tracking-[0.3em]">
                {tag}
              </p>
            ) : null}
            <h1 className="mt-1 text-2xl font-semibold font-display sm:mt-2 sm:text-3xl">
              {title}
            </h1>
            <p className="mt-1 text-xs text-white/80 sm:mt-2 sm:text-sm md:text-base">
              {subtitle}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 flex-shrink-0">
            {actionsSlot
              ? actionsSlot
              : actions.map((action) => {
                  const variant = action.variant ?? "ghost";
                  const className = `rounded-full px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] transition min-h-[44px] sm:px-4 sm:py-2 sm:text-xs sm:tracking-[0.2em] ${actionStyles[variant]}`;
                  if (action.href) {
                    return (
                      <Link
                        key={action.label}
                        href={action.href}
                        className={className}
                      >
                        {action.label}
                      </Link>
                    );
                  }
                  return (
                    <button
                      key={action.label}
                      type="button"
                      className={className}
                    >
                      {action.label}
                    </button>
                  );
                })}
          </div>
        </div>
      </section>
      {children}
    </div>
  );
}
