#!/bin/bash
#
# Test Authentication Flow
# This script demonstrates and tests the token-based authentication flow
#

set -e

echo ""
echo "========================================================================"
echo "Testing Documentation Robotics Viewer Authentication Flow"
echo "========================================================================"
echo ""

# Check if server is running
if ! curl -s http://localhost:8765/health > /dev/null 2>&1; then
    echo "❌ Error: Server is not running on port 8765"
    echo ""
    echo "To start the reference server WITH authentication:"
    echo "  cd reference_server"
    echo "  python main.py --auth"
    echo ""
    echo "To start WITHOUT authentication (development mode):"
    echo "  cd reference_server"
    echo "  python main.py"
    echo ""
    exit 1
fi

echo "✓ Server is running on http://localhost:8765"
echo ""

# Test 1: Health check (should work without auth)
echo "Test 1: Health Check (no auth required)"
echo "----------------------------------------"
HEALTH_RESPONSE=$(curl -s http://localhost:8765/health)
echo "Response: $HEALTH_RESPONSE"

if echo "$HEALTH_RESPONSE" | grep -q '"status":"ok"'; then
    echo "✓ Health check passed"
else
    echo "❌ Health check failed"
    exit 1
fi
echo ""

# Test 2: Try API endpoint without token
echo "Test 2: API Request Without Token"
echo "----------------------------------------"
API_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" http://localhost:8765/api/model)
HTTP_CODE=$(echo "$API_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$API_RESPONSE" | sed '/HTTP_CODE/d')

echo "HTTP Status: $HTTP_CODE"
echo "Response: $BODY"

if [ "$HTTP_CODE" = "401" ]; then
    echo "✓ Correctly blocked (auth is enabled)"
    AUTH_ENABLED=true
elif [ "$HTTP_CODE" = "200" ]; then
    echo "✓ Allowed (auth is disabled - development mode)"
    AUTH_ENABLED=false
else
    echo "❌ Unexpected status code: $HTTP_CODE"
    exit 1
fi
echo ""

# If auth is enabled, test with token
if [ "$AUTH_ENABLED" = true ]; then
    echo "========================================================================"
    echo "AUTHENTICATION IS ENABLED"
    echo "========================================================================"
    echo ""
    echo "To test with a valid token:"
    echo ""
    echo "1. Look at the server startup output for the magic link"
    echo "2. Extract the token from the URL (after ?token=)"
    echo "3. Run this command to test:"
    echo ""
    echo "   TOKEN='your-token-here'"
    echo "   curl -H \"Authorization: Bearer \$TOKEN\" http://localhost:8765/api/model"
    echo ""
    echo "Or open the magic link in your browser:"
    echo "   http://localhost:8765/?token=YOUR_TOKEN_HERE"
    echo ""

    # Test 3: Try with invalid token
    echo "Test 3: API Request With Invalid Token"
    echo "----------------------------------------"
    INVALID_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
        -H "Authorization: Bearer invalid-token-12345" \
        http://localhost:8765/api/model)
    HTTP_CODE=$(echo "$INVALID_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
    BODY=$(echo "$INVALID_RESPONSE" | sed '/HTTP_CODE/d')

    echo "HTTP Status: $HTTP_CODE"
    echo "Response: $BODY"

    if [ "$HTTP_CODE" = "403" ]; then
        echo "✓ Correctly rejected invalid token"
    else
        echo "❌ Expected 403 Forbidden, got $HTTP_CODE"
        exit 1
    fi
    echo ""

    echo "========================================================================"
    echo "Test Summary"
    echo "========================================================================"
    echo "✓ Health check: Works without auth"
    echo "✓ API without token: Correctly blocked (401)"
    echo "✓ API with invalid token: Correctly rejected (403)"
    echo ""
    echo "To complete testing:"
    echo "1. Copy the magic link from server startup"
    echo "2. Open it in your browser"
    echo "3. Verify the viewer loads and displays data"
    echo ""

else
    echo "========================================================================"
    echo "AUTHENTICATION IS DISABLED (Development Mode)"
    echo "========================================================================"
    echo ""
    echo "The server is running without authentication."
    echo "All endpoints are publicly accessible."
    echo ""
    echo "To test authentication:"
    echo "1. Stop the server (Ctrl+C)"
    echo "2. Start with --auth flag:"
    echo "   cd reference_server"
    echo "   python main.py --auth"
    echo "3. Run this test script again"
    echo ""
    echo "========================================================================"
    echo "Test Summary"
    echo "========================================================================"
    echo "✓ Health check: Works"
    echo "✓ API without auth: Allowed (expected in dev mode)"
    echo ""
fi
