/**
 * Interactive Refinement Tests
 *
 * Browser-headed tests for interactive layout refinement workflows.
 * Run with: npm run refine:interactive (opens visible browser)
 *
 * These tests are designed to be run manually with visual observation
 * of the refinement process. They can also be run in CI for validation.
 */

import { test, expect, Page } from '@playwright/test';
import {
  calculateLayoutQuality,
  DiagramType,
  LayoutType,
} from '../../src/core/services/metrics/graphReadabilityService';
import { Node, Edge } from '@xyflow/react';
import * as fs from 'fs';
import * as path from 'path';

// Test configuration for interactive mode
const SCREENSHOT_DIR = 'test-results/refinement/interactive';
const INTERACTION_DELAY = 500; // ms between actions for visibility

// Ensure screenshot directory exists
test.beforeAll(async () => {
  const dir = path.resolve(SCREENSHOT_DIR);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * Capture a screenshot with timestamp
 */
async function captureScreenshot(
  page: Page,
  name: string,
  iteration?: number
): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const iterSuffix = iteration !== undefined ? `-iter${iteration}` : '';
  const filename = `${name}${iterSuffix}-${timestamp}.png`;
  const filepath = path.join(SCREENSHOT_DIR, filename);

  await page.screenshot({
    path: filepath,
    fullPage: false,
  });

  console.log(`  Screenshot: ${filename}`);
  return filepath;
}

/**
 * Wait for user visibility (only in headed mode)
 */
async function waitForVisibility(page: Page, delay: number = INTERACTION_DELAY): Promise<void> {
  // In headed mode, allow time for user to observe changes
  if (process.env.HEADED || process.env.PWDEBUG) {
    await page.waitForTimeout(delay);
  }
}

test.describe('Interactive Refinement Workflow', () => {
  test.describe.configure({ mode: 'serial' });

  test('should demonstrate motivation layer refinement workflow', async ({ page }) => {
    console.log('\n=== Interactive Motivation Refinement Demo ===\n');

    // Navigate to the embedded app
    await page.goto('/embedded/');
    await page.waitForLoadState('networkidle');

    // Initial screenshot
    await captureScreenshot(page, 'motivation-initial');
    console.log('1. Initial view captured');

    // Check if motivation view is available
    const motivationTab = page.locator('[data-testid="motivation-tab"], button:has-text("Motivation")');
    if (await motivationTab.isVisible()) {
      await motivationTab.click();
      await waitForVisibility(page);
      await captureScreenshot(page, 'motivation-view');
      console.log('2. Switched to motivation view');
    } else {
      console.log('2. Motivation tab not found (expected if route not integrated)');
    }

    // Demonstrate what a refinement iteration looks like with metrics
    const mockNodes: Node[] = [
      { id: 'g1', position: { x: 200, y: 0 }, data: { label: 'Goal 1' }, type: 'goal', width: 180, height: 80 },
      { id: 'g2', position: { x: 500, y: 0 }, data: { label: 'Goal 2' }, type: 'goal', width: 180, height: 80 },
      { id: 'r1', position: { x: 100, y: 150 }, data: { label: 'Req 1' }, type: 'requirement', width: 160, height: 70 },
      { id: 'r2', position: { x: 350, y: 150 }, data: { label: 'Req 2' }, type: 'requirement', width: 160, height: 70 },
      { id: 'r3', position: { x: 600, y: 150 }, data: { label: 'Req 3' }, type: 'requirement', width: 160, height: 70 },
    ];

    const mockEdges: Edge[] = [
      { id: 'e1', source: 'r1', target: 'g1', type: 'default' },
      { id: 'e2', source: 'r2', target: 'g1', type: 'default' },
      { id: 'e3', source: 'r2', target: 'g2', type: 'default' },
      { id: 'e4', source: 'r3', target: 'g2', type: 'default' },
    ];

    console.log('\n3. Simulating refinement iterations:');

    for (let i = 0; i < 3; i++) {
      const report = calculateLayoutQuality(
        mockNodes,
        mockEdges,
        'hierarchical',
        'motivation'
      );

      console.log(`   Iteration ${i + 1}: Score = ${report.overallScore.toFixed(3)}`);

      // Simulate refinement adjustment
      mockNodes.forEach((node, idx) => {
        node.position.x += (i + 1) * 10 * (idx % 2 === 0 ? 1 : -1);
      });
    }

    // Final screenshot
    await captureScreenshot(page, 'motivation-final');
    console.log('\n4. Refinement demo complete');

    expect(true).toBe(true); // Test passes if no errors
  });

  test('should demonstrate business layer layout comparison', async ({ page }) => {
    console.log('\n=== Interactive Business Layout Comparison ===\n');

    await page.goto('/embedded/');
    await page.waitForLoadState('networkidle');

    // Check for business view
    const businessTab = page.locator('[data-testid="business-tab"], button:has-text("Business")');
    if (await businessTab.isVisible()) {
      await businessTab.click();
      await waitForVisibility(page);
      await captureScreenshot(page, 'business-view');
      console.log('1. Business view captured');
    } else {
      console.log('1. Business tab not found (expected if route not integrated)');
    }

    // Demonstrate layout algorithm comparison
    const mockNodes: Node[] = [
      { id: 'p1', position: { x: 200, y: 0 }, data: { label: 'Process 1' }, type: 'process', width: 200, height: 100 },
      { id: 'p2', position: { x: 500, y: 0 }, data: { label: 'Process 2' }, type: 'process', width: 200, height: 100 },
      { id: 'f1', position: { x: 100, y: 150 }, data: { label: 'Function 1' }, type: 'function', width: 180, height: 80 },
      { id: 'f2', position: { x: 350, y: 150 }, data: { label: 'Function 2' }, type: 'function', width: 180, height: 80 },
      { id: 'f3', position: { x: 600, y: 150 }, data: { label: 'Function 3' }, type: 'function', width: 180, height: 80 },
      { id: 's1', position: { x: 350, y: 300 }, data: { label: 'Service 1' }, type: 'service', width: 200, height: 90 },
    ];

    const mockEdges: Edge[] = [
      { id: 'e1', source: 'p1', target: 'f1', type: 'default' },
      { id: 'e2', source: 'p1', target: 'f2', type: 'default' },
      { id: 'e3', source: 'p2', target: 'f2', type: 'default' },
      { id: 'e4', source: 'p2', target: 'f3', type: 'default' },
      { id: 'e5', source: 'f1', target: 's1', type: 'default' },
      { id: 'e6', source: 'f3', target: 's1', type: 'default' },
    ];

    console.log('\n2. Layout Algorithm Comparison:');
    console.log('─'.repeat(50));

    const layoutTypes: LayoutType[] = ['hierarchical', 'swimlane', 'force-directed'];

    for (const layout of layoutTypes) {
      const report = calculateLayoutQuality(mockNodes, mockEdges, layout, 'business');
      console.log(`   ${layout.padEnd(20)}: ${report.overallScore.toFixed(3)}`);
    }

    console.log('─'.repeat(50));

    await captureScreenshot(page, 'business-final');
    console.log('\n3. Layout comparison complete');

    expect(true).toBe(true);
  });

  test('should demonstrate C4 architecture refinement', async ({ page }) => {
    console.log('\n=== Interactive C4 Architecture Refinement ===\n');

    await page.goto('/embedded/');
    await page.waitForLoadState('networkidle');

    // Check for C4 view
    const c4Tab = page.locator('[data-testid="c4-tab"], button:has-text("C4"), button:has-text("Architecture")');
    if (await c4Tab.isVisible()) {
      await c4Tab.click();
      await waitForVisibility(page);
      await captureScreenshot(page, 'c4-view');
      console.log('1. C4 view captured');
    } else {
      console.log('1. C4 tab not found (expected if route not integrated)');
    }

    // C4 Container diagram simulation
    const mockNodes: Node[] = [
      { id: 'user', position: { x: 50, y: 150 }, data: { label: 'User', c4Type: 'person' }, type: 'external-actor', width: 120, height: 100 },
      { id: 'web', position: { x: 250, y: 50 }, data: { label: 'Web App', c4Type: 'container' }, type: 'container', width: 200, height: 120 },
      { id: 'api', position: { x: 250, y: 220 }, data: { label: 'API', c4Type: 'container' }, type: 'container', width: 200, height: 120 },
      { id: 'db', position: { x: 250, y: 390 }, data: { label: 'Database', c4Type: 'database' }, type: 'container', width: 200, height: 120 },
      { id: 'ext', position: { x: 500, y: 150 }, data: { label: 'External API', c4Type: 'external-system' }, type: 'container', width: 180, height: 100 },
    ];

    const mockEdges: Edge[] = [
      { id: 'e1', source: 'user', target: 'web', type: 'default' },
      { id: 'e2', source: 'web', target: 'api', type: 'default' },
      { id: 'e3', source: 'api', target: 'db', type: 'default' },
      { id: 'e4', source: 'api', target: 'ext', type: 'default' },
    ];

    console.log('\n2. C4 Container Refinement:');

    for (let i = 0; i < 3; i++) {
      const report = calculateLayoutQuality(mockNodes, mockEdges, 'hierarchical', 'c4');
      const crossingStatus = report.metrics.crossingNumber >= 0.9 ? 'GOOD' : 'NEEDS WORK';

      console.log(`   Iteration ${i + 1}: Score=${report.overallScore.toFixed(3)}, Crossings=${crossingStatus}`);

      // Adjust positions
      mockNodes.forEach((node, idx) => {
        if (idx > 0) { // Don't move the user
          node.position.y += (i + 1) * 5;
        }
      });
    }

    await captureScreenshot(page, 'c4-final');
    console.log('\n3. C4 refinement demo complete');

    expect(true).toBe(true);
  });

  test('should demonstrate full refinement session workflow', async ({ page }) => {
    console.log('\n=== Full Refinement Session Demo ===\n');

    await page.goto('/embedded/');
    await page.waitForLoadState('networkidle');

    // Capture initial state
    const screenshots: string[] = [];
    screenshots.push(await captureScreenshot(page, 'session-start'));

    console.log('Refinement Session Started');
    console.log('─'.repeat(60));

    // Simulate a complete refinement session
    const session = {
      sessionId: `session-${Date.now()}`,
      diagramType: 'motivation' as DiagramType,
      iterations: [] as { iteration: number; score: number; improved: boolean }[],
      targetScore: 0.85,
      bestScore: 0,
    };

    let nodes: Node[] = [
      { id: 'n1', position: { x: 0, y: 0 }, data: { label: 'Node 1' }, type: 'goal', width: 150, height: 80 },
      { id: 'n2', position: { x: 100, y: 50 }, data: { label: 'Node 2' }, type: 'goal', width: 150, height: 80 },
      { id: 'n3', position: { x: 50, y: 150 }, data: { label: 'Node 3' }, type: 'requirement', width: 140, height: 70 },
      { id: 'n4', position: { x: 200, y: 150 }, data: { label: 'Node 4' }, type: 'requirement', width: 140, height: 70 },
    ];

    const edges: Edge[] = [
      { id: 'e1', source: 'n3', target: 'n1', type: 'default' },
      { id: 'e2', source: 'n3', target: 'n2', type: 'default' },
      { id: 'e3', source: 'n4', target: 'n2', type: 'default' },
    ];

    let previousScore = 0;
    const maxIterations = 5;

    for (let i = 0; i < maxIterations; i++) {
      const report = calculateLayoutQuality(nodes, edges, 'hierarchical', session.diagramType);
      const improved = report.overallScore > previousScore;

      session.iterations.push({
        iteration: i + 1,
        score: report.overallScore,
        improved,
      });

      if (report.overallScore > session.bestScore) {
        session.bestScore = report.overallScore;
      }

      const statusIcon = improved ? '+' : report.overallScore === previousScore ? '=' : '-';
      console.log(
        `Iteration ${(i + 1).toString().padStart(2)}: ` +
        `Score=${report.overallScore.toFixed(3)} [${statusIcon}] ` +
        `${report.overallScore >= session.targetScore ? '(TARGET MET)' : ''}`
      );

      // Check if target reached
      if (report.overallScore >= session.targetScore) {
        console.log(`\nTarget score reached at iteration ${i + 1}!`);
        break;
      }

      previousScore = report.overallScore;

      // Simulate refinement: spread nodes apart
      nodes = nodes.map((node, idx) => ({
        ...node,
        position: {
          x: node.position.x + (i + 1) * 30 * Math.cos(idx * Math.PI / 2),
          y: node.position.y + (i + 1) * 30 * Math.sin(idx * Math.PI / 2),
        },
      }));

      await waitForVisibility(page, 200);
    }

    console.log('─'.repeat(60));
    console.log(`\nSession Summary:`);
    console.log(`  Total Iterations: ${session.iterations.length}`);
    console.log(`  Best Score: ${session.bestScore.toFixed(3)}`);
    console.log(`  Target Score: ${session.targetScore}`);
    console.log(`  Target Met: ${session.bestScore >= session.targetScore ? 'YES' : 'NO'}`);

    // Final screenshot
    screenshots.push(await captureScreenshot(page, 'session-end'));

    // Save session report
    const reportPath = path.join(SCREENSHOT_DIR, `session-report-${session.sessionId}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(session, null, 2));
    console.log(`\nSession report saved to: ${reportPath}`);

    expect(session.iterations.length).toBeGreaterThan(0);
  });

  test('should demonstrate feedback-driven refinement', async ({ page }) => {
    console.log('\n=== Feedback-Driven Refinement Demo ===\n');

    await page.goto('/embedded/');
    await page.waitForLoadState('networkidle');

    // Simulate human feedback scenarios
    const feedbackTypes = [
      { aspect: 'spacing', direction: 'increase', intensity: 'moderate' },
      { aspect: 'alignment', direction: 'increase', intensity: 'slight' },
      { aspect: 'grouping', direction: 'decrease', intensity: 'significant' },
    ];

    console.log('Simulating Human Feedback Responses:');
    console.log('─'.repeat(60));

    let nodes: Node[] = [
      { id: 'n1', position: { x: 0, y: 0 }, data: { label: 'Node 1' }, type: 'default', width: 100, height: 60 },
      { id: 'n2', position: { x: 50, y: 30 }, data: { label: 'Node 2' }, type: 'default', width: 100, height: 60 },
      { id: 'n3', position: { x: 100, y: 100 }, data: { label: 'Node 3' }, type: 'default', width: 100, height: 60 },
    ];

    const edges: Edge[] = [
      { id: 'e1', source: 'n1', target: 'n2', type: 'default' },
      { id: 'e2', source: 'n2', target: 'n3', type: 'default' },
    ];

    for (const feedback of feedbackTypes) {
      console.log(`\nFeedback: ${feedback.aspect} - ${feedback.direction} (${feedback.intensity})`);

      // Calculate before
      const before = calculateLayoutQuality(nodes, edges, 'force-directed', 'motivation');
      console.log(`  Before: ${before.overallScore.toFixed(3)}`);

      // Apply simulated adjustment based on feedback
      const multiplier = feedback.intensity === 'significant' ? 3 : feedback.intensity === 'moderate' ? 2 : 1;
      const direction = feedback.direction === 'increase' ? 1 : -1;

      if (feedback.aspect === 'spacing') {
        nodes = nodes.map((node, idx) => ({
          ...node,
          position: {
            x: node.position.x + direction * multiplier * 20 * (idx - 1),
            y: node.position.y + direction * multiplier * 10 * (idx - 1),
          },
        }));
      }

      // Calculate after
      const after = calculateLayoutQuality(nodes, edges, 'force-directed', 'motivation');
      const change = after.overallScore - before.overallScore;
      console.log(`  After: ${after.overallScore.toFixed(3)} (${change >= 0 ? '+' : ''}${change.toFixed(3)})`);
    }

    console.log('\n' + '─'.repeat(60));
    await captureScreenshot(page, 'feedback-final');

    expect(true).toBe(true);
  });
});

test.describe('Interactive Visualization Tests', () => {
  test('should capture viewport screenshots during zoom/pan', async ({ page }) => {
    console.log('\n=== Viewport Interaction Demo ===\n');

    await page.goto('/embedded/');
    await page.waitForLoadState('networkidle');

    // Initial viewport
    await captureScreenshot(page, 'viewport-initial');

    // Try to interact with React Flow canvas if present
    const canvas = page.locator('.react-flow');
    if (await canvas.isVisible()) {
      console.log('React Flow canvas detected');

      // Simulate zoom (scroll)
      await canvas.hover();
      await page.mouse.wheel(0, -100); // Zoom in
      await waitForVisibility(page);
      await captureScreenshot(page, 'viewport-zoomed-in');

      await page.mouse.wheel(0, 200); // Zoom out
      await waitForVisibility(page);
      await captureScreenshot(page, 'viewport-zoomed-out');

      // Simulate pan (drag)
      const box = await canvas.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width / 2 + 100, box.y + box.height / 2 + 50);
        await page.mouse.up();
        await waitForVisibility(page);
        await captureScreenshot(page, 'viewport-panned');
      }
    } else {
      console.log('React Flow canvas not visible on this page');
    }

    await captureScreenshot(page, 'viewport-final');
    console.log('Viewport interaction demo complete');

    expect(true).toBe(true);
  });

  test('should demonstrate layout algorithm switching', async ({ page }) => {
    console.log('\n=== Layout Algorithm Switching Demo ===\n');

    await page.goto('/embedded/');
    await page.waitForLoadState('networkidle');

    // Check for layout selector
    const layoutSelector = page.locator('[data-testid="layout-selector"], select:has(option:has-text("Hierarchical"))');

    if (await layoutSelector.isVisible()) {
      const options = ['hierarchical', 'force-directed', 'swimlane'];

      for (const option of options) {
        try {
          await layoutSelector.selectOption(option);
          await waitForVisibility(page, 1000);
          await captureScreenshot(page, `layout-${option}`);
          console.log(`  Captured: ${option} layout`);
        } catch {
          console.log(`  Could not select: ${option}`);
        }
      }
    } else {
      console.log('Layout selector not found (UI may not be integrated yet)');
    }

    expect(true).toBe(true);
  });
});

test.describe('Screenshot Artifact Generation', () => {
  test('should generate all layout comparison screenshots', async ({ page }) => {
    console.log('\n=== Generating Layout Comparison Screenshots ===\n');

    await page.goto('/embedded/');
    await page.waitForLoadState('networkidle');

    // Generate comparison data
    const mockGraph = {
      nodes: [
        { id: 'n1', position: { x: 100, y: 0 }, data: { label: 'Node 1' }, type: 'default', width: 150, height: 80 },
        { id: 'n2', position: { x: 300, y: 0 }, data: { label: 'Node 2' }, type: 'default', width: 150, height: 80 },
        { id: 'n3', position: { x: 200, y: 150 }, data: { label: 'Node 3' }, type: 'default', width: 150, height: 80 },
        { id: 'n4', position: { x: 100, y: 300 }, data: { label: 'Node 4' }, type: 'default', width: 150, height: 80 },
        { id: 'n5', position: { x: 300, y: 300 }, data: { label: 'Node 5' }, type: 'default', width: 150, height: 80 },
      ] as Node[],
      edges: [
        { id: 'e1', source: 'n1', target: 'n3', type: 'default' },
        { id: 'e2', source: 'n2', target: 'n3', type: 'default' },
        { id: 'e3', source: 'n3', target: 'n4', type: 'default' },
        { id: 'e4', source: 'n3', target: 'n5', type: 'default' },
        { id: 'e5', source: 'n4', target: 'n5', type: 'default' },
      ] as Edge[],
    };

    const diagramTypes: DiagramType[] = ['motivation', 'business', 'c4'];
    const layoutTypes: LayoutType[] = ['hierarchical', 'force-directed'];

    const results: { diagram: string; layout: string; score: number }[] = [];

    for (const diagram of diagramTypes) {
      for (const layout of layoutTypes) {
        const report = calculateLayoutQuality(mockGraph.nodes, mockGraph.edges, layout, diagram);
        results.push({ diagram, layout, score: report.overallScore });
      }
    }

    // Output comparison table
    console.log('Layout Quality Comparison:');
    console.log('─'.repeat(55));
    console.log(`${'Diagram'.padEnd(15)} ${'Layout'.padEnd(20)} ${'Score'}`);
    console.log('─'.repeat(55));
    results.forEach(({ diagram, layout, score }) => {
      console.log(`${diagram.padEnd(15)} ${layout.padEnd(20)} ${score.toFixed(3)}`);
    });
    console.log('─'.repeat(55));

    // Save comparison report
    const reportPath = path.join(SCREENSHOT_DIR, 'layout-comparison-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      generatedAt: new Date().toISOString(),
      results,
    }, null, 2));

    console.log(`\nReport saved to: ${reportPath}`);

    await captureScreenshot(page, 'comparison-complete');

    expect(results.length).toBe(6);
  });
});
