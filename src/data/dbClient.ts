import tableClient from "./tableClient.ts";

export const dbClient = tableClient as any;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const withRetry = async <T>(
  operation: () => Promise<T>,
  retries = 3,
): Promise<T> => {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const result = await operation();
      if (
        result &&
        typeof result === "object" &&
        "error" in result &&
        (result as { error?: unknown }).error
      ) {
        if (attempt === retries) {
          return result;
        }
      } else {
        return result;
      }
    } catch (error) {
      lastError = error;
      if (attempt === retries) {
        throw error;
      }
    }

    if (attempt < retries) {
      await delay(250 * (attempt + 1));
    }
  }

  throw lastError;
};
