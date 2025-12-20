#!/usr/bin/env bash

# Build the viewer and patch the installed documentation_robotics CLI package
# by overwriting its bundled static assets with the latest embedded bundle.

set -euo pipefail

ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$ROOT_DIR"

# Prefer repo .venv first, then $PYTHON, then active venv, then python3/python
if [[ -x "$ROOT_DIR/.venv/bin/python" ]]; then
  PY_BIN="$ROOT_DIR/.venv/bin/python"
elif [[ -n "${PYTHON:-}" ]]; then
  PY_BIN="$PYTHON"
elif [[ -n "${VIRTUAL_ENV:-}" && -x "${VIRTUAL_ENV}/bin/python" ]]; then
  PY_BIN="${VIRTUAL_ENV}/bin/python"
elif command -v python3 >/dev/null 2>&1; then
  PY_BIN="python3"
else
  PY_BIN="python"
fi

echo "[patch-cli] Using python executable: $PY_BIN"

echo "[patch-cli] Building viewer bundle (dist/embedded/dr-viewer-bundle)"
npm run build

BUNDLE_SRC="$ROOT_DIR/dist/embedded/dr-viewer-bundle"
if [[ ! -d "$BUNDLE_SRC" ]]; then
  echo "[patch-cli] ERROR: bundle not found at $BUNDLE_SRC" >&2
  exit 1
fi

echo "[patch-cli] Locating installed documentation_robotics package"
CLI_PKG_DIR=$($PY_BIN - <<'PY'
import importlib.util, pathlib
spec = importlib.util.find_spec("documentation_robotics")
if spec and spec.origin:
    print(pathlib.Path(spec.origin).parent)
PY
)

# Fallback: use pip show to locate installation
if [[ -z "$CLI_PKG_DIR" ]]; then
  for pkg in documentation-robotics documentation_robotics; do
    LOC=$($PY_BIN -m pip show "$pkg" 2>/dev/null | awk '/Location/ {print $2}' | head -n1)
    if [[ -n "$LOC" && -d "$LOC/documentation_robotics" ]]; then
      CLI_PKG_DIR="$LOC/documentation_robotics"
      break
    fi
  done
fi

if [[ -z "$CLI_PKG_DIR" ]]; then
  echo "[patch-cli] ERROR: documentation_robotics package not found in this environment." >&2
  echo "[patch-cli] Activate the environment where the CLI is installed, or reinstall the wheel." >&2
  exit 1
fi

echo "[patch-cli] Package path: $CLI_PKG_DIR"

echo "[patch-cli] Searching for viewer assets inside the package"
# Target the specific viewer/dist directory
INDEX_PATH="$CLI_PKG_DIR/viewer/dist/index.html"
if [[ ! -f "$INDEX_PATH" ]]; then
  echo "[patch-cli] ERROR: Could not find $INDEX_PATH" >&2
  exit 1
fi

TARGET_DIR=$(dirname "$INDEX_PATH")
echo "[patch-cli] Detected viewer directory: $TARGET_DIR"

echo "[patch-cli] Deploying viewer bundle from $BUNDLE_SRC"
# Copy all assets
rm -rf "$TARGET_DIR/assets"
cp -r "$BUNDLE_SRC/assets" "$TARGET_DIR/"
cp "$BUNDLE_SRC/manifest.json" "$TARGET_DIR/" 2>/dev/null || true
cp "$BUNDLE_SRC/README.md" "$TARGET_DIR/" 2>/dev/null || true

# Find the main JS hash from assets
MAIN_JS=$(ls "$TARGET_DIR/assets"/main-*.js 2>/dev/null | head -1 | xargs basename)
if [[ -z "$MAIN_JS" ]]; then
  echo "[patch-cli] ✗ ERROR: No main-*.js found in assets/" >&2
  exit 1
fi

MAIN_CSS=$(ls "$TARGET_DIR/assets"/main-*.css 2>/dev/null | head -1 | xargs basename)
if [[ -z "$MAIN_CSS" ]]; then
  echo "[patch-cli] ✗ ERROR: No main-*.css found in assets/" >&2
  exit 1
fi

# Generate index.html with correct hashes
cat > "$TARGET_DIR/index.html" << 'HTMLEOF'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Documentation Robotics Viewer</title>
    <script type="module" crossorigin src="/assets/MAIN_JS_PLACEHOLDER"></script>
    <link rel="modulepreload" crossorigin href="/assets/vendor-D1GZarmM.js">
    <link rel="modulepreload" crossorigin href="/assets/reactflow-CmOQzaa0.js">
    <link rel="stylesheet" crossorigin href="/assets/MAIN_CSS_PLACEHOLDER">
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
HTMLEOF

# Replace placeholders with actual hashes
sed -i '' "s|MAIN_JS_PLACEHOLDER|$MAIN_JS|g" "$TARGET_DIR/index.html"
sed -i '' "s|MAIN_CSS_PLACEHOLDER|$MAIN_CSS|g" "$TARGET_DIR/index.html"

echo "[patch-cli] ✓ Deployed assets with correct hashes"
echo "[patch-cli] ✓ Generated index.html referencing: $MAIN_JS"
echo "[patch-cli] ✓ Verified: file exists at assets/$MAIN_JS"