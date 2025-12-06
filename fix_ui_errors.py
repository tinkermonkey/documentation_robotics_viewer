import os
import re

def fix_motivation_inspector():
    file_path = 'src/apps/embedded/components/MotivationInspectorPanel.tsx'
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return

    with open(file_path, 'r') as f:
        content = f.read()

    # Fix description
    content = content.replace(
        '<span className="metadata-value">{element.properties.description}</span>',
        '<span className="metadata-value">{String(element.properties.description)}</span>'
    )

    # Fix priority
    content = content.replace(
        '{element.properties.priority}',
        '{String(element.properties.priority)}'
    )

    # Fix status
    content = content.replace(
        '{element.properties.status}',
        '{String(element.properties.status)}'
    )

    # Fix negotiability
    content = content.replace(
        '<span className="metadata-value">{element.properties.negotiability}</span>',
        '<span className="metadata-value">{String(element.properties.negotiability)}</span>'
    )

    # Fix category
    content = content.replace(
        '<span className="metadata-value">{element.properties.category}</span>',
        '<span className="metadata-value">{String(element.properties.category)}</span>'
    )

    # Fix achievementStatus
    content = content.replace(
        '{element.properties.achievementStatus}',
        '{String(element.properties.achievementStatus)}'
    )

    with open(file_path, 'w') as f:
        f.write(content)
    print(f"Fixed {file_path}")

def fix_motivation_filter_panel():
    file_path = 'src/apps/embedded/components/MotivationFilterPanel.tsx'
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return

    with open(file_path, 'r') as f:
        content = f.read()

    if 'assumption: string;' not in content and 'valueStream: string;' not in content:
        # Add missing keys to ELEMENT_TYPE_LABELS
        # It's a Record<MotivationElementType, string>
        # We need to find where the object is defined and add the keys.
        
        # Look for the end of the object
        pattern = r'(const ELEMENT_TYPE_LABELS: Record<MotivationElementType, string> = \{[^}]+)(\};)'
        
        def replacement(match):
            body = match.group(1)
            end = match.group(2)
            if 'assumption:' not in body:
                body += "  assumption: 'Assumption',\n"
            if 'valueStream:' not in body:
                body += "  valueStream: 'Value Stream',\n"
            return body + end

        content = re.sub(pattern, replacement, content, flags=re.DOTALL)

    with open(file_path, 'w') as f:
        f.write(content)
    print(f"Fixed {file_path}")

def fix_model_json_viewer():
    # This requires changing the Layer interface, which is likely in src/core/types/model.ts
    # But the error is in ModelJSONViewer.tsx accessing properties that don't exist on Layer.
    # So we should check src/core/types/model.ts first.
    pass

if __name__ == '__main__':
    fix_motivation_inspector()
    fix_motivation_filter_panel()
