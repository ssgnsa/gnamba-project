// ============================================
// Sentry — Minimal Error Monitoring for EGS
// ============================================
// Purpose: Capture and report frontend errors in production.
// Free tier: 5,000 errors/month — sufficient for EGS.
//
// Setup:
//   1. Create a Sentry project at https://sentry.io
//   2. Get the DSN from Settings > Client Keys (DSN)
//   3. Add VITE_SENTRY_DSN to your .env file
//
// Without VITE_SENTRY_DSN set, this module is a no-op (graceful degradation).
// ============================================

type SentryEvent = {
  module: string;
  error: string;
  stack?: string;
  componentStack?: string;
  url: string;
  timestamp: string;
  userRole?: string;
  severity: "error" | "warning" | "fatal";
  tags?: Record<string, any>;
};

let sentryEnabled = false;
let sentryDsn = "";

// Lazy init — only when first error occurs
const initSentry = () => {
  if (sentryDsn) return; // Already initialized

  sentryDsn = import.meta.env.VITE_SENTRY_DSN || "";
  sentryEnabled = !!sentryDsn && import.meta.env.PROD;

  if (sentryEnabled) {
    if (import.meta.env.DEV) console.info("[Sentry] Error monitoring enabled");
  }
};

// Send error to Sentry via HTTP (no SDK needed — lightweight)
const sendToSentry = async (event: SentryEvent) => {
  if (!sentryEnabled) return;

  try {
    // Sentry envelope protocol (no SDK required)
    const envelope = {
      event_id: crypto.randomUUID(),
      sent_at: new Date().toISOString(),
      sdk: { name: "egs-minimal", version: "1.0.0" },
    };

    const itemHeader = {
      type: "event",
      content_type: "application/json",
    };

    const payload = {
      ...event,
      environment: import.meta.env.MODE,
      release: import.meta.env.VITE_APP_VERSION || "unknown",
      tags: {
        module: event.module,
        severity: event.severity,
        supabase_mode: import.meta.env.VITE_SUPABASE_MODE || "unknown",
      },
      contexts: {
        react: {
          component_stack: event.componentStack,
        },
      },
      exception: {
        values: [
          {
            type: "Error",
            value: event.error,
            stacktrace: { frames: [{ filename: event.url }] },
          },
        ],
      },
    };

    // Use beacon API for non-blocking send (better than fetch for error reporting)
    if ("sendBeacon" in navigator) {
      const envelopeStr = JSON.stringify([envelope, itemHeader, payload]);
      navigator.sendBeacon(
        `https://o0.ingest.sentry.io/api/0/envelope/?sentry_key=${sentryDsn.split("//")[1].split("@")[0]}`,
        new Blob([envelopeStr], { type: "application/json" }),
      );
    } else {
      // Fallback to fetch
      const response = await fetch(
        `https://o0.ingest.sentry.io/api/0/envelope/?sentry_key=${sentryDsn.split("//")[1].split("@")[0]}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify([envelope, itemHeader, payload]),
          keepalive: true,
        },
      );

      if (!response.ok) {
        if (import.meta.env.DEV)
          console.warn("[Sentry] Failed to send error event:", response.status);
      }
    }
  } catch (err) {
    // Never let error reporting break the app
    if (import.meta.env.DEV) console.warn("[Sentry] sendBeacon failed:", err);
  }
};

// Capture a React Error Boundary error
export const captureErrorBoundary = (
  moduleName: string,
  error: Error,
  componentStack?: string,
) => {
  initSentry();

  const event: SentryEvent = {
    module: moduleName,
    error: error.message,
    stack: error.stack,
    componentStack,
    url: window.location.href,
    timestamp: new Date().toISOString(),
    severity: "fatal",
  };

  sendToSentry(event);
};

// Capture a Supabase error
export const captureSupabaseError = (
  operation: string,
  table: string,
  error: { message?: string; code?: string; details?: string } | null,
) => {
  initSentry();

  const event: SentryEvent = {
    module: `Supabase/${operation}`,
    error: error?.message || "Unknown Supabase error",
    url: window.location.href,
    timestamp: new Date().toISOString(),
    severity: "error",
  };

  // Tag with RLS-specific info if available
  if (error?.code === "42501") {
    event.tags = { rls_failed: true, table };
    event.severity = "warning";
  }

  sendToSentry(event);
};

// Capture a generic error
export const captureError = (
  moduleName: string,
  error: Error | string,
  _context?: Record<string, unknown>,
) => {
  initSentry();

  const errorMessage = error instanceof Error ? error.message : error;
  const stack = error instanceof Error ? error.stack : undefined;

  const event: SentryEvent = {
    module: moduleName,
    error: errorMessage,
    stack,
    url: window.location.href,
    timestamp: new Date().toISOString(),
    severity: "error",
  };

  sendToSentry(event);
};

// Set user context (called after auth login)
export const setSentryUser = (userId: string, role?: string) => {
  // With the beacon API, user context is sent with the next error event
  // For now, we store it in sessionStorage for inclusion in events
  if (typeof window !== "undefined") {
    sessionStorage.setItem("sentry:user_id", userId);
    if (role) sessionStorage.setItem("sentry:user_role", role);
  }
};

// Clear user context (called on logout)
export const clearSentryUser = () => {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem("sentry:user_id");
    sessionStorage.removeItem("sentry:user_role");
  }
};
