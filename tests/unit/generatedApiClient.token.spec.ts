// @vitest-environment happy-dom
/**
 * The generated API client sends the token stored when the request is made, not
 * the one stored when the module was imported. The client is created on import,
 * before main.tsx stores a magic link's new token, so a cached token from an
 * older server was sent (and refused with 403) on every request until a reload.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe('generated ApiClient — auth token', () => {
  it('uses a token stored after the module was imported', async () => {
    localStorage.setItem('dr_auth_token', 'dr-old-server-token');
    vi.resetModules();
    const { getApiClient } = await import('@/core/services/generatedApiClient');

    // main.tsx stores the magic link's token after its imports have run.
    localStorage.setItem('dr_auth_token', 'dr-new-server-token');

    const fetchMock = vi.fn(async (_url: string, _init: RequestInit) => new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    await getApiClient().getapichangesets();

    const init = fetchMock.mock.calls[0][1];
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer dr-new-server-token');
  });

  it('still prefers a token set explicitly with setToken', async () => {
    localStorage.setItem('dr_auth_token', 'dr-stored');
    vi.resetModules();
    const { getApiClient, setApiToken } = await import('@/core/services/generatedApiClient');
    setApiToken('dr-explicit');

    const fetchMock = vi.fn(async (_url: string, _init: RequestInit) => new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    await getApiClient().getapichangesets();

    const init = fetchMock.mock.calls[0][1];
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer dr-explicit');
  });
});
