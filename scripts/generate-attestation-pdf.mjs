import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import puppeteer from "puppeteer";
import QRCode from "qrcode";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const templatesDir = path.resolve(__dirname, "../templates");
const assetsDir = path.join(templatesDir, "assets");
const templateFile = path.join(templatesDir, "attestation_ministere.html");

const defaultDataPath = path.resolve(__dirname, "attestation-data.example.json");

const argMap = process.argv.slice(2).reduce((map, arg) => {
  const [key, value] = arg.split("=");
  if (key && value) map[key.replace(/^--/, "")] = value;
  return map;
}, {});

const dataPath = argMap.data ? path.resolve(process.cwd(), argMap.data) : defaultDataPath;
const outputPath = argMap.output
  ? path.resolve(process.cwd(), argMap.output)
  : path.resolve(process.cwd(), "dist/attestation-ministere.pdf");

function ensureMimetype(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".woff2":
      return "font/woff2";
    default:
      return "application/octet-stream";
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function fileToDataUrl(filePath, defaultType) {
  try {
    const data = await fs.readFile(filePath);
    const type = defaultType || ensureMimetype(filePath);
    return `data:${type};base64,${data.toString("base64")}`;
  } catch (error) {
    return "";
  }
}

async function inlineFonts(html) {
  const fontRegex = /url\(["']?\.\/assets\/fonts\/([^"')]+)["']?\)/g;
  let match;
  const replacements = [];
  while ((match = fontRegex.exec(html)) !== null) {
    const assetName = match[1];
    const assetPath = path.join(assetsDir, "fonts", assetName);
    const dataUrl = await fileToDataUrl(assetPath, "font/woff2");
    if (dataUrl) {
      replacements.push({ source: match[0], target: `url("${dataUrl}")` });
    }
  }
  for (const { source, target } of replacements) {
    html = html.replace(source, target);
  }
  return html;
}

async function resolveAsset(value, fallbackFile) {
  if (typeof value === "string" && value.trim()) {
    if (value.startsWith("data:") || value.startsWith("http://") || value.startsWith("https://")) {
      return value;
    }
    try {
      const resolved = path.resolve(process.cwd(), value);
      return await fileToDataUrl(resolved);
    } catch {
      // pass through to fallback
    }
  }
  return await fileToDataUrl(fallbackFile);
}

/**
 * Build template with placeholders. Do not inject hash/qr fields until hash computed.
 */
async function buildTemplateWithAssets(data) {
  let html = await fs.readFile(templateFile, "utf-8");
  html = await inlineFonts(html);

  const placeholders = {
    filigrane: await resolveAsset(data.filigrane, path.join(assetsDir, "filigrane.png")),
    texture: await resolveAsset(data.texture, path.join(assetsDir, "texture.png")),
    carte: await resolveAsset(data.carte, path.join(assetsDir, "carte.png")),
    blason: await resolveAsset(data.blason, path.join(assetsDir, "blason.png")),
    signature: await resolveAsset(data.signature, path.join(assetsDir, "signature.png")),
    cachet: await resolveAsset(data.cachet, path.join(assetsDir, "cachet.png")),
    // leave qr, hash, verify_url for later
    qr: "__QR_PLACEHOLDER__",
    village: escapeHtml(data.village),
    nom: escapeHtml(data.nom),
    naissance: escapeHtml(data.naissance),
    profession: escapeHtml(data.profession),
    telephone: escapeHtml(data.telephone),
    cni: escapeHtml(data.cni),
    domicile: escapeHtml(data.domicile),
    lot: escapeHtml(data.lot),
    superficie: escapeHtml(data.superficie),
    localisation: escapeHtml(data.localisation),
    quartier: escapeHtml(data.quartier),
    mode: escapeHtml(data.mode),
    historique: escapeHtml(data.historique),
    date: escapeHtml(data.date),
    chef: escapeHtml(data.chef),
    ref: escapeHtml(data.ref),
    numero: escapeHtml(data.numero),
    registre: escapeHtml(data.registre),
    controle: escapeHtml(data.controle),
    hash: "__HASH_PLACEHOLDER__",
    verify_url: "__VERIFY_PLACEHOLDER__",
    hash_short: "__HASH_SHORT_PLACEHOLDER__",
  };

  const intermediate = html.replace(/\{\{(\w+)\}\}/g, (_, key) => placeholders[key] ?? "");
  return { templateHtml: html, intermediateHtml: intermediate };
}

async function renderPdf(html) {
  const launchOptions = {};
  // Allow using a system-installed Chrome/Chromium via env vars
  if (process.env.PUPPETEER_EXECUTABLE_PATH) launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  if (process.env.CHROME_BIN) launchOptions.executablePath = process.env.CHROME_BIN;
  // Optionally run without sandbox (useful in some CI or constrained environments)
  if (process.env.PUPPETEER_NO_SANDBOX === "1" || process.env.PUPPETEER_NO_SANDBOX === "true") {
    launchOptions.args = [...(launchOptions.args || []), "--no-sandbox", "--disable-setuid-sandbox"];
  }

  const browser = await puppeteer.launch(launchOptions);
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    return await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: false,
      margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" },
    });
  } finally {
    await browser.close();
  }
}

function computeSha256Hex(input) {
  return crypto.createHash("sha256").update(input, "utf8").digest("hex");
}

function buildVerifyUrl({ ref, controle, hash }) {
  const base = "https://portal.gnambaservices.ci/verification-attestation";
  const params = new URLSearchParams();
  if (ref) params.set("ref", ref);
  if (controle) params.set("control", controle);
  if (hash) params.set("hash", hash);
  return `${base}?${params.toString()}`;
}

async function run() {
  const raw = await fs.readFile(dataPath, "utf-8");
  const data = JSON.parse(raw);

  // Build template and inline fonts/assets (leaving hash/qr placeholders)
  const { templateHtml, intermediateHtml } = await buildTemplateWithAssets(data);

  // Compute a stable hash over the intermediate HTML (this excludes the hash and QR themselves)
  const computedHash = computeSha256Hex(intermediateHtml);
  const shortHash = computedHash.slice(0, 16);

  // Build verification URL (canonical) incorporating the hash
  const verifyUrl = data.verify_url || buildVerifyUrl({ ref: data.ref, controle: data.controle, hash: computedHash });

  // Generate QR code data URL for the verify URL
  const qrDataUrl = data.qr || (await QRCode.toDataURL(verifyUrl, { errorCorrectionLevel: "H", type: "image/png", width: 220 }));

  // Final placeholders
  const finalPlaceholders = {
    filigrane: await resolveAsset(data.filigrane, path.join(assetsDir, "filigrane.png")),
    texture: await resolveAsset(data.texture, path.join(assetsDir, "texture.png")),
    carte: await resolveAsset(data.carte, path.join(assetsDir, "carte.png")),
    blason: await resolveAsset(data.blason, path.join(assetsDir, "blason.png")),
    signature: await resolveAsset(data.signature, path.join(assetsDir, "signature.png")),
    cachet: await resolveAsset(data.cachet, path.join(assetsDir, "cachet.png")),
    qr: qrDataUrl,
    village: escapeHtml(data.village),
    nom: escapeHtml(data.nom),
    naissance: escapeHtml(data.naissance),
    profession: escapeHtml(data.profession),
    telephone: escapeHtml(data.telephone),
    cni: escapeHtml(data.cni),
    domicile: escapeHtml(data.domicile),
    lot: escapeHtml(data.lot),
    superficie: escapeHtml(data.superficie),
    localisation: escapeHtml(data.localisation),
    quartier: escapeHtml(data.quartier),
    mode: escapeHtml(data.mode),
    historique: escapeHtml(data.historique),
    date: escapeHtml(data.date),
    chef: escapeHtml(data.chef),
    ref: escapeHtml(data.ref),
    numero: escapeHtml(data.numero),
    registre: escapeHtml(data.registre),
    controle: escapeHtml(data.controle),
    hash: computedHash,
    verify_url: verifyUrl,
    hash_short: shortHash,
  };

  // Produce final HTML by replacing placeholders in templateHtml
  const finalHtml = templateHtml.replace(/\{\{(\w+)\}\}/g, (_, key) => finalPlaceholders[key] ?? "");

  // Render PDF
  const pdfBuffer = await renderPdf(finalHtml);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, pdfBuffer);

  // Write metadata (for audit / DB sync)
  const meta = {
    generated_at: new Date().toISOString(),
    output: outputPath,
    ref: data.ref || null,
    attestation_id: data.attestation_id || null,
    controle: data.controle || null,
    hash: computedHash,
    short_hash: shortHash,
    verify_url: verifyUrl,
    template: path.basename(templateFile),
    template_version: "v1",
  };
  const metaPath = `${outputPath}.meta.json`;
  await fs.writeFile(metaPath, JSON.stringify(meta, null, 2), "utf-8");

  console.log(`PDF généré : ${outputPath}`);
  console.log(`Metadata : ${metaPath}`);

  // If SUPABASE config present, attempt to attach metadata via RPC using service role
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (supabaseUrl && serviceRoleKey && (data.attestation_id || data.ref)) {
    try {
      const rpcUrl = `${supabaseUrl.replace(/\/$/, "")}/rest/v1/rpc/attach_foncier_attestation_pdf_metadata`;
      const body = JSON.stringify({
        p_attestation_id: data.attestation_id || null,
        p_hash_sha256: computedHash,
        p_verify_url: verifyUrl,
        p_pdf_path: outputPath,
        p_pdf_generated_at: meta.generated_at,
        p_printed_by: data.printed_by || null,
      });

      const res = await fetch(rpcUrl, {
        method: "POST",
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.warn("RPC attach metadata failed:", res.status, text);
      } else {
        console.log("Metadata envoyé via RPC attach_foncier_attestation_pdf_metadata");
      }
    } catch (err) {
      console.warn("Impossible d'envoyer metadata au Supabase RPC:", err.message || err);
    }
  }
}

run().catch((error) => {
  console.error("Erreur génération PDF :", error);
  process.exit(1);
});
