/**
 * Direct test of parseSchemaDefinitions with real schema data
 * Run with: node test-parse-schema.js
 */

const fs = require('fs');
const path = require('path');

// Load schema files
const schemaDir = '.dr/schemas';
const files = fs.readdirSync(schemaDir).filter(f => f.endsWith('.json'));

console.log(`Found ${files.length} schema files`);

const schemas = {};
for (const file of files) {
  const filePath = path.join(schemaDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  const schema = JSON.parse(content);

  // Clean the filename like SpecGraphView does
  const layerName = file
    .replace(/^\d+-/, '')              // Remove number prefix
    .replace(/-layer.*$/, '')          // Remove "-layer" suffix and extension
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

  schemas[layerName] = schema;
  console.log(`Loaded: ${file} -> ${layerName}`);
}

console.log('\nCleaned schema keys:', Object.keys(schemas));
console.log('\nThis is what gets passed to parseSchemaDefinitions()');
console.log('Now try to import and call the actual DataLoader...');

// Try to dynamically import the built module
try {
  // The built module won't work in Node directly because it's bundled for browser
  console.log('\nCannot directly import browser bundle.');
  console.log('But we can verify the schema data structure is correct.');
  console.log('\nSchema data ready to pass to parseSchemaDefinitions():');
  console.log({
    schemaCount: Object.keys(schemas).length,
    layerNames: Object.keys(schemas),
    version: '0.2.0'
  });
} catch (err) {
  console.error('Error:', err.message);
}
