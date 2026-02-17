# Storybook Migration Design

## Overview

This document outlines the migration strategy from Ladle to Storybook for the Documentation Robotics visualization codebase. The migration preserves the Ladle setup for reference and fallback while establishing Storybook as the primary component catalog and test infrastructure.

## Migration Approach

### Phase 1: Infrastructure Setup (Completed)

**Objective**: Establish Storybook build system and test infrastructure alongside Ladle

**What Was Done**:
- Installed Storybook 7 with React configuration
- Configured Storybook dev server on port 61001 (moved from Ladle's 6006)
- Integrated Playwright test runner for component testing
- Implemented 16 custom error filters to handle framework compatibility warnings
- Set up accessibility testing with axe-core via Storybook addon
- Created comprehensive error filtering documentation

**Why This Approach**:
- Allows gradual migration without service disruption
- Leverages Playwright's existing test infrastructure
- Maintains component isolation for visual regression testing
- Enables accessibility testing early in development cycle

**Key Files**:
- `.storybook/main.cjs` - Storybook configuration with webpack customizations
- `.storybook/preview.tsx` - Global decorators and provider setup
- `.storybook/test-runner.ts` - Playwright integration with error filters
- `src/catalog/` - Story files and component showcase

### Phase 2: Story Migration & Coverage (In Progress)

**Objective**: Create comprehensive Storybook stories for all application components with test coverage

**Current Status**:
- **97 story files** created across 9 functional categories
- **578 total stories** covering business, motivation, and technical components
- **~2% of stories** have Playwright test functions (play() hooks) implemented

**Remaining Work**:
- Implement play() test functions for remaining ~550 stories (Phase 2 deliverable)
- Standardize CSF3 format across all stories
- Complete decorator pattern standardization
- Validate interactive stories against actual component behavior

**Coverage Strategy**:
1. **By Category**: Stories organized into 9 functional areas (see `src/catalog/README.md`)
2. **By Component Type**: Base components, layer-specific nodes, layout tools, dialogs, panels
3. **By State**: Default, loading, error, empty, populated states per component
4. **By Interaction**: User interactions, edge cases, accessibility variants

### Phase 3: Ladle Deprecation (Future)

**Timeline**: 2026 Q3 or later

**Prerequisites**:
- All critical stories have test coverage (play() functions)
- Zero production defects traced to Storybook incompatibilities
- All team members comfortable with new workflow
- Ladle documentation reviewed for any unique features

**Action Items**:
1. Remove `.ladle-archive/` directory
2. Update build scripts and CI/CD
3. Archive Ladle-specific documentation
4. Communicate deprecation timeline

## Decision Points & Rationale

### Port Selection: 61001 vs 6006

**Decision**: Use port 61001 for Storybook

**Rationale**:
- Isolates Storybook from Ladle's 6006 to allow side-by-side operation
- Uses uncommon port to prevent conflicts with other local services
- Documented in `.storybook/main.cjs` and CI/CD scripts

### Error Filtering Strategy

**Decision**: Implement 16 specific regex filters rather than broad suppression

**Rationale**:
- Catches legitimate framework issues while suppressing known compatibility warnings
- Maintains visibility into actual errors during development
- Enables quarterly reviews to detect framework upgrade impacts
- Documented in `.storybook/test-runner.ts` with clear maintenance protocol

### CSF3 Format

**Decision**: Standardize on Component Story Format v3

**Rationale**:
- Aligns with Storybook 7+ best practices
- Enables static analysis and automation
- Supports play() functions for interactive testing
- Compatible with Storybook's future roadmap

## Coverage Metrics

| Category | Story Files | Total Stories | Est. Play() Coverage |
|----------|-------------|---------------|----------------------|
| Business | 12 | 89 | 3% |
| Motivation | 15 | 134 | 2% |
| Technical (C4) | 8 | 95 | 1% |
| Layout & Tools | 18 | 118 | 1% |
| Dialogs & Panels | 22 | 96 | 2% |
| **Total** | **97** | **578** | **~2%** |

**Note**: Low play() function coverage is expected for Phase 1. Phase 2 will systematize this coverage.

## Preservation Strategy: Ladle Archive

**Location**: `.ladle-archive/`

**Contents**:
- `components.tsx` - Custom Ladle decorators and wrappers
- `config.mjs` - Ladle build configuration
- `mockWebSocket.ts` - WebSocket mock implementation for demos

**Purpose**:
- Reference material for Ladle-specific patterns
- Fallback if Storybook incompatibilities arise
- Historical documentation of previous setup

**Status**: Active archive — not deleted until Phase 3 deprecation

## Success Criteria

✅ **Phase 1 Complete**:
- Storybook builds successfully
- CI/CD pipeline green
- Error filters prevent false failures
- Accessibility testing enabled
- Documentation complete

🔄 **Phase 2 In Progress**:
- Story files created and organized
- Component coverage approaching 100%
- play() functions implemented for critical paths

⏳ **Phase 3 Future**:
- All stories have test coverage
- Zero open defects
- Team trained and productive
- Ladle safely archived or removed

## Migration Timeline

| Milestone | Completion | Status |
|-----------|-----------|--------|
| Phase 1: Infrastructure | 2026-02-11 | ✅ Complete |
| Phase 2a: Story Creation | 2026-02-15 | ✅ Complete |
| Phase 2b: Test Functions | 2026-Q2 | 🔄 In Progress |
| Phase 3: Ladle Deprecation | 2026-Q3 | ⏳ Planned |

## Maintenance & Quarterly Review

**Quarterly Review Schedule** (Q2 2026, Q3 2026, etc.):

1. **Error Filter Audit** - Verify 16 filters still needed, update as needed
2. **Deprecated Warning Scan** - Check for new Storybook warnings in test output
3. **Coverage Gap Analysis** - Identify untested component states
4. **Performance Review** - Monitor Storybook build times, story load counts

**Point of Contact**: Senior Software Engineer or team lead

## References

- Storybook Documentation: https://storybook.js.org/
- Playwright Test Runner: https://storybook.js.org/docs/writing-tests/test-runner
- Previous Ladle Setup: `.ladle-archive/config.mjs`
- Story Coverage Details: `src/catalog/README.md`
- Error Filters: `.storybook/test-runner.ts`
