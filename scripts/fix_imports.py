#!/usr/bin/env python3
"""
Fix imports in moved story files to use absolute @/ imports
"""
import os
import re
from pathlib import Path

def fix_imports_in_file(filepath: Path):
    """Fix relative imports to use @/ absolute imports"""

    with open(filepath, 'r') as f:
        content = f.read()

    original = content

    # Map of old relative paths to new absolute paths
    replacements = [
        # Core components
        (r"from ['\"]\.\.?/.*?/([\w-]+)['\"];?", lambda m: determine_import_path(filepath, m.group(0), m.group(1))),
    ]

    # Apply all replacements
    for pattern, replacement in replacements:
        content = re.sub(pattern, replacement, content)

    # Only write if changed
    if content != original:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"✓ Fixed: {filepath.relative_to(Path.cwd())}")
        return True
    return False

def determine_import_path(story_file: Path, original_import: str, component_name: str) -> str:
    """
    Determine the correct @/ import path based on the component name and original import
    """

    # Extract the original path
    match = re.search(r"from ['\"](.+?)['\"]", original_import)
    if not match:
        return original_import

    rel_path = match.group(1)

    # Determine destination based on patterns
    if '/components/common/' in rel_path or component_name in ['AttributesTable', 'MetadataGrid', 'ExpandableSection']:
        return f"from '@/apps/embedded/components/common/{component_name}'"
    elif '/components/shared/' in rel_path or component_name in ['BreadcrumbNav', 'ViewToggle', 'EmptyState', 'ErrorState', 'LoadingState', 'FilterPanel', 'ExportButtonGroup']:
        return f"from '@/apps/embedded/components/shared/{component_name}'"
    elif '/components/businessLayer/' in rel_path or component_name in ['BusinessLayerView', 'BusinessLayerControls', 'ProcessInspectorPanel']:
        return f"from '@/apps/embedded/components/businessLayer/{component_name}'"
    elif '/components/chat/' in rel_path or component_name in ['ChatMessage', 'ChatTextContent', 'ThinkingBlock', 'ToolInvocationCard', 'UsageStatsBadge', 'ChatInput']:
        return f"from '@/apps/embedded/components/chat/{component_name}'"
    elif '/core/components/base/' in rel_path or component_name in ['BaseControlPanel', 'BaseInspectorPanel', 'GraphViewSidebar', 'RenderPropErrorBoundary']:
        return f"from '@/core/components/base/{component_name}'"
    elif '/core/components/' in rel_path or component_name in ['GraphViewer', 'SpaceMouseHandler']:
        return f"from '@/core/components/{component_name}'"
    elif '/core/nodes/motivation/' in rel_path:
        return f"from '@/core/nodes/motivation/{component_name}'"
    elif '/core/nodes/business/' in rel_path:
        return f"from '@/core/nodes/business/{component_name}'"
    elif '/core/nodes/c4/' in rel_path:
        return f"from '@/core/nodes/c4/{component_name}'"
    elif '/core/nodes/' in rel_path:
        return f"from '@/core/nodes/{component_name}'"
    elif '/core/edges/motivation/' in rel_path:
        return f"from '@/core/edges/motivation/{component_name}'"
    elif '/core/edges/' in rel_path:
        return f"from '@/core/edges/{component_name}'"
    elif component_name in ['ConnectionStatus', 'MiniMap', 'ChangesetList', 'GraphToolbar', 'MotivationBreadcrumb',
                            'C4BreadcrumbNav', 'SubTabNavigation', 'ErrorBoundary', 'CoverageSummaryPanel',
                            'GraphStatisticsPanel', 'HighlightedPathPanel', 'OperationLegend', 'LayerTypesLegend',
                            'MotivationControlPanel', 'C4ControlPanel', 'MotivationFilterPanel', 'C4FilterPanel',
                            'LayoutPreferencesPanel', 'MotivationInspectorPanel', 'C4InspectorPanel', 'ModelLayersSidebar',
                            'MotivationRightSidebar', 'C4RightSidebar', 'AnnotationPanel', 'ChangesetViewer',
                            'MotivationContextMenu', 'SpecViewer', 'SchemaInfoPanel', 'ModelJSONViewer', 'NodeDetailsPanel',
                            'MotivationGraphView', 'C4GraphView', 'ChangesetGraphView', 'SpecGraphView', 'ChatPanelContainer',
                            'FloatingChatPanel', 'SharedLayout']:
        return f"from '@/apps/embedded/components/{component_name}'"
    elif 'catalog/components' in rel_path or component_name in ['SpecRouteComposition', 'ModelRouteComposition']:
        return f"from '@/catalog/components/{component_name}'"
    else:
        # Keep original if we can't determine
        return original_import

def main():
    """Main entry point"""
    stories_dir = Path('src/catalog/stories')

    if not stories_dir.exists():
        print(f"Error: {stories_dir} does not exist")
        return

    # Find all .stories.tsx files
    story_files = list(stories_dir.rglob('*.stories.tsx'))

    print(f"Found {len(story_files)} story files")
    print("Fixing imports...")

    fixed_count = 0
    for story_file in story_files:
        if fix_imports_in_file(story_file):
            fixed_count += 1

    print(f"\n✓ Fixed imports in {fixed_count} files")

if __name__ == '__main__':
    main()
