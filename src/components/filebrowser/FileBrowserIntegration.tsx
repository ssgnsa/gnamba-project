import { useState, useEffect } from "react";
import {
  Folder,
  File,
  Upload,
  Download,
  Trash2,
  RefreshCw,
  LogOut,
  ChevronRight,
  Home,
} from "lucide-react";
import { FileBrowserService, FileBrowserFile } from "../../lib/filebrowser";

interface FileBrowserIntegrationProps {
  onFileSelect?: (file: FileBrowserFile) => void;
  initialPath?: string;
}

export default function FileBrowserIntegration({
  onFileSelect,
  initialPath = "/",
}: FileBrowserIntegrationProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState(initialPath);
  const [files, setFiles] = useState<FileBrowserFile[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadFiles(currentPath);
    }
  }, [currentPath, isAuthenticated]);

  const checkAuth = async () => {
    const token = await FileBrowserService.getToken();
    setIsAuthenticated(!!token);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await FileBrowserService.login(username, password);
      setIsAuthenticated(true);
    } catch {
      setError("Échec de la connexion. Vérifiez vos identifiants.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    FileBrowserService.logout();
    setIsAuthenticated(false);
  };

  const loadFiles = async (path: string) => {
    setLoading(true);
    try {
      const fileList = await FileBrowserService.getFiles(path);
      setFiles(fileList);
    } catch {
      setError("Impossible de charger les fichiers.");
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
  };

  const handleFileClick = (file: FileBrowserFile) => {
    if (file.isDir) {
      handleNavigate(file.path);
    } else {
      onFileSelect?.(file);
    }
  };

  const handleDownload = async (file: FileBrowserFile) => {
    try {
      const blob = await FileBrowserService.downloadFile(file.path);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      alert("Erreur lors du téléchargement");
    }
  };

  const handleDelete = async (file: FileBrowserFile) => {
    if (!confirm(`Supprimer ${file.name} ?`)) return;

    try {
      await FileBrowserService.deleteFile(file.path);
      loadFiles(currentPath);
    } catch {
      alert("Erreur lors de la suppression");
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      await FileBrowserService.uploadFile(currentPath, file);
      loadFiles(currentPath);
    } catch {
      alert("Erreur lors de l'upload");
    } finally {
      setUploading(false);
    }
  };

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Formulaire de connexion
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Folder size={32} className="text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">
            Partage de Fichiers
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Connectez-vous pour accéder aux fichiers
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Identifiant
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="admin"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <div className="mt-4 text-center text-xs text-gray-500">
          <p>FileBrowser est hébergé localement</p>
          <p className="mt-1">
            Vos identifiants sont stockés de manière sécurisée
          </p>
        </div>
      </div>
    );
  }

  // Interface de navigation des fichiers
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* En-tête */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <Folder size={18} className="text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Fichiers</h3>
            <p className="text-xs text-gray-500">{currentPath}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadFiles(currentPath)}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Rafraîchir"
          >
            <RefreshCw
              size={18}
              className={`text-gray-600 ${loading ? "animate-spin" : ""}`}
            />
          </button>
          <label
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            title="Uploader"
          >
            <Upload size={18} className="text-gray-600" />
            <input
              type="file"
              onChange={handleUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
          <button
            onClick={handleLogout}
            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
            title="Se déconnecter"
          >
            <LogOut size={18} className="text-red-600" />
          </button>
        </div>
      </div>

      {/* Fil d'ariane */}
      <div className="p-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2 text-sm">
        <button
          onClick={() => handleNavigate("/")}
          className="flex items-center gap-1 text-gray-600 hover:text-blue-600 transition-colors"
        >
          <Home size={16} />
          <span>Accueil</span>
        </button>
        {currentPath !== "/" && (
          <>
            <ChevronRight size={16} className="text-gray-400" />
            <span className="text-gray-900 font-medium">
              {currentPath.split("/").pop()}
            </span>
          </>
        )}
      </div>

      {/* Liste des fichiers */}
      <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
        {loading && files.length === 0 ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
            <p className="text-sm text-gray-500 mt-2">Chargement...</p>
          </div>
        ) : files.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Folder size={48} className="mx-auto mb-2 opacity-20" />
            <p>Ce dossier est vide</p>
          </div>
        ) : (
          files.map((file) => (
            <div
              key={file.path}
              className="p-3 hover:bg-gray-50 transition-colors flex items-center gap-3 group"
            >
              <button
                onClick={() => handleFileClick(file)}
                className="flex items-center gap-3 flex-1 text-left"
              >
                {file.isDir ? (
                  <Folder size={20} className="text-blue-500 flex-shrink-0" />
                ) : (
                  <File size={20} className="text-gray-400 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(file.modified)} •{" "}
                    {file.isDir ? "Dossier" : formatSize(file.size)}
                  </p>
                </div>
              </button>

              {!file.isDir && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleDownload(file)}
                    className="p-1.5 hover:bg-blue-50 rounded transition-colors"
                    title="Télécharger"
                  >
                    <Download size={16} className="text-blue-600" />
                  </button>
                  <button
                    onClick={() => handleDelete(file)}
                    className="p-1.5 hover:bg-red-50 rounded transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 size={16} className="text-red-600" />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {uploading && (
        <div className="p-3 bg-blue-50 border-t border-blue-200 text-sm text-blue-700">
          Upload en cours...
        </div>
      )}
    </div>
  );
}
