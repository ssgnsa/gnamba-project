import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { DataTable } from "../DataTable";

const mockData = [
  { id: 1, nom: "Lot A", reference: "REF-001", statut: "actif", superficie: 100 },
  { id: 2, nom: "Lot B", reference: "REF-002", statut: "vendu", superficie: 200 },
  { id: 3, nom: "Lot C", reference: "REF-003", statut: "litige", superficie: 150 },
];

describe("DataTable", () => {
  it("renders data rows", () => {
    render(
      <DataTable
        data={mockData}
        columns={[
          { key: "nom", label: "Nom", sortable: true },
          { key: "reference", label: "Référence" },
          { key: "statut", label: "Statut", sortable: true },
        ]}
      />,
    );
    expect(screen.getByText("Lot A")).toBeInTheDocument();
  });

  it("renders empty state when no data", () => {
    render(
      <DataTable
        data={[]}
        columns={[
          { key: "nom", label: "Nom" },
        ]}
        emptyMessage="Aucun lot trouvé"
      />,
    );
    const emptyMsg = screen.getByText("Aucun lot trouvé");
    expect(emptyMsg).toBeInTheDocument();
  });

  it("renders loading state", () => {
    render(
      <DataTable
        data={mockData}
        columns={[
          { key: "nom", label: "Nom" },
        ]}
        loading
      />,
    );
    const loadingRow = screen.getByText("Chargement...");
    expect(loadingRow).toBeInTheDocument();
  });
});