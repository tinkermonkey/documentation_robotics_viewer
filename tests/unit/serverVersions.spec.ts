/**
 * serverVersions.spec.ts — the spec and dr CLI versions the shell footer shows
 * (#573): never the API's own `version`, "—" (undefined here) when absent.
 */

import { describe, it, expect } from 'vitest';

import { cliVersionOf, specVersionOf } from '@/apps/embedded/data/serverVersions';
import spec from '../fixtures/spec.json';

describe('serverVersions', () => {
  it("reads the spec version from the spec manifest, not the response's version", () => {
    const payload = {
      version: '0.1.0',
      schemas: {
        'api.json': { specVersion: '0.12.9' },
        'manifest.json': { specVersion: '0.13.0', totals: {} },
      },
    };
    expect(specVersionOf(payload)).toBe('0.13.0');
    // No manifest: any schema's specVersion (they all carry the same one).
    expect(specVersionOf({ version: '0.1.0', schemas: { 'analyzers/cbm.json': { version: '0.13.0' }, 'ux.json': { specVersion: '0.13.0' } } })).toBe('0.13.0');
    // The captured fixture has no manifest.json; its schemas say 0.8.4, its payload 0.1.0.
    expect(spec.version).toBe('0.1.0');
    expect(specVersionOf(spec)).toBe('0.8.4');
    // Nothing usable: undefined, never the payload's version.
    expect(specVersionOf({ version: '0.1.0', schemas: {} })).toBeUndefined();
    expect(specVersionOf({ version: '0.1.0', schemas: { 'x.json': { specVersion: '' } } })).toBeUndefined();
    expect(specVersionOf(undefined)).toBeUndefined();
    expect(specVersionOf(null)).toBeUndefined();
  });

  it("never takes /health's API version for the CLI's", () => {
    expect(cliVersionOf({ status: 'ok', version: '0.1.0' })).toBeUndefined();
    expect(cliVersionOf({ status: 'ok', version: '0.1.0', cliVersion: '0.5.0' })).toBe('0.5.0');
    expect(cliVersionOf({ status: 'ok', cliVersion: 5 })).toBeUndefined();
    expect(cliVersionOf({ status: 'ok', cliVersion: '  ' })).toBeUndefined();
    expect(cliVersionOf(undefined)).toBeUndefined();
  });
});
