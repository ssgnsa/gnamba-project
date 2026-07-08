#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(root, "dist");
const scanRoots = [
  path.join(root, "src"),
  distDir,
  path.join(root, "index.html"),
  path.join(root, "Dockerfile"),
  path.join(root, "docker-compose.yml"),
  path.join(root, "package.json"),
];
const legacyDirs = [
  "dist-local",
  "dist_old",
  "dist-prod",
  "dist-backup",
  "build",
  "release",
  "release-old",
];
const legacyRootFiles = [
  "Dockerfile.runtime",
  "Dockerfile.simple",
  "Dockerfile.nofb",
  "Dockerfile.standalone",
  "docker-compose.prod.yml",
  "docker-compose.selfhosted.yml",
  "docker-compose.server.yml",
  "docker-compose.https.yml",
  "docker-compose.standalone.yml",
  "nginx/nginx.conf",
  "nginx/nginx-production.conf",
  "nginx/nginx-fixed.conf",
  "nginx/nginx-simple.conf",
  "nginx/nginx-standalone.conf",
  "scripts/deploy.sh",
  "scripts/deploy_server.sh",
  "scripts/deploy-via-api.sh",
  "scripts/deploy-and-verify.sh",
  "src/lib/legacySupabaseAdapter.ts",
  "src/lib/supabase.ts",
  "src/data/client.ts",
  "src/services/api/client.ts",
];
const legacyProvider = "supa" + "base";
const legacyFunctionsPath = "/" + "functions";
const legacyStoragePath = "/" + "storage";
const legacyRestPath = "/" + "rest";
const forbiddenPatterns = [
  "Session expirée",
  "capture-lead",
  "localhost:8000",
  "127.0.0.1",
  "192.168.",
  ":54321",
  "/functions/",
  "/functions/v1/",
  "/storage/v1/",
  "/rest/v1/",
  "supabase.co",
  "supabase.in",
  "supabase-vendor",
  "@supabase",
  "VITE_SUPABASE",
  "legacySupabaseAdapter",
];

const failures = [];

for (const dir of legacyDirs) {
  if (existsSync(path.join(root, dir))) {
    failures.push(`Legacy build directory present: ${dir}`);
  }
}

for (const relativePath of legacyRootFiles) {
  if (existsSync(path.join(root, relativePath))) {
    failures.push(`Legacy architecture file still present: ${relativePath}`);
  }
}

if (!existsSync(distDir)) {
  failures.push("Missing required dist/ build directory.");
}

const collectFiles = (target) => {
  if (!existsSync(target)) return [];

  const stats = statSync(target);
  if (stats.isFile()) return [target];

  return readdirSync(target, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(target, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".git") {
        return [];
      }
      return collectFiles(fullPath);
    }
    return [fullPath];
  });
};

for (const target of scanRoots) {
  if (!existsSync(target)) continue;

  const files = collectFiles(target);
  const matches = [];

  for (const filePath of files) {
    const content = readFileSync(filePath, "utf8");
    const lines = content.split(/\r?\n/);
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      for (const pattern of forbiddenPatterns) {
        if (line.includes(pattern)) {
          matches.push(
            `${path.relative(root, filePath)}:${index + 1}:${line.trim()}`,
          );
          break;
        }
      }
    }
  }

  if (matches.length > 0) {
    failures.push(
      `Forbidden release references in ${path.relative(root, target)}:\n${matches.join("\n")}`,
    );
  }
}

if (failures.length > 0) {
  console.error("EGS release check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("EGS release check passed: single release path is clean.");
