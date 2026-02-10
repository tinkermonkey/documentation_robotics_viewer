import type { StoryDefault, Story } from '@ladle/react';
import SharedLayout from '@/apps/embedded/components/SharedLayout';

export default {
  title: 'E Compositions / Layouts / SharedLayout',
} satisfies StoryDefault;

export const ThreeColumn: Story = () => (
  <div className="h-screen bg-gray-100">
    <SharedLayout
      showLeftSidebar={true}
      showRightSidebar={true}
      leftSidebarContent={
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-3">Left Sidebar</h3>
          <ul className="space-y-2">
            <li className="p-2 bg-blue-50 rounded">Item 1</li>
            <li className="p-2 hover:bg-gray-50 rounded">Item 2</li>
            <li className="p-2 hover:bg-gray-50 rounded">Item 3</li>
          </ul>
        </div>
      }
      rightSidebarContent={
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-3">Right Sidebar</h3>
          <div className="space-y-3">
            <div className="p-3 bg-white rounded border">Panel 1</div>
            <div className="p-3 bg-white rounded border">Panel 2</div>
          </div>
        </div>
      }
    >
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Main Content Area</h2>
          <p className="text-gray-600">Graph visualization or other content goes here</p>
        </div>
      </div>
    </SharedLayout>
  </div>
);

export const TwoColumnLeft: Story = () => (
  <div className="h-screen bg-gray-100">
    <SharedLayout
      showLeftSidebar={true}
      showRightSidebar={false}
      leftSidebarContent={
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-3">Left Sidebar</h3>
          <ul className="space-y-2">
            <li className="p-2 bg-blue-50 rounded">Item 1</li>
            <li className="p-2 hover:bg-gray-50 rounded">Item 2</li>
          </ul>
        </div>
      }
    >
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Main Content Area</h2>
          <p className="text-gray-600">With left sidebar only</p>
        </div>
      </div>
    </SharedLayout>
  </div>
);

export const TwoColumnRight: Story = () => (
  <div className="h-screen bg-gray-100">
    <SharedLayout
      showLeftSidebar={false}
      showRightSidebar={true}
      rightSidebarContent={
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-3">Right Sidebar</h3>
          <div className="space-y-3">
            <div className="p-3 bg-white rounded border">Panel 1</div>
            <div className="p-3 bg-white rounded border">Panel 2</div>
          </div>
        </div>
      }
    >
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Main Content Area</h2>
          <p className="text-gray-600">With right sidebar only</p>
        </div>
      </div>
    </SharedLayout>
  </div>
);

export const SingleColumn: Story = () => (
  <div className="h-screen bg-gray-100">
    <SharedLayout showLeftSidebar={false} showRightSidebar={false}>
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Main Content Area</h2>
          <p className="text-gray-600">Full width, no sidebars</p>
        </div>
      </div>
    </SharedLayout>
  </div>
);
