import type { FoncierLot } from "../types";

export type OfflineQueueItem = {
  id: string;
  op:
    | "upsert_lot"
    | "soft_delete_lot"
    | "restore_lot"
    | "audit_log"
    | "pending_attestation";
  payload: any;
  client_updated_at: string;
  retry_count?: number;
  last_error?: string;
  priority?: "high" | "normal" | "low"; // For conflict resolution
  conflicts?: ConflictResolution[];
};

export type ConflictResolution = {
  field: string;
  local_value: any;
  server_value: any;
  resolution: "local" | "server" | "merge";
};

export const OFFLINE_STORAGE_FULL = "OFFLINE_STORAGE_FULL";

const DB_NAME = "egs-foncier-offline";
const DB_VERSION = 1;
const LOTS_STORE = "lots";
const QUEUE_STORE = "queue";

const isBrowser = typeof window !== "undefined";
const hasIndexedDb = isBrowser && "indexedDB" in window;

let dbPromise: Promise<IDBDatabase> | null = null;

const requestToPromise = <T>(request: IDBRequest<T>): Promise<T> => {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const txDone = (tx: IDBTransaction): Promise<void> => {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
};

const isQuotaExceeded = (error: unknown): boolean => {
  if (!error || typeof error !== "object") return false;
  const name = (error as { name?: string }).name || "";
  const message = (error as { message?: string }).message || "";
  return name === "QuotaExceededError" || /quota/i.test(message);
};

const throwIfQuota = (error: unknown): never => {
  if (isQuotaExceeded(error)) {
    const err = new Error("Offline storage quota exceeded");
    (err as { code?: string }).code = OFFLINE_STORAGE_FULL;
    throw err;
  }
  throw error;
};

const openDb = (): Promise<IDBDatabase> => {
  if (!hasIndexedDb) {
    return Promise.reject(new Error("IndexedDB not available"));
  }
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(LOTS_STORE)) {
          db.createObjectStore(LOTS_STORE, { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains(QUEUE_STORE)) {
          db.createObjectStore(QUEUE_STORE, { keyPath: "id" });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  return dbPromise;
};

export const getDeviceId = (): string => {
  if (!isBrowser) return "server";
  const key = "egs_device_id";
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  let generated = "";
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    try {
      generated = crypto.randomUUID();
    } catch {
      generated = "";
    }
  }
  if (!generated) {
    generated = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
  window.localStorage.setItem(key, generated);
  return generated;
};

export const getCachedLots = async (): Promise<FoncierLot[]> => {
  if (!hasIndexedDb) return [];
  try {
    const db = await openDb();
    const tx = db.transaction(LOTS_STORE, "readonly");
    const store = tx.objectStore(LOTS_STORE);
    const result = await requestToPromise(store.getAll());
    await txDone(tx);
    return (result as FoncierLot[]) || [];
  } catch {
    return [];
  }
};

export const upsertCachedLot = async (lot: FoncierLot): Promise<void> => {
  if (!hasIndexedDb) return;
  try {
    const db = await openDb();
    const tx = db.transaction(LOTS_STORE, "readwrite");
    tx.objectStore(LOTS_STORE).put(lot);
    await txDone(tx);
  } catch (error) {
    throwIfQuota(error);
  }
};

export const upsertCachedLots = async (lots: FoncierLot[]): Promise<void> => {
  if (!hasIndexedDb) return;
  try {
    const db = await openDb();
    const tx = db.transaction(LOTS_STORE, "readwrite");
    const store = tx.objectStore(LOTS_STORE);
    lots.forEach((lot) => store.put(lot));
    await txDone(tx);
  } catch (error) {
    throwIfQuota(error);
  }
};

export const getQueueItems = async (): Promise<OfflineQueueItem[]> => {
  if (!hasIndexedDb) return [];
  try {
    const db = await openDb();
    const tx = db.transaction(QUEUE_STORE, "readonly");
    const store = tx.objectStore(QUEUE_STORE);
    const result = await requestToPromise(store.getAll());
    await txDone(tx);
    return (result as OfflineQueueItem[]) || [];
  } catch {
    return [];
  }
};

export const addQueueItem = async (item: OfflineQueueItem): Promise<void> => {
  if (!hasIndexedDb) return;
  try {
    const db = await openDb();
    const tx = db.transaction(QUEUE_STORE, "readwrite");
    tx.objectStore(QUEUE_STORE).put(item);
    await txDone(tx);
  } catch (error) {
    throwIfQuota(error);
  }
};

export const removeQueueItem = async (id: string): Promise<void> => {
  if (!hasIndexedDb) return;
  try {
    const db = await openDb();
    const tx = db.transaction(QUEUE_STORE, "readwrite");
    tx.objectStore(QUEUE_STORE).delete(id);
    await txDone(tx);
  } catch (error) {
    throwIfQuota(error);
  }
};

export const countQueueItems = async (): Promise<number> => {
  if (!hasIndexedDb) return 0;
  const items = await getQueueItems();
  return items.length;
};

/**
 * Sync queue with conflict resolution
 */
export const syncQueueWithConflicts = async (): Promise<{
  synced: number;
  failed: number;
  conflicts: ConflictResolution[];
}> => {
  if (!hasIndexedDb) return { synced: 0, failed: 0, conflicts: [] };

  const items = await getQueueItems();
  let synced = 0;
  let failed = 0;
  const conflicts: ConflictResolution[] = [];

  // Sort by priority and timestamp
  items.sort((a, b) => {
    const priorityOrder = { high: 3, normal: 2, low: 1 };
    const aPriority = priorityOrder[a.priority || "normal"];
    const bPriority = priorityOrder[b.priority || "normal"];

    if (aPriority !== bPriority) return bPriority - aPriority;

    return new Date(a.client_updated_at).getTime() - new Date(b.client_updated_at).getTime();
  });

  for (const item of items) {
    try {
      await processQueueItemWithConflictResolution(item);
      await removeQueueItem(item.id);
      synced++;
    } catch (error: any) {
      failed++;

      // Check if it's a conflict error
      if (error?.code === "CONFLICT" || error?.message?.includes("conflict")) {
        const conflictResolution = await resolveConflict(item, error);
        if (conflictResolution) {
          conflicts.push(...conflictResolution);
          // Retry with resolved conflict
          try {
            await processQueueItemWithConflictResolution(item);
            await removeQueueItem(item.id);
            synced++;
            failed--; // Remove from failed count since it succeeded
          } catch {
            // Still failed after conflict resolution
          }
        }
      }

      // Increment retry count
      item.retry_count = (item.retry_count || 0) + 1;
      item.last_error = error?.message || "Unknown error";

      // Remove from queue if too many retries
      if (item.retry_count >= 3) {
        await removeQueueItem(item.id);
      } else {
        await addQueueItem(item);
      }
    }
  }

  return { synced, failed, conflicts };
};

/**
 * Process queue item with conflict resolution
 */
const processQueueItemWithConflictResolution = async (item: OfflineQueueItem): Promise<void> => {
  const { supabase } = await import("../lib/supabase");

  switch (item.op) {
    case "upsert_lot":
      await supabase.from("foncier_lots").upsert(item.payload);
      break;
    case "soft_delete_lot":
      await supabase.rpc("soft_delete_foncier_lot", { p_lot_id: item.payload.id });
      break;
    case "restore_lot":
      await supabase.rpc("restore_foncier_lot", { p_lot_id: item.payload.id });
      break;
    case "audit_log":
      const { logFoncierAudit } = await import("../lib/foncierAudit");
      await logFoncierAudit(supabase, item.payload);
      break;
    default:
      throw new Error(`Unknown operation: ${item.op}`);
  }
};

/**
 * Resolve conflicts based on business rules
 */
const resolveConflict = async (
  item: OfflineQueueItem,
  _error: any
): Promise<ConflictResolution[] | null> => {
  // This is a simplified conflict resolution
  // In a real implementation, you'd compare server vs local data
  // and apply business rules (e.g., last modified wins, merge fields, etc.)

  if (item.op === "upsert_lot") {
    // For lot updates, server version usually wins unless explicitly overridden
    return [{
      field: "general",
      local_value: item.payload,
      server_value: null, // Would need to fetch server version
      resolution: "server",
    }];
  }

  return null;
};
