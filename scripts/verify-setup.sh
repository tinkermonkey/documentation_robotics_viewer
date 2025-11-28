#!/bin/bash

# Verification script for Documentation Robotics Viewer setup
# This script checks that all prerequisites are met for testing the reference implementation

echo "=== Documentation Robotics Viewer Setup Verification ==="
echo ""

# Check Node.js
echo "Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✓ Node.js installed: $NODE_VERSION"
else
    echo "✗ Node.js not found. Please install Node.js v18 or higher."
    exit 1
fi

# Check npm
echo "Checking npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo "✓ npm installed: $NPM_VERSION"
else
    echo "✗ npm not found. Please install npm."
    exit 1
fi

# Check Python
echo "Checking Python..."
if command -v python &> /dev/null || command -v python3 &> /dev/null; then
    PYTHON_CMD=$(command -v python3 || command -v python)
    PYTHON_VERSION=$($PYTHON_CMD --version)
    echo "✓ Python installed: $PYTHON_VERSION"
else
    echo "✗ Python not found. Please install Python 3.9 or higher."
    exit 1
fi

# Check node_modules
echo "Checking Node.js dependencies..."
if [ -d "node_modules" ]; then
    echo "✓ node_modules found"
else
    echo "✗ node_modules not found. Run: npm install"
    exit 1
fi

# Check Python virtual environment
echo "Checking Python virtual environment..."
if [ -d "reference_server/.venv" ]; then
    echo "✓ Python virtual environment found"
else
    echo "✗ Python virtual environment not found."
    echo "  Run: cd reference_server && python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt"
    exit 1
fi

# Check Playwright browsers
echo "Checking Playwright browsers..."
if [ -d "$HOME/.cache/ms-playwright" ] || [ -d "$HOME/Library/Caches/ms-playwright" ]; then
    echo "✓ Playwright browsers installed"
else
    echo "⚠ Playwright browsers may not be installed. Run: npx playwright install"
fi

# Check if reference server is running
echo "Checking reference server..."
if curl -s http://localhost:8765/health > /dev/null 2>&1; then
    SERVER_STATUS=$(curl -s http://localhost:8765/health | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    echo "✓ Reference server is running (status: $SERVER_STATUS)"
else
    echo "⚠ Reference server not running on port 8765"
    echo "  Start it with: cd reference_server && source .venv/bin/activate && python main.py"
fi

# Check if embedded viewer is running
echo "Checking embedded viewer..."
if curl -s http://localhost:3001 > /dev/null 2>&1; then
    echo "✓ Embedded viewer is running on port 3001"
else
    echo "⚠ Embedded viewer not running on port 3001"
    echo "  Start it with: npm run dev:embedded"
fi

echo ""
echo "=== Setup Verification Complete ==="
echo ""
echo "To test the reference implementation:"
echo "1. Start reference server: cd reference_server && source .venv/bin/activate && python main.py"
echo "2. Start embedded viewer: npm run dev:embedded"
echo "3. Open browser: http://localhost:3001"
echo "4. Run tests: npm test"
echo ""
echo "See documentation/TESTING_REFERENCE_IMPLEMENTATION.md for detailed instructions."
