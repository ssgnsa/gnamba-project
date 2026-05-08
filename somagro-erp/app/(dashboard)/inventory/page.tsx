import ModuleShell from "@/components/dashboard/ModuleShell";
import { MetricCard } from "@/components/dashboard/MetricCard";
import AutoRefresh from "@/components/dashboard/AutoRefresh";
import { requireAccess } from "@/lib/access";
import ConfirmDeleteDrawer from "@/components/forms/ConfirmDeleteDrawer";
import CreateInventoryCategoryForm from "@/components/forms/inventory/CreateInventoryCategoryForm";
import CreateInventoryItemForm from "@/components/forms/inventory/CreateInventoryItemForm";
import CreateInventoryMovementForm from "@/components/forms/inventory/CreateInventoryMovementForm";
import UpdateInventoryCategoryForm from "@/components/forms/inventory/UpdateInventoryCategoryForm";
import UpdateInventoryItemForm from "@/components/forms/inventory/UpdateInventoryItemForm";
import { createServerSupabase } from "@/lib/supabase/server";
import { formatNumber } from "@/lib/utils";

export default async function Page() {
  await requireAccess("inventory");
  const supabase = createServerSupabase();

  const { data: inventoryData } = await supabase
    .from("inventory_items")
    .select(
      "id, name, category_id, sku, unit, current_stock, min_stock_threshold, max_stock_threshold, unit_price, location, expiry_date, supplier",
    )
    .order("name", { ascending: true });

  const { data: categoriesData } = await supabase
    .from("inventory_categories")
    .select("id, name, unit")
    .order("name", { ascending: true });

  const { data: usersData } = await supabase
    .from("users")
    .select("id, full_name, email")
    .order("full_name", { ascending: true });

  const items = inventoryData ?? [];
  const categories = categoriesData ?? [];
  const users = (usersData ?? []).map((user) => ({
    id: user.id,
    name: user.full_name ?? user.email ?? "Utilisateur",
  }));
  const totalItems = items.length;
  const criticalItems = items.filter(
    (item) =>
      item.min_stock_threshold !== null &&
      Number(item.current_stock ?? 0) <= Number(item.min_stock_threshold),
  );
  const criticalCount = criticalItems.length;
  const stockValue = items.reduce(
    (sum, item) =>
      sum + Number(item.current_stock ?? 0) * Number(item.unit_price ?? 0),
    0,
  );

  return (
    <ModuleShell
      title="Stock & Inventaire"
      subtitle="Suivi des articles, seuils et valorisation du stock."
      tag="Stock"
      tone="from-slate-900 via-slate-700 to-emerald-500"
      actions={[
        { label: "Nouvel article", variant: "primary", href: "?create=item" },
        { label: "Mouvement", variant: "outline", href: "?create=movement" },
        { label: "Historique", variant: "ghost", href: "/inventory/movements" },
        {
          label: "Nouvelle categorie",
          variant: "ghost",
          href: "?create=category",
        },
      ]}
    >
      <AutoRefresh intervalMs={90000} />
      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Articles en stock"
          value={formatNumber(totalItems)}
          change="toutes categories"
          helper="inventaire"
          tone="emerald"
        />
        <MetricCard
          label="Seuils critiques"
          value={formatNumber(criticalCount)}
          change="a surveiller"
          helper="seuil min"
          tone="rose"
        />
        <MetricCard
          label="Valeur stock"
          value={`${formatNumber(Math.round(stockValue))} FCFA`}
          change="estimation"
          helper="valorisation"
          tone="sky"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Inventaire
              </p>
              <h2 className="mt-2 text-lg font-semibold text-slate-900">
                Articles critiques
              </h2>
            </div>
            <button className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
              Commander
            </button>
          </div>
          <div className="mt-6 space-y-3">
            {criticalItems.length === 0 ? (
              <p className="text-sm text-slate-500">Aucune alerte stock.</p>
            ) : (
              criticalItems.slice(0, 6).map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {item.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        Emplacement: {item.location ?? "--"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-slate-500">
                      <span>
                        {item.current_stock ?? 0} {item.unit ?? ""}
                      </span>
                      <span className="rounded-full bg-white px-2 py-1 text-[10px]">
                        seuil {item.min_stock_threshold ?? 0}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <a
                      href={`?edit=item&id=${item.id}`}
                      className="rounded-full border border-slate-200 bg-white px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-600"
                    >
                      Modifier
                    </a>
                    <a
                      href={`?delete=item&id=${item.id}`}
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
            Synthese
          </p>
          <h2 className="mt-2 text-lg font-semibold text-slate-900">
            Stock a optimiser
          </h2>
          <div className="mt-6 space-y-4 text-sm text-slate-600">
            {items.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-200 p-4"
              >
                <p className="font-medium text-slate-900">{item.name}</p>
                <p className="mt-2 text-xs text-slate-500">
                  Quantite: {item.current_stock ?? 0} {item.unit ?? ""}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href={`?edit=item&id=${item.id}`}
                    className="rounded-full border border-slate-200 bg-white px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-600"
                  >
                    Modifier
                  </a>
                  <a
                    href={`?delete=item&id=${item.id}`}
                    className="rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-rose-700"
                  >
                    Supprimer
                  </a>
                </div>
              </div>
            ))}
            {items.length === 0 && (
              <p className="text-xs text-slate-500">
                Aucun article disponible.
              </p>
            )}
          </div>
        </div>
      </section>
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Categories
            </p>
            <h2 className="mt-2 text-lg font-semibold text-slate-900">
              Organisation de l&apos;inventaire
            </h2>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
            {formatNumber(categories.length)} categories
          </span>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {categories.length === 0 ? (
            <p className="text-sm text-slate-500">Aucune categorie definie.</p>
          ) : (
            categories.map((category) => (
              <div
                key={category.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <p className="text-sm font-semibold text-slate-900">
                  {category.name}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Unite: {category.unit ?? "--"}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href={`?edit=category&id=${category.id}`}
                    className="rounded-full border border-slate-200 bg-white px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-600"
                  >
                    Modifier
                  </a>
                  <a
                    href={`?delete=category&id=${category.id}`}
                    className="rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-rose-700"
                  >
                    Supprimer
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
      <CreateInventoryItemForm categories={categories} />
      <CreateInventoryMovementForm items={items} users={users} />
      <CreateInventoryCategoryForm />
      <UpdateInventoryItemForm categories={categories} items={items} />
      <UpdateInventoryCategoryForm categories={categories} />
      <ConfirmDeleteDrawer
        queryValue="item"
        table="inventory_items"
        title="Supprimer l'article"
        description="Retirez cet article de l'inventaire."
        records={items.map((item) => ({
          id: item.id,
          label: item.name ?? "Article",
          description: `${item.current_stock ?? 0} ${item.unit ?? ""}`.trim(),
        }))}
      />
      <ConfirmDeleteDrawer
        queryValue="category"
        table="inventory_categories"
        title="Supprimer la categorie"
        description="Retirez cette categorie si elle n'est plus utilisee."
        records={categories.map((category) => ({
          id: category.id,
          label: category.name ?? "Categorie",
          description: category.unit ?? "Sans unite par defaut",
        }))}
      />
    </ModuleShell>
  );
}
