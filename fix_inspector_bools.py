import os
import re

def fix_inspector_bools():
    file_path = 'src/apps/embedded/components/MotivationInspectorPanel.tsx'
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return

    with open(file_path, 'r') as f:
        content = f.read()

    # Regex to find properties checks in JSX
    # Pattern: element.properties?.PROP &&
    # Replacement: !!element.properties?.PROP &&
    
    # We need to be careful not to double !! if already there (unlikely here)
    
    # Specific properties we saw errors for:
    props = ['description', 'priority', 'status', 'negotiability', 'category']
    
    for prop in props:
        pattern = f'element.properties\\?\\.{prop} &&'
        replacement = f'!!element.properties?.{prop} &&'
        content = re.sub(pattern, replacement, content)

    with open(file_path, 'w') as f:
        f.write(content)
    print(f"Fixed {file_path}")

if __name__ == '__main__':
    fix_inspector_bools()
