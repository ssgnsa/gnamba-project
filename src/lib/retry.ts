/**
 * Retry helpers for transient API and RPC failures.
 */

const isRateLimitError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") return false;
  const status = (error as { status?: number }).status;
  const message = (error as { message?: string }).message || "";
  return status === 429 || /rate limit|too many requests/i.test(message);
};

const withBackoff = async (
  fn: () => PromiseLike<any>,
  retries = 3,
  baseMs = 500,
): Promise<any> => {
  let attempt = 0;
  while (true) {
    try {
      const result = await fn();
      const resultWithError = result as { error?: unknown } | null | undefined;
      if (
        !resultWithError?.error ||
        !isRateLimitError(resultWithError.error) ||
        attempt >= retries
      ) {
        return result;
      }
    } catch (error) {
      if (!isRateLimitError(error) || attempt >= retries) {
        throw error;
      }
    }

    await new Promise((resolve) => setTimeout(resolve, baseMs * 2 ** attempt));
    attempt += 1;
  }
};

export { withBackoff, isRateLimitError };
