import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { syncEngineV2 } from "./offline/sync/sync.engine.v2";
import { connectivityManager } from "./offline/network/connectivity";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element #root introuvable");
}

// Créer le QueryClient avec des options par défaut
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: 1,
    },
    mutations: {
      retry: false,
    },
  }
});

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);

// Démarrer le système de connectivité uniquement si une API réseau explicite est disponible.
window.setTimeout(() => {
  try {
    void syncEngineV2.start().catch((error) => {
      console.error("[bootstrap] syncEngineV2.start failed:", error);
    });
    connectivityManager.start();
  } catch (error) {
    console.error("[bootstrap] Offline bootstrap failed:", error);
  }
}, 0);
