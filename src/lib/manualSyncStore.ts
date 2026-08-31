export type ManualSyncStatus = "synced" | "pending" | "deleted";

export interface ManualSyncMeta {
  sync_status: ManualSyncStatus;
  sync_error?: string | null;
  deleted_at?: string | null;
}

const isBrowser = typeof window !== "undefined";

export function readManualCache<T>(key: string): T[] {
  if (!isBrowser) return [];

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

export function writeManualCache<T>(key: string, value: T[]): void {
  if (!isBrowser) return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota / privacy mode failures.
  }
}

export function normalizeManualStatus(
  value: unknown,
): ManualSyncStatus {
  return value === "deleted" || value === "pending" ? value : "synced";
}

export function isPendingSync<T extends { sync_status?: unknown }>(item: T): boolean {
  return normalizeManualStatus(item.sync_status) !== "synced";
}

export function isDeletedSync<T extends { sync_status?: unknown }>(item: T): boolean {
  return normalizeManualStatus(item.sync_status) === "deleted";
}

export function mergeManualCacheWithRemote<T extends { id: string; sync_status?: ManualSyncStatus }>(
  cached: T[],
  remote: T[],
): T[] {
  const cachedMap = new Map(cached.map((item) => [item.id, item]));
  const result = new Map<string, T>();

  // Add all remote items first
  for (const item of remote) {
    const cachedItem = cachedMap.get(item.id);
    
    // If there\'s a local pending/deleted change, keep it
    if (cachedItem && (cachedItem.sync_status === "pending" || cachedItem.sync_status === "deleted")) {
      result.set(item.id, cachedItem);
    } else {
      result.set(item.id, item);
    }
  }

  // Add any cached items that don\'t exist in remote
  for (const item of cached) {
    if (!result.has(item.id)) {
      result.set(item.id, item);
    }
  }

  return Array.from(result.values());
}

