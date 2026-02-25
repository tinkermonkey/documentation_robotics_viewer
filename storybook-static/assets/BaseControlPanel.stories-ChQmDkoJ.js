import{j as e}from"./iframe-DSSgKmXl.js";import{B as t}from"./BaseControlPanel-D-ZWsrS_.js";import{c as u}from"./createLucideIcon-CIvKt9yE.js";import{D as K}from"./download-GiEPQcXk.js";import"./preload-helper-Dp1pzeXC.js";import"./RenderPropErrorBoundary-C5UeOkUJ.js";import"./Card-dBO4-pIe.js";import"./create-theme-BOkxhGns.js";import"./Label-BgBB6PcL.js";import"./Button-DjdbHWkm.js";import"./x-BvdhAmd6.js";import"./Spinner-Al2eUyHo.js";/**
 * @license lucide-react v0.562.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Q=[["path",{d:"M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z",key:"1oefj6"}],["path",{d:"M14 2v5a1 1 0 0 0 1 1h5",key:"wfsgrz"}],["path",{d:"M10 12a1 1 0 0 0-1 1v1a1 1 0 0 1-1 1 1 1 0 0 1 1 1v1a1 1 0 0 0 1 1",key:"1oajmo"}],["path",{d:"M14 18a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1 1 1 0 0 1-1-1v-1a1 1 0 0 0-1-1",key:"mpwhp6"}]],U=u("file-braces",Q);/**
 * @license lucide-react v0.562.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const X=[["rect",{width:"18",height:"18",x:"3",y:"3",rx:"2",ry:"2",key:"1m3agn"}],["circle",{cx:"9",cy:"9",r:"2",key:"af1f0g"}],["path",{d:"m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21",key:"1xmnt7"}]],Y=u("image",X);/**
 * @license lucide-react v0.562.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Z=[["circle",{cx:"18",cy:"5",r:"3",key:"gq8acd"}],["circle",{cx:"6",cy:"12",r:"3",key:"w7nqdw"}],["circle",{cx:"18",cy:"19",r:"3",key:"1xt0gg"}],["line",{x1:"8.59",x2:"15.42",y1:"13.51",y2:"17.49",key:"47mynk"}],["line",{x1:"15.41",x2:"8.59",y1:"6.51",y2:"10.49",key:"1n3mei"}]],ee=u("share-2",Z),pe={title:"A Primitives / Panels and Sidebars / BaseControlPanel",parameters:{layout:"centered"}},a=[{value:"vertical",label:"Vertical",description:"Simple top-to-bottom layout"},{value:"hierarchical",label:"Hierarchical",description:"Tree-based layout with multiple levels"},{value:"force",label:"Force-Directed",description:"Physics-based layout for complex networks"},{value:"swimlane",label:"Swimlane",description:"Group elements by lanes or categories"}],l=[{type:"png",label:"PNG",icon:Y,onClick:()=>console.log("Export as PNG")},{type:"svg",label:"SVG",icon:ee,onClick:()=>console.log("Export as SVG")},{type:"json",label:"JSON",icon:U,onClick:()=>console.log("Export as JSON")},{type:"download",label:"Download",icon:K,onClick:()=>console.log("Download model")}],n={render:()=>e.jsx("div",{style:{width:"100%",maxWidth:320,padding:"20px",backgroundColor:"#f9fafb"},children:e.jsx(t,{selectedLayout:"vertical",onLayoutChange:o=>console.log("Layout changed to:",o),layoutOptions:a,onFitToView:()=>console.log("Fit to view clicked"),exportOptions:l,testId:"control-panel-demo"})})},s={render:()=>e.jsx("div",{style:{width:"100%",maxWidth:320,padding:"20px",backgroundColor:"#f9fafb"},children:e.jsx(t,{selectedLayout:"hierarchical",onLayoutChange:o=>console.log("Layout changed to:",o),layoutOptions:a,onFitToView:()=>console.log("Fit to view clicked"),focusModeEnabled:!1,onFocusModeToggle:o=>console.log("Focus mode toggled:",o),isHighlightingActive:!0,onClearHighlighting:()=>console.log("Clear highlighting clicked"),exportOptions:l,testId:"control-panel-focus-highlighting"})})},r={render:()=>e.jsx("div",{style:{width:"100%",maxWidth:320,padding:"20px",backgroundColor:"#f9fafb"},children:e.jsx(t,{selectedLayout:"force",onLayoutChange:o=>console.log("Layout changed to:",o),layoutOptions:a,onFitToView:()=>console.log("Fit to view clicked"),focusModeEnabled:!1,onFocusModeToggle:o=>console.log("Focus mode toggled:",o),hasChangesets:!0,changesetVisualizationEnabled:!1,onChangesetVisualizationToggle:o=>console.log("Changeset visualization toggled:",o),exportOptions:l,testId:"control-panel-changesets"})})},i={render:()=>e.jsx("div",{style:{width:"100%",maxWidth:320,padding:"20px",backgroundColor:"#f9fafb"},children:e.jsx(t,{selectedLayout:"swimlane",onLayoutChange:o=>console.log("Layout changed to:",o),layoutOptions:a,onFitToView:()=>console.log("Fit to view clicked"),isLayouting:!0,exportOptions:l,testId:"control-panel-layouting"})})},d={render:()=>e.jsx("div",{style:{width:"100%",maxWidth:320,padding:"20px",backgroundColor:"#f9fafb"},children:e.jsx(t,{selectedLayout:"vertical",onLayoutChange:o=>console.log("Layout changed to:",o),layoutOptions:a,onFitToView:()=>console.log("Fit to view clicked"),renderBeforeLayout:()=>e.jsx("div",{className:"p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm text-blue-700 dark:text-blue-300",children:"Custom render before layout selector"}),renderBetweenLayoutAndView:()=>e.jsx("div",{className:"p-2 bg-green-50 dark:bg-green-900/20 rounded text-sm text-green-700 dark:text-green-300",children:"Custom content between sections"}),exportOptions:l,testId:"control-panel-render-props"})})},c={render:()=>e.jsx("div",{style:{width:"100%",maxWidth:320,padding:"20px",backgroundColor:"#f9fafb"},children:e.jsx(t,{selectedLayout:"vertical",onLayoutChange:o=>console.log("Layout changed to:",o),layoutOptions:a,onFitToView:()=>console.log("Fit to view clicked"),exportOptions:l,testId:"control-panel-children",children:e.jsxs("div",{className:"space-y-2",children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 dark:text-gray-300",children:"Domain-Specific Controls"}),e.jsxs("div",{className:"flex gap-2",children:[e.jsx("button",{className:"flex-1 px-2 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800",children:"Option A"}),e.jsx("button",{className:"flex-1 px-2 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800",children:"Option B"})]})]})})})},g={render:()=>e.jsx("div",{style:{width:"100%",maxWidth:320,padding:"20px",backgroundColor:"#f9fafb"},children:e.jsx(t,{selectedLayout:"hierarchical",onLayoutChange:o=>console.log("Layout changed to:",o),layoutOptions:a,onFitToView:()=>console.log("Fit to view clicked"),focusModeEnabled:!0,onFocusModeToggle:o=>console.log("Focus mode toggled:",o),isHighlightingActive:!0,onClearHighlighting:()=>console.log("Clear highlighting clicked"),hasChangesets:!0,changesetVisualizationEnabled:!0,onChangesetVisualizationToggle:o=>console.log("Changeset visualization toggled:",o),exportOptions:l,testId:"control-panel-all-features",children:e.jsxs("div",{className:"space-y-2",children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 dark:text-gray-300",children:"Domain Controls"}),e.jsx("button",{className:"w-full px-2 py-1 text-sm bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded hover:bg-purple-200 dark:hover:bg-purple-800",children:"Custom Action"})]})})})};var p,h,y,m,b;n.parameters={...n.parameters,docs:{...(p=n.parameters)==null?void 0:p.docs,source:{originalSource:`{
  render: () => <div style={{
    width: '100%',
    maxWidth: 320,
    padding: '20px',
    backgroundColor: '#f9fafb'
  }}>
      <BaseControlPanel selectedLayout="vertical" onLayoutChange={layout => console.log('Layout changed to:', layout)} layoutOptions={layoutOptions} onFitToView={() => console.log('Fit to view clicked')} exportOptions={exportOptions} testId="control-panel-demo" />
    </div>
}`,...(y=(h=n.parameters)==null?void 0:h.docs)==null?void 0:y.source},description:{story:"Default story showing all control panel features",...(b=(m=n.parameters)==null?void 0:m.docs)==null?void 0:b.description}}};var x,f,v,k,w;s.parameters={...s.parameters,docs:{...(x=s.parameters)==null?void 0:x.docs,source:{originalSource:`{
  render: () => <div style={{
    width: '100%',
    maxWidth: 320,
    padding: '20px',
    backgroundColor: '#f9fafb'
  }}>
      <BaseControlPanel selectedLayout="hierarchical" onLayoutChange={layout => console.log('Layout changed to:', layout)} layoutOptions={layoutOptions} onFitToView={() => console.log('Fit to view clicked')} focusModeEnabled={false} onFocusModeToggle={enabled => console.log('Focus mode toggled:', enabled)} isHighlightingActive={true} onClearHighlighting={() => console.log('Clear highlighting clicked')} exportOptions={exportOptions} testId="control-panel-focus-highlighting" />
    </div>
}`,...(v=(f=s.parameters)==null?void 0:f.docs)==null?void 0:v.source},description:{story:"Story showing control panel with focus mode and highlighting",...(w=(k=s.parameters)==null?void 0:k.docs)==null?void 0:w.description}}};var C,L,F,O,j;r.parameters={...r.parameters,docs:{...(C=r.parameters)==null?void 0:C.docs,source:{originalSource:`{
  render: () => <div style={{
    width: '100%',
    maxWidth: 320,
    padding: '20px',
    backgroundColor: '#f9fafb'
  }}>
      <BaseControlPanel selectedLayout="force" onLayoutChange={layout => console.log('Layout changed to:', layout)} layoutOptions={layoutOptions} onFitToView={() => console.log('Fit to view clicked')} focusModeEnabled={false} onFocusModeToggle={enabled => console.log('Focus mode toggled:', enabled)} hasChangesets={true} changesetVisualizationEnabled={false} onChangesetVisualizationToggle={enabled => console.log('Changeset visualization toggled:', enabled)} exportOptions={exportOptions} testId="control-panel-changesets" />
    </div>
}`,...(F=(L=r.parameters)==null?void 0:L.docs)==null?void 0:F.source},description:{story:"Story showing control panel with changesets",...(j=(O=r.parameters)==null?void 0:O.docs)==null?void 0:j.description}}};var V,N,T,S,W;i.parameters={...i.parameters,docs:{...(V=i.parameters)==null?void 0:V.docs,source:{originalSource:`{
  render: () => <div style={{
    width: '100%',
    maxWidth: 320,
    padding: '20px',
    backgroundColor: '#f9fafb'
  }}>
      <BaseControlPanel selectedLayout="swimlane" onLayoutChange={layout => console.log('Layout changed to:', layout)} layoutOptions={layoutOptions} onFitToView={() => console.log('Fit to view clicked')} isLayouting={true} exportOptions={exportOptions} testId="control-panel-layouting" />
    </div>
}`,...(T=(N=i.parameters)==null?void 0:N.docs)==null?void 0:T.source},description:{story:"Story showing control panel during layout computation",...(W=(S=i.parameters)==null?void 0:S.docs)==null?void 0:W.description}}};var B,I,P,A,M;d.parameters={...d.parameters,docs:{...(B=d.parameters)==null?void 0:B.docs,source:{originalSource:`{
  render: () => <div style={{
    width: '100%',
    maxWidth: 320,
    padding: '20px',
    backgroundColor: '#f9fafb'
  }}>
      <BaseControlPanel selectedLayout="vertical" onLayoutChange={layout => console.log('Layout changed to:', layout)} layoutOptions={layoutOptions} onFitToView={() => console.log('Fit to view clicked')} renderBeforeLayout={() => <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm text-blue-700 dark:text-blue-300">
            Custom render before layout selector
          </div>} renderBetweenLayoutAndView={() => <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded text-sm text-green-700 dark:text-green-300">
            Custom content between sections
          </div>} exportOptions={exportOptions} testId="control-panel-render-props" />
    </div>
}`,...(P=(I=d.parameters)==null?void 0:I.docs)==null?void 0:P.source},description:{story:"Story showing control panel with render props for custom content",...(M=(A=d.parameters)==null?void 0:A.docs)==null?void 0:M.description}}};var E,z,D,H,_;c.parameters={...c.parameters,docs:{...(E=c.parameters)==null?void 0:E.docs,source:{originalSource:`{
  render: () => <div style={{
    width: '100%',
    maxWidth: 320,
    padding: '20px',
    backgroundColor: '#f9fafb'
  }}>
      <BaseControlPanel selectedLayout="vertical" onLayoutChange={layout => console.log('Layout changed to:', layout)} layoutOptions={layoutOptions} onFitToView={() => console.log('Fit to view clicked')} exportOptions={exportOptions} testId="control-panel-children">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Domain-Specific Controls
          </label>
          <div className="flex gap-2">
            <button className="flex-1 px-2 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800">
              Option A
            </button>
            <button className="flex-1 px-2 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800">
              Option B
            </button>
          </div>
        </div>
      </BaseControlPanel>
    </div>
}`,...(D=(z=c.parameters)==null?void 0:z.docs)==null?void 0:D.source},description:{story:"Story showing control panel with children slot",...(_=(H=c.parameters)==null?void 0:H.docs)==null?void 0:_.description}}};var G,R,q,J,$;g.parameters={...g.parameters,docs:{...(G=g.parameters)==null?void 0:G.docs,source:{originalSource:`{
  render: () => <div style={{
    width: '100%',
    maxWidth: 320,
    padding: '20px',
    backgroundColor: '#f9fafb'
  }}>
      <BaseControlPanel selectedLayout="hierarchical" onLayoutChange={layout => console.log('Layout changed to:', layout)} layoutOptions={layoutOptions} onFitToView={() => console.log('Fit to view clicked')} focusModeEnabled={true} onFocusModeToggle={enabled => console.log('Focus mode toggled:', enabled)} isHighlightingActive={true} onClearHighlighting={() => console.log('Clear highlighting clicked')} hasChangesets={true} changesetVisualizationEnabled={true} onChangesetVisualizationToggle={enabled => console.log('Changeset visualization toggled:', enabled)} exportOptions={exportOptions} testId="control-panel-all-features">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Domain Controls
          </label>
          <button className="w-full px-2 py-1 text-sm bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded hover:bg-purple-200 dark:hover:bg-purple-800">
            Custom Action
          </button>
        </div>
      </BaseControlPanel>
    </div>
}`,...(q=(R=g.parameters)==null?void 0:R.docs)==null?void 0:q.source},description:{story:"Story showing control panel with all features enabled",...($=(J=g.parameters)==null?void 0:J.docs)==null?void 0:$.description}}};const he=["Default","WithFocusAndHighlighting","WithChangesets","IsLayouting","WithRenderProps","WithChildren","AllFeatures"];export{g as AllFeatures,n as Default,i as IsLayouting,r as WithChangesets,c as WithChildren,s as WithFocusAndHighlighting,d as WithRenderProps,he as __namedExportsOrder,pe as default};
