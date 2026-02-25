import{r as s,j as e}from"./iframe-DSSgKmXl.js";import{S as r}from"./SpecViewer-JnNNh-fJ.js";import{A as p}from"./AnnotationPanel-CmH8HUm1.js";import{S as n}from"./SchemaInfoPanel-DNnFYwqg.js";import{S as m}from"./SharedLayout-DpWmfBuq.js";const o=s.memo(({specData:t,selectedSchemaId:a,showRightSidebar:i=!0})=>e.jsx(m,{showLeftSidebar:!1,showRightSidebar:i,rightSidebarContent:e.jsxs(e.Fragment,{children:[e.jsx(p,{}),e.jsx(n,{})]}),children:e.jsx(r,{specData:t,selectedSchemaId:a})}));o.displayName="SpecRouteComposition";o.__docgenInfo={description:`SpecRouteComposition
Displays the spec viewer layout with sidebar and main content area

@example
<SpecRouteComposition
  specData={createCompleteSpecFixture()}
  activeView="graph"
  selectedSchemaId={null}
  onViewChange={(view) => console.log('View:', view)}
/>`,methods:[],displayName:"SpecRouteComposition",props:{showRightSidebar:{defaultValue:{value:"true",computed:!1},required:!1}}};export{o as S};
