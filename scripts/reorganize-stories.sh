#!/bin/bash
set -e

echo "=== Phase 2: Moving Story Files ==="

# 01 Primitives - Toolbars (2)
echo "Moving toolbars..."
git mv src/apps/embedded/components/GraphToolbar.stories.tsx src/catalog/stories/01-primitives/toolbars/
git mv src/apps/embedded/components/shared/ExportButtonGroup.stories.tsx src/catalog/stories/01-primitives/toolbars/

# 01 Primitives - Data Viewers (3)
echo "Moving data viewers..."
git mv src/apps/embedded/components/common/AttributesTable.stories.tsx src/catalog/stories/01-primitives/data-viewers/
git mv src/apps/embedded/components/common/MetadataGrid.stories.tsx src/catalog/stories/01-primitives/data-viewers/
git mv src/apps/embedded/components/ChangesetList.stories.tsx src/catalog/stories/01-primitives/data-viewers/

# 01 Primitives - Navigation (5)
echo "Moving navigation..."
git mv src/apps/embedded/components/shared/BreadcrumbNav.stories.tsx src/catalog/stories/01-primitives/navigation/
git mv src/apps/embedded/components/SubTabNavigation.stories.tsx src/catalog/stories/01-primitives/navigation/
git mv src/apps/embedded/components/MotivationBreadcrumb.stories.tsx src/catalog/stories/01-primitives/navigation/
git mv src/apps/embedded/components/C4BreadcrumbNav.stories.tsx src/catalog/stories/01-primitives/navigation/
git mv src/apps/embedded/components/shared/ViewToggle.stories.tsx src/catalog/stories/01-primitives/navigation/

# 01 Primitives - Indicators (3)
echo "Moving indicators..."
git mv src/apps/embedded/components/ConnectionStatus.stories.tsx src/catalog/stories/01-primitives/indicators/
git mv src/core/nodes/motivation/RelationshipBadge.stories.tsx src/catalog/stories/01-primitives/indicators/
git mv src/apps/embedded/components/MiniMap.stories.tsx src/catalog/stories/01-primitives/indicators/

# 01 Primitives - State Panels (12)
echo "Moving state panels..."
git mv src/apps/embedded/components/shared/EmptyState.stories.tsx src/catalog/stories/01-primitives/state-panels/
git mv src/apps/embedded/components/shared/ErrorState.stories.tsx src/catalog/stories/01-primitives/state-panels/
git mv src/apps/embedded/components/shared/LoadingState.stories.tsx src/catalog/stories/01-primitives/state-panels/
git mv src/apps/embedded/components/ErrorBoundary.stories.tsx src/catalog/stories/01-primitives/state-panels/
git mv src/core/components/base/RenderPropErrorBoundary.stories.tsx src/catalog/stories/01-primitives/state-panels/
git mv src/apps/embedded/components/CoverageSummaryPanel.stories.tsx src/catalog/stories/01-primitives/state-panels/
git mv src/apps/embedded/components/GraphStatisticsPanel.stories.tsx src/catalog/stories/01-primitives/state-panels/
git mv src/apps/embedded/components/HighlightedPathPanel.stories.tsx src/catalog/stories/01-primitives/state-panels/
git mv src/apps/embedded/components/OperationLegend.stories.tsx src/catalog/stories/01-primitives/state-panels/
git mv src/apps/embedded/components/LayerTypesLegend.stories.tsx src/catalog/stories/01-primitives/state-panels/
git mv src/apps/embedded/components/common/ExpandableSection.stories.tsx src/catalog/stories/01-primitives/state-panels/
git mv src/apps/embedded/components/shared/FilterPanel.stories.tsx src/catalog/stories/01-primitives/state-panels/

# 01 Primitives - Panels & Sidebars (18)
echo "Moving panels and sidebars..."
git mv src/core/components/base/BaseControlPanel.stories.tsx src/catalog/stories/01-primitives/panels-sidebars/
git mv src/apps/embedded/components/MotivationControlPanel.stories.tsx src/catalog/stories/01-primitives/panels-sidebars/
git mv src/apps/embedded/components/C4ControlPanel.stories.tsx src/catalog/stories/01-primitives/panels-sidebars/
git mv src/apps/embedded/components/businessLayer/BusinessLayerControls.stories.tsx src/catalog/stories/01-primitives/panels-sidebars/
git mv src/apps/embedded/components/MotivationFilterPanel.stories.tsx src/catalog/stories/01-primitives/panels-sidebars/
git mv src/apps/embedded/components/C4FilterPanel.stories.tsx src/catalog/stories/01-primitives/panels-sidebars/
git mv src/apps/embedded/components/LayoutPreferencesPanel.stories.tsx src/catalog/stories/01-primitives/panels-sidebars/
git mv src/core/components/base/BaseInspectorPanel.stories.tsx src/catalog/stories/01-primitives/panels-sidebars/
git mv src/apps/embedded/components/MotivationInspectorPanel.stories.tsx src/catalog/stories/01-primitives/panels-sidebars/
git mv src/apps/embedded/components/C4InspectorPanel.stories.tsx src/catalog/stories/01-primitives/panels-sidebars/
git mv src/apps/embedded/components/businessLayer/ProcessInspectorPanel.stories.tsx src/catalog/stories/01-primitives/panels-sidebars/
git mv src/core/components/base/GraphViewSidebar.stories.tsx src/catalog/stories/01-primitives/panels-sidebars/
git mv src/apps/embedded/components/ModelLayersSidebar.stories.tsx src/catalog/stories/01-primitives/panels-sidebars/
git mv src/apps/embedded/components/MotivationRightSidebar.stories.tsx src/catalog/stories/01-primitives/panels-sidebars/
git mv src/apps/embedded/components/C4RightSidebar.stories.tsx src/catalog/stories/01-primitives/panels-sidebars/
git mv src/apps/embedded/components/AnnotationPanel.stories.tsx src/catalog/stories/01-primitives/panels-sidebars/
git mv src/apps/embedded/components/ChangesetViewer.stories.tsx src/catalog/stories/01-primitives/panels-sidebars/
git mv src/apps/embedded/components/MotivationContextMenu.stories.tsx src/catalog/stories/01-primitives/panels-sidebars/

# 01 Primitives - Interactions (1)
echo "Moving interactions..."
git mv src/core/components/SpaceMouseHandler.stories.tsx src/catalog/stories/01-primitives/interactions/

# 02 Details - Spec Details (2)
echo "Moving spec details..."
git mv src/apps/embedded/components/SpecViewer.stories.tsx src/catalog/stories/02-details/spec-details/
git mv src/apps/embedded/components/SchemaInfoPanel.stories.tsx src/catalog/stories/02-details/spec-details/

# 02 Details - Model Details (2)
echo "Moving model details..."
git mv src/apps/embedded/components/ModelJSONViewer.stories.tsx src/catalog/stories/02-details/model-details/
git mv src/apps/embedded/components/NodeDetailsPanel.stories.tsx src/catalog/stories/02-details/model-details/

# 03 Graphs - Nodes - Base (3)
echo "Moving base nodes..."
git mv src/core/nodes/BaseFieldListNode.stories.tsx src/catalog/stories/03-graphs/nodes/base/
git mv src/core/nodes/JSONSchemaNode.stories.tsx src/catalog/stories/03-graphs/nodes/base/
git mv src/core/nodes/LayerContainerNode.stories.tsx src/catalog/stories/03-graphs/nodes/base/

# 03 Graphs - Nodes - Motivation (10)
echo "Moving motivation nodes..."
git mv src/core/nodes/motivation/GoalNode.stories.tsx src/catalog/stories/03-graphs/nodes/motivation/
git mv src/core/nodes/motivation/StakeholderNode.stories.tsx src/catalog/stories/03-graphs/nodes/motivation/
git mv src/core/nodes/motivation/ConstraintNode.stories.tsx src/catalog/stories/03-graphs/nodes/motivation/
git mv src/core/nodes/motivation/DriverNode.stories.tsx src/catalog/stories/03-graphs/nodes/motivation/
git mv src/core/nodes/motivation/OutcomeNode.stories.tsx src/catalog/stories/03-graphs/nodes/motivation/
git mv src/core/nodes/motivation/PrincipleNode.stories.tsx src/catalog/stories/03-graphs/nodes/motivation/
git mv src/core/nodes/motivation/AssumptionNode.stories.tsx src/catalog/stories/03-graphs/nodes/motivation/
git mv src/core/nodes/motivation/AssessmentNode.stories.tsx src/catalog/stories/03-graphs/nodes/motivation/
git mv src/core/nodes/motivation/ValueStreamNode.stories.tsx src/catalog/stories/03-graphs/nodes/motivation/
git mv src/core/nodes/motivation/RequirementNode.stories.tsx src/catalog/stories/03-graphs/nodes/motivation/

# 03 Graphs - Nodes - Business (3)
echo "Moving business nodes..."
git mv src/core/nodes/business/BusinessFunctionNode.stories.tsx src/catalog/stories/03-graphs/nodes/business/
git mv src/core/nodes/business/BusinessServiceNode.stories.tsx src/catalog/stories/03-graphs/nodes/business/
git mv src/core/nodes/business/BusinessCapabilityNode.stories.tsx src/catalog/stories/03-graphs/nodes/business/

# 03 Graphs - Nodes - C4 (3)
echo "Moving C4 nodes..."
git mv src/core/nodes/c4/ContainerNode.stories.tsx src/catalog/stories/03-graphs/nodes/c4/
git mv src/core/nodes/c4/ComponentNode.stories.tsx src/catalog/stories/03-graphs/nodes/c4/
git mv src/core/nodes/c4/ExternalActorNode.stories.tsx src/catalog/stories/03-graphs/nodes/c4/

# 03 Graphs - Edges - Base (2)
echo "Moving base edges..."
git mv src/core/edges/ElbowEdge.stories.tsx src/catalog/stories/03-graphs/edges/base/
git mv src/core/edges/CrossLayerEdge.stories.tsx src/catalog/stories/03-graphs/edges/base/

# 03 Graphs - Edges - Motivation (5)
echo "Moving motivation edges..."
git mv src/core/edges/motivation/InfluenceEdge.stories.tsx src/catalog/stories/03-graphs/edges/motivation/
git mv src/core/edges/motivation/RefinesEdge.stories.tsx src/catalog/stories/03-graphs/edges/motivation/
git mv src/core/edges/motivation/RealizesEdge.stories.tsx src/catalog/stories/03-graphs/edges/motivation/
git mv src/core/edges/motivation/ConstrainsEdge.stories.tsx src/catalog/stories/03-graphs/edges/motivation/
git mv src/core/edges/motivation/ConflictsEdge.stories.tsx src/catalog/stories/03-graphs/edges/motivation/

# 03 Graphs - Views (6)
echo "Moving graph views..."
git mv src/core/components/GraphViewer.stories.tsx src/catalog/stories/03-graphs/views/
git mv src/apps/embedded/components/MotivationGraphView.stories.tsx src/catalog/stories/03-graphs/views/
git mv src/apps/embedded/components/C4GraphView.stories.tsx src/catalog/stories/03-graphs/views/
git mv src/apps/embedded/components/ChangesetGraphView.stories.tsx src/catalog/stories/03-graphs/views/
git mv src/apps/embedded/components/SpecGraphView.stories.tsx src/catalog/stories/03-graphs/views/
git mv src/apps/embedded/components/businessLayer/BusinessLayerView.stories.tsx src/catalog/stories/03-graphs/views/

# 04 Chat - Components (1)
echo "Moving chat components..."
git mv src/catalog/components/chat/ChatComponents.stories.tsx src/catalog/stories/04-chat/components/

# 04 Chat - Containers (2)
echo "Moving chat containers..."
git mv src/apps/embedded/components/ChatPanelContainer.stories.tsx src/catalog/stories/04-chat/containers/
git mv src/apps/embedded/components/FloatingChatPanel.stories.tsx src/catalog/stories/04-chat/containers/

# 05 Compositions - Spec (1)
echo "Moving spec compositions..."
git mv src/catalog/components/SpecRouteComposition.stories.tsx src/catalog/stories/05-compositions/spec-compositions/

# 05 Compositions - Graph (1)
echo "Moving graph compositions..."
git mv src/catalog/components/ModelRouteComposition.stories.tsx src/catalog/stories/05-compositions/graph-compositions/

# 05 Compositions - Layouts (1)
echo "Moving layout compositions..."
git mv src/apps/embedded/components/SharedLayout.stories.tsx src/catalog/stories/05-compositions/layouts/

echo "=== File moves complete! ==="
