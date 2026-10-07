const memoryCache = new Map<string, { value: unknown; expiresAt: number }>();

export const getCachedResponse = <T>(key: string, _ttlMs: number): T | null => {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return entry.value as T;
};

export const setCachedResponse = <T>(
  key: string,
  value: T,
  ttlMs: number,
): void => {
  memoryCache.set(key, { value, expiresAt: Date.now() + ttlMs });
};

export const invalidateCachedResponse = (prefix?: string): void => {
  if (!prefix) {
    memoryCache.clear();
    return;
  }

  for (const key of Array.from(memoryCache.keys())) {
    if (key.startsWith(prefix)) {
      memoryCache.delete(key);
    }
  }
};
