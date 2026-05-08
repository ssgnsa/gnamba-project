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
