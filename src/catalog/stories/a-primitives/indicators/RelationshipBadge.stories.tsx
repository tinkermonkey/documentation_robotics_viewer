import type { StoryDefault, Story } from '@ladle/react';
import { RelationshipBadge } from '@/core/nodes/motivation/RelationshipBadge';

export default {
  title: 'A - Primitives / Indicators / RelationshipBadge',
} satisfies StoryDefault;

const nodeWithBadgeStyle = {
  position: 'relative' as const,
  width: '160px',
  height: '80px',
  background: '#fff',
  border: '2px solid #d1d5db',
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '13px',
  fontWeight: 500,
  color: '#374151'
};

const containerStyle = {
  padding: '20px',
  background: '#f9fafb',
  borderRadius: '8px',
  display: 'flex',
  gap: '20px',
  flexWrap: 'wrap' as const,
  alignItems: 'flex-start'
};

export const Default: Story = () => (
  <div style={containerStyle}>
    <div style={nodeWithBadgeStyle}>
      Goal Node
      <RelationshipBadge
        badge={{ count: 5, incoming: 3, outgoing: 2 }}
        isDimmed={true}
      />
    </div>
  </div>
);

export const Influences: Story = () => (
  <div style={containerStyle}>
    <div style={nodeWithBadgeStyle}>
      Influences Goal
      <RelationshipBadge
        badge={{ count: 8, incoming: 5, outgoing: 3 }}
        isDimmed={true}
      />
    </div>
  </div>
);

export const Constrains: Story = () => (
  <div style={containerStyle}>
    <div style={nodeWithBadgeStyle}>
      Constraint Node
      <RelationshipBadge
        badge={{ count: 3, incoming: 2, outgoing: 1 }}
        isDimmed={true}
      />
    </div>
  </div>
);

export const Realizes: Story = () => (
  <div style={containerStyle}>
    <div style={nodeWithBadgeStyle}>
      Realizes Req
      <RelationshipBadge
        badge={{ count: 12, incoming: 7, outgoing: 5 }}
        isDimmed={true}
      />
    </div>
  </div>
);

export const Refines: Story = () => (
  <div style={containerStyle}>
    <div style={nodeWithBadgeStyle}>
      Refines Goal
      <RelationshipBadge
        badge={{ count: 6, incoming: 4, outgoing: 2 }}
        isDimmed={true}
      />
    </div>
  </div>
);

export const Conflicts: Story = () => (
  <div style={containerStyle}>
    <div style={nodeWithBadgeStyle}>
      Conflicts With
      <RelationshipBadge
        badge={{ count: 2, incoming: 1, outgoing: 1 }}
        isDimmed={true}
      />
    </div>
  </div>
);

export const HighConnectionCount: Story = () => (
  <div style={containerStyle}>
    <div style={nodeWithBadgeStyle}>
      Hub Node
      <RelationshipBadge
        badge={{ count: 42, incoming: 25, outgoing: 17 }}
        isDimmed={true}
      />
    </div>
  </div>
);

export const NotDimmed: Story = () => (
  <div style={containerStyle}>
    <div style={nodeWithBadgeStyle}>
      Active Node
      <RelationshipBadge
        badge={{ count: 5, incoming: 3, outgoing: 2 }}
        isDimmed={false}
      />
    </div>
  </div>
);

export const ZeroRelationships: Story = () => (
  <div style={containerStyle}>
    <div style={nodeWithBadgeStyle}>
      Isolated Node
      <RelationshipBadge
        badge={{ count: 0, incoming: 0, outgoing: 0 }}
        isDimmed={true}
      />
    </div>
  </div>
);
