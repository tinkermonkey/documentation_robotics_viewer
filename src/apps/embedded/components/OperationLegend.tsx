/**
 * OperationLegend Component
 *
 * Displays visual legend for changeset operations (add, update, delete).
 * Reusable across changeset and motivation views.
 */

import { Badge } from 'flowbite-react';

export interface OperationLegendProps {
  /** Show compact version (for smaller spaces) */
  compact?: boolean;

  /** Additional CSS class */
  className?: string;
}

/**
 * Operation legend data
 */
const OPERATIONS = [
  {
    type: 'add',
    label: 'Added',
    color: 'success' as const,
    description: 'New elements added in changeset',
  },
  {
    type: 'update',
    label: 'Updated',
    color: 'warning' as const,
    description: 'Modified elements in changeset',
  },
  {
    type: 'delete',
    label: 'Deleted',
    color: 'failure' as const,
    description: 'Elements marked for deletion',
  },
] as const;

/**
 * OperationLegend Component
 */
export const OperationLegend: React.FC<OperationLegendProps> = ({
  compact = false,
  className = '',
}) => {
  return (
    <div className={`${compact ? 'p-2' : 'p-3'} ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Changeset Operations
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {OPERATIONS.map((op) => (
          <Badge
            key={op.type}
            color={op.color}
            size="sm"
            title={op.description}
            aria-label={`${op.label}: ${op.description}`}
          >
            {op.label}
          </Badge>
        ))}
      </div>
    </div>
  );
};
