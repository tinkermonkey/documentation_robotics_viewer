---
name: documentation_robotics_viewer-deploy
description: Build Docker image and run deployment checks
user_invocable: true
args: [build|validate|push]
generated: true
generation_timestamp: 2026-02-23T16:12:37.156700Z
generation_version: "2.0"
source_project: documentation_robotics_viewer
source_codebase_hash: 00a2f9723e9a7f64
---

# Docker Deployment Manager

Quick-reference skill for **documentation_robotics_viewer** Docker deployment workflow.

## Usage

```bash
/documentation_robotics_viewer-deploy [build|validate|push]
```

**Default:** `validate` (runs all pre-deployment checks)

## Purpose

Manages the complete Docker deployment lifecycle for the documentation_robotics_viewer agent:

- **Build**: Creates optimized Docker image (`Dockerfile.agent`) with pre-installed dependencies
- **Validate**: Runs comprehensive CI/CD checks (type checking, tests, API sync, build verification)
- **Push**: Tags and pushes verified image to container registry

This skill ensures deployment consistency with the CI/CD pipeline defined in `.github/workflows/ci.yml`.

## Implementation

### Build Docker Image

```bash
# Build the documentation_robotics_viewer agent image
docker build -f Dockerfile.agent -t documentation_robotics_viewer:latest .

# Build with version tag
docker build -f Dockerfile.agent -t documentation_robotics_viewer:$(node -p "require('./package.json').version") .

# Verify build
docker images | grep documentation_robotics_viewer
```

**Image Details:**
- **Base Image**: `clauditoreum-orchestrator:latest` (includes Claude CLI, Git, GitHub CLI, Node.js 22.x)
- **Pre-installed**: npm dependencies (via `package.json` + `package-lock.json`)
- **Browsers**: Playwright Chromium with system dependencies
- **Working Directory**: `/workspace/documentation_robotics_viewer`

### Validate Deployment

Runs the complete CI/CD validation pipeline:

```bash
# 1. TypeScript type checking (TSC 5.9.3)
npx tsc --noEmit

# 2. API spec synchronization check
npm run sync:api-spec
git diff --quiet docs/api-spec.yaml || {
  echo "❌ API spec out of sync"; exit 1;
}

# 3. Install Playwright browsers (if not cached)
npx playwright install --with-deps

# 4. Run test suite (1170 tests in 70 files)
npm test

# 5. Production build (Vite 6.4.0)
npm run build

# 6. Verify build output
ls -lh dist/embedded/dr-viewer-bundle/
```

**Validation Coverage:**
- ✅ TypeScript strict mode compliance
- ✅ OpenAPI spec sync with upstream DR CLI
- ✅ Unit tests (services, utilities, nodes, layout engines)
- ✅ Integration tests (cross-component data flow)
- ✅ E2E tests (embedded app workflows)
- ✅ Production bundle generation

### Push to Registry

```bash
# Tag with semantic version
VERSION=$(node -p "require('./package.json').version")
docker tag documentation_robotics_viewer:latest documentation_robotics_viewer:$VERSION
docker tag documentation_robotics_viewer:latest <registry>/documentation_robotics_viewer:$VERSION
docker tag documentation_robotics_viewer:latest <registry>/documentation_robotics_viewer:latest

# Push to registry
docker push <registry>/documentation_robotics_viewer:$VERSION
docker push <registry>/documentation_robotics_viewer:latest

# Verify
docker pull <registry>/documentation_robotics_viewer:$VERSION
```

**Registry Configuration:**
- Replace `<registry>` with your container registry (e.g., `ghcr.io/your-org`, `docker.io/your-org`)
- Ensure authentication: `docker login <registry>`

## Examples

### Example 1: Full Deployment Cycle

```bash
# 1. Validate codebase
/documentation_robotics_viewer-deploy validate

# 2. Build Docker image
/documentation_robotics_viewer-deploy build

# 3. Push to registry
/documentation_robotics_viewer-deploy push
```

### Example 2: Quick Validation Before Commit

```bash
# Run pre-deployment checks
/documentation_robotics_viewer-deploy validate

# Expected output:
# ✓ Type check passed
# ✓ API spec in sync
# ✓ 1170/1170 tests passed
# ✓ Build successful (dist/embedded/dr-viewer-bundle/)
```

### Example 3: Build for Local Testing

```bash
# Build image
/documentation_robotics_viewer-deploy build

# Run container
docker run -it --rm \
  -v $(pwd):/workspace/documentation_robotics_viewer \
  -w /workspace/documentation_robotics_viewer \
  documentation_robotics_viewer:latest \
  npm run dev
```

### Example 4: Tagged Release Build

```bash
# Set version in package.json (e.g., 0.2.4)
npm version patch --no-git-tag-version

# Validate
/documentation_robotics_viewer-deploy validate

# Build with version tag
docker build -f Dockerfile.agent \
  -t documentation_robotics_viewer:$(node -p "require('./package.json').version") \
  -t documentation_robotics_viewer:latest .

# Create git tag (triggers GitHub release workflow)
git tag v0.2.4
git push origin v0.2.4

# GitHub Actions will automatically:
# - Run CI/CD validation
# - Build production bundle
# - Create GitHub release with dr-viewer-bundle-0.2.4.zip
```

## Key Files

- **`Dockerfile.agent`** - Multi-stage build definition (74 lines)
- **`.dockerignore`** - Build exclusions (node_modules, dist, .git, logs)
- **`.github/workflows/ci.yml`** - CI/CD pipeline (118 lines)
  - `build-and-test` job: Type check → Tests → Build → Release
  - `story-validation` job: Storybook build → 578 story tests
- **`package.json`** - Build scripts and dependencies
  - `build`: Vite production build + bundle packaging
  - `test`: Playwright test suite (1170 tests)
  - `sync:api-spec`: OpenAPI spec synchronization

## Pre-requisites

**Docker Build:**
- Base image: `clauditoreum-orchestrator:latest` must exist
- Docker BuildKit enabled (for `--mount=type=cache`)

**Validation:**
- Node.js 20.x or 22.x (LTS)
- npm dependencies installed: `npm ci --legacy-peer-deps`

**Push:**
- Container registry credentials configured
- Network access to registry

## Troubleshooting

**Build fails with "base image not found":**
```bash
# Build the base orchestrator image first
cd ../orchestrator
docker build -t clauditoreum-orchestrator:latest .
```

**Validation fails on "API spec out of sync":**
```bash
# Sync API spec from upstream DR CLI
npm run sync:api-spec
git add docs/api-spec.yaml
git commit -m "Sync API spec"
```

**Tests fail with "Playwright browsers not installed":**
```bash
# Install Playwright browsers manually
npx playwright install --with-deps chromium
```

**Build artifact missing:**
```bash
# Check Vite build output
npm run build
ls -lh dist/embedded/dr-viewer-bundle/

# Expected files:
# - index.html (entry point)
# - assets/ (JS/CSS bundles)
# - dr-viewer-bundle.js (packaged bundle)
```

---

*This skill was automatically generated from the documentation_robotics_viewer codebase (hash: 00a2f9723e9a7f64).*
