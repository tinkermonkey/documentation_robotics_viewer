/**
 * Business Layer Controls Component
 *
 * Provides filtering, layout selection, and export controls for business layer visualization.
 */

import { useMemo } from 'react';
import { BusinessGraph, BusinessNodeType } from '../../types/businessLayer';
import { useBusinessLayerStore, BusinessLayoutType } from '../../../stores/businessLayerStore';
import { useAvailableFilters } from '../../hooks/useBusinessFilters';

interface BusinessLayerControlsProps {
  /** Business graph with indices */
  businessGraph: BusinessGraph | null;

  /** Export callback */
  onExport: (type: 'png' | 'svg' | 'catalog' | 'traceability') => void;

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
 * Layout labels
 */
const LAYOUT_LABELS: Record<BusinessLayoutType, string> = {
  hierarchical: 'Hierarchical',
  swimlane: 'Swimlane',
  matrix: 'Matrix',
  force: 'Force-Directed',
  manual: 'Manual',
};

/**
 * Business Layer Controls
 */
export const BusinessLayerControls: React.FC<BusinessLayerControlsProps> = ({
  businessGraph,
  onExport,
  visibleCount,
  totalCount,
}) => {
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

  return (
    <div
      className="business-layer-controls"
      style={{
        padding: 16,
        background: '#f5f5f5',
        borderBottom: '1px solid #ddd',
        fontFamily: 'system-ui, sans-serif',
        display: 'flex',
        gap: 24,
        flexWrap: 'wrap',
        alignItems: 'flex-start',
      }}
    >
      {/* Stats */}
      <div style={{ flex: '0 0 auto' }}>
        <h3 style={{ margin: 0, marginBottom: 8, fontSize: 14, fontWeight: 600 }}>
          Elements
        </h3>
        <div style={{ fontSize: 12, color: '#6b7280' }}>
          Showing {visibleCount} of {totalCount}
        </div>
      </div>

      {/* Type Filters */}
      <div style={{ flex: '0 0 auto', minWidth: 200 }}>
        <h3 style={{ margin: 0, marginBottom: 8, fontSize: 14, fontWeight: 600 }}>
          Element Types
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {availableFilters.types.map((type) => (
            <label
              key={type}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={filters.types.has(type)}
                onChange={() => toggleTypeFilter(type)}
                style={{ cursor: 'pointer' }}
              />
              <span>
                {TYPE_LABELS[type]} ({filterCounts[type]})
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Domain Filters */}
      {availableFilters.domains.length > 0 && (
        <div style={{ flex: '0 0 auto', minWidth: 200 }}>
          <h3 style={{ margin: 0, marginBottom: 8, fontSize: 14, fontWeight: 600 }}>
            Business Domains
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {availableFilters.domains.map((domain) => (
              <label
                key={domain}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={filters.domains.has(domain)}
                  onChange={() => toggleDomainFilter(domain)}
                  style={{ cursor: 'pointer' }}
                />
                <span>
                  {domain} ({domainCounts[domain] || 0})
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Lifecycle Filters */}
      {availableFilters.lifecycles.length > 0 && (
        <div style={{ flex: '0 0 auto', minWidth: 180 }}>
          <h3 style={{ margin: 0, marginBottom: 8, fontSize: 14, fontWeight: 600 }}>
            Lifecycle Stage
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {availableFilters.lifecycles.map((lifecycle) => (
              <label
                key={lifecycle}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={filters.lifecycles.has(lifecycle as any)}
                  onChange={() => toggleLifecycleFilter(lifecycle as any)}
                  style={{ cursor: 'pointer' }}
                />
                <span style={{ textTransform: 'capitalize' }}>
                  {lifecycle} ({lifecycleCounts[lifecycle] || 0})
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Criticality Filters */}
      {availableFilters.criticalities.length > 0 && (
        <div style={{ flex: '0 0 auto', minWidth: 160 }}>
          <h3 style={{ margin: 0, marginBottom: 8, fontSize: 14, fontWeight: 600 }}>
            Criticality
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {availableFilters.criticalities.map((criticality) => (
              <label
                key={criticality}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={filters.criticalities.has(criticality as any)}
                  onChange={() => toggleCriticalityFilter(criticality as any)}
                  style={{ cursor: 'pointer' }}
                />
                <span style={{ textTransform: 'capitalize' }}>
                  {criticality} ({criticalityCounts[criticality] || 0})
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'flex-end' }}>
          <button
            onClick={clearFilters}
            style={{
              padding: '8px 16px',
              background: '#fff',
              border: '1px solid #ddd',
              borderRadius: 4,
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              color: '#c62828',
            }}
          >
            Clear All Filters
          </button>
        </div>
      )}

      {/* Layout Selector */}
      <div style={{ flex: '0 0 auto', minWidth: 180 }}>
        <h3 style={{ margin: 0, marginBottom: 8, fontSize: 14, fontWeight: 600 }}>
          Layout
        </h3>
        <select
          value={selectedLayout}
          onChange={(e) => setSelectedLayout(e.target.value as BusinessLayoutType)}
          style={{
            width: '100%',
            padding: '6px 10px',
            fontSize: 13,
            border: '1px solid #ddd',
            borderRadius: 4,
            background: '#fff',
            cursor: 'pointer',
          }}
        >
          {Object.entries(LAYOUT_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {selectedLayout !== 'hierarchical' && (
          <div
            style={{
              marginTop: 6,
              padding: 6,
              background: '#fff3cd',
              border: '1px solid #ffc107',
              borderRadius: 4,
              fontSize: 11,
              color: '#856404',
            }}
          >
            Note: Only hierarchical layout is currently implemented
          </div>
        )}
      </div>

      {/* Export Menu */}
      <div style={{ flex: '0 0 auto', minWidth: 180 }}>
        <h3 style={{ margin: 0, marginBottom: 8, fontSize: 14, fontWeight: 600 }}>
          Export
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <button
            onClick={() => onExport('png')}
            style={{
              padding: '6px 12px',
              background: '#fff',
              border: '1px solid #ddd',
              borderRadius: 4,
              fontSize: 13,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            Export as PNG
          </button>
          <button
            onClick={() => onExport('svg')}
            style={{
              padding: '6px 12px',
              background: '#fff',
              border: '1px solid #ddd',
              borderRadius: 4,
              fontSize: 13,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            Export as SVG
          </button>
          <button
            onClick={() => onExport('catalog')}
            style={{
              padding: '6px 12px',
              background: '#fff',
              border: '1px solid #ddd',
              borderRadius: 4,
              fontSize: 13,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            Export Catalog
          </button>
          <button
            onClick={() => onExport('traceability')}
            style={{
              padding: '6px 12px',
              background: '#fff',
              border: '1px solid #ddd',
              borderRadius: 4,
              fontSize: 13,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            Export Traceability
          </button>
        </div>
      </div>
    </div>
  );
};
