---
description: Generate story file for a component or add variants to existing story
argument-hint: "<component-path or -variant <component-path>>"
---

# Add Component Story

Use the catalog manager agent to generate a story file for a component.

## What This Command Does

Interprets requests to:

- Create a new story file for a component that lacks one
- Add new variants to an existing story
- Generate stories for multiple components
- Apply appropriate decorators and fixtures based on component type

## Usage

```
/catalog-add <component-path>
/catalog-add -variant <component-path> [variant names]
/catalog-add -bulk <glob-pattern>
```

## Instructions for Claude Code

When the user runs this command, use the **catalog-manager agent** to handle story creation.

### Supported Operations

#### 1. Create Story for Single Component

**User intent patterns:**

- "Create story for GoalNode"
- "Add story for LoadingState"
- "Generate story src/core/nodes/motivation/GoalNode.tsx"

**Your process:**

1. **Locate component** - Find the component file
2. **Analyze component** - Read file to understand props, dependencies, complexity tier
3. **Identify tier** - Determine which tier (1-5) the component belongs to
4. **Propose structure** - Show template and variant ideas to user
5. **Generate story** - Create .stories.tsx file with appropriate:
   - Decorators (ReactFlowDecorator, MockStoreProvider, etc.)
   - Fixtures (factory functions for data)
   - Variants (2-4 meaningful use cases)
6. **Validate** - Run `npm run catalog:build` to verify rendering
7. **Report** - Confirm success and suggest next steps

**Example:**

```
User: /catalog-add src/core/nodes/motivation/GoalNode.tsx

You should:
1. Read GoalNode.tsx
2. Analyze: React Flow node (Tier 4), needs ReactFlowDecorator
3. Propose: Story with Default, HighPriority, WithCoverage, ChangesetAdd variants
4. Create: src/core/nodes/motivation/GoalNode.stories.tsx
5. Validate: npm run catalog:build
6. Report:
   ✓ Created: src/core/nodes/motivation/GoalNode.stories.tsx

   Story includes 4 variants:
   - Default
   - HighPriority
   - WithCoverage
   - ChangesetAdd

   Decorators: ReactFlowDecorator with dimensions
   Fixtures: createGoalNodeData factory

   ✓ Catalog validation passed
```

#### 2. Add Variants to Existing Story

**User intent patterns:**

- "Add variant to LoadingState"
- "Add dimmed variant to GoalNode"
- "/catalog-add -variant src/core/nodes/motivation/GoalNode.tsx dimmed disabled"

**Your process:**

1. **Locate story file** - Find existing .stories.tsx
2. **Read current variants** - Understand what's already covered
3. **Propose new variants** - Suggest meaningful additions
4. **Add variants** - Modify story file with new exports
5. **Validate** - Rebuild catalog
6. **Report** - Confirm success

**Example:**

```
User: /catalog-add -variant src/core/nodes/motivation/GoalNode.tsx dimmed disabled

You should:
1. Find GoalNode.stories.tsx
2. Read existing variants
3. Propose adding:
   - Dimmed (used when filtered out)
   - Disabled (inactive/locked state)
4. Add exports to story file
5. Validate: npm run catalog:build
6. Report:
   ✓ Added 2 variants to GoalNode.stories.tsx

   New variants:
   - Dimmed
   - Disabled

   ✓ Catalog validation passed
```

#### 3. Generate Stories for Multiple Components

**User intent patterns:**

- "Generate stories for all nodes"
- "Create stories for shared components"
- "/catalog-add -bulk src/core/nodes/**/*.tsx"

**Your process:**

1. **Find components** - Use glob to find matching components without stories
2. **Prioritize by tier** - Start with simplest (Tier 1), end with complex (Tier 5)
3. **Generate stories** - Create stories in batch
4. **Track progress** - Report which stories created
5. **Validate** - Run catalog build
6. **Report** - Summary with coverage improvement

**Example:**

```
User: /catalog-add -bulk src/apps/embedded/components/shared/**/*.tsx

You should:
1. Find shared components without stories
2. Identify:
   - LoadingState (Tier 1, already has story)
   - ErrorState (Tier 1, already has story)
   - NewComponent (Tier 1, MISSING)
3. Create stories in priority order
4. Run: npm run catalog:build
5. Report:
   Generated Stories: 1 of 1

   ✓ NewComponent.stories.tsx

   Coverage:
   - Before: 48/54 (89%)
   - After: 49/54 (91%)
   - Improvement: +1 story

   Remaining unstoryed: 5 components
   - ModelJSONViewer (medium priority)
   - SpecGraphView (complex)
   ...
```

### Best Practices

1. **Read component before creating story** - Understand props and dependencies
2. **Use appropriate decorator** - Match tier requirements
3. **Create meaningful variants** - 2-4 variants covering important use cases
4. **Test rendering** - Always run catalog build before declaring success
5. **Suggest next steps** - Help user with logical follow-up actions

### Error Recovery

**If component file not found:**

```
User: /catalog-add src/core/nodes/NonExistent.tsx

You should:
"I couldn't find src/core/nodes/NonExistent.tsx

Did you mean one of these?
- src/core/nodes/motivation/GoalNode.tsx
- src/core/nodes/business/BusinessServiceNode.tsx

Or would you like me to search for a component by name?"
```

**If story already exists:**

```
User: /catalog-add src/core/nodes/motivation/GoalNode.tsx

You should:
"GoalNode already has a story: src/core/nodes/motivation/GoalNode.stories.tsx

Would you like me to:
1. Add more variants to the existing story?
2. Review and improve the current story?
3. Story a different component?"
```

**If catalog build fails:**

```
After generating story, if npm run catalog:build fails:

"Story created but catalog build failed. Here's the error:

[Show error]

To fix: [Specific suggestion]

Would you like me to fix this?"
```

### Complex Workflows

For bulk generation or complex scenarios:

```
User: /catalog-add -bulk src/**/*.tsx

Show a plan:

"I found 6 components without stories. Here's my plan:

Tier 1 (Stateless) - 2 components - 10 min
- AttributesTable
- MetadataGrid

Tier 2 (Interactive) - 1 component - 15 min
- CustomFilter

Tier 3 (Store) - 2 components - 30 min
- ModelJSONViewer
- SpecViewer

Tier 4 (ReactFlow) - 1 component - 20 min
- LayerContainerNode

Total: ~75 minutes

Shall I proceed in priority order?"
```

## Related Commands

- `/catalog-validate` - Check if catalog builds correctly
- `/catalog-coverage` - Report which components lack stories
