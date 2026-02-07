#!/usr/bin/env node

/**
 * Generate Ladle Story Tests
 *
 * This script fetches all stories from Ladle's meta.json and generates
 * individual Playwright test files - one test per story.
 *
 * Usage:
 *   node scripts/generate-story-tests.cjs           # Online mode (requires Ladle running)
 *   node scripts/generate-story-tests.cjs --from-build  # Offline mode (uses built catalog)
 *
 * The script also validates that story source files exist and outputs a coverage report.
 *
 * Or add to package.json:
 *   "test:stories:generate": "node scripts/generate-story-tests.cjs"
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const LADLE_PORT = 6006;
const OUTPUT_DIR = path.join(__dirname, '..', 'tests', 'stories');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'all-stories.spec.ts');

// Parse CLI arguments
const args = process.argv.slice(2);
const fromBuild = args.includes('--from-build');

/**
 * Fetches meta.json from Ladle server (online mode) or from built catalog (offline mode)
 * @param {boolean} offline - If true, read from built catalog; otherwise try server first
 * @returns {Promise<Object>} The meta.json object containing all stories
 */
function fetchMetaJson(offline = false) {
  return new Promise((resolve, reject) => {
    // Offline mode: read from built catalog
    if (offline) {
      const builtMetaPath = path.join(__dirname, '..', 'dist', 'catalog', 'meta.json');
      if (!fs.existsSync(builtMetaPath)) {
        reject(
          new Error(
            `meta.json not found in built catalog. Run 'npm run catalog:build' first.\nExpected path: ${builtMetaPath}`
          )
        );
        return;
      }
      try {
        console.log('📁 Reading from built catalog (offline mode)...\n');
        const data = fs.readFileSync(builtMetaPath, 'utf8');
        resolve(JSON.parse(data));
      } catch (error) {
        reject(new Error(`Failed to read built meta.json: ${error.message}`));
      }
      return;
    }

    // Online mode: try to fetch from running Ladle server first
    const request = http.get(
      `http://localhost:${LADLE_PORT}/meta.json`,
      { timeout: 5000 },
      (res) => {
        // Check HTTP response status code
        if (res.statusCode !== 200) {
          reject(
            new Error(
              `Ladle server returned HTTP ${res.statusCode}. Expected 200 OK.\n\nIs Ladle running? Try:\n  npm run catalog:dev`
            )
          );
          return;
        }

        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            console.log('🔗 Using stories from running Ladle server...\n');
            resolve(JSON.parse(data));
          } catch (error) {
            reject(new Error(`Failed to parse meta.json: ${error.message}`));
          }
        });
      }
    );

    // Handle timeout
    request.on('timeout', () => {
      request.destroy();
      reject(
        new Error(
          `HTTP request timed out after 5 seconds. Is Ladle running on port ${LADLE_PORT}?\n\nTry:\n  npm run catalog:dev`
        )
      );
    });

    request.on('error', (error) => {
      // Fallback: try to read from built catalog
      const builtMetaPath = path.join(__dirname, '..', 'dist', 'catalog', 'meta.json');
      if (fs.existsSync(builtMetaPath)) {
        console.log('📁 Ladle server not running, reading from built catalog...\n');
        try {
          const data = fs.readFileSync(builtMetaPath, 'utf8');
          resolve(JSON.parse(data));
        } catch (readError) {
          reject(new Error(`Failed to read built meta.json: ${readError.message}`));
        }
      } else {
        reject(
          new Error(
            `Failed to fetch meta.json. Is Ladle running on port ${LADLE_PORT}? Error: ${error.message}\n\nAlternatively, run: npm run catalog:build`
          )
        );
      }
    });
  });
}

/**
 * Validates that story source files exist
 * @param {Object} stories - The stories object from meta.json
 * @returns {Object} Validation report with total, valid, and missing stories
 */
function validateSourceFiles(stories) {
  const report = {
    total: 0,
    valid: 0,
    missing: [],
  };

  for (const [storyKey, metadata] of Object.entries(stories)) {
    report.total++;

    // Reconstruct the expected source file path from the story metadata
    // Stories are organized by file path in the Ladle structure
    const expectedPath = metadata.filePath;

    if (!expectedPath) {
      report.missing.push({
        storyKey,
        reason: 'No filePath in metadata',
      });
      continue;
    }

    const absolutePath = path.join(__dirname, '..', expectedPath);

    if (fs.existsSync(absolutePath)) {
      report.valid++;
    } else {
      report.missing.push({
        storyKey,
        expectedPath,
      });
    }
  }

  return report;
}

/**
 * Prints a formatted coverage report
 * @param {Object} report - The validation report
 */
function printCoverageReport(report) {
  console.log('\n=== Story Coverage Report ===');
  console.log(`Total stories in meta.json: ${report.total}`);
  console.log(`Valid source files found: ${report.valid}`);
  console.log(`Missing source files: ${report.missing.length}`);

  if (report.missing.length > 0) {
    console.log('\nMissing story files:');
    report.missing.forEach(({ storyKey, expectedPath, reason }) => {
      if (reason) {
        console.log(`  ⚠️  ${storyKey} (${reason})`);
      } else {
        console.log(`  ⚠️  ${storyKey}`);
        console.log(`      Expected: ${expectedPath}`);
      }
    });
  }

  const coveragePercent = report.total > 0 ? ((report.valid / report.total) * 100).toFixed(1) : '0.0';
  console.log(`\n📊 Coverage: ${coveragePercent}% (${report.valid}/${report.total})`);
  console.log('='.repeat(30) + '\n');

  return coveragePercent;
}

/**
 * Generates test code for all stories
 */
function generateTestFile(stories) {
  const storyEntries = Object.entries(stories);

  const testContent = `/**
 * Auto-generated Ladle Story Validation Tests
 *
 * Generated by: scripts/generate-story-tests.cjs
 * Generated at: ${new Date().toISOString()}
 * Total stories: ${storyEntries.length}
 *
 * DO NOT EDIT MANUALLY - Regenerate using:
 *   npm run test:stories:generate
 */

import { test, expect, Page } from '@playwright/test';
import type { ConsoleMessage } from '@playwright/test';

interface ValidationResult {
  consoleErrors: string[];
  pageErrors: string[];
}

/**
 * Validates a story by checking for errors and basic rendering
 */
async function validateStory(
  page: Page,
  storyKey: string,
  storyName: string
): Promise<ValidationResult> {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  // ErrorBoundary "With error" story is SUPPOSED to trigger errors
  const shouldAllowErrors = storyName.includes('Errorboundary / With error');

  const consoleHandler = (msg: ConsoleMessage) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Filter out expected errors that occur in component isolation
      const isExpectedError =
        shouldAllowErrors || // Allow all errors for ErrorBoundary test
        text.includes('React does not recognize') ||
        text.includes('Warning: ') ||
        text.includes('DevTools') ||
        text.includes('Download the React DevTools') ||
        text.includes('<path> attribute d: Expected number') ||
        text.includes('<svg> attribute viewBox: Expected number') ||
        text.includes('The tag <%s> is unrecognized in this browser') ||
        text.includes('source/target node') ||
        text.includes('source/target handle') ||
        // Backend API and WebSocket errors (expected in isolated story tests)
        text.includes('500 Internal Server Error') ||
        text.includes('WebSocket connection') ||
        text.includes('[WebSocket]') ||
        text.includes('[DataLoader]') ||
        text.includes('[EmbeddedLayout]') ||
        text.includes('Failed to load resource') ||
        text.includes('[ModelRoute] Error loading model') ||
        text.includes('ECONNREFUSED');

      if (!isExpectedError) {
        consoleErrors.push(text);
      }
    }
  };

  const errorHandler = (error: Error) => {
    if (!shouldAllowErrors) {
      pageErrors.push(error.message);
    }
  };

  page.on('console', consoleHandler);
  page.on('pageerror', errorHandler);

  try {
    const url = \`/?story=\${storyKey}&mode=preview\`;
    const response = await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    expect(response?.status(), \`Story "\${storyName}" failed to load\`).toBe(200);
    await page.waitForTimeout(1000);

    const errorBoundary = await page.locator('[data-error-boundary]').count();

    if (!shouldAllowErrors) {
      expect(
        errorBoundary,
        \`Story "\${storyName}" triggered an error boundary\`
      ).toBe(0);
    }

    return { consoleErrors, pageErrors };
  } finally {
    page.off('console', consoleHandler);
    page.off('pageerror', errorHandler);
  }
}

test.describe('Ladle Story Validation - All Stories', () => {
  test.describe.configure({ mode: 'parallel' });

${storyEntries
  .map(([storyKey, metadata]) => {
    const testName = [...metadata.levels, metadata.name].join(' / ');
    const safeName = testName.replace(/['"]/g, '\\"');

    return `  test('${safeName}', async ({ page }) => {
    const result = await validateStory(page, '${storyKey}', '${safeName}');

    expect(
      result.consoleErrors.length,
      \`Story produced \${result.consoleErrors.length} console error(s): \${result.consoleErrors.join('; ')}\`
    ).toBe(0);

    expect(
      result.pageErrors.length,
      \`Story threw \${result.pageErrors.length} uncaught exception(s): \${result.pageErrors.join('; ')}\`
    ).toBe(0);
  });
`;
  })
  .join('\n')}
});
`;

  return testContent;
}

/**
 * Main execution
 */
async function main() {
  console.log(`🔍 Fetching stories${fromBuild ? ' from built catalog' : ''}...\n`);

  try {
    // Fetch metadata
    const meta = await fetchMetaJson(fromBuild);
    const stories = meta.stories;
    const storyCount = Object.keys(stories).length;

    console.log(`📚 Found ${storyCount} stories\n`);

    // Validate source files
    const validationReport = validateSourceFiles(stories);
    const coveragePercent = printCoverageReport(validationReport);

    // Filter out stories with missing source files
    const validStories = Object.entries(stories).reduce((acc, [key, meta]) => {
      const expectedPath = meta.filePath;
      if (!expectedPath) return acc;

      const absolutePath = path.join(__dirname, '..', expectedPath);
      if (fs.existsSync(absolutePath)) {
        acc[key] = meta;
      }
      return acc;
    }, {});

    const validCount = Object.keys(validStories).length;

    // Ensure output directory exists with error handling
    if (!fs.existsSync(OUTPUT_DIR)) {
      try {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
      } catch (error) {
        if (error.code === 'EACCES') {
          throw new Error(`Permission denied: Cannot create directory ${OUTPUT_DIR}. Check file permissions.`);
        } else if (error.code === 'ENOSPC') {
          throw new Error(`No space left on device: Cannot write to ${OUTPUT_DIR}.`);
        } else {
          throw new Error(`Failed to create directory ${OUTPUT_DIR}: ${error.message}`);
        }
      }
    }

    // Generate test file with only valid stories
    const testContent = generateTestFile(validStories);

    // Write test file with error handling
    try {
      fs.writeFileSync(OUTPUT_FILE, testContent, 'utf8');
    } catch (error) {
      if (error.code === 'EACCES') {
        throw new Error(`Permission denied: Cannot write to ${OUTPUT_FILE}. Check file permissions.`);
      } else if (error.code === 'ENOSPC') {
        throw new Error(`No space left on device: Cannot write to ${OUTPUT_FILE}.`);
      } else if (error.code === 'EISDIR') {
        throw new Error(`${OUTPUT_FILE} is a directory, not a file.`);
      } else {
        throw new Error(`Failed to write test file ${OUTPUT_FILE}: ${error.message}`);
      }
    }

    // Report results
    console.log(`✅ Generated test file: ${OUTPUT_FILE}`);
    console.log(`   - ${validCount} individual tests created (from ${storyCount} total stories)`);

    if (validationReport.missing.length > 0) {
      console.log(`   - ${validationReport.missing.length} stories skipped due to missing source files`);
    }

    console.log(`\n📈 Test Coverage: ${coveragePercent}%`);
    console.log(`\nRun tests with:`);
    console.log(`   npx playwright test ${OUTPUT_FILE} --config=playwright.refinement.config.ts\n`);
  } catch (error) {
    console.error(`❌ Error: ${error.message}\n`);
    if (fromBuild) {
      console.error('Make sure to build the catalog first:');
      console.error('   npm run catalog:build\n');
    } else {
      console.error('Make sure Ladle is running:');
      console.error('   npm run catalog:dev\n');
      console.error('Or use offline mode:');
      console.error('   node scripts/generate-story-tests.cjs --from-build\n');
    }
    process.exit(1);
  }
}

main();
