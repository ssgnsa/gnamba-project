import { describe, it, expect } from "vitest";
import { buildAttestationRpcParams, sanitizeText } from "../foncierAttestation";

describe("foncierAttestation helpers", () => {
  it("sanitizeText trims and removes HTML tags", () => {
    expect(sanitizeText(" <b>Bonjour</b> ")).toBe("Bonjour");
    expect(sanitizeText("   ")).toBe("");
    expect(sanitizeText(null)).toBe("");
  });

  it("buildAttestationRpcParams returns sanitized attestation payload", () => {
    const attestationForm = {
      attestation_type: "cession",
      mode_acquisition: " Donation ",
      historique_possession: " Possession ancienne ",
      domicile: " Village ",
      cedant_nom: " Jean ",
      cedant_prenom: " Dupont ",
      cedant_cni_numero: " 1234567890 ",
      cedant_telephone: " 0700000000 ",
      cedant_domicile: " Abidjan ",
      limites_nord: " Nord ",
      limites_sud: " Sud ",
      limites_est: " Est ",
      limites_ouest: " Ouest ",
      gps_lat: "6.123",
      gps_lng: "-5.456",
      gps_precision: "12",
      gps_nord_lat: "6.1",
      gps_nord_lng: "-5.1",
      gps_sud_lat: "6.0",
      gps_sud_lng: "-5.0",
      gps_est_lat: "",
      gps_est_lng: "",
      gps_ouest_lat: "",
      gps_ouest_lng: "",
      registre_volume: " 4 ",
      registre_page: " 10 ",
      registre_ligne: " 2 ",
      numero_enregistrement: " 789 ",
      temoins: [
        {
          nom: " Alice ",
          prenom: " Martin ",
          profession: " Fermier ",
          telephone: " 0707007007 ",
          cni: " 9876543210 ",
        },
      ],
      original: true,
      validation_agent_nom: " Agent ",
      validation_chef_nom: " Chef ",
    } as const;

    const payload = buildAttestationRpcParams({
      attestationForm: attestationForm as unknown as any,
      attestationLot: { id: "lot-123" } as any,
      signatureNonce: "nonce-1",
      signatureIssuedAt: "2026-05-01T00:00:00.000Z",
      deviceId: "device-1",
      baseAttestationId: "previous-id",
      isCession: true,
    });

    expect(payload.p_lot_id).toBe("lot-123");
    expect(payload.p_attestation_type).toBe("cession");
    expect(payload.p_mode_acquisition).toBe("Donation");
    expect(payload.p_gps_lat).toBe(6.123);
    expect(payload.p_gps_lng).toBe(-5.456);
    expect(payload.p_gps_precision).toBe(12);
    expect(payload.p_registre_page).toBe(10);
    expect(payload.p_registre_ligne).toBe(2);
    expect(payload.p_temoins).toEqual([
      {
        nom: "Alice",
        prenom: "Martin",
        profession: "Fermier",
        telephone: "0707007007",
        cni: "9876543210",
      },
    ]);
    expect(payload.p_cedant_nom).toBe("Jean");
    expect(payload.p_previous_attestation_id).toBe("previous-id");
  });
});
