import { useState, useEffect, useCallback } from 'react';

export const useFoncierSyncOptimized = (deviceId: string, isOnline: boolean) => {
  const [syncing, setSyncing] = useState(false);
  const [_syncError, _setSyncError] = useState<string | null>(null);
  const [syncProgress, setSyncProgress] = useState<{ current: number; total: number } | null>(null);
  const [syncPending, setSyncPending] = useState(0);

  useEffect(() => {
    if (isOnline) {
      setSyncPending(0);
    }
  }, [isOnline]);

  const syncQueue = useCallback(async () => {
    setSyncing(true);
    setSyncProgress({ current: 0, total: 0 });
    setSyncPending(0);
    setSyncing(false);
  }, []);

  const refreshCache = useCallback(async () => {
    // no-op placeholder
  }, []);

  const refreshQueueCount = useCallback(async () => {
    // no-op placeholder
  }, []);

  return {
    syncing,
    syncError: _syncError,
    syncProgress,
    syncPending,
    syncQueue,
    refreshCache,
    refreshQueueCount,
  };
};
