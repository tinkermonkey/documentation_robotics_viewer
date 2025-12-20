/**
 * Annotation Fixture Factories
 * Creates realistic mock annotations for testing annotation-related components
 */

import type { Annotation, AnnotationReply } from '../../apps/embedded/types/annotations';

/**
 * Options for creating annotation fixtures
 */
interface AnnotationOptions {
  id?: string;
  elementId?: string;
  author?: string;
  content?: string;
  createdAt?: string;
  updatedAt?: string;
  resolved?: boolean;
  replies?: AnnotationReply[];
}

/**
 * Create a single annotation fixture
 */
export function createAnnotationFixture(options: AnnotationOptions = {}): Annotation {
  const now = new Date().toISOString();

  return {
    id: options.id || `annotation-${Math.random().toString(36).substr(2, 9)}`,
    elementId: options.elementId || `goal-1`,
    author: options.author || 'John Doe',
    content: options.content || 'This is a sample annotation for testing purposes.',
    createdAt: options.createdAt || now,
    updatedAt: options.updatedAt,
    resolved: options.resolved ?? false,
    replies: options.replies
  };
}

/**
 * Create multiple annotations for testing lists
 */
export function createAnnotationListFixture(count: number = 5): Annotation[] {
  const elements = ['goal-1', 'requirement-1', 'service-1', 'component-1', 'container-1'];
  const authors = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'];
  const contents = [
    'This needs clarification',
    'Great point!',
    'Can we discuss this further?',
    'This should be updated',
    'Approved for release'
  ];

  const annotations: Annotation[] = [];

  for (let i = 0; i < count; i++) {
    const date = new Date();
    date.setHours(date.getHours() - i);

    annotations.push({
      id: `annotation-${i}`,
      elementId: elements[i % elements.length],
      author: authors[i % authors.length],
      content: contents[i % contents.length],
      createdAt: date.toISOString(),
      resolved: i % 3 === 0, // 1 in 3 are resolved
      replies: i % 2 === 0 ? createAnnotationReplyFixture() : undefined
    });
  }

  return annotations;
}

/**
 * Create annotation reply fixtures
 */
function createAnnotationReplyFixture(): AnnotationReply[] {
  const date = new Date();
  date.setHours(date.getHours() - 1);

  return [
    {
      id: `reply-1`,
      author: 'Support',
      content: 'Thank you for your feedback. We will address this.',
      createdAt: date.toISOString()
    }
  ];
}

/**
 * Create a resolved annotation fixture
 */
export function createResolvedAnnotationFixture(options: AnnotationOptions = {}): Annotation {
  return createAnnotationFixture({
    ...options,
    resolved: true,
    updatedAt: new Date().toISOString()
  });
}

/**
 * Create unresolved annotations for testing pending issues
 */
export function createUnresolvedAnnotationsFixture(count: number = 3): Annotation[] {
  const baseAnnotations = createAnnotationListFixture(count);
  return baseAnnotations.map(ann => ({ ...ann, resolved: false }));
}

/**
 * Create annotations grouped by element for testing element-specific panels
 */
export function createAnnotationsByElementFixture(): Record<string, Annotation[]> {
  return {
    'goal-1': [
      createAnnotationFixture({
        elementId: 'goal-1',
        author: 'Alice',
        content: 'Need to clarify the priority for this goal'
      }),
      createAnnotationFixture({
        elementId: 'goal-1',
        author: 'Bob',
        content: 'Agreed, let\'s discuss in the next meeting',
        resolved: true
      })
    ],
    'requirement-1': [
      createAnnotationFixture({
        elementId: 'requirement-1',
        author: 'Charlie',
        content: 'This requirement conflicts with requirement-2'
      })
    ],
    'service-1': [
      createAnnotationFixture({
        elementId: 'service-1',
        author: 'Diana',
        content: 'Consider performance implications'
      }),
      createAnnotationFixture({
        elementId: 'service-1',
        author: 'Eve',
        content: 'We need to benchmark this',
        resolved: true
      }),
      createAnnotationFixture({
        elementId: 'service-1',
        author: 'Alice',
        content: 'Updated with latest performance metrics'
      })
    ]
  };
}

/**
 * Create annotation thread (original + replies) for testing discussion features
 */
export function createAnnotationThreadFixture(): Annotation {
  const now = new Date().toISOString();
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

  return {
    id: 'annotation-thread-1',
    elementId: 'goal-1',
    author: 'Alice',
    content: 'Should we reconsider the timeline for this goal?',
    createdAt: twoHoursAgo,
    resolved: false,
    replies: [
      {
        id: 'reply-1',
        author: 'Bob',
        content: 'I agree, the current timeline is too aggressive.',
        createdAt: oneHourAgo
      },
      {
        id: 'reply-2',
        author: 'Alice',
        content: 'Let\'s propose a revised timeline next week.',
        createdAt: now
      }
    ]
  };
}

/**
 * Create annotations in various states for comprehensive testing
 */
export function createAnnotationStatesFixture(): {
  new: Annotation;
  unresolved: Annotation;
  resolved: Annotation;
  withReplies: Annotation;
} {
  const now = new Date().toISOString();
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  return {
    new: createAnnotationFixture({
      id: 'annotation-new',
      author: 'Alice',
      content: 'Just created this annotation',
      createdAt: now,
      resolved: false
    }),
    unresolved: createAnnotationFixture({
      id: 'annotation-unresolved',
      author: 'Bob',
      content: 'This issue still needs attention',
      createdAt: yesterday,
      resolved: false
    }),
    resolved: createAnnotationFixture({
      id: 'annotation-resolved',
      author: 'Charlie',
      content: 'This has been resolved',
      createdAt: yesterday,
      updatedAt: now,
      resolved: true
    }),
    withReplies: createAnnotationThreadFixture()
  };
}

/**
 * Create annotations with different authors for team collaboration testing
 */
export function createTeamAnnotationsFixture(): Annotation[] {
  const teams = {
    'Product': ['Alice', 'Bob'],
    'Engineering': ['Charlie', 'Diana'],
    'Design': ['Eve', 'Frank'],
    'QA': ['Grace', 'Henry']
  };

  const annotations: Annotation[] = [];
  let id = 0;

  Object.entries(teams).forEach(([team, members]) => {
    members.forEach((author) => {
      annotations.push(
        createAnnotationFixture({
          id: `team-annotation-${id++}`,
          author,
          content: `Comment from ${team} team member ${author}`,
          elementId: `element-${id % 5}`
        })
      );
    });
  });

  return annotations;
}

/**
 * Create high-volume annotations for performance testing
 */
export function createLargeAnnotationSetFixture(count: number = 100): Annotation[] {
  const annotations: Annotation[] = [];
  const elements = Array.from({ length: 10 }, (_, i) => `element-${i}`);
  const authors = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'];

  for (let i = 0; i < count; i++) {
    const date = new Date();
    date.setMinutes(date.getMinutes() - i);

    annotations.push({
      id: `annotation-${i}`,
      elementId: elements[i % elements.length],
      author: authors[i % authors.length],
      content: `Annotation #${i}: Lorem ipsum dolor sit amet`,
      createdAt: date.toISOString(),
      resolved: Math.random() > 0.7 // 30% resolved
    });
  }

  return annotations;
}

/**
 * Create examples of different annotation patterns for documentation
 */
export function createAnnotationExamplesFixture(): Record<string, Annotation> {
  return {
    question: createAnnotationFixture({
      author: 'Alice',
      content: 'Does this requirement account for GDPR compliance?'
    }),
    suggestion: createAnnotationFixture({
      author: 'Bob',
      content: 'Consider adding caching to improve performance'
    }),
    concern: createAnnotationFixture({
      author: 'Charlie',
      content: 'This might conflict with the existing API contracts'
    }),
    approval: createResolvedAnnotationFixture({
      author: 'Diana',
      content: 'Approved! Ready for implementation.'
    }),
    actionItem: createAnnotationFixture({
      author: 'Eve',
      content: 'TODO: Update the documentation after release'
    }),
    followUp: createAnnotationFixture({
      author: 'Frank',
      content: '@Alice - Can you clarify your earlier point about scope?'
    })
  };
}
