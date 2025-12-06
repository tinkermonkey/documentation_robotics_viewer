#!/bin/bash

# Install pre-commit hook
HOOK_DIR=$(git rev-parse --git-dir)/hooks
PRE_COMMIT_HOOK=$HOOK_DIR/pre-commit

echo "Setting up pre-commit hook in $PRE_COMMIT_HOOK"

cat > $PRE_COMMIT_HOOK << 'EOF'
#!/bin/bash
echo "Running pre-commit checks..."
./scripts/ci-check.sh
RESULT=$?
if [ $RESULT -ne 0 ]; then
    echo "Pre-commit checks failed. Commit aborted."
    exit 1
fi
echo "Pre-commit checks passed."
exit 0
EOF

chmod +x $PRE_COMMIT_HOOK
echo "Pre-commit hook installed successfully."
