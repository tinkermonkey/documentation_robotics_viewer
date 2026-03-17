/**
 * Libavoid Router Service
 *
 * Provides global edge routing using Libavoid WASM library.
 * Unlike layout engines that position nodes, this service routes edges
 * around obstacles with overlap minimization.
 *
 * Pattern follows GraphvizLayoutEngine:
 * - Async initialization of WASM module
 * - Stateless routing interface accepting positioned nodes and edges
 * - Returns edge waypoints for rendering
 */

import { AvoidLib } from 'libavoid-js';
import { calculateLabelAwareNudgingDistance } from '../utils/labelSpacingUtils';

type LibavoidInstance = ReturnType<typeof AvoidLib.getInstance>;

/**
 * Libavoid WASM type definitions
 * These provide type safety for WASM-returned objects
 */
interface LibavoidPoint {
  x: number;
  y: number;
  delete(): void;
}

interface LibavoidRectangle {
  delete(): void;
}

interface LibavoidShapeRef {
  delete(): void;
}

interface LibavoidShapeConnectionPin {
  setExclusive(exclusive: boolean): void;
  delete(): void;
}

interface LibavoidConnEnd {
  delete(): void;
}

interface LibavoidPolyLine {
  size(): number;
  at(index: number): LibavoidPoint;
}

interface LibavoidConnRef {
  displayRoute(): LibavoidPolyLine;
}

interface LibavoidWasmRouter {
  setRoutingParameter(parameter: number, value: number): void;
  setRoutingOption(option: number, value: boolean): void;
  processTransaction(): void;
  deleteConnector(connRef: LibavoidConnRef): void;
  deleteShape(shape: LibavoidShapeRef): void;
  delete(): void;
}

/**
 * Node input for edge routing calculation
 */
export interface LibavoidNodeInput {
  id: string;
  position: { x: number; y: number };
  width: number;
  height: number;
}

/**
 * Edge input for edge routing calculation
 */
export interface LibavoidEdgeInput {
  id: string;
  source: string;
  target: string;
  sourceSide?: 'top' | 'bottom' | 'left' | 'right';
  targetSide?: 'top' | 'bottom' | 'left' | 'right';
  /** Optional label text for dynamic spacing based on actual label widths */
  label?: string;
}

/**
 * Input for edge routing calculation
 */
export interface LibavoidRoutingInput {
  nodes: LibavoidNodeInput[];
  edges: LibavoidEdgeInput[];
}

/**
 * Output from edge routing calculation
 */
export interface LibavoidRoutingResult {
  edgeWaypoints: Map<string, Array<{ x: number; y: number }>>;
}

/**
 * Connection direction flags for shape connection pins
 */
export enum ConnDir {
  Unknown = 0,
  Up = 1,
  Down = 2,
  Left = 4,
  Right = 8,
  All = 15,
}

/**
 * Libavoid Router Service
 *
 * Routes edges globally with overlap minimization using Libavoid WASM.
 * Integrates with ELK for node positioning and port assignment.
 */
export class LibavoidRouter {
  private static instance: LibavoidRouter | null = null;
  private module: LibavoidInstance | null = null;
  private initialized = false;
  private initializePromise: Promise<void> | null = null;

  /**
   * Private constructor to enforce singleton pattern.
   * Use getInstance() to get the singleton instance.
   */
  private constructor() {}

  /**
   * Get singleton instance of LibavoidRouter
   */
  static getInstance(): LibavoidRouter {
    if (!LibavoidRouter.instance) {
      LibavoidRouter.instance = new LibavoidRouter();
    }
    return LibavoidRouter.instance;
  }

  /**
   * Reset singleton instance (for testing only).
   * Clears the instance so the next getInstance() call creates a fresh one.
   */
  static resetInstance(): void {
    const instance = LibavoidRouter.instance;
    if (instance) {
      instance.dispose();
    }
    LibavoidRouter.instance = null;
  }

  /**
   * Initialize the Libavoid WASM module
   * Must be called before routing operations
   *
   * Concurrent calls to initialize() are safe; only one WASM load occurs.
   * Subsequent calls return the same Promise or void immediately if already initialized.
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // If initialization is already in progress, return the pending Promise
    if (this.initializePromise) {
      return this.initializePromise;
    }

    // Store the pending Promise to prevent concurrent initialization attempts
    this.initializePromise = this.performInitialization();
    return this.initializePromise;
  }

  /**
   * Perform the actual WASM module initialization
   */
  private async performInitialization(): Promise<void> {
    try {
      // Load the WASM module and initialize it
      // The AvoidLib object will locate the .wasm file in the public directory
      await AvoidLib.load();
      this.module = AvoidLib.getInstance();
      this.initialized = true;
      console.log('[LibavoidRouter] Initialized with Libavoid WASM module');
    } catch (error) {
      console.error('[LibavoidRouter] Failed to initialize WASM module:', error);
      // Clear the pending promise so retry attempts can succeed
      this.initializePromise = null;
      throw new Error(
        `Failed to initialize Libavoid WASM module: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Check if router is initialized
   */
  isInitialized(): boolean {
    return this.initialized && this.module !== null;
  }

  /**
   * Route edges with global overlap minimization
   *
   * Algorithm:
   * 1. Create a Router with OrthogonalRouting mode
   * 2. Calculate label-aware nudging distance based on actual label widths (FR-10)
   * 3. Set routing penalties for overlap/crossing minimization
   * 4. Register each node as a ShapeRef obstacle
   * 5. Create exclusive ShapeConnectionPins for each edge endpoint
   * 6. Process routing transaction
   * 7. Extract waypoints from ConnRef displayRoute()
   * 8. Strip first/last points (ElbowEdge adds them from handle positions)
   * 9. Destroy all Libavoid objects to prevent memory leaks
   *
   * @param input Positioned nodes and edges to route
   * @returns Map of edge IDs to waypoint arrays (intermediate points only).
   *          If router is not initialized or any routing error occurs, returns an empty map
   *          to trigger A* edge routing fallback. Errors are logged to console.error.
   */
  async routeEdges(input: LibavoidRoutingInput): Promise<LibavoidRoutingResult> {
    if (!this.isInitialized() || !this.module) {
      const error = 'LibavoidRouter not initialized; falling back to A* edge routing';
      console.error(`[LibavoidRouter] ${error}`);
      // Return empty map to trigger A* fallback, but error is now in console.error
      return { edgeWaypoints: new Map() };
    }

    try {
      const edgeWaypoints = new Map<string, Array<{ x: number; y: number }>>();

      // Create router with OrthogonalRouting mode (value: 2)
      const router = new this.module.Router(2);

      // Calculate label-aware nudging distance based on actual edge labels
      // This ensures labels on parallel edges don't visually collide
      const labelTexts = input.edges
        .filter((e): e is LibavoidEdgeInput & { label: string } => !!e.label)
        .map((e) => e.label);

      const idealNudgingDistance = labelTexts.length > 0
        ? calculateLabelAwareNudgingDistance(labelTexts)
        : 15; // Default if no labels

      // Set routing penalties to minimize overlap and crossings
      router.setRoutingParameter(this.module.RoutingParameter.segmentPenalty, 50);
      router.setRoutingParameter(this.module.RoutingParameter.crossingPenalty, 200);
      router.setRoutingParameter(
        this.module.RoutingParameter.fixedSharedPathPenalty,
        110
      );
      router.setRoutingOption(
        this.module.RoutingOption.nudgeOrthogonalSegmentsConnectedToShapes,
        true
      );
      router.setRoutingParameter(
        this.module.RoutingParameter.idealNudgingDistance,
        idealNudgingDistance
      );

      // Register nodes as obstacles with ShapeRef
      const shapeMap = new Map<string, LibavoidShapeRef>();
      const pointsToClean: LibavoidPoint[] = [];
      const rectsToClean: LibavoidRectangle[] = [];

      for (const node of input.nodes) {
        const topLeft = new this.module.Point(node.position.x, node.position.y);
        const bottomRight = new this.module.Point(
          node.position.x + node.width,
          node.position.y + node.height
        );
        const rect = new this.module.Rectangle(topLeft, bottomRight);
        const shapeRef = new this.module.ShapeRef(router, rect);
        shapeMap.set(node.id, shapeRef);

        // Track for cleanup
        pointsToClean.push(topLeft, bottomRight);
        rectsToClean.push(rect);
      }

      // Group edges by (nodeId, side) to distribute pins evenly
      const edgesByNodeAndSide = new Map<string, LibavoidEdgeInput[]>();
      for (const edge of input.edges) {
        const srcKey = `${edge.source}:${edge.sourceSide || 'bottom'}`;
        const tgtKey = `${edge.target}:${edge.targetSide || 'top'}`;

        if (!edgesByNodeAndSide.has(srcKey)) {
          edgesByNodeAndSide.set(srcKey, []);
        }
        if (!edgesByNodeAndSide.has(tgtKey)) {
          edgesByNodeAndSide.set(tgtKey, []);
        }

        edgesByNodeAndSide.get(srcKey)!.push(edge);
        edgesByNodeAndSide.get(tgtKey)!.push(edge);
      }

      // Create exclusive connection pins for each edge endpoint
      // These pins are marked as exclusive to ensure each edge gets its own connection point,
      // preventing multiple edges from sharing the same port and causing routing overlap.
      // The pinMap stores the pins but doesn't directly control routing; instead, the exclusive
      // pins constrain where the router can attach connections on each shape side.
      const pinMap = new Map<string, LibavoidShapeConnectionPin>();

      for (const [nodeAndSide, edgesOnSide] of edgesByNodeAndSide) {
        const [nodeId, side] = nodeAndSide.split(':');
        const shapeRef = shapeMap.get(nodeId);

        if (!shapeRef) continue;

        // Map side to classId and ConnDir
        const sideConfig = this.getSideConfig(side as 'top' | 'bottom' | 'left' | 'right');
        const classId = sideConfig.classId;
        const connDir = sideConfig.connDir;

        // Distribute pins evenly along the side
        const n = edgesOnSide.length;
        for (let i = 0; i < n; i++) {
          const edge = edgesOnSide[i];
          let xProportion = 0.5;
          let yProportion = 0.5;

          // For horizontal sides (top/bottom), vary x proportion
          if (side === 'top' || side === 'bottom') {
            if (n === 1) {
              xProportion = 0.5;
            } else if (n === 2) {
              xProportion = i === 0 ? 0.33 : 0.67;
            } else {
              // Distribute across 0.2 to 0.8 for 3+ edges
              xProportion = 0.2 + (i / (n - 1)) * 0.6;
            }
            yProportion = side === 'top' ? 0 : 1;
          } else {
            // For vertical sides (left/right), vary y proportion
            if (n === 1) {
              yProportion = 0.5;
            } else if (n === 2) {
              yProportion = i === 0 ? 0.33 : 0.67;
            } else {
              // Distribute across 0.2 to 0.8 for 3+ edges
              yProportion = 0.2 + (i / (n - 1)) * 0.6;
            }
            xProportion = side === 'left' ? 0 : 1;
          }

          const pin = new this.module.ShapeConnectionPin(
            shapeRef,
            classId,
            xProportion,
            yProportion,
            true, // proportional
            0,
            connDir as unknown as number
          );
          pin.setExclusive(true);

          // Store pin for later reference (edge ID -> pin mapping)
          const edgeId = `${edge.id}:${nodeId}`;
          pinMap.set(edgeId, pin);
        }
      }

      // Create connections for each edge
      const connRefMap = new Map<string, LibavoidConnRef>();
      const connEndsToClean: LibavoidConnEnd[] = [];

      for (const edge of input.edges) {
        const srcShape = shapeMap.get(edge.source);
        const tgtShape = shapeMap.get(edge.target);

        if (!srcShape || !tgtShape) continue;

        const srcSideConfig = this.getSideConfig(
          edge.sourceSide || 'bottom'
        );
        const tgtSideConfig = this.getSideConfig(edge.targetSide || 'top');

        // Create ConnEnd objects using the shape and classId
        const srcEnd = new this.module.ConnEnd(
          srcShape,
          srcSideConfig.classId
        );
        const tgtEnd = new this.module.ConnEnd(
          tgtShape,
          tgtSideConfig.classId
        );

        const connRef = new this.module.ConnRef(router, srcEnd, tgtEnd);
        connRefMap.set(edge.id, connRef);

        // Track for cleanup
        connEndsToClean.push(srcEnd, tgtEnd);
      }

      // Process routing transaction
      router.processTransaction();

      // Extract waypoints from each connection
      for (const [edgeId, connRef] of connRefMap) {
        try {
          const route = connRef.displayRoute();
          const pts: Array<{ x: number; y: number }> = [];

          for (let i = 0; i < route.size(); i++) {
            const p = route.at(i);
            pts.push({ x: p.x, y: p.y });
          }

          // Strip first and last points (ElbowEdge adds them from React Flow handle positions)
          const intermediateWaypoints = pts.slice(1, -1);
          edgeWaypoints.set(edgeId, intermediateWaypoints);
        } catch (error) {
          // If routing fails for a specific edge, use empty waypoints for A* fallback
          console.error(
            `[LibavoidRouter] Failed to extract route for edge ${edgeId}:`,
            error
          );
          edgeWaypoints.set(edgeId, []);
        }
      }

      // Clean up all Libavoid objects to prevent memory leaks
      try {
        this.cleanupLibavoidObjects(
          router,
          shapeMap,
          pinMap,
          connRefMap,
          connEndsToClean,
          pointsToClean,
          rectsToClean
        );
      } catch (cleanupError) {
        console.warn('[LibavoidRouter] Cleanup error (non-fatal):', cleanupError);
      }

      return { edgeWaypoints };
    } catch (error) {
      // On any error, return empty waypoints to trigger A* fallback
      console.error('[LibavoidRouter] Routing failed, falling back to A* edge routing:', error);
      return { edgeWaypoints: new Map() };
    }
  }

  /**
   * Get side configuration (classId and ConnDir)
   * classId mapping: top=1, right=2, bottom=3, left=4
   */
  private getSideConfig(
    side: 'top' | 'bottom' | 'left' | 'right'
  ): { classId: number; connDir: ConnDir } {
    switch (side) {
      case 'top':
        return { classId: 1, connDir: ConnDir.Up };
      case 'right':
        return { classId: 2, connDir: ConnDir.Right };
      case 'bottom':
        return { classId: 3, connDir: ConnDir.Down };
      case 'left':
        return { classId: 4, connDir: ConnDir.Left };
      default:
        return { classId: 3, connDir: ConnDir.Down };
    }
  }

  /**
   * Clean up all Libavoid heap objects to prevent memory leaks
   *
   * Cleanup order is critical:
   * 1. Pins must be deleted first (they're owned by their parent shapes)
   * 2. ConnRef objects must be deleted via router.deleteConnector()
   * 3. ShapeRef objects must be deleted via router.deleteShape()
   * 4. Independent objects (ConnEnd, Rectangle, Point) use .delete()
   * 5. Router is destroyed last
   *
   * Deleting a shape before its pins causes WASM memory access errors.
   *
   * Each step is wrapped individually to prevent cascading memory leaks
   * if a single step fails.
   */
  private cleanupLibavoidObjects(
    router: LibavoidWasmRouter,
    shapeMap: Map<string, LibavoidShapeRef>,
    pinMap: Map<string, LibavoidShapeConnectionPin>,
    connRefMap: Map<string, LibavoidConnRef>,
    connEndsToClean: LibavoidConnEnd[],
    pointsToClean: LibavoidPoint[],
    rectsToClean: LibavoidRectangle[]
  ): void {
    // Step 1: Destroy all pins before shapes (pins are owned by shapes)
    for (const pin of pinMap.values()) {
      try {
        pin.delete?.();
      } catch (error) {
        console.warn('[LibavoidRouter] Error deleting pin:', error);
      }
    }

    // Step 2: Delete all connection refs via router (they're owned by router)
    for (const connRef of connRefMap.values()) {
      try {
        router.deleteConnector(connRef);
      } catch (error) {
        console.warn('[LibavoidRouter] Error deleting connector:', error);
      }
    }

    // Step 3: Delete all shapes via router (they're owned by router)
    for (const shape of shapeMap.values()) {
      try {
        router.deleteShape(shape);
      } catch (error) {
        console.warn('[LibavoidRouter] Error deleting shape:', error);
      }
    }

    // Step 4: Destroy independent ConnEnd objects
    for (const connEnd of connEndsToClean) {
      try {
        connEnd.delete?.();
      } catch (error) {
        console.warn('[LibavoidRouter] Error deleting ConnEnd:', error);
      }
    }

    // Step 5: Destroy rectangles
    for (const rect of rectsToClean) {
      try {
        rect.delete?.();
      } catch (error) {
        console.warn('[LibavoidRouter] Error deleting rectangle:', error);
      }
    }

    // Step 6: Destroy points
    for (const point of pointsToClean) {
      try {
        point.delete?.();
      } catch (error) {
        console.warn('[LibavoidRouter] Error deleting point:', error);
      }
    }

    // Step 7: Destroy router last
    try {
      router.delete();
    } catch (error) {
      console.warn('[LibavoidRouter] Error deleting router:', error);
    }
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    this.module = null;
    this.initialized = false;
    this.initializePromise = null;
  }
}

// Export singleton instance
export const libavoidRouter = LibavoidRouter.getInstance();
