import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const fetchAttestationVerification = vi.hoisted(() => vi.fn());

vi.mock("../context/SettingsContext", () => ({
  useSettings: () => ({
    settings: {
      app_company: "Gnamba Services",
      app_title: "EGS",
      primary_color: "#166534",
    },
  }),
}));

vi.mock("../components/BrandLogo", () => ({
  default: () => <div data-testid="brand-logo" />,
}));

vi.mock("../lib/attestationVerification", () => ({
  fetchAttestationVerification,
}));

import PublicVerification from "../pages/public/PublicVerification";

describe("PublicVerification", () => {
  beforeEach(() => {
    fetchAttestationVerification.mockReset();
    window.history.pushState(
      {},
      "",
      "/verification-attestation?ref=APV-2026-001",
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("masque les donnees privees quand elles ne sont pas publiees", async () => {
    fetchAttestationVerification.mockResolvedValue({
      reference: "APV-2026-001",
      document_authentic: true,
      signature_valid: true,
      hash_valid: true,
      statut: "valide",
      date_etablissement: "2026-06-09T00:00:00.000Z",
      control_number: "0011223344",
      hash_sha256: "abcdef1234",
      lot: {
        reference: "LOT-001",
        numero_lot: "25",
        nom_lotissement: "Lotissement Test",
        village: "KATADJI",
        superficie: 1500,
        quartier: "Centre",
      },
      parcelle: {
        superficie_m2: 1500,
      },
      village_info: {
        village: "KATADJI",
        lotissement: "Lotissement Test",
        numero_lot: "25",
      },
    });

    render(<PublicVerification onNavigate={vi.fn()} />);

    expect(await screen.findByText("DOCUMENT AUTHENTIQUE")).toBeTruthy();
    expect(
      screen.getByText(
        /Les données personnelles détaillées ne sont pas publiées dans cette vue de vérification\./i,
      ),
    ).toBeTruthy();
    expect(
      screen.getByText(
        /Les témoins détaillés restent visibles dans le dossier interne\./i,
      ),
    ).toBeTruthy();
    expect(screen.queryByText(/Nom complet/i)).toBeNull();
    expect(fetchAttestationVerification).toHaveBeenCalledWith({
      ref: "APV-2026-001",
      control: null,
      hash: null,
    });
  });
});
