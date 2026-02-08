#!/usr/bin/env node

/**
 * Port Availability Checker
 *
 * Checks if a specified port is available before attempting to start a server.
 * Useful for early detection of port conflicts.
 *
 * Usage:
 *   node scripts/check-port.cjs 61000
 *   node scripts/check-port.cjs 61000 "Ladle catalog server"
 *
 * Exit codes:
 *   0 = Port is available
 *   1 = Port is already in use
 *   2 = Invalid arguments
 */

const net = require('net');

const PORT = parseInt(process.argv[2], 10);
const SERVICE_NAME = process.argv[3] || 'Server';

// Validate port argument
if (isNaN(PORT) || PORT < 1 || PORT > 65535) {
  console.error('Usage: node scripts/check-port.cjs <port> [service-name]');
  console.error('  port: Integer between 1 and 65535');
  console.error('  service-name: Optional description of the service (for error messages)');
  process.exit(2);
}

/**
 * Checks if a port is available
 * @param {number} port - Port number to check
 * @returns {Promise<boolean>} true if port is available, false if in use
 */
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false); // Port is in use
      } else {
        resolve(false); // Some other error
      }
    });

    server.once('listening', () => {
      server.close();
      resolve(true); // Port is available
    });

    server.listen(port, '127.0.0.1');
  });
}

/**
 * Attempts to find process using a port (Linux/macOS only)
 * @param {number} port - Port number
 * @returns {Promise<string|null>} Process info or null if not found
 */
function getProcessUsingPort(port) {
  return new Promise((resolve) => {
    const { execSync } = require('child_process');
    try {
      let result;
      if (process.platform === 'darwin') {
        // macOS
        result = execSync(`lsof -i :${port} 2>/dev/null || true`, {
          encoding: 'utf8',
          stdio: 'pipe',
        });
      } else if (process.platform === 'linux') {
        // Linux
        result = execSync(`ss -lptn 2>/dev/null | grep :${port} || true`, {
          encoding: 'utf8',
          stdio: 'pipe',
        });
      } else {
        resolve(null);
        return;
      }

      if (result.trim()) {
        resolve(result.trim());
      } else {
        resolve(null);
      }
    } catch {
      resolve(null);
    }
  });
}

/**
 * Main execution
 */
async function main() {
  process.stdout.write(`Checking if port ${PORT} is available for ${SERVICE_NAME}... `);

  const available = await isPortAvailable(PORT);

  if (available) {
    console.log('✓ Available');
    process.exit(0);
  } else {
    console.log('✗ In use');
    console.error(`\n❌ Error: Port ${PORT} is already in use.`);
    console.error(`\n${SERVICE_NAME} requires port ${PORT} but it's currently bound to another process.\n`);

    // Try to find what's using the port
    const processInfo = await getProcessUsingPort(PORT);
    if (processInfo) {
      console.error('Process using this port:');
      console.error(processInfo);
      console.error('');
    }

    // Provide helpful suggestions
    console.error('Solutions:');
    console.error(`  1. Wait for the existing service to stop`);
    console.error(`  2. Kill the process using port ${PORT}:`);

    if (process.platform === 'darwin') {
      console.error(`     lsof -ti:${PORT} | xargs kill -9`);
    } else if (process.platform === 'linux') {
      console.error(`     fuser -k ${PORT}/tcp`);
    } else {
      console.error(`     # Use your OS tools to kill the process on port ${PORT}`);
    }

    console.error(`  3. Use a different port by setting environment variables\n`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(`\n❌ Unexpected error: ${error.message}\n`);
  process.exit(2);
});
