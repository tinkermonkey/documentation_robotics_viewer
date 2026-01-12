import { memo } from 'react';
import { Button } from 'flowbite-react';

export interface ViewOption {
  key: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface ViewToggleProps {
  views: ViewOption[];
  activeView: string;
  onViewChange: (view: string) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const ViewToggle = memo(
  ({
    views,
    activeView,
    onViewChange,
    disabled = false,
    size = 'md',
  }: ViewToggleProps) => {
    return (
      <div
        className="flex gap-2"
        data-testid="view-toggle"
        role="group"
        aria-label="View toggle"
      >
        {views.map((view) => {
          const isActive = view.key === activeView;
          const Icon = view.icon;

          return (
            <Button
              key={view.key}
              onClick={() => onViewChange(view.key)}
              disabled={disabled}
              color={isActive ? 'blue' : 'gray'}
              size={size}
              data-testid={`view-toggle-${view.key}`}
              aria-label={`Switch to ${view.label} view`}
              aria-pressed={isActive}
              className="dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
            >
              {Icon && <Icon className="mr-2 h-4 w-4" />}
              {view.label}
            </Button>
          );
        })}
      </div>
    );
  }
);

ViewToggle.displayName = 'ViewToggle';
