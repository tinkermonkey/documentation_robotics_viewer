---
name: documentation_robotics_viewer-build
description: Run Vite build and check bundle size
user_invocable: true
args: [dev|prod|analyze]
generated: true
generation_timestamp: 2026-02-23T16:07:52.207960Z
generation_version: "2.0"
source_project: documentation_robotics_viewer
source_codebase_hash: 00a2f9723e9a7f64
---

# Build & Bundle Analysis

Quick-reference skill for running **Vite builds** and analyzing bundle sizes in the **documentation_robotics_viewer** project.

## Usage

```bash
/documentation_robotics_viewer-build [dev|prod|analyze]
```

**Args:**
- `dev` - Start Vite development server with HMR
- `prod` - Production build with minification and bundle report
- `analyze` - Production build with detailed bundle analysis (rollup-plugin-visualizer)

## Purpose

Run Vite 6.4.0 builds for the React 19.2.0 + TypeScript 5.9.3 visualization app. This skill:

1. **Builds the application** using the appropriate mode (development server or production bundle)
2. **Checks bundle size** against performance budgets (target: <500KB initial load)
3. **Analyzes dependencies** to identify optimization opportunities (React Flow, graph layout engines, D3)
4. **Validates build output** for the layered architecture (`src/core/` + `src/apps/embedded/`)

## Implementation

### Dev Mode (`dev`)

Start the Vite development server with Hot Module Replacement:

```bash
npm run dev
# Opens http://localhost:5173
# Watch mode with instant HMR for React components, nodes, edges, stores
```

**Post-Start Checks:**
- Verify server started on port 5173
- Check console for build warnings (especially TypeScript strict mode errors)
- Confirm HMR is working (edit a file, check instant refresh)

### Production Build (`prod`)

Build optimized production bundle:

```bash
npm run build
# Runs: vite build
# Outputs to: dist/
```

**Post-Build Analysis:**

1. **Check Build Output:**
```bash
ls -lh dist/assets/
# Look for:
# - index-*.js (main bundle - target <200KB gzipped)
# - vendor-*.js (React Flow, D3, layout engines - target <250KB gzipped)
# - *.css (Tailwind CSS v4 - target <50KB gzipped)
```

2. **Report Bundle Sizes:**
```bash
du -sh dist/
du -h dist/assets/*.js | sort -h
# Identify largest chunks
```

3. **Check for Code Splitting:**
```bash
ls dist/assets/ | grep -E "^[a-z]+-[a-z0-9]+\.js$"
# Should see separate chunks for:
# - Core nodes (business, motivation, c4)
# - Layout engines (dagre, elk, d3-force, graphviz)
# - Route components (if using lazy loading)
```

**Expected Bundle Breakdown:**
- **@xyflow/react** (~120KB) - Core graph visualization
- **Layout engines** (~150KB combined):
  - `dagre` - Hierarchical layouts
  - `elkjs` - Eclipse Layout Kernel
  - `d3-force` - Force-directed layouts
  - `@hpcc-js/wasm` - GraphViz WASM
- **React 19** + **React DOM** (~130KB)
- **Zustand** (~3KB) - State management
- **Application code** (~100KB) - Nodes, edges, services, stores

### Bundle Analysis (`analyze`)

Generate interactive bundle visualization:

```bash
npm run build -- --mode analyze
# OR if script exists:
npm run build:analyze

# If rollup-plugin-visualizer is configured, this generates:
# dist/stats.html - Interactive treemap of bundle composition
```

**Analysis Steps:**

1. **Open Bundle Report:**
```bash
# If stats.html exists:
open dist/stats.html  # macOS
xdg-open dist/stats.html  # Linux
```

2. **Identify Optimization Opportunities:**
   - **Large dependencies** - Can any be lazy-loaded?
   - **Duplicate code** - Are libraries bundled multiple times?
   - **Unused exports** - Tree-shaking opportunities
   - **Vendor chunk size** - Should layout engines be split further?

3. **Check Critical Path:**
   - Initial bundle should include: React Flow, base nodes, GraphViewer
   - Lazy-load: Layout engines (load on first use), route-specific components
   - Defer: Storybook, test utilities (dev-only)

## Examples

### Example 1: Quick Development Build

```bash
/documentation_robotics_viewer-build dev
```

**Output:**
```
Starting Vite dev server...
✓ Ready in 342ms
➜ Local:   http://localhost:5173/
✓ HMR enabled for:
  - 15 custom nodes (GoalNode, StakeholderNode, BusinessFunctionNode...)
  - 4 layout engines (Dagre, ELK, D3Force, Graphviz)
  - 8 Zustand stores (modelStore, layerStore, elementStore...)
```

### Example 2: Production Build with Size Check

```bash
/documentation_robotics_viewer-build prod
```

**Output:**
```
Building for production...
✓ 127 modules transformed
✓ Built in 2.4s

dist/index.html                   2.1 KB
dist/assets/index-a3b2c1d4.css   45.2 KB │ gzip: 12.3 KB
dist/assets/index-e5f6g7h8.js   187.4 KB │ gzip: 61.2 KB
dist/assets/vendor-i9j0k1l2.js  234.6 KB │ gzip: 78.5 KB

✓ Bundle size check: PASSED
  Total: 467.2 KB (151.8 KB gzipped) - under 500KB budget ✓

Breakdown:
  @xyflow/react:     118.3 KB (39.1 KB gzipped)
  Layout engines:    156.7 KB (52.3 KB gzipped)
  React + React DOM: 128.9 KB (42.7 KB gzipped)
  Application code:   63.3 KB (17.7 KB gzipped)
```

### Example 3: Deep Bundle Analysis

```bash
/documentation_robotics_viewer-build analyze
```

**Output:**
```
Building with bundle analysis...
✓ Bundle visualization generated: dist/stats.html

Top 5 Largest Dependencies:
1. elkjs (87.2 KB) - Consider lazy loading for ELK layout engine
2. @xyflow/react (118.3 KB) - Core dependency, cannot reduce
3. d3-force (34.5 KB) - Used by force-directed layout
4. dagre (28.9 KB) - Used by hierarchical layout
5. @hpcc-js/wasm (45.1 KB) - GraphViz WASM, consider lazy loading

Recommendations:
✓ Code splitting is working (3 chunks)
⚠ Consider lazy-loading layout engines (load on first use)
⚠ elkjs is the largest layout engine - split into separate chunk
✓ Tree-shaking is effective (React Flow reduced from 150KB to 118KB)

Open dist/stats.html to explore bundle composition interactively.
```

## Performance Budgets

**Target Sizes (Gzipped):**
- **Initial Load:** <150KB (GraphViewer + React Flow + base nodes)
- **Total Bundle:** <500KB (all code including lazy-loaded chunks)
- **Vendor Chunk:** <250KB (React, React Flow, core dependencies)
- **CSS:** <50KB (Tailwind CSS v4 with purging)

**Red Flags:**
- Single chunk >300KB (poor code splitting)
- Vendor chunk >400KB (missing tree-shaking)
- Multiple copies of React/Zustand (dependency duplication)
- Layout engines in initial bundle (should be lazy-loaded)

## Optimization Checklist

After running builds, verify:

- [ ] **Code Splitting:** Layout engines loaded on-demand
- [ ] **Tree Shaking:** Unused React Flow exports removed
- [ ] **Minification:** All JS/CSS minified in production
- [ ] **Compression:** Gzip/Brotli enabled on server
- [ ] **Source Maps:** Generated for production debugging
- [ ] **Asset Hashing:** Filenames include content hashes for caching
- [ ] **Bundle Size:** Under 500KB total (150KB gzipped)

## Troubleshooting

**Build Fails with TypeScript Errors:**
```bash
npm run build
# Fix TypeScript strict mode errors first
npm run type-check  # If script exists
```

**Bundle Size Exceeds Budget:**
1. Run `/documentation_robotics_viewer-build analyze`
2. Identify largest dependencies in stats.html
3. Lazy-load heavy modules (layout engines, route components)
4. Check for duplicate dependencies (`npm ls <package>`)

**HMR Not Working in Dev Mode:**
1. Check Vite config (`vite.config.ts`)
2. Verify React Fast Refresh is enabled
3. Ensure components are exported properly (no anonymous exports)

---

*This skill was automatically generated based on Vite 6.4.0 build tooling and React 19.2.0 architecture.*
