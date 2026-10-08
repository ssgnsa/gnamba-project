import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockUpsertCachedLot, mockValidate } = vi.hoisted(() => ({
  mockUpsertCachedLot: vi.fn(),
  mockValidate: vi.fn(),
}));

vi.mock("../lib/dbClient.service", () => ({
  dataService: {
    saveLot: vi.fn(),
    softDeleteLot: vi.fn(),
    restoreLot: vi.fn(),
  },
}));

vi.mock("../lib/foncierOffline", () => ({
  upsertCachedLot: mockUpsertCachedLot,
}));

vi.mock("../lib/foncierValidation", () => ({
  validateFoncierForm: mockValidate,
}));

vi.mock("./useFoncierAttestationWorkflow", () => ({
  useFoncierAttestationWorkflow: () => ({}),
}));

import { useFoncierLogic } from "./useFoncierLogic";

describe("useFoncierLogic offline mutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockValidate.mockReturnValue({
      success: true,
      parsedData: { village: "Kokoti", statut: "actif" },
    });
  });

  it("does not report or queue an offline lot write as saved", async () => {
    const { result } = renderHook(() => useFoncierLogic("device-1"));

    const response = await result.current.saveLot(
      { village: "Kokoti" } as never,
      null,
      [],
      false,
    );

    expect(response.success).toBe(false);
    if (response.success) throw new Error("Offline write unexpectedly succeeded");
    expect(response.error).toContain("n’ont pas été enregistrées");
    expect(mockUpsertCachedLot).not.toHaveBeenCalled();
  });

  it("does not queue an offline archive or restore", async () => {
    const { result } = renderHook(() => useFoncierLogic("device-1"));
    const lot = { id: "lot-1" } as never;

    await expect(result.current.archiveLot(lot, false)).resolves.toMatchObject({
      success: false,
    });
    await expect(result.current.restoreLot(lot, false)).resolves.toMatchObject({
      success: false,
    });
    expect(mockUpsertCachedLot).not.toHaveBeenCalled();
  });
});
