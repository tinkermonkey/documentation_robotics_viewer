/**
 * OperationLegend Component
 *
 * Displays visual legend for changeset operations (add, update, delete).
 * Reusable across changeset and motivation views.
 */

import './OperationLegend.css';

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
    borderColor: '#10b981',
    backgroundColor: '#d1fae5',
    description: 'New elements added in changeset',
  },
  {
    type: 'update',
    label: 'Updated',
    borderColor: '#f59e0b',
    backgroundColor: '#fef3c7',
    description: 'Modified elements in changeset',
  },
  {
    type: 'delete',
    label: 'Deleted',
    borderColor: '#ef4444',
    backgroundColor: '#fee2e2',
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
    <div className={`operation-legend ${compact ? 'operation-legend--compact' : ''} ${className}`}>
      <div className="operation-legend__header">
        <span className="operation-legend__title">Changeset Operations</span>
      </div>
      <div className="operation-legend__items">
        {OPERATIONS.map((op) => (
          <div
            key={op.type}
            className="operation-legend__item"
            title={op.description}
            aria-label={`${op.label}: ${op.description}`}
          >
            <div
              className="operation-legend__sample"
              style={{
                border: `2px solid ${op.borderColor}`,
                backgroundColor: op.backgroundColor,
                opacity: op.type === 'delete' ? 0.6 : 1,
              }}
              aria-hidden="true"
            />
            <span className="operation-legend__label">{op.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
