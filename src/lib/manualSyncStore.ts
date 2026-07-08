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
