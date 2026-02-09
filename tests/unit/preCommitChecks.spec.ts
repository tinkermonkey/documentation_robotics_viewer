/**
 * Unit Tests for Pre-commit Check Functions
 *
 * Tests the check functions exported from preCommitChecks.ts via checkFile().
 * Covers the bug-fixed checkAsyncIssues function and basic smoke tests.
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

import { checkFile } from '../helpers/preCommitChecks';

/**
 * Helper to create a temp file with given content, run checkFile, and clean up.
 */
function checkContent(content: string) {
  const tmpDir = os.tmpdir();
  const tmpFile = path.join(tmpDir, `test-${Date.now()}.spec.ts`);
  fs.writeFileSync(tmpFile, content, 'utf-8');
  try {
    return checkFile(tmpFile);
  } finally {
    fs.unlinkSync(tmpFile);
  }
}

test.describe('preCommitChecks', () => {
  test.describe('checkAsyncIssues (via checkFile)', () => {
    test('should detect .then() chains without async context', () => {
      const content = `
import { test } from '@playwright/test';

test('example', () => {
  fetch('/api').then(res => res.json());
});
`;
      const result = checkContent(content);
      const promiseChainIssues = result.issues.filter(i => i.code === 'PROMISE_CHAIN');
      expect(promiseChainIssues.length).toBeGreaterThanOrEqual(1);
    });

    test('should NOT flag .then() inside async function', () => {
      const content = `
import { test } from '@playwright/test';

test('example', async () => {
  const data = fetch('/api').then(res => res.json());
});
`;
      const result = checkContent(content);
      const promiseChainIssues = result.issues.filter(i => i.code === 'PROMISE_CHAIN');
      expect(promiseChainIssues.length).toBe(0);
    });
  });

  test.describe('checkHardcodedTimeouts (via checkFile)', () => {
    test('should detect hardcoded waitForTimeout', () => {
      const content = `
import { test } from '@playwright/test';

test('example', async ({ page }) => {
  await page.waitForTimeout(2000);
});
`;
      const result = checkContent(content);
      const timeoutIssues = result.issues.filter(i => i.code === 'HARDCODED_TIMEOUT');
      expect(timeoutIssues.length).toBe(1);
    });

    test('should NOT flag non-timeout code', () => {
      const content = `
import { test } from '@playwright/test';

test('example', async ({ page }) => {
  await page.waitForSelector('.element');
});
`;
      const result = checkContent(content);
      const timeoutIssues = result.issues.filter(i => i.code === 'HARDCODED_TIMEOUT');
      expect(timeoutIssues.length).toBe(0);
    });
  });

  test.describe('clean files', () => {
    test('should return no issues for clean test file', () => {
      const content = `
import { test, expect } from '@playwright/test';

test('clean test', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('.loaded');
  expect(true).toBe(true);
});
`;
      const result = checkContent(content);
      expect(result.issues.length).toBe(0);
    });
  });
});
