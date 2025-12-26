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
  npx playwright test tests/stories/all-stories.spec.ts --config=playwright.refinement.config.ts --reporter=list "$@"
  TEST_EXIT_CODE=$?
else
  npx playwright test tests/stories/all-stories.spec.ts --config=playwright.refinement.config.ts "$@"
  TEST_EXIT_CODE=$?
fi

# Show results
if [ $TEST_EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}✓ All story tests passed!${NC}"
else
  echo -e "${RED}✗ Some story tests failed (exit code: $TEST_EXIT_CODE)${NC}"
fi

exit $TEST_EXIT_CODE

exit $TEST_EXIT_CODE
