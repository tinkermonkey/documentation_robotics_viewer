#!/bin/bash

# Start both Python reference server and embedded viewer
# This script provides the convenience of npm start with a single command

echo "Starting Documentation Robotics Viewer..."
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Shutting down servers..."
    if [ ! -z "$SERVER_PID" ]; then
        kill $SERVER_PID 2>/dev/null
    fi
    if [ ! -z "$VIEWER_PID" ]; then
        kill $VIEWER_PID 2>/dev/null
    fi
    exit 0
}

# Set up trap to cleanup on Ctrl+C
trap cleanup SIGINT SIGTERM

# Start Python reference server
echo "Starting Python reference server on port 8765..."
cd reference_server
source .venv/bin/activate
python main.py &
SERVER_PID=$!
cd ..

# Wait for server to be ready
echo "Waiting for reference server to start..."
sleep 2

# Check if server is running
if curl -s http://localhost:8765/health > /dev/null 2>&1; then
    echo "✓ Reference server started successfully"
else
    echo "✗ Failed to start reference server"
    cleanup
fi

echo ""

# Start embedded viewer
echo "Starting embedded viewer on port 3001..."
npm run dev:embedded &
VIEWER_PID=$!

echo ""
echo "=== Both servers are starting ==="
echo ""
echo "Reference Server: http://localhost:8765"
echo "Embedded Viewer:  http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Wait for both processes
wait
