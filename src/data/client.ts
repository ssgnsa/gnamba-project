/**
 * DATA LAYER — Client Supabase centralisé
 *
 * RÈGLE ABSOLUE :
 *   ❌ INTERDIT : supabase.from() dans les composants React ou pages
 *   ✅ AUTORISÉ : uniquement dans src/data/*.repository.ts
 *
 * Toutes les requêtes passent par ce client + withRetry.
 */

import { supabase } from '../lib/supabase';

export { supabase as dbClient };

const RETRY_COUNT = 3;
const RETRY_BASE_MS = 400;

function isRetryable(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const status = (error as { status?: number }).status;
  const msg = (error as { message?: string }).message || '';
  return status === 429 || status === 503 || /network|timeout|rate limit/i.test(msg);
}

export async function withRetry<T>(
  fn: () => PromiseLike<{ data: T | null; error: unknown }>,
  retries = RETRY_COUNT,
): Promise<{ data: T | null; error: string | null }> {
  let attempt = 0;
  while (true) {
    try {
      const result = await fn();
      if (!result.error || !isRetryable(result.error) || attempt >= retries) {
        return {
          data: result.data,
          error: result.error
            ? (result.error as { message?: string }).message ?? String(result.error)
            : null,
        };
      }
    } catch (err) {
      if (!isRetryable(err) || attempt >= retries) {
        return {
          data: null,
          error: err instanceof Error ? err.message : 'Erreur inconnue',
        };
      }
    }
    await new Promise((r) => setTimeout(r, RETRY_BASE_MS * 2 ** attempt));
    attempt++;
  }
}
