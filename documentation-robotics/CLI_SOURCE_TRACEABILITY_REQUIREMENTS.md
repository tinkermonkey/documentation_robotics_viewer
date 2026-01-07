# CLI Source Traceability Requirements

## Overview
Add bidirectional code-to-model traceability by capturing source code file references in architecture model elements.

**Priority:** Medium-High
**Target Layers:** Application, UX, Navigation, APM, Testing, Datastore
**Depends On:** Schema v0.7.0 (already defined)

---

## 1. Schema Completion

### 1.1 Create Missing Schema File
**File:** `.dr/schemas/common/source-references.schema.json`

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://documentation-robotics.com/schemas/common/source-references.schema.json",
  "title": "Source Reference Schema",
  "description": "Schema for linking architecture elements to source code locations",

  "definitions": {
    "SourceReference": {
      "type": "object",
      "description": "Reference to source code file and location",
      "properties": {
        "filePath": {
          "type": "string",
          "description": "Relative path to source file from project root",
          "pattern": "^[^/].*\\.(ts|tsx|js|jsx|py|java|go|rs|rb|php|cs|cpp|c|h|swift|kt)$",
          "examples": ["src/services/orderService.ts", "lib/processors/payment.py"]
        },
        "lineStart": {
          "type": "integer",
          "description": "Starting line number (1-based)",
          "minimum": 1
        },
        "lineEnd": {
          "type": "integer",
          "description": "Ending line number (1-based, optional)",
          "minimum": 1
        },
        "symbol": {
          "type": "string",
          "description": "Function, class, or symbol name in source file",
          "examples": ["OrderService", "processPayment", "UserController.authenticate"]
        },
        "repository": {
          "type": "string",
          "description": "Git repository URL",
          "format": "uri",
          "examples": ["https://github.com/org/repo", "git@github.com:org/repo.git"]
        },
        "branch": {
          "type": "string",
          "description": "Git branch name",
          "default": "main",
          "examples": ["main", "develop", "feature/auth"]
        },
        "commit": {
          "type": "string",
          "description": "Git commit SHA (7 or 40 characters)",
          "pattern": "^[a-f0-9]{7,40}$"
        },
        "url": {
          "type": "string",
          "description": "Direct URL to source code (GitHub, GitLab, etc.)",
          "format": "uri",
          "examples": ["https://github.com/org/repo/blob/main/src/services/orderService.ts#L15-L120"]
        },
        "language": {
          "type": "string",
          "description": "Programming language",
          "enum": ["typescript", "javascript", "python", "java", "go", "rust", "ruby", "php", "csharp", "cpp", "c", "swift", "kotlin"]
        },
        "lastVerified": {
          "type": "string",
          "description": "ISO 8601 timestamp when reference was last verified",
          "format": "date-time"
        }
      },
      "required": ["filePath"],
      "additionalProperties": false
    },

    "SourceReferenceArray": {
      "type": "array",
      "description": "Array of source references for elements implemented across multiple files",
      "items": {
        "$ref": "#/definitions/SourceReference"
      },
      "minItems": 1
    }
  }
}
```

**Acceptance Criteria:**
- Schema validates with JSON Schema Draft 7
- Linked from all relevant layer schemas (application, ux, navigation, apm, testing, datastore)
- `filePath` is the only required field (minimal friction)
- Supports both single-file and multi-file implementations

---

## 2. CLI Commands - Manual Addition

### 2.1 Add Source Reference During Element Creation
**Command:** `dr add`

**New Flags:**
```bash
--source-file <path>              # Relative path to source file
--source-lines <start>[-<end>]    # Line range (e.g., "15" or "15-120")
--source-symbol <name>            # Class/function name
--source-url <url>                # Direct GitHub/GitLab URL
--source-repo <url>               # Git repository URL
--source-commit <sha>             # Git commit SHA
--source-branch <name>            # Git branch (default: main)
--source-lang <language>          # Programming language
```

**Examples:**
```bash
# Simple file reference
dr add application service \
  --name "Order Service" \
  --source-file "src/services/orderService.ts"

# Full reference with line numbers
dr add application service \
  --name "Payment Processor" \
  --source-file "src/services/paymentService.ts" \
  --source-lines "45-180" \
  --source-symbol "PaymentProcessor"

# GitHub URL (auto-parse file, lines, repo)
dr add application component \
  --name "User Profile" \
  --source-url "https://github.com/org/repo/blob/main/src/components/UserProfile.tsx#L12-L89"

# Multi-file implementation (call flag multiple times)
dr add application service \
  --name "Auth Service" \
  --source-file "src/services/auth/authService.ts" \
  --source-file "src/services/auth/tokenManager.ts" \
  --source-file "src/services/auth/sessionStore.ts"
```

**Acceptance Criteria:**
- All flags optional (don't break existing workflows)
- `--source-url` auto-parses GitHub/GitLab URLs to extract file, lines, repo
- Multiple `--source-file` flags create array of references
- Validates file extension against common languages
- Warns if file doesn't exist (but doesn't block - file may not exist yet)

### 2.2 Update Existing Element's Source Reference
**Command:** `dr update`

**New Subcommand:** `dr update-source`

```bash
dr update-source <element-id> \
  --file <path> \
  --lines <start>[-<end>] \
  --symbol <name> \
  --url <url>

# Examples
dr update-source application.service.order-api \
  --file "src/services/orderService.ts" \
  --lines "15-120"

dr update-source ux.component.user-profile \
  --url "https://github.com/org/repo/blob/main/src/components/UserProfile.tsx#L12-L89"

# Remove source reference
dr update-source application.service.legacy --remove
```

**Acceptance Criteria:**
- Updates existing `properties.source.reference` field
- Supports partial updates (only update line numbers, keep file path)
- `--remove` flag clears source reference
- Validates element exists before updating

---

## 3. CLI Commands - Automated Extraction

### 3.1 Extract Source References from Codebase
**New Command:** `dr extract-sources`

**Purpose:** Automatically scan codebase and add source references to existing model elements

```bash
dr extract-sources [options]

Options:
  --path <directory>        # Path to source code (default: current directory)
  --pattern <glob>          # File pattern to scan (default: **/*.{ts,tsx,js,jsx,py})
  --layer <layer-name>      # Only extract for specific layer (default: all)
  --dry-run                 # Preview changes without writing
  --auto-confirm            # Skip confirmation prompts
  --match-strategy <type>   # How to match code to elements (symbol|file|fuzzy)
  --report                  # Generate extraction report

Matching Strategies:
  symbol    Match by exported class/function name to element name
  file      Match by file name to element name
  fuzzy     Use fuzzy matching on names and documentation

Examples:
# Scan TypeScript codebase and match by symbol names
dr extract-sources --pattern "src/**/*.ts" --match-strategy symbol

# Preview extraction for application layer
dr extract-sources --layer application --dry-run

# Extract with auto-confirmation
dr extract-sources --auto-confirm --report
```

**Matching Logic:**
1. **Symbol matching:** Parse AST to find exported classes/functions, match names to element names
2. **File matching:** Match file basename to element name (e.g., `orderService.ts` → `order-service`)
3. **Fuzzy matching:** Levenshtein distance + documentation keyword matching

**Acceptance Criteria:**
- Supports TypeScript, JavaScript, Python, Java, Go (AST parsing)
- Matches at least 70% of application layer services/components automatically
- `--dry-run` shows diff preview before writing
- Generates report: "Matched 45/60 elements (75%), 15 unmatched"
- Doesn't overwrite existing source references unless `--force` flag used
- Multi-threaded for large codebases (>1000 files)

### 3.2 Enhance `dr ingest` to Capture Sources
**Command:** `dr ingest` (existing command, add capability)

**New Behavior:**
When ingesting a codebase, automatically populate `properties.source.reference` for all created elements.

```bash
dr ingest <path> [options]

# Existing flags...
--capture-sources         # Auto-add source references (default: true)
--no-capture-sources      # Skip source reference capture
```

**Acceptance Criteria:**
- `--capture-sources` enabled by default
- All application/ux/navigation elements created during ingest have source references
- Source references include filePath, lineStart, lineEnd, symbol
- Captured during initial AST parsing (no performance penalty)

---

## 4. CLI Commands - Querying & Reporting

### 4.1 Find Elements by Source File
**New Command:** `dr find-by-source`

```bash
dr find-by-source <file-path>

# Examples
dr find-by-source "src/services/orderService.ts"
# Output:
# application.service.order-api (lines 15-120)
# application.function.process-order (lines 45-67)

dr find-by-source "src/components/**/*.tsx"  # Glob pattern
# Output:
# ux.component.user-profile (src/components/UserProfile.tsx:12-89)
# ux.component.order-list (src/components/OrderList.tsx:8-156)
```

**Acceptance Criteria:**
- Supports exact paths and glob patterns
- Returns element IDs with file locations
- JSON output option: `--json`

### 4.2 Coverage Report
**New Command:** `dr source-coverage`

```bash
dr source-coverage [options]

Options:
  --layer <layer-name>      # Coverage for specific layer
  --format <type>           # Output format (table|json|markdown)
  --threshold <percentage>  # Fail if coverage below threshold

# Examples
dr source-coverage
# Output:
# Layer              Elements    With Sources    Coverage
# Application        45          38              84%
# UX                 32          28              88%
# Navigation         12          10              83%
# Testing            24          24              100%
# Total              113         100             88%

dr source-coverage --threshold 80
# Exit code 0 if >=80%, exit code 1 if <80%
```

**Acceptance Criteria:**
- Shows coverage by layer
- Identifies elements missing source references
- Exit codes for CI/CD integration
- Markdown output for documentation

### 4.3 Verify Source References
**New Command:** `dr verify-sources`

**Purpose:** Check if referenced source files actually exist and validate line ranges

```bash
dr verify-sources [options]

Options:
  --fix                 # Auto-remove broken references
  --report <file>       # Write verification report to file

# Examples
dr verify-sources
# Output:
# ✓ application.service.order-api → src/services/orderService.ts (exists)
# ✗ application.service.legacy-api → src/old/legacyService.ts (NOT FOUND)
# ⚠ ux.component.user-profile → src/components/UserProfile.tsx:1-500 (file has 250 lines)

dr verify-sources --fix
# Removes broken references, updates out-of-range line numbers
```

**Acceptance Criteria:**
- Checks file existence
- Validates line ranges against actual file length
- Detects moved/renamed files (suggest fixes)
- `--fix` auto-corrects or removes invalid references

---

## 5. Validation Integration

### 5.1 Enhance `dr validate`
**Command:** `dr validate` (existing, add checks)

**New Validation Rules:**
```bash
dr validate --check-sources

# Checks:
# 1. Source reference schema validation
# 2. File path format validation
# 3. Line number consistency (lineEnd >= lineStart)
# 4. Optional: file existence (warning, not error)
# 5. Optional: repository URL format validation
```

**Warning vs Error:**
- **Error:** Invalid schema, malformed file path, lineEnd < lineStart
- **Warning:** File doesn't exist, repository unreachable, old lastVerified timestamp

**Acceptance Criteria:**
- Validates against `source-references.schema.json`
- `--strict` mode fails on warnings
- Clear error messages with element IDs and issues

---

## 6. Configuration

### 6.1 Model-Level Configuration
**File:** `manifest.yaml` (add config section)

```yaml
source-traceability:
  enabled: true
  auto-extract: true                    # Run extract-sources on dr validate
  verify-on-validate: true              # Run verify-sources on dr validate
  repository: https://github.com/org/repo
  branch: main
  base-path: "."                        # Base path for relative file paths
  exclude-patterns:                     # Files to ignore during extraction
    - "**/*.test.ts"
    - "**/*.spec.ts"
    - "**/node_modules/**"
  match-strategy: symbol                # Default matching strategy
  require-coverage:                     # Coverage thresholds
    application: 80
    ux: 70
    navigation: 90
```

**Acceptance Criteria:**
- Configuration optional (sensible defaults)
- `repository` and `branch` pre-populate source references
- `exclude-patterns` respected by `dr extract-sources`
- `require-coverage` enforced by CI validation

---

## 7. Viewer Integration (Future)

### 7.1 Export Source Map
**New Command:** `dr export-source-map`

**Purpose:** Export mapping for viewer integration

```bash
dr export-source-map --output source-map.json

# Output format:
{
  "elements": [
    {
      "id": "application.service.order-api",
      "sources": [
        {
          "filePath": "src/services/orderService.ts",
          "lineStart": 15,
          "lineEnd": 120,
          "url": "https://github.com/org/repo/blob/main/src/services/orderService.ts#L15-L120"
        }
      ]
    }
  ]
}
```

**Acceptance Criteria:**
- JSON format for viewer consumption
- Includes GitHub/GitLab URLs when repository configured
- Subset export: `--layer application --elements service`

---

## 8. Migration Support

### 8.1 Migrate X-Extension References
**New Command:** `dr migrate-sources`

**Purpose:** Convert existing ad-hoc source references to standard format

```bash
dr migrate-sources [options]

Options:
  --from-property <name>    # Custom property to migrate from
  --dry-run                 # Preview migration

# Examples
# Migrate from x-source-file to properties.source.reference
dr migrate-sources --from-property x-source-file

# Migrate from documentation field patterns
dr migrate-sources --from-documentation --pattern "Source: (.+)"
```

**Acceptance Criteria:**
- Detects common patterns: `x-source-file`, `x-source-path`, `x-implementation`
- Parses documentation field for "Source: ..." patterns
- Preserves original properties (mark as deprecated)
- Dry-run shows before/after preview

---

## 9. Testing Requirements

### 9.1 Unit Tests
- Schema validation with valid/invalid references
- CLI flag parsing for all source flags
- URL parsing for GitHub/GitLab/Bitbucket
- File path normalization (Windows/Unix)
- Multi-file reference handling

### 9.2 Integration Tests
- `dr add` with `--source-file` creates valid reference
- `dr extract-sources` matches TypeScript classes to services
- `dr verify-sources` detects missing files
- `dr source-coverage` calculates percentages correctly
- `dr migrate-sources` converts x-extensions

### 9.3 E2E Tests
- Full workflow: ingest → extract → verify → export
- Large codebase performance (>5000 files in <10s)
- Multi-language codebase (TypeScript + Python)

---

## 10. Documentation Requirements

### 10.1 User Guide
**File:** `docs/source-traceability-guide.md`

**Contents:**
1. Introduction and benefits
2. Quick start (3 simple examples)
3. Manual reference addition
4. Automated extraction
5. Configuration options
6. Verification and maintenance
7. CI/CD integration
8. Troubleshooting

### 10.2 CLI Help Text
```bash
dr add --help
# Should show all --source-* flags with examples

dr extract-sources --help
# Should explain matching strategies

dr source-coverage --help
# Should explain coverage calculation
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
- Create `source-references.schema.json`
- Add `--source-file`, `--source-lines` flags to `dr add`
- Basic validation in `dr validate`
- Unit tests

### Phase 2: Extraction (Week 3-4)
- Implement `dr extract-sources` for TypeScript
- Add `--capture-sources` to `dr ingest`
- Symbol matching strategy
- Integration tests

### Phase 3: Querying (Week 5)
- Implement `dr find-by-source`
- Implement `dr source-coverage`
- Implement `dr verify-sources`
- Coverage reporting

### Phase 4: Advanced (Week 6-7)
- Multi-language support (Python, Java, Go)
- Fuzzy matching strategy
- `dr migrate-sources` command
- Configuration file support
- E2E tests

### Phase 5: Polish (Week 8)
- Performance optimization
- Documentation
- CI/CD examples
- Source map export for viewer

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Extraction accuracy (symbol matching) | >80% |
| Performance (1000 file scan) | <5 seconds |
| Coverage in typical project | >75% application layer |
| False positive rate | <5% |
| User adoption (projects using feature) | >50% within 6 months |

---

## Open Questions for Dev Team

1. **AST Parsing Library:** Should we use existing parsers (swc for TypeScript, tree-sitter) or build custom?
2. **Verification Frequency:** Should `dr verify-sources` run on every `dr validate` or be opt-in?
3. **URL Schemes:** Support only GitHub/GitLab or also Bitbucket, Azure DevOps, self-hosted Git?
4. **Monorepo Support:** How to handle multi-package monorepos with different base paths?
5. **Performance:** For codebases with 10,000+ files, should extraction be incremental (only changed files)?
6. **Viewer Priority:** Does viewer integration happen in parallel or after CLI implementation?

---

## Related Existing Features

- `dr ingest` - Already parses codebases, extend to capture sources
- `dr validate` - Already validates schema, add source validation
- Link registry - Already tracks relationships, extend to source links
- Changesets - Source references should be tracked in changesets

---

**End of Requirements Document**
**Document Version:** 1.0
**Date:** 2026-01-07
**Status:** Ready for Development Team Review
