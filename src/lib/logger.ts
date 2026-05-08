/**
 * Minimal logger for local development without leaking warnings/errors in production.
 */

const isDev = import.meta.env.DEV;

export const logger = {
  debug: (message: string, ...args: unknown[]) => {
    if (isDev) {
      console.debug(`[EGS] ${message}`, ...args);
    }
  },

  info: (message: string, ...args: unknown[]) => {
    if (isDev) {
      console.info(`[EGS] ${message}`, ...args);
    }
  },

  warn: (message: string, ...args: unknown[]) => {
    if (isDev) {
      console.debug(`[EGS] ${message}`, ...args);
    }
  },

  error: (
    message: string,
    error?: Error | unknown,
    context?: Record<string, unknown>,
  ) => {
    if (isDev) {
      console.debug(`[EGS] ${message}`, error, context);
    }
  },
};
