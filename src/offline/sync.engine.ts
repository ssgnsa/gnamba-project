/**
 * OFFLINE LAYER — Sync Engine
 * Rejoue la queue offline quand la connectivité est rétablie.
 * S'initialise une seule fois via initSyncEngine().
 */

import { offlineQueue } from './queue';
import { foncierRepository } from '../data/foncier.repository';
import { leadsRepository } from '../data/leads.repository';

const MAX_ATTEMPTS = 5;

async function processItem(item: ReturnType<typeof offlineQueue.getPending>[0]) {
  if (item.attempts >= MAX_ATTEMPTS) {
    offlineQueue.markFailed(item.id, 'Trop de tentatives — abandon');
    return;
  }

  try {
    let result: { error: string | null } = { error: null };

    switch (item.type) {
      case 'lot.create':
        result = await foncierRepository.saveLot(item.payload, false);
        break;
      case 'lot.update':
        result = await foncierRepository.saveLot(item.payload, true);
        break;
      case 'lead.create':
        result = await leadsRepository.create(item.payload as any);
        break;
      case 'lead.update': {
        const { id, ...rest } = item.payload;
        if (typeof id === 'string') {
          result = await leadsRepository.update(id, rest as any);
        } else {
          result = { error: 'ID manquant pour lead.update' };
        }
        break;
      }
      default:
        console.warn('[SyncEngine] Type d\'action inconnu:', item.type);
        offlineQueue.markFailed(item.id, `Type inconnu: ${item.type}`);
        return;
    }

    if (result.error) {
      offlineQueue.markFailed(item.id, result.error);
    } else {
      offlineQueue.markDone(item.id);
    }
  } catch (err) {
    offlineQueue.markFailed(
      item.id,
      err instanceof Error ? err.message : 'Erreur inconnue',
    );
  }
}

async function runSync() {
  const pending = offlineQueue.getPending();
  if (pending.length === 0) return;

  console.log(`[SyncEngine] Synchronisation de ${pending.length} action(s) offline…`);
  for (const item of pending) {
    await processItem(item);
  }
  offlineQueue.prune();
  console.log('[SyncEngine] Synchronisation terminée.');
}

let initialized = false;

export function initSyncEngine() {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  window.addEventListener('online', () => {
    console.log('[SyncEngine] Connexion rétablie — sync offline…');
    void runSync();
  });

  if (navigator.onLine && offlineQueue.pendingCount() > 0) {
    void runSync();
  }
}

export { runSync };
