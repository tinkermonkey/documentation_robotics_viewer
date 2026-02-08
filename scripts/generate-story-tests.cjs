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
 * Escapes special characters in test names to prevent code injection and syntax errors
 * @param {string} str - String to escape
 * @returns {string} Escaped string safe for use in test names
 */
function escapeTestName(str) {
  return str
    .replace(/\\/g, '\\\\') // Backslash
    .replace(/'/g, "\\'") // Single quote
    .replace(/"/g, '\\"') // Double quote
    .replace(/`/g, '\\`') // Backtick
    .replace(/\$/g, '\\$') // Dollar sign
    .replace(/\n/g, '\\n') // Newline
    .replace(/\r/g, '\\r') // Carriage return
    .replace(/\t/g, '\\t'); // Tab
}

/**
 * Validates story metadata structure
 * @param {string} storyKey - The story key from meta.json
 * @param {*} metadata - The metadata object to validate
 * @returns {Object} Validation result with {valid: boolean, errors: string[]}
 */
function validateStoryMetadata(storyKey, metadata) {
  const errors = [];

  if (!metadata) {
    errors.push('Metadata is null or undefined');
    return { valid: false, errors };
  }

  if (typeof metadata !== 'object' || Array.isArray(metadata)) {
    errors.push(`Metadata must be an object, got ${typeof metadata}`);
    return { valid: false, errors };
  }

  // Validate required 'name' field
  if (!metadata.name) {
    errors.push('Missing required field: "name"');
  } else if (typeof metadata.name !== 'string') {
    errors.push(`Field "name" must be a string, got ${typeof metadata.name}`);
  } else if (metadata.name.trim().length === 0) {
    errors.push('Field "name" is empty');
  }

  // Validate required 'levels' field
  if (!metadata.levels) {
    errors.push('Missing required field: "levels"');
  } else if (!Array.isArray(metadata.levels)) {
    errors.push(`Field "levels" must be an array, got ${typeof metadata.levels}`);
  } else {
    // Check all levels are strings
    for (let i = 0; i < metadata.levels.length; i++) {
      if (typeof metadata.levels[i] !== 'string') {
        errors.push(`Field "levels[${i}]" must be a string, got ${typeof metadata.levels[i]}`);
      } else if (metadata.levels[i].trim().length === 0) {
        errors.push(`Field "levels[${i}]" is empty`);
      }
    }
  }

  // Validate optional 'filePath' field if present
  if (metadata.filePath && typeof metadata.filePath !== 'string') {
    errors.push(`Field "filePath" must be a string, got ${typeof metadata.filePath}`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Generates test code for all stories
 */
function generateTestFile(stories) {
  const storyEntries = Object.entries(stories);
  const invalidStories = [];

  // Validate all story metadata before generating tests
  for (const [storyKey, metadata] of storyEntries) {
    const validation = validateStoryMetadata(storyKey, metadata);
    if (!validation.valid) {
      invalidStories.push({
        storyKey,
        errors: validation.errors,
      });
    }
  }

  // If there are invalid stories, report them but continue (they'll be filtered out below)
  if (invalidStories.length > 0) {
    console.warn(`\n⚠️  Warning: Found ${invalidStories.length} story(ies) with invalid metadata:\n`);
    invalidStories.forEach(({ storyKey, errors }) => {
      console.warn(`  Story: ${storyKey}`);
      errors.forEach((error) => {
        console.warn(`    - ${error}`);
      });
    });
    console.warn('  These stories will be skipped.\n');
  }

  // Filter out invalid stories
  const validStories = storyEntries.filter(([storyKey]) => {
    return !invalidStories.some((invalid) => invalid.storyKey === storyKey);
  });

  const testContent = `/**
 * Auto-generated Ladle Story Validation Tests
 *
 * Generated by: scripts/generate-story-tests.cjs
 * Generated at: ${new Date().toISOString()}
 * Total stories: ${validStories.length}
 *
 * DO NOT EDIT MANUALLY - Regenerate using:
 *   npm run test:stories:generate
 */

import { test, expect, Page } from '@playwright/test';
import type { ConsoleMessage } from '@playwright/test';
import { isExpectedConsoleError } from './storyErrorFilters';

interface ValidationResult {
  consoleErrors: string[];
  pageErrors: string[];
  allowedErrors: string[];
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
  const allowedErrors: string[] = [];

  // ErrorBoundary "With error" story is SUPPOSED to trigger errors
  const shouldAllowErrors = storyName.includes('Errorboundary / With error');

  const consoleHandler = (msg: ConsoleMessage) => {
    if (msg.type() === 'error') {
      const text = msg.text();

      // Check if this is an expected error
      if (shouldAllowErrors || isExpectedConsoleError(text)) {
        console.log(\`[ALLOWED ERROR in "\${storyName}"]: \${text}\`);
        allowedErrors.push(text);
      } else {
        consoleErrors.push(text);
      }
    }
  };

  const errorHandler = (error: Error) => {
    const message = error.message;
    if (shouldAllowErrors) {
      console.log(\`[ALLOWED PAGE ERROR in "\${storyName}"]: \${message}\`);
      allowedErrors.push(message);
    } else {
      console.error(\`[PAGE ERROR in "\${storyName}"]: \${message}\`);
      pageErrors.push(message);
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

    // Validate navigation succeeded with explicit null check
    if (!response) {
      throw new Error(\`Navigation timed out for story "\${storyName}"\`);
    }

    // Validate HTTP response status
    const status = response.status();
    if (status !== 200) {
      throw new Error(\`Story returned HTTP \${status} for story "\${storyName}"\`);
    }

    expect(status, \`Story "\${storyName}" failed to load\`).toBe(200);
    await page.waitForTimeout(1000);

    const errorBoundary = await page.locator('[data-error-boundary]').count();

    if (!shouldAllowErrors) {
      expect(
        errorBoundary,
        \`Story "\${storyName}" triggered an error boundary\`
      ).toBe(0);
    }

    return { consoleErrors, pageErrors, allowedErrors };
  } finally {
    page.off('console', consoleHandler);
    page.off('pageerror', errorHandler);
  }
}

test.describe('Ladle Story Validation - All Stories', () => {
  test.describe.configure({ mode: 'parallel' });

${validStories
  .map(([storyKey, metadata]) => {
    const testName = [...metadata.levels, metadata.name].join(' / ');
    const escapedTestName = escapeTestName(testName);
    const escapedStoryKey = escapeTestName(storyKey);

    return `  test('${escapedTestName}', async ({ page }) => {
    const result = await validateStory(page, '${escapedStoryKey}', '${escapedTestName}');

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

    // Generate test file with validation
    const testContent = generateTestFile(validStories);

    // Count the number of actual tests generated
    const generatedTestCount = (testContent.match(/test\('/g) || []).length;

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
    console.log(`   - ${generatedTestCount} individual tests created (from ${storyCount} total stories)`);

    if (validationReport.missing.length > 0) {
      console.log(`   - ${validationReport.missing.length} stories skipped due to missing source files`);
    }

    if (storyCount > validCount) {
      console.log(`   - ${storyCount - validCount} stories skipped due to invalid metadata`);
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
