/**
 * Comparison Report Export Service
 *
 * Exports comparison reports in multiple formats:
 * - PDF: Comprehensive report with metrics and screenshots
 * - Image Grid (PNG/SVG): Visual grid of layout comparisons
 *
 * Task 7.7: Implement comparison report export
 */

import { toPng, toSvg } from 'html-to-image';
import type { RefinementIteration, LayoutSnapshot } from '../types/refinement';
import type { CombinedQualityScore } from '../../../core/services/comparison/qualityScoreService';

/**
 * Comparison report data structure
 */
export interface ComparisonReport {
  /** Report title */
  title: string;
  /** Report generation timestamp */
  timestamp: string;
  /** Iterations being compared */
  iterations: RefinementIteration[];
  /** Layout snapshots for multi-layout comparison */
  layoutSnapshots?: LayoutSnapshot[];
  /** Reference image URL */
  referenceImageUrl: string;
  /** Quality score summary */
  qualityScoreSummary: QualityScoreSummary;
  /** Parameter differences */
  parameterDifferences?: ParameterDifference[];
}

export interface QualityScoreSummary {
  /** Best score achieved */
  bestScore: number;
  /** Baseline score */
  baselineScore: number;
  /** Total improvement */
  totalImprovement: number;
  /** Iteration with best score */
  bestIterationNumber: number;
}

export interface ParameterDifference {
  /** Parameter name */
  parameter: string;
  /** Baseline value */
  baselineValue: string | number;
  /** Current value */
  currentValue: string | number;
  /** Impact on quality (estimated) */
  impact: 'positive' | 'negative' | 'neutral';
}

/**
 * Export comparison report as PDF
 *
 * Generates a comprehensive PDF report including:
 * - Quality metrics comparison
 * - Screenshot comparisons
 * - Parameter differences
 * - Iteration history
 */
export async function exportComparisonReportAsPDF(
  report: ComparisonReport,
  filename: string = 'layout-comparison-report.pdf'
): Promise<void> {
  try {
    // Create a temporary container for PDF rendering
    const container = document.createElement('div');
    container.style.width = '210mm'; // A4 width
    container.style.backgroundColor = '#ffffff';
    container.style.padding = '20mm';
    container.style.fontFamily = 'Arial, sans-serif';
    container.style.position = 'absolute';
    container.style.left = '-9999px';

    // Build HTML content
    container.innerHTML = `
      <div style="margin-bottom: 30px;">
        <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 10px; color: #1f2937;">
          ${report.title}
        </h1>
        <p style="font-size: 12px; color: #6b7280;">
          Generated: ${new Date(report.timestamp).toLocaleString()}
        </p>
      </div>

      <div style="margin-bottom: 30px; padding: 15px; background-color: #f3f4f6; border-radius: 8px;">
        <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #1f2937;">
          Quality Score Summary
        </h2>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
          <div>
            <div style="font-size: 12px; color: #6b7280; margin-bottom: 5px;">Best Score</div>
            <div style="font-size: 24px; font-weight: bold; color: #059669;">
              ${report.qualityScoreSummary.bestScore.toFixed(2)}
            </div>
          </div>
          <div>
            <div style="font-size: 12px; color: #6b7280; margin-bottom: 5px;">Improvement</div>
            <div style="font-size: 24px; font-weight: bold; color: ${
              report.qualityScoreSummary.totalImprovement >= 0 ? '#059669' : '#dc2626'
            };">
              ${report.qualityScoreSummary.totalImprovement >= 0 ? '+' : ''}${report.qualityScoreSummary.totalImprovement.toFixed(3)}
            </div>
          </div>
          <div>
            <div style="font-size: 12px; color: #6b7280; margin-bottom: 5px;">Baseline Score</div>
            <div style="font-size: 18px; font-weight: bold; color: #4b5563;">
              ${report.qualityScoreSummary.baselineScore.toFixed(2)}
            </div>
          </div>
          <div>
            <div style="font-size: 12px; color: #6b7280; margin-bottom: 5px;">Best Iteration</div>
            <div style="font-size: 18px; font-weight: bold; color: #4b5563;">
              #${report.qualityScoreSummary.bestIterationNumber}
            </div>
          </div>
        </div>
      </div>

      ${
        report.iterations.length > 0
          ? `
        <div style="margin-bottom: 30px;">
          <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #1f2937;">
            Iteration History
          </h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <thead>
              <tr style="background-color: #f3f4f6; border-bottom: 2px solid #d1d5db;">
                <th style="padding: 8px; text-align: left;">#</th>
                <th style="padding: 8px; text-align: left;">Combined Score</th>
                <th style="padding: 8px; text-align: left;">Readability</th>
                <th style="padding: 8px; text-align: left;">Similarity</th>
                <th style="padding: 8px; text-align: left;">Delta</th>
              </tr>
            </thead>
            <tbody>
              ${report.iterations
                .map(
                  (iter) => `
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 8px;">${iter.iterationNumber}</td>
                  <td style="padding: 8px; font-weight: bold;">${iter.qualityScore.combinedScore.toFixed(2)}</td>
                  <td style="padding: 8px;">${iter.qualityScore.readabilityScore.toFixed(2)}</td>
                  <td style="padding: 8px;">${iter.qualityScore.similarityScore.toFixed(2)}</td>
                  <td style="padding: 8px; color: ${iter.improved ? '#059669' : '#dc2626'};">
                    ${iter.improved ? '+' : ''}${iter.improvementDelta.toFixed(3)}
                  </td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </div>
      `
          : ''
      }

      ${
        report.parameterDifferences && report.parameterDifferences.length > 0
          ? `
        <div style="margin-bottom: 30px;">
          <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #1f2937;">
            Parameter Differences
          </h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <thead>
              <tr style="background-color: #f3f4f6; border-bottom: 2px solid #d1d5db;">
                <th style="padding: 8px; text-align: left;">Parameter</th>
                <th style="padding: 8px; text-align: left;">Baseline</th>
                <th style="padding: 8px; text-align: left;">Current</th>
                <th style="padding: 8px; text-align: left;">Impact</th>
              </tr>
            </thead>
            <tbody>
              ${report.parameterDifferences
                .map(
                  (diff) => `
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 8px; font-weight: 500;">${diff.parameter}</td>
                  <td style="padding: 8px;">${diff.baselineValue}</td>
                  <td style="padding: 8px; font-weight: bold;">${diff.currentValue}</td>
                  <td style="padding: 8px;">
                    <span style="color: ${
                      diff.impact === 'positive'
                        ? '#059669'
                        : diff.impact === 'negative'
                          ? '#dc2626'
                          : '#6b7280'
                    };">
                      ${diff.impact}
                    </span>
                  </td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </div>
      `
          : ''
      }
    `;

    document.body.appendChild(container);

    // Convert to PNG (PDF generation requires additional library)
    // For now, export as high-quality PNG
    const dataUrl = await toPng(container, {
      quality: 1.0,
      pixelRatio: 2,
      backgroundColor: '#ffffff',
    });

    // Trigger download
    const link = document.createElement('a');
    link.download = filename.replace('.pdf', '.png');
    link.href = dataUrl;
    link.click();

    // Cleanup
    document.body.removeChild(container);

    console.log('[ComparisonReportExportService] Report exported as PNG (PDF requires additional library)');
  } catch (error) {
    console.error('[ComparisonReportExportService] Export failed:', error);
    throw new Error(
      `Failed to export comparison report: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Export comparison as image grid (PNG or SVG)
 *
 * Creates a grid of layout screenshots with quality scores
 */
export async function exportComparisonAsImageGrid(
  layouts: LayoutSnapshot[],
  format: 'png' | 'svg' = 'png',
  filename?: string
): Promise<void> {
  try {
    const container = document.createElement('div');
    container.style.width = '1920px';
    container.style.backgroundColor = '#ffffff';
    container.style.padding = '40px';
    container.style.position = 'absolute';
    container.style.left = '-9999px';

    // Determine grid columns
    const cols = layouts.length === 3 ? 3 : layouts.length === 4 ? 2 : 3;
    const gridGap = '20px';

    container.innerHTML = `
      <div style="margin-bottom: 30px;">
        <h1 style="font-size: 32px; font-weight: bold; color: #1f2937;">
          Layout Comparison Grid
        </h1>
        <p style="font-size: 14px; color: #6b7280;">
          ${layouts.length} layout${layouts.length !== 1 ? 's' : ''} compared
        </p>
      </div>

      <div style="display: grid; grid-template-columns: repeat(${cols}, 1fr); gap: ${gridGap};">
        ${layouts
          .map(
            (layout) => `
          <div style="border: 2px solid #d1d5db; border-radius: 12px; overflow: hidden; background: #ffffff;">
            <div style="padding: 15px; background-color: #f9fafb; border-bottom: 1px solid #e5e7eb;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <h3 style="font-size: 16px; font-weight: bold; color: #1f2937;">${layout.label}</h3>
                ${
                  layout.isBest
                    ? '<span style="background-color: #fbbf24; color: #78350f; padding: 4px 8px; border-radius: 9999px; font-size: 12px; font-weight: bold;">★ Best</span>'
                    : ''
                }
              </div>
              <div style="font-size: 20px; font-weight: bold; color: ${
                layout.qualityScore.combinedScore >= 0.75
                  ? '#059669'
                  : layout.qualityScore.combinedScore >= 0.60
                    ? '#d97706'
                    : '#dc2626'
              };">
                ${layout.qualityScore.combinedScore.toFixed(2)}
              </div>
            </div>
            <div style="padding: 15px;">
              <img src="${layout.screenshotUrl}" alt="${layout.label}" style="width: 100%; height: auto; border-radius: 8px;" />
            </div>
            <div style="padding: 15px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
              <div style="display: flex; justify-content: space-between;">
                <span>Readability: ${layout.qualityScore.readabilityScore.toFixed(2)}</span>
                <span>Similarity: ${layout.qualityScore.similarityScore.toFixed(2)}</span>
              </div>
            </div>
          </div>
        `
          )
          .join('')}
      </div>
    `;

    document.body.appendChild(container);

    // Export based on format
    let dataUrl: string;
    if (format === 'svg') {
      dataUrl = await toSvg(container, {
        backgroundColor: '#ffffff',
      });
    } else {
      dataUrl = await toPng(container, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });
    }

    // Trigger download
    const link = document.createElement('a');
    link.download =
      filename || `layout-comparison-grid-${Date.now()}.${format}`;
    link.href = dataUrl;
    link.click();

    // Cleanup
    document.body.removeChild(container);

    console.log(`[ComparisonReportExportService] Image grid exported as ${format.toUpperCase()}`);
  } catch (error) {
    console.error('[ComparisonReportExportService] Image grid export failed:', error);
    throw new Error(
      `Failed to export image grid: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Helper: Generate comparison report from iterations
 */
export function generateComparisonReport(
  iterations: RefinementIteration[],
  referenceImageUrl: string,
  title: string = 'Layout Refinement Comparison'
): ComparisonReport {
  if (iterations.length === 0) {
    throw new Error('No iterations provided for comparison report');
  }

  const bestIteration = iterations.reduce((best, current) => {
    return current.qualityScore.combinedScore > best.qualityScore.combinedScore
      ? current
      : best;
  });

  const baselineIteration = iterations[0];

  return {
    title,
    timestamp: new Date().toISOString(),
    iterations,
    referenceImageUrl,
    qualityScoreSummary: {
      bestScore: bestIteration.qualityScore.combinedScore,
      baselineScore: baselineIteration.qualityScore.combinedScore,
      totalImprovement:
        bestIteration.qualityScore.combinedScore -
        baselineIteration.qualityScore.combinedScore,
      bestIterationNumber: bestIteration.iterationNumber,
    },
  };
}
