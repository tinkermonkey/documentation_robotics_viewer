/**
 * Story Test Error Filter Patterns
 *
 * Three-tier error classification for story tests:
 *
 * 1. **Expected errors** (`isExpectedConsoleError`) — Truly expected in isolated story
 *    environments (no backend, dev mode). These are silently filtered.
 *
 * 2. **Known rendering bugs** (`isKnownRenderingBug`) — Real bugs in graph rendering
 *    (SVG NaN values, React Flow handle mismatches). Tracked as soft warnings
 *    rather than hard failures so they don't block CI while remaining visible.
 *
 * CRITICAL: Use specific regex patterns to avoid filtering real bugs.
 * Overly broad patterns (e.g., substring matching) can hide critical issues.
 */

/**
 * Check if a console error message is expected in the test environment.
 * These are truly expected and silently filtered — they are NOT bugs.
 * @param text - The error message from the console
 * @returns true if the error is expected and should be filtered, false otherwise
 */
export function isExpectedConsoleError(text: string): boolean {
  // React DevTools installation prompt - expected in dev environment
  if (/Download the React DevTools/.test(text)) return true;

  // Specific port connection failure - expected when DataLoader backend not running
  if (/ECONNREFUSED.*:3002/.test(text)) return true;

  // Specific model loading failure - expected when no model data provided
  if (/\[DataLoader\] Failed to fetch model/.test(text)) return true;

  // React prop validation for unknown props - expected with legacy/external components
  if (/React does not recognize.*prop/.test(text)) return true;

  // Unrecognized HTML tags - expected with custom or dynamic elements
  if (/The tag <.*> is unrecognized/.test(text)) return true;

  // WebSocket errors when server unavailable - expected in isolated test
  if (/WebSocket connection to .* failed/.test(text)) return true;

  // EmbeddedLayout errors - expected component-level warnings
  if (/\[EmbeddedLayout\] (?:No container|Missing required|Layout calculation)/.test(text)) return true;

  // Model loading route errors - expected when model endpoint not available
  if (/\[ModelRoute\] Error loading model/.test(text)) return true;

  // Failed resource loads - expected when test backend ports unavailable
  if (/Failed to load resource.*localhost:(3002|8765)/.test(text)) return true;

  // 500 errors from backend not running in story test environment
  if (/the server responded with a status of 5\d{2}/.test(text)) return true;

  // Generic warning prefix - filters React development warnings
  // Note: This is only safe because it's combined with error type check in validateStory()
  // (console messages of type 'error' are already filtered separately)
  if (/^Warning: /.test(text)) return true;

  return false;
}

/**
 * Check if a console error message is a known rendering bug.
 * These are real bugs that should be tracked (soft-fail/warn) but not block CI.
 * They represent issues in SVG rendering and React Flow handle resolution
 * that need to be fixed but are not regressions.
 * @param text - The error message from the console
 * @returns true if the error is a known rendering bug, false otherwise
 */
export function isKnownRenderingBug(text: string): boolean {
  // SVG/path attribute validation - NaN values from layout calculation bugs
  if (/Invalid value for <.*> attribute/.test(text)) return true;

  // SVG numeric attribute validation - NaN/undefined in path data
  if (/<path> attribute d: Expected number/.test(text)) return true;
  if (/<svg> attribute viewBox: Expected number/.test(text)) return true;

  // React Flow node/handle resolution errors - edge references stale nodes
  if (/source\/target node/.test(text)) return true;
  if (/source\/target handle/.test(text)) return true;

  return false;
}
