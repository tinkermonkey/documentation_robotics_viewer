#!/bin/bash
# Serve the built viewer bundle for the Playwright E2E suite (playwright.config.ts's webServer).
#
# The viewer reads project data through the dr CLI's central process (`dr serve`), which serves every project
# and checkout of a farm behind one token. This script gives the suite one of its own, isolated from the
# user's farm and from any other dr process:
#   - a scratch farm with ONE project, `viewer`, whose repository is a clone of this checkout's HEAD (so the
#     suite sees the committed model, has exactly one checkout, `main`, and its annotation writes never touch
#     the working tree);
#   - its own state and config dirs, and no sweep of other viewers (DR_VIEWER_PROCESS_SCAN=off);
#   - `dr serve --foreground` on $E2E_PORT (default 8099) with the bundle;
#   - tests/e2e/.server.json = { baseURL, token, project, checkout }, read by tests/e2e/server.ts.
#
# Needs a dr CLI with `dr serve` (documentation_robotics#1279). DR_CLI overrides the command, e.g.
#   DR_CLI="node ~/workspace/documentation_robotics/cli/dist/cli.js" npm run test:e2e
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${E2E_PORT:-8099}"
DR="${DR_CLI:-dr}"
BUNDLE="$ROOT/dist/embedded/dr-viewer-bundle"
WORK="${TMPDIR:-/tmp}"
WORK="${WORK%/}/dr-viewer-e2e-$PORT"
INFO="$ROOT/tests/e2e/.server.json"

if ! $DR serve --help >/dev/null 2>&1; then
  echo "e2e-server: '$DR' has no 'dr serve' (needs a dr CLI with documentation_robotics#1279). Set DR_CLI." >&2
  exit 1
fi
[ -f "$BUNDLE/index.html" ] || { echo "e2e-server: no bundle at $BUNDLE (run npm run build)" >&2; exit 1; }

rm -rf "$WORK" "$INFO"
mkdir -p "$WORK/farm" "$WORK/state" "$WORK/config"
git clone --quiet --no-hardlinks "$ROOT" "$WORK/repo"

cat > "$WORK/farm/farm.yaml" <<EOF
schema: dr-farm-v2
name: viewer-e2e
projects:
  viewer:
    name: viewer
    repository: $WORK/repo
    model: $WORK/repo/documentation-robotics/model
EOF

export DR_FARM_PATH="$WORK/farm" DR_STATE_DIR="$WORK/state" XDG_CONFIG_HOME="$WORK/config" DR_VIEWER_PROCESS_SCAN=off

cd "$WORK/repo"
$DR serve --foreground --port "$PORT" --viewer-path "$BUNDLE" &
SERVER=$!
trap 'kill "$SERVER" 2>/dev/null; wait "$SERVER" 2>/dev/null; rm -f "$INFO"' EXIT INT TERM

for _ in $(seq 1 60); do
  curl -sf "http://localhost:$PORT/health" >/dev/null && break
  kill -0 "$SERVER" 2>/dev/null || { echo "e2e-server: dr serve exited" >&2; exit 1; }
  sleep 0.5
done
TOKEN_FILE="$(ls "$WORK/state/servers/"*.token 2>/dev/null | head -1)"
[ -n "$TOKEN_FILE" ] || { echo "e2e-server: no token in $WORK/state/servers" >&2; exit 1; }

printf '{"baseURL":"http://localhost:%s","token":"%s","project":"viewer","checkout":"main"}\n' \
  "$PORT" "$(cat "$TOKEN_FILE")" > "$INFO"
echo "e2e-server: serving $BUNDLE on :$PORT (project viewer, checkout main)"
wait "$SERVER"
