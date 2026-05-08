import ModuleShell from "@/components/dashboard/ModuleShell";
import { MetricCard } from "@/components/dashboard/MetricCard";
import AutoRefresh from "@/components/dashboard/AutoRefresh";
import { requireAccess } from "@/lib/access";
import CreateTenantForm from "@/components/forms/settings/CreateTenantForm";
import CreateUserForm from "@/components/forms/settings/CreateUserForm";
import InviteUserForm from "@/components/forms/settings/InviteUserForm";
import UpdateLogoForm from "@/components/forms/settings/UpdateLogoForm";
import { createServerSupabase } from "@/lib/supabase/server";
import { formatNumber } from "@/lib/utils";

export default async function Page() {
  await requireAccess("settings");
  const supabase = createServerSupabase();

  const { data: usersData } = await supabase
    .from("users")
    .select("id, full_name, role, is_active, email")
    .order("full_name", { ascending: true })
    .limit(20);

  const { data: tenantsData } = await supabase
    .from("tenants")
    .select("id, name, subscription_tier, logo_url")
    .limit(5);

  const users = usersData ?? [];
  const tenants = tenantsData ?? [];
  const activeUsers = users.filter((user) => user.is_active).length;
  const roleCount = new Set(users.map((user) => user.role)).size;

  return (
    <ModuleShell
      title="Parametres"
      subtitle="Gestion des acces, roles et configuration SomAgro."
      tag="Admin"
      tone="from-slate-900 via-slate-700 to-indigo-500"
      actions={[
        { label: "Inviter", variant: "primary", href: "?create=invite" },
        {
          label: "Nouvel utilisateur",
          variant: "outline",
          href: "?create=user",
        },
        { label: "Nouveau tenant", variant: "ghost", href: "?create=tenant" },
        { label: "Logo", variant: "ghost", href: "?create=logo" },
      ]}
    >
      <AutoRefresh intervalMs={120000} />
      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Utilisateurs actifs"
          value={formatNumber(activeUsers)}
          change="disponibles"
          helper="acces"
          tone="emerald"
        />
        <MetricCard
          label="Roles distincts"
          value={formatNumber(roleCount)}
          change="securite"
          helper="droits"
          tone="sky"
        />
        <MetricCard
          label="Tenants"
          value={formatNumber(tenants.length)}
          change="organisations"
          helper="multi-tenant"
          tone="amber"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Utilisateurs
              </p>
              <h2 className="mt-2 text-lg font-semibold text-slate-900">
                Acces recents
              </h2>
            </div>
            <button className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
              Gestions
            </button>
          </div>
          <div className="mt-6 space-y-3">
            {users.length === 0 ? (
              <p className="text-sm text-slate-500">
                Aucun utilisateur enregistre.
              </p>
            ) : (
              users.slice(0, 6).map((user) => (
                <div
                  key={user.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {user.full_name ?? user.email}
                      </p>
                      <p className="text-xs text-slate-500">
                        Role: {user.role}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-slate-500">
                      <span>{user.is_active ? "actif" : "inactif"}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Tenants
          </p>
          <h2 className="mt-2 text-lg font-semibold text-slate-900">
            Niveaux de service
          </h2>
          <div className="mt-6 space-y-4 text-sm text-slate-600">
            {tenants.length === 0 ? (
              <p className="text-xs text-slate-500">
                Aucune organisation disponible.
              </p>
            ) : (
              tenants.map((tenant) => (
                <div
                  key={tenant.id}
                  className="rounded-2xl border border-slate-200 p-4"
                >
                  <p className="font-medium text-slate-900">{tenant.name}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    Abonnement: {tenant.subscription_tier}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    Logo: {tenant.logo_url ?? "non defini"}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
      <InviteUserForm tenants={tenants} />
      <CreateUserForm tenants={tenants} />
      <CreateTenantForm />
      <UpdateLogoForm tenants={tenants} />
    </ModuleShell>
  );
}
