import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { resolveApiBaseUrl, apiClient } from './client';

describe('resolveApiBaseUrl', () => {
  it('uses the Vite proxy for local frontend development', () => {
    expect(resolveApiBaseUrl('http://localhost:8000/api/v1', 'http://localhost:5173')).toBe('/api/v1');
    expect(resolveApiBaseUrl('http://localhost:8000/api/v1', 'http://127.0.0.1:5173')).toBe('/api/v1');
  });

  it('keeps the configured absolute URL outside local dev', () => {
    expect(resolveApiBaseUrl('https://api.gnambaservices.ci/api/v1', 'https://gnambaservices.ci')).toBe('https://api.gnambaservices.ci/api/v1');
  });

  it('prevents mixed-content API calls from HTTPS pages', () => {
    expect(resolveApiBaseUrl('http://192.168.1.58:8000/api/v1', 'https://gnambaservices.ci')).toBe('/api/v1');
  });

  it('falls back to same-origin API from a LAN origin served over HTTP', () => {
    expect(resolveApiBaseUrl('https://api.gnambaservices.ci/api/v1', 'http://192.168.1.58')).toBe('/api/v1');
    expect(resolveApiBaseUrl('https://api.gnambaservices.ci/api/v1', 'http://10.0.0.5:5173')).toBe('/api/v1');
    expect(resolveApiBaseUrl('https://api.gnambaservices.ci/api/v1', 'http://172.16.0.1:5173')).toBe('/api/v1');
  });

  it('keeps the configured absolute URL for localhost origins', () => {
    expect(resolveApiBaseUrl('https://api.gnambaservices.ci/api/v1', 'http://localhost:5173')).toBe('https://api.gnambaservices.ci/api/v1');
    expect(resolveApiBaseUrl('https://api.gnambaservices.ci/api/v1', 'http://127.0.0.1:5173')).toBe('https://api.gnambaservices.ci/api/v1');
  });
});

describe('apiClient transport guard on LAN origins', () => {
  let originDescriptor: PropertyDescriptor;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    originDescriptor = Object.getOwnPropertyDescriptor(window, 'location')!;
    fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: null, error: null }), { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchMock);
    apiClient['accessToken'] = null;
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', originDescriptor);
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  const setOrigin = (origin: string) => {
    Object.defineProperty(window, 'location', {
      ...originDescriptor,
      get: () => ({ origin, hostname: new URL(origin).hostname, protocol: new URL(origin).protocol }),
    });
  };

  it('allows auth requests from a LAN origin served over HTTP', async () => {
    setOrigin('http://192.168.1.58');
    apiClient['baseUrl'] = '/api/v1';

    await apiClient.auth.me();

    expect(fetchMock).toHaveBeenCalled();
  });

  it('rejects auth requests from a public origin served over HTTP', async () => {
    setOrigin('http://example.com');
    apiClient['baseUrl'] = 'https://api.gnambaservices.ci/api/v1';

    const result = await apiClient.auth.me();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.error).toContain('HTTPS est obligatoire');
    expect(result.data).toBeNull();
  });
});
