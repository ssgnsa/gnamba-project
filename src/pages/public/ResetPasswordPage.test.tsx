import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ResetPasswordPage from "./ResetPasswordPage";

vi.mock("../../context/SettingsContext", () => ({
  useSettings: () => ({ settings: { app_title: "EGS" } }),
}));
vi.mock("../../components/BrandLogo", () => ({ default: () => null }));
vi.mock("../../lib/officialContact", () => ({
  OFFICIAL_CONTACT: { companyName: "Gnamba Services" },
}));

describe("ResetPasswordPage", () => {
  afterEach(() => {
    window.history.replaceState({}, "", "/");
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("submits the one-time fragment token in the reset request body", async () => {
    window.history.replaceState({}, "", "/reset-password#token=high-entropy-reset-token-1234567890");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: "ok" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<ResetPasswordPage onSuccess={vi.fn()} />);
    const inputs = await screen.findAllByPlaceholderText("••••••••");
    fireEvent.change(inputs[0], { target: { value: "UnePhraseDePasseTresSolide2026!" } });
    fireEvent.change(inputs[1], { target: { value: "UnePhraseDePasseTresSolide2026!" } });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer le nouveau mot de passe" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock.mock.calls[0][0]).toBe("/api/v1/auth/password/reset");
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({
      token: "high-entropy-reset-token-1234567890",
      new_password: "UnePhraseDePasseTresSolide2026!",
    });
    expect(window.location.hash).toBe("");
  });

  it("does not submit when the reset link has no token", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(<ResetPasswordPage onSuccess={vi.fn()} />);

    expect(await screen.findByText("Lien de réinitialisation invalide ou expiré.")).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
