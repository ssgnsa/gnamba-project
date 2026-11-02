import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/api/client', () => ({
  apiClient: {
    request: vi.fn(),
    clients: { create: vi.fn() },
  },
}));

vi.mock('@/lib/manualSyncStore', () => ({
  readManualCache: vi.fn(),
  writeManualCache: vi.fn(),
  normalizeManualStatus: (s: any) => s,
}));

import { syncPendingImmobilier } from '@/lib/manualSyncRunner';
import { apiClient } from '@/api/client';
import { readManualCache, writeManualCache } from '@/lib/manualSyncStore';

beforeEach(() => {
  vi.resetAllMocks();
});

describe('manualSyncRunner', () => {
  it('syncs tenant and linked contract when server accepts', async () => {
    const tenant = { id: 't1', nom: 'Test', prenom: 'User', telephone: '07000000', email: null, sync_status: 'pending', sync_error: null };
    const contract = { id: 'c1', property_id: 'p1', locataire_id: 't1', date_debut: '2026-01-01', date_fin: null, loyer_mensuel: 1000, charges: 0, depot_garantie: 0, statut: 'actif', sync_status: 'pending', reference: 'CTR-1' };

    (readManualCache as any).mockImplementation((key: string) => {
      if (key.includes('tenants')) return [tenant];
      if (key.includes('contracts')) return [contract];
      return [];
    });

    (apiClient.request as any).mockImplementation(async (endpoint: string, options?: any) => {
      if (endpoint.startsWith('/clients?')) return { data: [] };
      if (endpoint.startsWith('/immobilier/contracts?reference=')) return { data: [] };
      if (endpoint.startsWith('/immobilier/contracts?property_id=')) return { data: [] };
      if (endpoint.startsWith('/tenants?entity_id=')) return { data: [] };
      if (endpoint === '/immobilier/contracts' && options?.method === 'POST') {
        const body = JSON.parse(options.body);
        expect(body.locataire_id).toBe('serverClient1');
        expect(body.locataire_entity_id).toBeUndefined();
        return { data: { id: 'serverContract1' } };
      }
      if (endpoint === '/tenants' && options?.method === 'POST') {
        return { data: { id: 'serverTenant1' } };
      }
      return { data: null };
    });

    (apiClient.clients.create as any).mockResolvedValue({ data: { id: 'serverClient1' } });

    const res = await syncPendingImmobilier();

    expect(res.tenantsSynced).toBe(1);
    expect(res.contractsSynced).toBe(1);
    expect(writeManualCache).toHaveBeenCalled();
  });
});
