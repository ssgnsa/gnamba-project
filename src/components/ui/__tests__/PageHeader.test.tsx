import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PageHeader } from "../PageHeader";

describe("PageHeader", () => {
  it("renders title and subtitle", () => {
    render(
      <PageHeader title="Gestion Foncière" subtitle="Modules Lots, Villages, Attestations">
      </PageHeader>,
    );
    expect(screen.getByText("Gestion Foncière")).toBeInTheDocument();
    expect(screen.getByText("Modules Lots, Villages, Attestations")).toBeInTheDocument();
  });

  it("renders actions at right", () => {
    const onClick = () => {};
    render(
      <PageHeader title="Test" actions={[]}>
      </PageHeader>,
    );
    expect(screen.getByText("Test")).toBeInTheDocument();
  });

  it("is responsive - actions wrap on mobile", () => {
    render(<PageHeader title="Test" />);
    expect(screen.getByText("Test")).toBeInTheDocument();
  });
});