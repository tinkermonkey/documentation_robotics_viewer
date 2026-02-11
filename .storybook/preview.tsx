import type { Preview } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';
import '../src/index.css';

// Setup test environment flags for WebSocket client detection
if (typeof window !== 'undefined') {
  // @ts-ignore - Set mock flag for WebSocket client
  window.__LADLE_MOCK_WEBSOCKET__ = true;

  // Filter expected errors from test environment
  const originalError = console.error;

  console.error = (...args: any[]) => {
    const errorString = args.join(' ');

    // Filter expected errors (from design guidance)
    if (
      errorString.includes('Warning: ReactDOM.render') ||
      errorString.includes('Not implemented: HTMLFormElement.prototype.requestSubmit')
    ) {
      return;
    }

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
