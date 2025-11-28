/**
 * Micro-server for Documentation Robotics Viewer
 * Handles GitHub API proxying to avoid CORS issues
 */

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3002;

// GitHub API configuration
const GITHUB_OWNER = 'tinkermonkey';
const GITHUB_REPO = 'documentation_robotics';
const GITHUB_API_BASE = 'https://api.github.com';

// Enable CORS for frontend - allow all localhost ports for development
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);

    // Allow all localhost origins for development
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return callback(null, origin); // Return the origin to set Access-Control-Allow-Origin
    }

    // For production, you would check against specific allowed origins
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(express.json());

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'documentation-robotics-viewer-api' });
});

/**
 * Get all releases from GitHub
 */
app.get('/api/github/releases', async (req, res) => {
  try {
    console.log('Fetching releases from GitHub...');

    const url = `${GITHUB_API_BASE}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'documentation-robotics-viewer'
      }
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    const releases = await response.json();

    // Filter for spec releases
    const specReleases = releases.filter(release =>
      release.tag_name.startsWith('spec-v') ||
      release.tag_name.startsWith('v')
    );

    console.log(`Found ${specReleases.length} spec releases out of ${releases.length} total`);

    res.json(specReleases);
  } catch (error) {
    console.error('Error fetching releases:', error);
    res.status(500).json({
      error: 'Failed to fetch releases',
      message: error.message
    });
  }
});

/**
 * Get latest spec release
 */
app.get('/api/github/releases/latest', async (req, res) => {
  try {
    console.log('Fetching latest spec release...');

    const url = `${GITHUB_API_BASE}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'documentation-robotics-viewer'
      }
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    const releases = await response.json();

    // Filter for spec releases
    const specReleases = releases.filter(release =>
      release.tag_name.startsWith('spec-v') ||
      release.tag_name.startsWith('v')
    );

    if (specReleases.length === 0) {
      return res.status(404).json({
        error: 'No spec releases found',
        message: 'No releases with tags starting with "spec-v" or "v" were found.'
      });
    }

    console.log(`Latest spec release: ${specReleases[0].tag_name}`);

    res.json(specReleases[0]);
  } catch (error) {
    console.error('Error fetching latest release:', error);
    res.status(500).json({
      error: 'Failed to fetch latest release',
      message: error.message
    });
  }
});

/**
 * Get a specific release by tag
 */
app.get('/api/github/releases/:tag', async (req, res) => {
  try {
    const { tag } = req.params;
    console.log(`Fetching release: ${tag}`);

    const url = `${GITHUB_API_BASE}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/tags/${tag}`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'documentation-robotics-viewer'
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        return res.status(404).json({
          error: 'Release not found',
          message: `No release found with tag: ${tag}`
        });
      }
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    const release = await response.json();
    res.json(release);
  } catch (error) {
    console.error('Error fetching release:', error);
    res.status(500).json({
      error: 'Failed to fetch release',
      message: error.message
    });
  }
});

/**
 * Serve example-implementation model as parsed data
 */
app.get('/api/example-implementation', async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');

    const modelDir = path.join(__dirname, '..', 'example-implementation', 'model');
    const projectionRulesPath = path.join(__dirname, '..', 'example-implementation', 'projection-rules.yaml');

    if (!fs.existsSync(modelDir)) {
      return res.status(404).json({
        error: 'Example implementation not found',
        message: 'The example-implementation/model directory does not exist.'
      });
    }

    console.log('Loading example-implementation data from disk...');

    // Recursively read all YAML files from the model directory
    const files = {};

    function readDirectory(dirPath, relativePath = '') {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const relPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;

        if (entry.isDirectory()) {
          readDirectory(fullPath, relPath);
        } else if (entry.isFile() && (entry.name.endsWith('.yaml') || entry.name.endsWith('.yml'))) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          files[relPath] = content;
        }
      }
    }

    readDirectory(modelDir);

    // Add projection-rules.yaml if it exists
    if (fs.existsSync(projectionRulesPath)) {
      const content = fs.readFileSync(projectionRulesPath, 'utf-8');
      files['projection-rules.yaml'] = content;
    }

    console.log(`Loaded ${Object.keys(files).length} YAML files from example-implementation`);

    // Return as JSON
    res.json(files);
  } catch (error) {
    console.error('Error serving example implementation:', error);
    res.status(500).json({
      error: 'Failed to serve example implementation',
      message: error.message
    });
  }
});

/**
 * Download schema ZIP from a release
 * This endpoint proxies the download to avoid CORS issues
 */
app.get('/api/github/download/:tag', async (req, res) => {
  try {
    const { tag } = req.params;
    console.log(`Downloading schemas for release: ${tag}`);

    // First, get the release info
    const releaseUrl = `${GITHUB_API_BASE}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/tags/${tag}`;
    const releaseResponse = await fetch(releaseUrl, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'documentation-robotics-viewer'
      }
    });

    if (!releaseResponse.ok) {
      throw new Error(`Release not found: ${tag}`);
    }

    const release = await releaseResponse.json();

    // Find the schema ZIP asset
    const schemaAsset = release.assets.find(asset =>
      (asset.name.includes('schema') || asset.name.includes('spec')) &&
      asset.name.endsWith('.zip')
    );

    if (!schemaAsset) {
      const assetNames = release.assets.map(a => a.name).join(', ');
      return res.status(404).json({
        error: 'Schema ZIP not found',
        message: `No schema ZIP file found in release ${tag}. Available assets: ${assetNames || 'none'}`
      });
    }

    console.log(`Downloading asset: ${schemaAsset.name} (${schemaAsset.size} bytes)`);

    // Download the ZIP file
    const assetResponse = await fetch(schemaAsset.browser_download_url, {
      headers: {
        'User-Agent': 'documentation-robotics-viewer'
      }
    });

    if (!assetResponse.ok) {
      throw new Error(`Failed to download asset: ${assetResponse.statusText}`);
    }

    // Get the ZIP data as array buffer
    const arrayBuffer = await assetResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Send the ZIP file to the client
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${schemaAsset.name}"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);

    console.log(`Successfully proxied ${schemaAsset.name}`);
  } catch (error) {
    console.error('Error downloading schemas:', error);
    res.status(500).json({
      error: 'Failed to download schemas',
      message: error.message
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`\n🚀 Documentation Robotics API Server`);
  console.log(`   Server running on: http://localhost:${PORT}`);
  console.log(`   CORS enabled for: All localhost ports\n`);
  console.log('📡 API Endpoints:');
  console.log(`   GET  /health                       - Health check`);
  console.log(`   GET  /api/example-implementation   - Get example YAML model`);
  console.log(`   GET  /api/github/releases          - Get all spec releases`);
  console.log(`   GET  /api/github/releases/latest   - Get latest spec release`);
  console.log(`   GET  /api/github/releases/:tag     - Get specific release`);
  console.log(`   GET  /api/github/download/:tag     - Download schema ZIP\n`);
});
