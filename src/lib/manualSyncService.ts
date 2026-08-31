import { syncPendingImmobilier } from "./manualSyncRunner";

type Callbacks = {
  onError?: (err: Error | string) => void;
  onSuccess?: (result: any) => void;
};

export function startManualSyncService(opts: Callbacks = {}) {
  let interval = 60 * 1000; // 60s
  const maxInterval = 15 * 60 * 1000; // 15min
  let consecutiveErrors = 0;
  let stopped = false;

  const run = async () => {
    if (stopped) return;
    try {
      const res = await syncPendingImmobilier();
      consecutiveErrors = 0;
      interval = 60 * 1000;
      if (opts.onSuccess) opts.onSuccess(res);
    } catch (err: any) {
      consecutiveErrors += 1;
      interval = Math.min(maxInterval, interval * 2);
      if (opts.onError) opts.onError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      if (!stopped) {
        setTimeout(run, interval);
      }
    }
  };

  // Start first run after short delay to let app initialize
  const initialTimer = setTimeout(run, 5000);

  return () => {
    stopped = true;
    clearTimeout(initialTimer);
  };
}
