#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { lstat, readFile, readlink, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const versionFile = path.join(root, 'VERSION.json');
const distVersionFile = path.join(dist, 'VERSION.json');

function git(args, options = {}) {
  return execFileSync('git', args, {
    cwd: root,
    encoding: options.encoding ?? 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function hashBytes(value) {
  return createHash('sha256').update(value).digest('hex');
}

async function listFiles(directory, relative = '') {
  const entries = await readdir(path.join(directory, relative), { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryRelative = path.posix.join(relative.split(path.sep).join('/'), entry.name);
    const absolute = path.join(directory, entryRelative);
    if (entry.isDirectory()) {
      files.push(...await listFiles(directory, entryRelative));
    } else {
      files.push({ absolute, relative: entryRelative });
    }
  }

  return files;
}

async function hashFiles(files) {
  const hash = createHash('sha256');
  const sorted = [...files].sort((a, b) => a.relative.localeCompare(b.relative));

  for (const file of sorted) {
    const stats = await lstat(file.absolute);
    hash.update(file.relative);
    hash.update('\0');
    if (stats.isSymbolicLink()) {
      hash.update('symlink\0');
      hash.update(await readlink(file.absolute));
    } else {
      hash.update('file\0');
      hash.update(await readFile(file.absolute));
    }
    hash.update('\0');
  }

  return hash.digest('hex');
}

async function workspaceState() {
  const trackedDiff = git([
    'diff', 'HEAD', '--binary', '--',
    '.', ':(exclude)VERSION.json', ':(exclude)dist/**',
  ], { encoding: 'buffer' });
  const untrackedPaths = git(['ls-files', '--others', '--exclude-standard', '-z'], { encoding: 'buffer' })
    .toString('utf8')
    .split('\0')
    .filter(Boolean)
    .filter((relative) => relative !== 'VERSION.json' && !relative.startsWith('dist/'))
    .sort((a, b) => a.localeCompare(b));
  const hash = createHash('sha256');
  hash.update(trackedDiff);

  for (const relative of untrackedPaths) {
    const absolute = path.join(root, relative);
    const stats = await lstat(absolute);
    hash.update(relative);
    hash.update('\0');
    if (stats.isSymbolicLink()) {
      hash.update('symlink\0');
      hash.update(await readlink(absolute));
    } else {
      hash.update('file\0');
      hash.update(await readFile(absolute));
    }
    hash.update('\0');
  }

  return {
    dirty: trackedDiff.length > 0 || untrackedPaths.length > 0,
    hash: hash.digest('hex'),
  };
}

async function main() {
  const indexPath = path.join(dist, 'index.html');
  const indexHtml = await readFile(indexPath);
  const buildHash = hashBytes(indexHtml);
  const artifactFiles = (await listFiles(dist)).filter((file) => file.relative !== 'VERSION.json');
  const artifactHash = await hashFiles(artifactFiles);
  const workspace = await workspaceState();
  const gitCommit = git(['rev-parse', '--verify', 'HEAD']).trim();
  let branch = 'detached';

  try {
    branch = git(['symbolic-ref', '--quiet', '--short', 'HEAD']).trim();
  } catch {
    // Detached HEAD is represented explicitly; git_commit remains authoritative.
  }

  const manifest = {
    application: 'EGS ERP',
    git_commit: gitCommit,
    branch,
    build_date: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
    build_hash: buildHash,
    environment: 'production',
    workspace_dirty: workspace.dirty,
    workspace_hash: workspace.hash,
    artifact_hash: artifactHash,
  };
  const json = `${JSON.stringify(manifest, null, 2)}\n`;

  await writeFile(distVersionFile, json);
  await writeFile(versionFile, json);
  process.stdout.write(`${distVersionFile}\n`);
}

main().catch((error) => {
  process.stderr.write(`VERSION.json generation failed: ${error.message}\n`);
  process.exitCode = 1;
});
