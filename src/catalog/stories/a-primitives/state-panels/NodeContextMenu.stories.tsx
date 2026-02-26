/**
 * NodeContextMenu Component Stories
 *
 * Context menu that appears on right-click on graph nodes.
 * Provides actions for node manipulation, navigation, and inspection.
 */
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { NodeContextMenu } from '@/apps/embedded/components/shared/NodeContextMenu';

const meta = {
  title: 'A Primitives / State Panels / NodeContextMenu',
  parameters: {
    layout: 'centered',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default context menu
 * Shows the menu in a typical position
 */
export const Default: Story = {
  render: () => {
    const [position, setPosition] = useState({ x: 200, y: 150 });

    const handleContextMenu = (e: React.MouseEvent) => {
      e.preventDefault();
      setPosition({ x: e.clientX, y: e.clientY });
    };

    return (
      <div className="w-full max-w-2xl p-8 relative">
        <div
          onContextMenu={handleContextMenu}
          className="h-48 bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-400"
        >
          <p className="text-center">
            Right-click here to open the context menu
            <br />
            <span className="text-sm text-gray-500">Menu appears below</span>
          </p>
        </div>

        <div className="mt-8 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            Context Menu (when visible):
          </p>
          <NodeContextMenu
            nodeId="test-node-1"
            position={position}
            data-testid="node-context-menu-default"
          />
        </div>
      </div>
    );
  },
};

/**
 * Menu at cursor position
 * Demonstrates the menu positioned at the actual cursor location
 */
export const AtCursorPosition: Story = {
  render: () => {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [showMenu, setShowMenu] = useState(false);

    const handleContextMenu = (e: React.MouseEvent) => {
      e.preventDefault();
      setPosition({ x: e.clientX - 200, y: e.clientY - 150 });
      setShowMenu(true);
    };

    return (
      <div className="w-full max-w-2xl p-8 relative h-96">
        <div
          onContextMenu={handleContextMenu}
          onClick={() => setShowMenu(false)}
          className="h-full bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 rounded-lg border-2 border-blue-200 dark:border-blue-800 flex items-center justify-center cursor-context-menu"
        >
          <p className="text-gray-600 dark:text-gray-400 text-center">
            Right-click anywhere to see the context menu at cursor position
          </p>
        </div>

        {showMenu && (
          <div className="absolute z-50" style={{ left: `${position.x}px`, top: `${position.y}px` }}>
            <NodeContextMenu
              nodeId="test-node-cursor"
              position={position}
              data-testid="node-context-menu-cursor"
            />
          </div>
        )}
      </div>
    );
  },
};

/**
 * Menu with various node types
 * Shows context menu options relevant to different node types
 */
export const DifferentNodeTypes: Story = {
  render: () => {
    const [selectedNode, setSelectedNode] = useState('capability');

    return (
      <div className="w-full max-w-2xl p-8">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Node Type:
          </label>
          <select
            value={selectedNode}
            onChange={(e) => setSelectedNode(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
          >
            <option value="capability">Business Capability</option>
            <option value="service">Application Service</option>
            <option value="datamodel">Data Model</option>
            <option value="process">Business Process</option>
          </select>
        </div>

        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Context Menu for: <span className="font-semibold">{selectedNode}</span>
          </p>
          <NodeContextMenu
            nodeId={selectedNode}
            position={{ x: 0, y: 0 }}
            data-testid={`node-context-menu-${selectedNode}`}
          />
        </div>
      </div>
    );
  },
};

/**
 * Floating context menu
 * Shows how the menu appears as a floating overlay
 */
export const FloatingOverlay: Story = {
  render: () => {
    const [position, setPosition] = useState({ x: 300, y: 250 });

    const handleContextMenu = (e: React.MouseEvent) => {
      e.preventDefault();
      setPosition({ x: e.clientX - 200, y: e.clientY - 150 });
    };

    return (
      <div
        onContextMenu={handleContextMenu}
        className="w-full h-96 bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg border-2 border-purple-200 dark:border-purple-800 flex items-center justify-center relative overflow-hidden"
      >
        <p className="text-gray-600 dark:text-gray-400 text-center">
          Right-click to show floating context menu
        </p>

        <div className="absolute" style={{ left: `${position.x}px`, top: `${position.y}px` }}>
          <NodeContextMenu
            nodeId="floating-node"
            position={position}
            data-testid="node-context-menu-floating"
          />
        </div>
      </div>
    );
  },
};

/**
 * Menu actions reference
 * Shows documentation of available menu actions
 */
export const ActionsReference: Story = {
  render: () => (
    <div className="w-full max-w-2xl p-8">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Context Menu Actions
        </h3>
        <div className="space-y-3">
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-900 dark:text-white">Inspect Node</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Open node details in inspector panel</p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-900 dark:text-white">Navigate to Layer</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Jump to node's primary layer view</p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-900 dark:text-white">Show Cross-Layer</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Reveal cross-layer relationships</p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-900 dark:text-white">Edit Node</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Open edit dialog for node properties</p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-900 dark:text-white">Delete Node</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Remove node and associated relationships</p>
          </div>
        </div>
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Menu Component:</p>
        <NodeContextMenu
          nodeId="reference-node"
          position={{ x: 0, y: 0 }}
          data-testid="node-context-menu-reference"
        />
      </div>
    </div>
  ),
};
