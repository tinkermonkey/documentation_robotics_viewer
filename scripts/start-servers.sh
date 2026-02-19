#!/bin/bash

# Start Vite embedded viewer development server
# Note: DR CLI server must be running separately for tests and backend API access

echo "Starting Documentation Robotics Viewer..."
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Shutting down Vite dev server..."
    if [ ! -z "$VIEWER_PID" ]; then
        kill $VIEWER_PID 2>/dev/null
    fi
    exit 0
}

# Set up trap to cleanup on Ctrl+C
trap cleanup SIGINT SIGTERM

# Kill any existing processes on port 3001
echo "Checking for existing processes on port 3001..."
fuser -k 3001/tcp >/dev/null 2>&1
sleep 1

# Start Vite embedded viewer
echo "Starting embedded viewer on port 3001..."
npm run dev:embedded &
VIEWER_PID=$!

echo ""
echo "=== Development Server Starting ==="
echo ""
echo "Embedded Viewer: http://localhost:3001"
echo ""
echo "⚠️  NOTE: DR CLI server must be running separately for E2E tests:"
echo "   dr visualize [path-to-your-model]"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Wait for the process
wait
