import { useServiceWorker } from "../lib/useServiceWorker";
import { WifiOff, RefreshCw } from "lucide-react";

export default function NetworkStatus() {
  const sw = useServiceWorker();

  if (sw.online && !sw.waitingWorker) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!sw.online ? (
        <div className="px-4 py-3 bg-orange-500 text-white rounded-xl shadow-lg flex items-center gap-3 animate-pulse">
          <WifiOff size={20} />
          <div>
            <p className="font-medium text-sm">Hors ligne</p>
            <p className="text-xs text-orange-100">
              Certaines fonctionnalités limitées
            </p>
          </div>
        </div>
      ) : sw.waitingWorker ? (
        <button
          onClick={sw.updateServiceWorker}
          className="px-4 py-3 bg-blue-500 text-white rounded-xl shadow-lg flex items-center gap-3 hover:bg-blue-600 transition-colors"
        >
          <RefreshCw size={20} className="animate-spin" />
          <div className="text-left">
            <p className="font-medium text-sm">Mise à jour disponible</p>
            <p className="text-xs text-blue-100">Cliquez pour actualiser</p>
          </div>
        </button>
      ) : null}
    </div>
  );
}
