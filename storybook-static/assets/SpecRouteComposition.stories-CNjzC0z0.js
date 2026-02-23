import{j as e}from"./iframe-DSSgKmXl.js";import{S as c}from"./SpecRouteComposition-ydhxeZ88.js";import{S as p}from"./StoryProviderWrapper-BL-U6IiI.js";import{c as m}from"./annotationFixtures-DVStLF4m.js";import{c as r,a as n}from"./specFixtures-D35YLsPK.js";import"./preload-helper-Dp1pzeXC.js";import"./SpecViewer-JnNNh-fJ.js";import"./ExpandableSection-DnwRdE3z.js";import"./createLucideIcon-CIvKt9yE.js";import"./MetadataGrid-_s-FIXyz.js";import"./Card-dBO4-pIe.js";import"./create-theme-BOkxhGns.js";import"./Badge-4uEMzFcW.js";import"./AnnotationPanel-CmH8HUm1.js";import"./annotationStore-C2enqPKJ.js";import"./errorTracker-DrR4A8t3.js";import"./react-fqQoFC2C.js";import"./modelStore-D8PMC_DL.js";import"./EmptyState-B6ktL3oV.js";import"./index-NvR17eTZ.js";import"./Button-DjdbHWkm.js";import"./LoadingState-DZmQgDQh.js";import"./Spinner-Al2eUyHo.js";import"./ErrorState-uaa9-pX2.js";import"./Alert-B-2krvq0.js";import"./BreadcrumbNav-DXCKxi7g.js";import"./chevron-right-icon-C4Btn_J9.js";import"./FilterPanel-C0Vy-Tax.js";import"./x-BvdhAmd6.js";import"./AccordionTitle-Cun89kOD.js";import"./chevron-down-icon-CIJfcLG8.js";import"./Label-BgBB6PcL.js";import"./ExportButtonGroup-C-LUBG8s.js";import"./LayerRightSidebar-BAszuvNY.js";import"./BaseInspectorPanel-BBWNLuHC.js";import"./RenderPropErrorBoundary-C5UeOkUJ.js";import"./BaseControlPanel-D-ZWsrS_.js";import"./GraphViewSidebar-BmDrn4TD.js";import"./NavigationErrorNotification-BQSize9i.js";import"./crossLayerStore-Bec5Tsd5.js";import"./floating-ui.react-CidLzX28.js";import"./index-B3kNdT8l.js";import"./index-CsUALWJS.js";import"./SchemaInfoPanel-DNnFYwqg.js";import"./SharedLayout-DpWmfBuq.js";import"./index-DzsatpJz.js";import"./index-DVMEuaP3.js";const fe={title:"E Compositions / Spec Compositions / SpecRouteComposition",parameters:{layout:"fullscreen"}},i={render:()=>e.jsx(p,{spec:r(),annotations:m(3),initialParams:{view:"graph"},children:e.jsx("div",{className:"h-screen w-screen",children:e.jsx(c,{specData:r(),activeView:"graph",selectedSchemaId:null,showRightSidebar:!0})})})},t={render:()=>e.jsx(p,{spec:r(),annotations:m(5),initialParams:{view:"json"},children:e.jsx("div",{className:"h-screen w-screen",children:e.jsx(c,{specData:r(),activeView:"json",selectedSchemaId:null,showRightSidebar:!0})})})},a={render:()=>e.jsx(p,{spec:n(),initialParams:{view:"graph"},children:e.jsx("div",{className:"h-screen w-screen",children:e.jsx(c,{specData:n(),activeView:"graph",selectedSchemaId:null,showRightSidebar:!0})})})},o={render:()=>e.jsx(p,{spec:r(),initialParams:{view:"graph"},children:e.jsx("div",{className:"h-screen w-screen",children:e.jsx(c,{specData:r(),activeView:"graph",selectedSchemaId:null,showRightSidebar:!1})})})},s={render:()=>e.jsx(p,{spec:r(),annotations:m(2),initialParams:{view:"graph"},children:e.jsx("div",{className:"h-screen w-screen",children:e.jsx(c,{specData:r(),activeView:"graph",selectedSchemaId:"goal",showRightSidebar:!0})})})};var d,l,h,S,u;i.parameters={...i.parameters,docs:{...(d=i.parameters)==null?void 0:d.docs,source:{originalSource:`{
  render: () => <StoryProviderWrapper spec={createCompleteSpecFixture()} annotations={createAnnotationListFixture(3)} initialParams={{
    view: 'graph'
  }}>
    <div className="h-screen w-screen">
      <SpecRouteComposition specData={createCompleteSpecFixture()} activeView="graph" selectedSchemaId={null} showRightSidebar={true} />
    </div>
  </StoryProviderWrapper>
}`,...(h=(l=i.parameters)==null?void 0:l.docs)==null?void 0:h.source},description:{story:`Graph View - Default
Full spec route composition with graph view showing schema relationships`,...(u=(S=i.parameters)==null?void 0:S.docs)==null?void 0:u.description}}};var w,v,g,x,j;t.parameters={...t.parameters,docs:{...(w=t.parameters)==null?void 0:w.docs,source:{originalSource:`{
  render: () => <StoryProviderWrapper spec={createCompleteSpecFixture()} annotations={createAnnotationListFixture(5)} initialParams={{
    view: 'json'
  }}>
    <div className="h-screen w-screen">
      <SpecRouteComposition specData={createCompleteSpecFixture()} activeView="json" selectedSchemaId={null} showRightSidebar={true} />
    </div>
  </StoryProviderWrapper>
}`,...(g=(v=t.parameters)==null?void 0:v.docs)==null?void 0:g.source},description:{story:`JSON View - Default
Full spec route composition with JSON viewer showing schema definitions`,...(j=(x=t.parameters)==null?void 0:x.docs)==null?void 0:j.description}}};var C,P,y,F,R;a.parameters={...a.parameters,docs:{...(C=a.parameters)==null?void 0:C.docs,source:{originalSource:`{
  render: () => <StoryProviderWrapper spec={createMinimalSpecFixture()} initialParams={{
    view: 'graph'
  }}>
    <div className="h-screen w-screen">
      <SpecRouteComposition specData={createMinimalSpecFixture()} activeView="graph" selectedSchemaId={null} showRightSidebar={true} />
    </div>
  </StoryProviderWrapper>
}`,...(y=(P=a.parameters)==null?void 0:P.docs)==null?void 0:y.source},description:{story:`Minimal Spec - Graph View
Shows minimal spec with only 5 basic schemas`,...(R=(F=a.parameters)==null?void 0:F.docs)==null?void 0:R.description}}};var N,V,b,f,W;o.parameters={...o.parameters,docs:{...(N=o.parameters)==null?void 0:N.docs,source:{originalSource:`{
  render: () => <StoryProviderWrapper spec={createCompleteSpecFixture()} initialParams={{
    view: 'graph'
  }}>
    <div className="h-screen w-screen">
      <SpecRouteComposition specData={createCompleteSpecFixture()} activeView="graph" selectedSchemaId={null} showRightSidebar={false} />
    </div>
  </StoryProviderWrapper>
}`,...(b=(V=o.parameters)==null?void 0:V.docs)==null?void 0:b.source},description:{story:`Compact - No Sidebar
Spec viewer with no right sidebar for compact testing`,...(W=(f=o.parameters)==null?void 0:f.docs)==null?void 0:W.description}}};var D,I,M,O,A;s.parameters={...s.parameters,docs:{...(D=s.parameters)==null?void 0:D.docs,source:{originalSource:`{
  render: () => <StoryProviderWrapper spec={createCompleteSpecFixture()} annotations={createAnnotationListFixture(2)} initialParams={{
    view: 'graph'
  }}>
    <div className="h-screen w-screen">
      <SpecRouteComposition specData={createCompleteSpecFixture()} activeView="graph" selectedSchemaId="goal" showRightSidebar={true} />
    </div>
  </StoryProviderWrapper>
}`,...(M=(I=s.parameters)==null?void 0:I.docs)==null?void 0:M.source},description:{story:`With Selected Schema
Spec view with a specific schema selected`,...(A=(O=s.parameters)==null?void 0:O.docs)==null?void 0:A.description}}};const We=["GraphView","JSONView","MinimalSpec","CompactNoSidebar","WithSelectedSchema"];export{o as CompactNoSidebar,i as GraphView,t as JSONView,a as MinimalSpec,s as WithSelectedSchema,We as __namedExportsOrder,fe as default};
