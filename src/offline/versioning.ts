/**
 * OFFLINE VERSIONING — Row version + timestamps
 * Obligatoire pour éviter corruption silencieuse.
 */

export type VersionedEntity = {
  id: string;
  row_version: number;
  updated_at: string;
  updated_by: string | null;
};

export type WithVersioning<T> = T & {
  row_version: number;
  updated_at: string;
  updated_by: string | null;
};

/**
 * Ajoute le versioning à une entité avant sauvegarde
 */
export function addVersioning<T extends Record<string, unknown>>(
  entity: T,
  currentVersion = 0,
  userId: string | null = null,
): WithVersioning<T> {
  return {
    ...entity,
    row_version: currentVersion + 1,
    updated_at: new Date().toISOString(),
    updated_by: userId,
  };
}

/**
 * Vérifie si une entité est plus récente qu'une autre
 */
export function isNewer(a: VersionedEntity, b: VersionedEntity): boolean {
  const timeA = new Date(a.updated_at).getTime();
  const timeB = new Date(b.updated_at).getTime();
  if (timeA !== timeB) return timeA > timeB;
  // Même timestamp : utiliser row_version comme départsge
  return a.row_version > b.row_version;
}

/**
 * Détecte un conflit de version entre local et serveur
 */
export function hasVersionConflict(local: VersionedEntity, server: VersionedEntity): boolean {
  return local.row_version !== server.row_version && !isNewer(local, server);
}

/**
 * Prépare le payload pour une mise à jour optimiste (optimistic update)
 */
export function prepareOptimisticUpdate<T extends Record<string, unknown>>(
  current: WithVersioning<T>,
  updates: Partial<T>,
  userId: string | null = null,
): WithVersioning<T> {
  return {
    ...current,
    ...updates,
    row_version: current.row_version + 1,
    updated_at: new Date().toISOString(),
    updated_by: userId,
  };
}

/**
 * Génère une condition WHERE pour les mises à jour Supabase (évite écrasement concurrent)
 */
export function versionedWhereClause(version: number): string {
  return `row_version = ${version}`;
}

/**
 * Wrapper pour les requêtes Supabase avec versioning
 */
export interface VersionedUpdateResult<T> {
  data: T | null;
  error: string | null;
  versionConflict: boolean;
  needsRetry: boolean;
}

/**
 * Utilitaire pour extraire les champs de versioning d'une réponse Supabase
 */
export function extractVersioning<T>(record: T): VersionedEntity {
  const r = record as any;
  return {
    id: r.id,
    row_version: r.row_version ?? 0,
    updated_at: r.updated_at ?? new Date().toISOString(),
    updated_by: r.updated_by ?? null,
  };
}
