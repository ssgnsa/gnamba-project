import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcRoot = path.join(root, "src");

const scans = [
  {
    label: "Forbidden Supabase network resources",
    pattern: String.raw`capture-lead|/functions(?:/v1)?/|/storage/v1/|/rest/v1/|supabase\.(?:co|in)`,
    paths: [srcRoot],
  },
  {
    label: "Direct Supabase SDK imports outside the disabled facade",
    pattern: String.raw`from\s+["']@supabase/supabase-js["']|import\(["']@supabase/supabase-js["']\)`,
    paths: [srcRoot],
    allowed: new Set([path.join(srcRoot, "lib/supabase.ts")]),
  },
];

let failed = false;

for (const scan of scans) {
  const result = spawnSync(
    "rg",
    ["--line-number", "--with-filename", scan.pattern, ...scan.paths],
    { encoding: "utf8" },
  );

  if (result.status !== 0 && result.status !== 1) {
    console.error(result.stderr || `${scan.label} scan failed.`);
    process.exit(result.status ?? 1);
  }

  const findings = result.stdout
    .split("\n")
    .filter(Boolean)
    .filter((line) => {
      if (!scan.allowed) return true;
      const file = line.split(":", 1)[0];
      return !scan.allowed.has(path.resolve(file));
    });

  if (findings.length > 0) {
    failed = true;
    console.error(`${scan.label} still present:`);
    for (const line of findings) console.error(`- ${line}`);
  }
}

if (failed) process.exit(1);

console.log(
  "No forbidden Supabase network resources or direct SDK imports found in src/.",
);
