/**
 * ExpandableSection Component
 * Reusable expandable/collapsible section matching design prototype
 * Uses lucide-react Chevron icons and clean Tailwind styling
 */

import React from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';

export interface ExpandableSectionProps {
  /** Section title */
  title: string;
  /** Optional count badge */
  count?: number;
  /** Optional custom badge text */
  badge?: string | number;
  /** Section content */
  children: React.ReactNode;
  /** Optional CSS class */
  className?: string;
  /** Controlled expanded state (optional) */
  isExpanded?: boolean;
  /** Controlled toggle handler (optional) */
  onToggle?: () => void;
  /** Default expanded state for uncontrolled mode */
  defaultExpanded?: boolean;
}

const ExpandableSection: React.FC<ExpandableSectionProps> = ({
  title,
  count,
  badge,
  children,
  className = '',
  isExpanded: controlledExpanded,
  onToggle,
  defaultExpanded = false
}) => {
  // Internal state for uncontrolled mode
  const [internalExpanded, setInternalExpanded] = React.useState(defaultExpanded);

  // Use controlled state if provided, otherwise use internal state
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;

  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalExpanded(!internalExpanded);
    }
  };

  return (
    <div className={`border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden ${className}`}>
      <button
        onClick={handleToggle}
        className="w-full px-4 py-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between cursor-pointer transition-colors"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
          )}
          <span className="text-sm font-medium text-gray-900 dark:text-white">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          {count !== undefined && (
            <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
              {count}
            </span>
          )}
          {badge !== undefined && (
            <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
              {badge}
            </span>
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 py-3 bg-white dark:bg-gray-800">
          {children}
        </div>
      )}
    </div>
  );
};

export default ExpandableSection;
