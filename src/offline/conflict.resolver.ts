/**
 * OFFLINE LAYER — Conflict Resolver
 * Stratégie : "latest write wins" basé sur updated_at/row_version côté serveur.
 * En cas de conflit FK ou row_version mismatch → escalade vers l'utilisateur.
 */

export interface VersionedRecord {
  id: string;
  updated_at?: string | null;
  row_version?: number | null;
}

export type ConflictResolution = 'use_server' | 'use_local' | 'merge' | 'escalate';

export interface ConflictResult<T extends VersionedRecord> {
  resolution: ConflictResolution;
  winner: T;
  reason: string;
}

/**
 * Résoudre un conflit entre version locale et version serveur.
 * Par défaut : le serveur gagne si son timestamp est plus récent.
 * Escalade si versions identiques mais données différentes (édition concurrente).
 */
export function resolveConflict<T extends VersionedRecord>(
  local: T,
  server: T,
): ConflictResult<T> {
  if (!local.updated_at && !server.updated_at) {
    return {
      resolution: 'use_server',
      winner: server,
      reason: 'Aucun timestamp disponible — serveur prioritaire',
    };
  }

  const localTs = local.updated_at ? new Date(local.updated_at).getTime() : 0;
  const serverTs = server.updated_at ? new Date(server.updated_at).getTime() : 0;

  if (serverTs > localTs) {
    return {
      resolution: 'use_server',
      winner: server,
      reason: `Serveur plus récent (${server.updated_at})`,
    };
  }

  if (localTs > serverTs) {
    return {
      resolution: 'use_local',
      winner: local,
      reason: `Local plus récent (${local.updated_at})`,
    };
  }

  if (
    local.row_version !== undefined &&
    server.row_version !== undefined &&
    local.row_version !== server.row_version
  ) {
    return {
      resolution: 'escalate',
      winner: server,
      reason: `Conflit row_version (local: ${local.row_version}, serveur: ${server.row_version}) — intervention manuelle requise`,
    };
  }

  return {
    resolution: 'use_server',
    winner: server,
    reason: 'Timestamps identiques — serveur prioritaire par défaut',
  };
}

/**
 * Vérifier si une erreur de sauvegarde est un conflit row_version
 */
export function isRowVersionConflict(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const msg = (error as { message?: string }).message || '';
  return msg.includes('row_version') || (error as { code?: string }).code === '23P01';
}
