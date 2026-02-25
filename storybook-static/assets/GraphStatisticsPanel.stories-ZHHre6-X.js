import{j as r}from"./iframe-DSSgKmXl.js";import{G as n}from"./GraphStatisticsPanel-ByYEKTZq.js";import"./preload-helper-Dp1pzeXC.js";const $={title:"A Primitives / State Panels / GraphStatisticsPanel",parameters:{layout:"centered"}},G={layers:{"motivation-layer":{id:"motivation-layer",type:"motivation",name:"Motivation",elements:[{id:"1",type:"Goal",name:"Goal 1",layerId:"motivation-layer",properties:{},visual:{position:{x:0,y:0},size:{width:100,height:50},style:{}}},{id:"2",type:"Goal",name:"Goal 2",layerId:"motivation-layer",properties:{},visual:{position:{x:0,y:0},size:{width:100,height:50},style:{}}}],relationships:[{id:"r1",sourceId:"1",targetId:"2",type:"influences"}]}},version:"1.0",references:[]},w={layers:{"motivation-layer":{id:"motivation-layer",type:"motivation",name:"Motivation",elements:Array.from({length:25},(a,e)=>({id:`goal-${e}`,type:"Goal",name:`Goal ${e+1}`,layerId:"motivation-layer",properties:{},visual:{position:{x:0,y:0},size:{width:100,height:50},style:{}}})),relationships:Array.from({length:40},(a,e)=>({id:`r-${e}`,sourceId:`goal-${e%25}`,targetId:`goal-${(e+1)%25}`,type:"influences"}))},"business-layer":{id:"business-layer",type:"business",name:"Business",elements:Array.from({length:30},(a,e)=>({id:`process-${e}`,type:"BusinessProcess",name:`Process ${e+1}`,layerId:"business-layer",properties:{},visual:{position:{x:0,y:0},size:{width:100,height:50},style:{}}})),relationships:Array.from({length:35},(a,e)=>({id:`rb-${e}`,sourceId:`process-${e%30}`,targetId:`process-${(e+1)%30}`,type:"flow"}))},"application-layer":{id:"application-layer",type:"application",name:"Application",elements:Array.from({length:20},(a,e)=>({id:`app-${e}`,type:"ApplicationComponent",name:`Component ${e+1}`,layerId:"application-layer",properties:{},visual:{position:{x:0,y:0},size:{width:100,height:50},style:{}}})),relationships:Array.from({length:28},(a,e)=>({id:`ra-${e}`,sourceId:`app-${e%20}`,targetId:`app-${(e+1)%20}`,type:"serves"}))}},version:"1.0",references:[]},s={render:()=>r.jsx("div",{className:"w-80 bg-white",children:r.jsx(n,{model:G})})},t={render:()=>r.jsx("div",{className:"w-80 bg-white",children:r.jsx(n,{model:w})})},i={render:()=>r.jsx("div",{className:"w-80 bg-white",children:r.jsx(n,{model:{layers:{},version:"1.0",references:[]}})})},o={render:()=>r.jsxs("div",{className:"w-80 bg-gray-50 border border-gray-200",children:[r.jsxs("div",{className:"p-4 bg-white",children:[r.jsx("h3",{className:"text-lg font-semibold mb-2",children:"Graph View"}),r.jsx("p",{className:"text-sm text-gray-600",children:"Other sidebar content here..."})]}),r.jsx(n,{model:w})]})};var l,d,p;s.parameters={...s.parameters,docs:{...(l=s.parameters)==null?void 0:l.docs,source:{originalSource:`{
  render: () => <div className="w-80 bg-white">
    <GraphStatisticsPanel model={mockModelSmall} />
  </div>
}`,...(p=(d=s.parameters)==null?void 0:d.docs)==null?void 0:p.source}}};var m,c,h;t.parameters={...t.parameters,docs:{...(m=t.parameters)==null?void 0:m.docs,source:{originalSource:`{
  render: () => <div className="w-80 bg-white">
    <GraphStatisticsPanel model={mockModelLarge} />
  </div>
}`,...(h=(c=t.parameters)==null?void 0:c.docs)==null?void 0:h.source}}};var y,g,v;i.parameters={...i.parameters,docs:{...(y=i.parameters)==null?void 0:y.docs,source:{originalSource:`{
  render: () => <div className="w-80 bg-white">
    <GraphStatisticsPanel model={{
      layers: {},
      version: '1.0',
      references: []
    }} />
  </div>
}`,...(v=(g=i.parameters)==null?void 0:g.docs)==null?void 0:v.source}}};var u,b,x;o.parameters={...o.parameters,docs:{...(u=o.parameters)==null?void 0:u.docs,source:{originalSource:`{
  render: () => <div className="w-80 bg-gray-50 border border-gray-200">
    <div className="p-4 bg-white">
      <h3 className="text-lg font-semibold mb-2">Graph View</h3>
      <p className="text-sm text-gray-600">Other sidebar content here...</p>
    </div>
    <GraphStatisticsPanel model={mockModelLarge} />
  </div>
}`,...(x=(b=o.parameters)==null?void 0:b.docs)==null?void 0:x.source}}};const N=["SmallGraph","LargeGraph","EmptyGraph","InSidebar"];export{i as EmptyGraph,o as InSidebar,t as LargeGraph,s as SmallGraph,N as __namedExportsOrder,$ as default};
