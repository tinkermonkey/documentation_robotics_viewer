/**
 * Controllable MockWebSocket for transport-boundary testing.
 *
 * The infra under test (`WebSocketClient`, `JsonRpcHandler`, `ChatService`)
 * is exercised for real; only the global `WebSocket` constructor is replaced
 * with this fake. Tests assign `globalThis.WebSocket = MockWebSocket`, drive
 * the lifecycle via `simulateOpen/Message/Error/Close`, and inspect captured
 * frames via `sent` / the static `instances` registry.
 *
 * It mirrors the readyState constants the real client reads and binds its
 * handlers to the `onopen/onmessage/onerror/onclose` instance properties
 * exactly the way the browser WebSocket does, so the production code paths run
 * unmodified.
 */

export class MockWebSocket {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  readonly CONNECTING = MockWebSocket.CONNECTING;
  readonly OPEN = MockWebSocket.OPEN;
  readonly CLOSING = MockWebSocket.CLOSING;
  readonly CLOSED = MockWebSocket.CLOSED;

  /** Every constructed instance, in creation order (cleared by `resetMockWebSockets`). */
  static instances: MockWebSocket[] = [];

  url: string;
  protocols: string | string[] | undefined;
  readyState: number = MockWebSocket.CONNECTING;

  onopen: ((ev: Event) => void) | null = null;
  onmessage: ((ev: MessageEvent) => void) | null = null;
  onerror: ((ev: Event) => void) | null = null;
  onclose: ((ev: CloseEvent) => void) | null = null;

  /** Raw frames passed to `send()` (already JSON-stringified by the client). */
  readonly sentRaw: string[] = [];
  /** Frames passed to `send()`, parsed back to objects for convenient assertions. */
  readonly sent: unknown[] = [];

  /** Whether `close()` was invoked on this instance. */
  closed = false;

  constructor(url: string, protocols?: string | string[]) {
    this.url = url;
    this.protocols = protocols;
    MockWebSocket.instances.push(this);
  }

  send(data: string): void {
    this.sentRaw.push(data);
    try {
      this.sent.push(JSON.parse(data));
    } catch {
      this.sent.push(data);
    }
  }

  close(code?: number, reason?: string): void {
    this.closed = true;
    this.readyState = MockWebSocket.CLOSED;
    // The browser fires `onclose` asynchronously after `close()`; tests that
    // care about that path call `simulateClose` explicitly so behaviour stays
    // deterministic. We intentionally do NOT auto-fire here, matching the way
    // the client's own teardown detaches handlers before calling close().
    void code;
    void reason;
  }

  // ── Test driving hooks ────────────────────────────────────────────────────

  /** Transition to OPEN and fire the bound `onopen`. */
  simulateOpen(): void {
    this.readyState = MockWebSocket.OPEN;
    this.onopen?.(new Event('open'));
  }

  /** Deliver a frame; `data` is JSON-stringified if not already a string. */
  simulateMessage(data: unknown): void {
    const raw = typeof data === 'string' ? data : JSON.stringify(data);
    this.onmessage?.({ data: raw } as MessageEvent);
  }

  /** Fire the bound `onerror`. */
  simulateError(err?: unknown): void {
    this.onerror?.((err as Event) ?? new Event('error'));
  }

  /** Transition to CLOSED and fire the bound `onclose` with a close code. */
  simulateClose(code = 1006, reason = 'abnormal'): void {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.({ code, reason } as CloseEvent);
  }
}

/**
 * Install the mock as the global WebSocket; returns the previous constructor.
 *
 * happy-dom defines `globalThis.WebSocket` as a read-only accessor, so a plain
 * assignment throws — `Object.defineProperty` is used to override it for the
 * duration of a test.
 */
export function installMockWebSocket(): typeof globalThis.WebSocket | undefined {
  const previous = globalThis.WebSocket as typeof globalThis.WebSocket | undefined;
  Object.defineProperty(globalThis, 'WebSocket', {
    value: MockWebSocket,
    writable: true,
    configurable: true,
  });
  return previous;
}

/** Restore a previously-saved WebSocket constructor (or delete if there was none). */
export function restoreWebSocket(previous: typeof globalThis.WebSocket | undefined): void {
  if (previous) {
    Object.defineProperty(globalThis, 'WebSocket', {
      value: previous,
      writable: true,
      configurable: true,
    });
  } else {
    // @ts-expect-error — clean up the injected fake.
    delete globalThis.WebSocket;
  }
}

/** Clear the per-test instance registry. */
export function resetMockWebSockets(): void {
  MockWebSocket.instances = [];
}

/** The most recently constructed mock socket (the live one), or undefined. */
export function latestSocket(): MockWebSocket | undefined {
  return MockWebSocket.instances[MockWebSocket.instances.length - 1];
}
