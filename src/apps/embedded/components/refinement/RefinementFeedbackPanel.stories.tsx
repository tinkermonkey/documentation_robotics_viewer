import type { StoryDefault, Story } from '@ladle/react';
import { RefinementFeedbackPanel } from './RefinementFeedbackPanel';
import type { RefinementIteration, RefinementStatus } from '../../types/refinement';

export default {
  title: 'Refinement / RefinementFeedbackPanel',
} satisfies StoryDefault;

const mockIteration1: RefinementIteration = {
  iterationNumber: 1,
  timestamp: new Date().toISOString(),
  qualityScore: {
    nodeOverlap: 0.15,
    edgeCrossing: 0.12,
    edgeLength: 0.75,
    angularResolution: 0.8,
    symmetry: 0.7,
    combinedScore: 0.72,
  },
  screenshotUrl: 'data:image/svg+xml,<svg/>',
  improved: false,
  improvementDelta: 0,
  parameters: {
    forceDirected: {
      chargeStrength: -1000,
      linkDistance: 150,
      centerForce: 0.5,
      iterations: 300,
    },
  },
  durationMs: 1200,
};

const mockIteration2: RefinementIteration = {
  iterationNumber: 2,
  timestamp: new Date().toISOString(),
  qualityScore: {
    nodeOverlap: 0.08,
    edgeCrossing: 0.08,
    edgeLength: 0.82,
    angularResolution: 0.85,
    symmetry: 0.78,
    combinedScore: 0.82,
  },
  screenshotUrl: 'data:image/svg+xml,<svg/>',
  improved: true,
  improvementDelta: 0.10,
  parameters: {
    forceDirected: {
      chargeStrength: -1200,
      linkDistance: 170,
      centerForce: 0.6,
      iterations: 300,
    },
  },
  feedback: {
    aspect: 'spacing',
    direction: 'increase',
    intensity: 'moderate',
    timestamp: new Date().toISOString(),
  },
  durationMs: 1350,
};

const mockIteration3: RefinementIteration = {
  iterationNumber: 3,
  timestamp: new Date().toISOString(),
  qualityScore: {
    nodeOverlap: 0.03,
    edgeCrossing: 0.05,
    edgeLength: 0.88,
    angularResolution: 0.90,
    symmetry: 0.85,
    combinedScore: 0.91,
  },
  screenshotUrl: 'data:image/svg+xml,<svg/>',
  improved: true,
  improvementDelta: 0.09,
  parameters: {
    forceDirected: {
      chargeStrength: -1500,
      linkDistance: 200,
      centerForce: 0.7,
      iterations: 300,
    },
  },
  durationMs: 1400,
};

export const InProgress: Story = () => (
  <div className="w-96 bg-white border border-gray-200">
    <RefinementFeedbackPanel
      currentIteration={mockIteration1}
      iterations={[mockIteration1]}
      status="waiting_feedback"
      onFeedback={(aspect, direction, intensity, comment) =>
        console.log('Feedback:', { aspect, direction, intensity, comment })
      }
      onApprove={() => console.log('Approve')}
      onContinue={() => console.log('Continue')}
      onStop={() => console.log('Stop')}
      onRevert={() => console.log('Revert')}
      isProcessing={false}
    />
  </div>
);

export const SecondIteration: Story = () => (
  <div className="w-96 bg-white border border-gray-200">
    <RefinementFeedbackPanel
      currentIteration={mockIteration2}
      iterations={[mockIteration1, mockIteration2]}
      status="waiting_feedback"
      onFeedback={(aspect, direction, intensity, comment) =>
        console.log('Feedback:', { aspect, direction, intensity, comment })
      }
      onApprove={() => console.log('Approve')}
      onContinue={() => console.log('Continue')}
      onStop={() => console.log('Stop')}
      onRevert={() => console.log('Revert')}
      isProcessing={false}
    />
  </div>
);

export const Processing: Story = () => (
  <div className="w-96 bg-white border border-gray-200">
    <RefinementFeedbackPanel
      currentIteration={mockIteration2}
      iterations={[mockIteration1, mockIteration2]}
      status="refining"
      onFeedback={(aspect, direction, intensity, comment) =>
        console.log('Feedback:', { aspect, direction, intensity, comment })
      }
      onApprove={() => console.log('Approve')}
      onContinue={() => console.log('Continue')}
      onStop={() => console.log('Stop')}
      onRevert={() => console.log('Revert')}
      isProcessing={true}
    />
  </div>
);

export const Completed: Story = () => (
  <div className="w-96 bg-white border border-gray-200">
    <RefinementFeedbackPanel
      currentIteration={mockIteration3}
      iterations={[mockIteration1, mockIteration2, mockIteration3]}
      status="completed"
      onFeedback={(aspect, direction, intensity, comment) =>
        console.log('Feedback:', { aspect, direction, intensity, comment })
      }
      onApprove={() => console.log('Approve')}
      onContinue={() => console.log('Continue')}
      onStop={() => console.log('Stop')}
      onRevert={() => console.log('Revert')}
      isProcessing={false}
    />
  </div>
);
