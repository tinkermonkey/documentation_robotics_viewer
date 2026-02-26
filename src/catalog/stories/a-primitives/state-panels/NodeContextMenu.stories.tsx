/**
 * NodeContextMenu Component Stories
 *
 * Context menu that appears on right-click on graph nodes.
 * Provides actions for node manipulation, navigation, and inspection.
 */
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { NodeContextMenu, type ContextMenuAction } from '@/apps/embedded/components/shared/NodeContextMenu';

const meta = {
  title: 'A Primitives / State Panels / NodeContextMenu',
  parameters: {
    layout: 'centered',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const defaultActions: ContextMenuAction[] = [
  {
    label: 'Inspect Node',
    onClick: () => console.log('Inspect'),
  },
  {
    label: 'Navigate to Layer',
    onClick: () => console.log('Navigate'),
  },
  {
    label: 'Show Cross-Layer',
    onClick: () => console.log('Cross-layer'),
    separator: true,
  },
  {
    label: 'Edit Node',
    onClick: () => console.log('Edit'),
  },
  {
    label: 'Delete Node',
    onClick: () => console.log('Delete'),
  },
];

/**
 * Default context menu
 * Shows the menu in a typical position
 */
export const Default: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true);

    return (
      <div className="w-full max-w-2xl p-8 relative">
        <div className="h-48 bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-400">
          <p className="text-center">
            Context menu displays below
            <br />
            <span className="text-sm text-gray-500">Right-click area for demo</span>
          </p>
        </div>

        {isOpen && (
          <div className="mt-8 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <NodeContextMenu
              x={20}
              y={20}
              nodeId="test-node-1"
              nodeLabel="Example Node"
              actions={defaultActions}
              onClose={() => setIsOpen(false)}
            />
          </div>
        )}
      </div>
    );
  },
};

/**
 * Menu with minimal actions
 * Shows a simplified context menu
 */
export const MinimalActions: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true);

    const minimalActions: ContextMenuAction[] = [
      {
        label: 'Inspect',
        onClick: () => console.log('Inspect'),
      },
      {
        label: 'Delete',
        onClick: () => console.log('Delete'),
      },
    ];

    return (
      <div className="w-full max-w-md p-8 relative">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
            Minimal Menu
          </h4>
          {isOpen && (
            <NodeContextMenu
              x={10}
              y={40}
              nodeId="minimal-node"
              actions={minimalActions}
              onClose={() => setIsOpen(false)}
            />
          )}
        </div>
      </div>
    );
  },
};

/**
 * Menu with many actions
 * Shows how the menu handles a longer action list
 */
export const ManyActions: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true);

    const manyActions: ContextMenuAction[] = [
      {
        label: 'Inspect Node',
        onClick: () => console.log('Inspect'),
      },
      {
        label: 'Navigate to Layer',
        onClick: () => console.log('Navigate'),
      },
      {
        label: 'Show Cross-Layer',
        onClick: () => console.log('Cross-layer'),
        separator: true,
      },
      {
        label: 'Edit Properties',
        onClick: () => console.log('Edit'),
      },
      {
        label: 'Duplicate',
        onClick: () => console.log('Duplicate'),
      },
      {
        label: 'Pin to View',
        onClick: () => console.log('Pin'),
      },
      {
        label: 'Add Annotation',
        onClick: () => console.log('Annotate'),
        separator: true,
      },
      {
        label: 'Export Node',
        onClick: () => console.log('Export'),
      },
      {
        label: 'Delete Node',
        onClick: () => console.log('Delete'),
      },
    ];

    return (
      <div className="w-full max-w-md p-8 relative">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
            Extended Menu
          </h4>
          {isOpen && (
            <NodeContextMenu
              x={10}
              y={40}
              nodeId="extended-node"
              nodeLabel="Service Layer"
              actions={manyActions}
              onClose={() => setIsOpen(false)}
            />
          )}
        </div>
      </div>
    );
  },
};

/**
 * Menu at different positions
 * Demonstrates positioning at various screen coordinates
 */
export const DifferentPositions: Story = {
  render: () => {
    const [position, setPosition] = useState({ x: 50, y: 50 });
    const [isOpen, setIsOpen] = useState(true);

    return (
      <div className="w-full max-w-2xl p-8 relative h-96">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 rounded-lg border-2 border-blue-200 dark:border-blue-800 h-full p-4 flex flex-col justify-between">
          <div>
            <p className="text-gray-700 dark:text-gray-300 text-sm font-medium mb-3">
              Menu Position: ({position.x}, {position.y})
            </p>
            <div className="space-y-2 text-xs">
              <button
                onClick={() => setPosition({ x: 50, y: 50 })}
                className="block w-full text-left px-2 py-1 rounded hover:bg-blue-200 dark:hover:bg-blue-800 text-gray-700 dark:text-gray-300"
              >
                Top-Left
              </button>
              <button
                onClick={() => setPosition({ x: 300, y: 50 })}
                className="block w-full text-left px-2 py-1 rounded hover:bg-blue-200 dark:hover:bg-blue-800 text-gray-700 dark:text-gray-300"
              >
                Top-Right
              </button>
              <button
                onClick={() => setPosition({ x: 50, y: 300 })}
                className="block w-full text-left px-2 py-1 rounded hover:bg-blue-200 dark:hover:bg-blue-800 text-gray-700 dark:text-gray-300"
              >
                Bottom-Left
              </button>
            </div>
          </div>
        </div>

        {isOpen && (
          <div className="absolute" style={{ left: `${position.x}px`, top: `${position.y}px` }}>
            <NodeContextMenu
              x={position.x}
              y={position.y}
              nodeId="positioned-node"
              actions={defaultActions}
              onClose={() => setIsOpen(false)}
            />
          </div>
        )}
      </div>
    );
  },
};

/**
 * Menu with node label
 * Shows menu with a labeled node context
 */
export const WithNodeLabel: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true);

    return (
      <div className="w-full max-w-md p-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Context for node: <span className="font-semibold">Customer Service API</span>
          </p>
          {isOpen && (
            <NodeContextMenu
              x={10}
              y={30}
              nodeId="service-node"
              nodeLabel="Customer Service API"
              actions={defaultActions}
              onClose={() => setIsOpen(false)}
            />
          )}
        </div>
      </div>
    );
  },
};
