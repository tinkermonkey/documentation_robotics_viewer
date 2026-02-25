import{j as e}from"./iframe-DSSgKmXl.js";import{G as t}from"./GraphViewSidebar-BmDrn4TD.js";import"./preload-helper-Dp1pzeXC.js";import"./AccordionTitle-Cun89kOD.js";import"./create-theme-BOkxhGns.js";import"./chevron-down-icon-CIJfcLG8.js";const U={title:"A Primitives / Panels and Sidebars / GraphViewSidebar",parameters:{layout:"centered"}},r=()=>e.jsxs("div",{className:"space-y-3",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2",children:"Layer Visibility"}),e.jsx("div",{className:"space-y-2",children:["Business","Technology","Application"].map(x=>e.jsxs("label",{className:"flex items-center gap-2",children:[e.jsx("input",{type:"checkbox",defaultChecked:!0,className:"rounded"}),e.jsx("span",{className:"text-sm text-gray-600 dark:text-gray-400",children:x})]},x))})]}),e.jsxs("div",{children:[e.jsx("label",{htmlFor:"element-type-select",className:"block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2",children:"Element Type"}),e.jsxs("select",{id:"element-type-select",className:"w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700",children:[e.jsx("option",{children:"All Types"}),e.jsx("option",{children:"Services"}),e.jsx("option",{children:"Functions"})]})]})]}),s=()=>e.jsxs("div",{className:"space-y-3",children:[e.jsxs("div",{children:[e.jsx("label",{htmlFor:"layout-algorithm-select",className:"block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2",children:"Layout Algorithm"}),e.jsxs("select",{id:"layout-algorithm-select",className:"w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700",children:[e.jsx("option",{children:"Vertical"}),e.jsx("option",{children:"Hierarchical"}),e.jsx("option",{children:"Force-Directed"})]})]}),e.jsx("button",{className:"w-full px-3 py-2 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800",children:"Fit to View"})]}),c=()=>e.jsxs("div",{className:"space-y-2",children:[e.jsxs("div",{children:[e.jsx("span",{className:"text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase",children:"Name"}),e.jsx("p",{className:"text-sm font-medium text-gray-900 dark:text-white",children:"Order Processing Service"})]}),e.jsxs("div",{children:[e.jsx("span",{className:"text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase",children:"Type"}),e.jsx("p",{className:"text-sm text-gray-700 dark:text-gray-300",children:"Business Service"})]}),e.jsxs("div",{children:[e.jsx("span",{className:"text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase",children:"Description"}),e.jsx("p",{className:"text-sm text-gray-700 dark:text-gray-300",children:"Handles order processing and fulfillment"})]})]}),p=()=>e.jsxs("div",{className:"space-y-2",children:[e.jsxs("div",{className:"p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded",children:[e.jsx("p",{className:"text-xs font-semibold text-yellow-800 dark:text-yellow-300 mb-1",children:"Note"}),e.jsx("p",{className:"text-xs text-yellow-700 dark:text-yellow-300",children:"Needs performance optimization"})]}),e.jsxs("div",{className:"p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded",children:[e.jsx("p",{className:"text-xs font-semibold text-blue-800 dark:text-blue-300 mb-1",children:"TODO"}),e.jsx("p",{className:"text-xs text-blue-700 dark:text-blue-300",children:"Add caching layer"})]})]}),i={render:()=>e.jsx("div",{style:{width:"100%",height:600,border:"1px solid #e5e7eb",display:"flex"},children:e.jsx("div",{style:{width:"100%",maxWidth:320,overflow:"hidden"},children:e.jsx(t,{filterPanel:e.jsx(r,{}),controlPanel:e.jsx(s,{}),testId:"graph-view-sidebar-demo"})})})},o={render:()=>e.jsx("div",{style:{width:"100%",height:600,border:"1px solid #e5e7eb",display:"flex"},children:e.jsx("div",{style:{width:"100%",maxWidth:320,overflow:"hidden"},children:e.jsx(t,{filterPanel:e.jsx(r,{}),controlPanel:e.jsx(s,{}),inspectorContent:e.jsx(c,{}),inspectorVisible:!0,testId:"graph-view-sidebar-inspector"})})})},a={render:()=>e.jsx("div",{style:{width:"100%",height:600,border:"1px solid #e5e7eb",display:"flex"},children:e.jsx("div",{style:{width:"100%",maxWidth:320,overflow:"hidden"},children:e.jsx(t,{filterPanel:e.jsx(r,{}),controlPanel:e.jsx(s,{}),inspectorContent:e.jsx(c,{}),inspectorVisible:!0,annotationPanel:e.jsx(p,{}),testId:"graph-view-sidebar-annotations"})})})},n={render:()=>e.jsx("div",{style:{width:"100%",height:600,border:"1px solid #e5e7eb",display:"flex"},children:e.jsx("div",{style:{width:"100%",maxWidth:320,overflow:"hidden"},children:e.jsx(t,{filterPanel:e.jsx(r,{}),controlPanel:e.jsx(s,{}),inspectorContent:e.jsx(c,{}),inspectorVisible:!0,annotationPanel:e.jsx(p,{}),defaultOpenSections:["inspector","annotations"],testId:"graph-view-sidebar-custom-open"})})})},l={render:()=>e.jsx("div",{style:{width:"100%",height:500,border:"1px solid #e5e7eb",display:"flex"},children:e.jsx("div",{style:{width:"100%",maxWidth:320,overflow:"hidden"},children:e.jsx(t,{filterPanel:e.jsx(r,{}),controlPanel:e.jsx(s,{}),defaultOpenSections:["controls"],testId:"graph-view-sidebar-minimal"})})})},d={render:()=>e.jsx("div",{style:{width:"100%",height:800,border:"1px solid #e5e7eb",display:"flex"},children:e.jsx("div",{style:{width:"100%",maxWidth:320,overflow:"hidden"},children:e.jsx(t,{filterPanel:e.jsx(r,{}),controlPanel:e.jsx(s,{}),inspectorContent:e.jsx(c,{}),inspectorVisible:!0,annotationPanel:e.jsx(p,{}),defaultOpenSections:["inspector","filters","controls","annotations"],testId:"graph-view-sidebar-all-expanded"})})})};var h,m,b,y,u;i.parameters={...i.parameters,docs:{...(h=i.parameters)==null?void 0:h.docs,source:{originalSource:`{
  render: () => <div style={{
    width: '100%',
    height: 600,
    border: '1px solid #e5e7eb',
    display: 'flex'
  }}>
      <div style={{
      width: '100%',
      maxWidth: 320,
      overflow: 'hidden'
    }}>
        <GraphViewSidebar filterPanel={<DemoFilterPanel />} controlPanel={<DemoControlPanel />} testId="graph-view-sidebar-demo" />
      </div>
    </div>
}`,...(b=(m=i.parameters)==null?void 0:m.docs)==null?void 0:b.source},description:{story:"Default story showing filters and controls sections",...(u=(y=i.parameters)==null?void 0:y.docs)==null?void 0:u.description}}};var v,g,j,w,f;o.parameters={...o.parameters,docs:{...(v=o.parameters)==null?void 0:v.docs,source:{originalSource:`{
  render: () => <div style={{
    width: '100%',
    height: 600,
    border: '1px solid #e5e7eb',
    display: 'flex'
  }}>
      <div style={{
      width: '100%',
      maxWidth: 320,
      overflow: 'hidden'
    }}>
        <GraphViewSidebar filterPanel={<DemoFilterPanel />} controlPanel={<DemoControlPanel />} inspectorContent={<DemoInspectorContent />} inspectorVisible={true} testId="graph-view-sidebar-inspector" />
      </div>
    </div>
}`,...(j=(g=o.parameters)==null?void 0:g.docs)==null?void 0:j.source},description:{story:"Story showing all sections including inspector",...(f=(w=o.parameters)==null?void 0:w.docs)==null?void 0:f.description}}};var P,S,D,k,N;a.parameters={...a.parameters,docs:{...(P=a.parameters)==null?void 0:P.docs,source:{originalSource:`{
  render: () => <div style={{
    width: '100%',
    height: 600,
    border: '1px solid #e5e7eb',
    display: 'flex'
  }}>
      <div style={{
      width: '100%',
      maxWidth: 320,
      overflow: 'hidden'
    }}>
        <GraphViewSidebar filterPanel={<DemoFilterPanel />} controlPanel={<DemoControlPanel />} inspectorContent={<DemoInspectorContent />} inspectorVisible={true} annotationPanel={<DemoAnnotationPanel />} testId="graph-view-sidebar-annotations" />
      </div>
    </div>
}`,...(D=(S=a.parameters)==null?void 0:S.docs)==null?void 0:D.source},description:{story:"Story showing all sections including annotations",...(N=(k=a.parameters)==null?void 0:k.docs)==null?void 0:N.description}}};var C,I,V,W,A;n.parameters={...n.parameters,docs:{...(C=n.parameters)==null?void 0:C.docs,source:{originalSource:`{
  render: () => <div style={{
    width: '100%',
    height: 600,
    border: '1px solid #e5e7eb',
    display: 'flex'
  }}>
      <div style={{
      width: '100%',
      maxWidth: 320,
      overflow: 'hidden'
    }}>
        <GraphViewSidebar filterPanel={<DemoFilterPanel />} controlPanel={<DemoControlPanel />} inspectorContent={<DemoInspectorContent />} inspectorVisible={true} annotationPanel={<DemoAnnotationPanel />} defaultOpenSections={['inspector', 'annotations']} testId="graph-view-sidebar-custom-open" />
      </div>
    </div>
}`,...(V=(I=n.parameters)==null?void 0:I.docs)==null?void 0:V.source},description:{story:"Story with custom default open sections",...(A=(W=n.parameters)==null?void 0:W.docs)==null?void 0:A.description}}};var F,O,G,E,T;l.parameters={...l.parameters,docs:{...(F=l.parameters)==null?void 0:F.docs,source:{originalSource:`{
  render: () => <div style={{
    width: '100%',
    height: 500,
    border: '1px solid #e5e7eb',
    display: 'flex'
  }}>
      <div style={{
      width: '100%',
      maxWidth: 320,
      overflow: 'hidden'
    }}>
        <GraphViewSidebar filterPanel={<DemoFilterPanel />} controlPanel={<DemoControlPanel />} defaultOpenSections={['controls']} testId="graph-view-sidebar-minimal" />
      </div>
    </div>
}`,...(G=(O=l.parameters)==null?void 0:O.docs)==null?void 0:G.source},description:{story:"Story showing only controls and filters (no inspector or annotations)",...(T=(E=l.parameters)==null?void 0:E.docs)==null?void 0:T.description}}};var B,H,L,M,_;d.parameters={...d.parameters,docs:{...(B=d.parameters)==null?void 0:B.docs,source:{originalSource:`{
  render: () => <div style={{
    width: '100%',
    height: 800,
    border: '1px solid #e5e7eb',
    display: 'flex'
  }}>
      <div style={{
      width: '100%',
      maxWidth: 320,
      overflow: 'hidden'
    }}>
        <GraphViewSidebar filterPanel={<DemoFilterPanel />} controlPanel={<DemoControlPanel />} inspectorContent={<DemoInspectorContent />} inspectorVisible={true} annotationPanel={<DemoAnnotationPanel />} defaultOpenSections={['inspector', 'filters', 'controls', 'annotations']} testId="graph-view-sidebar-all-expanded" />
      </div>
    </div>
}`,...(L=(H=d.parameters)==null?void 0:H.docs)==null?void 0:L.source},description:{story:"Story with all sections visible and all open",...(_=(M=d.parameters)==null?void 0:M.docs)==null?void 0:_.description}}};const X=["Default","WithInspector","WithAnnotations","CustomDefaultOpen","MinimalSidebar","AllSectionsExpanded"];export{d as AllSectionsExpanded,n as CustomDefaultOpen,i as Default,l as MinimalSidebar,a as WithAnnotations,o as WithInspector,X as __namedExportsOrder,U as default};
