import{j as n}from"./iframe-DSSgKmXl.js";import{N as t}from"./NodeDetailsPanel-BwREUvBL.js";import"./preload-helper-Dp1pzeXC.js";import"./info-DDrpRE-p.js";import"./createLucideIcon-CIvKt9yE.js";const ee={title:"B Details / Model Details / NodeDetailsPanel",parameters:{layout:"centered"}},o={version:"1.0.0",references:[],layers:{motivation:{id:"motivation",type:"Motivation",name:"Motivation Layer",description:"Stakeholders, drivers, and goals",order:1,elements:[{id:"goal-1",type:"Goal",name:"Increase Revenue",layerId:"motivation",description:"Primary business objective",properties:{fill:"#a78bfa",stroke:"#7c3aed"},visual:{position:{x:0,y:0},size:{width:160,height:80},style:{}},relationships:{incoming:["driver-1"],outgoing:["requirement-1","requirement-2"]}},{id:"requirement-1",type:"Requirement",name:"Support 1000 concurrent users",layerId:"motivation",description:"Scalability requirement",properties:{fill:"#60a5fa",stroke:"#3b82f6"},visual:{position:{x:200,y:0},size:{width:160,height:80},style:{}},relationships:{incoming:["goal-1"],outgoing:[]}},{id:"requirement-2",type:"Requirement",name:"Achieve 99.9% uptime",layerId:"motivation",description:"Availability requirement",properties:{fill:"#60a5fa",stroke:"#3b82f6"},visual:{position:{x:400,y:0},size:{width:160,height:80},style:{}},relationships:{incoming:["goal-1"],outgoing:[]}},{id:"driver-1",type:"Driver",name:"Market Competition",layerId:"motivation",description:"Competitive pressure from new entrants",properties:{fill:"#f87171",stroke:"#ef4444"},visual:{position:{x:0,y:100},size:{width:160,height:80},style:{}},relationships:{incoming:[],outgoing:["goal-1"]}}],relationships:[{id:"rel-1",sourceId:"driver-1",targetId:"goal-1",type:"drives"},{id:"rel-2",sourceId:"goal-1",targetId:"requirement-1",type:"requires"},{id:"rel-3",sourceId:"goal-1",targetId:"requirement-2",type:"requires"}]},business:{id:"business",type:"Business",name:"Business Layer",description:"Services and processes",order:2,elements:[{id:"service-1",type:"BusinessService",name:"Order Management Service",layerId:"business",description:"Manages customer orders",properties:{fill:"#34d399",stroke:"#10b981"},visual:{position:{x:0,y:200},size:{width:160,height:80},style:{}},relationships:{incoming:[],outgoing:[]}}],relationships:[]}}},r={render:()=>n.jsx(t,{selectedNode:null,model:o})},s={render:()=>{const e={id:"goal-1",position:{x:0,y:0},data:{label:"Increase Revenue",type:"Goal",stroke:"#7c3aed"}};return n.jsx(t,{selectedNode:e,model:o})}},a={render:()=>{const e={id:"requirement-1",position:{x:200,y:50},data:{label:"Support 1000 concurrent users",type:"Requirement",stroke:"#3b82f6"}};return n.jsx(t,{selectedNode:e,model:o})}},d={render:()=>{const e={id:"driver-1",position:{x:0,y:100},data:{label:"Market Competition",type:"Driver",stroke:"#ef4444"}};return n.jsx(t,{selectedNode:e,model:o})}},i={render:()=>{const e={id:"service-1",position:{x:0,y:200},data:{label:"Order Management Service",type:"BusinessService",stroke:"#10b981"}};return n.jsx(t,{selectedNode:e,model:o})}},l={render:()=>{const e={...o,layers:{...o.layers,motivation:{...o.layers.motivation,elements:[...o.layers.motivation.elements,{id:"goal-2",type:"Goal",name:"Reduce Cost",layerId:"motivation",description:"Another goal",properties:{fill:"#a78bfa",stroke:"#7c3aed"},visual:{position:{x:600,y:0},size:{width:160,height:80},style:{}},relationships:{incoming:[],outgoing:[]}}],relationships:[...o.layers.motivation.relationships,{id:"rel-4",sourceId:"driver-1",targetId:"goal-2",type:"drives"},{id:"rel-5",sourceId:"goal-2",targetId:"requirement-2",type:"requires"},{id:"rel-6",sourceId:"goal-1",targetId:"goal-2",type:"relates-to"}]}}},g={id:"goal-1",position:{x:0,y:0},data:{label:"Increase Revenue",type:"Goal",stroke:"#7c3aed"}};return n.jsx(t,{selectedNode:g,model:e})}},c={render:()=>{const e={id:"goal-1",position:{x:0,y:0},data:{label:"Enable Real-Time Analytics and Dashboarding Across All Customer Touchpoints with Sub-Second Latency",type:"Goal",stroke:"#7c3aed"}};return n.jsx(t,{selectedNode:e,model:o})}},p={render:()=>{const e={id:"orphan-node-123",position:{x:100,y:100},data:{type:"Unknown",stroke:"#999999"}};return n.jsx(t,{selectedNode:e,model:o})}},m={render:()=>{const e={id:"goal-1",position:{x:-450,y:-250},data:{label:"Increase Revenue",type:"Goal",stroke:"#7c3aed"}};return n.jsx(t,{selectedNode:e,model:o})}},u={render:()=>{const e={version:"1.0.0",layers:{},references:[]},g={id:"goal-1",position:{x:0,y:0},data:{label:"Goal Without Model Context",type:"Goal",stroke:"#7c3aed"}};return n.jsx(t,{selectedNode:g,model:e})}},y={render:()=>{const e={id:"goal-1",position:{x:123,y:456},data:{label:"Increase Revenue",type:"Goal",stroke:"#7c3aed"}};return n.jsx("div",{className:"dark bg-gray-900 p-4 rounded-lg",children:n.jsx("div",{className:"bg-white dark:bg-gray-800",children:n.jsx(t,{selectedNode:e,model:o})})})}};var N,v,h;r.parameters={...r.parameters,docs:{...(N=r.parameters)==null?void 0:N.docs,source:{originalSource:`{
  render: () => <NodeDetailsPanel selectedNode={null} model={mockModel} />
}`,...(h=(v=r.parameters)==null?void 0:v.docs)==null?void 0:h.source}}};var k,b,x;s.parameters={...s.parameters,docs:{...(k=s.parameters)==null?void 0:k.docs,source:{originalSource:`{
  render: () => {
    const selectedNode: Node = {
      id: 'goal-1',
      position: {
        x: 0,
        y: 0
      },
      data: {
        label: 'Increase Revenue',
        type: 'Goal',
        stroke: '#7c3aed'
      }
    };
    return <NodeDetailsPanel selectedNode={selectedNode} model={mockModel} />;
  }
}`,...(x=(b=s.parameters)==null?void 0:b.docs)==null?void 0:x.source}}};var M,S,I;a.parameters={...a.parameters,docs:{...(M=a.parameters)==null?void 0:M.docs,source:{originalSource:`{
  render: () => {
    const selectedNode: Node = {
      id: 'requirement-1',
      position: {
        x: 200,
        y: 50
      },
      data: {
        label: 'Support 1000 concurrent users',
        type: 'Requirement',
        stroke: '#3b82f6'
      }
    };
    return <NodeDetailsPanel selectedNode={selectedNode} model={mockModel} />;
  }
}`,...(I=(S=a.parameters)==null?void 0:S.docs)==null?void 0:I.source}}};var f,D,q;d.parameters={...d.parameters,docs:{...(f=d.parameters)==null?void 0:f.docs,source:{originalSource:`{
  render: () => {
    const selectedNode: Node = {
      id: 'driver-1',
      position: {
        x: 0,
        y: 100
      },
      data: {
        label: 'Market Competition',
        type: 'Driver',
        stroke: '#ef4444'
      }
    };
    return <NodeDetailsPanel selectedNode={selectedNode} model={mockModel} />;
  }
}`,...(q=(D=d.parameters)==null?void 0:D.docs)==null?void 0:q.source}}};var R,G,P;i.parameters={...i.parameters,docs:{...(R=i.parameters)==null?void 0:R.docs,source:{originalSource:`{
  render: () => {
    const selectedNode: Node = {
      id: 'service-1',
      position: {
        x: 0,
        y: 200
      },
      data: {
        label: 'Order Management Service',
        type: 'BusinessService',
        stroke: '#10b981'
      }
    };
    return <NodeDetailsPanel selectedNode={selectedNode} model={mockModel} />;
  }
}`,...(P=(G=i.parameters)==null?void 0:G.docs)==null?void 0:P.source}}};var j,w,C;l.parameters={...l.parameters,docs:{...(j=l.parameters)==null?void 0:j.docs,source:{originalSource:`{
  render: () => {
    const modelWithConnections: MetaModel = {
      ...mockModel,
      layers: {
        ...mockModel.layers,
        motivation: {
          ...mockModel.layers.motivation,
          elements: [...mockModel.layers.motivation.elements, {
            id: 'goal-2',
            type: 'Goal',
            name: 'Reduce Cost',
            layerId: 'motivation',
            description: 'Another goal',
            properties: {
              fill: '#a78bfa',
              stroke: '#7c3aed'
            },
            visual: {
              position: {
                x: 600,
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
          relationships: [...mockModel.layers.motivation.relationships, {
            id: 'rel-4',
            sourceId: 'driver-1',
            targetId: 'goal-2',
            type: 'drives'
          }, {
            id: 'rel-5',
            sourceId: 'goal-2',
            targetId: 'requirement-2',
            type: 'requires'
          }, {
            id: 'rel-6',
            sourceId: 'goal-1',
            targetId: 'goal-2',
            type: 'relates-to'
          }]
        }
      }
    };
    const selectedNode: Node = {
      id: 'goal-1',
      position: {
        x: 0,
        y: 0
      },
      data: {
        label: 'Increase Revenue',
        type: 'Goal',
        stroke: '#7c3aed'
      }
    };
    return <NodeDetailsPanel selectedNode={selectedNode} model={modelWithConnections} />;
  }
}`,...(C=(w=l.parameters)==null?void 0:w.docs)==null?void 0:C.source}}};var W,A,B;c.parameters={...c.parameters,docs:{...(W=c.parameters)==null?void 0:W.docs,source:{originalSource:`{
  render: () => {
    const selectedNode: Node = {
      id: 'goal-1',
      position: {
        x: 0,
        y: 0
      },
      data: {
        label: 'Enable Real-Time Analytics and Dashboarding Across All Customer Touchpoints with Sub-Second Latency',
        type: 'Goal',
        stroke: '#7c3aed'
      }
    };
    return <NodeDetailsPanel selectedNode={selectedNode} model={mockModel} />;
  }
}`,...(B=(A=c.parameters)==null?void 0:A.docs)==null?void 0:B.source}}};var L,z,E;p.parameters={...p.parameters,docs:{...(L=p.parameters)==null?void 0:L.docs,source:{originalSource:`{
  render: () => {
    const selectedNode: Node = {
      id: 'orphan-node-123',
      position: {
        x: 100,
        y: 100
      },
      data: {
        type: 'Unknown',
        stroke: '#999999'
      }
    };
    return <NodeDetailsPanel selectedNode={selectedNode} model={mockModel} />;
  }
}`,...(E=(z=p.parameters)==null?void 0:z.docs)==null?void 0:E.source}}};var O,T,U;m.parameters={...m.parameters,docs:{...(O=m.parameters)==null?void 0:O.docs,source:{originalSource:`{
  render: () => {
    const selectedNode: Node = {
      id: 'goal-1',
      position: {
        x: -450,
        y: -250
      },
      data: {
        label: 'Increase Revenue',
        type: 'Goal',
        stroke: '#7c3aed'
      }
    };
    return <NodeDetailsPanel selectedNode={selectedNode} model={mockModel} />;
  }
}`,...(U=(T=m.parameters)==null?void 0:T.docs)==null?void 0:U.source}}};var _,F,H;u.parameters={...u.parameters,docs:{...(_=u.parameters)==null?void 0:_.docs,source:{originalSource:`{
  render: () => {
    const emptyModel: MetaModel = {
      version: '1.0.0',
      layers: {},
      references: []
    };
    const selectedNode: Node = {
      id: 'goal-1',
      position: {
        x: 0,
        y: 0
      },
      data: {
        label: 'Goal Without Model Context',
        type: 'Goal',
        stroke: '#7c3aed'
      }
    };
    return <NodeDetailsPanel selectedNode={selectedNode} model={emptyModel} />;
  }
}`,...(H=(F=u.parameters)==null?void 0:F.docs)==null?void 0:H.source}}};var J,K,Q;y.parameters={...y.parameters,docs:{...(J=y.parameters)==null?void 0:J.docs,source:{originalSource:`{
  render: () => {
    const selectedNode: Node = {
      id: 'goal-1',
      position: {
        x: 123,
        y: 456
      },
      data: {
        label: 'Increase Revenue',
        type: 'Goal',
        stroke: '#7c3aed'
      }
    };
    return <div className="dark bg-gray-900 p-4 rounded-lg">
        <div className="bg-white dark:bg-gray-800">
          <NodeDetailsPanel selectedNode={selectedNode} model={mockModel} />
        </div>
      </div>;
  }
}`,...(Q=(K=y.parameters)==null?void 0:K.docs)==null?void 0:Q.source}}};const oe=["NoNodeSelected","GoalNodeSelected","RequirementNodeSelected","DriverNodeSelected","BusinessServiceNodeSelected","NodeWithManyConnections","NodeWithLongName","NodeWithoutLabel","NodeWithNegativePosition","EmptyModel","DarkModePreview"];export{i as BusinessServiceNodeSelected,y as DarkModePreview,d as DriverNodeSelected,u as EmptyModel,s as GoalNodeSelected,r as NoNodeSelected,c as NodeWithLongName,l as NodeWithManyConnections,m as NodeWithNegativePosition,p as NodeWithoutLabel,a as RequirementNodeSelected,oe as __namedExportsOrder,ee as default};
