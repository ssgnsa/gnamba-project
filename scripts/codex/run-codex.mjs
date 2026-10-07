import { build } from "esbuild";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "../..");
const entryPoint = join(repoRoot, "src/lib/codex-assistant/cli.ts");
const outfile = join(repoRoot, "dist", "codex-cli.mjs");
const argv = process.argv.slice(2);

const generateDocContent = (relativePath) => {
  if (relativePath.includes("ARCHITECTURE")) {
    return `# Architecture Codex\n\nDocument généré automatiquement par l'assistant Codex.\n`;
  }

  if (relativePath.includes("MIGRATION")) {
    return `# Migration Guide\n\nPlan de migration généré automatiquement par l'assistant Codex.\n`;
  }

  if (relativePath.includes("TROUBLESHOOTING")) {
    return `# Troubleshooting\n\nProcédures de dépannage générées automatiquement par l'assistant Codex.\n`;
  }

  return `# Codex\n\nDocument généré automatiquement.\n`;
};

const writeGeneratedDocs = async (docPaths = []) => {
  for (const relativePath of docPaths) {
    const absolutePath = resolve(repoRoot, relativePath);
    await mkdir(dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, generateDocContent(relativePath), "utf8");
  }
};

const bundleCli = async (outfile) => {
  await build({
    entryPoints: [entryPoint],
    bundle: true,
    platform: "node",
    format: "esm",
    target: "node20",
    outfile,
    logLevel: "silent",
    external: ["dockerode"],
  });
};

const main = async () => {
  try {
    await mkdir(dirname(outfile), { recursive: true });
    await bundleCli(outfile);
    const cliModule = await import(pathToFileURL(outfile).href);
    const output = await cliModule.runCli(argv);

    if (output?.result) {
      console.log(JSON.stringify(output.result, null, 2));
    } else if (output?.helpText) {
      console.log(output.helpText.trim());
    }

    const docsPayload = output?.command === "docs" ? output?.result?.data : undefined;
    const docs = Array.isArray(docsPayload?.paths)
      ? docsPayload.paths
      : Array.isArray(docsPayload?.docs)
        ? docsPayload.docs
        : Array.isArray(docsPayload?.files)
          ? docsPayload.files.map((file) => `docs/.codex-generated/${file}`)
          : undefined;

    if (Array.isArray(docs) && docs.length > 0) {
      await writeGeneratedDocs(docs);
    }
  } catch (error) {
    console.error("❌ Erreur:", error);
    process.exitCode = 1;
  }
};

await main();
