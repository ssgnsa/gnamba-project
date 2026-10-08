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
  "src/services/api/client.ts",
];
const retainedTransitionFiles = ["src/data/client.ts"];
const forbiddenPatterns = [
  "Session expir\u00e9e",
  "capture-lead",
  "192.168.",
  ":54321",
  "/functions/",
  "/functions/v1/",
  "/storage/v1/",
  "/rest/v1/",
  ];
const allowedExceptions = [
  { file: "src/lib/selfHosted.ts", pattern: "gnambaservices.ci" },
  { file: "src/lib/selfHosted.ts", pattern: "files.gnambaservices.ci/egs" },
  { file: "dist/", pattern: "https://api.gnambaservices.ci" },
  { file: "dist/", pattern: "https://files.gnambaservices.ci/egs" },
];
const productionLoopbackUrlPattern =
  /https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?(?:[/?#][^\s"'`<>]*)?/gi;

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

const retainedTransitions = retainedTransitionFiles.filter((relativePath) =>
  existsSync(path.join(root, relativePath)),
);

if (!existsSync(distDir)) {
  failures.push("Missing required dist/ build directory.");
}

function scanForForbiddenPatterns(filePath, relPath) {
  if (/(?:^|\/)[^/]+\.(?:test|spec)\.(?:ts|tsx)$/i.test(relPath)) return;

  let content;
  try {
    content = readFileSync(filePath, "utf-8");
  } catch (e) {
    return;
  }

  for (const pattern of forbiddenPatterns) {
    if (content.includes(pattern)) {
      const isAllowed = allowedExceptions.some(
        (exc) => relPath.startsWith(exc.file) && content.includes(exc.pattern),
      );
      if (!isAllowed) {
        failures.push(`Forbidden pattern "${pattern}" found in ${relPath}`);
      }
    }
  }

  if (relPath.startsWith("dist/")) {
    // resolveApiBaseUrl embeds localhost:5173 as its local frontend-origin default.
    const loopbackUrl = (content.match(productionLoopbackUrlPattern) ?? []).find(
      (url) => !/^https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\]):5173$/i.test(url),
    );
    if (loopbackUrl) {
      failures.push(
        `Production artifact contains loopback URL "${loopbackUrl}" in ${relPath}`,
      );
    }
  }
}

function walkAndScan(dir, baseDir) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (entry === "node_modules" || entry === ".git" || entry === "coverage" || entry === "dist") continue;
      walkAndScan(full, baseDir);
    } else if (entry.endsWith(".ts") || entry.endsWith(".tsx") || entry.endsWith(".js") || entry.endsWith(".jsx") || entry.endsWith(".mjs") || entry.endsWith(".json") || entry.endsWith(".html") || entry.endsWith(".css") || entry.endsWith(".yml") || entry.endsWith(".yaml")) {
      const rel = path.relative(baseDir, full);
      scanForForbiddenPatterns(full, rel);
    }
  }
}

for (const scanRoot of scanRoots) {
  if (statSync(scanRoot).isDirectory()) {
    walkAndScan(scanRoot, root);
  } else {
    const rel = path.relative(root, scanRoot);
    scanForForbiddenPatterns(scanRoot, rel);
  }
}

retainedTransitions.forEach((file) =>
  console.warn(`\nℹ️ Retained transition adapter: ${file}`),
);

if (failures.length > 0) {
  console.error("\n\u274c RELEASE CHECK FAILED:");
  failures.forEach((f) => console.error(`  - ${f}`));
  process.exit(1);
} else {
  console.log("\n\u2705 Release check passed - no legacy architecture references found.");
  process.exit(0);
}
