import { createServerSupabase } from "@/lib/supabase/server";

export type DashboardSummary = {
  totalLots: number;
  totalAnimals: number;
  activeFields: number;
  totalFields: number;
  operationalBuildings: number;
  totalBuildings: number;
  deathsCount: number;
  mortalityRate: number;
  grossMargin: number;
  inventoryAlerts: number;
  livestockScore: number;
  cropsScore: number;
  constructionsScore: number;
  updatedAt: string;
};

function clampPercent(value: number) {
  if (Number.isNaN(value) || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const supabase = createServerSupabase();
  const updatedAt = new Date().toISOString();

  const [
    lotsCount,
    animalsCount,
    fieldsTotalCount,
    fieldsActiveCount,
    buildingsTotalCount,
    buildingsOperationalCount,
  ] = await Promise.all([
    safeCount(supabase, "lots"),
    safeCount(supabase, "animals"),
    safeCount(supabase, "fields"),
    safeCount(supabase, "fields", (query) => query.eq("status", "active")),
    safeCount(supabase, "buildings"),
    safeCount(supabase, "buildings", (query) =>
      query.eq("status", "operational"),
    ),
  ]);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const deathsCount = await safeCount(supabase, "livestock_events", (query) =>
    query
      .eq("event_type", "death")
      .gte("event_date", thirtyDaysAgo.toISOString()),
  );

  const mortalityRate =
    animalsCount > 0 ? (deathsCount / animalsCount) * 100 : 0;

  const grossMargin = await safeGrossMargin(supabase);
  const inventoryAlerts = await safeInventoryAlerts(supabase);

  const livestockScore = clampPercent(100 - mortalityRate);
  const cropsScore = clampPercent(
    fieldsTotalCount ? (fieldsActiveCount / fieldsTotalCount) * 100 : 0,
  );
  const constructionsScore = clampPercent(
    buildingsTotalCount
      ? (buildingsOperationalCount / buildingsTotalCount) * 100
      : 0,
  );

  return {
    totalLots: lotsCount,
    totalAnimals: animalsCount,
    activeFields: fieldsActiveCount,
    totalFields: fieldsTotalCount,
    operationalBuildings: buildingsOperationalCount,
    totalBuildings: buildingsTotalCount,
    deathsCount,
    mortalityRate: Number(mortalityRate.toFixed(2)),
    grossMargin,
    inventoryAlerts,
    livestockScore,
    cropsScore,
    constructionsScore,
    updatedAt,
  };
}

async function safeCount(
  supabase: ReturnType<typeof createServerSupabase>,
  table: string,
  apply?: (query: any) => any,
) {
  try {
    let query = supabase
      .from(table)
      .select("id", { count: "exact", head: true });
    if (apply) query = apply(query);
    const { count, error } = await query;
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

async function safeGrossMargin(
  supabase: ReturnType<typeof createServerSupabase>,
) {
  try {
    const start = new Date();
    start.setDate(1);
    const { data, error } = await supabase
      .from("financial_transactions")
      .select("amount, transaction_type")
      .gte("transaction_date", start.toISOString());

    if (error || !data) return 0;

    return data.reduce((total: number, row: any) => {
      const amount = Number(row.amount ?? 0);
      if (row.transaction_type === "expense") return total - amount;
      return total + amount;
    }, 0);
  } catch {
    return 0;
  }
}

async function safeInventoryAlerts(
  supabase: ReturnType<typeof createServerSupabase>,
) {
  try {
    const { data, error } = await supabase
      .from("inventory_items")
      .select("id, current_stock, min_stock_threshold");
    if (error || !data) return 0;

    return data.filter((item: any) => {
      if (
        item.min_stock_threshold === null ||
        item.min_stock_threshold === undefined
      )
        return false;
      return (
        Number(item.current_stock ?? 0) <= Number(item.min_stock_threshold)
      );
    }).length;
  } catch {
    return 0;
  }
}
