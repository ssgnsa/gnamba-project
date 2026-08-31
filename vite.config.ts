import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";

const srcPath = path.resolve(__dirname, "./src");

function canUseOutDir(outDir: string): boolean {
  try {
    fs.mkdirSync(outDir, { recursive: true });
    fs.accessSync(outDir, fs.constants.W_OK);

    const assetsDir = path.join(outDir, "assets");
    if (fs.existsSync(assetsDir)) {
      fs.accessSync(assetsDir, fs.constants.W_OK);
    }

    return true;
  } catch {
    return false;
  }
}

function resolveBuildOutDir(): string {
  const outDir = "dist";

  if (canUseOutDir(outDir)) {
    return outDir;
  }

  throw new Error(
    `[vite-config] Dossier de build "${outDir}" non inscriptible/purgeable. Le fallback dist-local est interdit.`,
  );
}

const buildOutDir = resolveBuildOutDir();

// Ensure Vite environment variables are inlined during build
const envVars: Record<string, string> = {
  'import.meta.env.VITE_API_MODE': JSON.stringify(process.env.VITE_API_MODE || 'local'),
  'import.meta.env.VITE_LOCAL_API_URL': JSON.stringify('__VITE_LOCAL_API_URL__'),
  'import.meta.env.VITE_SELFHOSTED_MODE': JSON.stringify(process.env.VITE_SELFHOSTED_MODE || 'true'),
  'import.meta.env.VITE_FILEBROWSER_URL': JSON.stringify(process.env.VITE_FILEBROWSER_URL || '/filebrowser'),
  'import.meta.env.VITE_FILEBROWSER_API_URL': JSON.stringify(process.env.VITE_FILEBROWSER_API_URL || '/filebrowser/api'),
  'import.meta.env.VITE_IDLE_TIMEOUT_MINUTES': JSON.stringify(process.env.VITE_IDLE_TIMEOUT_MINUTES || '30'),
  'import.meta.env.VITE_OLLAMA_MODEL': JSON.stringify(process.env.VITE_OLLAMA_MODEL || 'llama3.1:8b'),
  'import.meta.env.VITE_OLLAMA_URL': JSON.stringify(process.env.VITE_OLLAMA_URL || 'http://ollama.local:11434'),
  'import.meta.env.VITE_ONESIGNAL_APP_ID': JSON.stringify(process.env.VITE_ONESIGNAL_APP_ID || ''),
  'import.meta.env.VITE_ONESIGNAL_API_KEY': JSON.stringify(process.env.VITE_ONESIGNAL_API_KEY || ''),
  'import.meta.env.VITE_ONESIGNAL_USER_AUTH_KEY': JSON.stringify(process.env.VITE_ONESIGNAL_USER_AUTH_KEY || ''),
  'import.meta.env.VITE_SENTRY_DSN': JSON.stringify(process.env.VITE_SENTRY_DSN || ''),
  'import.meta.env.VITE_AMPLITUDE_API_KEY': JSON.stringify(process.env.VITE_AMPLITUDE_API_KEY || ''),
  'import.meta.env.VITE_CLOUDFLARE_TURNSTILE_SITE_KEY': JSON.stringify(process.env.VITE_CLOUDFLARE_TURNSTILE_SITE_KEY || ''),
  'import.meta.env.VITE_CANONICAL_HOST': JSON.stringify(process.env.VITE_CANONICAL_HOST || ''),
  'import.meta.env.VITE_FILES_URL': JSON.stringify(process.env.VITE_FILES_URL || ''),
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": srcPath,
      "@/": srcPath,
    },
  },
  optimizeDeps: {
    exclude: ["lucide-react"],
  },
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    ...envVars,
  },
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    allowedHosts: ["gnambaservices.ci"],
    proxy: {
      '/api/v1': {
        target: 'http://localhost:8000/api/v1',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: buildOutDir,
    minify: "esbuild",
    sourcemap: false,
    rollupOptions: {
      output: {
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
        manualChunks(id) {
          if (
            id.includes("node_modules/react") ||
            id.includes("node_modules/react-dom")
          ) {
            return "react-vendor";
          }
          if (id.includes("node_modules/lucide-react")) {
            return "icons-vendor";
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});