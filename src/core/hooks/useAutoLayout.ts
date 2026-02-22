import { useEffect, useRef, useCallback, useState } from 'react';
import { useReactFlow, useNodes } from '@xyflow/react';
import { MetaModel } from '../types';
import { NodeTransformer } from '../services/nodeTransformer';
import { VerticalLayerLayout } from '../layout/verticalLayerLayout';
import { LayoutEngine, LayoutEngineType, getEngine } from '../layout/engines';
import { AppNode, AppEdge } from '../types/reactflow';
import { elementStore } from '../stores/elementStore';

interface UseAutoLayoutOptions {
  model: MetaModel | null;
  layoutEngine?: LayoutEngineType;
  layoutParameters?: Record<string, any>;
  onNodesEdgesChange?: (nodes: AppNode[], edges: AppEdge[]) => void;
}

export interface UseAutoLayoutResult {
  isLayouting: boolean;
  error: string | null;
}

/**
 * Two-pass layout hook for accurate node sizing.
 *
 * Pass 1: Run layout with estimated node sizes → set nodes.
 *         React Flow renders and populates `node.measured`.
 * Pass 2: Re-run layout using `node.measured` dimensions → refine positions.
 *
 * Must be called inside a ReactFlowProvider.
 */
export function useAutoLayout(options: UseAutoLayoutOptions): UseAutoLayoutResult {
  const { model, layoutEngine, layoutParameters, onNodesEdgesChange } = options;

  const { setNodes, setEdges, fitView } = useReactFlow();
  const nodes = useNodes<AppNode>();

  const [isLayouting, setIsLayouting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prevent concurrent layout runs within a single model version
  const isDirty = useRef(false);
  // Monotonically increasing version; incremented when model/engine changes.
  // Checked after async operations to discard stale results from previous models.
  const layoutVersion = useRef(0);
  // True after pass 1 completes while we wait for React Flow to measure nodes
  const awaitingMeasurements = useRef(false);
  // Model snapshot for pass 2
  const pendingModel = useRef<MetaModel | null>(null);

  const buildLayoutEngine = useCallback((): VerticalLayerLayout | LayoutEngine => {
    if (layoutEngine) {
      return getEngine(layoutEngine) ?? new VerticalLayerLayout();
    }
    return new VerticalLayerLayout();
  }, [layoutEngine]);

  const runLayout = useCallback(
    async (
      targetModel: MetaModel,
      measuredNodeSizes?: Map<string, { width: number; height: number }>,
      version?: number
    ) => {
      if (isDirty.current) return;
      isDirty.current = true;
      setIsLayouting(true);
      setError(null);

      try {
        elementStore.clear();
        const engine = buildLayoutEngine();
        const transformer = new NodeTransformer(engine);
        const result = await transformer.transformModel(targetModel, layoutParameters, measuredNodeSizes);

        // Discard results if a newer layout was requested while this one was running
        if (version !== undefined && version !== layoutVersion.current) return;

        setNodes(result.nodes);
        setEdges(result.edges);
        onNodesEdgesChange?.(result.nodes, result.edges);

        if (!measuredNodeSizes) {
          // Pass 1 complete — check whether there are element nodes that need measuring
          const elementNodeCount = result.nodes.filter((n) => n.type !== 'layerContainer').length;
          if (elementNodeCount === 0) {
            // Model contains only layer containers (e.g. all layers empty); skip pass 2
            requestAnimationFrame(() => fitView({ padding: 0.1, duration: 0 }));
            setIsLayouting(false);
          } else {
            // Flag that we need to re-layout once React Flow measures the nodes
            awaitingMeasurements.current = true;
            pendingModel.current = targetModel;
          }
        } else {
          // Pass 2 complete — fit the view
          requestAnimationFrame(() => fitView({ padding: 0.1, duration: 0 }));
          setIsLayouting(false);
        }
      } catch (err) {
        if (version !== undefined && version !== layoutVersion.current) return;
        setError(err instanceof Error ? err.message : 'Layout failed');
        setIsLayouting(false);
        awaitingMeasurements.current = false;
      } finally {
        isDirty.current = false;
      }
    },
    [buildLayoutEngine, layoutParameters, onNodesEdgesChange, setEdges, setNodes, fitView]
  );

  // Trigger pass 1 whenever the model or layout settings change
  useEffect(() => {
    if (!model) return;
    // Increment version to invalidate any in-flight layout from the previous model
    layoutVersion.current += 1;
    isDirty.current = false;
    awaitingMeasurements.current = false;
    runLayout(model, undefined, layoutVersion.current);
  }, [model, layoutEngine, layoutParameters]); // eslint-disable-line react-hooks/exhaustive-deps

  // Pass 2: once all element nodes have been measured by React Flow, re-run layout
  useEffect(() => {
    if (!awaitingMeasurements.current || !pendingModel.current) return;
    if (nodes.length === 0) return;

    const elementNodes = nodes.filter((n) => n.type !== 'layerContainer');
    if (elementNodes.length === 0) return;

    const allMeasured = elementNodes.every((n) => n.measured?.width && n.measured?.height);
    if (!allMeasured) return;

    awaitingMeasurements.current = false;

    const measuredSizes = new Map<string, { width: number; height: number }>();
    for (const n of elementNodes) {
      if (n.measured?.width && n.measured?.height) {
        measuredSizes.set(n.id, { width: n.measured.width, height: n.measured.height });
      }
    }

    runLayout(pendingModel.current, measuredSizes, layoutVersion.current);
  }, [nodes, runLayout]);

  return { isLayouting, error };
}
