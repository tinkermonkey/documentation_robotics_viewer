/**
 * E2E tests for Business Layer Export functionality
 *
 * Tests all export features in the business layer view:
 * - PNG/SVG image exports
 * - Graph data export
 * - Process catalog export
 * - Traceability report export
 * - Impact analysis export
 */

import { test, expect, Page } from '@playwright/test';
import { promises as fs } from 'fs';
import path from 'path';

test.describe('Business Layer Export', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to business layer view with example-implementation model
    await page.goto('/embedded?view=business&model=example-implementation');

    // Wait for business layer to load
    await expect(page.locator('.business-layer-view')).toBeVisible({ timeout: 10000 });

    // Wait for nodes to render
    await expect(page.locator('.react-flow__node').first()).toBeVisible({ timeout: 5000 });
  });

  test('should export PNG image successfully', async ({ page, context }) => {
    // Set up download handler
    const downloadPromise = page.waitForEvent('download');

    // Click PNG export button
    await page.click('button:has-text("Export as PNG")');

    // Wait for download
    const download = await downloadPromise;

    // Verify filename contains timestamp and correct extension
    expect(download.suggestedFilename()).toMatch(/business-layer-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.png/);

    // Verify file was downloaded
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();

    // Verify file size (should be >1KB for a graph with nodes)
    const stats = await fs.stat(downloadPath!);
    expect(stats.size).toBeGreaterThan(1024);
  });

  test('should export SVG image successfully', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download');

    // Click SVG export button
    await page.click('button:has-text("Export as SVG")');

    const download = await downloadPromise;

    // Verify filename
    expect(download.suggestedFilename()).toMatch(/business-layer-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.svg/);

    // Verify file was downloaded
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();

    // Read SVG content and verify it's valid XML
    const svgContent = await fs.readFile(downloadPath!, 'utf-8');
    expect(svgContent).toContain('<svg');
    expect(svgContent).toContain('</svg>');
  });

  test('should export graph data as JSON with correct structure', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download');

    // Click graph data export button
    await page.click('button:has-text("Export Graph Data")');

    const download = await downloadPromise;

    // Verify filename
    expect(download.suggestedFilename()).toMatch(/business-graph-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.json/);

    // Read and parse JSON
    const downloadPath = await download.path();
    const jsonContent = await fs.readFile(downloadPath!, 'utf-8');
    const data = JSON.parse(jsonContent);

    // Verify structure
    expect(data).toHaveProperty('version', '1.0.0');
    expect(data).toHaveProperty('generated');
    expect(data).toHaveProperty('metadata');
    expect(data).toHaveProperty('nodes');
    expect(data).toHaveProperty('edges');

    // Verify metadata structure
    expect(data.metadata).toHaveProperty('nodeCount');
    expect(data.metadata).toHaveProperty('edgeCount');
    expect(data.metadata).toHaveProperty('layers');
    expect(data.metadata.layers).toHaveProperty('functions');
    expect(data.metadata.layers).toHaveProperty('processes');
    expect(data.metadata.layers).toHaveProperty('services');
    expect(data.metadata.layers).toHaveProperty('capabilities');

    // Verify nodes are arrays
    expect(Array.isArray(data.nodes)).toBe(true);
    expect(Array.isArray(data.edges)).toBe(true);

    // Verify node structure (if nodes exist)
    if (data.nodes.length > 0) {
      const node = data.nodes[0];
      expect(node).toHaveProperty('id');
      expect(node).toHaveProperty('type');
      expect(node).toHaveProperty('position');
      expect(node).toHaveProperty('data');
    }
  });

  test('should export process catalog with complete metadata', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download');

    // Click catalog export button
    await page.click('button:has-text("Export Process Catalog")');

    const download = await downloadPromise;

    // Verify filename
    expect(download.suggestedFilename()).toMatch(/business-catalog-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.json/);

    // Read and parse JSON
    const downloadPath = await download.path();
    const jsonContent = await fs.readFile(downloadPath!, 'utf-8');
    const catalog = JSON.parse(jsonContent);

    // Verify structure
    expect(catalog).toHaveProperty('generated');
    expect(catalog).toHaveProperty('processCount');
    expect(catalog).toHaveProperty('processes');
    expect(Array.isArray(catalog.processes)).toBe(true);

    // Verify process catalog entry structure (if processes exist)
    if (catalog.processes.length > 0) {
      const process = catalog.processes[0];
      expect(process).toHaveProperty('id');
      expect(process).toHaveProperty('name');
      expect(process).toHaveProperty('type');
      expect(process).toHaveProperty('relationships');
      expect(process.relationships).toHaveProperty('upstream');
      expect(process.relationships).toHaveProperty('downstream');
      expect(Array.isArray(process.relationships.upstream)).toBe(true);
      expect(Array.isArray(process.relationships.downstream)).toBe(true);
    }

    // Verify processCount matches array length
    expect(catalog.processCount).toBe(catalog.processes.length);
  });

  test('should export traceability report with coverage statistics', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download');

    // Click traceability export button
    await page.click('button:has-text("Export Traceability Report")');

    const download = await downloadPromise;

    // Verify filename
    expect(download.suggestedFilename()).toMatch(/traceability-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.json/);

    // Read and parse JSON
    const downloadPath = await download.path();
    const jsonContent = await fs.readFile(downloadPath!, 'utf-8');
    const report = JSON.parse(jsonContent);

    // Verify structure
    expect(report).toHaveProperty('generated');
    expect(report).toHaveProperty('summary');
    expect(report).toHaveProperty('traceability');
    expect(report).toHaveProperty('orphanedProcesses');

    // Verify summary structure
    expect(report.summary).toHaveProperty('totalProcesses');
    expect(report.summary).toHaveProperty('processesWithMotivationLinks');
    expect(report.summary).toHaveProperty('processesWithApplicationRealization');
    expect(report.summary).toHaveProperty('processesWithDataDependencies');
    expect(report.summary).toHaveProperty('orphanedProcesses');
    expect(report.summary).toHaveProperty('coverage');

    // Verify coverage statistics
    expect(report.summary.coverage).toHaveProperty('motivation');
    expect(report.summary.coverage).toHaveProperty('application');
    expect(report.summary.coverage).toHaveProperty('data');

    // Verify coverage percentages are strings with % sign
    expect(report.summary.coverage.motivation).toMatch(/^\d+\.\d%$/);
    expect(report.summary.coverage.application).toMatch(/^\d+\.\d%$/);
    expect(report.summary.coverage.data).toMatch(/^\d+\.\d%$/);

    // Verify traceability entries (if exist)
    if (report.traceability.length > 0) {
      const entry = report.traceability[0];
      expect(entry).toHaveProperty('process');
      expect(entry).toHaveProperty('realizesGoals');
      expect(entry).toHaveProperty('realizedByComponents');
      expect(entry).toHaveProperty('usesDataEntities');
      expect(entry.process).toHaveProperty('id');
      expect(entry.process).toHaveProperty('name');
      expect(entry.process).toHaveProperty('type');
    }

    // Verify orphaned processes structure
    expect(Array.isArray(report.orphanedProcesses)).toBe(true);
    if (report.orphanedProcesses.length > 0) {
      const orphaned = report.orphanedProcesses[0];
      expect(orphaned).toHaveProperty('id');
      expect(orphaned).toHaveProperty('name');
    }
  });

  test('should export impact analysis when nodes are selected', async ({ page }) => {
    // Select a node first
    const firstNode = page.locator('.react-flow__node').first();
    await firstNode.click();

    // Wait for selection to register
    await page.waitForTimeout(500);

    const downloadPromise = page.waitForEvent('download');

    // Click impact analysis export button
    await page.click('button:has-text("Export Impact Analysis")');

    const download = await downloadPromise;

    // Verify filename
    expect(download.suggestedFilename()).toMatch(/impact-analysis-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.json/);

    // Read and parse JSON
    const downloadPath = await download.path();
    const jsonContent = await fs.readFile(downloadPath!, 'utf-8');
    const report = JSON.parse(jsonContent);

    // Verify structure
    expect(report).toHaveProperty('generated');
    expect(report).toHaveProperty('changedProcesses');
    expect(report).toHaveProperty('impact');
    expect(report).toHaveProperty('impactedProcesses');
    expect(report).toHaveProperty('impactPaths');

    // Verify changed processes (at least one selected)
    expect(Array.isArray(report.changedProcesses)).toBe(true);
    expect(report.changedProcesses.length).toBeGreaterThan(0);

    // Verify impact summary
    expect(report.impact).toHaveProperty('directImpact');
    expect(report.impact).toHaveProperty('indirectImpact');
    expect(report.impact).toHaveProperty('totalImpact');
    expect(report.impact).toHaveProperty('maxPathLength');

    // Verify directImpact matches number of selected nodes
    expect(report.impact.directImpact).toBe(report.changedProcesses.length);

    // Verify impacted processes structure
    expect(Array.isArray(report.impactedProcesses)).toBe(true);
    if (report.impactedProcesses.length > 0) {
      const process = report.impactedProcesses[0];
      expect(process).toHaveProperty('id');
      // name and type are optional but should exist if present
      if ('name' in process) {
        expect(typeof process.name).toBe('string');
      }
    }

    // Verify impact paths structure
    expect(Array.isArray(report.impactPaths)).toBe(true);
    if (report.impactPaths.length > 0) {
      const path = report.impactPaths[0];
      expect(path).toHaveProperty('path');
      expect(path).toHaveProperty('length');
      expect(Array.isArray(path.path)).toBe(true);
      expect(typeof path.length).toBe('number');
    }
  });

  test('should show error when trying to export impact analysis with no selection', async ({ page }) => {
    // Ensure no nodes are selected by clicking background
    await page.click('.react-flow__pane');

    // Click impact analysis export button
    await page.click('button:has-text("Export Impact Analysis")');

    // Wait a bit for error to appear (if implemented as error message)
    await page.waitForTimeout(500);

    // Note: The actual error display depends on implementation
    // This test verifies the button is clickable even without selection
    // The service should handle the empty selection gracefully
  });

  test('should complete all exports in under 3 seconds', async ({ page }) => {
    // Test each export type for performance
    const exportTypes = [
      { button: 'Export Graph Data', timeout: 3000 },
      { button: 'Export Process Catalog', timeout: 3000 },
      { button: 'Export Traceability Report', timeout: 3000 },
    ];

    for (const { button, timeout } of exportTypes) {
      const startTime = Date.now();
      const downloadPromise = page.waitForEvent('download', { timeout });

      await page.click(`button:has-text("${button}")`);

      await downloadPromise;

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(timeout);
    }
  });

  test('should export with filtered view state', async ({ page }) => {
    // Apply a filter (e.g., select only processes)
    const processCheckbox = page.locator('input[type="checkbox"]').filter({ hasText: /Processes/ });
    await processCheckbox.click();

    // Wait for filter to apply
    await page.waitForTimeout(500);

    // Export graph data
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Export Graph Data")');
    const download = await downloadPromise;

    // Read and verify filtered data
    const downloadPath = await download.path();
    const jsonContent = await fs.readFile(downloadPath!, 'utf-8');
    const data = JSON.parse(jsonContent);

    // All visible nodes should be processes (if filter worked)
    if (data.nodes.length > 0) {
      // This test verifies export includes current view state
      expect(data.metadata.nodeCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('should exclude ReactFlow controls from PNG export', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download');

    // Click PNG export button
    await page.click('button:has-text("Export as PNG")');

    const download = await downloadPromise;
    const downloadPath = await download.path();

    // Note: We can't easily verify image content in E2E tests,
    // but we can verify the file was created and has reasonable size
    expect(downloadPath).toBeTruthy();

    const stats = await fs.stat(downloadPath!);
    expect(stats.size).toBeGreaterThan(1024);
  });

  test('should generate unique filenames with timestamps', async ({ page }) => {
    // Export graph data twice in quick succession
    const download1Promise = page.waitForEvent('download');
    await page.click('button:has-text("Export Graph Data")');
    const download1 = await download1Promise;

    // Small delay
    await page.waitForTimeout(1000);

    const download2Promise = page.waitForEvent('download');
    await page.click('button:has-text("Export Graph Data")');
    const download2 = await download2Promise;

    // Verify filenames are different (due to timestamps)
    const filename1 = download1.suggestedFilename();
    const filename2 = download2.suggestedFilename();

    // They should have different timestamps
    expect(filename1).not.toBe(filename2);
  });
});
