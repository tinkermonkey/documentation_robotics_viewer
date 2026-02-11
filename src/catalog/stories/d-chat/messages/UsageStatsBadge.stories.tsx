/**
 * UsageStatsBadge Component Stories
 * Demonstrates token usage and cost display
 */
import type { Meta, StoryObj } from '@storybook/react';
import { UsageStatsBadge } from '@/apps/embedded/components/chat/UsageStatsBadge';

const meta = {
  title: 'D Chat / Messages / UsageStatsBadge',
} satisfies Meta;

export default meta;
type Story = StoryObj;

/**
 * Small usage (< 1000 tokens)
 */
export const SmallUsage: Story = { render: () => (
    
    <div className="p-4 bg-white dark:bg-gray-800">
      <UsageStatsBadge
        inputTokens={350}
        outputTokens={180}
        totalTokens={530}
        totalCostUsd={0.0079}
      />
    </div>
  
  ) };

/**
 * Medium usage (1000-5000 tokens)
 */
export const MediumUsage: Story = { render: () => (
    
    <div className="p-4 bg-white dark:bg-gray-800">
      <UsageStatsBadge
        inputTokens={2100}
        outputTokens={850}
        totalTokens={2950}
        totalCostUsd={0.0443}
      />
    </div>
  
  ) };

/**
 * Large usage (> 5000 tokens)
 */
export const LargeUsage: Story = { render: () => (
    
    <div className="p-4 bg-white dark:bg-gray-800">
      <UsageStatsBadge
        inputTokens={8500}
        outputTokens={3200}
        totalTokens={11700}
        totalCostUsd={0.1755}
      />
    </div>
  
  ) };

/**
 * Very large usage with high cost
 */
export const VeryLargeUsage: Story = { render: () => (
    
    <div className="p-4 bg-white dark:bg-gray-800">
      <UsageStatsBadge
        inputTokens={25000}
        outputTokens={12000}
        totalTokens={37000}
        totalCostUsd={0.555}
      />
    </div>
  
  ) };

/**
 * Multiple badges in a row (typical usage)
 */
export const MultipleBadges: Story = { render: () => (
    
    <div className="p-4 space-y-4 bg-white dark:bg-gray-800">
      <div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Query 1: Simple question</p>
        <UsageStatsBadge
          inputTokens={450}
          outputTokens={220}
          totalTokens={670}
          totalCostUsd={0.0101}
        />
      </div>
      <div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Query 2: Complex analysis</p>
        <UsageStatsBadge
          inputTokens={3200}
          outputTokens={1800}
          totalTokens={5000}
          totalCostUsd={0.075}
        />
      </div>
      <div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Query 3: Model validation</p>
        <UsageStatsBadge
          inputTokens={1800}
          outputTokens={650}
          totalTokens={2450}
          totalCostUsd={0.0368}
        />
      </div>
    </div>
  
  ) };
