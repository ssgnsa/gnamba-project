#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const scanTargets = [
  path.join(root, "src"),
  path.join(root, "backend", "app"),
  path.join(root, "backend", "tests"),
  path.join(root, "scripts", "deploy-production.sh"),
  path.join(root, "Dockerfile"),
  path.join(root, "docker-compose.yml"),
  path.join(root, "nginx", "nginx-release.conf"),
  path.join(root, "package.json"),
];

const patterns = [
  { key: "legacy_root_attestation", label: "Legacy attestation root endpoint", needle: "/api/attestations/verify" },
  { key: "legacy_root_auth", label: "Legacy auth root endpoint", needle: "/api/auth" },
  { key: "legacy_root_users", label: "Legacy users root endpoint", needle: "/api/users" },
  { key: "legacy_root_media", label: "Legacy media root endpoint", needle: "/api/media" },
  { key: "legacy_root_settings", label: "Legacy settings root endpoint", needle: "/api/settings" },
  { key: "legacy_root_site_content", label: "Legacy site-content root endpoint", needle: "/api/site-content" },
  { key: "legacy_sdk", label: "Legacy Supabase SDK", needle: "@supabase/supabase-js" },
  { key: "legacy_supabase_vendor", label: "Legacy supabase-vendor chunk", needle: "supabase-vendor" },
  { key: "legacy_adapter", label: "Legacy supabase adapter", needle: "legacySupabaseAdapter" },
  { key: "legacy_cloud_domain", label: "Legacy Supabase cloud domain", needle: "supabase.co" },
  { key: "legacy_cloud_domain_in", label: "Legacy Supabase cloud domain", needle: "supabase.in" },
  { key: "legacy_capture_lead", label: "Legacy capture-lead edge function", needle: "capture-lead" },
];

const ignoreDirs = new Set(["node_modules", ".git", "dist", "__pycache__"]);
const results = [];

function collectFiles(target) {
  if (!existsSync(target)) return [];

  const stats = statSync(target);
  if (stats.isFile()) return [target];

  return readdirSync(target, { withFileTypes: true }).flatMap((entry) => {
    if (ignoreDirs.has(entry.name)) return [];
    return collectFiles(path.join(target, entry.name));
  });
}

for (const target of scanTargets) {
  for (const filePath of collectFiles(target)) {
    const relativePath = path.relative(root, filePath).replace(/\\/g, "/");
    const content = readFileSync(filePath, "utf8");
    const lines = content.split(/\r?\n/);

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      for (const pattern of patterns) {
        if (line.includes(pattern.needle)) {
          results.push({
            file: relativePath,
            line: index + 1,
            label: pattern.label,
            needle: pattern.needle,
            excerpt: line.trim(),
          });
        }
      }
    }
  }
}

const report = {
  generated_at: new Date().toISOString(),
  scanned_targets: scanTargets.map((target) => path.relative(root, target).replace(/\\/g, "/")),
  findings: results,
  summary: {
    finding_count: results.length,
    files_affected: new Set(results.map((item) => item.file)).size,
  },
};

const outputPathArgIndex = process.argv.indexOf("--report");
if (outputPathArgIndex >= 0 && process.argv[outputPathArgIndex + 1]) {
  const outputPath = path.resolve(root, process.argv[outputPathArgIndex + 1]);
  writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`Report written to ${path.relative(root, outputPath)}`);
}

if (results.length > 0) {
  console.error("Functional heritage audit failed:");
  for (const finding of results.slice(0, 80)) {
    console.error(
      `- ${finding.file}:${finding.line} [${finding.label}] ${finding.excerpt}`,
    );
  }
  if (results.length > 80) {
    console.error(`- ... and ${results.length - 80} more findings`);
  }
  process.exit(1);
}

console.log("Functional heritage audit passed.");
