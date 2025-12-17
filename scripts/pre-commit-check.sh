#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting pre-commit checks...${NC}"

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

echo -e "${GREEN}Pre-commit checks passed! (Tests will run separately)${NC}"
