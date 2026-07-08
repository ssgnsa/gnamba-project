const LOCAL_FILEBROWSER_BASE_URL = "http://local-filebrowser:8081";
const PUBLIC_FILEBROWSER_BASE_PATH = "/filebrowser";

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

import { isLikelyLoopback } from "./loopback";
const isLoopbackUrl = (value: string) => {
  try {
    // delegate to helper which constructs its own regex
    return isLikelyLoopback(value);
  } catch {
    return false;
  }
};

export const FILEBROWSER_BASE_URL = (() => {
  const configured = import.meta.env.VITE_FILEBROWSER_URL?.trim();

  if (import.meta.env.DEV) {
    return trimTrailingSlash(configured || LOCAL_FILEBROWSER_BASE_URL);
  }

  if (!configured || isLoopbackUrl(configured)) {
    return PUBLIC_FILEBROWSER_BASE_PATH;
  }

  return trimTrailingSlash(configured);
})();

export const FILEBROWSER_API_URL = (() => {
  const configured = import.meta.env.VITE_FILEBROWSER_API_URL?.trim();

  if (import.meta.env.DEV) {
    return trimTrailingSlash(configured || `${LOCAL_FILEBROWSER_BASE_URL}/api`);
  }

  if (!configured || isLoopbackUrl(configured)) {
    return `${PUBLIC_FILEBROWSER_BASE_PATH}/api`;
  }

  return trimTrailingSlash(configured);
})();
