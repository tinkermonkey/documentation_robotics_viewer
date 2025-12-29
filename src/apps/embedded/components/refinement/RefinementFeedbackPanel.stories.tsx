import type { StoryDefault, Story } from '@ladle/react';
import { RefinementFeedbackPanel } from './RefinementFeedbackPanel';
import type { RefinementIteration } from '../../types/refinement';

export default {
  title: 'Refinement / RefinementFeedbackPanel',
} satisfies StoryDefault;

const mockIteration1: RefinementIteration = {
  iterationNumber: 1,
  timestamp: new Date().toISOString(),
  qualityScore: {
    readabilityScore: 0.72,
    similarityScore: 0.70,
    combinedScore: 0.71,
    qualityClass: 'acceptable',
    meetsThreshold: true,
    breakdown: {
      graphMetrics: {} as any,
    },
    weights: {
      readability: 0.6,
      similarity: 0.4,
    },
    timestamp: new Date().toISOString(),
    computationTimeMs: 150,
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
    readabilityScore: 0.82,
    similarityScore: 0.78,
    combinedScore: 0.80,
    qualityClass: 'good',
    meetsThreshold: true,
    breakdown: {
      graphMetrics: {} as any,
    },
    weights: {
      readability: 0.6,
      similarity: 0.4,
    },
    timestamp: new Date().toISOString(),
    computationTimeMs: 180,
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
    readabilityScore: 0.91,
    similarityScore: 0.88,
    combinedScore: 0.89,
    qualityClass: 'excellent',
    meetsThreshold: true,
    breakdown: {
      graphMetrics: {} as any,
    },
    weights: {
      readability: 0.6,
      similarity: 0.4,
    },
    timestamp: new Date().toISOString(),
    computationTimeMs: 200,
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
      referenceImageUrl="data:image/svg+xml,<svg/>"
      generatedScreenshotUrl="data:image/svg+xml,<svg/>"
      iterations={[mockIteration1]}
      status="awaiting_feedback"
      onFeedback={(feedback) =>
        console.log('Feedback:', feedback)
      }
      onApprove={() => console.log('Approve')}
      onReject={() => console.log('Reject')}
      onContinue={() => console.log('Continue')}
      onRefine={() => console.log('Refine')}
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
      referenceImageUrl="data:image/svg+xml,<svg/>"
      generatedScreenshotUrl="data:image/svg+xml,<svg/>"
      iterations={[mockIteration1, mockIteration2]}
      status="awaiting_feedback"
      onFeedback={(feedback) =>
        console.log('Feedback:', feedback)
      }
      onApprove={() => console.log('Approve')}
      onReject={() => console.log('Reject')}
      onContinue={() => console.log('Continue')}
      onRefine={() => console.log('Refine')}
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
      referenceImageUrl="data:image/svg+xml,<svg/>"
      generatedScreenshotUrl="data:image/svg+xml,<svg/>"
      iterations={[mockIteration1, mockIteration2]}
      status="running"
      onFeedback={(feedback) =>
        console.log('Feedback:', feedback)
      }
      onApprove={() => console.log('Approve')}
      onReject={() => console.log('Reject')}
      onContinue={() => console.log('Continue')}
      onRefine={() => console.log('Refine')}
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
      referenceImageUrl="data:image/svg+xml,<svg/>"
      generatedScreenshotUrl="data:image/svg+xml,<svg/>"
      iterations={[mockIteration1, mockIteration2, mockIteration3]}
      status="completed"
      onFeedback={(feedback) =>
        console.log('Feedback:', feedback)
      }
      onApprove={() => console.log('Approve')}
      onReject={() => console.log('Reject')}
      onContinue={() => console.log('Continue')}
      onRefine={() => console.log('Refine')}
      onStop={() => console.log('Stop')}
      onRevert={() => console.log('Revert')}
      isProcessing={false}
    />
  </div>
);
