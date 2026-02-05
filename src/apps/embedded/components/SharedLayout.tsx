/**
 * SharedLayout Component
 * 3-column layout with optional bottom panel for consistent structure across all routes
 * Matches design prototype layout pattern
 */

import React from 'react';

export interface SharedLayoutProps {
  /** Show left sidebar (model layers, changeset list, etc.) */
  showLeftSidebar?: boolean;
  /** Show right sidebar (annotations, schema info) */
  showRightSidebar?: boolean;
  /** Show bottom panel (chat, console, etc.) */
  showBottomPanel?: boolean;
  /** Content for left sidebar */
  leftSidebarContent?: React.ReactNode;
  /** Content for right sidebar */
  rightSidebarContent?: React.ReactNode;
  /** Content for bottom panel */
  bottomPanelContent?: React.ReactNode;
  /** Height of bottom panel (default: 300px) */
  bottomPanelHeight?: string;
  /** Main content area */
  children: React.ReactNode;
}

const SharedLayout: React.FC<SharedLayoutProps> = ({
  showLeftSidebar = false,
  showRightSidebar = false,
  showBottomPanel = false,
  leftSidebarContent,
  rightSidebarContent,
  bottomPanelContent,
  bottomPanelHeight = '300px',
  children,
}) => {
  return (
    <div
      className="flex flex-col h-full min-h-0 overflow-hidden"
      data-testid="shared-layout"
    >
      {/* Top: 3-column layout */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left Sidebar */}
        {showLeftSidebar && leftSidebarContent && (
          <aside
            className="w-64 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 overflow-y-auto bg-white dark:bg-gray-900 transition-all duration-300 ease-in-out"
            data-testid="left-sidebar"
          >
            {leftSidebarContent}
          </aside>
        )}

        {/* Main Content Area */}
        <main className="flex-1 min-h-0 overflow-y-auto bg-white dark:bg-gray-900">
          {children}
        </main>

        {/* Right Sidebar */}
        {showRightSidebar && rightSidebarContent && (
          <aside
            className="w-80 flex-shrink-0 border-l border-gray-200 dark:border-gray-700 overflow-y-auto bg-gray-50 dark:bg-gray-900 transition-all duration-300 ease-in-out"
            data-testid="right-sidebar"
          >
            {rightSidebarContent}
          </aside>
        )}
      </div>

      {/* Bottom Panel */}
      {showBottomPanel && bottomPanelContent && (
        <div
          className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800 transition-all duration-300 ease-in-out"
          style={{ height: bottomPanelHeight }}
          data-testid="bottom-panel"
        >
          {bottomPanelContent}
        </div>
      )}
    </div>
  );
};

export default SharedLayout;
