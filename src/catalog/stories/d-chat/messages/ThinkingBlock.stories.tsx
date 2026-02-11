/**
 * ThinkingBlock Component Stories
 * Demonstrates the collapsible reasoning display for extended thinking
 */
import type { Meta, StoryObj } from '@storybook/react';
import { ThinkingBlock } from '@/apps/embedded/components/chat/ThinkingBlock';

const meta = {
  title: 'D Chat / Messages / ThinkingBlock',
} satisfies Meta;

export default meta;
type Story = StoryObj;

/**
 * Short thinking content (initially collapsed)
 */
export const Short: Story = {
  render: () => {
const content = "The user is asking about stakeholders. I should search the motivation layer for stakeholder elements.";

      return (
      
    <div className="p-4 max-w-3xl bg-white dark:bg-gray-800">
      <ThinkingBlock content={content} />
    </div>
  
    );
  }
};

/**
 * Extended thinking with analysis
 */
export const Extended: Story = {
  render: () => {
const content = `
To answer this question comprehensively, I need to:

1. Identify all business goals in the motivation layer
2. Trace their relationships to constraints
3. Map constraints to technology limitations
4. Analyze the impact on application architecture

Starting with the motivation layer, I can see three primary business goals: customer satisfaction, cost reduction, and time to market. Each of these has specific constraints...
  `;

      return (
      
    <div className="p-4 max-w-3xl bg-white dark:bg-gray-800">
      <ThinkingBlock content={content} />
    </div>
  
    );
  }
};

/**
 * Thinking with structured reasoning
 */
export const Structured: Story = {
  render: () => {
const content = `
**Analysis Approach:**

1. Layer Identification
   - Motivation layer contains strategic elements
   - Business layer defines capabilities
   - Application layer maps to technical components

2. Relationship Tracing
   - Goals realize outcomes
   - Capabilities support goals
   - Applications implement capabilities

3. Validation
   - Check for orphaned elements
   - Verify relationship constraints
   - Identify missing connections

**Conclusion:** The model structure follows standard ArchiMate patterns and appears well-formed.
  `;

      return (
      
    <div className="p-4 max-w-3xl bg-white dark:bg-gray-800">
      <ThinkingBlock content={content} />
    </div>
  
    );
  }
};

/**
 * Very long thinking content
 */
export const VeryLong: Story = {
  render: () => {
const content = `
Let me break down this complex question systematically:

**Part 1: Understanding the Request**
The user wants to know how the motivation layer influences the business layer design. This requires analyzing both the explicit relationships (realizes, influences) and implicit dependencies.

**Part 2: Data Analysis**
First, I'll examine the motivation layer structure:
- 5 business goals identified
- 3 stakeholder groups defined
- 8 constraints documented
- 4 principles established

Each goal has specific outcomes that need to be achieved through business capabilities.

**Part 3: Relationship Mapping**
Goals → Capabilities:
- "Improve customer satisfaction" → "Customer Support", "Product Quality"
- "Reduce operational costs" → "Process Automation", "Resource Optimization"
- "Accelerate time to market" → "Agile Development", "Rapid Deployment"

**Part 4: Constraint Analysis**
Constraints limit how we can implement capabilities:
- Budget constraints → limit technology choices
- Regulatory requirements → mandate compliance features
- Technical debt → affects refactoring priorities

**Part 5: Synthesis**
The motivation layer provides the "why" that shapes the "what" in the business layer. Without clear strategic drivers, business capabilities become arbitrary collections of functions rather than purposeful enablers of organizational goals.

**Recommendation:**
Ensure every business capability traces back to at least one motivation element (goal, driver, or requirement) to maintain strategic alignment.
  `;

      return (
      
    <div className="p-4 max-w-3xl bg-white dark:bg-gray-800">
      <ThinkingBlock content={content} />
    </div>
  
    );
  }
};
