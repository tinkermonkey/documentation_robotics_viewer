import{j as e}from"./iframe-DSSgKmXl.js";import{H as i}from"./HighlightedPathPanel-Dzv5U3Xj.js";import"./preload-helper-Dp1pzeXC.js";const y={title:"A Primitives / State Panels / HighlightedPathPanel",parameters:{layout:"centered"}},r={render:()=>e.jsx("div",{className:"w-80 bg-white border border-gray-200",children:e.jsx(i,{highlightedPath:"model.layers.motivation-layer.elements[3]"})})},a={render:()=>e.jsx("div",{className:"w-80 bg-white border border-gray-200",children:e.jsx(i,{highlightedPath:"model.layers.application-layer.elements[42].properties.capabilities[0].operations[2]"})})},t={render:()=>e.jsxs("div",{className:"w-80 bg-white border border-gray-200",children:[e.jsx(i,{highlightedPath:null}),e.jsx("div",{className:"p-4 text-sm text-gray-500",children:"Panel is hidden when path is null"})]})};var s,o,d;r.parameters={...r.parameters,docs:{...(s=r.parameters)==null?void 0:s.docs,source:{originalSource:`{
  render: () => <div className="w-80 bg-white border border-gray-200">
    <HighlightedPathPanel highlightedPath="model.layers.motivation-layer.elements[3]" />
  </div>
}`,...(d=(o=r.parameters)==null?void 0:o.docs)==null?void 0:d.source}}};var h,l,n;a.parameters={...a.parameters,docs:{...(h=a.parameters)==null?void 0:h.docs,source:{originalSource:`{
  render: () => <div className="w-80 bg-white border border-gray-200">
    <HighlightedPathPanel highlightedPath="model.layers.application-layer.elements[42].properties.capabilities[0].operations[2]" />
  </div>
}`,...(n=(l=a.parameters)==null?void 0:l.docs)==null?void 0:n.source}}};var m,g,c;t.parameters={...t.parameters,docs:{...(m=t.parameters)==null?void 0:m.docs,source:{originalSource:`{
  render: () => <div className="w-80 bg-white border border-gray-200">
    <HighlightedPathPanel highlightedPath={null} />
    <div className="p-4 text-sm text-gray-500">Panel is hidden when path is null</div>
  </div>
}`,...(c=(g=t.parameters)==null?void 0:g.docs)==null?void 0:c.source}}};const u=["WithPath","WithLongPath","NoPath"];export{t as NoPath,a as WithLongPath,r as WithPath,u as __namedExportsOrder,y as default};
