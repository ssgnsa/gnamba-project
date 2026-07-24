export async function fetchLogs() {
  const response = await fetch(`/api/v1/tables/activites_journal?order_by=created_at&ascending=false`);
  if (!response.ok) {
    throw new Error(`Failed to fetch logs: ${response.status}`);
  }
  return response.json();
}

export async function downloadMonthlyReport() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const response = await fetch(`/api/v1/tables/stats_journalieres`);
  if (!response.ok) {
    throw new Error(`Failed to fetch stats: ${response.status}`);
  }
  const records: any[] = await response.json();

  const filtered = records.filter((r: any) => {
    const date = new Date(r.created_at); // assuming theres a created_at field
