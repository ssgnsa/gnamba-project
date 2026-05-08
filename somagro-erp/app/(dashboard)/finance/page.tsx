import ModuleShell from "@/components/dashboard/ModuleShell";
import { MetricCard } from "@/components/dashboard/MetricCard";
import AutoRefresh from "@/components/dashboard/AutoRefresh";
import { requireAccess } from "@/lib/access";
import CreateTransactionForm from "@/components/forms/finance/CreateTransactionForm";
import UpdateTransactionForm from "@/components/forms/finance/UpdateTransactionForm";
import ConfirmDeleteDrawer from "@/components/forms/ConfirmDeleteDrawer";
import { createServerSupabase } from "@/lib/supabase/server";
import { formatDate, formatNumber } from "@/lib/utils";

export default async function Page() {
  await requireAccess("finance");
  const supabase = createServerSupabase();
  const start = new Date();
  start.setDate(1);

  const { data: transactionsData } = await supabase
    .from("financial_transactions")
    .select(
      "id, transaction_type, category, amount, transaction_date, description, reference_type, reference_id, created_by",
    )
    .order("transaction_date", { ascending: false })
    .limit(12);

  const { data: usersData } = await supabase
    .from("users")
    .select("id, full_name, email")
    .order("full_name", { ascending: true });

  const transactions = transactionsData ?? [];
  const users = (usersData ?? []).map((user) => ({
    id: user.id,
    name: user.full_name ?? user.email ?? "Utilisateur",
  }));
  const monthTransactions = transactions.filter(
    (tx) => new Date(tx.transaction_date) >= start,
  );
  const income = monthTransactions
    .filter((tx) => tx.transaction_type === "income")
    .reduce((sum, tx) => sum + Number(tx.amount ?? 0), 0);
  const expense = monthTransactions
    .filter((tx) => tx.transaction_type === "expense")
    .reduce((sum, tx) => sum + Number(tx.amount ?? 0), 0);
  const net = income - expense;

  const topCategories = monthTransactions
    .filter((tx) => tx.category)
    .reduce((acc: Record<string, number>, tx) => {
      const key = tx.category ?? "autre";
      acc[key] =
        (acc[key] ?? 0) +
        Number(tx.amount ?? 0) * (tx.transaction_type === "expense" ? -1 : 1);
      return acc;
    }, {});

  const categoryList = Object.entries(topCategories)
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    .slice(0, 3);

  return (
    <ModuleShell
      title="Finance"
      subtitle="Recettes, depenses, marges et pilotage financier."
      tag="Finance"
      tone="from-emerald-950 via-emerald-700 to-sky-500"
      actions={[
        {
          label: "Nouvelle transaction",
          variant: "primary",
          href: "?create=transaction",
        },
        { label: "Rapport", variant: "outline" },
        { label: "Export compta", variant: "ghost" },
      ]}
    >
      <AutoRefresh intervalMs={90000} />
      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Solde net"
          value={`${formatNumber(Math.round(net))} FCFA`}
          change="mois en cours"
          helper="revenus - depenses"
          tone="emerald"
        />
        <MetricCard
          label="Depenses mois"
          value={`${formatNumber(Math.round(expense))} FCFA`}
          change="mois"
          helper="charges"
          tone="rose"
        />
        <MetricCard
          label="Recettes mois"
          value={`${formatNumber(Math.round(income))} FCFA`}
          change="mois"
          helper="ventes"
          tone="sky"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Synthese
              </p>
              <h2 className="mt-2 text-lg font-semibold text-slate-900">
                Flux de tresorerie
              </h2>
            </div>
            <button className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
              Exporter
            </button>
          </div>
          <div className="mt-6 grid gap-3">
            {transactions.length === 0 ? (
              <p className="text-sm text-slate-500">
                Aucune transaction enregistree.
              </p>
            ) : (
              transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-center justify-between text-sm text-slate-700">
                    <span>{tx.category ?? "Transaction"}</span>
                    <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      {tx.transaction_type === "expense" ? "-" : "+"}
                      {formatNumber(Math.round(Number(tx.amount ?? 0)))}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    {formatDate(tx.transaction_date)}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <a
                      href={`?edit=transaction&id=${tx.id}`}
                      className="rounded-full border border-slate-200 bg-white px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-600"
                    >
                      Modifier
                    </a>
                    <a
                      href={`?delete=transaction&id=${tx.id}`}
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
            A surveiller
          </p>
          <h2 className="mt-2 text-lg font-semibold text-slate-900">
            Points critiques
          </h2>
          <div className="mt-6 space-y-4 text-sm text-slate-600">
            {categoryList.length === 0 ? (
              <p className="text-xs text-slate-500">Aucune categorie.</p>
            ) : (
              categoryList.map(([category, value]) => (
                <div
                  key={category}
                  className="rounded-2xl border border-slate-200 p-4"
                >
                  <p className="font-medium text-slate-900">{category}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    Impact: {formatNumber(Math.round(value))} FCFA
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
      <CreateTransactionForm users={users} />
      <UpdateTransactionForm users={users} transactions={transactions} />
      <ConfirmDeleteDrawer
        queryValue="transaction"
        table="financial_transactions"
        title="Supprimer la transaction"
        description="Retirez cette ligne de la tresorerie."
        records={transactions.map((transaction) => ({
          id: transaction.id,
          label:
            transaction.category ?? transaction.description ?? "Transaction",
          description: `${transaction.transaction_type ?? "--"} • ${formatDate(transaction.transaction_date)} • ${formatNumber(Math.round(Number(transaction.amount ?? 0)))} FCFA`,
        }))}
      />
    </ModuleShell>
  );
}
