import type { Preview } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';
import '../src/index.css';

// Setup test environment flags for WebSocket client detection
if (typeof window !== 'undefined') {
  // @ts-ignore - Set mock flag for WebSocket client
  window.__LADLE_MOCK_WEBSOCKET__ = true;

  // Create logger that distinguishes between test suppression and real errors
  const originalError = console.error;

  console.error = (...args: any[]) => {
    const message = String(args[0] || '');

    // Only suppress expected WebSocket connection failure messages in test environment
    // All other errors, including parsing, type errors, and legitimate bugs, pass through
    const isExpectedConnectionFailure = (
      message.includes('WebSocket connection to') || // Browser WebSocket connection error
      message.includes('WebSocket connection failed') || // WebSocket failed
      message.includes('WebSocket is closed before the connection is established') || // Expected closure
      message.includes('The operation is insecure') // HTTPS/WSS requirement
    );

    if (isExpectedConnectionFailure) {
      // Log as warning instead of error for test visibility
      console.warn('[TEST] Expected connection failure (treating as warning):', message);
      return;
    }

    // All other errors, including code bugs, go through normally
    originalError.apply(console, args);
  };
}

const preview: Preview = {
  decorators: [
    (Story) => (
      <MemoryRouter>
        <div className="min-h-screen bg-white dark:bg-gray-900">
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: 'centered',
  },
};

export default preview;
