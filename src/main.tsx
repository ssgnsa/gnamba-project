import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { syncEngineV2 } from "./offline/sync/sync.engine.v2";
import { connectivityManager } from "./offline/network/connectivity";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element #root introuvable");
}

createRoot(root).render(
  <StrictMode>
    <App />
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
