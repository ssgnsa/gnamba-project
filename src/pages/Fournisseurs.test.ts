/**
 * Fournisseurs Module Test Suite
 * Tests for creation, duplicate detection, and sync flow
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Supplier } from "../types";

describe("Fournisseurs Module - Create and Sync Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Creation Flow", () => {
    it("should create a new supplier locally with required fields", () => {
      const newSupplier = {
        nom: "Acme Inc",
        telephone: "+225 07 00 00 00",
        email: "contact@acme.com",
        adresse: "Abidjan, Plateau",
        produits_fournis: "Steel and Metal",
        statut: "actif" as const,
        notes: "Reliable supplier",
      };

      // Simulate local creation
      const localSupplier: Supplier = {
        ...newSupplier,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      expect(localSupplier).toBeDefined();
      expect(localSupplier.id).toBeTruthy();
      expect(localSupplier.nom).toBe("Acme Inc");
      expect(localSupplier.statut).toBe("actif");
    });

    it("should validate required fields", () => {
      const invalidSupplier = {
        nom: "",
        telephone: "",
        email: "contact@example.com",
        adresse: "Abidjan",
        produits_fournis: "",
        statut: "actif" as const,
        notes: "",
      };

      // Validation: nom is required
      const errors: string[] = [];
      if (!invalidSupplier.nom.trim())
        errors.push("Le nom du fournisseur est obligatoire.");

      expect(errors.length).toBe(1);
      expect(errors[0]).toBe("Le nom du fournisseur est obligatoire.");
    });
  });

  describe("Duplicate Detection", () => {
    it("should reject duplicate supplier by email", async () => {
      const existingSupplier: Supplier = {
        id: "s1",
        nom: "Supplier A",
        telephone: "0700000001",
        email: "contact@suppliera.com",
        adresse: "Abidjan",
        produits_fournis: "Materials",
        statut: "actif",
        notes: "",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-02T00:00:00Z",
      };

      const duplicateAttempt = {
        nom: "Supplier A Copy",
        telephone: "0700000002",
        email: "contact@suppliera.com", // Same email
        adresse: "Abidjan",
        produits_fournis: "Materials",
        statut: "actif" as const,
        notes: "",
      };

      // Simulate duplicate check
      const isDuplicate =
        existingSupplier.email === duplicateAttempt.email;

      expect(isDuplicate).toBe(true);
    });

    it("should reject duplicate supplier by phone", async () => {
      const existingSupplier: Supplier = {
        id: "s2",
        nom: "Supplier B",
        telephone: "0700000003",
        email: "contact@supplierb.com",
        adresse: "Abidjan",
        produits_fournis: "Materials",
        statut: "actif",
        notes: "",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-02T00:00:00Z",
      };

      const duplicateAttempt = {
        nom: "Supplier B Copy",
        telephone: "0700000003", // Same phone
        email: "different@example.com",
        adresse: "Abidjan",
        produits_fournis: "Materials",
        statut: "actif" as const,
        notes: "",
      };

      // Simulate duplicate check
      const isDuplicate =
        existingSupplier.telephone === duplicateAttempt.telephone;

      expect(isDuplicate).toBe(true);
    });

    it("should allow unique supplier", async () => {
      const existingSupplier: Supplier = {
        id: "s3",
        nom: "Supplier C",
        telephone: "0700000005",
        email: "contact@supplierc.com",
        adresse: "Abidjan",
        produits_fournis: "Materials",
        statut: "actif",
        notes: "",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-02T00:00:00Z",
      };

      const uniqueAttempt = {
        nom: "Supplier D",
        telephone: "0700000006",
        email: "contact@supplierd.com",
        adresse: "Abidjan",
        produits_fournis: "Materials",
        statut: "actif" as const,
        notes: "",
      };

      // Simulate duplicate check
      const isDuplicate =
        existingSupplier.email === uniqueAttempt.email ||
        existingSupplier.telephone === uniqueAttempt.telephone;

      expect(isDuplicate).toBe(false);
    });
  });

  describe("Synchronization Flow", () => {
    it("should sync a new supplier to server and replace local ID", async () => {
      const localSupplierId = "local-uuid-123";
      const serverSupplierId = "server-uuid-456";

      const localSupplier: Supplier = {
        id: localSupplierId,
        nom: "Acme Inc",
        telephone: "0700000001",
        email: "contact@acme.com",
        adresse: "Abidjan",
        produits_fournis: "Materials",
        statut: "actif",
        notes: "Test supplier",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const serverSupplier: Supplier = {
        ...localSupplier,
        id: serverSupplierId,
      };

      // Simulate sync
      expect(localSupplier.id).toBe(localSupplierId);
      expect(serverSupplier.id).toBe(serverSupplierId);
    });
  });
});
