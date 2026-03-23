/**
 * Real Layer Fixture Factories
 * Creates MetaModel instances from the actual YAML data in documentation-robotics/model/
 * These fixtures embed real architecture data for use in Storybook stories
 */

import type { MetaModel, Layer, ModelElement, Relationship, RelationshipTypeValue } from '../../core/types';
import { LayerType } from '../../core/types';

function createVisual(position = { x: 0, y: 0 }) {
  return {
    position,
    size: { width: 180, height: 80 },
    style: {
      backgroundColor: '#ffffff',
      borderColor: '#d1d5db',
      borderStyle: 'solid' as const,
      textColor: '#000000',
    },
  };
}

function el(
  id: string,
  type: string,
  name: string,
  layerId: string,
  description: string,
  properties: Record<string, unknown> = {}
): ModelElement {
  return {
    id,
    type,
    name,
    layerId,
    description,
    properties,
    visual: createVisual(),
    relationships: { incoming: [], outgoing: [] },
  };
}

function rel(
  id: string,
  type: RelationshipTypeValue,
  sourceId: string,
  targetId: string
): Relationship {
  return { id, type, sourceId, targetId };
}

/**
 * Real motivation layer from documentation-robotics/model/01_motivation/
 * Includes all goals, outcomes, drivers, principles, requirements, constraints,
 * assessments, and assumptions with intra-layer relationships from relationships.yaml
 */
export function createRealMotivationLayerModel(): MetaModel {
  const layerId = 'motivation';

  const elements: ModelElement[] = [
    // Goals (goals.yaml)
    el(
      'motivation.goal.visualize-architecture',
      'goal',
      'Visualize Architecture',
      layerId,
      'Provide interactive visualization of DR models across all layers',
      { goal: { measurable: 'true', kpi: 'Initial render time < 3s for 500 elements' } }
    ),
    el(
      'motivation.goal.enable-collaboration',
      'goal',
      'Enable Cross-Team Collaboration',
      layerId,
      'Provide a shared visualization platform that enables architects, developers, and stakeholders to communicate about architecture using a common visual language'
    ),
    el(
      'motivation.goal.support-embedding',
      'goal',
      'Support Embedded Integration',
      layerId,
      'Enable seamless embedding of architecture visualizations into documentation platforms, wikis, and development tools'
    ),
    el(
      'motivation.goal.maintain-performance',
      'goal',
      'Maintain High Performance',
      layerId,
      'Deliver fast, responsive visualization even for large architecture models with hundreds of elements through optimized rendering and layout algorithms'
    ),
    el(
      'motivation.goal.ensure-accessibility',
      'goal',
      'Ensure Universal Accessibility',
      layerId,
      'Make architecture visualizations accessible to all users including those using assistive technologies, meeting WCAG 2.1 AA standards'
    ),

    // Outcomes (outcomes.yaml)
    el(
      'motivation.outcome.improved-architecture-understanding',
      'outcome',
      'Improved Architecture Understanding',
      layerId,
      'Teams gain clear understanding of system architecture through interactive visualizations, reducing onboarding time and architectural drift',
      { outcome: { metric: 'Onboarding time reduction', target: '40% faster architecture comprehension' } }
    ),
    el(
      'motivation.outcome.increased-documentation-adoption',
      'outcome',
      'Increased Documentation Adoption',
      layerId,
      'Architecture documentation becomes living, interactive resource that teams actively use and maintain',
      { outcome: { metric: 'Documentation usage frequency', target: '3x increase in documentation views' } }
    ),
    el(
      'motivation.outcome.reduced-architectural-debt',
      'outcome',
      'Reduced Architectural Debt',
      layerId,
      'Visual traceability enables teams to identify and resolve architectural inconsistencies before they become technical debt',
      { outcome: { metric: 'Architecture violation count', target: '50% reduction in cross-layer violations' } }
    ),
    el(
      'motivation.outcome.faster-impact-analysis',
      'outcome',
      'Faster Impact Analysis',
      layerId,
      'Automated cross-layer traceability enables rapid assessment of change impact across architectural layers',
      { outcome: { metric: 'Impact analysis time', target: 'From hours to minutes' } }
    ),
    el(
      'motivation.outcome.standardized-architecture-documentation',
      'outcome',
      'Standardized Architecture Documentation',
      layerId,
      'Organization-wide adoption of Documentation Robotics format creates consistent, machine-readable architecture documentation',
      { outcome: { metric: 'Documentation format consistency', target: '80% of projects using DR format' } }
    ),
    el(
      'motivation.outcome.enhanced-collaboration',
      'outcome',
      'Enhanced Cross-Team Collaboration',
      layerId,
      'Shared visual language enables better communication between architects, developers, and stakeholders',
      { outcome: { metric: 'Cross-team alignment score', target: '30% improvement in architecture alignment' } }
    ),

    // Drivers (drivers.yaml)
    el(
      'motivation.driver.architecture-understanding',
      'driver',
      'Architecture Understanding',
      layerId,
      'Teams struggle to understand complex multi-layer architecture relationships without visual tools',
      { driver: { category: 'business', priority: 'high', source: 'internal-stakeholder' } }
    ),
    el(
      'motivation.driver.tooling-fragmentation',
      'driver',
      'Tooling Fragmentation',
      layerId,
      "Existing architecture tools don't support Documentation Robotics format, forcing manual diagram creation",
      { driver: { category: 'technical', priority: 'high', source: 'internal-stakeholder' } }
    ),
    el(
      'motivation.driver.documentation-drift',
      'driver',
      'Documentation Drift',
      layerId,
      'Architecture documentation becomes outdated quickly when not synchronized with code',
      { driver: { category: 'business', priority: 'medium', source: 'customer' } }
    ),
    el(
      'motivation.driver.performance-requirements',
      'driver',
      'Performance Requirements',
      layerId,
      'Large architecture models (500+ elements) require optimized rendering to maintain usability',
      { driver: { category: 'technical', priority: 'high', source: 'internal-stakeholder' } }
    ),
    el(
      'motivation.driver.accessibility-mandate',
      'driver',
      'Accessibility Mandate',
      layerId,
      'Legal and organizational requirements mandate WCAG 2.1 AA compliance for all tools',
      { driver: { category: 'compliance', priority: 'critical', source: 'external' } }
    ),
    el(
      'motivation.driver.embedding-requirement',
      'driver',
      'Embedding Requirement',
      layerId,
      'Documentation sites need embeddable visualizations without full application deployment',
      { driver: { category: 'business', priority: 'high', source: 'customer' } }
    ),

    // Principles (principles.yaml)
    el(
      'motivation.principle.user-centric-design',
      'principle',
      'User-Centric Design',
      layerId,
      'All design decisions prioritize the user experience. The interface should be intuitive, discoverable, and require minimal learning curve.'
    ),
    el(
      'motivation.principle.performance-first',
      'principle',
      'Performance First',
      layerId,
      'Performance is a feature, not an afterthought. All components must meet defined performance targets: initial render under 3 seconds for 500 elements.'
    ),
    el(
      'motivation.principle.accessibility-by-default',
      'principle',
      'Accessibility by Default',
      layerId,
      'Accessibility is built into every component from the start, not retrofitted. The application must meet WCAG 2.1 AA compliance.'
    ),
    el(
      'motivation.principle.progressive-enhancement',
      'principle',
      'Progressive Enhancement',
      layerId,
      'Core functionality works in basic environments with enhanced features for capable browsers. The application degrades gracefully when advanced features are unavailable.'
    ),

    // Requirements (requirements.yaml)
    el(
      'motivation.requirement.interactive-graphs',
      'requirement',
      'Interactive Graph Navigation',
      layerId,
      'Users must be able to pan, zoom, and interact with architecture graphs at 60fps minimum',
      { requirement: { priority: 'high', type: 'non-functional', source: 'motivation.goal.visualize-architecture' } }
    ),
    el(
      'motivation.requirement.embedded-mode',
      'requirement',
      'Embedded Mode Support',
      layerId,
      'Viewer must function as embedded component in documentation sites and external applications',
      { requirement: { priority: 'high', type: 'functional', source: 'motivation.goal.visualize-architecture' } }
    ),
    el(
      'motivation.requirement.fast-rendering',
      'requirement',
      'Fast Initial Rendering',
      layerId,
      'Graph visualization must render within 3 seconds for models with 500 elements',
      { requirement: { priority: 'high', type: 'non-functional', metric: '<3s for 500 elements' } }
    ),
    el(
      'motivation.requirement.wcag-compliance',
      'requirement',
      'WCAG 2.1 AA Compliance',
      layerId,
      'All interactive elements must meet WCAG 2.1 Level AA accessibility standards',
      { requirement: { priority: 'critical', type: 'non-functional', compliance: 'WCAG2.1-AA' } }
    ),
    el(
      'motivation.requirement.cross-layer-traceability',
      'requirement',
      'Cross-Layer Traceability',
      layerId,
      'System must support bidirectional traceability between all 12 architectural layers',
      { requirement: { priority: 'high', type: 'functional' } }
    ),

    // Constraints (constraints.yaml)
    el(
      'motivation.constraint.browser-compatibility',
      'constraint',
      'Browser Compatibility',
      layerId,
      'Application targets modern evergreen browsers only: Chrome/Edge 90+, Firefox 90+, Safari 14+.',
      { constraint: { source: 'technical-decision', negotiable: 'false', 'commitment-type': 'hard' } }
    ),
    el(
      'motivation.constraint.accessibility-requirements',
      'constraint',
      'Accessibility Requirements',
      layerId,
      'Application must comply with WCAG 2.1 Level AA accessibility standards including keyboard navigation and screen reader support.',
      { constraint: { source: 'compliance', negotiable: 'false', 'commitment-type': 'hard', 'compliance-requirements': 'WCAG 2.1 AA' } }
    ),
    el(
      'motivation.constraint.performance-targets',
      'constraint',
      'Performance Targets',
      layerId,
      'Strict performance requirements: initial render under 3 seconds for 500-element graphs, filter operations under 500ms.',
      { constraint: { source: 'product-requirements', negotiable: 'partially', 'commitment-type': 'soft' } }
    ),
    el(
      'motivation.constraint.technology-stack',
      'constraint',
      'Technology Stack Constraint',
      layerId,
      'Application must use React 18+ with TypeScript, React Flow for graph visualization, Vite for build tooling, Tailwind CSS for styling.',
      { constraint: { source: 'technical-decision', negotiable: 'false', 'commitment-type': 'hard' } }
    ),

    // Assessments (assessments.yaml)
    el(
      'motivation.assessment.react-flow-vs-custom',
      'assessment',
      'React Flow vs Custom Visualization',
      layerId,
      'Trade-off between using React Flow library versus building custom graph visualization. Decision: use-react-flow.',
      { assessment: { decision: 'use-react-flow', rationale: 'React Flow provides mature graph rendering with accessibility' } }
    ),
    el(
      'motivation.assessment.yaml-vs-json-schema',
      'assessment',
      'YAML Instance vs JSON Schema Only',
      layerId,
      'Trade-off between YAML instance format and pure JSON Schema approach. Decision: support-both.',
      { assessment: { decision: 'support-both', rationale: 'YAML is more human-friendly for authoring, JSON Schema provides validation' } }
    ),
    el(
      'motivation.assessment.embedding-strategy',
      'assessment',
      'Embedding Strategy',
      layerId,
      'Trade-off between iframe embedding versus direct component integration. Decision: iframe-with-postmessage.',
      { assessment: { decision: 'iframe-with-postmessage', rationale: 'Iframe provides security isolation and version independence' } }
    ),
    el(
      'motivation.assessment.state-management',
      'assessment',
      'State Management Approach',
      layerId,
      'Trade-off between Redux, Context API, and Zustand for state management. Decision: use-zustand.',
      { assessment: { decision: 'use-zustand', rationale: 'Zustand provides simple, performant state management without Redux boilerplate' } }
    ),

    // Assumptions (assumptions.yaml)
    el(
      'motivation.assumption.modern-browsers',
      'assumption',
      'Modern Browser Availability',
      layerId,
      'Users have access to modern browsers supporting ES2022, Web Workers, and Canvas API',
      { assumption: { validity: 'high', 'impact-if-false': 'high', mitigation: 'Progressive enhancement with graceful degradation' } }
    ),
    el(
      'motivation.assumption.react-flow-stability',
      'assumption',
      'React Flow Library Stability',
      layerId,
      'React Flow library will maintain API stability and continue active development',
      { assumption: { validity: 'medium', 'impact-if-false': 'critical', mitigation: 'Abstraction layer for layout engine to enable replacement' } }
    ),
    el(
      'motivation.assumption.yaml-format-adoption',
      'assumption',
      'YAML Format Adoption',
      layerId,
      'Architecture teams will adopt YAML-based instance format over pure JSON Schema',
      { assumption: { validity: 'medium', 'impact-if-false': 'medium', mitigation: 'Support both YAML and JSON Schema formats' } }
    ),
    el(
      'motivation.assumption.network-latency',
      'assumption',
      'Reasonable Network Latency',
      layerId,
      'Network latency for model loading will be under 500ms for typical usage',
      { assumption: { validity: 'medium', 'impact-if-false': 'medium', mitigation: 'Local caching, offline mode, progressive loading' } }
    ),
  ];

  // Intra-layer relationships from documentation-robotics/model/relationships.yaml
  const relationships: Relationship[] = [
    rel('mrel-1', 'influence', 'motivation.principle.performance-first', 'motivation.goal.visualize-architecture'),
    rel('mrel-2', 'influence', 'motivation.principle.user-centric-design', 'motivation.requirement.interactive-graphs'),
    rel('mrel-3', 'influence', 'motivation.principle.accessibility-by-default', 'motivation.constraint.accessibility-requirements'),
    rel('mrel-4', 'influence', 'motivation.principle.progressive-enhancement', 'motivation.requirement.embedded-mode'),
    rel('mrel-5', 'influence', 'motivation.constraint.performance-targets', 'motivation.principle.performance-first'),
    rel('mrel-6', 'influence', 'motivation.constraint.accessibility-requirements', 'motivation.principle.accessibility-by-default'),
    rel('mrel-7', 'aggregation', 'motivation.goal.visualize-architecture', 'motivation.requirement.interactive-graphs'),
    rel('mrel-8', 'aggregation', 'motivation.goal.visualize-architecture', 'motivation.requirement.embedded-mode'),
    rel('mrel-9', 'influence', 'motivation.constraint.technology-stack', 'motivation.goal.visualize-architecture'),
  ];

  const layer: Layer = {
    id: layerId,
    type: LayerType.Motivation,
    name: 'Motivation',
    description:
      'Strategic intent, goals, principles, requirements, constraints, and assessments driving the DR Viewer project',
    order: 1,
    elements,
    relationships,
  };

  return {
    id: 'dr-viewer-motivation-layer',
    name: 'Documentation Robotics Viewer',
    version: '0.1.0',
    description: 'Motivation layer from the DR Viewer architecture model',
    layers: { motivation: layer },
    references: [],
  };
}

/**
 * Real business layer from documentation-robotics/model/02_business/
 * Includes all services and capabilities with realization relationships
 * derived from the x-realized-by properties in the YAML files
 */
export function createRealBusinessLayerModel(): MetaModel {
  const layerId = 'business';

  const elements: ModelElement[] = [
    // Services (services.yaml)
    el(
      'business.service.architecture-visualization',
      'businessService',
      'Architecture Visualization',
      layerId,
      'Visualize architecture models as interactive graphs across multiple layers'
    ),
    el(
      'business.service.model-data-management',
      'businessService',
      'Model Data Management',
      layerId,
      'Load, parse, and manage architecture model data from various sources'
    ),
    el(
      'business.service.documentation-export',
      'businessService',
      'Documentation Export',
      layerId,
      'Export architecture visualizations and reports in multiple formats'
    ),
    el(
      'business.service.external-model-integration',
      'businessService',
      'External Model Integration',
      layerId,
      'Integrate with external sources like GitHub to fetch and serve models'
    ),
    el(
      'business.service.architecture-analysis',
      'businessService',
      'Architecture Analysis',
      layerId,
      'Analyze architecture for impact, traceability, and dependencies'
    ),
    el(
      'business.service.quality-assurance',
      'businessService',
      'Quality Assurance',
      layerId,
      'Ensure visualization quality through testing, metrics, and comparison'
    ),

    // Capabilities (capabilities.yaml)
    el(
      'business.capability.visualization',
      'capabilitie',
      'Visualization',
      layerId,
      'Rendering of architectural models as interactive graphs'
    ),
    el(
      'business.capability.documentation',
      'capabilitie',
      'Documentation',
      layerId,
      'Displaying detailed documentation for model elements'
    ),
    el(
      'business.capability.export',
      'capabilitie',
      'Export',
      layerId,
      'Exporting views as images or data'
    ),
    el(
      'business.capability.model-authoring',
      'capabilitie',
      'Model Authoring',
      layerId,
      'Creating and editing architecture model elements via CLI or UI'
    ),
    el(
      'business.capability.collaboration',
      'capabilitie',
      'Collaboration',
      layerId,
      'Multi-user editing with annotations, comments, and real-time updates'
    ),
    el(
      'business.capability.version-control',
      'capabilitie',
      'Version Control',
      layerId,
      'Model versioning, changesets, branching, and history tracking'
    ),
    el(
      'business.capability.search-discovery',
      'capabilitie',
      'Search & Discovery',
      layerId,
      'Finding elements, searching model content, and navigating architecture'
    ),
    el(
      'business.capability.reporting',
      'capabilitie',
      'Reporting',
      layerId,
      'Generating architecture reports, impact analysis, and traceability documentation'
    ),
    el(
      'business.capability.integration',
      'capabilitie',
      'Integration',
      layerId,
      'API access, webhooks, and third-party tool integrations'
    ),
    el(
      'business.capability.administration',
      'capabilitie',
      'Administration',
      layerId,
      'User management, permissions, system configuration, and monitoring'
    ),
  ];

  // Service → Capability realization relationships (from x-realized-by in services.yaml)
  const relationships: Relationship[] = [
    rel('brel-1', 'realization', 'business.service.architecture-visualization', 'business.capability.visualization'),
    rel('brel-2', 'realization', 'business.service.architecture-analysis', 'business.capability.documentation'),
    rel('brel-3', 'realization', 'business.service.documentation-export', 'business.capability.export'),
    rel('brel-4', 'realization', 'business.service.model-data-management', 'business.capability.model-authoring'),
    rel('brel-5', 'realization', 'business.service.external-model-integration', 'business.capability.collaboration'),
    rel('brel-6', 'realization', 'business.service.model-data-management', 'business.capability.version-control'),
    rel('brel-7', 'realization', 'business.service.architecture-analysis', 'business.capability.search-discovery'),
    rel('brel-8', 'realization', 'business.service.documentation-export', 'business.capability.reporting'),
    rel('brel-9', 'realization', 'business.service.external-model-integration', 'business.capability.integration'),
    rel('brel-10', 'realization', 'business.service.quality-assurance', 'business.capability.administration'),
  ];

  const layer: Layer = {
    id: layerId,
    type: LayerType.Business,
    name: 'Business',
    description: 'Business services and capabilities of the Documentation Robotics Viewer',
    order: 2,
    elements,
    relationships,
  };

  return {
    id: 'dr-viewer-business-layer',
    name: 'Documentation Robotics Viewer',
    version: '0.1.0',
    description: 'Business layer from the DR Viewer architecture model',
    layers: { business: layer },
    references: [],
  };
}
