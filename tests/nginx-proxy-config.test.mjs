import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const templatePath = path.join(__dirname, '..', 'nginx', 'nginx-release.conf');
const template = readFileSync(templatePath, 'utf8');

test('nginx proxy uses configurable backend upstream instead of localhost', () => {
  assert.match(
    template,
    /upstream backend_api \{\s*server \$\{BACKEND_API_HOST\}:\$\{BACKEND_API_PORT\};/s,
    'The nginx template should proxy /api requests to a configurable backend upstream',
  );
});
