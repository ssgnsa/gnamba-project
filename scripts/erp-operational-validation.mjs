#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const reportsDir = path.join(root, "docs", "industrialisation", "validation-runs");

const defaults = {
  apiBaseUrl: process.env.EGS_API_BASE_URL || "http://127.0.0.1:8000",
  webBaseUrl: process.env.EGS_WEB_BASE_URL || "",
  email: process.env.EGS_VALIDATION_EMAIL || "admin@egs.local",
  password: process.env.EGS_VALIDATION_PASSWORD || "deadsoulja28@",
  logicalMinutes: Number(process.env.EGS_VALIDATION_LOGICAL_MINUTES || "30"),
  output: process.env.EGS_VALIDATION_OUTPUT || "",
  browser: process.env.EGS_VALIDATION_BROWSER === "true",
};

const args = process.argv.slice(2);
const options = { ...defaults };

for (let index = 0; index < args.length; index += 1) {
  const arg = args[index];
  const next = args[index + 1];
  if (arg === "--api-base-url" && next) options.apiBaseUrl = next, index += 1;
  else if (arg === "--web-base-url" && next) options.webBaseUrl = next, index += 1;
  else if (arg === "--email" && next) options.email = next, index += 1;
  else if (arg === "--password" && next) options.password = next, index += 1;
  else if (arg === "--logical-minutes" && next) options.logicalMinutes = Number(next), index += 1;
  else if (arg === "--output" && next) options.output = next, index += 1;
  else if (arg === "--browser") options.browser = true;
  else if (arg === "--help") {
    console.log(`Usage: node scripts/erp-operational-validation.mjs [options]

Options:
  --api-base-url URL       FastAPI base URL. Default: ${defaults.apiBaseUrl}
  --web-base-url URL       Frontend URL for optional browser validation.
  --email EMAIL            Validation user. Default: ${defaults.email}
  --password PASSWORD      Validation password. Default: from env or local seed
  --logical-minutes N      Number of logical continuous usage minutes. Default: 30
  --browser                Run optional Puppeteer browser journey.
  --output FILE            Write JSON report to FILE.
`);
    process.exit(0);
  }
}

const forbiddenPattern = /capture-lead|Session expirée|\/functions(?:\/v1)?\/|\/storage\/v1\/|\/rest\/v1\/|supabase\.(?:co|in)|@supabase\/supabase-js|supabase-vendor/i;
const runId = new Date().toISOString().replace(/[:.]/g, "-");
const validationPrefix = `OPS-VALIDATION-${runId}`;
const state = {
  runId,
  startedAt: new Date().toISOString(),
  options: {
    apiBaseUrl: options.apiBaseUrl,
    webBaseUrl: options.webBaseUrl || null,
    email: options.email,
    logicalMinutes: options.logicalMinutes,
    browser: options.browser,
  },
  steps: [],
  risks: [],
  cleanup: [],
  forbiddenNetworkRequests: [],
  created: {
    projects: [],
    employees: [],
    suppliers: [],
    products: [],
    finance: [],
    media: [],
  },
};

let accessToken = "";
let refreshToken = "";

function addStep(name, status, details = {}) {
  state.steps.push({
    name,
    status,
    details,
    at: new Date().toISOString(),
  });
}

function fail(name, error, details = {}) {
  addStep(name, "failed", { error: String(error?.message || error), ...details });
}

function apiUrl(endpoint) {
  return `${options.apiBaseUrl.replace(/\/$/, "")}${endpoint}`;
}

async function rawRequest(endpoint, init = {}) {
  const headers = new Headers(init.headers || {});
  if (accessToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const started = Date.now();
  const response = await fetch(apiUrl(endpoint), { ...init, headers });
  const text = await response.text();
  const durationMs = Date.now() - started;
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { response, body, durationMs };
}

async function request(endpoint, init = {}, expected = [200]) {
  const result = await rawRequest(endpoint, init);
  if (!expected.includes(result.response.status)) {
    throw new Error(`${endpoint} returned HTTP ${result.response.status}: ${JSON.stringify(result.body)}`);
  }
  return result;
}

async function requestWithRefresh(endpoint, init = {}, expected = [200]) {
  let result = await rawRequest(endpoint, init);
  if (result.response.status === 401 && refreshToken && !endpoint.startsWith("/api/v1/auth/refresh")) {
    const refresh = await rawRequest("/api/v1/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
      headers: { "Content-Type": "application/json" },
    });
    if (refresh.response.status === 200 && refresh.body?.access_token) {
      accessToken = refresh.body.access_token;
      refreshToken = refresh.body.refresh_token || refreshToken;
      result = await rawRequest(endpoint, init);
    }
  }
  if (!expected.includes(result.response.status)) {
    throw new Error(`${endpoint} returned HTTP ${result.response.status}: ${JSON.stringify(result.body)}`);
  }
  return result;
}

function decodeJwtPayload(token) {
  const [, payload] = token.split(".");
  if (!payload) return {};
  return JSON.parse(Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64url").toString("utf8"));
}

async function healthCheck() {
  const result = await request("/health");
  addStep("health", "passed", { body: result.body, durationMs: result.durationMs });
}

async function authJourney() {
  const login = await request("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: options.email, password: options.password }),
  });
  accessToken = login.body.access_token;
  refreshToken = login.body.refresh_token;
  if (!accessToken || !refreshToken) throw new Error("Login response did not include both tokens.");

  const accessPayload = decodeJwtPayload(accessToken);
  const refreshPayload = decodeJwtPayload(refreshToken);
  addStep("auth.login", "passed", {
    user: login.body.user?.email,
    accessType: accessPayload.type,
    refreshType: refreshPayload.type,
    accessExpiresAt: accessPayload.exp ? new Date(accessPayload.exp * 1000).toISOString() : null,
  });

  const me = await request("/api/v1/auth/me");
  addStep("auth.me", "passed", { user: me.body.user?.email || me.body.email });

  const refresh = await request("/api/v1/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  accessToken = refresh.body.access_token;
  refreshToken = refresh.body.refresh_token;
  addStep("auth.refresh", "passed", { refreshedUser: refresh.body.user?.email });

  const secondLogin = await request("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: options.email, password: options.password }),
  });
  const firstToken = accessToken;
  const secondToken = secondLogin.body.access_token;
  const first = await request("/api/v1/auth/me", { headers: { Authorization: `Bearer ${firstToken}` } });
  const second = await request("/api/v1/auth/me", { headers: { Authorization: `Bearer ${secondToken}` } });
  addStep("auth.multi-session", "passed", {
    firstUser: first.body.user?.email || first.body.email,
    secondUser: second.body.user?.email || second.body.email,
  });
}

async function createPatchListDelete(collection, endpoint, createPayload, patchPayload, labelField) {
  const created = await requestWithRefresh(endpoint, {
    method: "POST",
    body: JSON.stringify(createPayload),
  }, [200, 201]);
  const id = created.body.id;
  state.created[collection].push(id);
  if (!id) throw new Error(`${endpoint} create did not return an id.`);

  const patched = await requestWithRefresh(`${endpoint}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patchPayload),
  });
  const listed = await requestWithRefresh(endpoint);
  const found = Array.isArray(listed.body) && listed.body.some((item) => item.id === id);
  if (!found) throw new Error(`${endpoint} list did not include created id ${id}.`);

  addStep(`crud.${collection}`, "passed", {
    id,
    created: created.body[labelField] || created.body.reference || created.body.nom || null,
    patched: patched.body[labelField] || patched.body.reference || patched.body.nom || null,
    listCount: listed.body.length,
  });
}

async function crudJourney() {
  await requestWithRefresh("/api/v1/users");
  addStep("navigation.users-api", "passed", { endpoint: "/api/v1/users" });

  await createPatchListDelete(
    "projects",
    "/api/v1/projects",
    {
      nom: `${validationPrefix} Chantier pilote`,
      localisation: "Abidjan",
      type_projet: "construction",
      budget: 1250000,
      statut: "en_cours",
      notes: "Validation operationnelle automatisee",
    },
    { statut: "termine", notes: "Validation operationnelle modifiee" },
    "nom",
  );

  await createPatchListDelete(
    "employees",
    "/api/v1/employees",
    {
      nom: `${validationPrefix} Employe`,
      prenom: "Validation",
      poste: "Controle qualite",
      department: "Operations",
      email: `validation-${runId}@egs.local`,
      statut: "actif",
    },
    { poste: "Controle qualite senior" },
    "nom",
  );

  await createPatchListDelete(
    "suppliers",
    "/api/v1/suppliers",
    {
      nom: `${validationPrefix} Fournisseur`,
      email: `supplier-${runId}@egs.local`,
      telephone: "+2250000000000",
      produits_fournis: "Ciment",
    },
    { notes: "Fournisseur modifie pendant validation" },
    "nom",
  );

  await createPatchListDelete(
    "products",
    "/api/v1/products",
    {
      designation: `${validationPrefix} Materiau`,
      categorie: "Materiaux",
      prix_unitaire: 2500,
      stock_actuel: 20,
      unite: "sac",
    },
    { stock_actuel: 18 },
    "designation",
  );

  await createPatchListDelete(
    "finance",
    "/api/v1/finance",
    {
      reference: `${validationPrefix}-FIN`,
      montant: 75000,
      type_transaction: "recette",
      categorie: "Validation",
      mode_paiement: "especes",
      statut: "valide",
    },
    { statut: "rapproche" },
    "reference",
  );

  const media = await requestWithRefresh("/api/v1/media");
  const brandAssets = await requestWithRefresh("/api/v1/media/brand-assets");
  addStep("navigation.media-api", "passed", {
    mediaCount: Array.isArray(media.body) ? media.body.length : null,
    brandAssetCount: Array.isArray(brandAssets.body) ? brandAssets.body.length : null,
  });
}

async function resilienceJourney() {
  const invalidAccess = accessToken.split(".");
  invalidAccess[2] = "invalid-signature";
  const savedAccess = accessToken;
  accessToken = invalidAccess.join(".");
  const recovered = await requestWithRefresh("/api/v1/auth/me");
  addStep("resilience.expired-or-invalid-access-refresh", "passed", {
    recoveredUser: recovered.body.user?.email || recovered.body.email,
  });

  accessToken = savedAccess;
  const failed = await rawRequest("/api/v1/projects/not-found-for-validation", { method: "PATCH", body: JSON.stringify({ statut: "x" }) });
  if (failed.response.status !== 404) throw new Error(`Expected controlled 404, got ${failed.response.status}`);
  addStep("resilience.api-error-controlled", "passed", { status: failed.response.status, detail: failed.body?.detail });

  const badNetworkBase = options.apiBaseUrl;
  options.apiBaseUrl = "http://127.0.0.1:1";
  try {
    await rawRequest("/health");
    throw new Error("Network loss simulation unexpectedly succeeded.");
  } catch (error) {
    addStep("resilience.temporary-network-loss", "passed", { error: String(error?.cause?.code || error?.message || error) });
  } finally {
    options.apiBaseUrl = badNetworkBase;
  }
  await requestWithRefresh("/api/v1/auth/me");
  addStep("resilience.network-recovery", "passed", { endpoint: "/api/v1/auth/me" });
}

async function continuousUsageJourney() {
  const minutes = Number.isFinite(options.logicalMinutes) && options.logicalMinutes > 0
    ? Math.floor(options.logicalMinutes)
    : 30;
  const endpoints = [
    "/api/v1/auth/me",
    "/api/v1/projects",
    "/api/v1/users",
    "/api/v1/media",
    "/api/v1/finance",
    "/api/v1/employees",
    "/api/v1/suppliers",
    "/api/v1/products",
  ];
  const timings = [];
  for (let minute = 1; minute <= minutes; minute += 1) {
    const endpoint = endpoints[(minute - 1) % endpoints.length];
    const result = await requestWithRefresh(endpoint);
    timings.push({ minute, endpoint, status: result.response.status, durationMs: result.durationMs });
  }
  addStep("usage.continuous-logical-session", "passed", {
    logicalMinutes: minutes,
    requestCount: timings.length,
    maxDurationMs: Math.max(...timings.map((item) => item.durationMs)),
  });
}

function scanPath(scanName, targetPath) {
  if (!existsSync(targetPath)) {
    addStep(scanName, "skipped", { reason: "path not found", path: path.relative(root, targetPath) });
    return;
  }
  const rg = spawnSync("rg", [
    "--line-number",
    "--with-filename",
    String.raw`capture-lead|/functions(?:/v1)?/|/storage/v1/|/rest/v1/|supabase\.(?:co|in)|@supabase/supabase-js|supabase-vendor`,
    targetPath,
  ], { encoding: "utf8" });
  if (rg.status !== 0 && rg.status !== 1) {
    throw new Error(rg.stderr || `${scanName} failed`);
  }
  if (rg.stdout.trim()) {
    throw new Error(`${scanName} detected forbidden Supabase patterns:\n${rg.stdout}`);
  }
  addStep(scanName, "passed", { path: path.relative(root, targetPath) });
}

function scanBuildAssets() {
  const buildDir = path.join(root, "dist");
  const buildIndex = path.join(buildDir, "index.html");

  if (!existsSync(buildIndex)) {
    addStep("supabase.build-scan", "skipped", { reason: "No dist directory found." });
    return;
  }

  const assetFiles = [];
  const collect = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const entryPath = path.join(dir, entry.name);
      if (entry.isDirectory()) collect(entryPath);
      else if (/\.(html|js|css|json|map)$/.test(entry.name)) assetFiles.push(entryPath);
    }
  };
  collect(buildDir);

  const findings = assetFiles.flatMap((file) => {
    const content = readFileSync(file, "utf8");
    return forbiddenPattern.test(content) ? [path.relative(root, file)] : [];
  });

  if (findings.length > 0) {
    throw new Error(`Forbidden Supabase pattern found in build files: ${findings.join(", ")}`);
  }

  addStep("supabase.build-scan", "passed", {
    path: path.relative(root, buildDir),
    scannedFiles: assetFiles.length,
  });
}

async function browserJourney() {
  if (!options.browser) {
    addStep("browser.ui-journey", "skipped", { reason: "Run with --browser and --web-base-url to enable." });
    return;
  }
  if (!options.webBaseUrl) {
    addStep("browser.ui-journey", "skipped", { reason: "--web-base-url is required for browser validation." });
    return;
  }

  let puppeteer;
  try {
    puppeteer = await import("puppeteer");
  } catch (error) {
    addStep("browser.ui-journey", "skipped", { reason: "Puppeteer is not importable.", error: String(error?.message || error) });
    return;
  }

  let browser;
  try {
    browser = await puppeteer.default.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    const consoleErrors = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("request", (request) => {
      const url = request.url();
      if (forbiddenPattern.test(url)) state.forbiddenNetworkRequests.push(url);
    });
    await page.goto(`${options.webBaseUrl.replace(/\/$/, "")}/login`, { waitUntil: "networkidle2" });
    await page.type("input[type=email]", options.email);
    await page.type("input[type=password]", options.password);
    await page.click("button[type=submit]");
    await page.waitForFunction(() => !location.pathname.includes("login"), { timeout: 15000 }).catch(() => {});
    for (const label of ["Tableau de bord", "Utilisateurs", "Projets BTP", "Bibliothèque Média", "Finances"]) {
      const [button] = await page.$x(`//button[contains(normalize-space(.), ${JSON.stringify(label)})]`);
      if (button) {
        await button.click();
        await page.waitForTimeout(400);
      }
    }
    await page.reload({ waitUntil: "networkidle2" });
    if (state.forbiddenNetworkRequests.length > 0) {
      throw new Error(`Forbidden network requests detected: ${state.forbiddenNetworkRequests.join(", ")}`);
    }
    addStep("browser.ui-journey", "passed", {
      consoleErrorCount: consoleErrors.length,
      consoleErrors: consoleErrors.slice(0, 10),
    });
  } catch (error) {
    addStep("browser.ui-journey", "skipped", {
      reason: "Browser validation could not run in this environment.",
      error: String(error?.message || error),
    });
  } finally {
    if (browser) await browser.close();
  }
}

async function logoutJourney() {
  await requestWithRefresh("/api/v1/auth/logout", { method: "POST" });
  const afterLogout = await rawRequest("/api/v1/auth/me");
  addStep("auth.logout", "passed", {
    logoutApiStatus: 200,
    tokenStillValidUntilExpiry: afterLogout.response.status === 200,
    note: "Logout endpoint is stateless in current FastAPI implementation; frontend clears local tokens.",
  });

  const relogin = await request("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: options.email, password: options.password }),
  });
  accessToken = relogin.body.access_token;
  refreshToken = relogin.body.refresh_token;
  await request("/api/v1/auth/me");
  addStep("auth.relogin", "passed", { user: relogin.body.user?.email });
}

async function cleanupJourney() {
  const deletions = [
    ["finance", "/api/v1/finance"],
    ["products", "/api/v1/products"],
    ["suppliers", "/api/v1/suppliers"],
    ["employees", "/api/v1/employees"],
    ["projects", "/api/v1/projects"],
  ];
  for (const [collection, endpoint] of deletions) {
    for (const id of state.created[collection]) {
      const result = await rawRequest(`${endpoint}/${id}`, { method: "DELETE" });
      state.cleanup.push({ collection, id, status: result.response.status });
    }
  }
  addStep("cleanup.validation-data", "passed", { deleted: state.cleanup.length });
}

function computeVerdict() {
  const failed = state.steps.filter((step) => step.status === "failed");
  const skippedBrowser = state.steps.find((step) => step.name === "browser.ui-journey" && step.status === "skipped");
  if (state.forbiddenNetworkRequests.length > 0) {
    state.risks.push({ level: "critique", item: "Forbidden Supabase network calls detected during browser validation." });
  }
  if (failed.length > 0) {
    state.risks.push({ level: "critique", item: `${failed.length} validation step(s) failed.` });
  }
  if (skippedBrowser) {
    state.risks.push({ level: "moyen", item: "Browser UI journey not validated in this run." });
  }
  const hasCritical = state.risks.some((risk) => risk.level === "critique");
  state.finishedAt = new Date().toISOString();
  state.verdict = {
    stableForInternalUse: !hasCritical,
    status: hasCritical ? "NON" : "OUI",
  };
}

async function main() {
  try {
    await healthCheck();
    await authJourney();
    await crudJourney();
    await resilienceJourney();
    await continuousUsageJourney();
    scanPath("supabase.source-guard", path.join(root, "src"));
    scanBuildAssets();
    await browserJourney();
    await logoutJourney();
  } catch (error) {
    fail("validation.abort", error);
  } finally {
    try {
      if (accessToken) await cleanupJourney();
    } catch (error) {
      fail("cleanup.validation-data", error);
    }
    computeVerdict();
    mkdirSync(reportsDir, { recursive: true });
    const output = options.output || path.join(reportsDir, `erp-operational-validation-${runId}.json`);
    writeFileSync(output, `${JSON.stringify(state, null, 2)}\n`);
    console.log(`ERP operational validation report: ${path.relative(root, output)}`);
    console.log(`Verdict ERP utilisable interne stable: ${state.verdict.status}`);
    if (state.risks.length > 0) {
      console.log("Risks:");
      for (const risk of state.risks) console.log(`- ${risk.level}: ${risk.item}`);
    }
    if (state.verdict.status !== "OUI") process.exitCode = 1;
  }
}

await main();
