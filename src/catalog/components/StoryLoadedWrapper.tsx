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
  const wrapperRef = useRef<HTMLDivElement>(null);
  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Check if React Flow nodes are present
    const checkLoaded = () => {
      if (!wrapperRef.current) return;

      const nodes = wrapperRef.current.querySelectorAll('.react-flow__node');
      if (nodes && nodes.length > 0) {
        setIsLoaded(true);
        if (checkIntervalRef.current !== null) {
          clearInterval(checkIntervalRef.current);
          checkIntervalRef.current = null;
        }
        onLayoutComplete?.();
      }
    };

    // Start checking for React Flow initialization
    // Give a brief moment for React Flow to mount
    const initialDelay = setTimeout(() => {
      checkLoaded();
      // If not loaded yet, poll until React Flow nodes appear
      if (!isLoaded) {
        checkIntervalRef.current = setInterval(checkLoaded, 50);
      }
    }, 100);

    return () => {
      clearTimeout(initialDelay);
      if (checkIntervalRef.current !== null) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
    };
  }, [isLoaded, onLayoutComplete]);

  return (
    <div
      ref={wrapperRef}
      data-testid={testId}
      data-storyloaded={isLoaded ? 'true' : undefined}
    >
      {children}
    </div>
  );
}
