/**
 * Pre-commit checks for test infrastructure quality
 *
 * This can be used in a pre-commit hook to catch common issues before committing:
 * - Hardcoded waitForTimeout calls (use waitForElement instead)
 * - Skipped tests without documentation
 * - Console.log statements left behind
 * - Missing error handling in critical tests
 *
 * Usage:
 *   node tests/helpers/preCommitChecks.ts
 *   Or add to .husky/pre-commit:
 *   npx node tests/helpers/preCommitChecks.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

interface CheckResult {
  file: string;
  issues: CheckIssue[];
  severity: 'error' | 'warning' | 'info';
}

interface CheckIssue {
  line: number;
  column: number;
  message: string;
  code: string;
  suggestion?: string;
}

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  gray: '\x1b[90m'
};

/**
 * Get staged test files
 */
function getStagedTestFiles(): string[] {
  try {
    const output = execSync('git diff --cached --name-only --diff-filter=ACM', {
      encoding: 'utf-8'
    });

    return output
      .split('\n')
      .filter((file) => file.endsWith('.spec.ts') && fs.existsSync(file));
  } catch (error) {
    console.error('Error getting staged files:', error);
    return [];
  }
}

/**
 * Read file contents with line tracking
 */
function readFileWithLines(filePath: string): string[] {
  return fs.readFileSync(filePath, 'utf-8').split('\n');
}

/**
 * Check for hardcoded waitForTimeout calls
 */
function checkHardcodedTimeouts(
  filePath: string,
  lines: string[]
): CheckIssue[] {
  const issues: CheckIssue[] = [];

  lines.forEach((line, index) => {
    const lineNum = index + 1;

    // Match: await page.waitForTimeout(...)
    if (/await\s+page\.waitForTimeout\s*\(\s*\d+\s*\)/.test(line)) {
      const match = line.match(/waitForTimeout\s*\(\s*(\d+)\s*\)/);
      const timeout = match ? match[1] : '??';

      issues.push({
        line: lineNum,
        column: line.indexOf('waitForTimeout'),
        message: `Hardcoded timeout found (${timeout}ms)`,
        code: 'HARDCODED_TIMEOUT',
        suggestion:
          'Use waitForElement() or other wait utilities from testUtils.ts instead. ' +
          'See: tests/helpers/WAIT_STRATEGIES.md'
      });
    }
  });

  return issues;
}

/**
 * Check for test.skip without documentation
 */
function checkSkippedTests(filePath: string, lines: string[]): CheckIssue[] {
  const issues: CheckIssue[] = [];

  lines.forEach((line, index) => {
    const lineNum = index + 1;

    // Match: test.skip or test.skip(...)
    if (/test\.skip\s*\(/.test(line)) {
      // Check if there's a comment above explaining why
      const prevLine = index > 0 ? lines[index - 1] : '';
      const hasComment =
        /\/\/\s*(FIXME|TODO|SKIP|NOTE)/.test(prevLine) ||
        /SKIPPED:|Gap #|Expected:/i.test(line);

      if (!hasComment) {
        issues.push({
          line: lineNum,
          column: line.indexOf('test.skip'),
          message: 'Test.skip without explanation',
          code: 'UNDOCUMENTED_SKIP',
          suggestion:
            'Add comment above explaining why test is skipped. ' +
            'Example: // TODO: Fix race condition in WebSocket handler'
        });
      }
    }
  });

  return issues;
}

/**
 * Check for console.log left in tests
 */
function checkConsoleLogs(filePath: string, lines: string[]): CheckIssue[] {
  const issues: CheckIssue[] = [];

  lines.forEach((line, index) => {
    const lineNum = index + 1;

    // Match: console.log, console.error, console.warn (but allow in specific cases)
    if (/console\.(log|error|warn)\s*\(/.test(line)) {
      // Allow: logger setup, debug output in verbose sections
      const isAllowed =
        /logTestProgress|DEBUG|verbose|\.\.\.logger/.test(line) ||
        /\/\/\s*DEBUG|\/\/\s*TEMP/.test(line);

      if (!isAllowed) {
        issues.push({
          line: lineNum,
          column: line.indexOf('console'),
          message: 'console.log/error/warn left in test',
          code: 'CONSOLE_LOG',
          suggestion:
            'Remove console statement or use logTestProgress() for debugging. ' +
            'See: tests/helpers/testUtils.ts'
        });
      }
    }
  });

  return issues;
}

/**
 * Check for common async/await mistakes
 */
function checkAsyncIssues(filePath: string, lines: string[]): CheckIssue[] {
  const issues: CheckIssue[] = [];

  lines.forEach((line, index) => {
    const lineNum = index + 1;

    // Check for .then() chains (should be async/await)
    if (
      /\.then\s*\(/.test(line) &&
      !/async/.test(lines[Math.max(0, index - 5)].join(''))
    ) {
      issues.push({
        line: lineNum,
        column: line.indexOf('.then'),
        message: 'Promise chain using .then() instead of async/await',
        code: 'PROMISE_CHAIN',
        suggestion:
          'Convert to async/await for better readability and error handling'
      });
    }

    // Check for missing await on async operations
    if (
      /\.waitForSelector\s*\(/.test(line) &&
      !/(await|const|let|var)/.test(line)
    ) {
      issues.push({
        line: lineNum,
        column: line.indexOf('waitForSelector'),
        message: 'Missing await on async operation',
        code: 'MISSING_AWAIT',
        suggestion: 'Add await before async call'
      });
    }
  });

  return issues;
}

/**
 * Check for missing error handling in critical operations
 */
function checkErrorHandling(filePath: string, lines: string[]): CheckIssue[] {
  const issues: CheckIssue[] = [];

  lines.forEach((line, index) => {
    const lineNum = index + 1;

    // Check for network calls without try-catch
    if (
      /fetch\s*\(|http\.|api\./.test(line) &&
      !/try|catch|Promise\.catch/.test(lines.slice(Math.max(0, index - 2), index + 3).join(''))
    ) {
      // Allow if already in try block
      if (!/^\s*try/.test(lines[Math.max(0, index - 2)])) {
        issues.push({
          line: lineNum,
          column: line.indexOf('fetch'),
          message: 'Network operation without error handling',
          code: 'NO_ERROR_HANDLING',
          suggestion:
            'Wrap in try-catch or use retryWithBackoff() from testUtils.ts'
        });
      }
    }
  });

  return issues;
}

/**
 * Run all checks on a file
 */
function checkFile(filePath: string): CheckResult {
  const lines = readFileWithLines(filePath);

  const issues: CheckIssue[] = [
    ...checkHardcodedTimeouts(filePath, lines),
    ...checkSkippedTests(filePath, lines),
    ...checkConsoleLogs(filePath, lines),
    ...checkAsyncIssues(filePath, lines),
    ...checkErrorHandling(filePath, lines)
  ];

  // Sort by line number
  issues.sort((a, b) => a.line - b.line);

  // Determine severity
  let severity: 'error' | 'warning' | 'info' = 'info';
  if (issues.some((i) => i.code === 'HARDCODED_TIMEOUT')) severity = 'error';
  if (issues.some((i) => i.code === 'MISSING_AWAIT')) severity = 'error';
  if (issues.some((i) => i.code === 'UNDOCUMENTED_SKIP')) severity = 'warning';

  return {
    file: filePath,
    issues,
    severity
  };
}

/**
 * Format results for terminal output
 */
function formatResults(results: CheckResult[]): void {
  const hasErrors = results.some((r) => r.issues.length > 0);

  if (!hasErrors) {
    console.log(`\n${colors.green}✓ All test files passed pre-commit checks${colors.reset}\n`);
    return;
  }

  console.log(`\n${colors.red}✗ Pre-commit check failed${colors.reset}\n`);

  results.forEach((result) => {
    if (result.issues.length === 0) return;

    console.log(`${colors.blue}${result.file}${colors.reset}`);

    result.issues.forEach((issue) => {
      const icon =
        result.severity === 'error'
          ? `${colors.red}✗${colors.reset}`
          : `${colors.yellow}⚠${colors.reset}`;

      console.log(
        `  ${icon} Line ${issue.line}: ${issue.message} ${colors.gray}(${issue.code})${colors.reset}`
      );

      if (issue.suggestion) {
        console.log(`     ${colors.gray}→ ${issue.suggestion}${colors.reset}`);
      }
    });

    console.log();
  });

  const errorCount = results.reduce((sum, r) => sum + r.issues.length, 0);
  console.log(
    `\n${colors.red}${errorCount} issue(s) found${colors.reset}` +
    `\n\nTo fix:\n` +
    `  1. Run: npm run migrate-tests\n` +
    `  2. Or manually fix issues listed above\n` +
    `  3. Review: tests/helpers/WAIT_STRATEGIES.md\n`
  );
}

/**
 * Main execution
 */
function main() {
  console.log(`\n${colors.blue}Running pre-commit test checks...${colors.reset}`);

  const testFiles = getStagedTestFiles();

  if (testFiles.length === 0) {
    console.log(`${colors.gray}No staged test files to check${colors.reset}\n`);
    return;
  }

  console.log(`Found ${testFiles.length} test file(s) to check\n`);

  const results = testFiles.map(checkFile);

  formatResults(results);

  // Exit with error if critical issues found
  const hasErrors = results.some((r) => r.severity === 'error');
  if (hasErrors) {
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error('Error running pre-commit checks:', error);
    process.exit(1);
  }
}

export { checkFile, getStagedTestFiles };
