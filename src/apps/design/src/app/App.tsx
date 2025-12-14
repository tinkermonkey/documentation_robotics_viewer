import { ChevronRight, ChevronDown } from "lucide-react";
import { useState } from "react";
import GraphView from "./components/GraphView";
import CommentsPane from "./components/CommentsPane";

interface ModelLayer {
  name: string;
  count: number;
}

interface Element {
  name: string;
  count: number;
  typeDefinition: string;
  properties: {
    id: string;
    name: string;
    documentation: string;
    priority?: string;
    properties?: string;
  };
}

interface Comment {
  id: string;
  author: string;
  timestamp: string;
  text: string;
  references: Array<{ type: string; path: string }>;
}

const modelLayers: ModelLayer[] = [
  { name: "Motivation", count: 3 },
  { name: "Business", count: 9 },
  { name: "Security", count: 1 },
  { name: "Application", count: 53 },
  { name: "Technology", count: 21 },
  { name: "API", count: 16 },
  { name: "Data Model", count: 16 },
  { name: "Data Store", count: 1 },
  { name: "UX", count: 3 },
  { name: "Navigation", count: 3 },
  { name: "APM/Observability", count: 5 },
  { name: "Testing", count: 16 },
];

const elements: Element[] = [
  {
    name: "goal",
    count: 3,
    typeDefinition: "High-level statement of intent, direction, or desired end state",
    properties: {
      id: "(string)",
      name: "(string)",
      documentation: "(string)",
      priority: "",
      properties: "(object) - Cross-layer properties",
    },
  },
];

const jsonComments: Comment[] = [
  {
    id: "jc1",
    author: "Alex Rodriguez",
    timestamp: "1 hour ago",
    text: "The @elements[0].properties field needs validation. Please review the schema before merging.",
    references: [{ type: "json", path: "elements[0].properties" }],
  },
  {
    id: "jc2",
    author: "Jennifer Kim",
    timestamp: "3 hours ago",
    text: "Updated @Motivation.typeDefinition to align with the new specification document.",
    references: [{ type: "json", path: "Motivation.typeDefinition" }],
  },
  {
    id: "jc3",
    author: "David Park",
    timestamp: "Yesterday",
    text: "The @elements array structure is looking good. Can we add more examples for @goal.documentation?",
    references: [
      { type: "json", path: "elements" },
      { type: "json", path: "goal.documentation" },
    ],
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("model");
  const [activeSubTab, setActiveSubTab] = useState("json");
  const [expandedElement, setExpandedElement] = useState<string | null>("goal");
  const [expandedSections, setExpandedSections] = useState<{
    [key: string]: boolean;
  }>({});
  const [highlightedPath, setHighlightedPath] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleJsonReferenceClick = (reference: { type: string; path: string }) => {
    setHighlightedPath(reference.path);
    // Clear highlight after 3 seconds
    setTimeout(() => {
      setHighlightedPath(null);
    }, 3000);
  };

  const tabs = [
    { id: "spec", label: "Spec" },
    { id: "model", label: "Model" },
    { id: "motivation", label: "Motivation" },
    { id: "architecture", label: "Architecture" },
    { id: "changesets", label: "Changesets" },
    { id: "connected", label: "Connected", badge: "Connected" },
  ];

  const subTabs = [
    { id: "graph", label: "Graph" },
    { id: "json", label: "JSON" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="px-6 py-4">
          <h1 className="text-xl">Documentation Robotics Viewer</h1>
        </div>

        {/* Main Navigation Tabs */}
        <div className="px-6 border-b border-gray-200">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm relative ${
                  activeTab === tab.id
                    ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                    : "text-gray-500 hover:text-gray-600 hover:bg-gray-50"
                }`}
              >
                {tab.label}
                {tab.badge && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs bg-green-100 text-green-800">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Sub Navigation */}
        <div className="px-6">
          <div className="flex">
            {subTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`px-4 py-3 text-sm relative ${
                  activeSubTab === tab.id
                    ? "text-gray-900 border-b-2 border-gray-900"
                    : "text-gray-500 hover:text-gray-600"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-180px)]">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r overflow-y-auto">
          <div className="p-4 border-b">
            <div className="flex justify-between items-center">
              <h2 className="text-sm">Model Layers</h2>
              <span className="text-xs text-gray-500">12 items</span>
            </div>
          </div>
          <nav className="p-2">
            {modelLayers.map((layer) => (
              <div
                key={layer.name}
                className="flex justify-between items-center px-3 py-2 rounded hover:bg-gray-50 cursor-pointer"
              >
                <span className="text-sm">{layer.name}</span>
                <span className="text-xs text-gray-500">{layer.count}</span>
              </div>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {activeSubTab === "graph" ? (
            <GraphView />
          ) : (
            <div className="flex h-full">
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="max-w-5xl">
                  <h2 className="text-2xl mb-6">Motivation</h2>

                  {/* JSON View */}
                  <div className="bg-gray-900 rounded-lg p-4 mb-6 overflow-x-auto">
                    <pre className="text-sm text-gray-100">
                      <code>
                        {`{
  "layer": "Motivation",
  "elements": ${highlightedPath?.includes("elements") ? "[\n" : "[\n"}    {
      "name": ${highlightedPath?.includes("goal") ? '"goal"' : '"goal"'},
      "count": 3,
      "typeDefinition": ${highlightedPath?.includes("typeDefinition") ? '"High-level statement of intent, direction, or desired end state"' : '"High-level statement of intent, direction, or desired end state"'},
      "properties": {
        "id": "(string)",
        "name": "(string)",
        "documentation": ${highlightedPath?.includes("documentation") ? '"(string)"' : '"(string)"'},
        "priority": "",
        "properties": ${highlightedPath?.includes("elements[0].properties") ? '"(object) - Cross-layer properties"' : '"(object) - Cross-layer properties"'}
      }
    }
  ],
  "layerInfo": {
    "id": "Motivation",
    "elementCount": 3,
    "order": null
  }
}`}
                      </code>
                    </pre>
                  </div>

                  {/* Info Card */}
                  <div className="bg-white rounded-lg border p-4 mb-6">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Layer ID</p>
                        <p>Motivation</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Elements</p>
                        <p>3</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Order</p>
                        <p>N/A</p>
                      </div>
                    </div>
                  </div>

                  {/* Elements Section */}
                  <div className="mb-6">
                    <h3 className="text-lg mb-4">Elements (3)</h3>

                    {elements.map((element) => (
                      <div key={element.name} className="bg-white rounded-lg border p-4 mb-4">
                        <div
                          className="flex justify-between items-center cursor-pointer"
                          onClick={() =>
                            setExpandedElement(
                              expandedElement === element.name ? null : element.name
                            )
                          }
                        >
                          <div className="flex items-center gap-2">
                            {expandedElement === element.name ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                            <span>{element.name}</span>
                          </div>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-gray-100 text-gray-800">
                            {element.count}
                          </span>
                        </div>

                        {expandedElement === element.name && (
                          <div className="mt-4 space-y-4">
                            <div>
                              <p className="text-sm mb-2">
                                <strong>Type Definition:</strong>
                              </p>
                              <p className="text-sm text-gray-600">
                                {element.typeDefinition}
                              </p>
                            </div>

                            <div>
                              <p className="text-sm mb-2">
                                <strong>Properties:</strong>
                              </p>
                              <div className="bg-gray-50 p-3 rounded text-sm space-y-1">
                                <p>
                                  <code className="text-blue-600">id</code>{" "}
                                  <span className="text-gray-600">(string)</span>
                                </p>
                                <p>
                                  <code className="text-blue-600">name</code>{" "}
                                  <span className="text-gray-600">(string)</span>
                                </p>
                                <p>
                                  <code className="text-blue-600">documentation</code>{" "}
                                  <span className="text-gray-600">(string)</span>
                                </p>
                                <p>
                                  <code className="text-blue-600">priority</code>
                                </p>
                                <p>
                                  <code className="text-blue-600">properties</code>{" "}
                                  <span className="text-gray-600">
                                    (object) - Cross-layer properties
                                  </span>
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Collapsible Sections */}
                  <div className="space-y-2">
                    <div className="bg-white rounded-lg border p-4">
                      <div
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => toggleSection("visualize")}
                      >
                        {expandedSections.visualize ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                        <span>Visualize Architecture</span>
                      </div>
                      {expandedSections.visualize && (
                        <div className="mt-4 text-sm text-gray-600">
                          Architecture visualization content would appear here.
                        </div>
                      )}
                    </div>

                    <div className="bg-white rounded-lg border p-4">
                      <div
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => toggleSection("graphs")}
                      >
                        {expandedSections.graphs ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                        <span>Interactive Graphs</span>
                      </div>
                      {expandedSections.graphs && (
                        <div className="mt-4 text-sm text-gray-600">
                          Interactive graphs content would appear here.
                        </div>
                      )}
                    </div>

                    <div className="bg-white rounded-lg border p-4">
                      <div
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => toggleSection("embedded")}
                      >
                        {expandedSections.embedded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                        <span>Embedded Mode</span>
                      </div>
                      {expandedSections.embedded && (
                        <div className="mt-4 text-sm text-gray-600">
                          Embedded mode content would appear here.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Comments Pane for JSON View */}
              <aside className="w-80 bg-white border-l overflow-y-auto">
                <CommentsPane
                  comments={jsonComments}
                  onReferenceClick={handleJsonReferenceClick}
                />
                
                {/* JSON Path Info */}
                {highlightedPath && (
                  <div className="p-4 border-t bg-yellow-50 border-yellow-200">
                    <h3 className="text-sm mb-2 flex items-center gap-2 text-yellow-800">
                      <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
                      Highlighted Path
                    </h3>
                    <p className="text-xs font-mono text-yellow-900 bg-yellow-100 p-2 rounded">
                      {highlightedPath}
                    </p>
                  </div>
                )}
                
                {/* Schema Info */}
                <div className="p-4 border-t">
                  <h3 className="text-sm mb-3">Schema Info</h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Version</span>
                      <span className="font-mono">1.0.0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Last Modified</span>
                      <span>2 hours ago</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Valid</span>
                      <span className="text-green-600">✓ Yes</span>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}