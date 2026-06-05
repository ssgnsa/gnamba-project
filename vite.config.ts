import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";

const buildVersion = String(Date.now());

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
  const preferredOutDir = process.env.VITE_OUT_DIR ?? "dist";
  const fallbackOutDir = "dist-local";

  if (canUseOutDir(preferredOutDir)) {
    return preferredOutDir;
  }

  console.warn(
    `[vite-config] Dossier de build "${preferredOutDir}" non inscriptible/purgeable. Utilisation de "${fallbackOutDir}".`,
  );

  return fallbackOutDir;
}

const buildOutDir = resolveBuildOutDir();

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: "egs-versioned-index-assets",
      enforce: "post",
      transformIndexHtml(html) {
        const versionQuery = `v=${buildVersion}`;
        return html
          .replace(
            /\/assets\/index\.js(["'])/g,
            `/assets/index.js?${versionQuery}$1`,
          )
          .replace(
            /\/assets\/index\.css(["'])/g,
            `/assets/index.css?${versionQuery}$1`,
          );
      },
    },
  ],
  optimizeDeps: {
    exclude: ["lucide-react"],
  },
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  server: {
    host: true,
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: buildOutDir,
    minify: "esbuild",
    sourcemap: false,
    rollupOptions: {
      output: {
        entryFileNames: "assets/index.js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames(assetInfo) {
          const assetName = assetInfo.name ?? "";

          if (assetName.endsWith(".css")) {
            return "assets/index.css";
          }

          return "assets/[name]-[hash][extname]";
        },
        manualChunks(id) {
          if (
            id.includes("node_modules/react") ||
            id.includes("node_modules/react-dom")
          ) {
            return "react-vendor";
          }
          if (id.includes("node_modules/@supabase/supabase-js")) {
            return "supabase-vendor";
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
