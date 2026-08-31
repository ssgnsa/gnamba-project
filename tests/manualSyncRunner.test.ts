import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mocks
vi.mock('../src/api/client', () => ({
  apiClient: {
    request: vi.fn(),
    clients: { create: vi.fn() },
  },
}));

vi.mock('../src/lib/manualSyncStore', () => ({
  readManualCache: vi.fn(),
  writeManualCache: vi.fn(),
  normalizeManualStatus: (s: any) => s,
}));

import { syncPendingImmobilier } from '../src/lib/manualSyncRunner';
import { apiClient } from '../src/api/client';
import { readManualCache, writeManualCache } from '../src/lib/manualSyncStore';

beforeEach(() => {
  vi.resetAllMocks();
});

describe('manualSyncRunner', () => {
  it('syncs tenant and linked contract when server accepts', async () => {
    // Prepare local tenant + contract
    const tenant = { id: 't1', nom: 'Test', prenom: 'User', telephone: '07000000', email: null, sync_status: 'pending', sync_error: null };
    const contract = { id: 'c1', property_id: 'p1', locataire_id: 't1', date_debut: '2026-01-01', date_fin: null, loyer_mensuel: 1000, charges: 0, depot_garantie: 0, statut: 'actif', sync_status: 'pending' };

    (readManualCache as any).mockImplementation((key: string) => {
      if (key.includes('tenants')) return [tenant];
      if (key.includes('contracts')) return [contract];
      return [];
    });

    // Mock client search -> none found
    (apiClient.request as any).mockImplementation(async (endpoint: string) => {
      if (endpoint.startsWith('/clients?')) return { data: [] };
      if (endpoint.startsWith('/immobilier/contracts')) return { data: [] };
      return { data: null };
    });

    // Mock create client and create contract via apiClient.clients.create and request
    (apiClient.clients.create as any).mockResolvedValue({ data: { id: 'serverClient1' } });
    (apiClient.request as any).mockResolvedValue({ data: { id: 'serverContract1' } });

    const res = await syncPendingImmobilier();

    expect(res.tenantsSynced).toBe(1);
    expect(res.contractsSynced).toBe(1);
    expect(writeManualCache).toHaveBeenCalled();
  });
});
