import{j as r}from"./iframe-DSSgKmXl.js";import{P as c}from"./ProcessInspectorPanel-D1QTp-BE.js";import"./preload-helper-Dp1pzeXC.js";import"./BaseInspectorPanel-BBWNLuHC.js";import"./RenderPropErrorBoundary-C5UeOkUJ.js";import"./Button-DjdbHWkm.js";import"./create-theme-BOkxhGns.js";import"./x-BvdhAmd6.js";import"./createLucideIcon-CIvKt9yE.js";import"./Card-dBO4-pIe.js";import"./Badge-4uEMzFcW.js";import"./layerColors-Dv3sYeJV.js";const z={title:"A Primitives / Panels and Sidebars / ProcessInspectorPanel",parameters:{layout:"centered"}},l={id:"process-1",type:"process",name:"Order Processing",description:"Main process for handling customer orders",metadata:{owner:"Sales Team",domain:"Sales",criticality:"high",lifecycle:"active",subprocessCount:5},hierarchyLevel:0,childIds:["process-2","function-1"],properties:{}},e={nodes:new Map([["process-1",l],["process-2",{id:"process-2",type:"process",name:"Payment Processing",metadata:{},hierarchyLevel:1,childIds:[],properties:{}}],["function-1",{id:"function-1",type:"function",name:"Validate Order",metadata:{},hierarchyLevel:1,childIds:[],properties:{}}],["service-1",{id:"service-1",type:"service",name:"Order Service",metadata:{},hierarchyLevel:0,childIds:[],properties:{}}]]),edges:new Map([["edge-1",{id:"edge-1",source:"process-1",sourceId:"process-1",target:"process-2",targetId:"process-2",type:"flows_to"}],["edge-2",{id:"edge-2",source:"process-2",sourceId:"process-2",target:"process-1",targetId:"process-1",type:"depends_on"}],["edge-3",{id:"edge-3",source:"process-1",sourceId:"process-1",target:"function-1",targetId:"function-1",type:"composes"}]]),crossLayerLinks:[{source:"process-1",sourceLayer:"business",target:"api-endpoint-1",targetLayer:"api",type:"implements"},{source:"process-1",sourceLayer:"business",target:"service-component-1",targetLayer:"application",type:"realized-by"}],indices:{byType:new Map([["process",new Set(["process-1","process-2"])]]),byDomain:new Map,byLifecycle:new Map,byCriticality:new Map},hierarchy:{maxDepth:2,rootNodes:["process-1","service-1"],leafNodes:["process-2","function-1"],nodesByLevel:new Map([[0,new Set(["process-1","service-1"])],[1,new Set(["process-2","function-1"])]]),parentChildMap:new Map([["process-1",["process-2","function-1"]]]),childParentMap:new Map([["process-2","process-1"],["function-1","process-1"]])},metrics:{nodeCount:4,edgeCount:3,averageConnectivity:1.5,maxHierarchyDepth:2,circularDependencies:[],orphanedNodes:[],criticalNodes:["process-1"]}},n={render:()=>r.jsx(c,{selectedNode:null,businessGraph:e,onTraceUpstream:()=>console.log("Trace upstream"),onTraceDownstream:()=>console.log("Trace downstream"),onIsolate:()=>console.log("Isolate")})},a={render:()=>r.jsx(c,{selectedNode:l,businessGraph:e,onTraceUpstream:()=>console.log("Trace upstream"),onTraceDownstream:()=>console.log("Trace downstream"),onIsolate:()=>console.log("Isolate"),onNavigateToCrossLayer:(s,o)=>console.log("Navigate to",s,o)})},t={render:()=>r.jsx(c,{selectedNode:l,businessGraph:e,onTraceUpstream:()=>console.log("Trace upstream"),onTraceDownstream:()=>console.log("Trace downstream"),onIsolate:()=>console.log("Isolate"),onNavigateToCrossLayer:(s,o)=>console.log("Navigate to",s,o)})},p={render:()=>{const s={id:"process-complex",type:"process",name:"Enterprise Integration Bus",description:"Centralized message broker and integration platform for all business services",metadata:{owner:"Integration Team",domain:"Infrastructure",criticality:"high",lifecycle:"active",subprocessCount:12},hierarchyLevel:0,childIds:["process-1","process-2"],properties:{}},o={nodes:new Map([...e.nodes,["process-complex",s]]),edges:new Map([...e.edges,["edge-complex-1",{id:"edge-complex-1",source:"process-complex",sourceId:"process-complex",target:"process-1",targetId:"process-1",type:"flows_to"}],["edge-complex-2",{id:"edge-complex-2",source:"process-complex",sourceId:"process-complex",target:"process-2",targetId:"process-2",type:"flows_to"}],["edge-complex-3",{id:"edge-complex-3",source:"service-1",sourceId:"service-1",target:"process-complex",targetId:"process-complex",type:"depends_on"}]]),crossLayerLinks:e.crossLayerLinks,indices:e.indices,hierarchy:e.hierarchy,metrics:e.metrics};return r.jsx(c,{selectedNode:s,businessGraph:o,onTraceUpstream:()=>console.log("Trace upstream"),onTraceDownstream:()=>console.log("Trace downstream"),onIsolate:()=>console.log("Isolate"),onNavigateToCrossLayer:(b,G)=>console.log("Navigate to",b,G)})}},i={render:()=>{const s={id:"function-1",type:"function",name:"Calculate Tax",description:"Computes applicable tax for order items",metadata:{owner:"Finance",domain:"Finance",criticality:"medium",lifecycle:"active"},hierarchyLevel:1,childIds:[],properties:{}};return r.jsx(c,{selectedNode:s,businessGraph:e,onTraceUpstream:()=>console.log("Trace upstream"),onTraceDownstream:()=>console.log("Trace downstream"),onIsolate:()=>console.log("Isolate")})}};var d,m,u;n.parameters={...n.parameters,docs:{...(d=n.parameters)==null?void 0:d.docs,source:{originalSource:`{
  render: () => <ProcessInspectorPanel selectedNode={null} businessGraph={mockBusinessGraph} onTraceUpstream={() => console.log('Trace upstream')} onTraceDownstream={() => console.log('Trace downstream')} onIsolate={() => console.log('Isolate')} />
}`,...(u=(m=n.parameters)==null?void 0:m.docs)==null?void 0:u.source}}};var g,y,h;a.parameters={...a.parameters,docs:{...(g=a.parameters)==null?void 0:g.docs,source:{originalSource:`{
  render: () => <ProcessInspectorPanel selectedNode={mockProcess} businessGraph={mockBusinessGraph} onTraceUpstream={() => console.log('Trace upstream')} onTraceDownstream={() => console.log('Trace downstream')} onIsolate={() => console.log('Isolate')} onNavigateToCrossLayer={(layer, id) => console.log('Navigate to', layer, id)} />
}`,...(h=(y=a.parameters)==null?void 0:y.docs)==null?void 0:h.source}}};var I,x,T;t.parameters={...t.parameters,docs:{...(I=t.parameters)==null?void 0:I.docs,source:{originalSource:`{
  render: () => <ProcessInspectorPanel selectedNode={mockProcess} businessGraph={mockBusinessGraph} onTraceUpstream={() => console.log('Trace upstream')} onTraceDownstream={() => console.log('Trace downstream')} onIsolate={() => console.log('Isolate')} onNavigateToCrossLayer={(layer, id) => console.log('Navigate to', layer, id)} />
}`,...(T=(x=t.parameters)==null?void 0:x.docs)==null?void 0:T.source}}};var w,v,f;p.parameters={...p.parameters,docs:{...(w=p.parameters)==null?void 0:w.docs,source:{originalSource:`{
  render: () => {
    const complexProcess: BusinessNode = {
      id: 'process-complex',
      type: 'process',
      name: 'Enterprise Integration Bus',
      description: 'Centralized message broker and integration platform for all business services',
      metadata: {
        owner: 'Integration Team',
        domain: 'Infrastructure',
        criticality: 'high',
        lifecycle: 'active',
        subprocessCount: 12
      },
      hierarchyLevel: 0,
      childIds: ['process-1', 'process-2'],
      properties: {}
    };
    const complexGraph: BusinessGraph = {
      nodes: new Map([...mockBusinessGraph.nodes, ['process-complex', complexProcess]]),
      edges: new Map([...mockBusinessGraph.edges, ['edge-complex-1', {
        id: 'edge-complex-1',
        source: 'process-complex',
        sourceId: 'process-complex',
        target: 'process-1',
        targetId: 'process-1',
        type: 'flows_to'
      }], ['edge-complex-2', {
        id: 'edge-complex-2',
        source: 'process-complex',
        sourceId: 'process-complex',
        target: 'process-2',
        targetId: 'process-2',
        type: 'flows_to'
      }], ['edge-complex-3', {
        id: 'edge-complex-3',
        source: 'service-1',
        sourceId: 'service-1',
        target: 'process-complex',
        targetId: 'process-complex',
        type: 'depends_on'
      }]]),
      crossLayerLinks: mockBusinessGraph.crossLayerLinks,
      indices: mockBusinessGraph.indices,
      hierarchy: mockBusinessGraph.hierarchy,
      metrics: mockBusinessGraph.metrics
    };
    return <ProcessInspectorPanel selectedNode={complexProcess} businessGraph={complexGraph} onTraceUpstream={() => console.log('Trace upstream')} onTraceDownstream={() => console.log('Trace downstream')} onIsolate={() => console.log('Isolate')} onNavigateToCrossLayer={(layer, id) => console.log('Navigate to', layer, id)} />;
  }
}`,...(f=(v=p.parameters)==null?void 0:v.docs)==null?void 0:f.source}}};var L,P,N;i.parameters={...i.parameters,docs:{...(L=i.parameters)==null?void 0:L.docs,source:{originalSource:`{
  render: () => {
    const simpleFunction: BusinessNode = {
      id: 'function-1',
      type: 'function',
      name: 'Calculate Tax',
      description: 'Computes applicable tax for order items',
      metadata: {
        owner: 'Finance',
        domain: 'Finance',
        criticality: 'medium',
        lifecycle: 'active'
      },
      hierarchyLevel: 1,
      childIds: [],
      properties: {}
    };
    return <ProcessInspectorPanel selectedNode={simpleFunction} businessGraph={mockBusinessGraph} onTraceUpstream={() => console.log('Trace upstream')} onTraceDownstream={() => console.log('Trace downstream')} onIsolate={() => console.log('Isolate')} />;
  }
}`,...(N=(P=i.parameters)==null?void 0:P.docs)==null?void 0:N.source}}};const W=["Default","ProcessSelected","ProcessWithCrossLayerLinks","ComplexProcess","SimpleFunction"];export{p as ComplexProcess,n as Default,a as ProcessSelected,t as ProcessWithCrossLayerLinks,i as SimpleFunction,W as __namedExportsOrder,z as default};
