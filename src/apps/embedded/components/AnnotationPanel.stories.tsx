import type { StoryDefault, Story } from '@ladle/react';
import AnnotationPanel from './AnnotationPanel';
import { useAnnotationStore } from '../stores/annotationStore';
import { useModelStore } from '../../../core/stores/modelStore';
import { createAnnotationFixture, createAnnotationListFixture } from '@catalog/fixtures/annotationFixtures';
import { createCompleteModelFixture, createMinimalModelFixture } from '@catalog/fixtures/modelFixtures';
import { useEffect } from 'react';

export default {
  title: 'Panels & Inspectors / Common / AnnotationPanel',
} satisfies StoryDefault;

/**
 * Helper to set up store state for stories
 */
function AnnotationPanelStory({
  annotations = [],
  selectedElementId = null,
  modelOverride = null,
}: {
  annotations?: ReturnType<typeof createAnnotationFixture>[];
  selectedElementId?: string | null;
  modelOverride?: ReturnType<typeof createMinimalModelFixture> | null;
}) {
  useEffect(() => {
    // Initialize annotation store with fixtures
    useAnnotationStore.setState({
      annotations,
      selectedElementId,
      loading: false,
      error: null,
    });

    // Initialize model store
    const model = modelOverride || createCompleteModelFixture();
    useModelStore.setState({
      model,
      loading: false,
      error: null,
    });

    return () => {
      // Cleanup
      useAnnotationStore.setState({
        annotations: [],
        selectedElementId: null,
        loading: false,
        error: null,
      });
      useModelStore.setState({
        model: null,
        loading: false,
        error: null,
      });
    };
  }, [annotations, selectedElementId, modelOverride]);

  return <AnnotationPanel />;
}

export const Empty: Story = () => {
  return <AnnotationPanelStory annotations={[]} />;
};

export const WithAnnotations: Story = () => {
  const annotations = [
    createAnnotationFixture({
      id: 'ann-1',
      elementId: 'goal-1',
      author: 'Alice Johnson',
      content: 'This component needs clarification on the requirements.',
      resolved: false,
    }),
    createAnnotationFixture({
      id: 'ann-2',
      elementId: 'goal-1',
      author: 'Bob Smith',
      content: 'Agreed, let me update the specification.',
      resolved: false,
    }),
    createAnnotationFixture({
      id: 'ann-3',
      elementId: 'requirement-1',
      author: 'Charlie Davis',
      content: 'Looks good! This aligns with our architecture guidelines.',
      resolved: true,
    }),
  ];

  return <AnnotationPanelStory annotations={annotations} />;
};

export const WithSelectedElement: Story = () => {
  const annotations = [
    createAnnotationFixture({
      id: 'ann-1',
      elementId: 'goal-1',
      author: 'Alice',
      content: 'This goal needs metrics.',
      resolved: false,
    }),
    createAnnotationFixture({
      id: 'ann-2',
      elementId: 'goal-1',
      author: 'Bob',
      content: 'Metrics added in version 2.1',
      resolved: true,
    }),
    createAnnotationFixture({
      id: 'ann-3',
      elementId: 'requirement-2',
      author: 'Charlie',
      content: 'This is for a different element',
      resolved: false,
    }),
  ];

  return <AnnotationPanelStory annotations={annotations} selectedElementId="goal-1" />;
};

export const ManyAnnotations: Story = () => {
  const annotations = createAnnotationListFixture(10);
  return <AnnotationPanelStory annotations={annotations} />;
};

export const WithMentions: Story = () => {
  const annotations = [
    createAnnotationFixture({
      id: 'ann-1',
      elementId: 'goal-1',
      author: 'Alice',
      content: 'We need to align this with @business.service.authentication. See also @api.endpoint.secure for details.',
      resolved: false,
    }),
    createAnnotationFixture({
      id: 'ann-2',
      elementId: 'goal-1',
      author: 'Bob',
      content: 'Good point. I have updated @requirement.security to reflect this.',
      resolved: false,
    }),
  ];

  return <AnnotationPanelStory annotations={annotations} selectedElementId="goal-1" />;
};

export const WithReplies: Story = () => {
  const now = new Date();
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
  const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString();
  const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000).toISOString();

  const annotations = [
    createAnnotationFixture({
      id: 'ann-1',
      elementId: 'goal-1',
      author: 'Alice Johnson',
      content: 'What is the timeline for this initiative?',
      createdAt: twoHoursAgo,
      resolved: false,
      replies: [
        {
          id: 'reply-1',
          author: 'Bob Smith',
          content: 'Target Q2 2024.',
          createdAt: oneHourAgo,
        },
        {
          id: 'reply-2',
          author: 'Alice Johnson',
          content: 'Perfect, that aligns with our planning cycle.',
          createdAt: thirtyMinutesAgo,
        },
      ],
    }),
  ];

  return <AnnotationPanelStory annotations={annotations} selectedElementId="goal-1" />;
};

export const ResolvedAnnotations: Story = () => {
  const annotations = [
    createAnnotationFixture({
      id: 'ann-1',
      elementId: 'goal-1',
      author: 'Alice',
      content: 'Need to add performance metrics.',
      resolved: true,
    }),
    createAnnotationFixture({
      id: 'ann-2',
      elementId: 'goal-1',
      author: 'Bob',
      content: 'SLA defined in appendix C.',
      resolved: true,
    }),
    createAnnotationFixture({
      id: 'ann-3',
      elementId: 'goal-1',
      author: 'Charlie',
      content: 'Still needs cost analysis.',
      resolved: false,
    }),
  ];

  return <AnnotationPanelStory annotations={annotations} selectedElementId="goal-1" />;
};

export const Loading: Story = () => {
  useEffect(() => {
    useAnnotationStore.setState({
      annotations: [],
      loading: true,
      error: null,
    });

    const timer = setTimeout(() => {
      useAnnotationStore.setState({
        loading: false,
        annotations: createAnnotationListFixture(3),
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return <AnnotationPanel />;
};

export const Error: Story = () => {
  useEffect(() => {
    useAnnotationStore.setState({
      annotations: [],
      loading: false,
      error: 'Failed to load annotations. Please refresh the page.',
    });

    return () => {
      useAnnotationStore.setState({
        error: null,
      });
    };
  }, []);

  return <AnnotationPanel />;
};
