import ModuleShell from "@/components/dashboard/ModuleShell";
import { MetricCard } from "@/components/dashboard/MetricCard";
import AutoRefresh from "@/components/dashboard/AutoRefresh";
import { requireAccess } from "@/lib/access";
import CreateTaskForm from "@/components/forms/tasks/CreateTaskForm";
import UpdateTaskForm from "@/components/forms/tasks/UpdateTaskForm";
import ConfirmDeleteDrawer from "@/components/forms/ConfirmDeleteDrawer";
import { createServerSupabase } from "@/lib/supabase/server";
import { formatDate, formatNumber } from "@/lib/utils";

export default async function Page() {
  await requireAccess("tasks");
  const supabase = createServerSupabase();
  const today = new Date().toISOString().slice(0, 10);

  const resolveUser = (value: unknown) => {
    if (!value) return "--";
    if (Array.isArray(value)) return value[0]?.full_name ?? "--";
    return (value as { full_name?: string }).full_name ?? "--";
  };

  const { data: tasksData, error } = await supabase
    .from("tasks")
    .select(
      "id, title, description, status, priority, due_date, assigned_to, users(full_name)",
    )
    .order("due_date", { ascending: true })
    .limit(12);

  const { data: usersData } = await supabase
    .from("users")
    .select("id, full_name, email")
    .order("full_name", { ascending: true });

  const tasks = error ? [] : (tasksData ?? []);
  const users = (usersData ?? []).map((user) => ({
    id: user.id,
    name: user.full_name ?? user.email ?? "Utilisateur",
  }));
  const openCount = tasks.filter((task) => task.status !== "completed").length;
  const assignedCount = tasks.filter((task) => task.assigned_to).length;
  const overdueCount = tasks.filter(
    (task) =>
      task.due_date && task.due_date < today && task.status !== "completed",
  ).length;

  return (
    <ModuleShell
      title="Taches"
      subtitle="Planification, attribution et suivi des operations terrain."
      tag="RH"
      tone="from-slate-900 via-slate-700 to-emerald-500"
      actions={[
        { label: "Nouvelle tache", variant: "primary", href: "?create=task" },
        { label: "Planning", variant: "outline" },
        { label: "Exporter", variant: "ghost" },
      ]}
    >
      <AutoRefresh intervalMs={90000} />
      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Taches ouvertes"
          value={formatNumber(openCount)}
          change="a traiter"
          helper="workflow"
          tone="emerald"
        />
        <MetricCard
          label="Affectees"
          value={formatNumber(assignedCount)}
          change="equipes"
          helper="assignation"
          tone="sky"
        />
        <MetricCard
          label="Retard"
          value={formatNumber(overdueCount)}
          change="priorite"
          helper="delais"
          tone="rose"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Journal
              </p>
              <h2 className="mt-2 text-lg font-semibold text-slate-900">
                Taches planifiees
              </h2>
            </div>
            <button className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
              Voir tout
            </button>
          </div>
          <div className="mt-6 space-y-3">
            {tasks.length === 0 ? (
              <p className="text-sm text-slate-500">Aucune tache disponible.</p>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {task.title}
                      </p>
                      <p className="text-xs text-slate-500">
                        Assigne: {resolveUser(task.users)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-slate-500">
                      <span>{task.status ?? "--"}</span>
                      <span className="rounded-full bg-white px-2 py-1 text-[10px]">
                        {formatDate(task.due_date)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <a
                      href={`?edit=task&id=${task.id}`}
                      className="rounded-full border border-slate-200 bg-white px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-600"
                    >
                      Modifier
                    </a>
                    <a
                      href={`?delete=task&id=${task.id}`}
                      className="rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-rose-700"
                    >
                      Supprimer
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Priorites
          </p>
          <h2 className="mt-2 text-lg font-semibold text-slate-900">
            Actions critiques
          </h2>
          <div className="mt-6 space-y-4 text-sm text-slate-600">
            {tasks.slice(0, 3).map((task) => (
              <div
                key={task.id}
                className="rounded-2xl border border-slate-200 p-4"
              >
                <p className="font-medium text-slate-900">{task.title}</p>
                <p className="mt-2 text-xs text-slate-500">
                  Priorite: {task.priority ?? "--"}
                </p>
              </div>
            ))}
            {tasks.length === 0 && (
              <p className="text-xs text-slate-500">
                Aucune priorite en cours.
              </p>
            )}
          </div>
        </div>
      </section>
      <CreateTaskForm users={users} />
      <UpdateTaskForm users={users} tasks={tasks} />
      <ConfirmDeleteDrawer
        queryValue="task"
        table="tasks"
        title="Supprimer la tache"
        description="Retirez cette tache du planning."
        records={tasks.map((task) => ({
          id: task.id,
          label: task.title ?? "Tache",
          description: `${task.status ?? "--"} • echeance ${formatDate(task.due_date)}`,
        }))}
      />
    </ModuleShell>
  );
}
