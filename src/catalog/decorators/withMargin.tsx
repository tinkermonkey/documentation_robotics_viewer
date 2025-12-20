import type { ReactNode } from 'react';

/**
 * Decorator that wraps a story component with margin
 * Useful for adding consistent spacing around components
 *
 * Usage:
 * ```typescript
 * export const MyStory: Story = () => <MyComponent />;
 * MyStory.decorators = [withMargin(20)];
 * ```
 *
 * @param margin The margin in pixels (default: 20)
 * @returns A decorator function that wraps a story component
 */
export const withMargin = (margin: number = 20) => (Story: React.ComponentType<any>): ReactNode => (
  <div style={{ margin }} data-testid="margin-decorator">
    <Story />
  </div>
);

/**
 * Decorator that wraps a story component with padding
 * Similar to withMargin but uses padding instead
 *
 * @param padding The padding in pixels (default: 20)
 * @returns A decorator function that wraps a story component
 */
export const withPadding = (padding: number = 20) => (Story: React.ComponentType<any>): ReactNode => (
  <div style={{ padding }} data-testid="padding-decorator">
    <Story />
  </div>
);

/**
 * Decorator that wraps a story component with a border for visibility
 * Useful for checking component boundaries
 *
 * @param color The border color (default: '#e5e7eb')
 * @param width The border width in pixels (default: 1)
 * @returns A decorator function that wraps a story component
 */
export const withBorder = (color: string = '#e5e7eb', width: number = 1) => (Story: React.ComponentType<any>): ReactNode => (
  <div
    style={{
      border: `${width}px solid ${color}`,
      padding: 10
    }}
    data-testid="border-decorator"
  >
    <Story />
  </div>
);
