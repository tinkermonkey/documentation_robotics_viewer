#!/bin/bash

# Script to run story tests with automatic server management
# Lets Playwright's webServer config handle the Ladle server automatically

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Running story validation tests...${NC}"
echo -e "${YELLOW}(Playwright will automatically start and stop the Ladle server)${NC}"

# Force non-interactive mode - use only list reporter to prevent HTML report
# from opening browser and waiting for user input
if [[ ! "$*" =~ --reporter ]]; then
  # Use only list reporter to ensure non-interactive execution
  # Capture output to log file for error analysis
  npx playwright test tests/stories/all-stories.spec.ts --config=playwright.refinement.config.ts --reporter=list "$@" 2>&1 | tee test-output.log
  TEST_EXIT_CODE=${PIPESTATUS[0]}
else
  npx playwright test tests/stories/all-stories.spec.ts --config=playwright.refinement.config.ts "$@" 2>&1 | tee test-output.log
  TEST_EXIT_CODE=${PIPESTATUS[0]}
fi

# Analyze exit code and provide specific error messages
if [ $TEST_EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}✓ All story tests passed!${NC}"
elif grep -q "Error: No tests found" test-output.log; then
  echo -e "${RED}✗ Playwright found no tests to run${NC}"
  echo -e "${RED}  Make sure test file exists: tests/stories/all-stories.spec.ts${NC}"
  echo -e "${RED}  Regenerate with: npm run test:stories:generate${NC}"
  TEST_EXIT_CODE=1
elif grep -q "browserType.launch" test-output.log; then
  echo -e "${RED}✗ Playwright browser failed to launch${NC}"
  echo -e "${RED}  Try: npx playwright install --with-deps${NC}"
  TEST_EXIT_CODE=1
elif grep -q "ECONNREFUSED.*61000" test-output.log; then
  echo -e "${RED}✗ Could not connect to Ladle server (port 61000)${NC}"
  echo -e "${RED}  The Ladle server may have failed to start. Check logs above.${NC}"
  echo -e "${RED}  Possible causes: Port conflict, build failure, or missing dependencies${NC}"
  TEST_EXIT_CODE=1
elif grep -q "TimeoutError\|timeout" test-output.log; then
  echo -e "${RED}✗ Test execution timed out${NC}"
  echo -e "${RED}  The Ladle server may be taking too long to start or stories are slow to load${NC}"
  TEST_EXIT_CODE=1
else
  echo -e "${RED}✗ Some story tests failed (exit code: $TEST_EXIT_CODE)${NC}"
fi

# Cleanup log file unless we need to preserve it for debugging
if [ $TEST_EXIT_CODE -eq 0 ]; then
  rm -f test-output.log
fi

exit $TEST_EXIT_CODE
