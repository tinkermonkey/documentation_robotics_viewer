#!/usr/bin/env node

/**
 * Package Embedded Viewer for Python Distribution
 *
 * This script:
 * 1. Copies the embedded build to a distribution directory
 * 2. Generates a manifest.json with file hashes and metadata
 * 3. Creates a README for Python integration
 * 4. Organizes files for easy Python packaging
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Paths
const DIST_DIR = path.join(__dirname, '..', 'dist', 'embedded');
const BUNDLE_DIR = path.join(DIST_DIR, 'dr-viewer-bundle');
const PUBLIC_DIR = path.join(DIST_DIR, 'public');
const ASSETS_DIR = path.join(DIST_DIR, 'assets');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Calculate SHA256 hash of a file
 */
function getFileHash(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Get file size in bytes
 */
function getFileSize(filePath) {
  const stats = fs.statSync(filePath);
  return stats.size;
}

/**
 * Format bytes to human readable
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Copy directory recursively
 */
function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Main packaging function
 */
function packageEmbedded() {
  log('\n' + '='.repeat(60), colors.bright);
  log('Packaging Embedded Viewer for Python Distribution', colors.bright);
  log('='.repeat(60) + '\n', colors.bright);

  // Check if dist directory exists
  if (!fs.existsSync(DIST_DIR)) {
    log('Error: dist/embedded directory not found. Run "npm run build:embedded" first.', colors.yellow);
    process.exit(1);
  }

  // Create bundle directory
  log('1. Creating bundle directory...', colors.blue);
  if (fs.existsSync(BUNDLE_DIR)) {
    fs.rmSync(BUNDLE_DIR, { recursive: true });
  }
  fs.mkdirSync(BUNDLE_DIR, { recursive: true });

  // Copy assets
  log('2. Copying assets...', colors.blue);
  const bundleAssetsDir = path.join(BUNDLE_DIR, 'assets');
  copyDirectory(ASSETS_DIR, bundleAssetsDir);

  // Copy HTML
  log('3. Copying HTML...', colors.blue);
  const htmlSource = path.join(PUBLIC_DIR, 'index-embedded.html');
  const htmlDest = path.join(BUNDLE_DIR, 'index.html');
  fs.copyFileSync(htmlSource, htmlDest);

  // Generate manifest
  log('4. Generating manifest...', colors.blue);
  const manifest = generateManifest();
  fs.writeFileSync(
    path.join(BUNDLE_DIR, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );

  // Create README
  log('5. Creating integration README...', colors.blue);
  createReadme(manifest);

  // Print summary
  log('\n' + '='.repeat(60), colors.bright);
  log('Packaging Complete!', colors.green);
  log('='.repeat(60) + '\n', colors.bright);

  log(`Bundle location: ${BUNDLE_DIR}`, colors.green);
  log(`Total files: ${manifest.files.length}`, colors.green);
  log(`Total size: ${formatBytes(manifest.totalSize)}`, colors.green);
  log(`Gzip estimate: ${formatBytes(Math.round(manifest.totalSize * 0.31))}`, colors.green);
  log('');
}

/**
 * Generate manifest.json
 */
function generateManifest() {
  const manifest = {
    name: 'documentation-robotics-viewer-embedded',
    version: require('../package.json').version,
    buildDate: new Date().toISOString(),
    entryPoint: 'index.html',
    files: [],
    totalSize: 0
  };

  // Scan assets directory
  const assetFiles = fs.readdirSync(path.join(BUNDLE_DIR, 'assets'));

  for (const file of assetFiles) {
    const filePath = path.join(BUNDLE_DIR, 'assets', file);
    const hash = getFileHash(filePath);
    const size = getFileSize(filePath);

    manifest.files.push({
      path: `assets/${file}`,
      hash: hash.substring(0, 16), // Short hash
      size: size,
      type: file.endsWith('.js') ? 'javascript' :
            file.endsWith('.css') ? 'stylesheet' : 'other'
    });

    manifest.totalSize += size;
  }

  // Add HTML file
  const htmlPath = path.join(BUNDLE_DIR, 'index.html');
  manifest.files.push({
    path: 'index.html',
    hash: getFileHash(htmlPath).substring(0, 16),
    size: getFileSize(htmlPath),
    type: 'html'
  });
  manifest.totalSize += getFileSize(htmlPath);

  // Sort files by size (largest first)
  manifest.files.sort((a, b) => b.size - a.size);

  return manifest;
}

/**
 * Create README for Python integration
 */
function createReadme(manifest) {
  const readme = `# Documentation Robotics Viewer - Embedded Bundle

This directory contains the pre-built embedded viewer for the Documentation Robotics CLI.

## Bundle Information

- **Version:** ${manifest.version}
- **Build Date:** ${manifest.buildDate}
- **Total Size:** ${formatBytes(manifest.totalSize)}
- **Estimated Gzip:** ${formatBytes(Math.round(manifest.totalSize * 0.31))}

## Files

${manifest.files.map(f => `- \`${f.path}\` (${formatBytes(f.size)})`).join('\n')}

## Integration with Python CLI

### 1. Copy Bundle to Python Package

Copy this entire \`dr-viewer-bundle/\` directory to your Python package:

\`\`\`
dr_cli/
├── viewer/
│   └── bundle/
│       ├── index.html
│       ├── manifest.json
│       ├── README.md
│       └── assets/
│           ├── *.js
│           └── *.css
\`\`\`

### 2. Serve Static Files (FastAPI Example)

\`\`\`python
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path

app = FastAPI()

# Path to viewer bundle
VIEWER_DIR = Path(__file__).parent / "viewer" / "bundle"

# Mount static assets
app.mount("/assets", StaticFiles(directory=VIEWER_DIR / "assets"), name="assets")

@app.get("/")
async def serve_viewer():
    """Serve the embedded viewer"""
    return FileResponse(VIEWER_DIR / "index.html")
\`\`\`

### 3. Implement Required API Endpoints

The viewer expects these endpoints:

- \`GET /health\` - Health check
- \`GET /api/spec\` - Current specification
- \`GET /api/model\` - Current model
- \`GET /api/changesets\` - List changesets
- \`GET /api/changesets/{id}\` - Get changeset details
- \`WS /ws\` - WebSocket for live updates

See the DR CLI server for implementation examples.

### 4. WebSocket Events

Send these events from your Python server:

\`\`\`python
# When model files change
await websocket.send_json({
    "type": "model.updated",
    "timestamp": datetime.now().isoformat()
})

# When new changeset is created
await websocket.send_json({
    "type": "changeset.created",
    "changesetId": "feature-auth-2025-01-15-001",
    "timestamp": datetime.now().isoformat()
})
\`\`\`

## Verification

To verify the bundle integrity, check the \`manifest.json\` file for file hashes:

\`\`\`python
import json
import hashlib

def verify_bundle(bundle_dir):
    with open(bundle_dir / "manifest.json") as f:
        manifest = json.load(f)

    for file_info in manifest["files"]:
        file_path = bundle_dir / file_info["path"]
        with open(file_path, "rb") as f:
            content = f.read()
            actual_hash = hashlib.sha256(content).hexdigest()[:16]

        if actual_hash != file_info["hash"]:
            raise ValueError(f"Hash mismatch for {file_info['path']}")

    return True
\`\`\`

## Updates

To update the viewer bundle:

1. In the viewer repository, make your changes
2. Run \`npm run build:embedded\`
3. Copy the new \`dr-viewer-bundle/\` to your Python package
4. Update your Python package version

## Support

For issues or questions about the embedded viewer:
- Viewer Repository: https://github.com/tinkermonkey/documentation-robotics-viewer
- DR CLI Repository: https://github.com/tinkermonkey/documentation-robotics
`;

  fs.writeFileSync(path.join(BUNDLE_DIR, 'README.md'), readme);
}

// Run packaging
packageEmbedded();
