/**
 * MotivationContextMenu Component
 *
 * Provides a context menu for right-click actions on motivation graph nodes.
 * Displays options for path tracing: Trace Upstream, Trace Downstream, Clear Highlighting.
 */

import React, { useEffect, useRef } from 'react';

export interface ContextMenuProps {
  /** Screen coordinates for menu positioning */
  x: number;
  y: number;

  /** Node ID that was right-clicked */
  nodeId: string;

  /** Node name for display */
  nodeName: string;

  /** Callback for "Trace Upstream" action */
  onTraceUpstream: (nodeId: string) => void;

  /** Callback for "Trace Downstream" action */
  onTraceDownstream: (nodeId: string) => void;

  /** Callback for "Clear Highlighting" action */
  onClearHighlighting: () => void;

  /** Callback when menu should close */
  onClose: () => void;
}

export const MotivationContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  nodeId,
  nodeName,
  onTraceUpstream,
  onTraceDownstream,
  onClearHighlighting,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        event.target instanceof Node &&
        !menuRef.current.contains(event.target)
      ) {
        onClose();
      }
    };

    // Close on Escape key
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Position menu and ensure it stays within viewport
  const getMenuStyle = (): React.CSSProperties => {
    const menuWidth = 220; // Approximate menu width
    const menuHeight = 150; // Approximate menu height
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let finalX = x;
    let finalY = y;

    // Adjust if menu would go off right edge
    if (x + menuWidth > viewportWidth) {
      finalX = viewportWidth - menuWidth - 10;
    }

    // Adjust if menu would go off bottom edge
    if (y + menuHeight > viewportHeight) {
      finalY = viewportHeight - menuHeight - 10;
    }

    return {
      left: `${finalX}px`,
      top: `${finalY}px`,
    };
  };

  const handleTraceUpstream = () => {
    onTraceUpstream(nodeId);
    onClose();
  };

  const handleTraceDownstream = () => {
    onTraceDownstream(nodeId);
    onClose();
  };

  const handleClearHighlighting = () => {
    onClearHighlighting();
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="fixed bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg min-w-[200px] z-[10000] overflow-hidden"
      style={getMenuStyle()}
      role="menu"
      aria-label="Node actions menu"
    >
      <div className="px-3 py-2 bg-gray-100 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600">
        <span className="text-sm font-semibold text-gray-900 dark:text-white block whitespace-nowrap overflow-hidden text-ellipsis max-w-[180px]">{nodeName}</span>
      </div>

      <div className="py-1">
        <button
          className="w-full flex items-center gap-2.5 px-3 py-2 bg-transparent border-0 cursor-pointer text-sm text-gray-900 dark:text-white text-left transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600"
          onClick={handleTraceUpstream}
          role="menuitem"
          aria-label={`Trace upstream influences from ${nodeName}`}
        >
          <span className="text-sm w-4 h-4 inline-flex items-center justify-center">⬆️</span>
          <span>Trace Upstream</span>
        </button>

        <button
          className="w-full flex items-center gap-2.5 px-3 py-2 bg-transparent border-0 cursor-pointer text-sm text-gray-900 dark:text-white text-left transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600"
          onClick={handleTraceDownstream}
          role="menuitem"
          aria-label={`Trace downstream impacts from ${nodeName}`}
        >
          <span className="text-sm w-4 h-4 inline-flex items-center justify-center">⬇️</span>
          <span>Trace Downstream</span>
        </button>

        <div className="h-px bg-gray-300 dark:bg-gray-600 my-1" role="separator" />

        <button
          className="w-full flex items-center gap-2.5 px-3 py-2 bg-transparent border-0 cursor-pointer text-sm text-gray-900 dark:text-white text-left transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600"
          onClick={handleClearHighlighting}
          role="menuitem"
          aria-label="Clear all path highlighting"
        >
          <span className="text-sm w-4 h-4 inline-flex items-center justify-center">✖️</span>
          <span>Clear Highlighting</span>
        </button>
      </div>
    </div>
  );
};
