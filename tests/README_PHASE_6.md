# Phase 6 Testing Guide

Quick reference for running Phase 6 integration tests for Issue #64.

## Quick Start

### Run All Automated Tests

```bash
# Full test suite (recommended)
npx playwright test

# Phase 6 tests only
npx playwright test tests/layer-color-consistency.spec.ts
npx playwright test tests/zoom-to-layer.spec.ts
npx playwright test tests/sidebar-consolidation.spec.ts
npx playwright test tests/overview-panel-styling.spec.ts

# With UI (watch mode)
npx playwright test --ui

# With visible browser
npx playwright test --headed
```

### Manual Testing

1. **Start servers:**
   ```bash
   # Terminal 1: Reference server
   cd reference_server
   source .venv/bin/activate
   python main.py

   # Terminal 2: Dev server
   npm run dev
   ```

2. **Open browser:**
   - Navigate to http://localhost:3001

3. **Follow checklist:**
   - Open `tests/MANUAL_TESTING_CHECKLIST.md`
   - Work through each section
   - Check off items as you complete them

## Test Files

### Automated E2E Tests (36 tests)

| File | Tests | What It Validates |
|------|-------|-------------------|
| `layer-color-consistency.spec.ts` | 7 | Layer colors match across all views |
| `zoom-to-layer.spec.ts` | 7 | Clicking layers zooms graph smoothly |
| `sidebar-consolidation.spec.ts` | 11 | 2-column layouts in Motivation/Architecture |
| `overview-panel-styling.spec.ts` | 11 | MiniMap "Overview" panel styling |

### Documentation

| File | Purpose |
|------|---------|
| `MANUAL_TESTING_CHECKLIST.md` | 140+ manual verification points |
| `PHASE_6_TEST_SUMMARY.md` | Complete test coverage analysis |
| `README_PHASE_6.md` | This quick reference guide |

## Expected Results

### Automated Tests

✅ **All 486 tests should pass**
- 450 existing tests
- 36 new Phase 6 tests

### Build Verification

```bash
# Type check
npx tsc --noEmit
# Expected: No errors

# Production build
npm run build
# Expected: Build succeeds, ~1.5 MB output
```

## Troubleshooting

### WebSocket Connection Errors

**Symptom:** Tests show `ws proxy error: ECONNREFUSED`

**Solution:** This is expected for default test run. Use E2E config if needed:
```bash
npm run test:e2e
```

### Tests Timing Out

**Symptom:** Tests fail with timeout errors

**Solution:** Increase timeout or check if servers are running:
```typescript
test.setTimeout(60000); // in test file
```

### Visual Differences

**Symptom:** Manual testing shows colors/styles don't match design.png

**Solution:**
1. Check browser zoom is at 100%
2. Verify dark mode toggle state
3. Hard refresh browser (Ctrl+Shift+R)
4. Compare computed styles in DevTools

## Key Validation Points

### 1. Layer Colors (Priority: HIGH)

- [ ] Motivation: Purple (#9333ea)
- [ ] Business: Blue (#3b82f6)
- [ ] Security: Pink (#ec4899)
- [ ] Application: Green (#10b981)
- [ ] Technology: Red (#ef4444)
- [ ] API: Orange/Amber (#f59e0b)

### 2. Zoom Behavior (Priority: HIGH)

- [ ] Smooth 400ms animation
- [ ] Correct layer nodes in viewport
- [ ] Works after manual pan/zoom

### 3. Sidebar Layout (Priority: HIGH)

- [ ] Motivation: 2 columns (Graph + Right Sidebar)
- [ ] Architecture: 2 columns (Graph + Right Sidebar)
- [ ] No duplicate sidebars
- [ ] Collapsible sections work

### 4. Overview Panel (Priority: MEDIUM)

- [ ] "Overview" header visible
- [ ] Border, shadow, rounded corners
- [ ] Bottom-right positioning
- [ ] Dark mode adaptation

## Acceptance Criteria

**Phase 6 is complete when:**

- [x] All 486 automated tests pass
- [ ] Manual testing checklist 100% complete
- [x] No type errors (`npx tsc --noEmit`)
- [x] Build succeeds (`npm run build`)
- [ ] Visual comparison to design.png matches
- [ ] No console errors during manual testing

## Reporting Issues

If you find issues during testing:

1. **Document in checklist:**
   - Add to "Issues Found" section in `MANUAL_TESTING_CHECKLIST.md`

2. **Create GitHub issue:**
   - Label: `bug`, `testing`, `issue-64`
   - Include: Steps to reproduce, expected vs actual behavior, screenshots

3. **Notify team:**
   - Mention in Discussion #65
   - Tag relevant team members

## Resources

- **Issue:** #64 (Parent), Phase 6
- **Discussion:** #65
- **Design Reference:** `design.png` (in project root)
- **Architecture Plan:** Output from Software Architect in issue
- **Test Summary:** `PHASE_6_TEST_SUMMARY.md`

## Questions?

- Check `PHASE_6_TEST_SUMMARY.md` for detailed coverage analysis
- Review `MANUAL_TESTING_CHECKLIST.md` for step-by-step instructions
- Consult Discussion #65 for context and decisions

---

**Last Updated:** 2025-12-18
**Status:** ✅ Ready for Testing
