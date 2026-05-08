import { useEffect, useState } from "react";

interface ServiceWorkerState {
  supported: boolean;
  registered: boolean;
  updating: boolean;
  online: boolean;
  waitingWorker: ServiceWorker | null;
}

export function useServiceWorker() {
  const [state, setState] = useState<ServiceWorkerState>({
    supported: false,
    registered: false,
    updating: false,
    online: typeof navigator !== "undefined" ? navigator.onLine : true,
    waitingWorker: null,
  });

  useEffect(() => {
    const clearServiceWorkers = async () => {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(
          registrations.map((registration) => registration.unregister()),
        );
      } catch (error) {
        if (import.meta.env.DEV)
          console.error("[SW] Unregister failed:", error);
      }

      if ("caches" in window) {
        try {
          const keys = await caches.keys();
          await Promise.all(keys.map((key) => caches.delete(key)));
        } catch (error) {
          if (import.meta.env.DEV)
            console.error("[SW] Cache clear failed:", error);
        }
      }
    };

    // Gestion online/offline
    const handleOnline = () => setState((prev) => ({ ...prev, online: true }));
    const handleOffline = () =>
      setState((prev) => ({ ...prev, online: false }));

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if (!("serviceWorker" in navigator)) {
      if (import.meta.env.DEV) console.log("[SW] Service Worker not supported");
      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }

    setState((prev) => ({ ...prev, supported: true }));

    // Désactivé par défaut pour éviter les caches obsolètes et les pages blanches.
    const swEnabled =
      import.meta.env.PROD &&
      import.meta.env.VITE_ENABLE_SERVICE_WORKER === "true";
    if (!swEnabled) {
      clearServiceWorkers();
      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }

    // Enregistrer le Service Worker
    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });

        if (import.meta.env.DEV)
          console.log("[SW] Registered:", registration.scope);
        setState((prev) => ({ ...prev, registered: true }));

        // Vérifier les mises à jour
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          setState((prev) => ({ ...prev, updating: true }));

          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // Nouveau SW installé, attendre l'activation
              setState((prev) => ({
                ...prev,
                updating: false,
                waitingWorker: newWorker,
              }));
              if (import.meta.env.DEV)
                console.log("[SW] Update available - refresh to apply");
            }
          });
        });

        // Gérer les messages du SW
        navigator.serviceWorker.addEventListener("message", (event) => {
          if (event.data.type === "CACHE_UPDATED") {
            if (import.meta.env.DEV)
              console.log("[SW] Cache updated:", event.data.payload);
          }
        });
      } catch (error) {
        if (import.meta.env.DEV)
          console.error("[SW] Registration failed:", error);
      }
    };

    registerSW();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const updateServiceWorker = () => {
    if (state.waitingWorker && "serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.waiting?.postMessage({ type: "SKIP_WAITING" });
        window.location.reload();
      });
    }
  };

  const sendMessage = (message: any) => {
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage(message);
    }
  };

  return {
    ...state,
    updateServiceWorker,
    sendMessage,
  };
}
