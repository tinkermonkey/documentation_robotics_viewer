import { memo } from 'react';
import { Button } from 'flowbite-react';
import {
  HiOutlineDocumentText,
  HiOutlineCollection,
  HiOutlineAnnotation,
  HiOutlineCube,
  HiOutlineExclamation,
} from 'react-icons/hi';

type EmptyStateVariant = 'annotations' | 'changesets' | 'elements' | 'model' | 'error';

interface EmptyStateProps {
  variant: EmptyStateVariant;
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const VARIANT_CONFIG: Record<
  EmptyStateVariant,
  {
    icon: React.ComponentType<{ className?: string }>;
    defaultTitle: string;
    defaultDescription: string;
    iconColor: string;
  }
> = {
  annotations: {
    icon: HiOutlineAnnotation,
    defaultTitle: 'No annotations yet',
    defaultDescription: 'Annotations will appear here as they are added to elements.',
    iconColor: 'text-blue-400',
  },
  changesets: {
    icon: HiOutlineCollection,
    defaultTitle: 'No changesets found',
    defaultDescription: 'Create a changeset to track model modifications.',
    iconColor: 'text-purple-400',
  },
  elements: {
    icon: HiOutlineCube,
    defaultTitle: 'No elements to display',
    defaultDescription: 'Adjust your filters to see more elements.',
    iconColor: 'text-green-400',
  },
  model: {
    icon: HiOutlineDocumentText,
    defaultTitle: 'No model loaded',
    defaultDescription: 'Waiting for model data from the server.',
    iconColor: 'text-gray-400',
  },
  error: {
    icon: HiOutlineExclamation,
    defaultTitle: 'Something went wrong',
    defaultDescription: 'An error occurred while loading data.',
    iconColor: 'text-red-400',
  },
};

export const EmptyState = memo(({ variant, title, description, action }: EmptyStateProps) => {
  const config = VARIANT_CONFIG[variant];
  const Icon = config.icon;

  return (
    <div
      className="flex flex-col items-center justify-center py-12 px-4 text-center"
      data-testid={`empty-state-${variant}`}
    >
      <div
        className={`p-4 rounded-full bg-gray-100 dark:bg-gray-800 mb-4 ${config.iconColor}`}
      >
        <Icon className="w-12 h-12" />
      </div>

      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        {title || config.defaultTitle}
      </h3>

      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-4">
        {description || config.defaultDescription}
      </p>

      {action && (
        <Button color="blue" size="sm" onClick={action.onClick} data-testid="empty-state-action">
          {action.label}
        </Button>
      )}
    </div>
  );
});

EmptyState.displayName = 'EmptyState';
