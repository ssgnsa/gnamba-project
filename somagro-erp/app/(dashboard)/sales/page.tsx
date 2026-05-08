import ModuleShell from "@/components/dashboard/ModuleShell";
import { MetricCard } from "@/components/dashboard/MetricCard";
import AutoRefresh from "@/components/dashboard/AutoRefresh";
import { requireAccess } from "@/lib/access";
import CreateCustomerForm from "@/components/forms/sales/CreateCustomerForm";
import CreateSaleForm from "@/components/forms/sales/CreateSaleForm";
import UpdateCustomerForm from "@/components/forms/sales/UpdateCustomerForm";
import UpdateSaleForm from "@/components/forms/sales/UpdateSaleForm";
import ConfirmDeleteDrawer from "@/components/forms/ConfirmDeleteDrawer";
import { createServerSupabase } from "@/lib/supabase/server";
import { formatDate, formatNumber } from "@/lib/utils";

export default async function Page() {
  await requireAccess("sales");
  const supabase = createServerSupabase();
  const since = new Date();
  since.setDate(since.getDate() - 7);

  const resolveCustomer = (value: unknown) => {
    if (!value) return "--";
    if (Array.isArray(value)) return value[0]?.name ?? "--";
    return (value as { name?: string }).name ?? "--";
  };

  const { data: salesData } = await supabase
    .from("sales")
    .select(
      "id, customer_id, sale_date, invoice_number, total_amount, status, notes, customers(name)",
    )
    .order("sale_date", { ascending: false })
    .limit(12);

  const { data: customersData } = await supabase
    .from("customers")
    .select(
      "id, name, contact_person, email, phone, address, tax_id, payment_terms",
    )
    .order("name", { ascending: true });

  const sales = salesData ?? [];
  const customers = customersData ?? [];
  const weeklyRevenue = sales
    .filter((sale) => new Date(sale.sale_date) >= since)
    .reduce((sum, sale) => sum + Number(sale.total_amount ?? 0), 0);
  const draftCount = sales.filter((sale) => sale.status === "draft").length;
  const unpaidAmount = sales
    .filter((sale) => sale.status !== "paid" && sale.status !== "cancelled")
    .reduce((sum, sale) => sum + Number(sale.total_amount ?? 0), 0);

  return (
    <ModuleShell
      title="Ventes"
      subtitle="Devis, factures et suivi des paiements."
      tag="Commercial"
      tone="from-slate-900 via-slate-700 to-sky-500"
      actions={[
        { label: "Nouveau devis", variant: "primary", href: "?create=sale" },
        {
          label: "Nouveau client",
          variant: "outline",
          href: "?create=customer",
        },
        { label: "Exporter", variant: "ghost" },
      ]}
    >
      <AutoRefresh intervalMs={90000} />
      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="CA semaine"
          value={`${formatNumber(Math.round(weeklyRevenue))} FCFA`}
          change="7j"
          helper="ventes"
          tone="sky"
        />
        <MetricCard
          label="Devis en cours"
          value={formatNumber(draftCount)}
          change="pipeline"
          helper="draft"
          tone="emerald"
        />
        <MetricCard
          label="Impayes"
          value={`${formatNumber(Math.round(unpaidAmount))} FCFA`}
          change="a relancer"
          helper="statut"
          tone="rose"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Transactions
              </p>
              <h2 className="mt-2 text-lg font-semibold text-slate-900">
                Ventes recentes
              </h2>
            </div>
            <button className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
              Voir tout
            </button>
          </div>
          <div className="mt-6 space-y-3">
            {sales.length === 0 ? (
              <p className="text-sm text-slate-500">
                Aucune vente enregistree.
              </p>
            ) : (
              sales.map((sale) => (
                <div
                  key={sale.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {sale.invoice_number ?? sale.id}
                      </p>
                      <p className="text-xs text-slate-500">
                        Client: {resolveCustomer(sale.customers)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-slate-500">
                      <span>{sale.status}</span>
                      <span className="rounded-full bg-white px-2 py-1 text-[10px]">
                        {formatDate(sale.sale_date)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <a
                      href={`?edit=sale&id=${sale.id}`}
                      className="rounded-full border border-slate-200 bg-white px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-600"
                    >
                      Modifier
                    </a>
                    <a
                      href={`?delete=sale&id=${sale.id}`}
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
            Base clients
          </p>
          <h2 className="mt-2 text-lg font-semibold text-slate-900">
            Clients a jour
          </h2>
          <div className="mt-6 space-y-4 text-sm text-slate-600">
            {customers.slice(0, 4).map((customer) => (
              <div
                key={customer.id}
                className="rounded-2xl border border-slate-200 p-4"
              >
                <p className="font-medium text-slate-900">{customer.name}</p>
                <p className="mt-2 text-xs text-slate-500">
                  {customer.contact_person ||
                    customer.email ||
                    customer.phone ||
                    "Coordonnees a completer"}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href={`?edit=customer&id=${customer.id}`}
                    className="rounded-full border border-slate-200 bg-white px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-600"
                  >
                    Modifier
                  </a>
                  <a
                    href={`?delete=customer&id=${customer.id}`}
                    className="rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-rose-700"
                  >
                    Supprimer
                  </a>
                </div>
              </div>
            ))}
            {customers.length === 0 && (
              <p className="text-xs text-slate-500">Aucun client enregistre.</p>
            )}
          </div>
        </div>
      </section>
      <CreateSaleForm customers={customers} />
      <CreateCustomerForm />
      <UpdateSaleForm
        customers={customers.map((customer) => ({
          id: customer.id,
          name: customer.name ?? "Client",
        }))}
        sales={sales}
      />
      <UpdateCustomerForm customers={customers} />
      <ConfirmDeleteDrawer
        queryValue="sale"
        table="sales"
        title="Supprimer le devis / la facture"
        description="Retirez cette vente de l'historique commercial."
        records={sales.map((sale) => ({
          id: sale.id,
          label: sale.invoice_number ?? `Vente ${formatDate(sale.sale_date)}`,
          description: `${resolveCustomer(sale.customers)} • ${formatNumber(Math.round(Number(sale.total_amount ?? 0)))} FCFA`,
        }))}
      />
      <ConfirmDeleteDrawer
        queryValue="customer"
        table="customers"
        title="Supprimer le client"
        description="Retirez cette fiche client si elle n'est plus utile."
        records={customers.map((customer) => ({
          id: customer.id,
          label: customer.name ?? "Client",
          description:
            customer.contact_person ??
            customer.email ??
            customer.phone ??
            "Aucune information complementaire",
        }))}
      />
    </ModuleShell>
  );
}
