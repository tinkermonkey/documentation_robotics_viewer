---
description: Validate catalog integrity and check that all stories build correctly
argument-hint: "[--strict] [--fix]"
---

# Validate Catalog

Use the catalog manager agent to check if the component catalog builds correctly.

## What This Command Does

Validates catalog health by:

- Building the Ladle catalog
- Checking for TypeScript errors
- Identifying broken imports
- Detecting missing fixtures or decorators
- Reporting which stories fail to render
- Suggesting fixes for common issues

## Usage

```
/catalog-validate
/catalog-validate --strict
/catalog-validate --fix
```

## Flags

- `--strict` - Treat warnings as errors, validate all stories thoroughly
- `--fix` - Auto-fix simple issues (import paths, typos) without asking

## Instructions for Claude Code

When the user runs this command, use the **catalog-manager agent** to validate catalog integrity.

### Process

1. **Run Catalog Build**
   ```bash
   npm run catalog:build
   ```

2. **Parse Build Output**
   - Extract errors and warnings
   - Identify file and line numbers
   - Categorize by type

3. **Analyze Issues**

   **Import Errors:**
   - Missing module paths
   - Typos in fixture names
   - Incorrect decorator imports

   **Type Errors:**
   - Props mismatch
   - Missing required properties
   - Wrong data types

   **Runtime Errors:**
   - Component crashes during render
   - Missing dependencies
   - Store initialization failures

   **Configuration Errors:**
   - Ladle config issues
   - Vite configuration problems

4. **Generate Report**
   ```
   Catalog Validation Report
   =========================

   Build Status: ✓ SUCCESS / ✗ FAILED

   Stories: 48/54 components with stories
   Build Time: 4.2s
   Warnings: 2
   Errors: 0

   [Detailed breakdown if issues exist]
   ```

5. **For Each Error:**
   - **High confidence fixes** (>90%) - Apply automatically if `--fix` flag
   - **Medium confidence** (60-90%) - Ask user for confirmation
   - **Low confidence** (<60%) - Explain and ask user to review

6. **Suggest Fixes**
   - Provide exact file and line number
   - Show current vs. correct code
   - Explain what went wrong

7. **Apply Fixes** (if authorized)
   - Edit affected story files
   - Update fixture imports
   - Correct decorator usage

8. **Re-validate**
   - Run build again
   - Confirm all issues resolved
   - Report final status

### Example Validation Report

**Scenario: Catalog build has errors**

```
User: /catalog-validate

Agent: Running catalog validation...

[Builds catalog, analyzes output]

❌ Catalog Validation FAILED

Build Status: ✗ Errors found
Stories: 48/54 components with stories
Errors: 3
Warnings: 2

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CRITICAL ERRORS (3) - Must fix

1️⃣  src/core/nodes/motivation/GoalNode.stories.tsx:5
   Error: Cannot find module '@catalog/decorators/ReactFlowDecorator'

   Current: import { withReactFlowDecorator } from '@catalog/decorators/ReactFlowDecorator';

   Fix: Update path to match file location
   Correct: import { withReactFlowDecorator } from '@/catalog/providers/ReactFlowDecorator';

   This is a HIGH CONFIDENCE fix (path mismatch).
   Shall I apply this automatically?

2️⃣  src/apps/embedded/components/AnnotationPanel.stories.tsx:12
   Error: Property 'annotations' is missing in type 'MockAnnotationStore'

   Expected: annotations: Annotation[]
   Current: { addAnnotation: fn }

   Fix: Update createMockAnnotationStore() to include all properties
   File to update: src/catalog/fixtures/annotationFixtures.ts

   This requires understanding the store structure. I suggest you review
   and provide the correct annotation data format.

3️⃣  src/core/edges/ElbowEdge.stories.tsx:8
   Error: Property 'animated' is not assignable to type 'EdgeProps'

   Current: <ElbowEdge data={{ animated: true }} />

   Fix: Remove invalid property or update props interface

   This is unclear - please confirm desired behavior.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WARNINGS (2) - Should fix

⚠️  src/core/nodes/motivation/DriverNode.stories.tsx:1
   Warning: Unused import 'mockData'

   Fix: Remove unused import or use it in a story variant

⚠️  src/apps/embedded/components/AnnotationPanel.stories.tsx:15
   Warning: Deprecated: Use createMockAnnotationStore v2 instead

   Fix: Update to use createMockAnnotationStore({ version: 'v2' })

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SUMMARY

✓ High Confidence: 1 fix (import path)
⚠️  Medium Confidence: 1 fix (store property)
❌ Low Confidence: 1 issue (requires manual review)
⚠️  Warnings: 2 cleanup items

TIME ESTIMATE
- Auto-fix high confidence: <1 min
- Review medium confidence: 5 min
- Manual fix low confidence: 10 min
- Total: ~15 minutes

RECOMMENDED ACTION

1. Auto-fix high confidence issues: /catalog-validate --fix
2. Review medium confidence (AnnotationPanel store structure)
3. Manually address low confidence (ElbowEdge behavior)
4. Clean up warnings (remove unused imports)
5. Re-validate: /catalog-validate

Shall I proceed with auto-fixing high confidence items?
```

### Handling --strict Flag

With `--strict`:

```
User: /catalog-validate --strict

Build Status: ⚠️ WARNINGS TREATED AS ERRORS

Strict validation treats warnings as blockers:
- Unused imports → Error
- Deprecated APIs → Error
- Missing prop descriptions → Error (if enabled)
- No type annotations → Error

Issues found: 5 (compared to 3 in normal mode)

This helps ensure high code quality in the catalog.
Apply fixes? (Most will be automatic with --strict --fix)
```

### Handling --fix Flag

With `--fix`:

```
User: /catalog-validate --fix

Auto-fixing high confidence issues...

✓ Fixed: src/core/nodes/motivation/GoalNode.stories.tsx
  - Corrected import path for ReactFlowDecorator

✓ Fixed: src/core/edges/ElbowEdge.stories.tsx
  - Removed unused import 'mockData'

⚠️  Skipped: src/apps/embedded/components/AnnotationPanel.stories.tsx
  - Medium confidence fix (requires store structure verification)
  - Review and manually update if needed

Re-validating...

Build Status: ✓ SUCCESS (2/3 issues fixed)

Remaining issues: 1
- AnnotationPanel store structure (manual review needed)

Would you like me to help you fix the remaining issue?
```

### Common Error Patterns

**Pattern 1: Import Path Issues**
```
Error: Cannot find module '@catalog/...'
Common cause: Wrong path prefix or missing directory

Fix: Verify actual file location and correct import statement
```

**Pattern 2: Missing Store Properties**
```
Error: Property 'xyz' is missing in type 'Store'
Common cause: Fixture factory incomplete or outdated

Fix: Update fixture factory in src/catalog/fixtures/
```

**Pattern 3: Type Mismatches**
```
Error: Type 'xyz' is not assignable to type 'xyz'
Common cause: Component props changed, story data not updated

Fix: Update story data to match current component props
```

**Pattern 4: Decorator Wrapping Issues**
```
Error: Cannot use hook inside decorator
Common cause: Decorated component uses hooks but decorator doesn't enable them

Fix: Ensure decorator provides necessary context (ReactFlowProvider, Store, etc.)
```

### Success Criteria

Validation passes when:

- ✅ All `.stories.tsx` files compile without errors
- ✅ All imports resolve correctly
- ✅ All component props match story data
- ✅ All decorators are applied correctly
- ✅ Build completes without errors
- ✅ (Optional with --strict) No warnings present

### Best Practices

1. **Validate before committing** - Always run before git commit
2. **Fix errors immediately** - Don't accumulate errors
3. **Use --strict in CI/CD** - Enforce high quality standards
4. **Review auto-fixes** - Even "high confidence" fixes should be reviewed
5. **Keep fixtures updated** - When component props change, update fixtures

## Related Commands

- `/catalog-add` - Create stories for components
- `/catalog-coverage` - Report missing stories
- `npm run catalog:build` - Manual build without validation reporting
- `npm run catalog:dev` - Preview catalog in browser during development
