import { describe, expect, it } from 'vitest';
import { resolveApiBaseUrl } from './client';

describe('resolveApiBaseUrl', () => {
  it('uses the Vite proxy for local frontend development', () => {
    expect(resolveApiBaseUrl('http://localhost:8000/api/v1', 'http://localhost:5173')).toBe('/api/v1');
    expect(resolveApiBaseUrl('http://localhost:8000/api/v1', 'http://127.0.0.1:5173')).toBe('/api/v1');
  });

  it('keeps the configured absolute URL outside local dev', () => {
    expect(resolveApiBaseUrl('https://api.gnambaservices.ci/api/v1', 'https://gnambaservices.ci')).toBe('https://api.gnambaservices.ci/api/v1');
  });
});
