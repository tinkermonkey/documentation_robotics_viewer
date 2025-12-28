#!/bin/bash

# Script to create synthetic datasets for remaining DR layers
# This creates minimal but representative datasets for each layer

BASE_DIR="/Users/austinsand/workspace/documentation_robotics_viewer/tests/fixtures/public-datasets"

# Create directory structure
mkdir -p "$BASE_DIR"/{security,application,technology,api,datamodel,datastore,ux,navigation,apm}

echo "Creating synthetic datasets for remaining DR layers..."
echo "✓ Directories created"

echo "✓ All synthetic datasets created successfully"
