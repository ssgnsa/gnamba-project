/**
 * SYNC ENGINE V2 — Retry exponentiel + batch + adapté terrain Afrique
 * Gère la synchronisation offline → online de manière résiliente.
 */

import { offlineDB, type OfflineTransaction, type SyncState } from '../db/indexeddb';
import { foncierRepository } from '../../data/foncier.repository';
import { leadsRepository } from '../../data/leads.repository';
import { usersRepository } from '../../data/users.repository';
import { isRowVersionConflict, resolveConflict } from '../conflict.resolver';

const BATCH_SIZE = 10;
const MAX_RETRY_COUNT = 8;
const RETRY_DELAYS_MS = [1_000, 5_000, 15_000, 60_000, 300_000, 900_000, 1_800_000, 3_600_000]; // 1s → 1h

const resolveSupabaseHealthConfig = (): { url?: string; anonKey?: string } => {
  const mode = String(import.meta.env.VITE_SUPABASE_MODE || '').toLowerCase();
  const cloudUrl = import.meta.env.VITE_SUPABASE_URL;
  const localUrl = import.meta.env.VITE_SUPABASE_LOCAL_URL;
  const cloudAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const localAnonKey = import.meta.env.VITE_SUPABASE_LOCAL_ANON_KEY;

  if (mode === 'local') return { url: localUrl, anonKey: localAnonKey };
  if (mode === 'cloud') return { url: cloudUrl, anonKey: cloudAnonKey };

  return cloudUrl
    ? { url: cloudUrl, anonKey: cloudAnonKey }
    : { url: localUrl, anonKey: localAnonKey };
};

class SyncEngineV2 {
  private isRunning = false;
  private abortController: AbortController | null = null;
  private connectivityCheckTimeout: NodeJS.Timeout | null = null;
  private consecutiveConnectivityFailures = 0;
  private readonly MAX_CONNECTIVITY_RETRIES = 5;
  private readonly BASE_CHECK_DELAY = 30_000;
  private readonly handleOnline = () => {
    this.consecutiveConnectivityFailures = 0;
    void this.trySync();
  };
  private readonly handleOffline = () => {
    this.updateOnlineStatus(false);
  };

  /**
   * Démarrer le sync engine (appelé au démarrage app)
   */
  async start(): Promise<void> {
    if (this.isRunning) return;
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return;
    }
    this.isRunning = true;
    this.abortController = new AbortController();

    // Init IndexedDB
    await offlineDB.init();

    // Écouter les changements de connectivité
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);

    // Ping périodique Supabase avec backoff
    this.scheduleConnectivityCheck();

    // Sync initial si online
    if (navigator.onLine) {
      setTimeout(() => void this.trySync(), 2_000);
    }
  }
  
  /**
   * Programmer le prochain check de connectivité avec backoff
   */
  private scheduleConnectivityCheck(): void {
    if (!this.isRunning) {
      return;
    }

    if (this.connectivityCheckTimeout) {
      clearTimeout(this.connectivityCheckTimeout);
    }
    
    // Backoff exponentiel: 30s, 60s, 120s, 240s, 300s (max)
    const delayMultiplier = Math.min(Math.pow(2, this.consecutiveConnectivityFailures), 10);
    const delay = this.BASE_CHECK_DELAY * (this.consecutiveConnectivityFailures === 0 ? 1 : delayMultiplier);
    
    this.connectivityCheckTimeout = setTimeout(() => {
      if (!this.isRunning) {
        return;
      }

      void this.checkConnectivity().then(() => {
        if (this.isRunning) {
          this.scheduleConnectivityCheck();
        }
      });
    }, delay);
  }

  /**
   * Arrêter proprement
   */
  stop(): void {
    this.isRunning = false;
    this.abortController?.abort();
    if (this.connectivityCheckTimeout) {
      clearTimeout(this.connectivityCheckTimeout);
      this.connectivityCheckTimeout = null;
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
    }
  }

  /**
   * Tenter une synchronisation (appelé par events)
   */
  async trySync(): Promise<void> {
    if (!this.isRunning || typeof navigator === 'undefined' || !navigator.onLine) return;

    const state = await offlineDB.getSyncState();
    if (state.pending_count === 0) return;

    console.log(`[SyncEngineV2] Sync de ${state.pending_count} transaction(s)…`);

    try {
      await this.syncBatch();
      await this.updateSyncState();
    } catch (err) {
      console.error('[SyncEngineV2] Erreur sync:', err);
    }
  }

  /**
   * Synchroniser un batch de transactions
   */
  private async syncBatch(): Promise<void> {
    const pending = await offlineDB.getPendingTransactions(BATCH_SIZE);
    if (pending.length === 0) return;

    // Trier par priorité
    pending.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    for (const tx of pending) {
      if (this.abortController?.signal.aborted) break;

      await this.processTransaction(tx);
    }
  }

  /**
   * Traiter une transaction individuelle
   */
  private async processTransaction(tx: OfflineTransaction): Promise<void> {
    // Marquer comme syncing
    await offlineDB.updateTransaction(tx.id, {
      status: 'syncing',
      last_attempt: new Date().toISOString(),
    });

    try {
      const result = await this.executeTransaction(tx);

      if (result.success) {
        await offlineDB.updateTransaction(tx.id, { status: 'synced' });
        await offlineDB.deleteTransaction(tx.id); // Nettoyer
        console.log(`[SyncEngineV2] ✅ ${tx.type} ${tx.entity_id}`);
      } else {
        // Échec avec retry
        const retryCount = tx.retry_count + 1;
        const delay = RETRY_DELAYS_MS[Math.min(retryCount - 1, RETRY_DELAYS_MS.length - 1)];

        await offlineDB.updateTransaction(tx.id, {
          status: retryCount >= MAX_RETRY_COUNT ? 'failed' : 'pending',
          retry_count: retryCount,
          last_error: result.error,
        });

        if (retryCount < MAX_RETRY_COUNT) {
          console.warn(`[SyncEngineV2] ⏳ Retry ${retryCount}/${MAX_RETRY_COUNT} in ${delay}ms`);
          setTimeout(() => void this.trySync(), delay);
        } else {
          console.error(`[SyncEngineV2] ❌ Abandon ${tx.type} ${tx.entity_id}: ${result.error}`);
        }
      }
    } catch (err) {
      console.error(`[SyncEngineV2] Exception processing ${tx.id}:`, err);
      await offlineDB.updateTransaction(tx.id, {
        status: 'failed',
        retry_count: tx.retry_count + 1,
        last_error: err instanceof Error ? err.message : 'Exception',
      });
    }
  }

  /**
   * Exécuter la transaction selon son type
   */
  private async executeTransaction(tx: OfflineTransaction): Promise<{ success: boolean; error?: string }> {
    switch (tx.entity_type) {
      case 'foncier_lot':
        return this.executeFoncierTransaction(tx);
      case 'lead':
        return this.executeLeadTransaction(tx);
      case 'user_profile':
        return this.executeUserTransaction(tx);
      default:
        return { success: false, error: `Type inconnu: ${tx.entity_type}` };
    }
  }

  /**
   * Transaction Foncier
   */
  private async executeFoncierTransaction(tx: OfflineTransaction): Promise<{ success: boolean; error?: string }> {
    const payload = tx.payload as any;

    if (tx.type === 'CREATE') {
      const result = await foncierRepository.saveLot(payload, false);
      return { success: !result.error, error: result.error || undefined };
    }

    if (tx.type === 'UPDATE') {
      const result = await foncierRepository.saveLot(payload, true);
      
      // Détecter conflit de version
      if (result.error && isRowVersionConflict(result.error)) {
        await this.handleVersionConflict(tx, payload);
        return { success: false, error: 'Conflit de version détecté' };
      }

      return { success: !result.error, error: result.error || undefined };
    }

    if (tx.type === 'DELETE') {
      const result = await foncierRepository.softDeleteLot(payload.id, payload.reason || 'sync_delete');
      return { success: !result.error, error: result.error || undefined };
    }

    return { success: false, error: `Opération inconnue: ${tx.type}` };
  }

  /**
   * Transaction Lead
   */
  private async executeLeadTransaction(tx: OfflineTransaction): Promise<{ success: boolean; error?: string }> {
    const payload = tx.payload as any;

    if (tx.type === 'CREATE') {
      const result = await leadsRepository.create(payload);
      return { success: !result.error, error: result.error || undefined };
    }

    if (tx.type === 'UPDATE') {
      const { id, ...updates } = payload;
      const result = await leadsRepository.update(id, updates);
      return { success: !result.error, error: result.error || undefined };
    }

    return { success: false, error: `Opération inconnue: ${tx.type}` };
  }

  /**
   * Transaction User
   */
  private async executeUserTransaction(tx: OfflineTransaction): Promise<{ success: boolean; error?: string }> {
    const payload = tx.payload as any;

    if (tx.type === 'UPDATE') {
      const { id, ...updates } = payload;
      const result = await usersRepository.update(id, updates);
      return { success: !result.error, error: result.error || undefined };
    }

    return { success: false, error: `Opération inconnue: ${tx.type}` };
  }

  /**
   * Gérer un conflit de version
   */
  private async handleVersionConflict(tx: OfflineTransaction, localPayload: any): Promise<void> {
    // Récupérer la version serveur
    let serverData = null;
    try {
      if (tx.entity_type === 'foncier_lot') {
        const result = await foncierRepository.getLotById(tx.entity_id);
        serverData = result.data;
      } else if (tx.entity_type === 'lead') {
        const result = await leadsRepository.getById(tx.entity_id);
        serverData = result.data;
      }
    } catch {
      // Ignorer les erreurs de récupération serveur
    }

    if (serverData) {
      const conflict = resolveConflict(localPayload, serverData);
      await offlineDB.addConflict({
        transaction_id: tx.id,
        entity_type: tx.entity_type,
        entity_id: tx.entity_id,
        local_version: localPayload.row_version || 0,
        server_version: (serverData as Record<string, unknown>).row_version as number || 0,
        conflict_type: conflict.resolution === 'escalate' ? 'hard' : 'field',
        local_data: localPayload,
        server_data: serverData,
        resolved: false,
      });
    }
  }

  /**
   * Mettre à jour l'état de synchronisation
   */
  private async updateSyncState(): Promise<void> {
    const pending = await offlineDB.getPendingTransactions();
    const conflicts = await offlineDB.getUnresolvedConflicts();

    await offlineDB.updateSyncState({
      last_sync_at: new Date().toISOString(),
      pending_count: pending.length,
      conflict_count: conflicts.length,
      is_online: navigator.onLine,
    });
  }

  /**
   * Vérifier la connectivité réelle (ping Supabase)
   * Gère les retries et limite le spam de logs
   */
  private async checkConnectivity(): Promise<void> {
    try {
      const { url: supabaseUrl, anonKey: supabaseAnonKey } = resolveSupabaseHealthConfig();
      if (!supabaseUrl || !supabaseAnonKey) {
        this.consecutiveConnectivityFailures++;
        this.updateOnlineStatus(false);
        return;
      }

      const response = await fetch(`${supabaseUrl}/auth/v1/health`, {
        method: 'GET',
        cache: 'no-cache',
        headers: {
          apikey: supabaseAnonKey,
        },
        signal: AbortSignal.timeout(5_000),
      });

      if (!response.ok) {
        throw new Error(`Supabase health HTTP ${response.status}`);
      }

      // Reset des échecs en cas de succès
      if (this.consecutiveConnectivityFailures > 0) {
        this.consecutiveConnectivityFailures = 0;
        console.log('[SyncEngineV2] Connectivité restaurée');
      }
      this.updateOnlineStatus(true);
    } catch {
      this.consecutiveConnectivityFailures++;
      
      // En production, ne signaler que les échecs répétés pour éviter le bruit réseau isolé.
      if (import.meta.env.DEV && this.consecutiveConnectivityFailures === 1) {
        console.warn(`[SyncEngineV2] Échec connectivité #${this.consecutiveConnectivityFailures}`);
      } else if (this.consecutiveConnectivityFailures >= 2 && this.consecutiveConnectivityFailures <= 3) {
        console.warn(`[SyncEngineV2] Échec connectivité #${this.consecutiveConnectivityFailures}`);
      } else if (this.consecutiveConnectivityFailures === this.MAX_CONNECTIVITY_RETRIES) {
        console.warn(`[SyncEngineV2] Mode dégradé - Trop d'échecs consécutifs, prochains checks espacés`);
      }
      
      this.updateOnlineStatus(false);
    }
  }

  /**
   * Mettre à jour le statut online
   */
  private updateOnlineStatus(isOnline: boolean): void {
    offlineDB.updateSyncState({ is_online: isOnline }).catch(() => {
      // Ignorer les erreurs de mise à jour
    });
  }

  /**
   * Forcer une synchronisation manuelle
   */
  async forceSync(): Promise<{ synced: number; errors: number }> {
    if (typeof navigator === 'undefined' || !navigator.onLine) {
      throw new Error('Hors connexion');
    }

    const before = await offlineDB.getPendingTransactions();
    await this.trySync();
    const after = await offlineDB.getPendingTransactions();

    return {
      synced: before.length - after.length,
      errors: after.filter((tx) => tx.status === 'failed').length,
    };
  }

  /**
   * Obtenir l'état actuel du sync
   */
  async getState(): Promise<SyncState> {
    await this.updateSyncState();
    return offlineDB.getSyncState();
  }
}

export const syncEngineV2 = new SyncEngineV2();
