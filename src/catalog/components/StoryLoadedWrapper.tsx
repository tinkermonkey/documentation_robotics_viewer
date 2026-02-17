/**
 * Story Loaded Wrapper Component
 *
 * Wraps story content and signals when React Flow has been initialized
 * and layout calculations are complete. Used by Playwright tests to
 * determine when a story is ready for metrics extraction.
 *
 * The component:
 * - Waits for React Flow nodes to appear in the DOM
 * - Adds `data-storyloaded` attribute after initialization
 * - Calls optional onLayoutComplete callback when ready
 */

import { useEffect, useRef, useState, type ReactNode } from 'react';

export interface StoryLoadedWrapperProps {
  /** Content to wrap */
  children: ReactNode;
  /** Test ID for selecting the wrapper in tests */
  testId: string;
  /** Optional callback when layout is complete */
  onLayoutComplete?: () => void;
  /** Optional callback when timeout occurs - allows tests to detect and handle failures */
  onTimeout?: (diagnostics: TimeoutDiagnostics) => void;
  /** Optional flag to throw error instead of just setting state on timeout */
  throwOnTimeout?: boolean;
}

export interface TimeoutDiagnostics {
  maxWaitTime: number;
  actualWaitTime: number;
  wrapperElement: HTMLDivElement | null;
  childrenCount: number;
  innerHtmlPreview: string;
}

export function StoryLoadedWrapper({
  children,
  testId,
  onLayoutComplete,
  onTimeout,
  throwOnTimeout,
}: StoryLoadedWrapperProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isTimedOut, setIsTimedOut] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isLoadedRef = useRef(false);
  const startTimeRef = useRef<number>(0);
  const timeoutHandledRef = useRef(false);

  useEffect(() => {
    const MAX_WAIT_TIME = 30000; // 30 seconds
    const CHECK_INTERVAL = 100; // Check every 100ms
    startTimeRef.current = Date.now();

    // Check if React Flow nodes are present
    const checkLoaded = () => {
      if (!wrapperRef.current || isLoadedRef.current) return;

      const nodes = wrapperRef.current.querySelectorAll('.react-flow__node');
      if (nodes && nodes.length > 0) {
        const loadTime = Date.now() - startTimeRef.current;
        console.log(`StoryLoadedWrapper: Loaded in ${loadTime}ms with ${nodes.length} nodes`);
        isLoadedRef.current = true;
        setIsLoaded(true);
        if (checkIntervalRef.current !== null) {
          clearInterval(checkIntervalRef.current);
          checkIntervalRef.current = null;
        }
        onLayoutComplete?.();
      } else if (Date.now() - startTimeRef.current > MAX_WAIT_TIME) {
        // Timeout - create detailed diagnostics and signal failure
        const actualWaitTime = Date.now() - startTimeRef.current;
        const diagnostics: TimeoutDiagnostics = {
          maxWaitTime: MAX_WAIT_TIME,
          actualWaitTime,
          wrapperElement: wrapperRef.current,
          childrenCount: wrapperRef.current?.children.length || 0,
          innerHtmlPreview: wrapperRef.current?.innerHTML.substring(0, 500) || '',
        };

        // Log detailed error for debugging
        console.error('StoryLoadedWrapper: Timeout waiting for React Flow nodes after 30s');
        console.error('Wrapper element:', wrapperRef.current?.tagName);
        console.error('Children count:', diagnostics.childrenCount);
        console.error('Inner HTML (first 500 chars):', diagnostics.innerHtmlPreview);

        // Only handle timeout once
        if (!timeoutHandledRef.current) {
          timeoutHandledRef.current = true;
          setIsTimedOut(true);

          // Call onTimeout callback if provided
          onTimeout?.(diagnostics);

          // Optionally throw error to fail the test (use error state, not throw from useEffect)
          if (throwOnTimeout) {
            const errorMsg = `StoryLoadedWrapper timeout: React Flow nodes not found after ${actualWaitTime}ms`;
            const err = new Error(errorMsg);
            setError(err);
            // Log error for debugging instead of throwing from useEffect
            console.error(errorMsg);
          }
        }

        if (checkIntervalRef.current !== null) {
          clearInterval(checkIntervalRef.current);
          checkIntervalRef.current = null;
        }
      }
    };

    // Start checking for React Flow initialization
    // Give a brief moment for React Flow to mount
    const initialDelay = setTimeout(() => {
      checkLoaded();
      // If not loaded yet, poll until React Flow nodes appear
      if (!isLoadedRef.current) {
        checkIntervalRef.current = setInterval(checkLoaded, CHECK_INTERVAL);
      }
    }, 100);

    return () => {
      clearTimeout(initialDelay);
      if (checkIntervalRef.current !== null) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
    };
  }, [onLayoutComplete, onTimeout, throwOnTimeout]);

  // Show error state only if error was set due to timeout
  if (error) {
    return (
      <div
        ref={wrapperRef}
        data-testid={testId}
        data-storyloaded="error"
        role="alert"
        style={{ padding: 16, color: '#dc2626', backgroundColor: '#fee2e2', border: '1px solid #fca5a5' }}
      >
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Story Load Error</div>
        <div style={{ fontSize: 14 }}>{error.message}</div>
      </div>
    );
  }

  return (
    <div
      ref={wrapperRef}
      data-testid={testId}
      data-storyloaded={isLoaded ? 'true' : isTimedOut ? 'timeout' : undefined}
    >
      {children}
    </div>
  );
}

StoryLoadedWrapper.displayName = 'StoryLoadedWrapper';
