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
  },
  build: {
    outDir: buildOutDir,
    minify: "esbuild",
    rollupOptions: {
      output: {
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
