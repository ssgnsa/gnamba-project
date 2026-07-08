import fs from "fs";
import path from "path";
import crypto from "crypto";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");
const OUT_DIR = path.join(ROOT, "reports");

function walk(dir) {
  const files = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const it of items) {
    const full = path.join(dir, it.name);
    if (it.isDirectory()) {
      files.push(...walk(full));
    } else {
      files.push(full);
    }
  }
  return files;
}

function readText(file) {
  try {
    return fs.readFileSync(file, "utf8");
  } catch (e) {
    return null;
  }
}

function hash(content) {
  return crypto
    .createHash("sha256")
    .update(content || "")
    .digest("hex");
}

function normalizeRel(p) {
  return p.split(path.sep).join("/");
}

function resolveImport(importer, spec) {
  if (!spec) return null;
  if (spec.startsWith(".") || spec.startsWith("/")) {
    const base = path.dirname(importer);
    const joined = path.resolve(base, spec);
    const exts = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".json"];
    const candidates = [
      joined,
      ...exts.map((e) => joined + e),
      ...exts.map((e) => path.join(joined, "index" + e)),
    ];
    for (const c of candidates) {
      if (fs.existsSync(c)) return normalizeRel(path.relative(ROOT, c));
    }
    // fallback: return normalized relative path
    return normalizeRel(path.relative(ROOT, joined));
  }
  return spec; // external package
}

function extractImports(content) {
  if (!content) return [];
  const re =
    /import\s+(?:[^'";]+)from\s+['"]([^'"]+)['"]|require\(['"]([^'"]+)['"]\)/g;
  const res = [];
  let m;
  while ((m = re.exec(content))) {
    res.push(m[1] || m[2]);
  }
  return res;
}

function ensureOut() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
}

function main() {
  console.log("Collecting files...");
  const allFiles = walk(ROOT).filter(
    (f) =>
      !f.includes(`${path.sep}node_modules${path.sep}`) &&
      !f.includes(`${path.sep}.git${path.sep}`),
  );

  const repoFiles = allFiles.filter((f) =>
    [
      ".ts",
      ".tsx",
      ".js",
      ".jsx",
      ".json",
      ".md",
      ".conf",
      ".yml",
      ".yaml",
    ].includes(path.extname(f)),
  );

  console.log("Analysing source files...");
  const srcFiles = repoFiles.filter((f) => f.startsWith(SRC));

  const nodes = {};
  for (const file of srcFiles) {
    const rel = normalizeRel(path.relative(ROOT, file));
    const content = readText(file);
    const imports = extractImports(content);
    nodes[rel] = {
      path: rel,
      hash: hash(content),
      size: content ? content.length : 0,
      imports: [],
      external: [],
    };
    for (const imp of imports) {
      const resolved = resolveImport(file, imp);
      if (resolved) {
        if (resolved.startsWith(".") || resolved.startsWith("/")) {
          // resolveImport returns normalized relative path
          nodes[rel].imports.push(resolved);
        } else if (resolved && !resolved.includes(":")) {
          nodes[rel].external.push(resolved);
        } else {
          nodes[rel].external.push(resolved);
        }
      }
    }
  }

  // Build reachability from entry points
  const allNodes = Object.keys(nodes);
  const entryPoints = ["src/main.tsx", "src/App.tsx"].map((p) =>
    normalizeRel(p),
  );
  const reachable = new Set();
  const queue = [];
  for (const e of entryPoints) {
    if (nodes[e]) {
      queue.push(e);
      reachable.add(e);
    }
  }
  while (queue.length) {
    const cur = queue.shift();
    for (const imp of nodes[cur].imports) {
      if (nodes[imp] && !reachable.has(imp)) {
        reachable.add(imp);
        queue.push(imp);
      }
    }
  }
  const orphans = allNodes.filter((n) => !reachable.has(n));

  ensureOut();
  fs.writeFileSync(
    path.join(OUT_DIR, "repo-nodes.json"),
    JSON.stringify(nodes, null, 2),
  );
  fs.writeFileSync(
    path.join(OUT_DIR, "repo-summary.json"),
    JSON.stringify(
      {
        totalFiles: srcFiles.length,
        totalNodes: allNodes.length,
        orphansCount: orphans.length,
      },
      null,
      2,
    ),
  );

  // Mermaid graph
  let mermaid = "```mermaid\nflowchart LR\n";
  const toLabel = (s) => s.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 40);
  for (const n of allNodes.slice(0, 1000)) {
    const id = toLabel(n);
    mermaid += `${id}["${n}"]\n`;
  }
  for (const n of allNodes.slice(0, 1000)) {
    const from = toLabel(n);
    for (const imp of nodes[n].imports) {
      const to = toLabel(imp);
      mermaid += `${from} --> ${to}\n`;
    }
  }
  mermaid += "```";
  fs.writeFileSync(path.join(OUT_DIR, "repo-graph.mmd"), mermaid);

  // Duplicates by hash
  const hashMap = {};
  for (const f of srcFiles) {
    const rel = path.relative(ROOT, f);
    const content = readText(f);
    const h = hash(content);
    (hashMap[h] = hashMap[h] || []).push(rel);
  }
  const duplicates = Object.values(hashMap).filter((arr) => arr.length > 1);
  fs.writeFileSync(
    path.join(OUT_DIR, "duplicates.json"),
    JSON.stringify(duplicates, null, 2),
  );

  console.log("Reports written to reports/");
}

main();
