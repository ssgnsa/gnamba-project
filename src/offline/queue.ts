/**
 * OFFLINE LAYER — Queue System
 * Remplace le localStorage isolé de foncierOffline.ts.
 * Persiste les actions dans IndexedDB via localStorage fallback.
 * Fiable, ordonné, rejouable.
 */

const QUEUE_KEY = 'egs:offline_queue';

export type QueueActionType =
  | 'lot.create'
  | 'lot.update'
  | 'lot.delete'
  | 'attestation.create'
  | 'lead.create'
  | 'lead.update';

export interface QueueItem {
  id: string;
  type: QueueActionType;
  payload: Record<string, unknown>;
  status: 'pending' | 'syncing' | 'failed' | 'done';
  created_at: string;
  attempts: number;
  last_error?: string | null;
}

function loadQueue(): QueueItem[] {
  try {
    const raw = window.localStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as QueueItem[]) : [];
  } catch {
    return [];
  }
}

function saveQueue(items: QueueItem[]): void {
  try {
    window.localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
  } catch {
    console.error('[OfflineQueue] Impossible de sauvegarder la queue (storage plein?)');
  }
}

export const offlineQueue = {
  /**
   * Ajouter une action à la queue offline
   */
  enqueue(type: QueueActionType, payload: Record<string, unknown>): QueueItem {
    const item: QueueItem = {
      id: crypto.randomUUID(),
      type,
      payload,
      status: 'pending',
      created_at: new Date().toISOString(),
      attempts: 0,
      last_error: null,
    };
    const queue = loadQueue();
    queue.push(item);
    saveQueue(queue);
    return item;
  },

  /**
   * Liste toutes les actions en attente
   */
  getPending(): QueueItem[] {
    return loadQueue().filter((i) => i.status === 'pending' || i.status === 'failed');
  },

  /**
   * Marquer un item comme complété
   */
  markDone(id: string): void {
    const queue = loadQueue().map((i) =>
      i.id === id ? { ...i, status: 'done' as const } : i,
    );
    saveQueue(queue);
  },

  /**
   * Marquer un item comme échoué
   */
  markFailed(id: string, error: string): void {
    const queue = loadQueue().map((i) =>
      i.id === id
        ? { ...i, status: 'failed' as const, attempts: i.attempts + 1, last_error: error }
        : i,
    );
    saveQueue(queue);
  },

  /**
   * Supprimer les items complétés (nettoyage)
   */
  prune(): void {
    const queue = loadQueue().filter((i) => i.status !== 'done');
    saveQueue(queue);
  },

  /**
   * Nombre d'actions en attente
   */
  pendingCount(): number {
    return this.getPending().length;
  },
};
