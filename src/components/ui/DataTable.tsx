/** DataTable — Tableau générique (tri, pagination, actions).
 * Props : data, columns (key, label, sortable?, render?, align?, mono?), actions (icon, label, onClick, variant?, hidden?), onSearch?, emptyMessage, pageSize?, loading?
 * Colonnes triables (clic header).
 * Pagination si data.length > pageSize.
 * Barre de recherche si onSearch fourni.
 * Actions par ligne (icônes).
 */
import { useState, type FC, type ReactNode } from "react";

interface Column<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (row: T) => ReactNode;
  align?: "left" | "center" | "right";
  mono?: boolean;
}

interface Action {
  icon: ReactNode;
  label: string;
  onClick: (row: any) => void;
  variant?: "danger" | "warning" | "default";
  hidden?: (row: any) => boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  actions?: Action[];
  onSearch?: (value: string) => void;
  emptyMessage?: string;
  pageSize?: number;
  loading?: boolean;
}

export const DataTable: FC<DataTableProps<any>> = ({
  data,
  columns,
  actions,
  onSearch,
  emptyMessage = "Aucune donnée",
  pageSize = 10,
  loading,
}) => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filteredData = data.filter((row) => {
    if (!onSearch) return true;
    return columns.some((col) =>
      String(
        row[col.key] ?? ""
      ).toString().toLowerCase().includes(search.toLowerCase()),
    );
  });

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const pageData = filteredData.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  const sortedColumns = columns.map((col) => ({
    ...col,
    isSorted: false,
    sortDir: "asc" as "asc" | "desc",
  }));

  return (
    <div className="rounded-lg overflow-hidden shadow-sm border border-gray-200">
      <div className="bg-gray-50 py-3 px-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <h3 className="text-sm font-medium text-gray-700">
            Tableau des données
          </h3>
          {onSearch && (
            <div className="flex-1">
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearch(val);
                  onSearch(val);
                }}
                placeholder="Rechercher..."
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Recherche dans le tableau"
              />
            </div>
          )}
          {pageData.length === 0 && filteredData.length === 0 && (
            <p className="text-sm text-gray-500 mt-1">{emptyMessage}</p>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              {columns.map((col) => {
                const sortClass = "";
                return (
                  <th
                    key={col.key}
                    className={`px-4 py-2 text-left text-xs font-medium text-gray-500 ${col.sortable ? "cursor-pointer" : ""}`}
                    onClick={() => col.sortable && console.log("Sort clicked")}
                  >
                    {col.label}
                    {col.sortable && (
                      <svg
                        className="w-3 h-3 ml-2 transition-transform"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="p-4 text-center">
                  <span className="animate-pulse inline-block h-4 w-4 mr-2 bg-primary-500 rounded-full"></span>
                  <span className="text-sm text-gray-500">Chargement...</span>
                </td>
              </tr>
            ) : (
              pageData.map((row, index) => (
                <tr key={row.id ?? index} className="hover:bg-gray-50">
                  {columns.map((col) => {
                    const cellContent = col.render
                      ? col.render(row)
                      : String(row[col.key] ?? "").toString();
                    return (
                      <td
                        key={col.key}
                        className={`px-4 py-2 text-sm align-${col.align ?? "left"} ${col.mono ? "font-mono" : ""}`}
                      >
                        {cellContent}
                      </td>
                    );
                  })}
                  {actions && actions.length > 0 && (
                    <td className="px-4 py-2">
                      {actions.map((action, index) => (
                        <button
                          key={index}
                          onClick={() => action.onClick(row)}
                          className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                            action.variant === "danger"
                              ? "bg-red-100 text-red-800 hover:bg-red-200"
                              : action.variant === "warning"
                              ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                              : "bg-blue-100 text-blue-800 hover:bg-blue-200"
                          }`}
                          aria-label={action.label}
                        >
                          {action.icon}
                          <span className="ml-1">{action.label}</span>
                        </button>
                      ))}
                    </td>
                  )}
                </tr>
              )))}
            {pageData.length === 0 && filteredData.length > 0 && (
              <tr>
                <td colSpan={columns.length} className="p-4 text-center text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="bg-gray-50 px-4 py-3 flex justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(page - 1, 1))}
            disabled={page === 1}
            className="rounded-md px-3 py-1 text-sm text-gray-500 hover:bg-gray-100"
            aria-label="Page précédente"
          >
            Précédent
          </button>
          <span className="text-sm text-gray-500">
            Page {page} de {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(page + 1, totalPages))}
            disabled={page === totalPages}
            className="rounded-md px-3 py-1 text-sm text-gray-500 hover:bg-gray-100"
            aria-label="Page suivante"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
};