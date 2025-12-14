/**
 * SharedLayout Component
 * 3-column layout wrapper for consistent structure across all routes
 * Matches design prototype layout pattern
 */

import React from 'react';

export interface SharedLayoutProps {
  /** Show left sidebar (model layers, changeset list, etc.) */
  showLeftSidebar?: boolean;
  /** Show right sidebar (annotations, schema info) */
  showRightSidebar?: boolean;
  /** Content for left sidebar */
  leftSidebarContent?: React.ReactNode;
  /** Content for right sidebar */
  rightSidebarContent?: React.ReactNode;
  /** Main content area */
  children: React.ReactNode;
}

const SharedLayout: React.FC<SharedLayoutProps> = ({
  showLeftSidebar = false,
  showRightSidebar = false,
  leftSidebarContent,
  rightSidebarContent,
  children,
}) => {
  return (
    <div className="flex h-full overflow-hidden" data-testid="shared-layout">
      {/* Left Sidebar */}
      {showLeftSidebar && leftSidebarContent && (
        <aside className="w-64 border-r border-gray-200 dark:border-gray-700 overflow-y-auto bg-white dark:bg-gray-900">
          {leftSidebarContent}
        </aside>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-800">
        {children}
      </main>

      {/* Right Sidebar */}
      {showRightSidebar && rightSidebarContent && (
        <aside className="w-80 border-l border-gray-200 dark:border-gray-700 overflow-y-auto bg-white dark:bg-gray-900">
          {rightSidebarContent}
        </aside>
      )}
    </div>
  );
};

export default SharedLayout;
