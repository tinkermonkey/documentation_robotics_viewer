/**
 * MotivationContextMenu Component
 *
 * Provides a context menu for right-click actions on motivation graph nodes.
 * Displays options for path tracing: Trace Upstream, Trace Downstream, Clear Highlighting.
 */

import React, { useEffect, useRef } from 'react';
import './MotivationContextMenu.css';

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
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
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
      className="motivation-context-menu"
      style={getMenuStyle()}
      role="menu"
      aria-label="Node actions menu"
    >
      <div className="motivation-context-menu-header">
        <span className="motivation-context-menu-title">{nodeName}</span>
      </div>

      <div className="motivation-context-menu-items">
        <button
          className="motivation-context-menu-item"
          onClick={handleTraceUpstream}
          role="menuitem"
          aria-label={`Trace upstream influences from ${nodeName}`}
        >
          <span className="motivation-context-menu-icon">⬆️</span>
          <span>Trace Upstream</span>
        </button>

        <button
          className="motivation-context-menu-item"
          onClick={handleTraceDownstream}
          role="menuitem"
          aria-label={`Trace downstream impacts from ${nodeName}`}
        >
          <span className="motivation-context-menu-icon">⬇️</span>
          <span>Trace Downstream</span>
        </button>

        <div className="motivation-context-menu-divider" role="separator" />

        <button
          className="motivation-context-menu-item"
          onClick={handleClearHighlighting}
          role="menuitem"
          aria-label="Clear all path highlighting"
        >
          <span className="motivation-context-menu-icon">✖️</span>
          <span>Clear Highlighting</span>
        </button>
      </div>
    </div>
  );
};
