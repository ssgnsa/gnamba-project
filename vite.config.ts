import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";

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

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
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
    allowedHosts: ["gnambaservices.ci"],
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
