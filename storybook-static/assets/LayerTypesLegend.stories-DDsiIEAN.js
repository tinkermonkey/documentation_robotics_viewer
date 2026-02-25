import{j as i}from"./iframe-DSSgKmXl.js";import{L as o}from"./LayerTypesLegend-BmoTnABJ.js";import"./preload-helper-Dp1pzeXC.js";import"./layerColors-Dv3sYeJV.js";import"./info-DDrpRE-p.js";import"./createLucideIcon-CIvKt9yE.js";const M={title:"A Primitives / State Panels / LayerTypesLegend",parameters:{layout:"centered"}},v={layers:{motivation:{id:"motivation",type:"motivation",name:"Motivation",elements:Array.from({length:5},(a,e)=>({id:`m${e}`,name:`Goal ${e}`,type:"Goal",layerId:"motivation",properties:{},visual:{position:{x:0,y:0},size:{width:100,height:50},style:{}}})),relationships:[]},business:{id:"business",type:"business",name:"Business",elements:Array.from({length:8},(a,e)=>({id:`b${e}`,name:`Req ${e}`,type:"Requirement",layerId:"business",properties:{},visual:{position:{x:0,y:0},size:{width:100,height:50},style:{}}})),relationships:[]}},version:"1.0",references:[]},s={render:()=>i.jsx("div",{className:"p-4 bg-white border border-gray-200 w-64",children:i.jsx(o,{model:v})})},r={render:()=>{const a={layers:{motivation:{id:"motivation",type:"motivation",name:"Motivation",elements:Array.from({length:5},(e,n)=>({id:`m${n}`,name:`Goal ${n}`,type:"Goal",layerId:"motivation",properties:{},visual:{position:{x:0,y:0},size:{width:100,height:50},style:{}}})),relationships:[]},business:{id:"business",type:"business",name:"Business",elements:Array.from({length:8},(e,n)=>({id:`b${n}`,name:`Req ${n}`,type:"Requirement",layerId:"business",properties:{},visual:{position:{x:0,y:0},size:{width:100,height:50},style:{}}})),relationships:[]},application:{id:"application",type:"application",name:"Application",elements:Array.from({length:12},(e,n)=>({id:`a${n}`,name:`App ${n}`,type:"Component",layerId:"application",properties:{},visual:{position:{x:0,y:0},size:{width:100,height:50},style:{}}})),relationships:[]}},version:"1.0",references:[]};return i.jsx("div",{className:"p-4 bg-white border border-gray-200 w-64",children:i.jsx(o,{model:a})})}},t={render:()=>i.jsx("div",{className:"p-4 bg-white border border-gray-200 w-64",children:i.jsx(o,{model:{layers:{},version:"1.0",references:[]}})})};var p,l,m;s.parameters={...s.parameters,docs:{...(p=s.parameters)==null?void 0:p.docs,source:{originalSource:`{
  render: () => <div className="p-4 bg-white border border-gray-200 w-64">
    <LayerTypesLegend model={mockModel} />
  </div>
}`,...(m=(l=s.parameters)==null?void 0:l.docs)==null?void 0:m.source}}};var d,y,c;r.parameters={...r.parameters,docs:{...(d=r.parameters)==null?void 0:d.docs,source:{originalSource:`{
  render: () => {
    const largeModel: MetaModel = {
      layers: {
        'motivation': {
          id: 'motivation',
          type: 'motivation',
          name: 'Motivation',
          elements: Array.from({
            length: 5
          }, (_, i) => ({
            id: \`m\${i}\`,
            name: \`Goal \${i}\`,
            type: 'Goal',
            layerId: 'motivation',
            properties: {},
            visual: {
              position: {
                x: 0,
                y: 0
              },
              size: {
                width: 100,
                height: 50
              },
              style: {}
            }
          })),
          relationships: []
        },
        'business': {
          id: 'business',
          type: 'business',
          name: 'Business',
          elements: Array.from({
            length: 8
          }, (_, i) => ({
            id: \`b\${i}\`,
            name: \`Req \${i}\`,
            type: 'Requirement',
            layerId: 'business',
            properties: {},
            visual: {
              position: {
                x: 0,
                y: 0
              },
              size: {
                width: 100,
                height: 50
              },
              style: {}
            }
          })),
          relationships: []
        },
        'application': {
          id: 'application',
          type: 'application',
          name: 'Application',
          elements: Array.from({
            length: 12
          }, (_, i) => ({
            id: \`a\${i}\`,
            name: \`App \${i}\`,
            type: 'Component',
            layerId: 'application',
            properties: {},
            visual: {
              position: {
                x: 0,
                y: 0
              },
              size: {
                width: 100,
                height: 50
              },
              style: {}
            }
          })),
          relationships: []
        }
      },
      version: '1.0',
      references: []
    };
    return <div className="p-4 bg-white border border-gray-200 w-64">
      <LayerTypesLegend model={largeModel} />
    </div>;
  }
}`,...(c=(y=r.parameters)==null?void 0:y.docs)==null?void 0:c.source}}};var h,u,g;t.parameters={...t.parameters,docs:{...(h=t.parameters)==null?void 0:h.docs,source:{originalSource:`{
  render: () => <div className="p-4 bg-white border border-gray-200 w-64">
    <LayerTypesLegend model={{
      layers: {},
      version: '1.0',
      references: []
    }} />
  </div>
}`,...(g=(u=t.parameters)==null?void 0:u.docs)==null?void 0:g.source}}};const L=["Default","ManyTypes","Empty"];export{s as Default,t as Empty,r as ManyTypes,L as __namedExportsOrder,M as default};
