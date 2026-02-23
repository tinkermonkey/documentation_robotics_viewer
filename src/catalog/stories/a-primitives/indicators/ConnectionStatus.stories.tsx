import type { Meta, StoryObj } from '@storybook/react';
import ConnectionStatus from '@/apps/embedded/components/ConnectionStatus';
import { useConnectionStore } from '@/apps/embedded/stores/connectionStore';
import { useEffect } from 'react';

const meta = {
  title: 'A Primitives / Indicators / ConnectionStatus',
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Connected: Story = {
  render: () => {
    useEffect(() => {
      useConnectionStore.setState({ state: 'connected', reconnectAttempt: 0 });
    }, []);

    return (
      <div className="p-4 bg-gray-50">
        <ConnectionStatus />
      </div>
    );
  }
};

export const Connecting: Story = {
  render: () => {
    useEffect(() => {
      useConnectionStore.setState({ state: 'connecting', reconnectAttempt: 0 });
    }, []);

    return (
      <div className="p-4 bg-gray-50">
        <ConnectionStatus />
      </div>
    );
  }
};

export const Reconnecting: Story = {
  render: () => {
    useEffect(() => {
      useConnectionStore.setState({ state: 'reconnecting', reconnectAttempt: 3 });
    }, []);

    return (
      <div className="p-4 bg-gray-50">
        <ConnectionStatus />
      </div>
    );
  }
};

export const Disconnected: Story = {
  render: () => {
    useEffect(() => {
      useConnectionStore.setState({ state: 'disconnected', reconnectAttempt: 0 });
    }, []);

    return (
      <div className="p-4 bg-gray-50">
        <ConnectionStatus />
      </div>
    );
  }
};

export const Error: Story = {
  render: () => {
    useEffect(() => {
      useConnectionStore.setState({ state: 'error', reconnectAttempt: 0 });
    }, []);

    return (
      <div className="p-4 bg-gray-50">
        <ConnectionStatus />
      </div>
    );
  }
};
