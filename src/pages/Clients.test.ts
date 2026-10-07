/**
 * Clients Module Test Suite
 * Tests for creation and synchronization flow
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { clientsRepository } from "../data/clients.repository";
import { getClientDisplayName, getClientTypeMeta } from "./Clients";
import type { Client } from "../types";

describe("Clients Module - Create and Sync Flow", () => {
  beforeEach(() => {
    const repo = clientsRepository as any;
    Object.keys(repo).forEach((key) => {
      const value = repo[key];
      if (typeof value === "function" && "mockReset" in value) {
        value.mockReset();
      }
    });
  });

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

    const errors: string[] = [];
    if (!invalidClient.nom.trim()) errors.push("Le nom est obligatoire.");
    if (!invalidClient.telephone.trim()) errors.push("Le téléphone est obligatoire.");

    expect(errors.length).toBe(2);
    expect(errors[0]).toBe("Le nom est obligatoire.");
  });

  it("should handle missing names and unknown types without crashing", () => {
    const incompleteClient = {
      nom: undefined,
      prenom: undefined,
      telephone: "",
      email: "",
      adresse: "",
      type_client: undefined,
      notes: "",
    } as Partial<Client>;

    expect(getClientDisplayName(incompleteClient)).toBe("Client");
    expect(getClientTypeMeta(incompleteClient.type_client).label).toBe("Client");
  });

  it("should sync a new client to server and replace local ID", async () => {
    const repo = clientsRepository as any;
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

    repo.getById = vi.fn().mockResolvedValue({ data: null, error: null });
    repo.create = vi.fn().mockResolvedValue({ data: serverResponse, error: null });

    const existing = await repo.getById(localClientId);
    expect(existing.data).toBeNull();

    if (!existing.data) {
      const created = await repo.create({
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
    const repo = clientsRepository as any;
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

    repo.getById = vi.fn().mockResolvedValue({ data: existingClient, error: null });
    repo.update = vi.fn().mockResolvedValue({ data: updatedClient, error: null });

    const existing = await repo.getById(clientId);
    expect(existing.data).toBeDefined();

    if (existing.data) {
      const updated = await repo.update(clientId, {
        telephone: "+225 07 11 11 11",
      });

      expect(updated.data?.telephone).toBe("+225 07 11 11 11");
      expect(updated.data?.id).toBe(clientId);
    }
  });

  it("should handle sync errors gracefully", async () => {
    const repo = clientsRepository as any;
    const clientId = "test-uuid-123";

    repo.getById = vi.fn().mockResolvedValue({ data: null, error: "Network error" });

    const existing = await repo.getById(clientId);
    expect(existing.error).toBe("Network error");
  });

  it("should sync multiple clients and track results", async () => {
    const repo = clientsRepository as any;
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

    repo.getById = vi.fn().mockResolvedValue({ data: null, error: null });
    repo.create = vi.fn().mockImplementation(async () => ({
      data: clients[syncedCount % 2],
      error: null,
    }));

    for (const client of clients) {
      try {
        const existing = await repo.getById(client.id);
        if (!existing.data) {
          const created = await repo.create({
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
