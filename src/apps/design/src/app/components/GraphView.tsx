import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  Filter,
  Search,
  Info,
  MessageSquare,
  User,
} from "lucide-react";
import { useState } from "react";

interface Node {
  id: string;
  label: string;
  type: string;
  x: number;
  y: number;
  color: string;
}

interface Edge {
  from: string;
  to: string;
}

interface Comment {
  id: string;
  author: string;
  timestamp: string;
  text: string;
  nodeReferences: string[];
}

const nodes: Node[] = [
  { id: "1", label: "Strategic Goal", type: "Motivation", x: 200, y: 100, color: "#8B5CF6" },
  { id: "2", label: "Business Process", type: "Business", x: 400, y: 100, color: "#3B82F6" },
  { id: "3", label: "Application Service", type: "Application", x: 600, y: 100, color: "#10B981" },
  { id: "4", label: "API Gateway", type: "API", x: 200, y: 250, color: "#F59E0B" },
  { id: "5", label: "Data Store", type: "Technology", x: 400, y: 250, color: "#EF4444" },
  { id: "6", label: "Security Policy", type: "Security", x: 600, y: 250, color: "#EC4899" },
  { id: "7", label: "Test Suite", type: "Testing", x: 400, y: 400, color: "#06B6D4" },
  { id: "8", label: "User Interface", type: "UX", x: 200, y: 400, color: "#14B8A6" },
];

const edges: Edge[] = [
  { from: "1", to: "2" },
  { from: "2", to: "3" },
  { from: "2", to: "4" },
  { from: "3", to: "5" },
  { from: "4", to: "5" },
  { from: "5", to: "6" },
  { from: "3", to: "7" },
  { from: "8", to: "3" },
];

const comments: Comment[] = [
  {
    id: "c1",
    author: "Sarah Chen",
    timestamp: "2 hours ago",
    text: "The connection between @Strategic Goal and @Business Process needs to be reviewed. We should validate the business requirements.",
    nodeReferences: ["1", "2"],
  },
  {
    id: "c2",
    author: "Mike Johnson",
    timestamp: "5 hours ago",
    text: "Updated @API Gateway to support new authentication flow. This affects @Data Store access patterns.",
    nodeReferences: ["4", "5"],
  },
  {
    id: "c3",
    author: "Emma Wilson",
    timestamp: "1 day ago",
    text: "The @Application Service integration with @User Interface is complete. Ready for @Test Suite validation.",
    nodeReferences: ["3", "8", "7"],
  },
];

const layerTypes = [
  { name: "Motivation", color: "#8B5CF6", count: 3 },
  { name: "Business", color: "#3B82F6", count: 9 },
  { name: "Security", color: "#EC4899", count: 1 },
  { name: "Application", color: "#10B981", count: 53 },
  { name: "Technology", color: "#EF4444", count: 21 },
  { name: "API", color: "#F59E0B", count: 16 },
  { name: "Testing", color: "#06B6D4", count: 16 },
  { name: "UX", color: "#14B8A6", count: 3 },
];

export default function GraphView() {
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [highlightedNodes, setHighlightedNodes] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const handleNodeReferenceClick = (nodeIds: string[]) => {
    setHighlightedNodes(nodeIds);
    if (nodeIds.length > 0) {
      const firstNode = nodes.find((n) => n.id === nodeIds[0]);
      if (firstNode) {
        setSelectedNode(firstNode);
      }
    }
    // Clear highlight after 3 seconds
    setTimeout(() => {
      setHighlightedNodes([]);
    }, 3000);
  };

  const parseCommentText = (comment: Comment) => {
    const parts: Array<{ type: "text" | "reference"; content: string; nodeId?: string }> = [];
    let currentText = comment.text;
    
    // Find all @ mentions and their corresponding node IDs
    const mentions = comment.text.match(/@[\w\s]+/g) || [];
    mentions.forEach((mention, index) => {
      const [before, ...rest] = currentText.split(mention);
      if (before) {
        parts.push({ type: "text", content: before });
      }
      parts.push({
        type: "reference",
        content: mention,
        nodeId: comment.nodeReferences[index],
      });
      currentText = rest.join(mention);
    });
    
    if (currentText) {
      parts.push({ type: "text", content: currentText });
    }
    
    return parts;
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Toolbar */}
      <div className="border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search nodes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filter Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${
              showFilters ? "bg-blue-50 border-blue-300" : "hover:bg-gray-50"
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <div className="flex items-center gap-1 border rounded-lg p-1">
            <button className="p-2 hover:bg-gray-100 rounded" title="Zoom In">
              <ZoomIn className="w-4 h-4" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded" title="Zoom Out">
              <ZoomOut className="w-4 h-4" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded" title="Fit to Screen">
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Export */}
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg border hover:bg-gray-50 text-sm">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Graph Canvas */}
        <div className="flex-1 relative bg-gray-50">
          {/* Grid background */}
          <div className="absolute inset-0 opacity-20">
            <svg width="100%" height="100%">
              <defs>
                <pattern
                  id="grid"
                  width="20"
                  height="20"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 20 0 L 0 0 0 20"
                    fill="none"
                    stroke="gray"
                    strokeWidth="0.5"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          {/* Graph Content */}
          <div className="absolute inset-0 overflow-auto p-8">
            <svg width="800" height="600" className="mx-auto">
              {/* Edges */}
              {edges.map((edge, idx) => {
                const fromNode = nodes.find((n) => n.id === edge.from);
                const toNode = nodes.find((n) => n.id === edge.to);
                if (!fromNode || !toNode) return null;

                return (
                  <line
                    key={idx}
                    x1={fromNode.x}
                    y1={fromNode.y}
                    x2={toNode.x}
                    y2={toNode.y}
                    stroke="#CBD5E1"
                    strokeWidth="2"
                    markerEnd="url(#arrowhead)"
                  />
                );
              })}

              {/* Arrow marker definition */}
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="10"
                  refX="8"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3, 0 6" fill="#CBD5E1" />
                </marker>
              </defs>

              {/* Nodes */}
              {nodes.map((node) => {
                const isHighlighted = highlightedNodes.includes(node.id);
                return (
                  <g
                    key={node.id}
                    className="cursor-pointer transition-transform hover:scale-110"
                    onClick={() => setSelectedNode(node)}
                  >
                    {/* Highlight ring for referenced nodes */}
                    {isHighlighted && (
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r="38"
                        fill="none"
                        stroke="#FCD34D"
                        strokeWidth="4"
                        className="animate-pulse"
                      />
                    )}
                    
                    {/* Node circle */}
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r="30"
                      fill={node.color}
                      stroke={selectedNode?.id === node.id ? "#1F2937" : "white"}
                      strokeWidth={selectedNode?.id === node.id ? "3" : "2"}
                      className="drop-shadow-lg"
                    />
                    
                    {/* Node label */}
                    <text
                      x={node.x}
                      y={node.y + 50}
                      textAnchor="middle"
                      className="text-xs fill-gray-700"
                      style={{ fontSize: "12px" }}
                    >
                      {node.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Mini-map */}
          <div className="absolute bottom-4 right-4 bg-white border rounded-lg p-2 shadow-lg">
            <div className="text-xs text-gray-500 mb-1">Overview</div>
            <svg width="120" height="90" className="border rounded">
              <rect width="120" height="90" fill="#F9FAFB" />
              {nodes.map((node) => (
                <circle
                  key={node.id}
                  cx={node.x * 0.15}
                  cy={node.y * 0.15}
                  r="3"
                  fill={node.color}
                />
              ))}
            </svg>
          </div>
        </div>

        {/* Right Sidebar - Comments, Legend & Details */}
        <div className="w-80 border-l bg-white overflow-y-auto">
          {/* Comments Section */}
          <div className="p-4 border-b">
            <h3 className="text-sm mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Comments ({comments.length})
            </h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {comments.map((comment) => (
                <div key={comment.id} className="text-sm border-b pb-3 last:border-b-0">
                  <div className="flex items-start gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <User className="w-3 h-3 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-xs">{comment.author}</span>
                        <span className="text-xs text-gray-500">{comment.timestamp}</span>
                      </div>
                      <p className="text-xs text-gray-700 mt-1 leading-relaxed">
                        {parseCommentText(comment).map((part, idx) => {
                          if (part.type === "reference" && part.nodeId) {
                            const node = nodes.find((n) => n.id === part.nodeId);
                            return (
                              <span
                                key={idx}
                                onClick={() => handleNodeReferenceClick(comment.nodeReferences)}
                                className="inline-flex items-center px-1 py-0.5 rounded cursor-pointer hover:bg-blue-50 text-blue-600 font-medium"
                                title={`Click to highlight ${node?.label}`}
                              >
                                {part.content}
                              </span>
                            );
                          }
                          return <span key={idx}>{part.content}</span>;
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-3 px-3 py-2 border border-dashed rounded-lg text-xs text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-2">
              <MessageSquare className="w-3 h-3" />
              Add Comment
            </button>
          </div>

          {/* Legend */}
          <div className="p-4 border-b">
            <h3 className="text-sm mb-3 flex items-center gap-2">
              <Info className="w-4 h-4" />
              Layer Types
            </h3>
            <div className="space-y-2">
              {layerTypes.map((layer) => (
                <div key={layer.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: layer.color }}
                    />
                    <span>{layer.name}</span>
                  </div>
                  <span className="text-gray-500 text-xs">{layer.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Node Details */}
          {selectedNode ? (
            <div className="p-4">
              <h3 className="text-sm mb-3">Node Details</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Name</p>
                  <p className="text-sm">{selectedNode.label}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Type</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: selectedNode.color }}
                    />
                    <p className="text-sm">{selectedNode.type}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500">ID</p>
                  <p className="text-sm font-mono text-gray-600">{selectedNode.id}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Position</p>
                  <p className="text-sm font-mono text-gray-600">
                    ({selectedNode.x}, {selectedNode.y})
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-2">Connections</p>
                  <div className="space-y-1">
                    <div className="text-xs">
                      <span className="text-gray-500">Incoming: </span>
                      <span className="text-gray-700">
                        {edges.filter((e) => e.to === selectedNode.id).length}
                      </span>
                    </div>
                    <div className="text-xs">
                      <span className="text-gray-500">Outgoing: </span>
                      <span className="text-gray-700">
                        {edges.filter((e) => e.from === selectedNode.id).length}
                      </span>
                    </div>
                  </div>
                </div>
                <button className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                  View Details
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500 text-sm">
              <Info className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p>Click on a node to view details</p>
            </div>
          )}

          {/* Statistics */}
          <div className="p-4 border-t">
            <h3 className="text-sm mb-3">Graph Statistics</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Total Nodes</span>
                <span>{nodes.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total Edges</span>
                <span>{edges.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Layers</span>
                <span>{layerTypes.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="absolute top-20 left-4 bg-white border rounded-lg shadow-lg p-4 w-64 z-10">
          <h3 className="text-sm mb-3">Filter by Layer Type</h3>
          <div className="space-y-2">
            {layerTypes.map((layer) => (
              <label key={layer.name} className="flex items-center gap-2 text-sm">
                <input type="checkbox" defaultChecked className="rounded" />
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: layer.color }}
                />
                <span>{layer.name}</span>
                <span className="text-gray-500 text-xs ml-auto">{layer.count}</span>
              </label>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t flex gap-2">
            <button className="flex-1 px-3 py-2 border rounded-lg text-sm hover:bg-gray-50">
              Clear All
            </button>
            <button className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}