import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "../StatusBadge";

describe("StatusBadge", () => {
  it("component renders", () => {
    render(<StatusBadge status="actif" />);
    expect(screen.getByText("Actif")).toBeInTheDocument();
  });

  it("has green color for actif", () => {
    render(<StatusBadge status="actif" />);
    const badge = screen.getByText("Actif");
    expect(badge).toHaveClass("bg-green-100 text-green-800");
  });

  it("has blue color for vendu", () => {
    render(<StatusBadge status="vendu" />);
    const badge = screen.getByText("Vendu");
    expect(badge).toHaveClass("bg-blue-100 text-blue-800");
  });

  it("has red color for litige", () => {
    render(<StatusBadge status="litige" />);
    const badge = screen.getByText("Litige");
    expect(badge).toHaveClass("bg-red-100 text-red-800");
  });

  it("has yellow color for reserve", () => {
    render(<StatusBadge status="reserve" />);
    const badge = screen.getByText("Réserve");
    expect(badge).toHaveClass("bg-yellow-100 text-yellow-800");
  });

  it("has gray color for annule", () => {
    render(<StatusBadge status="annule" />);
    const badge = screen.getByText("Annulé");
    expect(badge).toHaveClass("bg-neutral-100 text-neutral-800");
  });

  it("has dark gray color for archive", () => {
    render(<StatusBadge status="archive" />);
    const badge = screen.getByText("Archivé");
    expect(badge).toHaveClass("bg-neutral-900 text-neutral-100");
  });

  it("has gray color for brouillon", () => {
    render(<StatusBadge status="brouillon" />);
    const badge = screen.getByText("Brouillon");
    expect(badge).toHaveClass("bg-neutral-100 text-neutral-800");
  });

  it("has blue color for soumis", () => {
    render(<StatusBadge status="soumis" />);
    const badge = screen.getByText("Soumis");
    expect(badge).toHaveClass("bg-blue-100 text-blue-800");
  });

  it("has green color for valide", () => {
    render(<StatusBadge status="valide" />);
    const badge = screen.getByText("Valide");
    expect(badge).toHaveClass("bg-green-100 text-green-800");
  });

  it("has red color for revoqué", () => {
    render(<StatusBadge status="revoqué" />);
    const badge = screen.getByText("Révoqué");
    expect(badge).toHaveClass("bg-red-100 text-red-800");
  });

  it("has green color for livre", () => {
    render(<StatusBadge status="livre" />);
    const badge = screen.getByText("Livré");
    expect(badge).toHaveClass("bg-green-100 text-green-800");
  });

  it("applies custom label", () => {
    render(<StatusBadge status="actif" customLabels={{ actif: "Custom" }} />);
    const badge = screen.getByText("Custom");
    expect(badge).toBeInTheDocument();
  });

  it("renders with sm size", () => {
    render(<StatusBadge status="actif" size="sm" />);
    expect(screen.getByText("Actif")).toBeInTheDocument();
  });
});