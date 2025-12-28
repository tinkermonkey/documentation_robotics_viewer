#!/bin/bash
# Capture authentication token from reference server output
# Usage: ./scripts/capture-auth-token.sh

set -e

TOKEN_FILE=".test-auth-token"
LOG_FILE="/tmp/dr-server-auth.log"

echo "🔑 Starting reference server with authentication..."
echo "   Log file: $LOG_FILE"

# Start the reference server with auth in the background
cd reference_server
source .venv/bin/activate
python main.py --auth --port 8765 > "$LOG_FILE" 2>&1 &
SERVER_PID=$!

echo "   Server PID: $SERVER_PID"
echo "   Waiting for magic link..."

# Wait for the magic link to appear in the logs (max 10 seconds)
for i in {1..20}; do
  if grep -q "http://localhost:8765/?token=" "$LOG_FILE" 2>/dev/null; then
    break
  fi
  sleep 0.5
done

# Extract the token from the magic link
TOKEN=$(grep "http://localhost:8765/?token=" "$LOG_FILE" | sed -n 's/.*token=\([^ ]*\).*/\1/p' | head -1)

if [ -z "$TOKEN" ]; then
  echo "   ✗ Failed to capture auth token"
  echo "   Check log file: $LOG_FILE"
  kill $SERVER_PID 2>/dev/null || true
  exit 1
fi

# Save token to file
cd ..
echo "$TOKEN" > "$TOKEN_FILE"

echo "   ✓ Auth token captured and saved to: $TOKEN_FILE"
echo ""
echo "   Magic Link:"
echo "   http://localhost:8765/?token=$TOKEN"
echo ""
echo "   Reference server is running (PID: $SERVER_PID)"
echo "   To stop: kill $SERVER_PID"
echo ""
echo "✅ Ready for E2E tests with authentication"
