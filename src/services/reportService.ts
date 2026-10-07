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
    const date = new Date(r.created_at);
    return date >= startOfMonth && date <= endOfMonth;
  });

  const headers = Object.keys(filtered[0] || {});
  const rows = [headers.join(",")];
  for (const record of filtered) {
    const values = headers.map((header) => {
      let val = record[header];
      if (typeof val === "string" && val.includes(",")) {
        val = `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    });
    rows.push(values.join(","));
  }
  const csvContent = rows.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `rapport_mensuel_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}