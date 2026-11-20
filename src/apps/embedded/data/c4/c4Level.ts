/**
 * The C4 levels the Architecture view draws. Dependency-free on purpose, so
 * `uiStore` can name a level without importing the transform (as
 * `followDepth.ts` does for the inspector's follow depth).
 */
export type C4Level = 'context' | 'container' | 'component';

export const C4_LEVELS: readonly C4Level[] = ['context', 'container', 'component'];

/** A level from untyped input (a URL param), or null. */
export function parseC4Level(value: unknown): C4Level | null {
  return typeof value === 'string' && (C4_LEVELS as readonly string[]).includes(value) ? (value as C4Level) : null;
}
