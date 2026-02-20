#!/usr/bin/env node

/**
 * API Version Compatibility Checker
 *
 * Validates API version compatibility and detects breaking changes.
 * This script runs as part of the build and development process to ensure
 * the application can handle API version mismatches gracefully.
 *
 * Features:
 * - Reads current API spec version
 * - Compares against stored version baseline
 * - Detects breaking changes (major/minor version increments)
 * - Logs warnings for developer awareness
 * - Prevents builds if incompatible changes detected
 */

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const specPath = path.resolve('docs/api-spec.yaml');
const versionCachePath = path.resolve('.api-version-cache.json');

/**
 * Parse semantic version into components
 */
function parseVersion(versionString) {
  const match = versionString.match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) {
    throw new Error(`Invalid version format: ${versionString}`);
  }
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    full: versionString
  };
}

/**
 * Detect if version change includes breaking changes
 */
function detectBreakingChanges(oldVersion, newVersion) {
  const changes = {
    isBreaking: false,
    reason: [],
    severity: 'none' // 'none', 'warning', 'error'
  };

  // Major version change always indicates breaking changes
  if (oldVersion.major !== newVersion.major) {
    changes.isBreaking = true;
    changes.reason.push(
      `Major version changed: ${oldVersion.major} → ${newVersion.major}`
    );
    changes.severity = 'error';
  }
  // Minor version change may indicate breaking changes at API level
  else if (oldVersion.minor !== newVersion.minor) {
    changes.isBreaking = true;
    changes.reason.push(
      `Minor version changed: ${oldVersion.minor} → ${newVersion.minor}`
    );
    changes.severity = 'warning';
  }
  // Patch version is backwards compatible
  else if (oldVersion.patch !== newVersion.patch) {
    changes.reason.push(
      `Patch version changed: ${oldVersion.patch} → ${newVersion.patch} (backwards compatible)`
    );
    changes.severity = 'info';
  }

  return changes;
}

/**
 * Read API spec version from YAML
 */
function readApiSpecVersion() {
  if (!fs.existsSync(specPath)) {
    throw new Error(`API spec not found: ${specPath}`);
  }

  const specContent = fs.readFileSync(specPath, 'utf-8');
  const spec = yaml.load(specContent);

  if (!spec.info || !spec.info.version) {
    throw new Error('API spec is missing info.version field');
  }

  return spec.info.version;
}

/**
 * Load cached version info
 */
function loadVersionCache() {
  if (!fs.existsSync(versionCachePath)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(versionCachePath, 'utf-8'));
  } catch (error) {
    console.warn(`Warning: Failed to parse version cache: ${error.message}`);
    return null;
  }
}

/**
 * Save current version to cache
 */
function saveVersionCache(version) {
  const cache = {
    version,
    timestamp: new Date().toISOString(),
    buildTimestamp: process.env.BUILD_TIMESTAMP || new Date().toISOString()
  };

  fs.writeFileSync(versionCachePath, JSON.stringify(cache, null, 2));
}

/**
 * Main version checking logic
 */
function checkApiVersion() {
  try {
    const currentVersion = readApiSpecVersion();
    const currentParsed = parseVersion(currentVersion);
    const cache = loadVersionCache();

    console.log(`\n📋 API Version Check`);
    console.log(`Current API spec version: ${currentVersion}`);

    if (!cache) {
      console.log(`✅ First time setup - no previous version to compare`);
      saveVersionCache(currentVersion);
      return 0;
    }

    const previousParsed = parseVersion(cache.version);
    console.log(`Previous API spec version: ${cache.version}`);
    console.log(`Last checked: ${cache.timestamp}`);

    // Detect breaking changes
    const changes = detectBreakingChanges(previousParsed, currentParsed);

    if (changes.isBreaking) {
      console.log(`\n⚠️  Breaking Changes Detected:`);
      changes.reason.forEach(reason => console.log(`  - ${reason}`));

      if (changes.severity === 'error') {
        console.error(`\n❌ ERROR: Major version change requires code updates`);
        console.error(`Please review API changes and update the client accordingly.`);
        console.error(`\nTo acknowledge and continue:`);
        console.error(`  1. Review the API spec at docs/api-spec.yaml`);
        console.error(`  2. Update embeddedDataLoader.ts to match new API`);
        console.error(`  3. Run tests to verify compatibility`);
        console.error(`  4. Run: npm run client:check-version -- --force\n`);
        return 1;
      } else if (changes.severity === 'warning') {
        console.warn(`\n⚠️  WARNING: Minor version change detected`);
        console.warn(`The API may have additive changes. Verify compatibility.`);
      }
    } else if (changes.reason.length > 0) {
      console.log(`\n✅ ${changes.reason[0]}`);
    } else {
      console.log(`✅ API version unchanged`);
    }

    saveVersionCache(currentVersion);
    return 0;
  } catch (error) {
    console.error(`\n❌ Version check failed: ${error.message}`);
    console.error(`Stack: ${error.stack}`);
    return 1;
  }
}

// Handle --force flag to bypass version check
if (process.argv.includes('--force')) {
  console.log(`⏭️  Forcing version cache update...`);
  try {
    const currentVersion = readApiSpecVersion();
    saveVersionCache(currentVersion);
    console.log(`✅ Version cache updated to ${currentVersion}`);
  } catch (error) {
    console.error(`Failed to update version cache: ${error.message}`);
    process.exit(1);
  }
} else {
  process.exit(checkApiVersion());
}
