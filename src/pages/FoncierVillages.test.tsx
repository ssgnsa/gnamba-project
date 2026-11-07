import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import FoncierVillages from "./FoncierVillages";

const mockGetAllVillagesWithStats = vi.fn();
const mockUpdateVillage = vi.fn();
const mockCreateVillage = vi.fn();

vi.mock("@/data/foncier.repository", () => ({
  foncierRepository: {
    getAllVillagesWithStats: mockGetAllVillagesWithStats,
    updateVillage: mockUpdateVillage,
    createVillage: mockCreateVillage,
  },
}));

const mockVillages = [
  { id: "1", nom: "Abidjan Cocody", code: "ABJCOCODY", region: "Lagunes", commune: "Cocody", actif: true, stats: { total_lots: 1 } },
  { id: "2", nom: "KATADJI", code: "KATADJI", region: "Agneby-Tiassa", commune: "Sikensi", actif: true, stats: { total_lots: 0 } },
  { id: "3", nom: "Ancien", code: "ANCIEN", actif: false, stats: { total_lots: 0 } },
];

beforeEach(() => {
  mockGetAllVillagesWithStats.mockResolvedValue({ data: mockVillages, error: null });
});

describe("FoncierVillages (CRUD UI)", () => {
  it("affiche la liste des villages", async () => {
    render(<FoncierVillages />);
    await waitFor(() => {
      expect(screen.getByText("Abidjan Cocody")).toBeInTheDocument();
      expect(screen.getByText("KATADJI")).toBeInTheDocument();
    });
  });

  it("filtre par défaut sur les villages actifs", async () => {
    render(<FoncierVillages />);
    await waitFor(() => {
      expect(screen.getByText("Abidjan Cocody")).toBeInTheDocument();
      expect(screen.queryByText("Ancien")).not.toBeInTheDocument();
    });
  });

  it("affiche le compteur actifs/total", async () => {
    render(<FoncierVillages />);
    await waitFor(() => {
      expect(screen.getByText(/3 village\(s\) — 2 actif\(s\)/)).toBeInTheDocument();
    });
  });

  it("affiche le nombre de lotissements", async () => {
    render(<FoncierVillages />);
    await waitFor(() => {
      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText("0")).toBeInTheDocument();
    });
  });

  it("recherche par nom", async () => {
    render(<FoncierVillages />);
    const input = await screen.findByPlaceholderText(/Rechercher/);
    await waitFor(() => expect(input).toBeInTheDocument());
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
});