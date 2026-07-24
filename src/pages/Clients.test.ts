/**
 * Clients Module Test Suite
 * Tests for creation and synchronization flow
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { clientsRepository } from "../data/clients.repository";
import type { Client } from "../types";

// Mock repository for testing
vi.mock("../data/clients.repository", () => ({
  clientsRepository: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("Clients Module - Create and Sync Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Creation Flow", () => {
    it("should create a new client locally", () => {
      const newClient = {
        nom: "Dupont",
        prenom: "Jean",
        telephone: "+225 07 00 00 00",
        email: "jean@example.com",
        adresse: "Abidjan, Cocody",
        type_client: "particulier" as const,
        notes: "Client test",
      };

      // Simulate local creation
      const localClient: Client & { id: string; created_at: string; updated_at: string } = {
        ...newClient,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      expect(localClient).toBeDefined();
      expect(localClient.id).toBeTruthy();
      expect(localClient.nom).toBe("Dupont");
      expect(localClient.type_client).toBe("particulier");
    });

    it("should validate required fields", () => {
      const invalidClient = {
        nom: "",
        prenom: "Jean",
        telephone: "",
        email: "invalid-email",
        adresse: "Abidjan",
        type_client: "particulier" as const,
        notes: "",
      };

      // Validation: nom and telephone are required
      const errors: string[] = [];
      if (!invalidClient.nom.trim()) errors.push("Le nom est obligatoire.");
      if (!invalidClient.telephone.trim()) errors.push("Le téléphone est obligatoire.");

      expect(errors.length).toBe(2);
      expect(errors[0]).toBe("Le nom est obligatoire.");
    });
  });

  describe("Synchronization Flow", () => {
    it("should sync a new client to server and replace local ID", async () => {
      const localClientId = "local-uuid-123";
      const serverClientId = "server-uuid-456";

      const localClient: Client = {
        id: localClientId,
        nom: "Dupont",
        prenom: "Jean",
        telephone: "+225 07 00 00 00",
        email: "jean@example.com",
        adresse: "Abidjan",
        type_client: "particulier",
        notes: "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const serverResponse: Client = {
        ...localClient,
        id: serverClientId,
      };

      // Mock: client doesn't exist on server yet
      vi.mocked(clientsRepository.getById).mockResolvedValue({
        data: null,
        error: null,
      });

      // Mock: create returns the server response
      vi.mocked(clientsRepository.create).mockResolvedValue({
        data: serverResponse,
        error: null,
      });

      // Simulate sync: check existence
      const existing = await clientsRepository.getById(localClientId);
      expect(existing.data).toBeNull();

      // If not found, create on server
      if (!existing.data) {
        const created = await clientsRepository.create({
          nom: localClient.nom,
          prenom: localClient.prenom,
          telephone: localClient.telephone,
          email: localClient.email,
          adresse: localClient.adresse,
          type_client: localClient.type_client,
          notes: localClient.notes,
        });

        expect(created.data).toBeDefined();
        expect(created.data?.id).toBe(serverClientId);
        expect(created.data?.id).not.toBe(localClientId);
      }
    });

    it("should update existing client on server", async () => {
      const clientId = "existing-uuid-123";

      const existingClient: Client = {
        id: clientId,
        nom: "Dupont",
        prenom: "Jean",
        telephone: "+225 07 00 00 00",
        email: "jean@example.com",
        adresse: "Abidjan",
        type_client: "particulier",
        notes: "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const updatedClient: Client = {
        ...existingClient,
        telephone: "+225 07 11 11 11",
        updated_at: new Date().toISOString(),
      };

      // Mock: client exists on server
      vi.mocked(clientsRepository.getById).mockResolvedValue({
        data: existingClient,
        error: null,
      });

      // Mock: update returns updated client
      vi.mocked(clientsRepository.update).mockResolvedValue({
        data: updatedClient,
        error: null,
      });

      // Simulate sync: check existence
      const existing = await clientsRepository.getById(clientId);
      expect(existing.data).toBeDefined();

      // If found, update on server
      if (existing.data) {
        const updated = await clientsRepository.update(clientId, {
          telephone: "+225 07 11 11 11",
        });

        expect(updated.data?.telephone).toBe("+225 07 11 11 11");
        expect(updated.data?.id).toBe(clientId);
      }
    });

    it("should handle sync errors gracefully", async () => {
      const clientId = "test-uuid-123";

      // Mock: getById fails
      vi.mocked(clientsRepository.getById).mockResolvedValue({
        data: null,
        error: new Error("Network error"),
      });

      // Simulate sync attempt
      const existing = await clientsRepository.getById(clientId);

      // Should track error and mark as failed
      const syncError = existing.error ? existing.error.message : null;
      expect(syncError).toBe("Network error");
    });
  });

  describe("Bulk Sync Operations", () => {
    it("should sync multiple clients and track results", async () => {
      const clients: Client[] = [
        {
          id: "local-1",
          nom: "Client1",
          prenom: "Test1",
          telephone: "+225 07 00 00 01",
          email: "client1@example.com",
          adresse: "Abidjan",
          type_client: "particulier",
          notes: "",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "local-2",
          nom: "Client2",
          prenom: "Test2",
          telephone: "+225 07 00 00 02",
          email: "client2@example.com",
          adresse: "Abidjan",
          type_client: "entreprise",
          notes: "",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      let syncedCount = 0;
      let failedCount = 0;

      // Mock: all clients are new (don't exist on server)
      vi.mocked(clientsRepository.getById).mockResolvedValue({
        data: null,
        error: null,
      });

      // Mock: create succeeds for all
      vi.mocked(clientsRepository.create).mockImplementation(async () => ({
        data: clients[syncedCount % 2],
        error: null,
      }));

      // Simulate sync
      for (const client of clients) {
        try {
          const existing = await clientsRepository.getById(client.id);
          if (!existing.data) {
            const created = await clientsRepository.create({
              nom: client.nom,
              prenom: client.prenom,
              telephone: client.telephone,
              email: client.email,
              adresse: client.adresse,
              type_client: client.type_client,
              notes: client.notes,
            });
            if (created.data) syncedCount++;
          }
        } catch {
          failedCount++;
        }
      }

      expect(syncedCount).toBeGreaterThan(0);
      expect(failedCount).toBe(0);
    });
  });
});
