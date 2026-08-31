import { useEffect, useState } from "react";

const CONTENT_VERSION_KEY = "egs:content:version";
const CONTENT_UPDATED_EVENT = "egs:content:updated";

/**
 * Increment the content version and broadcast update event.
 * Call this after any successful content mutation (settings, site_content, page_layouts).
 */
export function bumpContentVersion(): string {
  if (typeof window === "undefined") return "0";
  const current = parseInt(localStorage.getItem(CONTENT_VERSION_KEY) || "0", 10);
  const next = (current + 1).toString();
  localStorage.setItem(CONTENT_VERSION_KEY, next);
  window.dispatchEvent(new CustomEvent(CONTENT_UPDATED_EVENT, { detail: { version: next } }));
  return next;
}

/**
 * Get current content version without subscribing to updates.
 */
export function getContentVersion(): string {
  if (typeof window === "undefined") return "0";
  return localStorage.getItem(CONTENT_VERSION_KEY) || "0";
}

/**
 * Hook to subscribe to content version changes.
 * Returns current version string that updates when bumpContentVersion() is called.
 */
export function useContentVersion(): string {
  const [version, setVersion] = useState(() => getContentVersion());

  useEffect(() => {
    const handler = (e: CustomEvent) => setVersion(e.detail.version);
    window.addEventListener(CONTENT_UPDATED_EVENT, handler as EventListener);
    return () => window.removeEventListener(CONTENT_UPDATED_EVENT, handler as EventListener);
  }, []);

  return version;
}