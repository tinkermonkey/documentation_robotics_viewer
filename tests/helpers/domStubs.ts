/**
 * happy-dom / jsdom gap stubs for component tests.
 *
 * happy-dom omits several browser APIs that the Heimdall components touch at
 * mount (GraphCanvas measures nodes via ResizeObserver; ChatContainer observes
 * intersection for the scroll affordance; overlays call scrollIntoView; the
 * responsive seed reads matchMedia). None of these affect OUR composition
 * logic, so we no-op them so the real components mount without throwing.
 *
 * Installed idempotently — calling `installDomStubs()` more than once is safe.
 * The global Vitest setup invokes it once for the whole suite (see setup.ts);
 * pure-function (node-env) tests never load this module.
 */

class StubObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): unknown[] {
    return [];
  }
}

function define(target: object, key: string, value: unknown): void {
  Object.defineProperty(target, key, {
    value,
    writable: true,
    configurable: true,
  });
}

export function installDomStubs(): void {
  if (typeof globalThis === 'undefined') return;

  // ── ResizeObserver / IntersectionObserver ────────────────────────────────
  if (typeof (globalThis as Record<string, unknown>).ResizeObserver === 'undefined') {
    define(globalThis, 'ResizeObserver', StubObserver);
  }
  if (typeof (globalThis as Record<string, unknown>).IntersectionObserver === 'undefined') {
    define(globalThis, 'IntersectionObserver', StubObserver);
  }

  // ── matchMedia ────────────────────────────────────────────────────────────
  if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
    define(window, 'matchMedia', (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }));
  }

  // ── Element scroll helpers (overlays / chat thread call these) ─────────────
  if (typeof Element !== 'undefined') {
    if (typeof Element.prototype.scrollIntoView !== 'function') {
      define(Element.prototype, 'scrollIntoView', function scrollIntoView() {});
    }
    if (typeof Element.prototype.scrollTo !== 'function') {
      define(Element.prototype, 'scrollTo', function scrollTo() {});
    }
  }
  if (typeof window !== 'undefined' && typeof window.scrollTo !== 'function') {
    define(window, 'scrollTo', () => {});
  }
}
