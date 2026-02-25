import{j as e}from"./iframe-DSSgKmXl.js";import{L as o}from"./LoadingState-DZmQgDQh.js";import"./preload-helper-Dp1pzeXC.js";import"./Spinner-Al2eUyHo.js";import"./create-theme-BOkxhGns.js";import"./Card-dBO4-pIe.js";const f={title:"A Primitives / State Panels / LoadingState",parameters:{layout:"centered"}},a={render:()=>e.jsx(o,{message:"Loading application...",variant:"page"})},r={render:()=>e.jsx("div",{className:"w-96 bg-white border border-gray-200",children:e.jsx(o,{message:"Loading panel data...",variant:"panel"})})},s={render:()=>e.jsx("div",{className:"p-4 bg-white border border-gray-200",children:e.jsx(o,{message:"Processing...",variant:"inline"})})},n={render:()=>e.jsx(o,{})};var t,i,d;a.parameters={...a.parameters,docs:{...(t=a.parameters)==null?void 0:t.docs,source:{originalSource:`{
  render: () => <LoadingState message="Loading application..." variant="page" />
}`,...(d=(i=a.parameters)==null?void 0:i.docs)==null?void 0:d.source}}};var g,c,m;r.parameters={...r.parameters,docs:{...(g=r.parameters)==null?void 0:g.docs,source:{originalSource:`{
  render: () => <div className="w-96 bg-white border border-gray-200">
    <LoadingState message="Loading panel data..." variant="panel" />
  </div>
}`,...(m=(c=r.parameters)==null?void 0:c.docs)==null?void 0:m.source}}};var p,l,u;s.parameters={...s.parameters,docs:{...(p=s.parameters)==null?void 0:p.docs,source:{originalSource:`{
  render: () => <div className="p-4 bg-white border border-gray-200">
    <LoadingState message="Processing..." variant="inline" />
  </div>
}`,...(u=(l=s.parameters)==null?void 0:l.docs)==null?void 0:u.source}}};var L,v,b;n.parameters={...n.parameters,docs:{...(L=n.parameters)==null?void 0:L.docs,source:{originalSource:`{
  render: () => <LoadingState />
}`,...(b=(v=n.parameters)==null?void 0:v.docs)==null?void 0:b.source}}};const y=["PageLoading","PanelLoading","InlineLoading","DefaultMessage"];export{n as DefaultMessage,s as InlineLoading,a as PageLoading,r as PanelLoading,y as __namedExportsOrder,f as default};
