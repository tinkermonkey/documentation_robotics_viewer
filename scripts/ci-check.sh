#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting CI checks...${NC}"

# 1. Install dependencies
echo -e "${GREEN}1. Checking dependencies...${NC}"
npm install

# 2. Type check
echo -e "${GREEN}2. Running type check...${NC}"
if npx tsc --noEmit; then
    echo -e "${GREEN}Type check passed.${NC}"
else
    echo -e "${RED}Type check failed.${NC}"
    exit 1
fi

# 3. Run tests
echo -e "${GREEN}3. Running tests...${NC}"
if npm test; then
    echo -e "${GREEN}Tests passed.${NC}"
else
    echo -e "${RED}Tests failed.${NC}"
    exit 1
fi

# 4. Build
echo -e "${GREEN}4. Building project...${NC}"
if npm run build; then
    echo -e "${GREEN}Build passed.${NC}"
else
    echo -e "${RED}Build failed.${NC}"
    exit 1
fi

echo -e "${GREEN}All CI checks passed!${NC}"
