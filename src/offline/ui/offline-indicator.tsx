/**
 * OFFLINE INDICATOR — UI Component pour afficher l'état offline/sync
 * Badge visible, pending count, et actions manuelles.
 */

import { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { syncEngineV2 } from '../sync/sync.engine.v2';
import { connectivityManager } from '../network/connectivity';
import type { ConnectivityStatus } from '../network/connectivity';

interface OfflineIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export function OfflineIndicator({ className = '', showDetails = false }: OfflineIndicatorProps) {
  const [connectivity, setConnectivity] = useState<ConnectivityStatus>(connectivityManager.getStatus());
  const [syncState, setSyncState] = useState({
    pending_count: 0,
    conflict_count: 0,
    last_sync_at: null as string | null,
  });
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // S'abonner aux changements de connectivité
    const unsubscribeConnectivity = connectivityManager.subscribe((status) => {
      setConnectivity(status);
    });

    // S'abonner aux changements de sync
    const updateSyncState = async () => {
      try {
        const state = await syncEngineV2.getState();
        setSyncState(state);
      } catch {
        // Ignorer les erreurs
      }
    };

    updateSyncState();
    const syncInterval = setInterval(updateSyncState, 5_000);

    return () => {
      unsubscribeConnectivity();
      clearInterval(syncInterval);
    };
  }, []);

  const handleForceSync = async () => {
    if (isSyncing || !connectivity.isOnline) return;

    setIsSyncing(true);
    try {
      const result = await syncEngineV2.forceSync();
      console.log(`[OfflineIndicator] Sync: ${result.synced} synced, ${result.errors} errors`);
      
      // Mettre à jour l'état
      const state = await syncEngineV2.getState();
      setSyncState(state);
    } catch (error) {
      console.error('[OfflineIndicator] Force sync error:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const getStatusIcon = () => {
    if (!connectivity.isOnline) {
      return <WifiOff className="w-4 h-4" />;
    }

    if (syncState.pending_count > 0) {
      return <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />;
    }

    if (syncState.conflict_count > 0) {
      return <AlertCircle className="w-4 h-4" />;
    }

    return <CheckCircle className="w-4 h-4" />;
  };

  const getStatusColor = () => {
    if (!connectivity.isOnline) return 'bg-red-100 text-red-800 border-red-200';
    if (syncState.conflict_count > 0) return 'bg-orange-100 text-orange-800 border-orange-200';
    if (syncState.pending_count > 0) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  const getStatusText = () => {
    if (!connectivity.isOnline) {
      return `Hors ligne${connectivity.error ? ` (${connectivity.error})` : ''}`;
    }

    if (syncState.conflict_count > 0) {
      return `${syncState.conflict_count} conflit(s)`;
    }

    if (syncState.pending_count > 0) {
      return `${syncState.pending_count} en attente`;
    }

    return connectivityManager.getStatusDescription();
  };

  if (!showDetails) {
    // Mode compact (badge seul)
    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor()} ${className}`}>
        {getStatusIcon()}
        <span>{getStatusText()}</span>
        {syncState.pending_count > 0 && (
          <span className="ml-1 bg-white/50 px-1 rounded text-xs">
            {syncState.pending_count}
          </span>
        )}
      </div>
    );
  }

  // Mode détaillé avec actions
  return (
    <div className={`p-3 rounded-lg border ${getStatusColor()} ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="font-medium">{getStatusText()}</span>
        </div>
        {connectivity.isOnline && syncState.pending_count > 0 && (
          <button
            onClick={handleForceSync}
            disabled={isSyncing}
            className="px-2 py-1 text-xs bg-white/50 rounded hover:bg-white/70 disabled:opacity-50"
          >
            {isSyncing ? 'Sync...' : 'Sync now'}
          </button>
        )}
      </div>

      {syncState.last_sync_at && (
        <div className="text-xs opacity-75">
          Dernière sync: {new Date(syncState.last_sync_at).toLocaleTimeString()}
        </div>
      )}

      {connectivity.latency && (
        <div className="text-xs opacity-75">
          Latence: {connectivity.latency}ms
        </div>
      )}

      {syncState.conflict_count > 0 && (
        <div className="mt-2 text-xs">
          <button className="underline">
            Résoudre les conflits ({syncState.conflict_count})
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Hook pour utiliser l'état offline dans les composants
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useOfflineStatus() {
  const [connectivity, setConnectivity] = useState(connectivityManager.getStatus());
  const [syncState, setSyncState] = useState({
    pending_count: 0,
    conflict_count: 0,
    is_online: true,
  });

  useEffect(() => {
    const unsubscribeConnectivity = connectivityManager.subscribe((status) => {
      setConnectivity(status);
    });

    const updateSyncState = async () => {
      try {
        const state = await syncEngineV2.getState();
        setSyncState(state);
      } catch {
        // Ignorer
      }
    };

    updateSyncState();
    const interval = setInterval(updateSyncState, 3_000);

    return () => {
      unsubscribeConnectivity();
      clearInterval(interval);
    };
  }, []);

  return {
    connectivity,
    syncState,
    isOnline: connectivity.isOnline,
    isSlowNetwork: connectivityManager.isSlowNetwork(),
    canSync: connectivity.isOnline && syncState.pending_count > 0,
    hasConflicts: syncState.conflict_count > 0,
    pendingCount: syncState.pending_count,
    conflictCount: syncState.conflict_count,
  };
}
