/**
 * FilebrowserIframe - Intégration Filebrowser via iframe
 * 
 * Architecture: Filebrowser comme composant technique, pas système maître
 * - Authentification déléguée à EGS (Supabase Auth)
 * - Filebrowser accessible uniquement si utilisateur EGS authentifié
 * - Pas de double authentification
 */

import { useEffect, useState, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { Lock, Loader2, ExternalLink, AlertCircle } from "lucide-react";
import { FILEBROWSER_BASE_URL } from "../../lib/filebrowserConfig";

interface FilebrowserIframeProps {
  initialPath?: string;
  height?: string;
}

export default function FilebrowserIframe({ 
  initialPath = "/",
  height = "calc(100vh - 200px)"
}: FilebrowserIframeProps) {
  const { user, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Générer l'URL Filebrowser avec le chemin initial
  const filebrowserUrl = `${FILEBROWSER_BASE_URL}/files${initialPath}`;

  useEffect(() => {
    // Vérifier que Filebrowser est accessible
    const checkFilebrowserHealth = async () => {
      try {
        void await fetch(`${FILEBROWSER_BASE_URL}/health`, {
          method: "HEAD",
          mode: "no-cors", // Permet la vérification sans CORS
        });
        // Si on arrive ici, Filebrowser répond
      } catch {
        // En cas d'erreur, on continue quand même - l'iframe gérera l'affichage
        console.warn("[Filebrowser] Service peut être indisponible");
      }
    };

    if (user) {
      checkFilebrowserHealth();
    }
  }, [user]);

  // Gestion du chargement de l'iframe
  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setError("Impossible de charger Filebrowser. Vérifiez que le service est démarré.");
  };

  // Si authentification en cours
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-xl border border-gray-200">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Vérification de l'authentification...</span>
        </div>
      </div>
    );
  }

  // Si utilisateur non authentifié
  if (!user) {
    return (
      <div className="flex items-center justify-center h-96 bg-amber-50 rounded-xl border border-amber-200">
        <div className="text-center p-6">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-amber-600" />
          </div>
          <h3 className="text-lg font-semibold text-amber-900 mb-2">
            Accès Restreint
          </h3>
          <p className="text-amber-700 max-w-sm mb-4">
            Vous devez être connecté avec un compte EGS pour accéder au gestionnaire de fichiers.
          </p>
          <p className="text-sm text-amber-600">
            Contactez votre administrateur si vous pensez que c'est une erreur.
          </p>
        </div>
      </div>
    );
  }

  // Si erreur de chargement
  if (error) {
    return (
      <div className="flex items-center justify-center h-96 bg-red-50 rounded-xl border border-red-200">
        <div className="text-center p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-red-900 mb-2">
            Service Indisponible
          </h3>
          <p className="text-red-700 max-w-sm mb-4">{error}</p>
          <a
            href={filebrowserUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Ouvrir dans un nouvel onglet
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* En-tête */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Gestionnaire de Fichiers</span>
          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
            {user.email}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={filebrowserUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <ExternalLink className="w-3 h-3" />
            Plein écran
          </a>
        </div>
      </div>

      {/* Iframe Filebrowser */}
      <div className="relative" style={{ height }}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
            <div className="flex items-center gap-3 text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Chargement de Filebrowser...</span>
            </div>
          </div>
        )}
        
        <iframe
          ref={iframeRef}
          src={filebrowserUrl}
          className="w-full h-full border-0"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          title="Gestionnaire de Fichiers"
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-downloads"
          allow="fullscreen"
        />
      </div>

      {/* Footer info */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 flex items-center justify-between">
        <span>Accès contrôlé par EGS</span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          Connecté
        </span>
      </div>
    </div>
  );
}
