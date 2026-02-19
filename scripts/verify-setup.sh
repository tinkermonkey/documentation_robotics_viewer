#!/bin/bash

# Verification script for Documentation Robotics Viewer setup
# This script checks that all prerequisites are met for running the DR CLI server and tests

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

# Check node_modules
echo "Checking Node.js dependencies..."
if [ -d "node_modules" ]; then
    echo "✓ node_modules found"
else
    echo "✗ node_modules not found. Run: npm install"
    exit 1
fi

# Check Playwright browsers
echo "Checking Playwright browsers..."
if [ -d "$HOME/.cache/ms-playwright" ] || [ -d "$HOME/Library/Caches/ms-playwright" ]; then
    echo "✓ Playwright browsers installed"
else
    echo "⚠ Playwright browsers may not be installed. Run: npx playwright install"
fi

# Check if DR CLI server is running
echo "Checking DR CLI server..."
if curl -s http://localhost:8080/health > /dev/null 2>&1; then
    SERVER_STATUS=$(curl -s http://localhost:8080/health | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    echo "✓ DR CLI server is running (status: $SERVER_STATUS)"
else
    echo "⚠ DR CLI server not running on port 8080"
    echo "  Start it with: dr visualize [path-to-your-model]"
fi

echo ""
echo "=== Setup Verification Complete ==="
echo ""
echo "To run tests with the DR CLI server:"
echo "1. Start DR CLI server: dr visualize [path-to-your-model]"
echo "2. Run tests: npm run test:e2e"
echo ""
echo "For more details, see tests/README.md"
