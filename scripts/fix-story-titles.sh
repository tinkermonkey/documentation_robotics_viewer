#!/bin/bash
set -e

echo "=== Fixing corrupted story titles ==="

# Function to fix a title
fix_title() {
  local file="$1"
  local correct_title="$2"
  
  # Find and replace the entire title line
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s|title:.*|title: '$correct_title',|" "$file"
  else
    sed -i "s|title:.*|title: '$correct_title',|" "$file"
  fi
  
  echo "Fixed: $file"
}

# Fix all Panels & Sidebars files
fix_title "src/catalog/stories/01-primitives/panels-sidebars/BaseControlPanel.stories.tsx" "01 Primitives / Panels and Sidebars / BaseControlPanel"
fix_title "src/catalog/stories/01-primitives/panels-sidebars/MotivationControlPanel.stories.tsx" "01 Primitives / Panels and Sidebars / MotivationControlPanel"
fix_title "src/catalog/stories/01-primitives/panels-sidebars/C4ControlPanel.stories.tsx" "01 Primitives / Panels and Sidebars / C4ControlPanel"
fix_title "src/catalog/stories/01-primitives/panels-sidebars/BusinessLayerControls.stories.tsx" "01 Primitives / Panels and Sidebars / BusinessLayerControls"
fix_title "src/catalog/stories/01-primitives/panels-sidebars/MotivationFilterPanel.stories.tsx" "01 Primitives / Panels and Sidebars / MotivationFilterPanel"
fix_title "src/catalog/stories/01-primitives/panels-sidebars/C4FilterPanel.stories.tsx" "01 Primitives / Panels and Sidebars / C4FilterPanel"
fix_title "src/catalog/stories/01-primitives/panels-sidebars/LayoutPreferencesPanel.stories.tsx" "01 Primitives / Panels and Sidebars / LayoutPreferencesPanel"
fix_title "src/catalog/stories/01-primitives/panels-sidebars/BaseInspectorPanel.stories.tsx" "01 Primitives / Panels and Sidebars / BaseInspectorPanel"
fix_title "src/catalog/stories/01-primitives/panels-sidebars/MotivationInspectorPanel.stories.tsx" "01 Primitives / Panels and Sidebars / MotivationInspectorPanel"
fix_title "src/catalog/stories/01-primitives/panels-sidebars/C4InspectorPanel.stories.tsx" "01 Primitives / Panels and Sidebars / C4InspectorPanel"
fix_title "src/catalog/stories/01-primitives/panels-sidebars/ProcessInspectorPanel.stories.tsx" "01 Primitives / Panels and Sidebars / ProcessInspectorPanel"
fix_title "src/catalog/stories/01-primitives/panels-sidebars/GraphViewSidebar.stories.tsx" "01 Primitives / Panels and Sidebars / GraphViewSidebar"
fix_title "src/catalog/stories/01-primitives/panels-sidebars/ModelLayersSidebar.stories.tsx" "01 Primitives / Panels and Sidebars / ModelLayersSidebar"
fix_title "src/catalog/stories/01-primitives/panels-sidebars/MotivationRightSidebar.stories.tsx" "01 Primitives / Panels and Sidebars / MotivationRightSidebar"
fix_title "src/catalog/stories/01-primitives/panels-sidebars/C4RightSidebar.stories.tsx" "01 Primitives / Panels and Sidebars / C4RightSidebar"
fix_title "src/catalog/stories/01-primitives/panels-sidebars/AnnotationPanel.stories.tsx" "01 Primitives / Panels and Sidebars / AnnotationPanel"
fix_title "src/catalog/stories/01-primitives/panels-sidebars/ChangesetViewer.stories.tsx" "01 Primitives / Panels and Sidebars / ChangesetViewer"
fix_title "src/catalog/stories/01-primitives/panels-sidebars/MotivationContextMenu.stories.tsx" "01 Primitives / Panels and Sidebars / MotivationContextMenu"

echo "=== Title fixes complete! ==="
