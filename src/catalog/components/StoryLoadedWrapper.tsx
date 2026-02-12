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
}

export function StoryLoadedWrapper({
  children,
  testId,
  onLayoutComplete,
}: StoryLoadedWrapperProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isTimedOut, setIsTimedOut] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isLoadedRef = useRef(false);
  const startTimeRef = useRef<number>(0);

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
        // Timeout - log detailed error for debugging and update state
        console.error('StoryLoadedWrapper: Timeout waiting for React Flow nodes');
        console.error('Wrapper element:', wrapperRef.current?.tagName);
        console.error('Children count:', wrapperRef.current?.children.length);
        console.error('Inner HTML (first 500 chars):', wrapperRef.current?.innerHTML.substring(0, 500));
        setIsTimedOut(true);
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
  }, [onLayoutComplete]);

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
