/**
 * ToolInvocationCard Component Stories
 * Demonstrates tool execution display with input/output
 */
import type { Meta, StoryObj } from '@storybook/react';
import { ToolInvocationCard } from '@/apps/embedded/components/chat/ToolInvocationCard';
import type { ToolInvocationContent } from '@/apps/embedded/types/chat';

const meta = {
  title: 'D Chat / Messages / ToolInvocationCard',
  component: ToolInvocationCard,
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Tool currently executing
 */
export const Executing: Story = {
  render: () => {
const toolInvocation: ToolInvocationContent = {
    type: 'tool_invocation',
    toolUseId: 'tool-1',
    toolName: 'searchModel',
    toolInput: {
      query: 'stakeholder',
      layer: 'motivation'
    },
    status: { state: 'executing' },
    timestamp: new Date().toISOString()
  };

      return (
      
    <div className="p-4 max-w-3xl bg-white dark:bg-gray-800">
      <ToolInvocationCard
        toolName={toolInvocation.toolName}
        toolInput={toolInvocation.toolInput}
        status={toolInvocation.status}
        timestamp={toolInvocation.timestamp}
      />
    </div>
  
    );
  }
};

/**
 * Tool completed successfully with result
 */
export const Completed: Story = {
  render: () => {
const toolInvocation: ToolInvocationContent = {
    type: 'tool_invocation',
    toolUseId: 'tool-2',
    toolName: 'getElement',
    toolInput: {
      elementId: 'motivation.goal.customer-satisfaction'
    },
    status: {
      state: 'completed',
      result: {
        id: 'motivation.goal.customer-satisfaction',
        name: 'Improve Customer Satisfaction',
        type: 'Goal',
        description: 'Achieve 95% customer satisfaction rating by Q4 2024',
        relationships: {
          outgoing: ['realizes:outcome.happy-customers'],
          incoming: ['influences:stakeholder.customers']
        }
      }
    },
    timestamp: new Date().toISOString()
  };

      return (
      
    <div className="p-4 max-w-3xl bg-white dark:bg-gray-800">
      <ToolInvocationCard
        toolName={toolInvocation.toolName}
        toolInput={toolInvocation.toolInput}
        status={toolInvocation.status}
        timestamp={toolInvocation.timestamp}
      />
    </div>
  
    );
  }
};

/**
 * Tool execution failed with error
 */
export const Failed: Story = {
  render: () => {
const toolInvocation: ToolInvocationContent = {
    type: 'tool_invocation',
    toolUseId: 'tool-3',
    toolName: 'validateModel',
    toolInput: {
      checkCrossLayerReferences: true,
      strictMode: true
    },
    status: {
      state: 'failed',
      error: 'Cross-layer reference validation failed: Element "business.capability.payment-processing" references non-existent technology element "tech.service.payment-api"'
    },
    timestamp: new Date().toISOString()
  };

      return (
      
    <div className="p-4 max-w-3xl bg-white dark:bg-gray-800">
      <ToolInvocationCard
        toolName={toolInvocation.toolName}
        toolInput={toolInvocation.toolInput}
        status={toolInvocation.status}
        timestamp={toolInvocation.timestamp}
      />
    </div>
  
    );
  }
};

/**
 * Tool with large JSON output
 */
export const LargeOutput: Story = {
  render: () => {
const toolInvocation: ToolInvocationContent = {
    type: 'tool_invocation',
    toolUseId: 'tool-4',
    toolName: 'analyzeLayer',
    toolInput: {
      layer: 'business',
      includeRelationships: true
    },
    status: {
      state: 'completed',
      result: {
        layerId: 'business',
        elementCount: 23,
        elements: [
          {
            id: 'business.capability.order-management',
            name: 'Order Management',
            type: 'BusinessCapability',
            relationships: { incoming: 3, outgoing: 5 }
          },
          {
            id: 'business.service.inventory',
            name: 'Inventory Service',
            type: 'BusinessService',
            relationships: { incoming: 2, outgoing: 4 }
          },
          {
            id: 'business.function.procurement',
            name: 'Procurement',
            type: 'BusinessFunction',
            relationships: { incoming: 1, outgoing: 3 }
          }
        ],
        relationshipSummary: {
          composition: 8,
          aggregation: 5,
          realization: 10,
          serving: 12
        },
        coverage: {
          documented: 20,
          undocumented: 3,
          completeness: 0.87
        }
      }
    },
    timestamp: new Date().toISOString()
  };

      return (
      
    <div className="p-4 max-w-3xl bg-white dark:bg-gray-800">
      <ToolInvocationCard
        toolName={toolInvocation.toolName}
        toolInput={toolInvocation.toolInput}
        status={toolInvocation.status}
        timestamp={toolInvocation.timestamp}
      />
    </div>
  
    );
  }
};

/**
 * Tool with complex nested input
 */
export const ComplexInput: Story = {
  render: () => {
const toolInvocation: ToolInvocationContent = {
    type: 'tool_invocation',
    toolUseId: 'tool-5',
    toolName: 'createChangeset',
    toolInput: {
      name: 'Add payment gateway integration',
      description: 'Integrate Stripe payment gateway for subscription management',
      changes: [
        {
          operation: 'add',
          element: {
            id: 'tech.service.stripe-gateway',
            type: 'TechnologyService',
            name: 'Stripe Payment Gateway',
            properties: {
              vendor: 'Stripe',
              version: 'v2024-01',
              protocol: 'REST/HTTPS'
            }
          }
        },
        {
          operation: 'modify',
          elementId: 'app.component.subscription-manager',
          changes: {
            addRelationship: {
              type: 'uses',
              target: 'tech.service.stripe-gateway'
            }
          }
        }
      ]
    },
    status: {
      state: 'completed',
      result: {
        changesetId: 'cs-2024-02-10-001',
        status: 'created',
        affectedElements: 2
      }
    },
    timestamp: new Date().toISOString()
  };

      return (
      
    <div className="p-4 max-w-3xl bg-white dark:bg-gray-800">
      <ToolInvocationCard
        toolName={toolInvocation.toolName}
        toolInput={toolInvocation.toolInput}
        status={toolInvocation.status}
        timestamp={toolInvocation.timestamp}
      />
    </div>
  
    );
  }
};
