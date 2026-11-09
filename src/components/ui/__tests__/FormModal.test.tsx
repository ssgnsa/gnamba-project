import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { FormModal } from "../FormModal";

describe("FormModal", () => {
  it("renders without crashing when closed", () => {
    const onSubmit = () => {};
    const onClose = () => {};
    const result = render(
      <FormModal
        isOpen={false}
        title="Test"
        onSubmit={onSubmit}
        onClose={onClose}
      />,
    );
    expect(result.container).not.toBeNull();
  });

  it("renders open modal with title and form", () => {
    const onSubmit = (e: React.FormEvent) => e.preventDefault();
    const onClose = () => {};
    render(
      <FormModal
        isOpen={true}
        title="Nouveau lot"
        onSubmit={onSubmit}
        onClose={onClose}
      >
        <div>
          <input type="text" defaultValue="test" />
        </div>
      </FormModal>,
    );
    expect(screen.getByText("Nouveau lot")).toBeInTheDocument();
  });

  it("applies error message", () => {
    const onSubmit = () => {};
    const onClose = () => {};
    render(
      <FormModal
        isOpen={true}
        title="Test"
        onSubmit={onSubmit}
        onClose={onClose}
        error="Erreur de validation"
      />,
    );
    const errorDiv = screen.getByText("Erreur de validation");
    expect(errorDiv).toBeInTheDocument();
  });

  it("renders with custom submit label", () => {
    const onSubmit = () => {};
    const onClose = () => {};
    render(
      <FormModal
        isOpen={true}
        title="Test"
        onSubmit={onSubmit}
        onClose={onClose}
        submitLabel="Créer"
      />,
    );
    const button = screen.getByText("Créer");
    expect(button).toBeInTheDocument();
  });

  it("renders with custom cancel label", () => {
    const onSubmit = () => {};
    const onClose = () => {};
    render(
      <FormModal
        isOpen={true}
        title="Test"
        onSubmit={onSubmit}
        onClose={onClose}
        cancelLabel="Close"
      />,
    );
    const button = screen.getByText("Close");
    expect(button).toBeInTheDocument();
  });
});