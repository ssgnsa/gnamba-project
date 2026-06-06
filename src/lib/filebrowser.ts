/**
 * Service API FileBrowser
 *
 * Permet d'interagir avec FileBrowser via son API REST
 * Documentation : https://filebrowser.org/usage/api
 */

import { FILEBROWSER_API_URL } from "./filebrowserConfig";

interface FileBrowserAuth {
  token: string;
  expires: number;
  refreshToken?: string;
}

interface FileBrowserFile {
  path: string;
  name: string;
  size: number;
  isDir: boolean;
  modified: string;
  type: string;
}

interface FileBrowserUser {
  id: number;
  username: string;
  scope: string;
  permissions: {
    admin: boolean;
    execute: boolean;
    create: boolean;
    rename: boolean;
    modify: boolean;
    delete: boolean;
    share: boolean;
    download: boolean;
  };
}

class FileBrowserServiceClass {
  private auth: FileBrowserAuth | null = null;

  /**
   * S'authentifier auprès de FileBrowser
   */
  async login(username: string, password: string): Promise<string> {
    try {
      const response = await fetch(`${FILEBROWSER_API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.status}`);
      }

      const token = await response.text();
      this.auth = {
        token,
        expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      };

      // Store token in localStorage for persistence
      localStorage.setItem("filebrowser_token", token);
      localStorage.setItem(
        "filebrowser_token_expiry",
        this.auth.expires.toString(),
      );

      return token;
    } catch (error) {
      if (import.meta.env.DEV) console.error("FileBrowser login error:", error);
      throw error;
    }
  }

  /**
   * Récupérer le token depuis le storage avec refresh automatique
   */
  async getToken(): Promise<string | null> {
    // Vérifier si le token actuel est encore valide
    if (this.auth && this.auth.expires > Date.now()) {
      return this.auth.token;
    }

    // Essayer de rafraîchir le token si un refresh token est disponible
    if (this.auth?.refreshToken) {
      try {
        const newToken = await this.refreshAccessToken(this.auth.refreshToken);
        if (newToken) {
          return newToken;
        }
      } catch (error) {
        if (import.meta.env.DEV) console.error("Token refresh failed:", error);
      }
    }

    // Essayer de restaurer depuis localStorage
    const storedToken = localStorage.getItem("filebrowser_token");
    const storedExpiry = localStorage.getItem("filebrowser_token_expiry");
    const storedRefreshToken = localStorage.getItem("filebrowser_refresh_token");

    if (storedToken && storedExpiry && parseInt(storedExpiry) > Date.now()) {
      this.auth = {
        token: storedToken,
        expires: parseInt(storedExpiry),
        refreshToken: storedRefreshToken || undefined,
      };
      return storedToken;
    }

    return null;
  }

  /**
   * Rafraîchir le token d'accès
   */
  private async refreshAccessToken(refreshToken: string): Promise<string | null> {
    try {
      const response = await fetch(`${FILEBROWSER_API_URL}/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.status}`);
      }

      const data = await response.json();
      const newToken = data.token || data.access_token;

      if (newToken) {
        this.auth = {
          token: newToken,
          expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
          refreshToken: data.refreshToken || refreshToken,
        };

        // Mettre à jour localStorage
        localStorage.setItem("filebrowser_token", newToken);
        localStorage.setItem(
          "filebrowser_token_expiry",
          this.auth.expires.toString(),
        );
        if (this.auth.refreshToken) {
          localStorage.setItem("filebrowser_refresh_token", this.auth.refreshToken);
        }

        return newToken;
      }

      return null;
    } catch (error) {
      if (import.meta.env.DEV) console.error("Token refresh error:", error);
      return null;
    }
  }

  /**
   * Se déconnecter
   */
  logout(): void {
    this.auth = null;
    localStorage.removeItem("filebrowser_token");
    localStorage.removeItem("filebrowser_token_expiry");
    localStorage.removeItem("filebrowser_refresh_token");
  }

  /**
   * Récupérer les fichiers d'un dossier
   */
  async getFiles(path: string = "/"): Promise<FileBrowserFile[]> {
    const token = await this.getToken();
    if (!token) {
      throw new Error("Not authenticated");
    }

    try {
      const response = await fetch(`${FILEBROWSER_API_URL}/resources${path}`, {
        method: "GET",
        headers: {
          "X-Auth": token,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get files: ${response.status}`);
      }

      const data = await response.json();
      return data.items || [];
    } catch (error) {
      if (import.meta.env.DEV)
        console.error("FileBrowser getFiles error:", error);
      throw error;
    }
  }

  /**
   * Télécharger un fichier
   */
  async downloadFile(path: string): Promise<Blob> {
    const token = await this.getToken();
    if (!token) {
      throw new Error("Not authenticated");
    }

    try {
      const response = await fetch(`${FILEBROWSER_API_URL}/raw${path}`, {
        method: "GET",
        headers: {
          "X-Auth": token,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to download: ${response.status}`);
      }

      return await response.blob();
    } catch (error) {
      if (import.meta.env.DEV)
        console.error("FileBrowser download error:", error);
      throw error;
    }
  }

  /**
   * Uploader un fichier
   */
  async uploadFile(path: string, file: File): Promise<void> {
    const token = await this.getToken();
    if (!token) {
      throw new Error("Not authenticated");
    }

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `${FILEBROWSER_API_URL}/raw${path}/${file.name}`,
        {
          method: "POST",
          headers: {
            "X-Auth": token,
          },
          body: formData,
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to upload: ${response.status}`);
      }
    } catch (error) {
      if (import.meta.env.DEV)
        console.error("FileBrowser upload error:", error);
      throw error;
    }
  }

  /**
   * Créer un dossier
   */
  async createDirectory(path: string): Promise<void> {
    const token = await this.getToken();
    if (!token) {
      throw new Error("Not authenticated");
    }

    try {
      const response = await fetch(`${FILEBROWSER_API_URL}/raw${path}`, {
        method: "POST",
        headers: {
          "X-Auth": token,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to create directory: ${response.status}`);
      }
    } catch (error) {
      if (import.meta.env.DEV)
        console.error("FileBrowser createDirectory error:", error);
      throw error;
    }
  }

  /**
   * Supprimer un fichier/dossier
   */
  async deleteFile(path: string): Promise<void> {
    const token = await this.getToken();
    if (!token) {
      throw new Error("Not authenticated");
    }

    try {
      const response = await fetch(`${FILEBROWSER_API_URL}/raw${path}`, {
        method: "DELETE",
        headers: {
          "X-Auth": token,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete: ${response.status}`);
      }
    } catch (error) {
      if (import.meta.env.DEV)
        console.error("FileBrowser delete error:", error);
      throw error;
    }
  }

  /**
   * Renommer un fichier/dossier
   */
  async renameFile(oldPath: string, newPath: string): Promise<void> {
    const token = await this.getToken();
    if (!token) {
      throw new Error("Not authenticated");
    }

    try {
      const response = await fetch(`${FILEBROWSER_API_URL}/raw${oldPath}`, {
        method: "PUT",
        headers: {
          "X-Auth": token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newPath }),
      });

      if (!response.ok) {
        throw new Error(`Failed to rename: ${response.status}`);
      }
    } catch (error) {
      if (import.meta.env.DEV)
        console.error("FileBrowser rename error:", error);
      throw error;
    }
  }

  /**
   * Obtenir les infos utilisateur
   */
  async getUserInfo(): Promise<FileBrowserUser | null> {
    const token = await this.getToken();
    if (!token) {
      return null;
    }

    try {
      const response = await fetch(`${FILEBROWSER_API_URL}/user`, {
        method: "GET",
        headers: {
          "X-Auth": token,
        },
      });

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      if (import.meta.env.DEV)
        console.error("FileBrowser getUserInfo error:", error);
      return null;
    }
  }
}

export const FileBrowserService = new FileBrowserServiceClass();
export type { FileBrowserFile, FileBrowserUser };
