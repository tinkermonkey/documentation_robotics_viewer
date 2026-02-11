/**
 * Floating Chat Panel Stories
 * Demonstrates the draggable, persistent chat panel in various states
 */

import type { Meta, StoryObj } from '@storybook/react';
import { FloatingChatPanel } from '@/apps/embedded/components/FloatingChatPanel';
import { useFloatingChatStore } from '@/apps/embedded/stores/floatingChatStore';
import { useEffect } from 'react';

const meta = {
  title: 'D Chat / Containers / FloatingChatPanel',
  component: FloatingChatPanel,
} satisfies Meta<typeof FloatingChatPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

const DefaultWrapper = () => {
  useEffect(() => {
    useFloatingChatStore.getState().open();
  }, []);

  return (
    <div className="relative w-full h-screen bg-gray-100">
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Floating Chat Panel Demo</h1>
        <p className="text-gray-600 mb-4">
          The chat panel appears in the bottom-right corner.
          You can drag it around, resize it, minimize it, or close it.
        </p>
        <button
          onClick={() => useFloatingChatStore.getState().toggle()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Toggle Chat Panel
        </button>
      </div>
      <FloatingChatPanel />
    </div>
  );
};

const MinimizedWrapper = () => {
  useEffect(() => {
    const store = useFloatingChatStore.getState();
    store.open();
    store.minimize();
  }, []);

  return (
    <div className="relative w-full h-screen bg-gray-100">
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Minimized State</h1>
        <p className="text-gray-600 mb-4">The chat panel is minimized to just the header bar.</p>
        <button
          onClick={() => useFloatingChatStore.getState().restore()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Restore Panel
        </button>
      </div>
      <FloatingChatPanel />
    </div>
  );
};

const CustomPositionWrapper = () => {
  useEffect(() => {
    const store = useFloatingChatStore.getState();
    store.open();
    store.setPosition(100, 100);
    store.setSize(450, 650);
  }, []);

  return (
    <div className="relative w-full h-screen bg-gray-100">
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Custom Position & Size</h1>
        <p className="text-gray-600 mb-4">
          The panel is positioned at (100, 100) with custom dimensions 450x650px.
        </p>
        <button
          onClick={() => {
            const store = useFloatingChatStore.getState();
            store.setPosition(300, 200);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Move to (300, 200)
        </button>
      </div>
      <FloatingChatPanel />
    </div>
  );
};

const DarkModeWrapper = () => {
  useEffect(() => {
    useFloatingChatStore.getState().open();
    document.documentElement.classList.add('dark');
    return () => document.documentElement.classList.remove('dark');
  }, []);

  return (
    <div className="relative w-full h-screen bg-gray-900">
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4 text-white">Dark Mode</h1>
        <p className="text-gray-400 mb-4">
          The chat panel adapts to dark mode with appropriate styling.
        </p>
      </div>
      <FloatingChatPanel />
    </div>
  );
};

export const Default: Story = { render: () => <DefaultWrapper /> };
Default.storyName = 'Default State';

export const Minimized: Story = { render: () => <MinimizedWrapper /> };
Minimized.storyName = 'Minimized';

export const CustomPosition: Story = { render: () => <CustomPositionWrapper /> };
CustomPosition.storyName = 'Custom Position & Size';

export const DarkMode: Story = { render: () => <DarkModeWrapper /> };
DarkMode.storyName = 'Dark Mode';
