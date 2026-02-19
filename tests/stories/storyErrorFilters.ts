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

  // Specific port connection failure - expected when backend services not running
  // Only filter ECONNREFUSED from localhost dev ports (3002=DataLoader, 8080=DR CLI) to avoid hiding production errors
  if (/ECONNREFUSED.*(localhost|127\.0\.0\.1):(3002|8080)/.test(text)) return true;

  // Specific model loading failure - expected when no model data provided
  if (/\[DataLoader\] Failed to fetch model/.test(text)) return true;

  // React prop validation for unknown props - expected with legacy/external components
  // Match only when it's a Warning prefix to avoid false positives
  if (/^Warning: React does not recognize the `[\w-]+` prop/.test(text)) return true;

  // Unrecognized HTML tags - expected with custom or dynamic elements
  // Use specific tag name pattern (alphanumeric and hyphens) not greedy match
  if (/^The tag <[\w-]+> is unrecognized/.test(text)) return true;

  // WebSocket errors when server unavailable - expected in isolated test environment
  // Only filter localhost/127.0.0.1 connections (not production URLs)
  if (/WebSocket connection to ws:\/\/(localhost|127\.0\.0\.1):[0-9]+ failed/.test(text)) return true;

  // EmbeddedLayout errors - expected component-level warnings
  if (/\[EmbeddedLayout\] (?:No container|Missing required|Layout calculation)/.test(text)) return true;

  // Model loading route errors - expected when model endpoint not available
  if (/\[ModelRoute\] Error loading model/.test(text)) return true;

  // Failed resource loads - expected when test backend ports unavailable
  if (/Failed to load resource.*localhost:(3002|8080)/.test(text)) return true;

  // 500 errors from expected backend ports not running in story test environment
  // IMPORTANT: Only filter 500 errors from localhost dev servers (3002 = DataLoader, 8080 = DR CLI)
  // Production/staging API failures will NOT be filtered
  if (/the server responded with a status of 5\d{2}.*localhost:(3002|8080)/.test(text)) return true;

  // Expected React warnings - whitelist approach to avoid hiding deprecation warnings or real issues
  // Only filter explicitly known, safe-to-ignore warnings from legitimate React libraries
  if (/^Warning: Received `false`.*instead of `true`/.test(text)) return true;
  if (/^Warning: componentWillReceiveProps has been renamed/.test(text)) return true;
  if (/^Warning: Unknown event handler property/.test(text)) return true;
  if (/^Warning: useLayoutEffect does nothing on the server/.test(text)) return true;
  if (/^Warning: An update to .* inside a test was not wrapped in act/.test(text)) return true;

  // StoryLoadedWrapper timeout diagnostics - expected when stories render error/empty states
  if (/^StoryLoadedWrapper: /.test(text)) return true;
  if (/^Wrapper element:/.test(text)) return true;
  if (/^Children count:/.test(text)) return true;
  if (/^Inner HTML \(first/.test(text)) return true;

  // ErrorBoundary test errors - expected in error state test stories
  if (/\[ErrorBoundary\] Caught error/.test(text)) return true;
  if (/Test error for ErrorBoundary/.test(text)) return true;

  // RenderPropErrorBoundary test errors - expected when testing error handling in render props
  if (/\[RenderPropError\]/.test(text)) return true;

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
  // Match specific SVG element names (path, rect, circle, etc) not greedy match
  if (/Invalid value for <[\w-]+> attribute/.test(text)) return true;

  // SVG numeric attribute validation - NaN/undefined in path data
  if (/<path> attribute d: Expected number/.test(text)) return true;
  if (/<svg> attribute viewBox: Expected number/.test(text)) return true;

  // React Flow node/handle resolution errors - edge references stale nodes
  if (/source\/target (?:node|handle).*(?:not found|with id)/.test(text)) return true;

  // React Flow missing provider - node stories rendered without ReactFlowProvider
  if (/\[React Flow\]: Seems like you have not used zustand provider/.test(text)) return true;

  return false;
}
