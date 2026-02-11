import type { Preview } from '@storybook/react';
import { MockRouterProvider } from '../src/catalog/providers/MockRouterProvider';
import '../src/index.css';

// Setup test environment flags for WebSocket client detection
if (typeof window !== 'undefined') {
  // @ts-ignore - Set mock flag for WebSocket client (used by WebSocket client to detect test environment)
  window.__STORYBOOK_MOCK_WEBSOCKET__ = true;

  // Filter expected errors from test environment
  const originalError = console.error;

  console.error = (...args: any[]) => {
    const errorString = args.join(' ');

    // Filter expected errors (from design guidance)
    // Use exact string matching at the start to avoid accidentally filtering unrelated errors
    if (
      errorString.startsWith('Warning: ReactDOM.render') ||
      errorString.startsWith('Not implemented: HTMLFormElement.prototype.requestSubmit')
    ) {
      return;
    }

    originalError.apply(console, args);
  };
}

const preview: Preview = {
  decorators: [
    (Story) => (
      <MockRouterProvider>
        <div className="min-h-screen bg-white dark:bg-gray-900">
          <Story />
        </div>
      </MockRouterProvider>
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

    // A11y addon configuration for accessibility testing
    a11y: {
      // Run accessibility checks automatically
      manual: false,

      // axe-core configuration
      config: {
        rules: [
          {
            // Architecture visualizations may have decorative elements
            // Color contrast issues are marked for manual review instead of auto-fail
            id: 'color-contrast',
            reviewOnFail: true,
          },
          {
            // React Flow uses ARIA labels for graph elements
            id: 'aria-allowed-attr',
            enabled: true,
          },
          {
            // Node components use role="article"
            id: 'aria-required-children',
            enabled: true,
          },
          {
            // Handle form elements properly
            id: 'label',
            enabled: true,
          },
          {
            // Ensure image alt text
            id: 'image-alt',
            enabled: true,
          },
          {
            // Keyboard navigation support
            id: 'keyboard',
            enabled: true,
          },
          {
            // Proper heading hierarchy
            id: 'heading-order',
            enabled: true,
          },
        ],
      },

      // Element selectors to include/exclude
      options: {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'],
        },
      },
    },
  },
};

export default preview;
