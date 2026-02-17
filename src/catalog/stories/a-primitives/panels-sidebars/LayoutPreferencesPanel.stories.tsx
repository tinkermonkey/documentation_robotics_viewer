import type { Meta, StoryObj } from '@storybook/react';
import { LayoutPreferencesPanel } from '@/apps/embedded/components/LayoutPreferencesPanel';

const meta = {
  title: 'A Primitives / Panels and Sidebars / LayoutPreferencesPanel',
  component: LayoutPreferencesPanel,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div style={{ width: 800, height: 700 }}>
      <LayoutPreferencesPanel
        onChange={() => {
          console.log('Preferences changed');
        }}
      />
    </div>
  ),
};
