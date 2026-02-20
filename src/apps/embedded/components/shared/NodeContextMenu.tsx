/**
 * NodeContextMenu Component
 *
 * Generic context menu for right-click actions on graph nodes.
 * Actions are configurable, replacing the motivation-specific MotivationContextMenu.
 */

import React, { useEffect, useRef } from 'react';

export interface ContextMenuAction {
  /** Display label for the action */
  label: string;
  /** Optional icon element */
  icon?: React.ReactNode;
  /** Handler called when the action is clicked */
  onClick: () => void;
  /** Whether to show a separator before this item */
  separator?: boolean;
}

export interface NodeContextMenuProps {
  /** Screen X coordinate for menu positioning */
  x: number;
  /** Screen Y coordinate for menu positioning */
  y: number;
  /** ID of the node that was right-clicked */
  nodeId: string;
  /** Display label for the node */
  nodeLabel?: string;
  /** Actions to show in the menu */
  actions: ContextMenuAction[];
  /** Callback when the menu should close */
  onClose: () => void;
}

export const NodeContextMenu: React.FC<NodeContextMenuProps> = ({
  x,
  y,
  nodeLabel,
  actions,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

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

  // Position menu within viewport bounds
  const getMenuStyle = (): React.CSSProperties => {
    const menuWidth = 220;
    const menuHeight = 40 + actions.length * 36;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let finalX = x;
    let finalY = y;

    if (x + menuWidth > viewportWidth) {
      finalX = viewportWidth - menuWidth - 10;
    }

    if (y + menuHeight > viewportHeight) {
      finalY = viewportHeight - menuHeight - 10;
    }

    return {
      left: `${finalX}px`,
      top: `${finalY}px`,
    };
  };

  return (
    <div
      ref={menuRef}
      className="fixed bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg min-w-[200px] z-[10000] overflow-hidden"
      style={getMenuStyle()}
      role="menu"
      aria-label={nodeLabel ? `Actions for ${nodeLabel}` : 'Node actions menu'}
    >
      {nodeLabel && (
        <div className="px-3 py-2 bg-gray-100 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600">
          <span className="text-sm font-semibold text-gray-900 dark:text-white block whitespace-nowrap overflow-hidden text-ellipsis max-w-[180px]">
            {nodeLabel}
          </span>
        </div>
      )}

      <div className="py-1">
        {actions.map((action, index) => (
          <React.Fragment key={index}>
            {action.separator && (
              <div className="h-px bg-gray-300 dark:bg-gray-600 my-1" role="separator" />
            )}
            <button
              className="w-full flex items-center gap-2.5 px-3 py-2 bg-transparent border-0 cursor-pointer text-sm text-gray-900 dark:text-white text-left transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600"
              onClick={() => {
                action.onClick();
                onClose();
              }}
              role="menuitem"
            >
              {action.icon && (
                <span className="text-sm w-4 h-4 inline-flex items-center justify-center">
                  {action.icon}
                </span>
              )}
              <span>{action.label}</span>
            </button>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

NodeContextMenu.displayName = 'NodeContextMenu';
