#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const requiredFiles = [
  "src/api/client.ts",
  "src/context/AuthContext.tsx",
  "src/data/dbClient.ts",
  "scripts/release-check.mjs",
  "backend/app/main.py",
  "backend/app/api/v1/__init__.py",
  "docker-compose.yml",
  "Dockerfile",
  "nginx/nginx-release.conf",
];

const forbiddenPaths = [
  "src/lib/supabase.ts",
  "src/data/client.ts",
  "src/services/api/client.ts",
  "src/lib/legacySupabaseAdapter.ts",
  "docker-compose.prod.yml",
  "docker-compose.selfhosted.yml",
  "docker-compose.server.yml",
  "docker-compose.https.yml",
  "docker-compose.standalone.yml",
  "Dockerfile.runtime",
  "Dockerfile.simple",
  "Dockerfile.nofb",
  "Dockerfile.standalone",
  "nginx/nginx.conf",
  "nginx/nginx-production.conf",
  "nginx/nginx-fixed.conf",
  "nginx/nginx-simple.conf",
  "nginx/nginx-standalone.conf",
  "scripts/deploy.sh",
  "scripts/deploy_server.sh",
  "scripts/deploy-via-api.sh",
  "scripts/deploy-and-verify.sh",
];

const issues = [];

for (const relativePath of requiredFiles) {
  if (!existsSync(path.join(root, relativePath))) {
    issues.push(`Required architecture file missing: ${relativePath}`);
  }
}

for (const relativePath of forbiddenPaths) {
  if (existsSync(path.join(root, relativePath))) {
    issues.push(`Forbidden legacy path present: ${relativePath}`);
  }
}

const collectFiles = (target) => {
  if (!existsSync(target)) return [];
  const stats = statSync(target);
  if (stats.isFile()) return [target];
  return readdirSync(target, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(target, entry.name);
    if (entry.isDirectory()) {
      if (
        entry.name === "node_modules" ||
        entry.name === ".git" ||
        entry.name === "dist"
      ) {
        return [];
      }
      return collectFiles(fullPath);
    }
    return [fullPath];
  });
};

const directApiCalls = [];
const allowedApiClientImporters = new Set([
  "src/context/AuthContext.tsx",
  "src/context/SettingsContext.tsx",
  "src/context/SiteContentContext.tsx",
  "src/data/tableClient.ts",
  "src/lib/dbClient.service.ts",
  "src/lib/foncierVillageConfig.ts",
  "src/lib/lead-capture.ts",
  "src/lib/mediaUtils.ts",
  "src/pages/Documents.tsx",
  "src/pages/Foncier.tsx",
  "src/pages/Media.tsx",
  "src/pages/Parametres.tsx",
  "src/pages/RegistreVisiteur.tsx",
  "src/pages/Utilisateurs.tsx",
]);
const files = collectFiles(path.join(root, "src"));
for (const file of files) {
  if (!file.endsWith(".ts") && !file.endsWith(".tsx")) continue;
  const content = readFileSync(file, "utf8");
  const rel = path.relative(root, file).replace(/\\/g, "/");
  if (
    content.includes('from "../api/client"') ||
    content.includes("from '../api/client'")
  ) {
    if (!allowedApiClientImporters.has(rel)) {
      directApiCalls.push(rel);
    }
  }
}

const authModules = [
  "src/context/AuthContext.tsx",
  "src/api/client.ts",
  "src/data/dbClient.ts",
];

for (const module of authModules) {
  if (!existsSync(path.join(root, module))) {
    issues.push(`Authentication module missing: ${module}`);
  }
}

if (directApiCalls.length > 0) {
  issues.push(
    `Unexpected direct API client imports: ${directApiCalls.join(", ")}`,
  );
}

if (issues.length > 0) {
  console.error("EGS architecture freeze check failed:");
  for (const issue of issues) console.error(`- ${issue}`);
  process.exit(1);
}

console.log("EGS architecture freeze check passed.");
console.log(
  "Canonical architecture verified: API client, auth context, data client, release gate, backend entrypoint, container/runtime files.",
);
