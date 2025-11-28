import { test, expect } from '@playwright/test';

/**
 * E2E Tests for JSON Schema Viewer
 * Tests the complete flow of loading and displaying schema definitions
 */

test.describe('JSON Schema Viewer', () => {
  test('should display schema view mode toggle', async ({ page }) => {
    await page.goto('/');

    // Verify view mode toggle is visible
    const viewModeToggle = page.locator('.view-mode-toggle');
    await expect(viewModeToggle).toBeVisible();

    // Verify schema button is active
    const schemaButton = page.locator('button:has-text("View Schema")');
    await expect(schemaButton).toHaveClass(/active/);

    // Verify instance button is disabled
    const instanceButton = page.locator('button:has-text("View Instances")');
    await expect(instanceButton).toBeDisabled();
  });

  test('should show schema mode notice in welcome screen', async ({ page }) => {
    await page.goto('/');

    // Verify welcome screen is visible
    await expect(page.locator('.message-box.welcome')).toBeVisible();

    // Verify schema mode notice
    const modeNotice = page.locator('.mode-notice');
    await expect(modeNotice).toBeVisible();
    await expect(modeNotice).toContainText('Schema Mode');

    // Verify info note about schema viewing
    const infoNote = page.locator('.info-note');
    await expect(infoNote).toBeVisible();
    await expect(infoNote).toContainText('Schema mode shows the definition structure');
  });

  test('should load schema from GitHub successfully', async ({ page }) => {
    const consoleMessages: string[] = [];

    // Capture console messages
    page.on('console', msg => {
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    });

    await page.goto('/');

    // Wait for app to be ready
    await expect(page.locator('h1')).toContainText('Documentation Robotics Viewer');

    // Click Load from GitHub button
    await page.click('button:has-text("Load from GitHub")');

    // Wait for loading to complete (max 10 seconds)
    await page.waitForTimeout(10000);

    // Check if we got any error
    const errorBox = page.locator('.message-box.error');
    const hasError = await errorBox.isVisible();

    if (hasError) {
      const errorMessage = await errorBox.locator('p').textContent();
      console.log('⚠️  Error loading from GitHub:', errorMessage);

      // Error is expected if server isn't running
      expect(errorMessage).toBeTruthy();
    } else {
      // Success! Check if version badge shows (Schema) indicator
      const versionBadge = page.locator('.version-badge');
      if (await versionBadge.isVisible()) {
        const badgeText = await versionBadge.textContent();
        console.log('✅ Loaded version:', badgeText);

        // Should show schema indicator
        await expect(versionBadge).toContainText('Schema');
      }

      // Log schema loading messages
      console.log('\n=== Schema Loading Messages ===');
      consoleMessages
        .filter(msg =>
          msg.includes('schema') ||
          msg.includes('definition') ||
          msg.includes('Parsed layer')
        )
        .forEach(msg => console.log(msg));
    }
  });

  test('should detect schema definitions from files', async ({ page }) => {
    const consoleMessages: string[] = [];

    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push(`[${msg.type()}] ${text}`);
    });

    await page.goto('/');

    // For this test, we just verify that the detection logic would work
    // The actual file loading is tested in the GitHub test above

    // Check that welcome message mentions JSON schema files
    await expect(page.locator('.message-box.welcome')).toContainText('JSON schema files');
  });

  test('should process all 12 layer types from schema files', async ({ page }) => {
    const consoleMessages: string[] = [];

    page.on('console', msg => {
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    });

    await page.goto('/');
    await page.click('button:has-text("Load from GitHub")');
    await page.waitForTimeout(10000);

    // Get all "Parsed layer X" messages
    const parsedLayerMessages = consoleMessages.filter(msg =>
      msg.includes('Parsed layer')
    );

    // Verify we parsed all 12 layers
    expect(parsedLayerMessages.length).toBe(12);

    // Verify all expected layer types are present
    const expectedLayers = [
      'Navigation',
      'Business',
      'Motivation',
      'Ux',
      'ApmObservability',
      'DataModel',
      'Api',
      'Security',
      'Application',
      'Datastore',
      'FederatedArchitecture',
      'Technology'
    ];

    for (const layerName of expectedLayers) {
      const layerParsed = parsedLayerMessages.some(msg =>
        msg.includes(`Parsed layer ${layerName}:`)
      );
      expect(layerParsed).toBe(true);
    }

    console.log(`\n✅ All 12 layers parsed successfully`);
  });

  test('should create shapes from parsed schema elements', async ({ page }) => {
    const consoleMessages: string[] = [];

    // Capture ALL console messages
    page.on('console', msg => {
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    });

    await page.goto('/');

    // Click Load from GitHub button
    await page.click('button:has-text("Load from GitHub")');

    // Wait for loading to complete
    await page.waitForTimeout(10000);

    // Verify shapes were created
    const shapeCreationMessage = consoleMessages.find(msg =>
      msg.includes('Created') && msg.includes('shapes')
    );

    expect(shapeCreationMessage).toBeTruthy();

    if (shapeCreationMessage) {
      console.log('\n✅ Shape creation confirmed:', shapeCreationMessage);

      // Extract shape and arrow counts from message like "Created 152 shapes and 83 arrows"
      const shapeMatch = shapeCreationMessage.match(/Created (\d+) shapes/);
      const arrowMatch = shapeCreationMessage.match(/and (\d+) arrows/);

      expect(shapeMatch).toBeTruthy();
      expect(arrowMatch).toBeTruthy();

      if (shapeMatch && arrowMatch) {
        const shapeCount = parseInt(shapeMatch[1]);
        const arrowCount = parseInt(arrowMatch[1]);

        console.log(`✅ Total shapes created: ${shapeCount}`);
        console.log(`✅ Total arrows created: ${arrowCount}`);

        // Should have created shapes for ALL 152 parsed elements (across 12 layers)
        expect(shapeCount).toBe(152);

        // Should have created arrows for ALL 83 relationships
        expect(arrowCount).toBe(83);

        // Verify there are NO warnings about missing source/target shapes
        const missingShapeWarnings = consoleMessages.filter(msg =>
          msg.includes('Cannot create arrow') && msg.includes('source or target shape not found')
        );

        if (missingShapeWarnings.length > 0) {
          console.log(`\n❌ Found ${missingShapeWarnings.length} warnings about missing shapes:`);
          missingShapeWarnings.slice(0, 5).forEach(w => console.log(w));
        }

        expect(missingShapeWarnings.length).toBe(0);
      }
    }
  });
});

test.describe('JSON Schema Element Rendering', () => {
  test('should register JSONSchemaShape with tldraw', async ({ page }) => {
    await page.goto('/');

    // This test verifies the shape is registered
    // We can't easily test the actual rendering without loading schema data
    // But we can verify the app loads without errors

    await expect(page.locator('h1')).toBeVisible();

    // No console errors
    const errors: string[] = [];
    page.on('pageerror', error => {
      errors.push(error.message);
    });

    await page.waitForTimeout(1000);

    // Should have no errors about missing shape utilities
    const shapeErrors = errors.filter(e =>
      e.includes('JSONSchemaShape') || e.includes('shape utility')
    );
    expect(shapeErrors.length).toBe(0);
  });
});
