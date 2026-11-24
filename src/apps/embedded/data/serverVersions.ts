/**
 * serverVersions — the spec and dr CLI versions the shell footer shows (#573).
 *
 * Neither is the `version` the server puts at the top of its responses:
 * `GET /health`'s and `GET /api/spec`'s `version` are the API's own ("0.1.0",
 * whatever the CLI or spec), which the footer used to show as both.
 *
 * - Spec: `/api/spec`'s `schemas['manifest.json'].specVersion`, else any layer
 *   schema's `specVersion` (every bundled schema carries it).
 * - CLI: `/health`'s `cliVersion`. The API spec now requires it, but a dr CLI
 *   from before that change sends none, so the footer shows "—" rather than a
 *   made-up version.
 *
 * Both return undefined when the server sends nothing usable; until `/health`
 * answers, `useCliVersion`'s `state` says the CLI version is still loading (#636).
 */

import { useGethealth } from '../../../core/services/generatedApiClient';
import { loadStateOf, type LoadState } from './loadState';

function asVersion(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;
}

/** The spec version from an `/api/spec` payload, or undefined. */
export function specVersionOf(raw: unknown): string | undefined {
  const schemas = (raw as { schemas?: unknown } | null | undefined)?.schemas;
  if (!schemas || typeof schemas !== 'object') return undefined;
  const entries = schemas as Record<string, unknown>;
  const fromManifest = asVersion((entries['manifest.json'] as { specVersion?: unknown } | undefined)?.specVersion);
  if (fromManifest) return fromManifest;
  for (const entry of Object.values(entries)) {
    const v = asVersion((entry as { specVersion?: unknown } | null)?.specVersion);
    if (v) return v;
  }
  return undefined;
}

/** The dr CLI version from a `/health` payload (`cliVersion` only), or undefined. */
export function cliVersionOf(health: unknown): string | undefined {
  return asVersion((health as { cliVersion?: unknown } | null | undefined)?.cliVersion);
}

/**
 * The version of the dr CLI serving the viewer, when `/health` says, and the
 * read's load state: `version` undefined while `state` is `loading` means "not
 * answered yet" (`cli …`); once ready it means "the server sent none" (`cli —`).
 */
export function useCliVersion(): { version: string | undefined; state: LoadState } {
  const query = useGethealth();
  return { version: cliVersionOf(query.data), state: loadStateOf(query) };
}
