/**
 * Business Layer Controls Component
 *
 * Provides filtering, layout selection, and export controls for business layer visualization.
 * Uses BaseControlPanel for shared layout/export functionality with custom filter section.
 */

import { memo, useMemo } from 'react';
import { Button, Card, Label } from 'flowbite-react';
import { Download, FileText } from 'lucide-react';
import { BaseControlPanel, LayoutOption } from '@/core/components/base';
import { BusinessGraph, BusinessNodeType } from '../../types/businessLayer';
import { useBusinessLayerStore, BusinessLayoutType } from '../../../stores/businessLayerStore';
import { useAvailableFilters } from '../../hooks/useBusinessFilters';

export type BusinessLayoutAlgorithm = BusinessLayoutType;

interface BusinessLayerControlsProps {
  /** Business graph with indices */
  businessGraph: BusinessGraph | null;

  /** Export callback */
  onExport: (type: 'png' | 'svg' | 'graphData' | 'catalog' | 'traceability' | 'impact') => void;

  /** Whether an export operation is in progress */
  isExporting: boolean;

  /** Visible node count after filtering */
  visibleCount: number;

  /** Total node count */
  totalCount: number;
}

/**
 * Type filter labels
 */
const TYPE_LABELS: Record<BusinessNodeType, string> = {
  function: 'Functions',
  process: 'Processes',
  service: 'Services',
  capability: 'Capabilities',
};

/**
 * Layout options
 */
const LAYOUT_OPTIONS: LayoutOption[] = [
  {
    value: 'hierarchical' as const,
    label: 'Hierarchical',
    description: 'Top-down tree structure for business functions',
  },
  {
    value: 'swimlane' as const,
    label: 'Swimlane',
    description: 'Swimlane layout organized by domain',
  },
  {
    value: 'matrix' as const,
    label: 'Matrix',
    description: 'Matrix layout showing relationships',
  },
  {
    value: 'force' as const,
    label: 'Force-Directed',
    description: 'Network layout using physics simulation',
  },
  {
    value: 'manual' as const,
    label: 'Manual',
    description: 'Preserve user-adjusted node positions',
  },
];

/**
 * Business Layer Controls Component
 */
function BusinessLayerControlsComponent({
  businessGraph,
  onExport,
  isExporting,
  visibleCount,
  totalCount,
}: BusinessLayerControlsProps) {
  const {
    filters,
    selectedLayout,
    setSelectedLayout,
    toggleTypeFilter,
    toggleDomainFilter,
    toggleLifecycleFilter,
    toggleCriticalityFilter,
    clearFilters,
  } = useBusinessLayerStore();

  // Get available filter values from graph
  const availableFilters = useAvailableFilters(businessGraph);

  // Calculate filter counts by type
  const filterCounts = useMemo(() => {
    if (!businessGraph) {
      return {
        function: 0,
        process: 0,
        service: 0,
        capability: 0,
      };
    }

    return {
      function: businessGraph.indices.byType.get('function')?.size || 0,
      process: businessGraph.indices.byType.get('process')?.size || 0,
      service: businessGraph.indices.byType.get('service')?.size || 0,
      capability: businessGraph.indices.byType.get('capability')?.size || 0,
    };
  }, [businessGraph]);

  // Calculate counts for other filter dimensions
  const domainCounts = useMemo(() => {
    if (!businessGraph) return {};
    const counts: Record<string, number> = {};
    businessGraph.indices.byDomain.forEach((nodeSet, domain) => {
      counts[domain] = nodeSet.size;
    });
    return counts;
  }, [businessGraph]);

  const lifecycleCounts = useMemo(() => {
    if (!businessGraph) return {};
    const counts: Record<string, number> = {};
    businessGraph.indices.byLifecycle.forEach((nodeSet, lifecycle) => {
      counts[lifecycle] = nodeSet.size;
    });
    return counts;
  }, [businessGraph]);

  const criticalityCounts = useMemo(() => {
    if (!businessGraph) return {};
    const counts: Record<string, number> = {};
    businessGraph.indices.byCriticality.forEach((nodeSet, criticality) => {
      counts[criticality] = nodeSet.size;
    });
    return counts;
  }, [businessGraph]);

  // Check if any filters are active
  const hasActiveFilters =
    filters.types.size > 0 ||
    filters.domains.size > 0 ||
    filters.lifecycles.size > 0 ||
    filters.criticalities.size > 0;

  // Render filter section with all filter dimensions
  const renderFilterSection = () => (
    <div className="space-y-4" key="filters" data-testid="business-filters-section">
      {/* Element Count */}
      <Card className="dark:bg-gray-800 dark:border-gray-700" data-testid="business-element-count">
        <Label className="text-sm font-semibold text-gray-900 dark:text-white">
          Elements
        </Label>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Showing {visibleCount} of {totalCount}
        </p>
      </Card>

      {/* Type Filters */}
      {availableFilters.types.length > 0 && (
        <Card className="dark:bg-gray-800 dark:border-gray-700" data-testid="business-type-filters">
          <Label className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Element Types
          </Label>
          <div className="space-y-2">
            {availableFilters.types.map((type) => (
              <label
                key={type}
                className="flex items-center gap-2 cursor-pointer"
                data-testid={`business-type-filter-${type}`}
              >
                <input
                  type="checkbox"
                  checked={filters.types.has(type)}
                  onChange={() => toggleTypeFilter(type)}
                  className="rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                  data-testid={`business-type-checkbox-${type}`}
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {TYPE_LABELS[type]} ({filterCounts[type]})
                </span>
              </label>
            ))}
          </div>
        </Card>
      )}

      {/* Domain Filters */}
      {availableFilters.domains.length > 0 && (
        <Card className="dark:bg-gray-800 dark:border-gray-700" data-testid="business-domain-filters">
          <Label className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Business Domains
          </Label>
          <div className="space-y-2">
            {availableFilters.domains.map((domain) => (
              <label
                key={domain}
                className="flex items-center gap-2 cursor-pointer"
                data-testid={`business-domain-filter-${domain}`}
              >
                <input
                  type="checkbox"
                  checked={filters.domains.has(domain)}
                  onChange={() => toggleDomainFilter(domain)}
                  className="rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                  data-testid={`business-domain-checkbox-${domain}`}
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {domain} ({domainCounts[domain] || 0})
                </span>
              </label>
            ))}
          </div>
        </Card>
      )}

      {/* Lifecycle Filters */}
      {availableFilters.lifecycles.length > 0 && (
        <Card className="dark:bg-gray-800 dark:border-gray-700" data-testid="business-lifecycle-filters">
          <Label className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Lifecycle Stage
          </Label>
          <div className="space-y-2">
            {availableFilters.lifecycles.map((lifecycle) => (
              <label
                key={lifecycle}
                className="flex items-center gap-2 cursor-pointer"
                data-testid={`business-lifecycle-filter-${lifecycle}`}
              >
                <input
                  type="checkbox"
                  checked={filters.lifecycles.has(lifecycle)}
                  onChange={() => toggleLifecycleFilter(lifecycle)}
                  className="rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                  data-testid={`business-lifecycle-checkbox-${lifecycle}`}
                />
                <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                  {lifecycle} ({lifecycleCounts[lifecycle] || 0})
                </span>
              </label>
            ))}
          </div>
        </Card>
      )}

      {/* Criticality Filters */}
      {availableFilters.criticalities.length > 0 && (
        <Card className="dark:bg-gray-800 dark:border-gray-700" data-testid="business-criticality-filters">
          <Label className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Criticality
          </Label>
          <div className="space-y-2">
            {availableFilters.criticalities.map((criticality) => (
              <label
                key={criticality}
                className="flex items-center gap-2 cursor-pointer"
                data-testid={`business-criticality-filter-${criticality}`}
              >
                <input
                  type="checkbox"
                  checked={filters.criticalities.has(criticality)}
                  onChange={() => toggleCriticalityFilter(criticality)}
                  className="rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                  data-testid={`business-criticality-checkbox-${criticality}`}
                />
                <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                  {criticality} ({criticalityCounts[criticality] || 0})
                </span>
              </label>
            ))}
          </div>
        </Card>
      )}

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <Button
          color="red"
          onClick={clearFilters}
          size="sm"
          className="w-full"
          data-testid="business-clear-filters-button"
        >
          Clear All Filters
        </Button>
      )}
    </div>
  );

  // Render export controls section
  const renderExportControls = () => {
    if (!onExport) {
      return null;
    }

    return (
      <div
        className="control-panel-section export-section"
        key="exports"
        data-testid="business-export-section"
      >
        <Label className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          Export
        </Label>
        <div className="grid grid-cols-2 gap-2">
          <Button
            color="gray"
            onClick={() => onExport('png')}
            disabled={isExporting}
            size="sm"
            title="Export as PNG"
            data-testid="business-export-png"
          >
            <Download className="mr-2 h-4 w-4" />
            PNG
          </Button>
          <Button
            color="gray"
            onClick={() => onExport('svg')}
            disabled={isExporting}
            size="sm"
            title="Export as SVG"
            data-testid="business-export-svg"
          >
            <Download className="mr-2 h-4 w-4" />
            SVG
          </Button>
          <Button
            color="gray"
            onClick={() => onExport('graphData')}
            disabled={isExporting}
            size="sm"
            title="Export Graph Data"
            data-testid="business-export-data"
          >
            <Download className="mr-2 h-4 w-4" />
            Data
          </Button>
          <Button
            color="gray"
            onClick={() => onExport('catalog')}
            disabled={isExporting}
            size="sm"
            title="Export Process Catalog"
            data-testid="business-export-catalog"
          >
            <FileText className="mr-2 h-4 w-4" />
            Catalog
          </Button>
          <Button
            color="gray"
            onClick={() => onExport('traceability')}
            disabled={isExporting}
            size="sm"
            title="Export Traceability Report"
            data-testid="business-export-report"
          >
            <FileText className="mr-2 h-4 w-4" />
            Report
          </Button>
          <Button
            color="gray"
            onClick={() => onExport('impact')}
            disabled={isExporting}
            size="sm"
            title="Export Impact Analysis"
            data-testid="business-export-impact"
          >
            <FileText className="mr-2 h-4 w-4" />
            Impact
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="business-layer-controls">
      <BaseControlPanel<BusinessLayoutAlgorithm>
        selectedLayout={selectedLayout}
        onLayoutChange={(layout) => setSelectedLayout(layout)}
        layoutOptions={LAYOUT_OPTIONS}
        onFitToView={() => {}} // No-op for now - can be wired up later
        isLayouting={isExporting}
        renderBeforeLayout={renderFilterSection}
        renderControls={renderExportControls}
        testId="business-control-panel"
      />
    </div>
  );
}

export const BusinessLayerControls = memo(
  BusinessLayerControlsComponent
) as typeof BusinessLayerControlsComponent & { displayName: string };

BusinessLayerControls.displayName = 'BusinessLayerControls';
