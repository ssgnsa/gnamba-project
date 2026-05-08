import { rmSync, existsSync } from "node:fs";
import { spawn } from "node:child_process";

const [nodeMajor, nodeMinor] = process.versions.node.split(".").map(Number);
if (nodeMajor < 20 || (nodeMajor === 20 && nodeMinor < 19)) {
  console.error("[dev:clean] Node >= 20.19 est requis (Vite 8).");
  console.error(`[dev:clean] Version détectée: ${process.versions.node}`);
  console.error(
    "[dev:clean] Utilisez `nvm use 20.19.1` (ou plus récent) puis relancez.",
  );
  process.exit(1);
}

const paths = ["dist", "node_modules/.vite", ".vite"];

for (const path of paths) {
  if (existsSync(path)) {
    rmSync(path, { recursive: true, force: true });
    console.log(`[dev:clean] Removed ${path}`);
  }
}

console.log("[dev:clean] Starting Vite on port 5173 (strict) ...");

const child = spawn("npm", ["run", "dev", "--", "--port", "5173"], {
  stdio: "inherit",
  shell: true,
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
