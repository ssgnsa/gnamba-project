/**
 * OFFLINE STORE — IndexedDB (remplace localStorage)
 * Persistant, transactionnel, structuré, adapté au terrain.
 */

import { generateUUID } from '../../utils/reference';

const DB_NAME = 'EGS_Offline';
const DB_VERSION = 1;
const hasIndexedDbSupport = (): boolean =>
  typeof window !== 'undefined' &&
  typeof indexedDB !== 'undefined' &&
  typeof IDBKeyRange !== 'undefined';

export interface OfflineEntity {
  id: string;
  type: 'foncier_lot' | 'lead' | 'user_profile' | 'attestation' | 'visite' | 'payment';
  data: Record<string, unknown>;
  version: number;
  updated_at: string;
  updated_by: string | null;
  sync_status: 'pending' | 'synced' | 'conflict' | 'deleted';
  local_created_at: string;
}

export interface OfflineTransaction {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  entity_type: string;
  entity_id: string;
  payload: Record<string, unknown>;
  status: 'pending' | 'syncing' | 'synced' | 'failed' | 'conflict';
  retry_count: number;
  created_at: string;
  last_attempt: string | null;
  last_error?: string | null;
  priority: 1 | 2 | 3 | 4 | 5; // 1 = highest
}

export interface SyncState {
  id: 'state'; // Clé fixe pour IndexedDB
  last_sync_at: string | null;
  pending_count: number;
  conflict_count: number;
  is_online: boolean;
}

export interface ConflictLog {
  id: string;
  transaction_id: string;
  entity_type: string;
  entity_id: string;
  local_version: number;
  server_version: number;
  conflict_type: 'field' | 'structural' | 'hard';
  local_data: Record<string, unknown>;
  server_data: Record<string, unknown>;
  resolved: boolean;
  resolution?: 'use_server' | 'use_local' | 'merge' | 'manual';
  created_at: string;
  resolved_at?: string | null;
  resolved_by?: string | null;
}

class EGSIndexedDB {
  private db: IDBDatabase | null = null;
  private available = hasIndexedDbSupport();

  async init(): Promise<void> {
    if (!hasIndexedDbSupport()) {
      this.available = false;
      this.db = null;
      return;
    }

    if (!this.available) return;

    try {
      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          this.db = request.result;
          resolve();
        };

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;

          // Entities store
          if (!db.objectStoreNames.contains('entities')) {
            const entitiesStore = db.createObjectStore('entities', { keyPath: 'id' });
            entitiesStore.createIndex('type', 'type', { unique: false });
            entitiesStore.createIndex('sync_status', 'sync_status', { unique: false });
            entitiesStore.createIndex('updated_at', 'updated_at', { unique: false });
          }

          // Transactions queue
          if (!db.objectStoreNames.contains('transactions')) {
            const txStore = db.createObjectStore('transactions', { keyPath: 'id' });
            txStore.createIndex('status', 'status', { unique: false });
            txStore.createIndex('entity_type', 'entity_type', { unique: false });
            txStore.createIndex('priority', 'priority', { unique: false });
            txStore.createIndex('created_at', 'created_at', { unique: false });
          }

          // Sync state
          if (!db.objectStoreNames.contains('sync_state')) {
            db.createObjectStore('sync_state', { keyPath: 'id' });
          }

          // Conflict logs
          if (!db.objectStoreNames.contains('conflicts')) {
            const conflictStore = db.createObjectStore('conflicts', { keyPath: 'id' });
            conflictStore.createIndex('transaction_id', 'transaction_id', { unique: false });
            conflictStore.createIndex('resolved', 'resolved', { unique: false });
            conflictStore.createIndex('created_at', 'created_at', { unique: false });
          }
        };
      });
    } catch (error) {
      this.available = false;
      this.db = null;
      if (import.meta.env.DEV) {
        console.warn('[OfflineDB] IndexedDB unavailable, offline persistence disabled:', error);
      }
    }
  }

  isAvailable(): boolean {
    return this.available && this.db !== null;
  }

  private getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): IDBObjectStore | null {
    if (!this.db) return null;
    const tx = this.db.transaction(storeName, mode);
    return tx.objectStore(storeName);
  }

  // --- Entities ---
  async saveEntity(entity: OfflineEntity): Promise<void> {
    const store = this.getStore('entities', 'readwrite');
    if (!store) return;
    await store.put(entity);
  }

  async getEntity(id: string): Promise<OfflineEntity | null> {
    const store = this.getStore('entities');
    if (!store) return null;
    return new Promise((resolve) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });
  }

  async getEntitiesByType(type: string): Promise<OfflineEntity[]> {
    const store = this.getStore('entities');
    if (!store) return [];
    const index = store.index('type');
    return new Promise((resolve) => {
      const request = index.getAll(type);
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    });
  }

  async getPendingEntities(): Promise<OfflineEntity[]> {
    const store = this.getStore('entities');
    if (!store) return [];
    const index = store.index('sync_status');
    return new Promise((resolve) => {
      const request = index.getAll('pending');
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    });
  }

  // --- Transactions ---
  async addTransaction(tx: Omit<OfflineTransaction, 'id' | 'created_at' | 'last_attempt'>): Promise<string> {
    if (!this.db) {
      return generateUUID();
    }

    const transaction: OfflineTransaction = {
      ...tx,
      id: generateUUID(),
      created_at: new Date().toISOString(),
      last_attempt: null,
    };
    const store = this.getStore('transactions', 'readwrite');
    if (!store) return transaction.id;
    await store.put(transaction);
    return transaction.id;
  }

  async getPendingTransactions(limit = 20): Promise<OfflineTransaction[]> {
    const store = this.getStore('transactions');
    if (!store) return [];
    const index = store.index('status');
    return new Promise((resolve) => {
      const request = index.getAll('pending');
      request.onsuccess = () => {
        const all = request.result || [];
        // Sort by priority (1=highest) then created_at
        const sorted = all.sort((a, b) => {
          if (a.priority !== b.priority) return a.priority - b.priority;
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });
        resolve(sorted.slice(0, limit));
      };
      request.onerror = () => resolve([]);
    });
  }

  async updateTransaction(id: string, updates: Partial<OfflineTransaction>): Promise<void> {
    const store = this.getStore('transactions', 'readwrite');
    if (!store) return;
    const existing = await new Promise<OfflineTransaction | null>((res) => {
      const req = store.get(id);
      req.onsuccess = () => res(req.result || null);
      req.onerror = () => res(null);
    });
    if (existing) {
      await store.put({ ...existing, ...updates });
    }
  }

  async deleteTransaction(id: string): Promise<void> {
    const store = this.getStore('transactions', 'readwrite');
    if (!store) return;
    await store.delete(id);
  }

  // --- Sync State ---
  async getSyncState(): Promise<SyncState> {
    const store = this.getStore('sync_state');
    if (!store) {
      return {
        id: 'state',
        last_sync_at: null,
        pending_count: 0,
        conflict_count: 0,
        is_online: typeof navigator !== 'undefined' ? navigator.onLine : true,
      };
    }
    return new Promise((resolve) => {
      const request = store.get('state');
      request.onsuccess = () => {
        resolve(request.result || {
          id: 'state',
          last_sync_at: null,
          pending_count: 0,
          conflict_count: 0,
          is_online: navigator.onLine,
        });
      };
      request.onerror = () => resolve({
        id: 'state',
        last_sync_at: null,
        pending_count: 0,
        conflict_count: 0,
        is_online: navigator.onLine,
      });
    });
  }

  async updateSyncState(updates: Partial<SyncState>): Promise<void> {
    const store = this.getStore('sync_state', 'readwrite');
    if (!store) return;
    const existing = await this.getSyncState();
    await store.put({ ...existing, ...updates });
  }

  // --- Conflicts ---
  async addConflict(conflict: Omit<ConflictLog, 'id' | 'created_at'>): Promise<string> {
    if (!this.db) {
      return generateUUID();
    }
    const log: ConflictLog = {
      ...conflict,
      id: generateUUID(),
      created_at: new Date().toISOString(),
    };
    const store = this.getStore('conflicts', 'readwrite');
    if (!store) return log.id;
    await store.put(log);
    return log.id;
  }

  async getUnresolvedConflicts(): Promise<ConflictLog[]> {
    const store = this.getStore('conflicts');
    if (!store) return [];
    const index = store.index('resolved');
    return new Promise((resolve) => {
      const request = index.getAll(IDBKeyRange.only(false));
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    });
  }

  async resolveConflict(id: string, resolution: ConflictLog['resolution'], resolvedBy: string): Promise<void> {
    const store = this.getStore('conflicts', 'readwrite');
    if (!store) return;
    const existing = await new Promise<ConflictLog | null>((res) => {
      const req = store.get(id);
      req.onsuccess = () => res(req.result || null);
      req.onerror = () => res(null);
    });
    if (existing) {
      await store.put({
        ...existing,
        resolved: true,
        resolution,
        resolved_by: resolvedBy,
        resolved_at: new Date().toISOString(),
      });
    }
  }

  // --- Cleanup ---
  async cleanupOldTransactions(olderThanDays = 30): Promise<void> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - olderThanDays);
    const store = this.getStore('transactions', 'readwrite');
    if (!store) return;
    const index = store.index('created_at');
    const range = IDBKeyRange.upperBound(cutoff.toISOString());
    const request = index.openCursor(range);
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result as IDBCursorWithValue;
      if (cursor) {
        if (cursor.value.status === 'synced') {
          cursor.delete();
        }
        cursor.continue();
      }
    };
  }
}

export const offlineDB = new EGSIndexedDB();
