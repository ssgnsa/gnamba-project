import { describe, it, expect } from "vitest";
import {
  normalizeSupplierRow,
  isSupplierDuplicateCandidate,
} from "./suppliers.repository";

describe("normalizeSupplierRow", () => {
  it("normalizes email to lowercase and trims whitespace", () => {
    const normalized = normalizeSupplierRow({
      id: "s1",
      nom: "Acme Inc",
      email: "  CONTACT@ACME.COM  ",
      telephone: "+225 07 00 00 01",
      adresse: "Abidjan",
      produits_fournis: "Services",
      statut: "actif",
      notes: "Top supplier",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-02T00:00:00Z",
    });

    expect(normalized.email).toBe("contact@acme.com");
  });

  it("normalizes text fields by trimming whitespace", () => {
    const normalized = normalizeSupplierRow({
      id: "s2",
      nom: "  Supplier Name  ",
      email: "supplier@example.com",
      telephone: "0712345678",
      adresse: "  123 Main St  ",
      produits_fournis: "  Steel & Metal  ",
      statut: "actif",
      notes: "  Notes here  ",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-02T00:00:00Z",
    });

    expect(normalized.nom).toBe("Supplier Name");
    expect(normalized.adresse).toBe("123 Main St");
    expect(normalized.produits_fournis).toBe("Steel & Metal");
    expect(normalized.notes).toBe("Notes here");
  });

  it("defaults statut to actif if not inactif", () => {
    const normalized = normalizeSupplierRow({
      id: "s3",
      nom: "Supplier",
      email: "s@example.com",
      telephone: "0700000000",
      adresse: "Location",
      produits_fournis: "Products",
      statut: "invalid_status",
      notes: "",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-02T00:00:00Z",
    });

    expect(normalized.statut).toBe("actif");
  });

  it("handles missing or non-string fields gracefully", () => {
    const normalized = normalizeSupplierRow({
      id: "s4",
      nom: undefined,
      email: null,
      telephone: 123,
      adresse: { nested: "object" },
      produits_fournis: "",
      statut: "actif",
      notes: undefined,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-02T00:00:00Z",
    });

    expect(normalized.nom).toBe("");
    expect(normalized.email).toBe("");
    expect(normalized.telephone).toBe("");
    expect(normalized.adresse).toBe("");
  });
});

describe("isSupplierDuplicateCandidate", () => {
  it("returns false for same id", () => {
    const isDuplicate = isSupplierDuplicateCandidate(
      {
        id: "s1",
        email: "supplier@example.com",
        telephone: "0700000001",
      },
      {
        id: "s1",
        email: "supplier@example.com",
        telephone: "0700000001",
      },
    );

    expect(isDuplicate).toBe(false);
  });

  it("detects duplicate by normalized email", () => {
    const isDuplicate = isSupplierDuplicateCandidate(
      {
        id: "s1",
        email: "  CONTACT@EXAMPLE.COM  ",
        telephone: "0700000001",
      },
      {
        id: "s2",
        email: "contact@example.com",
        telephone: "0700000002",
      },
    );

    expect(isDuplicate).toBe(true);
  });

  it("detects duplicate by normalized phone", () => {
    const isDuplicate = isSupplierDuplicateCandidate(
      {
        id: "s1",
        email: "supplier1@example.com",
        telephone: "+225 07 00 00 01",
      },
      {
        id: "s2",
        email: "supplier2@example.com",
        telephone: "0700 0001",
      },
    );

    expect(isDuplicate).toBe(true);
  });

  it("returns false when no duplicate found", () => {
    const isDuplicate = isSupplierDuplicateCandidate(
      {
        id: "s1",
        email: "supplier1@example.com",
        telephone: "0700000001",
      },
      {
        id: "s2",
        email: "supplier2@example.com",
        telephone: "0700000002",
      },
    );

    expect(isDuplicate).toBe(false);
  });

  it("ignores empty email and phone checks", () => {
    const isDuplicate = isSupplierDuplicateCandidate(
      {
        id: "s1",
        email: "",
        telephone: "",
      },
      {
        id: "s2",
        email: "supplier@example.com",
        telephone: "0700000001",
      },
    );

    expect(isDuplicate).toBe(false);
  });
});
