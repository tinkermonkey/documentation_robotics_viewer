/**
 * ChatTextContent Component Stories
 * Demonstrates markdown text rendering in chat messages
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChatTextContent } from '@/apps/embedded/components/chat/ChatTextContent';

const meta = {
  title: 'D Chat / Messages / ChatTextContent',
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Plain text without markdown
 */
export const PlainText: Story = { render: () => (
    
    <div className="p-4 max-w-3xl bg-white dark:bg-gray-800">
      <ChatTextContent content="This is a simple text message without any markdown formatting." />
    </div>
  
  ) };

/**
 * Text with markdown formatting
 */
export const WithMarkdown: Story = {
  render: () => {
const content = `
Here's a **bold** statement and an *italic* one.

You can also have \`inline code\` in your messages.

Lists work too:
- Item one
- Item two
- Item three
  `;

      return (
      
    <div className="p-4 max-w-3xl bg-white dark:bg-gray-800">
      <ChatTextContent content={content} />
    </div>
  
    );
  }
};

/**
 * Code block with syntax highlighting
 */
export const CodeBlock: Story = {
  render: () => {
const content = `
Here's an example TypeScript function:

\`\`\`typescript
interface Goal {
  id: string;
  name: string;
  description: string;
}

function findGoals(model: MetaModel): Goal[] {
  return model.elements.filter(e => e.type === 'Goal');
}
\`\`\`

This demonstrates syntax highlighting in chat.
  `;

      return (
      
    <div className="p-4 max-w-3xl bg-white dark:bg-gray-800">
      <ChatTextContent content={content} />
    </div>
  
    );
  }
};

/**
 * Table formatting
 */
export const Table: Story = {
  render: () => {
const content = `
Here's a summary of the layers:

| Layer | Element Count | Status |
|-------|--------------|--------|
| Motivation | 12 | Complete |
| Business | 8 | In Progress |
| Application | 15 | Complete |
| Technology | 6 | Planned |
  `;

      return (
      
    <div className="p-4 max-w-3xl bg-white dark:bg-gray-800">
      <ChatTextContent content={content} />
    </div>
  
    );
  }
};

/**
 * Links and references
 */
export const Links: Story = {
  render: () => {
const content = `
You can learn more about:
- [ArchiMate specification](https://www.opengroup.org/archimate-forum)
- [React Flow documentation](https://reactflow.dev)
- [Documentation Robotics](https://github.com/austinsanders/documentation-robotics)

Reference format: See element \`motivation.goal.improve-customer-satisfaction\` for details.
  `;

      return (
      
    <div className="p-4 max-w-3xl bg-white dark:bg-gray-800">
      <ChatTextContent content={content} />
    </div>
  
    );
  }
};

/**
 * Nested lists with mixed content
 */
export const NestedLists: Story = {
  render: () => {
const content = `
Architecture analysis results:

1. **Motivation Layer**
   - 3 business goals identified
   - 5 stakeholders mapped
   - Key constraint: \`budget.2024.q1 < $500k\`

2. **Business Layer**
   - Business capabilities aligned with goals
   - Service dependencies tracked
   - *Note: Missing 2 capability definitions*

3. **Application Layer**
   - Component relationships validated
   - API contracts documented
   - Database schemas defined
  `;

      return (
      
    <div className="p-4 max-w-3xl bg-white dark:bg-gray-800">
      <ChatTextContent content={content} />
    </div>
  
    );
  }
};
