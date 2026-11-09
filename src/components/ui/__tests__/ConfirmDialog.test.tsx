import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ConfirmDialog } from "../ConfirmDialog";

describe("ConfirmDialog", () => {
  it("opens and closes with onCancel", () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        isOpen
        title="Test"
        message="Êtes-vous sûr ?"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    expect(onCancel).not.toHaveBeenCalled();
    // Simuler le clic Annuler
    const cancelBtn = screen.getByText("Annuler");
    cancelBtn?.click();
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("calls onConfirm when clicking Confirmer", () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        isOpen
        title="Test"
        message="Êtes-vous sûr ?"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    expect(onConfirm).not.toHaveBeenCalled();
    const confirmBtn = screen.getByText("Confirmer");
    confirmBtn?.click();
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("closes with Escape key", () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        isOpen
        title="Test"
        message="Message"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    // Simuler la pression de Échap
    const event = new KeyboardEvent("keydown", { key: "Escape" });
    window.dispatchEvent(event);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("renders with default variant", () => {
    render(
      <ConfirmDialog
        isOpen
        title="Test"
        message="Message"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
  });

  it("renders with danger variant", () => {
    render(
      <ConfirmDialog
        isOpen
        title="Test"
        message="Message"
        variant="danger"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
  });

  it("renders with loading state", () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        isOpen
        title="Test"
        message="Message"
        onConfirm={onConfirm}
        onCancel={onCancel}
        loading
      />,
    );
    const confirmBtn = screen.getByText("Validation…");
    const cancelBtn = screen.getByText("Annulation…");
    expect(confirmBtn).toBeInTheDocument();
    expect(cancelBtn).toBeInTheDocument();
  });
});