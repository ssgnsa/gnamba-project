import express from "express";
import fs from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import jwt from "jsonwebtoken";
import morgan from "morgan";
import cors from "cors";
import crypto from "node:crypto";

const app = express();
const PORT = Number(process.env.PORT || 3000);
const WOPI_SECRET = process.env.WOPI_JWT_SECRET || "change-me";
const WOPI_API_KEY = process.env.WOPI_API_KEY || "change-me";
const WOPI_DOC_ROOT = process.env.WOPI_DOC_ROOT || "/srv/egs-docs";
const WOPI_BASE_URL = process.env.WOPI_BASE_URL || "http://localhost:3000";
const COLLABORA_URL = process.env.COLLABORA_URL || "http://127.0.0.1:9980";
const LOCK_DIR = path.join(WOPI_DOC_ROOT, ".wopi-locks");

app.use(morgan("combined"));
app.use(cors({ origin: true }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

async function ensureDirectories() {
  await fs.mkdir(WOPI_DOC_ROOT, { recursive: true });
  await fs.mkdir(LOCK_DIR, { recursive: true });
}

function errorResponse(res, status, message) {
  return res.status(status).json({ error: message });
}

function ensureApiKey(req, res, next) {
  const key = req.header("x-wopi-api-key") || req.query.api_key;
  if (!key || key !== WOPI_API_KEY) {
    return errorResponse(res, 401, "Invalid or missing WOPI API key");
  }
  return next();
}

function verifyToken(req, res, next) {
  const auth = req.header("authorization") || req.header("Authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : req.query.access_token;
  if (!token) return errorResponse(res, 401, "Missing WOPI token");

  try {
    const payload = jwt.verify(token, WOPI_SECRET);
    req.wopi = payload;
    return next();
  } catch (err) {
    return errorResponse(res, 401, "Invalid or expired WOPI token");
  }
}

function resolveFilePath(fileId) {
  let raw;
  try {
    raw = Buffer.from(fileId, "base64").toString("utf8");
  } catch (err) {
    throw new Error("Invalid fileId encoding");
  }
  const filePath = path.resolve(WOPI_DOC_ROOT, raw);
  if (!filePath.startsWith(path.resolve(WOPI_DOC_ROOT))) {
    throw new Error("Path traversal detected");
  }
  return filePath;
}

function getLockFilename(fileId) {
  const digest = crypto.createHash("sha256").update(fileId).digest("hex");
  return path.join(LOCK_DIR, `${digest}.json`);
}

async function readLock(fileId) {
  const lockFile = getLockFilename(fileId);
  try {
    const content = await fs.readFile(lockFile, "utf8");
    const lock = JSON.parse(content);
    if (lock.expiresAt && Date.now() > lock.expiresAt) {
      await fs.unlink(lockFile).catch(() => {});
      return null;
    }
    return lock;
  } catch (err) {
    return null;
  }
}

async function writeLock(fileId, lockValue, userId) {
  const lockFile = getLockFilename(fileId);
  const lock = {
    fileId,
    lock: lockValue,
    owner: userId || "unknown",
    createdAt: Date.now(),
    expiresAt: Date.now() + 15 * 60 * 1000,
  };
  await fs.writeFile(lockFile, JSON.stringify(lock), "utf8");
  return lock;
}

async function deleteLock(fileId) {
  const lockFile = getLockFilename(fileId);
  await fs.unlink(lockFile).catch(() => {});
}

function getRequestedLock(req) {
  const lock = req.header("x-wopi-lock") || req.query.lock || null;
  if (!lock) throw new Error("Missing X-WOPI-Lock header");
  return lock;
}

app.get("/health", async (req, res) => {
  res.status(200).json({ status: "ok", root: WOPI_DOC_ROOT });
});

app.get("/wopi/files/:fileId", verifyToken, async (req, res) => {
  try {
    const fileId = req.params.fileId;
    const filePath = resolveFilePath(fileId);
    await fs.access(filePath, constants.F_OK);
    const stat = await fs.stat(filePath);
    const fileName = path.basename(filePath);

    return res.json({
      BaseFileName: fileName,
      OwnerId: "egs",
      Size: stat.size,
      Version: stat.mtimeMs.toString(),
      UserId: req.wopi?.sub || "anonymous",
      UserFriendlyName: req.wopi?.name || "Utilisateur EGS",
      UserCanWrite: true,
      SupportsLocks: true,
      WOPIUrl: `${WOPI_BASE_URL}/wopi/files/${fileId}`,
      HostAuthenticationProperty: "WOPI-JWT",
      CloseUrl: `${WOPI_BASE_URL}/close`,
    });
  } catch (err) {
    return errorResponse(res, 404, err.message || "Unable to read file");
  }
});

app.get("/wopi/files/:fileId/contents", verifyToken, async (req, res) => {
  try {
    const fileId = req.params.fileId;
    const filePath = resolveFilePath(fileId);
    await fs.access(filePath, constants.R_OK);
    return res.sendFile(filePath);
  } catch (err) {
    return errorResponse(res, 404, err.message || "Unable to read file contents");
  }
});

app.post("/wopi/files/:fileId/token", ensureApiKey, async (req, res) => {
  try {
    const fileId = req.params.fileId;
    const payload = {
      sub: req.body.userId || "anonymous",
      name: req.body.name || "Utilisateur EGS",
      fileId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 30 * 60,
    };
    const token = jwt.sign(payload, WOPI_SECRET);
    const wopiSrc = `${WOPI_BASE_URL}/wopi/files/${encodeURIComponent(fileId)}`;
    return res.json({ access_token: token, WOPISrc: wopiSrc });
  } catch (err) {
    return errorResponse(res, 500, err.message || "Unable to create WOPI token");
  }
});

app.get("/wopi/files/:fileId/open", ensureApiKey, async (req, res) => {
  try {
    const fileId = req.params.fileId;
    const payload = {
      sub: req.query.userId || "anonymous",
      name: req.query.name || "Utilisateur EGS",
      fileId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 30 * 60,
    };
    const accessToken = jwt.sign(payload, WOPI_SECRET);
    const wopiSrc = encodeURIComponent(`${WOPI_BASE_URL}/wopi/files/${encodeURIComponent(fileId)}`);
    const openUrl = `${COLLABORA_URL}/loleaflet/2.0.0/loleaflet.html?WOPISrc=${wopiSrc}&access_token=${accessToken}`;
    return res.json({ openUrl });
  } catch (err) {
    return errorResponse(res, 500, err.message || "Unable to create WOPI open URL");
  }
});

app.put("/wopi/files/:fileId/contents", verifyToken, express.raw({ type: "*/*", limit: "200mb" }), async (req, res) => {
  try {
    const fileId = req.params.fileId;
    const filePath = resolveFilePath(fileId);
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, req.body);
    await deleteLock(fileId);
    return res.status(200).send();
  } catch (err) {
    return errorResponse(res, 500, err.message || "Unable to save file contents");
  }
});

app.get("/wopi/files/:fileId/lock", verifyToken, async (req, res) => {
  try {
    const fileId = req.params.fileId;
    const lock = await readLock(fileId);
    if (!lock) return res.status(204).send();
    return res.json(lock);
  } catch (err) {
    return errorResponse(res, 500, err.message || "Unable to read lock state");
  }
});

app.post(["/wopi/files/:fileId/lock", "/wopi/files/:fileId/unlock", "/wopi/files/:fileId/refreshLock"], verifyToken, async (req, res) => {
  try {
    const fileId = req.params.fileId;
    const existingLock = await readLock(fileId);
    const requestedLock = getRequestedLock(req);
    const userId = req.wopi?.sub || "anonymous";

    if (req.path.endsWith("/lock")) {
      if (existingLock && existingLock.lock !== requestedLock) {
        return res.status(409).set("X-WOPI-Lock", existingLock.lock).send();
      }
      const created = await writeLock(fileId, requestedLock, userId);
      return res.status(200).json(created);
    }

    if (req.path.endsWith("/unlock")) {
      if (!existingLock) return res.status(409).send();
      if (existingLock.lock !== requestedLock) return res.status(409).send();
      await deleteLock(fileId);
      return res.status(200).send();
    }

    if (req.path.endsWith("/refreshLock")) {
      if (!existingLock) return res.status(409).send();
      if (existingLock.lock !== requestedLock) return res.status(409).send();
      const refreshed = await writeLock(fileId, requestedLock, userId);
      return res.status(200).json(refreshed);
    }

    return errorResponse(res, 400, "Unsupported WOPI lock action");
  } catch (err) {
    return errorResponse(res, 500, err.message || "WOPI lock error");
  }
});

app.listen(PORT, async () => {
  await ensureDirectories();
  console.log(`WOPI Gateway listening on http://0.0.0.0:${PORT}`);
  console.log(`Document root: ${WOPI_DOC_ROOT}`);
});
