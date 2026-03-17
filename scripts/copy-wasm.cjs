#!/usr/bin/env node

/**
 * Copy WASM files to public directory for serving
 *
 * libavoid-js requires the .wasm file to be served alongside the JS module.
 * This script copies the WASM binary from node_modules to the public directory
 * so it's available in both development (vite dev) and production builds.
 */

const fs = require('fs');
const path = require('path');

const sourceWasm = path.join(__dirname, '..', 'node_modules', 'libavoid-js', 'dist', 'libavoid.wasm');
const targetWasm = path.join(__dirname, '..', 'public', 'libavoid.wasm');

try {
  if (!fs.existsSync(sourceWasm)) {
    console.error(`Error: WASM file not found at ${sourceWasm}`);
    process.exit(1);
  }

  fs.copyFileSync(sourceWasm, targetWasm);
  console.log(`✓ Copied libavoid.wasm to public directory`);
} catch (error) {
  console.error(`Error copying WASM file: ${error.message}`);
  process.exit(1);
}
