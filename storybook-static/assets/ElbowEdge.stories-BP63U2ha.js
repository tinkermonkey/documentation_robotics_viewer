import{j as e,r as F}from"./iframe-DSSgKmXl.js";import{M as L,R as P,u as W,a as z,i as I,H as s,P as o}from"./index-DzsatpJz.js";/* empty css              */import{E as M}from"./ElbowEdge-BkIQb77y.js";import"./preload-helper-Dp1pzeXC.js";import"./index-DVMEuaP3.js";import"./index-B3kNdT8l.js";import"./index-CsUALWJS.js";import"./useNavigate-CEEZa2t9.js";import"./layerColors-Dv3sYeJV.js";import"./crossLayerStore-Bec5Tsd5.js";import"./react-fqQoFC2C.js";const ne={title:"C Graphs / Edges / Base / ElbowEdge",parameters:{layout:"fullscreen"}},v=F.memo(({data:a})=>e.jsxs("div",{style:{width:180,height:110,border:"2px solid #d97706",borderRadius:8,background:"#fbbf24",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"system-ui, sans-serif",fontSize:14,fontWeight:600,color:"#1f2937"},children:[e.jsx(s,{type:"source",position:o.Top,id:"top",style:{background:"#d97706"}}),e.jsx(s,{type:"target",position:o.Bottom,id:"bottom",style:{background:"#d97706"}}),e.jsx(s,{type:"target",position:o.Left,id:"left",style:{background:"#d97706"}}),e.jsx(s,{type:"source",position:o.Right,id:"right",style:{background:"#d97706"}}),a.label]}));v.displayName="DemoNode";const U={demo:v},V={elbow:M},q=[{id:"source",type:"demo",position:{x:50,y:250},data:{label:"Node A"}},{id:"target",type:"demo",position:{x:350,y:50},data:{label:"Node B"}}];function J({edge:a}){const[H]=W(q),[T]=z([a]);return e.jsx(I,{nodes:H,edges:T,nodeTypes:U,edgeTypes:V,fitView:!0,fitViewOptions:{padding:.3},panOnDrag:!1,zoomOnScroll:!1,nodesDraggable:!1,elementsSelectable:!1,nodesFocusable:!1})}function r({edge:a}){return e.jsx(P,{children:e.jsx("div",{style:{width:"100%",height:"100vh",background:"#f9fafb"},children:e.jsx(J,{edge:a})})})}const t={id:"e1",source:"source",target:"target",type:"elbow",sourceHandle:"top",targetHandle:"bottom",markerEnd:L.ArrowClosed},n={render:()=>e.jsx(r,{edge:t})},d={render:()=>e.jsx(r,{edge:{...t,id:"e2",animated:!0}})},i={render:()=>e.jsx(r,{edge:{...t,id:"e3",label:"connection"}})},c={render:()=>e.jsx(r,{edge:{...t,id:"e4",selected:!0}})},p={render:()=>e.jsx(r,{edge:{...t,id:"e5",data:{changesetOperation:"add"}}})},m={render:()=>e.jsx(r,{edge:{...t,id:"e6",data:{changesetOperation:"update"}}})},l={render:()=>e.jsx(r,{edge:{...t,id:"e7",data:{changesetOperation:"delete"}}})};var g,u,h;n.parameters={...n.parameters,docs:{...(g=n.parameters)==null?void 0:g.docs,source:{originalSource:`{
  render: () => <GraphDemo edge={BASE_EDGE} />
}`,...(h=(u=n.parameters)==null?void 0:u.docs)==null?void 0:h.source}}};var E,f,b;d.parameters={...d.parameters,docs:{...(E=d.parameters)==null?void 0:E.docs,source:{originalSource:`{
  render: () => <GraphDemo edge={{
    ...BASE_EDGE,
    id: 'e2',
    animated: true
  }} />
}`,...(b=(f=d.parameters)==null?void 0:f.docs)==null?void 0:b.source}}};var x,D,y;i.parameters={...i.parameters,docs:{...(x=i.parameters)==null?void 0:x.docs,source:{originalSource:`{
  render: () => <GraphDemo edge={{
    ...BASE_EDGE,
    id: 'e3',
    label: 'connection'
  }} />
}`,...(y=(D=i.parameters)==null?void 0:D.docs)==null?void 0:y.source}}};var S,j,G;c.parameters={...c.parameters,docs:{...(S=c.parameters)==null?void 0:S.docs,source:{originalSource:`{
  render: () => <GraphDemo edge={{
    ...BASE_EDGE,
    id: 'e4',
    selected: true
  }} />
}`,...(G=(j=c.parameters)==null?void 0:j.docs)==null?void 0:G.source}}};var A,B,O;p.parameters={...p.parameters,docs:{...(A=p.parameters)==null?void 0:A.docs,source:{originalSource:`{
  render: () => <GraphDemo edge={{
    ...BASE_EDGE,
    id: 'e5',
    data: {
      changesetOperation: 'add'
    }
  }} />
}`,...(O=(B=p.parameters)==null?void 0:B.docs)==null?void 0:O.source}}};var w,_,C;m.parameters={...m.parameters,docs:{...(w=m.parameters)==null?void 0:w.docs,source:{originalSource:`{
  render: () => <GraphDemo edge={{
    ...BASE_EDGE,
    id: 'e6',
    data: {
      changesetOperation: 'update'
    }
  }} />
}`,...(C=(_=m.parameters)==null?void 0:_.docs)==null?void 0:C.source}}};var k,N,R;l.parameters={...l.parameters,docs:{...(k=l.parameters)==null?void 0:k.docs,source:{originalSource:`{
  render: () => <GraphDemo edge={{
    ...BASE_EDGE,
    id: 'e7',
    data: {
      changesetOperation: 'delete'
    }
  }} />
}`,...(R=(N=l.parameters)==null?void 0:N.docs)==null?void 0:R.source}}};const de=["Default","Animated","WithLabel","Selected","ChangesetAdd","ChangesetUpdate","ChangesetDelete"];export{d as Animated,p as ChangesetAdd,l as ChangesetDelete,m as ChangesetUpdate,n as Default,c as Selected,i as WithLabel,de as __namedExportsOrder,ne as default};
