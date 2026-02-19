#!/bin/bash
# Deprecated script - reference server was removed in Phase 4
# This script previously captured auth tokens from the local reference server.
# The reference server has been completely removed.
#
# For testing with the DR CLI server, auth tokens are handled by the DR CLI:
# dr visualize [path-to-model] --auth

echo "This script is deprecated. The reference server has been removed in Phase 4." >&2
echo "" >&2
echo "For testing with authentication, use the DR CLI server:" >&2
echo "  dr visualize [path-to-model] --auth" >&2
echo "" >&2
echo "See documentation/DR_CLI_MIGRATION.md for migration guide" >&2
exit 1
