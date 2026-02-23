import{r as f,j as e}from"./iframe-DSSgKmXl.js";import{G as c}from"./GraphViewer-BWCkNTd9.js";import{M as x}from"./ModelJSONViewer-BW2nBxFe.js";import{A as r}from"./AnnotationPanel-CmH8HUm1.js";import{S as g}from"./SchemaInfoPanel-DNnFYwqg.js";import{M as j}from"./ModelLayersSidebar-CT3sKMon.js";import{L as S}from"./LayerTypesLegend-BmoTnABJ.js";import{N as y}from"./NodeDetailsPanel-BwREUvBL.js";import{G as M}from"./GraphStatisticsPanel-ByYEKTZq.js";import{H as C}from"./HighlightedPathPanel-Dzv5U3Xj.js";import{S as L}from"./SharedLayout-DpWmfBuq.js";const i=f.memo(({model:o,specData:s,activeView:a,selectedLayerId:t,selectedNode:l,highlightedPath:n,onLayerSelect:d,onNodeClick:m,onPathHighlight:p,showLeftSidebar:h=!0,showRightSidebar:u=!0})=>e.jsx(L,{showLeftSidebar:h,showRightSidebar:u,leftSidebarContent:e.jsx(j,{selectedLayerId:t,onSelectLayer:d}),rightSidebarContent:a==="graph"?e.jsxs(e.Fragment,{children:[e.jsx(r,{}),e.jsx(S,{model:o}),e.jsx(y,{selectedNode:l,model:o}),e.jsx(M,{model:o})]}):e.jsxs(e.Fragment,{children:[e.jsx(r,{}),e.jsx(C,{highlightedPath:n}),e.jsx(g,{})]}),children:e.jsx("div",{className:"flex flex-col h-full overflow-hidden",children:a==="graph"?e.jsx(c,{model:o,onNodeClick:m,selectedLayerId:t}):e.jsx(x,{model:o,specData:s,onPathHighlight:p,selectedLayer:t})})}));i.displayName="ModelRouteComposition";i.__docgenInfo={description:`ModelRouteComposition
Displays the model viewer layout with sidebars and main content area

@example
<ModelRouteComposition
  model={createCompleteModelFixture()}
  activeView="graph"
  selectedLayerId="motivation"
  selectedNode={null}
  highlightedPath={null}
  onLayerSelect={(id) => console.log('Layer:', id)}
  onNodeClick={(node) => console.log('Node:', node)}
  onPathHighlight={(path) => console.log('Path:', path)}
/>`,methods:[],displayName:"ModelRouteComposition",props:{showLeftSidebar:{defaultValue:{value:"true",computed:!1},required:!1},showRightSidebar:{defaultValue:{value:"true",computed:!1},required:!1}}};export{i as M};
