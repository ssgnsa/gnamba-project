const LOCAL_FILEBROWSER_BASE_URL = "http://localhost:8081";
const PUBLIC_FILEBROWSER_BASE_PATH = "/filebrowser";

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const isLoopbackUrl = (value: string) =>
  /^https?:\/\/(?:localhost|127(?:\.\d{1,3}){3}|\[::1\])(?::|\/|$)/i.test(
    value,
  );

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
