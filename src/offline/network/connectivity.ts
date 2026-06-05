/**
 * CONNECTIVITÉ INTELLIGENTE — Ping Supabase + détection réseau fiable
 * Remplace window.navigator.onLine seul (insuffisant pour terrain Afrique).
 */

export interface ConnectivityStatus {
  isOnline: boolean;
  lastChecked: string;
  latency?: number;
  error?: string;
}

class ConnectivityManager {
  private status: ConnectivityStatus = {
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    lastChecked: new Date().toISOString(),
  };

  private pingInterval: NodeJS.Timeout | null = null;
  private listeners: Array<(status: ConnectivityStatus) => void> = [];
  
  // Gestion des retries avec backoff
  private consecutiveFailures = 0;
  private readonly MAX_RETRIES = 5;
  private readonly BASE_DELAY = 30_000; // 30s base
  private isDegradedMode = false;

  /**
   * Démarrer le monitoring de connectivité
   */
  start(): void {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return;
    }

    // Écouter les événements natifs
    window.addEventListener('online', () => {
      this.consecutiveFailures = 0;
      this.isDegradedMode = false;
      this.updateStatus(true, 'browser online');
    });
    window.addEventListener('offline', () => this.updateStatus(false, 'browser offline'));

    // Ping immédiat
    void this.pingSupabase();
    
    // Programme le prochain ping avec backoff
    this.scheduleNextPing();
  }
  
  /**
   * Programme le prochain ping avec backoff exponentiel
   */
  private scheduleNextPing(): void {
    if (this.pingInterval) {
      clearTimeout(this.pingInterval);
    }
    
    // Calcul du délai avec backoff exponentiel
    let delay = this.BASE_DELAY;
    if (this.consecutiveFailures > 0) {
      // Backoff: 30s, 60s, 120s, 240s, 300s (max 5min)
      const backoffMultiplier = Math.min(Math.pow(2, this.consecutiveFailures - 1), 10);
      delay = this.BASE_DELAY * backoffMultiplier;
    }
    
    // En mode dégradé (après MAX_RETRIES), on espace beaucoup plus
    if (this.isDegradedMode) {
      delay = 300_000; // 5 minutes
    }
    
    this.pingInterval = setTimeout(() => {
      void this.pingSupabase().then(() => {
        this.scheduleNextPing();
      });
    }, delay);
  }

  /**
   * Arrêter le monitoring
   */
  stop(): void {
    if (typeof window === 'undefined') {
      return;
    }

    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    window.removeEventListener('online', () => this.updateStatus(true, 'browser online'));
    window.removeEventListener('offline', () => this.updateStatus(false, 'browser offline'));
  }

  /**
   * S'abonner aux changements de connectivité
   */
  subscribe(callback: (status: ConnectivityStatus) => void): () => void {
    this.listeners.push(callback);
    callback(this.status); // Envoyer l'état actuel

    // Retourner fonction de désabonnement
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Obtenir le statut actuel
   */
  getStatus(): ConnectivityStatus {
    return { ...this.status };
  }

  /**
   * Ping Supabase pour vérifier la connectivité réelle
   * Gère les retries et passe en mode dégradé après MAX_RETRIES échecs
   */
  async pingSupabase(): Promise<ConnectivityStatus> {
    if (typeof fetch !== 'function') {
      this.consecutiveFailures++;
      return this.updateStatus(false, 'fetch indisponible');
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_LOCAL_URL;
    
    if (!supabaseUrl) {
      this.consecutiveFailures++;
      return this.updateStatus(false, 'URL Supabase manquante');
    }

    // En mode dégradé, on ne spam plus les logs
    void (this.isDegradedMode ? 'debug' : 'warn'); // logLevel supprimé (TS6133)

    const startTime = Date.now();

    try {
      // Utiliser un endpoint de santé explicite pour éviter les faux 401 sur /rest/v1/
      void await fetch(`${supabaseUrl}/auth/v1/health`, {
        method: 'GET',
        cache: 'no-cache',
        signal: AbortSignal.timeout(8_000), // Timeout 8s (adapté 2G/3G)
      });

      const latency = Date.now() - startTime;
      
      // Reset des compteurs en cas de succès réseau (même si 401)
      this.consecutiveFailures = 0;
      this.isDegradedMode = false;
      
      return this.updateStatus(true, undefined, latency);
    } catch (error) {
      this.consecutiveFailures++;
      
      // Passer en mode dégradé après MAX_RETRIES échecs
      if (this.consecutiveFailures >= this.MAX_RETRIES && !this.isDegradedMode) {
        this.isDegradedMode = true;
        console.warn(`[ConnectivityManager] Passage en mode dégradé après ${this.MAX_RETRIES} échecs. Prochains pings espacés de 5min.`);
      }
      
      let errorMsg = 'Erreur réseau';
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMsg = 'Timeout réseau';
        } else if (error.message.includes('fetch')) {
          errorMsg = 'Réseau inaccessible';
        } else {
          errorMsg = error.message;
        }
      }
      
      // Log moins verbeux en mode dégradé
      if (!this.isDegradedMode) {
        console.warn(`[ConnectivityManager] Échec ping #${this.consecutiveFailures}: ${errorMsg}`);
      }
      
      return this.updateStatus(false, errorMsg);
    }
  }

  /**
   * Forcer une vérification immédiate
   */
  async forceCheck(): Promise<ConnectivityStatus> {
    return this.pingSupabase();
  }

  /**
   * Mettre à jour le statut et notifier les listeners
   */
  private updateStatus(isOnline: boolean, error?: string, latency?: number): ConnectivityStatus {
    this.status = {
      isOnline,
      lastChecked: new Date().toISOString(),
      error,
      latency,
    };

    // Notifier tous les listeners
    this.listeners.forEach((callback) => {
      try {
        callback(this.status);
      } catch (err) {
        console.error('[ConnectivityManager] Listener error:', err);
      }
    });

    return this.status;
  }

  /**
   * Déterminer si le réseau est adapté pour des opérations lourdes
   */
  isGoodForHeavyOps(): boolean {
    return this.status.isOnline && (this.status.latency ?? 9999) < 3000; // < 3s
  }

  /**
   * Déterminer si on est en réseau lent (2G/edge)
   */
  isSlowNetwork(): boolean {
    return this.status.isOnline && (this.status.latency ?? 0) > 1500; // > 1.5s
  }

  /**
   * Déterminer si on est en mode dégradé (trop d'échecs consécutifs)
   */
  isInDegradedMode(): boolean {
    return this.isDegradedMode;
  }

  /**
   * Obtenir le nombre d'échecs consécutifs
   */
  getConsecutiveFailures(): number {
    return this.consecutiveFailures;
  }

  /**
   * Obtenir une description lisible du statut
   */
  getStatusDescription(): string {
    if (this.isDegradedMode) {
      return `Mode dégradé - Connectivité instable (${this.consecutiveFailures} échecs)`;
    }
    
    if (!this.status.isOnline) {
      return this.status.error ? `Hors ligne (${this.status.error})` : 'Hors ligne';
    }

    if (!this.status.latency) {
      return 'En ligne';
    }

    if (this.status.latency < 500) return 'En ligne (excellent)';
    if (this.status.latency < 1500) return 'En ligne (bon)';
    if (this.status.latency < 3000) return 'En ligne (lent)';
    return 'En ligne (très lent)';
  }

  /**
   * Adapter les paramètres selon la qualité réseau
   */
  getNetworkParams(): {
    batchSize: number;
    timeout: number;
    retryDelay: number;
  } {
    if (!this.status.isOnline) {
      return { batchSize: 0, timeout: 0, retryDelay: 60_000 }; // Mode offline
    }

    const latency = this.status.latency ?? 1000;

    if (latency < 500) {
      // 4G/5G
      return { batchSize: 20, timeout: 10_000, retryDelay: 2_000 };
    } else if (latency < 1500) {
      // 3G
      return { batchSize: 10, timeout: 15_000, retryDelay: 5_000 };
    } else {
      // 2G/Edge
      return { batchSize: 5, timeout: 30_000, retryDelay: 15_000 };
    }
  }
}

export const connectivityManager = new ConnectivityManager();
