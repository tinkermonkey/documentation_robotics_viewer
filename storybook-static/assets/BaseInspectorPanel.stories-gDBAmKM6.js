import{j as e}from"./iframe-DSSgKmXl.js";import{B as c,A as F,a as L}from"./BaseInspectorPanel-BBWNLuHC.js";import{c as M}from"./createLucideIcon-CIvKt9yE.js";import"./preload-helper-Dp1pzeXC.js";import"./RenderPropErrorBoundary-C5UeOkUJ.js";import"./Button-DjdbHWkm.js";import"./create-theme-BOkxhGns.js";import"./x-BvdhAmd6.js";import"./Card-dBO4-pIe.js";import"./Badge-4uEMzFcW.js";/**
 * @license lucide-react v0.562.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const _=[["path",{d:"M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0",key:"1nclc0"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]],O=M("eye",_),$={title:"A Primitives / Panels and Sidebars / BaseInspectorPanel",parameters:{layout:"centered"}};function m(){const t=new Map,o=new Map;return[{id:"node-1",name:"Strategic Goal",description:"Increase market share by 25%",type:"Goal",priority:"high"},{id:"node-2",name:"Digital Transformation",description:"Transform business processes digitally",type:"Outcome",priority:"high"},{id:"node-3",name:"API Integration",description:"Build API-first architecture",type:"Requirement",priority:"medium"},{id:"node-4",name:"Customer Satisfaction",description:"Improve customer satisfaction metrics",type:"Goal",priority:"high"},{id:"node-5",name:"Internal Constraint",description:"Limited budget allocation",type:"Constraint"}].forEach(d=>t.set(d.id,d)),[{id:"edge-1",sourceId:"node-1",targetId:"node-2",type:"influences",weight:.8},{id:"edge-2",sourceId:"node-2",targetId:"node-3",type:"realizes",weight:.9},{id:"edge-3",sourceId:"node-4",targetId:"node-3",type:"requires",weight:.7},{id:"edge-4",sourceId:"node-5",targetId:"node-1",type:"constrains",weight:.6}].forEach(d=>o.set(d.id,d)),{nodes:t,edges:o}}const i={render:()=>{const t=m();return e.jsx("div",{style:{width:"100%",height:600,border:"1px solid #e5e7eb",display:"flex"},children:e.jsx("div",{style:{width:"100%",maxWidth:400,borderRight:"1px solid #e5e7eb"},children:e.jsx(c,{selectedNodeId:"node-1",graph:t,onClose:()=>console.log("Close clicked"),renderElementDetails:s=>e.jsxs("div",{className:"space-y-2",children:[e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{className:"text-sm font-medium text-gray-600 dark:text-gray-400",children:"Name:"}),e.jsx("span",{className:"text-sm font-semibold",children:s.name})]}),s.description&&e.jsxs("div",{children:[e.jsx("span",{className:"text-sm font-medium text-gray-600 dark:text-gray-400",children:"Description:"}),e.jsx("p",{className:"text-sm mt-1",children:s.description})]}),e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{className:"text-sm font-medium text-gray-600 dark:text-gray-400",children:"Type:"}),e.jsx("span",{className:"text-sm",children:s.type})]}),s.priority&&e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{className:"text-sm font-medium text-gray-600 dark:text-gray-400",children:"Priority:"}),e.jsx("span",{className:"text-sm",children:s.priority})]})]}),getNodeName:s=>s.name,getEdgeType:s=>s.type,quickActions:[{id:"trace-up",title:"A Primitives / Panels and Sidebars / BaseInspectorPanel",icon:e.jsx(F,{className:"w-4 h-4"}),color:"gray",onClick:s=>console.log("Trace upstream:",s.id),description:"Show all elements that influence this element"},{id:"trace-down",title:"A Primitives / Panels and Sidebars / BaseInspectorPanel",icon:e.jsx(L,{className:"w-4 h-4"}),color:"gray",onClick:s=>console.log("Trace downstream:",s.id),description:"Show all elements influenced by this element"},{id:"focus",title:"A Primitives / Panels and Sidebars / BaseInspectorPanel",icon:e.jsx(O,{className:"w-4 h-4"}),color:"gray",onClick:s=>console.log("Focus on:",s.id),condition:s=>s.type==="Goal",description:"Dim other elements to focus on this one"}]})})})}},a={render:()=>{const t=m();return e.jsx("div",{style:{width:"100%",height:400,border:"1px solid #e5e7eb",display:"flex"},children:e.jsx("div",{style:{width:"100%",maxWidth:400,borderRight:"1px solid #e5e7eb"},children:e.jsx(c,{selectedNodeId:null,graph:t,onClose:()=>console.log("Close clicked"),renderElementDetails:o=>e.jsx("div",{children:o.name}),getNodeName:o=>o.name,getEdgeType:o=>o.type})})})}},n={render:()=>{const t=m();return e.jsx("div",{style:{width:"100%",height:600,border:"1px solid #e5e7eb",display:"flex"},children:e.jsx("div",{style:{width:"100%",maxWidth:400,borderRight:"1px solid #e5e7eb"},children:e.jsx(c,{selectedNodeId:"node-3",graph:t,onClose:()=>console.log("Close clicked"),renderElementDetails:s=>e.jsx("div",{className:"space-y-2",children:e.jsxs("div",{children:[e.jsx("span",{className:"text-sm font-medium text-gray-600 dark:text-gray-400",children:"Name:"}),e.jsx("p",{className:"text-sm font-semibold mt-1",children:s.name})]})}),getNodeName:s=>s.name,getEdgeType:s=>s.type,renderRelationshipBadge:s=>{var p;return e.jsx("div",{className:"mb-1",children:e.jsxs("span",{className:"text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded",children:[s.type," (",((p=s.weight)==null?void 0:p.toFixed(1))||"N/A",")"]})})}})})})}},r={render:()=>{const t=m();return e.jsx("div",{style:{width:"100%",height:700,border:"1px solid #e5e7eb",display:"flex"},children:e.jsx("div",{style:{width:"100%",maxWidth:400,borderRight:"1px solid #e5e7eb"},children:e.jsx(c,{selectedNodeId:"node-1",graph:t,onClose:()=>console.log("Close clicked"),renderElementDetails:s=>e.jsxs("div",{className:"space-y-2",children:[e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{className:"text-sm font-medium text-gray-600 dark:text-gray-400",children:"Name:"}),e.jsx("span",{className:"text-sm font-semibold",children:s.name})]}),e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{className:"text-sm font-medium text-gray-600 dark:text-gray-400",children:"Type:"}),e.jsx("span",{className:"text-sm",children:s.type})]})]}),getNodeName:s=>s.name,getEdgeType:s=>s.type,title:"Element Inspector"})})})}},l={render:()=>{const t=m();return e.jsx("div",{style:{width:"100%",height:600,border:"1px solid #e5e7eb",display:"flex"},children:e.jsx("div",{style:{width:"100%",maxWidth:400,borderRight:"1px solid #e5e7eb"},children:e.jsx(c,{selectedNodeId:"node-2",graph:t,onClose:()=>console.log("Close clicked"),renderElementDetails:s=>e.jsxs("div",{className:"space-y-2",children:[e.jsxs("div",{children:[e.jsx("span",{className:"text-sm font-medium text-gray-600 dark:text-gray-400",children:"Name:"}),e.jsx("p",{className:"text-sm font-semibold mt-1",children:s.name})]}),e.jsxs("div",{children:[e.jsx("span",{className:"text-sm font-medium text-gray-600 dark:text-gray-400",children:"Description:"}),e.jsx("p",{className:"text-sm mt-1",children:s.description})]})]}),getNodeName:s=>s.name,getEdgeType:s=>s.type,quickActions:[{id:"trace-up",title:"A Primitives / Panels and Sidebars / BaseInspectorPanel",icon:e.jsx(F,{className:"w-4 h-4"}),color:"gray",onClick:s=>console.log("Trace upstream:",s.id),condition:s=>s.type==="Goal"||s.type==="Outcome"},{id:"trace-down",title:"A Primitives / Panels and Sidebars / BaseInspectorPanel",icon:e.jsx(L,{className:"w-4 h-4"}),color:"gray",onClick:s=>console.log("Trace downstream:",s.id)},{id:"focus",title:"A Primitives / Panels and Sidebars / BaseInspectorPanel",icon:e.jsx(O,{className:"w-4 h-4"}),color:"blue",onClick:s=>console.log("Focus on:",s.id),condition:s=>s.priority==="high"}],title:"Outcome Inspector"})})})}};var g,h,x,y,N;i.parameters={...i.parameters,docs:{...(g=i.parameters)==null?void 0:g.docs,source:{originalSource:`{
  render: () => {
    const graph = createDemoGraph();
    const selectedNodeId = 'node-1';
    return <div style={{
      width: '100%',
      height: 600,
      border: '1px solid #e5e7eb',
      display: 'flex'
    }}>
        <div style={{
        width: '100%',
        maxWidth: 400,
        borderRight: '1px solid #e5e7eb'
      }}>
          <BaseInspectorPanel selectedNodeId={selectedNodeId} graph={graph} onClose={() => console.log('Close clicked')} renderElementDetails={(node: DemoNode) => <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Name:</span>
                  <span className="text-sm font-semibold">{node.name}</span>
                </div>
                {node.description && <div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Description:</span>
                    <p className="text-sm mt-1">{node.description}</p>
                  </div>}
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Type:</span>
                  <span className="text-sm">{node.type}</span>
                </div>
                {node.priority && <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Priority:</span>
                    <span className="text-sm">{node.priority}</span>
                  </div>}
              </div>} getNodeName={(node: DemoNode) => node.name} getEdgeType={(edge: DemoEdge) => edge.type} quickActions={[{
          id: 'trace-up',
          title: 'A Primitives / Panels and Sidebars / BaseInspectorPanel',
          icon: <ArrowUp className="w-4 h-4" />,
          color: 'gray' as const,
          onClick: (node: DemoNode) => console.log('Trace upstream:', node.id),
          description: 'Show all elements that influence this element'
        }, {
          id: 'trace-down',
          title: 'A Primitives / Panels and Sidebars / BaseInspectorPanel',
          icon: <ArrowDown className="w-4 h-4" />,
          color: 'gray' as const,
          onClick: (node: DemoNode) => console.log('Trace downstream:', node.id),
          description: 'Show all elements influenced by this element'
        }, {
          id: 'focus',
          title: 'A Primitives / Panels and Sidebars / BaseInspectorPanel',
          icon: <Eye className="w-4 h-4" />,
          color: 'gray' as const,
          onClick: (node: DemoNode) => console.log('Focus on:', node.id),
          condition: (node: DemoNode) => node.type === 'Goal',
          description: 'Dim other elements to focus on this one'
        }]} />
        </div>
      </div>;
  }
}`,...(x=(h=i.parameters)==null?void 0:h.docs)==null?void 0:x.source},description:{story:"Default story showing inspector panel with a selected node",...(N=(y=i.parameters)==null?void 0:y.docs)==null?void 0:N.description}}};var u,v,b,f,w;a.parameters={...a.parameters,docs:{...(u=a.parameters)==null?void 0:u.docs,source:{originalSource:`{
  render: () => {
    const graph = createDemoGraph();
    return <div style={{
      width: '100%',
      height: 400,
      border: '1px solid #e5e7eb',
      display: 'flex'
    }}>
        <div style={{
        width: '100%',
        maxWidth: 400,
        borderRight: '1px solid #e5e7eb'
      }}>
          <BaseInspectorPanel selectedNodeId={null} graph={graph} onClose={() => console.log('Close clicked')} renderElementDetails={(node: DemoNode) => <div>{node.name}</div>} getNodeName={(node: DemoNode) => node.name} getEdgeType={(edge: DemoEdge) => edge.type} />
        </div>
      </div>;
  }
}`,...(b=(v=a.parameters)==null?void 0:v.docs)==null?void 0:b.source},description:{story:"Story showing inspector panel with no element selected",...(w=(f=a.parameters)==null?void 0:f.docs)==null?void 0:w.description}}};var j,I,D,k,P;n.parameters={...n.parameters,docs:{...(j=n.parameters)==null?void 0:j.docs,source:{originalSource:`{
  render: () => {
    const graph = createDemoGraph();
    const selectedNodeId = 'node-3';
    return <div style={{
      width: '100%',
      height: 600,
      border: '1px solid #e5e7eb',
      display: 'flex'
    }}>
        <div style={{
        width: '100%',
        maxWidth: 400,
        borderRight: '1px solid #e5e7eb'
      }}>
          <BaseInspectorPanel selectedNodeId={selectedNodeId} graph={graph} onClose={() => console.log('Close clicked')} renderElementDetails={(node: DemoNode) => <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Name:</span>
                  <p className="text-sm font-semibold mt-1">{node.name}</p>
                </div>
              </div>} getNodeName={(node: DemoNode) => node.name} getEdgeType={(edge: DemoEdge) => edge.type} renderRelationshipBadge={(edge: DemoEdge) => <div className="mb-1">
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {edge.type} ({(edge.weight as number | undefined)?.toFixed(1) || 'N/A'})
                </span>
              </div>} />
        </div>
      </div>;
  }
}`,...(D=(I=n.parameters)==null?void 0:I.docs)==null?void 0:D.source},description:{story:"Story showing inspector panel with custom relationship badges",...(P=(k=n.parameters)==null?void 0:k.docs)==null?void 0:P.description}}};var C,E,A,S,B;r.parameters={...r.parameters,docs:{...(C=r.parameters)==null?void 0:C.docs,source:{originalSource:`{
  render: () => {
    const graph = createDemoGraph();
    const selectedNodeId = 'node-1';
    return <div style={{
      width: '100%',
      height: 700,
      border: '1px solid #e5e7eb',
      display: 'flex'
    }}>
        <div style={{
        width: '100%',
        maxWidth: 400,
        borderRight: '1px solid #e5e7eb'
      }}>
          <BaseInspectorPanel selectedNodeId={selectedNodeId} graph={graph} onClose={() => console.log('Close clicked')} renderElementDetails={(node: DemoNode) => <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Name:</span>
                  <span className="text-sm font-semibold">{node.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Type:</span>
                  <span className="text-sm">{node.type}</span>
                </div>
              </div>} getNodeName={(node: DemoNode) => node.name} getEdgeType={(edge: DemoEdge) => edge.type} title="Element Inspector" />
        </div>
      </div>;
  }
}`,...(A=(E=r.parameters)==null?void 0:E.docs)==null?void 0:A.source},description:{story:"Story showing inspector panel with multiple relationships",...(B=(S=r.parameters)==null?void 0:S.docs)==null?void 0:B.description}}};var T,R,G,W,q;l.parameters={...l.parameters,docs:{...(T=l.parameters)==null?void 0:T.docs,source:{originalSource:`{
  render: () => {
    const graph = createDemoGraph();
    const selectedNodeId = 'node-2';
    return <div style={{
      width: '100%',
      height: 600,
      border: '1px solid #e5e7eb',
      display: 'flex'
    }}>
        <div style={{
        width: '100%',
        maxWidth: 400,
        borderRight: '1px solid #e5e7eb'
      }}>
          <BaseInspectorPanel selectedNodeId={selectedNodeId} graph={graph} onClose={() => console.log('Close clicked')} renderElementDetails={(node: DemoNode) => <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Name:</span>
                  <p className="text-sm font-semibold mt-1">{node.name}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Description:</span>
                  <p className="text-sm mt-1">{node.description}</p>
                </div>
              </div>} getNodeName={(node: DemoNode) => node.name} getEdgeType={(edge: DemoEdge) => edge.type} quickActions={[{
          id: 'trace-up',
          title: 'A Primitives / Panels and Sidebars / BaseInspectorPanel',
          icon: <ArrowUp className="w-4 h-4" />,
          color: 'gray' as const,
          onClick: (node: DemoNode) => console.log('Trace upstream:', node.id),
          condition: (node: DemoNode) => node.type === 'Goal' || node.type === 'Outcome'
        }, {
          id: 'trace-down',
          title: 'A Primitives / Panels and Sidebars / BaseInspectorPanel',
          icon: <ArrowDown className="w-4 h-4" />,
          color: 'gray' as const,
          onClick: (node: DemoNode) => console.log('Trace downstream:', node.id)
        }, {
          id: 'focus',
          title: 'A Primitives / Panels and Sidebars / BaseInspectorPanel',
          icon: <Eye className="w-4 h-4" />,
          color: 'blue' as const,
          onClick: (node: DemoNode) => console.log('Focus on:', node.id),
          condition: (node: DemoNode) => node.priority === 'high'
        }]} title="Outcome Inspector" />
        </div>
      </div>;
  }
}`,...(G=(R=l.parameters)==null?void 0:R.docs)==null?void 0:G.source},description:{story:"Story showing inspector panel with conditional quick actions",...(q=(W=l.parameters)==null?void 0:W.docs)==null?void 0:q.description}}};const ee=["Default","NoSelection","CustomRelationshipBadges","MultipleRelationships","ConditionalQuickActions"];export{l as ConditionalQuickActions,n as CustomRelationshipBadges,i as Default,r as MultipleRelationships,a as NoSelection,ee as __namedExportsOrder,$ as default};
