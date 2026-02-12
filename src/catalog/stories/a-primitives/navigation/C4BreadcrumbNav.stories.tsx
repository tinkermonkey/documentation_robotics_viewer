import type { Meta, StoryObj } from '@storybook/react';
import C4BreadcrumbNav from '@/apps/embedded/components/C4BreadcrumbNav';
import type { C4BreadcrumbSegment } from '@/apps/embedded/types/c4Graph';

const meta = {
  title: 'A Primitives / Navigation / C4BreadcrumbNav',
} satisfies Meta;

export default meta;
type Story = StoryObj;

const contextBreadcrumb: C4BreadcrumbSegment[] = [
  { level: 'context', label: 'System Context' },
];

const containerBreadcrumb: C4BreadcrumbSegment[] = [
  { level: 'context', label: 'System Context' },
  { level: 'container', label: 'E-commerce Platform', nodeId: 'ecommerce' },
];

const componentBreadcrumb: C4BreadcrumbSegment[] = [
  { level: 'context', label: 'System Context' },
  { level: 'container', label: 'E-commerce Platform', nodeId: 'ecommerce' },
  { level: 'component', label: 'Payment Service', nodeId: 'payment' },
];

export const ContextLevel: Story = { render: () => (
  <div className="p-4 bg-white border border-gray-200">
    <C4BreadcrumbNav
      breadcrumb={contextBreadcrumb}
      currentViewLevel="context"
      onNavigate={(level, containerId, componentId) =>
        console.log('Navigate:', { level, containerId, componentId })
      }
    />
  </div>
) };

export const ContainerLevel: Story = { render: () => (
  <div className="p-4 bg-white border border-gray-200">
    <C4BreadcrumbNav
      breadcrumb={containerBreadcrumb}
      currentViewLevel="container"
      onNavigate={(level, containerId, componentId) =>
        console.log('Navigate:', { level, containerId, componentId })
      }
    />
  </div>
) };

export const ComponentLevel: Story = { render: () => (
  <div className="p-4 bg-white border border-gray-200">
    <C4BreadcrumbNav
      breadcrumb={componentBreadcrumb}
      currentViewLevel="component"
      onNavigate={(level, containerId, componentId) =>
        console.log('Navigate:', { level, containerId, componentId })
      }
    />
  </div>
) };
