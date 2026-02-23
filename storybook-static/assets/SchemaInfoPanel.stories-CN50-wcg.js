import{j as n,r as O}from"./iframe-DSSgKmXl.js";import{S as V}from"./SchemaInfoPanel-DNnFYwqg.js";import{u as c}from"./modelStore-D8PMC_DL.js";import"./preload-helper-Dp1pzeXC.js";import"./react-fqQoFC2C.js";const W={title:"B Details / Spec Details / SchemaInfoPanel",parameters:{layout:"centered"}};function o({model:e}){return O.useEffect(()=>(c.setState({model:e,loading:!1,error:null}),()=>{c.setState({model:null,loading:!1,error:null})}),[e]),n.jsx(V,{})}const t={render:()=>{const e={version:"1.0.0",layers:{motivation:{id:"motivation",type:"Motivation",name:"Motivation Layer",description:"Stakeholders, drivers, and goals",order:1,elements:[{id:"goal-1",type:"Goal",name:"Increase Revenue",layerId:"motivation",description:"Primary business objective",properties:{fill:"#a78bfa",stroke:"#7c3aed"},visual:{position:{x:0,y:0},size:{width:160,height:80},style:{}},relationships:{incoming:[],outgoing:[]}}],relationships:[]}},references:[],metadata:{version:"1.0.0",schemaVersion:"2.0",lastModified:new Date().toISOString(),valid:!0,elementCount:1,validationErrors:[]}};return n.jsx(o,{model:e})}},r={render:()=>{const e={version:"2.1.0",layers:{motivation:{id:"motivation",type:"Motivation",name:"Motivation Layer",description:"Stakeholders, drivers, and goals",order:1,elements:[{id:"goal-1",type:"Goal",name:"Achieve Market Leadership",layerId:"motivation",description:"Become the market leader",properties:{fill:"#a78bfa",stroke:"#7c3aed"},visual:{position:{x:0,y:0},size:{width:160,height:80},style:{}},relationships:{incoming:[],outgoing:[]}},{id:"requirement-1",type:"Requirement",name:"Support 1000+ concurrent users",layerId:"motivation",description:"Scalability requirement",properties:{fill:"#60a5fa",stroke:"#3b82f6"},visual:{position:{x:200,y:0},size:{width:160,height:80},style:{}},relationships:{incoming:[],outgoing:[]}}],relationships:[]},business:{id:"business",type:"Business",name:"Business Layer",description:"Services and processes",order:2,elements:[{id:"service-1",type:"BusinessService",name:"Order Management",layerId:"business",description:"Manages customer orders",properties:{fill:"#34d399",stroke:"#10b981"},visual:{position:{x:0,y:120},size:{width:160,height:80},style:{}},relationships:{incoming:[],outgoing:[]}}],relationships:[]}},references:[],metadata:{version:"2.1.0",schemaVersion:"2.0",lastModified:new Date(Date.now()-72e5).toISOString(),valid:!0,elementCount:3,validationErrors:[]}};return n.jsx(o,{model:e})}},a={render:()=>{const e={version:"1.5.0",layers:{motivation:{id:"motivation",type:"Motivation",name:"Motivation Layer",description:"Stakeholders, drivers, and goals",order:1,elements:[{id:"goal-1",type:"Goal",name:"Broken Goal",layerId:"motivation",description:"Has validation issues",properties:{fill:"#a78bfa",stroke:"#7c3aed"},visual:{position:{x:0,y:0},size:{width:160,height:80},style:{}},relationships:{incoming:[],outgoing:[]}}],relationships:[]}},references:[],metadata:{version:"1.5.0",schemaVersion:"2.0",lastModified:new Date().toISOString(),valid:!1,elementCount:1,validationErrors:['Goal "Broken Goal" is missing required property "priority"','Relationship "goal-1 -> requirement-1" references non-existent requirement-1',"Circular dependency detected: goal-1 -> outcome-1 -> goal-1"]}};return n.jsx(o,{model:e})}},s={render:()=>{const B={version:"3.0.0",layers:{motivation:{id:"motivation",type:"Motivation",name:"Motivation Layer",description:"Stakeholders, drivers, and goals",order:1,elements:Array.from({length:6},(q,i)=>({id:`goal-${i+1}`,type:"Goal",name:`Goal ${i+1}`,layerId:"motivation",description:`Mock goal ${i+1}`,properties:{fill:"#a78bfa",stroke:"#7c3aed"},visual:{position:{x:i*200,y:0},size:{width:160,height:80},style:{}},relationships:{incoming:[],outgoing:[]}})),relationships:[]}},references:[],metadata:{version:"3.0.0",schemaVersion:"2.0",lastModified:new Date(Date.now()-6048e5).toISOString(),valid:!0,elementCount:47,validationErrors:[]}};return n.jsx(o,{model:B})}},l={render:()=>n.jsxs("div",{className:"p-4 text-gray-500 text-sm",children:[n.jsx(V,{}),n.jsx("p",{className:"mt-4",children:"No model loaded (component returns null)"})]})},d={render:()=>{const e={version:"1.0.0",layers:{motivation:{id:"motivation",type:"Motivation",name:"Motivation Layer",description:"Stakeholders, drivers, and goals",order:1,elements:[],relationships:[]}},references:[],metadata:{valid:!0}};return n.jsx(o,{model:e})}},m={render:()=>{const e={version:"1.0.0",layers:{motivation:{id:"motivation",type:"Motivation",name:"Motivation Layer",description:"Stakeholders, drivers, and goals",order:1,elements:[{id:"goal-1",type:"Goal",name:"Test Goal",layerId:"motivation",description:"Custom styling test",properties:{fill:"#a78bfa",stroke:"#7c3aed"},visual:{position:{x:0,y:0},size:{width:160,height:80},style:{}},relationships:{incoming:[],outgoing:[]}}],relationships:[]}},references:[],metadata:{version:"1.0.0",schemaVersion:"2.0",lastModified:new Date().toISOString(),valid:!0,elementCount:1}};return n.jsx(o,{model:e})}};var p,u,v;t.parameters={...t.parameters,docs:{...(p=t.parameters)==null?void 0:p.docs,source:{originalSource:`{
  render: () => {
    const model: MetaModel = {
      version: '1.0.0',
      layers: {
        motivation: {
          id: 'motivation',
          type: 'Motivation',
          name: 'Motivation Layer',
          description: 'Stakeholders, drivers, and goals',
          order: 1,
          elements: [{
            id: 'goal-1',
            type: 'Goal',
            name: 'Increase Revenue',
            layerId: 'motivation',
            description: 'Primary business objective',
            properties: {
              fill: '#a78bfa',
              stroke: '#7c3aed'
            },
            visual: {
              position: {
                x: 0,
                y: 0
              },
              size: {
                width: 160,
                height: 80
              },
              style: {}
            },
            relationships: {
              incoming: [],
              outgoing: []
            }
          }],
          relationships: []
        }
      },
      references: [],
      metadata: {
        version: '1.0.0',
        schemaVersion: '2.0',
        lastModified: new Date().toISOString(),
        valid: true,
        elementCount: 1,
        validationErrors: []
      }
    };
    return <SchemaInfoPanelStory model={model} />;
  }
}`,...(v=(u=t.parameters)==null?void 0:u.docs)==null?void 0:v.source}}};var y,g,h;r.parameters={...r.parameters,docs:{...(y=r.parameters)==null?void 0:y.docs,source:{originalSource:`{
  render: () => {
    const model: MetaModel = {
      version: '2.1.0',
      layers: {
        motivation: {
          id: 'motivation',
          type: 'Motivation',
          name: 'Motivation Layer',
          description: 'Stakeholders, drivers, and goals',
          order: 1,
          elements: [{
            id: 'goal-1',
            type: 'Goal',
            name: 'Achieve Market Leadership',
            layerId: 'motivation',
            description: 'Become the market leader',
            properties: {
              fill: '#a78bfa',
              stroke: '#7c3aed'
            },
            visual: {
              position: {
                x: 0,
                y: 0
              },
              size: {
                width: 160,
                height: 80
              },
              style: {}
            },
            relationships: {
              incoming: [],
              outgoing: []
            }
          }, {
            id: 'requirement-1',
            type: 'Requirement',
            name: 'Support 1000+ concurrent users',
            layerId: 'motivation',
            description: 'Scalability requirement',
            properties: {
              fill: '#60a5fa',
              stroke: '#3b82f6'
            },
            visual: {
              position: {
                x: 200,
                y: 0
              },
              size: {
                width: 160,
                height: 80
              },
              style: {}
            },
            relationships: {
              incoming: [],
              outgoing: []
            }
          }],
          relationships: []
        },
        business: {
          id: 'business',
          type: 'Business',
          name: 'Business Layer',
          description: 'Services and processes',
          order: 2,
          elements: [{
            id: 'service-1',
            type: 'BusinessService',
            name: 'Order Management',
            layerId: 'business',
            description: 'Manages customer orders',
            properties: {
              fill: '#34d399',
              stroke: '#10b981'
            },
            visual: {
              position: {
                x: 0,
                y: 120
              },
              size: {
                width: 160,
                height: 80
              },
              style: {}
            },
            relationships: {
              incoming: [],
              outgoing: []
            }
          }],
          relationships: []
        }
      },
      references: [],
      metadata: {
        version: '2.1.0',
        schemaVersion: '2.0',
        lastModified: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        valid: true,
        elementCount: 3,
        validationErrors: []
      }
    };
    return <SchemaInfoPanelStory model={model} />;
  }
}`,...(h=(g=r.parameters)==null?void 0:g.docs)==null?void 0:h.source}}};var f,S,M;a.parameters={...a.parameters,docs:{...(f=a.parameters)==null?void 0:f.docs,source:{originalSource:`{
  render: () => {
    const model: MetaModel = {
      version: '1.5.0',
      layers: {
        motivation: {
          id: 'motivation',
          type: 'Motivation',
          name: 'Motivation Layer',
          description: 'Stakeholders, drivers, and goals',
          order: 1,
          elements: [{
            id: 'goal-1',
            type: 'Goal',
            name: 'Broken Goal',
            layerId: 'motivation',
            description: 'Has validation issues',
            properties: {
              fill: '#a78bfa',
              stroke: '#7c3aed'
            },
            visual: {
              position: {
                x: 0,
                y: 0
              },
              size: {
                width: 160,
                height: 80
              },
              style: {}
            },
            relationships: {
              incoming: [],
              outgoing: []
            }
          }],
          relationships: []
        }
      },
      references: [],
      metadata: {
        version: '1.5.0',
        schemaVersion: '2.0',
        lastModified: new Date().toISOString(),
        valid: false,
        elementCount: 1,
        validationErrors: ['Goal "Broken Goal" is missing required property "priority"', 'Relationship "goal-1 -> requirement-1" references non-existent requirement-1', 'Circular dependency detected: goal-1 -> outcome-1 -> goal-1']
      }
    };
    return <SchemaInfoPanelStory model={model} />;
  }
}`,...(M=(S=a.parameters)==null?void 0:S.docs)==null?void 0:M.source}}};var k,I,x;s.parameters={...s.parameters,docs:{...(k=s.parameters)==null?void 0:k.docs,source:{originalSource:`{
  render: () => {
    const elementCount = 47;
    const model: MetaModel = {
      version: '3.0.0',
      layers: {
        motivation: {
          id: 'motivation',
          type: 'Motivation',
          name: 'Motivation Layer',
          description: 'Stakeholders, drivers, and goals',
          order: 1,
          elements: Array.from({
            length: 6
          }, (_, i) => ({
            id: \`goal-\${i + 1}\`,
            type: 'Goal',
            name: \`Goal \${i + 1}\`,
            layerId: 'motivation',
            description: \`Mock goal \${i + 1}\`,
            properties: {
              fill: '#a78bfa',
              stroke: '#7c3aed'
            },
            visual: {
              position: {
                x: i * 200,
                y: 0
              },
              size: {
                width: 160,
                height: 80
              },
              style: {}
            },
            relationships: {
              incoming: [],
              outgoing: []
            }
          })),
          relationships: []
        }
      },
      references: [],
      metadata: {
        version: '3.0.0',
        schemaVersion: '2.0',
        lastModified: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        valid: true,
        elementCount,
        validationErrors: []
      }
    };
    return <SchemaInfoPanelStory model={model} />;
  }
}`,...(x=(I=s.parameters)==null?void 0:I.docs)==null?void 0:x.source}}};var w,b,C;l.parameters={...l.parameters,docs:{...(w=l.parameters)==null?void 0:w.docs,source:{originalSource:`{
  render: () => <div className="p-4 text-gray-500 text-sm">
      <SchemaInfoPanel />
      <p className="mt-4">No model loaded (component returns null)</p>
    </div>
}`,...(C=(b=l.parameters)==null?void 0:b.docs)==null?void 0:C.source}}};var G,D,L;d.parameters={...d.parameters,docs:{...(G=d.parameters)==null?void 0:G.docs,source:{originalSource:`{
  render: () => {
    const model: MetaModel = {
      version: '1.0.0',
      layers: {
        motivation: {
          id: 'motivation',
          type: 'Motivation',
          name: 'Motivation Layer',
          description: 'Stakeholders, drivers, and goals',
          order: 1,
          elements: [],
          relationships: []
        }
      },
      references: [],
      metadata: {
        valid: true
      }
    };
    return <SchemaInfoPanelStory model={model} />;
  }
}`,...(L=(D=d.parameters)==null?void 0:D.docs)==null?void 0:L.source}}};var j,z,E;m.parameters={...m.parameters,docs:{...(j=m.parameters)==null?void 0:j.docs,source:{originalSource:`{
  render: () => {
    const model: MetaModel = {
      version: '1.0.0',
      layers: {
        motivation: {
          id: 'motivation',
          type: 'Motivation',
          name: 'Motivation Layer',
          description: 'Stakeholders, drivers, and goals',
          order: 1,
          elements: [{
            id: 'goal-1',
            type: 'Goal',
            name: 'Test Goal',
            layerId: 'motivation',
            description: 'Custom styling test',
            properties: {
              fill: '#a78bfa',
              stroke: '#7c3aed'
            },
            visual: {
              position: {
                x: 0,
                y: 0
              },
              size: {
                width: 160,
                height: 80
              },
              style: {}
            },
            relationships: {
              incoming: [],
              outgoing: []
            }
          }],
          relationships: []
        }
      },
      references: [],
      metadata: {
        version: '1.0.0',
        schemaVersion: '2.0',
        lastModified: new Date().toISOString(),
        valid: true,
        elementCount: 1
      }
    };
    return <SchemaInfoPanelStory model={model} />;
  }
}`,...(E=(z=m.parameters)==null?void 0:z.docs)==null?void 0:E.source}}};const _=["Default","ValidModel","WithValidationErrors","LargeModel","NoModel","MinimalMetadata","WithCustomClassName"];export{t as Default,s as LargeModel,d as MinimalMetadata,l as NoModel,r as ValidModel,m as WithCustomClassName,a as WithValidationErrors,_ as __namedExportsOrder,W as default};
