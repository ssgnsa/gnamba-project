import { apiClient } from "../api/client";
import {
  readManualCache,
  writeManualCache,
  normalizeManualStatus,
} from "./manualSyncStore";
const CONTRACTS_CACHE_KEY = "egs.immobilier.contracts.local_cache.v1";
const TENANTS_CACHE_KEY = "egs.immobilier.tenants.local_cache.v1";

export async function syncPendingImmobilier() {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    throw new Error("Hors ligne — impossible de synchroniser maintenant");
  }

  const results = { tenantsSynced: 0, contractsSynced: 0, errors: [] as string[] };

  const tenants = readManualCache<any>(TENANTS_CACHE_KEY).map((t) => ({
    ...t,
    sync_status: normalizeManualStatus(t.sync_status),
  }));
  const contracts = readManualCache<any>(CONTRACTS_CACHE_KEY).map((c) => ({
    ...c,
    sync_status: normalizeManualStatus(c.sync_status),
  }));

  // Sync tenants (create client entity then tenant linkage + related contract)
  for (const tenant of tenants) {
    if (tenant.sync_status === "synced") continue;

    try {
      const clientPayload = {
        type_client: "particulier",
        nom: tenant.nom || undefined,
        prenom: tenant.prenom || undefined,
        telephone: tenant.telephone || undefined,
        email: tenant.email || undefined,
      };

      // Try to find an existing client on server to avoid duplicates
      let createdClient: any = null;
      try {
        const searchTerm = tenant.telephone || tenant.email || `${tenant.prenom || ''} ${tenant.nom || ''}`.trim();
        if (searchTerm) {
          const listRes = await apiClient.request(`/clients?search=${encodeURIComponent(searchTerm)}`);
          if (!listRes.error && Array.isArray(listRes.data) && listRes.data.length > 0) {
            // Prefer exact match on phone or email
            const found = (listRes.data as any[]).find((c) =>
              (tenant.telephone && c.telephone === tenant.telephone) ||
              (tenant.email && c.email === tenant.email),
            );
            createdClient = found || (listRes.data as any[])[0];
          }
        }
      } catch (e) {
        // ignore search failure and fallback to create
      }

      if (!createdClient) {
        // include local id to help server-side idempotency if supported
        const payload = { ...clientPayload, client_local_id: tenant.id };
        const clientRes = await apiClient.clients.create(payload);
        if (clientRes.error || !clientRes.data) throw new Error(clientRes.error || "Erreur création client");
        createdClient = clientRes.data as any;
      }

      // persist server client id on tenant for reference
      tenant.server_client_id = createdClient.id;

      // Find any local contracts linked to this tenant
      const linkedContracts = contracts.filter((c: any) => c.locataire_id === tenant.id || c.locataire_id === tenant.id);
      for (const lc of linkedContracts) {
        if (lc.sync_status === "synced") continue;

        const contractPayload = {
          property_id: lc.property_id,
          locataire_entity_id: createdClient.id,
          date_debut: lc.date_debut,
          date_fin: lc.date_fin || null,
          loyer_mensuel: lc.loyer_mensuel || 0,
          charges_mensuelles: lc.charges || 0,
          depot_garantie: lc.depot_garantie || 0,
          statut: lc.statut || "actif",
          notes: lc.notes || null,
          commission_rate: lc.commission_rate || 12,
          jour_echeance: lc.jour_echeance || 10,
          reference: lc.reference || undefined,
          contract_local_id: lc.id,
        };

        try {
          // If we have a local reference, check server for that reference first
          if (lc.reference) {
            try {
              const refRes = await apiClient.request(`/immobilier/contracts?reference=${encodeURIComponent(lc.reference)}`);
              if (!refRes.error && Array.isArray(refRes.data) && refRes.data.length > 0) {
                lc.sync_status = 'synced';
                results.contractsSynced += 1;
                continue;
              }
            } catch (e) {
              // ignore and continue to overlap check
            }
          }

          // Check existing contracts on server to avoid duplicates (same property + overlapping dates)
          const contractsListRes = await apiClient.request(
            `/immobilier/contracts?property_id=${encodeURIComponent(lc.property_id)}&locataire_entity_id=${encodeURIComponent(createdClient.id)}&limit=50`,
          );
          const serverContracts = !contractsListRes.error && contractsListRes.data ? (Array.isArray(contractsListRes.data) ? contractsListRes.data : (contractsListRes.data.data || [])) : [];
          const hasOverlap = serverContracts.some((sc: any) => {
            const aStart = new Date(sc.date_debut).getTime();
            const aEnd = sc.date_fin ? new Date(sc.date_fin).getTime() : Infinity;
            const bStart = lc.date_debut ? new Date(lc.date_debut).getTime() : 0;
            const bEnd = lc.date_fin ? new Date(lc.date_fin).getTime() : Infinity;
            return !(bEnd < aStart || bStart > aEnd);
          });

          if (hasOverlap) {
            // mark contract as synced locally (server already has an overlapping contract)
            lc.sync_status = 'synced';
            results.contractsSynced += 1;
            continue;
          }

          const contractRes = await apiClient.request('/immobilier/contracts', {
            method: 'POST',
            body: JSON.stringify(contractPayload),
          });
          if (contractRes.error || !contractRes.data) {
            lc.sync_error = contractRes.error || 'Erreur création contrat';
            results.errors.push(`Contract ${lc.id}: ${lc.sync_error}`);
            continue;
          }

          // mark contract as synced locally
          lc.sync_status = 'synced';
          lc.server_contract_id = contractRes.data.id;
          results.contractsSynced += 1;
        } catch (err: any) {
          lc.sync_error = err?.message || String(err);
          results.errors.push(`Contract ${lc.id}: ${lc.sync_error}`);
          continue;
        }
      }

      // Create tenant linkage on server if not existing
      try {
        const existingTenantRes = await apiClient.request(`/tenants?entity_id=${encodeURIComponent(createdClient.id)}`);
        const existingTenants = !existingTenantRes.error && Array.isArray(existingTenantRes.data) ? existingTenantRes.data : [];
        if (existingTenants.length > 0) {
          // Already exists on server
          tenant.sync_status = 'synced';
          tenant.server_tenant_id = existingTenants[0].id;
          results.tenantsSynced += 1;
        } else {
          const tenantCreatePayload: any = { entity_id: createdClient.id };
          if (linkedContracts.length > 0) {
            tenantCreatePayload.property_id = linkedContracts[0].property_id;
          }
          const tenantRes = await apiClient.request('/tenants', { method: 'POST', body: JSON.stringify(tenantCreatePayload) });
          if (tenantRes.error || !tenantRes.data) {
            throw new Error(tenantRes.error || 'Erreur création locataire');
          }
          tenant.sync_status = 'synced';
          tenant.server_tenant_id = tenantRes.data.id;
          results.tenantsSynced += 1;
        }
      } catch (err: any) {
        tenant.sync_error = err?.message || String(err);
        results.errors.push(`Tenant ${tenant.id}: ${tenant.sync_error}`);
      }
    } catch (err: any) {
      const msg = err?.message || String(err);
      results.errors.push(`Tenant ${tenant.id}: ${msg}`);
      tenant.sync_error = msg;
    }
  }

  // Persist updated caches
  try {
    writeManualCache(TENANTS_CACHE_KEY, tenants);
    writeManualCache(CONTRACTS_CACHE_KEY, contracts);
  } catch (e) {
    results.errors.push('Erreur écriture cache local après sync');
  }

  return results;
}
