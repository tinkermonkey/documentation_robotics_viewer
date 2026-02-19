# DR CLI Troubleshooting Guide

**Quick Reference for Common Issues and Solutions**

This guide provides solutions for common problems when using the Documentation Robotics Viewer with DR CLI.

---

## Quick Diagnosis

Run these commands to check system health:

```bash
# 1. Check Node.js version
node --version  # Should be v18 or higher

# 2. Check DR CLI is installed
dr --version    # Should be 0.7.0 or higher

# 3. Check if server is running
curl http://localhost:3000/health

# 4. Check if viewer can connect
curl http://localhost:3001/

# 5. Check for port conflicts
lsof -i :3000
lsof -i :3001
```

---

## Common Issues

### 1. Server Not Starting

**Error:** `Cannot find dr command` or `dr: command not found`

**Solution:**
```bash
# Install DR CLI globally
npm install -g documentation-robotics-cli

# Verify installation
dr --version

# If still not found, check PATH
echo $PATH
```

---

**Error:** `Port 3000 already in use`

**Solution:**
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process (replace 12345 with PID)
kill -9 12345

# Or use a different port (check DR CLI docs)
dr visualize --port 3001 ./my-model
```

---

**Error:** `EACCES: permission denied, open 'model.yaml'`

**Solution:**
```bash
# Check file permissions
ls -la my-model/manifest.yaml

# Fix permissions if needed
chmod 644 my-model/manifest.yaml

# Or run server with elevated privileges
sudo dr visualize ./my-model
```

---

### 2. Connection Issues

**Error:** Viewer shows "Disconnected from server"

**Solution:**
```bash
# 1. Verify server is running
curl http://localhost:3000/health
# Should return: {"status": "healthy"}

# 2. Check network connectivity
ping localhost

# 3. Restart server (close and reopen terminal)
dr visualize ./my-model

# 4. Try with explicit hostname
dr visualize --host 127.0.0.1 ./my-model
```

---

**Error:** `net::ERR_FAILED` or `ERR_CONNECTION_REFUSED`

**Solution:**
```bash
# 1. Check if DR CLI server is running
ps aux | grep "dr visualize"

# 2. Start server if not running
dr visualize ./my-model

# 3. Check firewall settings (if applicable)
# Windows: Check Windows Defender Firewall
# Mac: System Preferences → Security & Privacy
# Linux: sudo ufw allow 3000

# 4. Try localhost instead of 127.0.0.1
# Edit vite.config.ts or environment variable
export DR_CLI_URL=http://localhost:3000
```

---

### 3. WebSocket Issues

**Error:** `WebSocket connection failed` or `ws:// connection failed`

**Solution:**
```bash
# 1. Verify WebSocket endpoint is accessible
curl -i -N \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  http://localhost:3000/ws

# 2. Check browser DevTools
# - Open F12 → Network tab
# - Filter by "ws" (WebSocket)
# - Look for failed connections
# - Check response headers for CORS issues

# 3. Clear browser cache
# - Open DevTools → Application tab
# - Click "Clear site data"
# - Reload page

# 4. Disable browser extensions
# - Try in incognito/private mode
# - Disable ad blockers, proxy extensions

# 5. Check if server supports WebSocket
curl -v http://localhost:3000/health
# Should show "200 OK"
```

---

**Error:** Recurring WebSocket disconnections

**Solution:**
```bash
# 1. Check server logs for errors
# (Look at terminal where you ran "dr visualize")
# Watch for repeated connection attempts

# 2. Increase timeout settings
# In src/apps/embedded/services/websocketClient.ts
export const WS_RECONNECT_MAX_DELAY = 30000; // Increase if needed

# 3. Reduce model size if very large
# Split large models into smaller layers
# or filter layers in viewer

# 4. Monitor network stability
# On Linux: watch -n 1 'netstat -an | grep 3000'
# On Mac: while true; do netstat -an | grep 3000; sleep 1; done
```

---

### 4. Model Loading Issues

**Error:** `Failed to load model` or `Model undefined`

**Solution:**
```bash
# 1. Verify model files exist
ls -la my-model/manifest.yaml
ls -la my-model/model/

# 2. Check manifest file structure
cat my-model/manifest.yaml
# Should contain: version, schema, layers

# 3. Validate YAML syntax
# (Use online YAML validator or)
python -m yaml my-model/manifest.yaml  # If Python available

# 4. Check server logs for parse errors
# Terminal where you ran "dr visualize" should show:
# - "Loading model from..."
# - "Model loaded successfully"
# - Or detailed error message

# 5. Try with example model
dr visualize ./example-implementation/
# If this works, issue is with your model
```

---

**Error:** `Some layers not rendering` or `Empty graph`

**Solution:**
```bash
# 1. Check which layers are enabled in manifest.yaml
cat my-model/manifest.yaml | grep -A5 "layers:"

# 2. Verify layer directories exist
ls -la my-model/model/01_motivation/
ls -la my-model/model/02_business/

# 3. Check if layers are filtered in viewer
# Open DevTools → Console
localStorage.getItem('visibleLayers')
// Should show enabled layers

# 4. Verify elements exist in layer files
cat my-model/model/02_business/functions.yaml
# Should have content, not empty

# 5. Check for required fields
# Each element needs: id, type, label (minimum)
```

---

**Error:** `Invalid schema` or `Schema version mismatch`

**Solution:**
```bash
# 1. Check schema version in manifest
cat my-model/manifest.yaml | grep schema
# Should be: schema: documentation-robotics-v1

# 2. Verify specification matches
cat my-model/manifest.yaml | grep version
# Should be >= 0.1.0

# 3. Update older models
# Migrate to current format:
# - Update manifest.yaml version field
# - Rename schema if using old name
# - Run: dr validate ./my-model

# 4. Check DR CLI supports model version
dr visualize --version
# Should be 0.7.0 or higher
```

---

### 5. Authentication Issues

**Error:** `401 Unauthorized` or `Invalid credentials`

**Solution:**
```bash
# 1. Verify authentication is required
# Check server startup message or docs

# 2. Generate new token
./scripts/capture-auth-token.sh
# Save token securely

# 3. Include token in requests
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/model

# 4. Check token format
echo "YOUR_TOKEN" | jq '.'  # Should decode as JWT

# 5. Check token expiration
# Most tokens expire in 1-24 hours
# If old token, regenerate new one
```

---

**Error:** `Cannot find auth token` or `Token not stored`

**Solution:**
```bash
# 1. Manual token entry
# In browser DevTools → Console:
localStorage.setItem('auth_token', 'YOUR_TOKEN');
location.reload();

# 2. Set via environment variable
export DR_CLI_AUTH_TOKEN="YOUR_TOKEN"
npm run dev:embedded

# 3. For development (disable auth)
dr visualize --no-auth ./my-model
```

---

### 6. Performance Issues

**Error:** Graph rendering is slow or freezes

**Solution:**
```bash
# 1. Reduce number of visible layers
# In viewer UI: Uncheck layers you don't need

# 2. Filter to specific elements
# Use search/filter panel to reduce visible nodes

# 3. Try different layout algorithm
# Settings → Layout → Try: ELK, D3Force, Graphviz

# 4. Split large model into smaller ones
# Create separate models for different domains
# Run multiple viewers if needed

# 5. Monitor system resources
# Windows: Task Manager → Performance
# Mac: Activity Monitor
# Linux: top, htop
```

---

**Error:** `WebSocket messages flooding` or `High CPU usage`

**Solution:**
```bash
# 1. Check if model is too large
# Count nodes: grep -r "^  - id:" my-model/model/ | wc -l

# 2. Disable real-time updates temporarily
# In code: comment out WebSocket listeners

# 3. Reduce update frequency
# Edit update interval in websocketClient.ts
# Default: process messages as received

# 4. Monitor network traffic
# Browser DevTools → Network tab
# Filter by "ws" to see message frequency
```

---

### 7. Browser-Specific Issues

**Chrome/Chromium Issues**

```bash
# Mixed content error (HTTP + HTTPS)
# Solution: Use consistent protocol
export DR_CLI_URL=http://localhost:3000  # All HTTP

# ServiceWorker conflicts
# Solution: Clear cache
# DevTools → Application → Clear storage
```

**Firefox Issues**

```bash
# WebSocket origin check
# Solution: Check CORS headers
curl -v http://localhost:3000/health

# Memory usage high
# Solution: Reduce layer count or model size
```

**Safari Issues**

```bash
# WebSocket not connecting
# Solution: Check port forwarding if remote
# Make sure port 3000 is accessible

# Local storage quota exceeded
# Solution: Clear storage
# Preferences → Privacy → Manage Website Data
```

---

### 8. Testing Issues

**Error:** `npm run test:e2e` fails

**Solution:**
```bash
# 1. Ensure DR CLI server is running in separate terminal
dr visualize ./example-implementation/

# 2. Verify server is healthy
curl http://localhost:3000/health

# 3. Check test config uses correct URL
# playwright.e2e.config.ts should reference port 3000

# 4. Run single test file for debugging
npm run test:e2e -- tests/embedded-basic.spec.ts

# 5. Run with headed browser (visual debugging)
npm run test:e2e:headed

# 6. Check test logs
cat test-results/test-results.xml
```

---

**Error:** Tests timeout

**Solution:**
```bash
# 1. Increase timeout in playwright.e2e.config.ts
timeout: 60000,  // Increase from default

# 2. Check server response time
# Is DR CLI server slow?
time curl http://localhost:3000/api/model

# 3. Run tests serially (not in parallel)
# In config: workers: 1

# 4. Add debug logging
npm run test:e2e -- --debug

# 5. Check system resources
# Running out of memory or CPU?
```

---

## Advanced Debugging

### Enable Debug Logging

```typescript
// In browser console
localStorage.setItem('debug', 'dr:*');
localStorage.setItem('debug', 'ws:*');  // WebSocket debugging
location.reload();

// View logs
console.log(sessionStorage.getItem('dr_events'));
```

### Monitor Network Traffic

```bash
# Using curl (verbose)
curl -v http://localhost:3000/api/model

# Using tcpdump (Linux/Mac)
sudo tcpdump -i lo0 -n 'tcp port 3000'  # Mac
sudo tcpdump -i lo -n 'tcp port 3000'   # Linux

# Using Wireshark (GUI)
# Filter: tcp.port == 3000
```

### Check Server Logs

```bash
# Terminal where you ran "dr visualize"
# Should show:
# - Startup messages
# - Model loading progress
# - Connection attempts
# - File change notifications
# - Error messages

# Export logs to file for analysis
dr visualize ./my-model 2>&1 | tee server.log
```

### Browser DevTools

```javascript
// In browser console:

// Check WebSocket status
const ws = window.ws;
console.log('Connected:', ws?.readyState === 1);

// View stored tokens
console.log('Auth token:', localStorage.getItem('auth_token'));

// Check React state
console.log('Model store:', window.__ZUSTAND_DEBUG__?.modelStore);

// Monitor events
window.addEventListener('message', (e) => {
  console.log('Message:', e);
});
```

---

## Getting Help

If none of these solutions work:

1. **Check GitHub Issues**: https://github.com/tinkermonkey/documentation_robotics/issues
2. **Review Logs**: Share server logs (redact sensitive data)
3. **System Info**:
   ```bash
   node --version
   dr --version
   npm --version
   uname -a
   ```
4. **Error Logs**: Check browser console (F12) and copy full error messages
5. **Model Sample**: If possible, share minimal model that reproduces issue

---

## Useful Commands Reference

```bash
# Server management
dr visualize ./my-model              # Start server
dr --version                         # Check version
dr validate ./my-model               # Validate model

# Network diagnostics
curl http://localhost:3000/health    # Health check
curl http://localhost:3000/api/model # Get model
netstat -an | grep 3000             # Check port usage

# Viewer management
npm run dev:embedded                 # Start development
npm run build                        # Build for production
npm test                            # Run unit tests
npm run test:e2e                    # Run E2E tests

# Debugging
npm run storybook:dev               # Start component catalog
npm run test:e2e:headed             # E2E with visible browser
npm run test:storybook:a11y         # Accessibility tests
```

---

**Last Updated:** February 2026

See also: [DR CLI Integration Guide](./DR_CLI_INTEGRATION_GUIDE.md) | [README](../README.md) | [Testing Guide](../tests/README.md)
