#!/usr/bin/env bash

# E2E Triage Script for Auth Token Persistence
# Starts dr visualize and validates the auth token flow with curl

set -euo pipefail

ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$ROOT_DIR"

DR_CMD="$ROOT_DIR/.venv/bin/dr"
if [[ ! -x "$DR_CMD" ]]; then
  echo "ERROR: dr command not found in .venv/bin" >&2
  exit 1
fi

PORT="${1:-8000}"
echo "[triage] Starting dr visualize on port $PORT"

# Start the CLI server in background
TEMP_LOG=$(mktemp)
trap "rm -f $TEMP_LOG; pkill -P $$ -f 'dr visualize' 2>/dev/null || true" EXIT

echo "[triage] Starting: $DR_CMD visualize --port $PORT"
"$DR_CMD" visualize --port "$PORT" > "$TEMP_LOG" 2>&1 &
CLI_PID=$!
echo "[triage] CLI process ID: $CLI_PID"

# Wait for magic link
echo "[triage] Waiting for magic link..."
MAGIC_LINK=""
for i in {1..120}; do
  MAGIC_LINK=$(grep -oE "http://localhost:$PORT/\?token=[A-Za-z0-9_-]+" "$TEMP_LOG" 2>/dev/null | head -1 || true)
  if [[ -n "$MAGIC_LINK" ]]; then
    break
  fi
  sleep 0.5
done

if [[ -z "$MAGIC_LINK" ]]; then
  echo "[triage] ERROR: Magic link not found" >&2
  exit 1
fi

TOKEN=$(echo "$MAGIC_LINK" | grep -oE "token=[A-Za-z0-9_-]+" | cut -d= -f2)
echo "[triage] Magic link: $MAGIC_LINK"
echo "[triage] Token: ${TOKEN:0:20}..."

# Test API access with token
echo -e "\n[triage] Testing API access WITH Authorization header"
AUTH_OUT=$(mktemp)
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:$PORT/api/spec" -o "$AUTH_OUT" || true
head -c 200 "$AUTH_OUT" || true
echo ""

echo -e "\n[triage] Testing API access WITHOUT Authorization header (should fail with 403)"
NOAUTH_OUT=$(mktemp)
curl -s "http://localhost:$PORT/api/spec" -o "$NOAUTH_OUT" 2>&1 || true
head -c 200 "$NOAUTH_OUT" || true
echo ""

echo -e "\n[triage] Testing cookie transmission with curl"
# Create a cookie jar
COOKIE_JAR=$(mktemp)
trap "rm -f $TEMP_LOG $COOKIE_JAR; pkill -P $$ -f 'dr visualize' 2>/dev/null || true" EXIT

# First request to set cookie (this would be the browser)
echo "[triage] Step 1: Simulating initial page load with token in URL..."
curl -s -c "$COOKIE_JAR" "http://localhost:$PORT/?token=$TOKEN" > /dev/null
echo "[triage] Cookies saved to jar"

# Second request without token but with cookies
echo "[triage] Step 2: API call WITH cookies (simulating refresh without token in URL)..."
COOKIE_OUT=$(mktemp)
curl -s -b "$COOKIE_JAR" "http://localhost:$PORT/api/spec" -o "$COOKIE_OUT" 2>&1 || true
head -c 200 "$COOKIE_OUT" || true
echo ""

echo -e "\n[triage] Testing STATIC PAGE access (index and SPA routes)"
# GET / without token
STATUS_NO_TOKEN=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT/") || STATUS_NO_TOKEN="ERR"
echo "[triage] GET / without token -> $STATUS_NO_TOKEN"

# GET / with token in URL
STATUS_WITH_TOKEN=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT/?token=$TOKEN") || STATUS_WITH_TOKEN="ERR"
echo "[triage] GET /?token=... -> $STATUS_WITH_TOKEN"

# GET a SPA subpath without token (e.g., /model)
STATUS_SUBPATH_NO_TOKEN=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT/model") || STATUS_SUBPATH_NO_TOKEN="ERR"
echo "[triage] GET /model without token -> $STATUS_SUBPATH_NO_TOKEN"

# GET a SPA subpath with token
STATUS_SUBPATH_WITH_TOKEN=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT/model?token=$TOKEN") || STATUS_SUBPATH_WITH_TOKEN="ERR"
echo "[triage] GET /model?token=... -> $STATUS_SUBPATH_WITH_TOKEN"

echo -e "\n[triage] Diagnostics complete"
echo "[triage] Summary:"
echo "  ✓ Server running on port $PORT"
echo "  ✓ Magic link generated: $MAGIC_LINK"
echo ""
echo "Check the output above:"
echo "  - With Authorization header should succeed (spec data returned)"
echo "  - Without header should fail with 403"
echo "  - With cookies should show whether cookie-based auth works"
echo "  - Static pages (/, /model) should be 200 without auth"
echo ""
echo "[triage] Common issues:"
echo "  - 'Path not found: api/spec' → Server routing issue"
echo "  - 'error: Authentication required' → Auth validation working but no token sent"
echo "  - 'error: Invalid authentication token' → Token format issue"
echo "  - Cookies not working → Check Set-Cookie headers in browser Network tab"

