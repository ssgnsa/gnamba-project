import ModuleShell from "@/components/dashboard/ModuleShell";
import { MetricCard } from "@/components/dashboard/MetricCard";
import AutoRefresh from "@/components/dashboard/AutoRefresh";
import ConfirmDeleteDrawer from "@/components/forms/ConfirmDeleteDrawer";
import { requireAccess } from "@/lib/access";
import CreateProjectForm from "@/components/forms/constructions/CreateProjectForm";
import UpdateProjectForm from "@/components/forms/constructions/UpdateProjectForm";
import { createServerSupabase } from "@/lib/supabase/server";
import { formatDate, formatNumber, formatPercent } from "@/lib/utils";

export default async function Page() {
  await requireAccess("constructions");
  const supabase = createServerSupabase();

  const { data: projectsData } = await supabase
    .from("construction_projects")
    .select(
      "id, project_name, project_type, building_id, status, budget, actual_cost, contractor, start_date, end_date, documents_urls, notes",
    )
    .order("start_date", { ascending: false })
    .limit(10);

  const { data: buildingsData } = await supabase
    .from("buildings")
    .select("id, name")
    .order("name", { ascending: true });

  const projects = projectsData ?? [];
  const buildings = buildingsData ?? [];
  const activeProjects = projects.filter(
    (project) =>
      project.status === "planned" || project.status === "in_progress",
  );
  const activeCount = activeProjects.length;
  const totalCount = projects.length;
  const budgetEngaged = activeProjects.reduce(
    (sum, project) => sum + Number(project.budget ?? 0),
    0,
  );
  const completedCount = projects.filter(
    (project) => project.status === "completed",
  ).length;
  const completionRate =
    totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <ModuleShell
      title="Projets"
      subtitle="Suivi des chantiers, budgets et planning de livraison."
      tag="Constructions"
      tone="from-slate-900 via-slate-700 to-emerald-500"
      actions={[
        {
          label: "Nouveau projet",
          variant: "primary",
          href: "?create=project",
        },
        { label: "Budget", variant: "outline" },
        { label: "Exporter", variant: "ghost" },
      ]}
    >
      <AutoRefresh intervalMs={90000} />
      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Projets actifs"
          value={formatNumber(activeCount)}
          change="en cours"
          helper="planifies + live"
          tone="amber"
        />
        <MetricCard
          label="Budget engage"
          value={formatNumber(Math.round(budgetEngaged)) + " FCFA"}
          change="cette annee"
          helper="budget"
          tone="rose"
        />
        <MetricCard
          label="Livraison"
          value={formatPercent(completionRate)}
          change="termine"
          helper="tous projets"
          tone="emerald"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Chantiers
              </p>
              <h2 className="mt-2 text-lg font-semibold text-slate-900">
                Projets en suivi
              </h2>
            </div>
            <button className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
              Voir tout
            </button>
          </div>
          <div className="mt-6 space-y-3">
            {projects.length === 0 ? (
              <p className="text-sm text-slate-500">Aucun projet enregistre.</p>
            ) : (
              projects.map((project) => (
                <div
                  key={project.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {project.project_name}
                      </p>
                      <p className="text-xs text-slate-500">
                        Type: {project.project_type ?? "--"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-slate-500">
                      <span>{project.status}</span>
                      <span className="rounded-full bg-white px-2 py-1 text-[10px]">
                        {formatDate(project.end_date)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <a
                      href={`?edit=project&id=${project.id}`}
                      className="rounded-full border border-slate-200 bg-white px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-600"
                    >
                      Modifier
                    </a>
                    <a
                      href={`?delete=project&id=${project.id}`}
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
            Budget
          </p>
          <h2 className="mt-2 text-lg font-semibold text-slate-900">
            Alertes financieres
          </h2>
          <div className="mt-6 space-y-4 text-sm text-slate-600">
            {projects.slice(0, 3).map((project) => (
              <div
                key={project.id}
                className="rounded-2xl border border-slate-200 p-4"
              >
                <p className="font-medium text-slate-900">
                  {project.project_name}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Budget:{" "}
                  {formatNumber(Math.round(Number(project.budget ?? 0)))} FCFA
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href={`?edit=project&id=${project.id}`}
                    className="rounded-full border border-slate-200 bg-white px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-600"
                  >
                    Modifier
                  </a>
                  <a
                    href={`?delete=project&id=${project.id}`}
                    className="rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-rose-700"
                  >
                    Supprimer
                  </a>
                </div>
              </div>
            ))}
            {projects.length === 0 && (
              <p className="text-xs text-slate-500">Aucun projet critique.</p>
            )}
          </div>
        </div>
      </section>
      <CreateProjectForm buildings={buildings} />
      <UpdateProjectForm buildings={buildings} projects={projects} />
      <ConfirmDeleteDrawer
        queryValue="project"
        table="construction_projects"
        title="Supprimer le projet"
        description="Retirez ce chantier du portefeuille constructions."
        records={projects.map((project) => ({
          id: project.id,
          label: project.project_name ?? "Projet",
          description: `${project.status ?? "sans statut"} • fin ${formatDate(project.end_date)}`,
        }))}
      />
    </ModuleShell>
  );
}
