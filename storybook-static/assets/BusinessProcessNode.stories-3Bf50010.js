import{j as e}from"./iframe-DSSgKmXl.js";import{B as s}from"./BusinessProcessNode-CEovaBVo.js";import{w as K}from"./ReactFlowDecorator-CTPaIlRv.js";import{e as r}from"./nodeDataFixtures-B0tGCHY2.js";import"./preload-helper-Dp1pzeXC.js";import"./index-DzsatpJz.js";import"./index-DVMEuaP3.js";import"./index-B3kNdT8l.js";import"./index-CsUALWJS.js";/* empty css              */const oe={title:"C Graphs / Nodes / Business / BusinessProcessNode",decorators:[K({})],parameters:{layout:"fullscreen"}},a={render:()=>e.jsx(s,{data:r({label:"Order Processing"}),id:"process-1"})},o={render:()=>e.jsx(s,{data:r({label:"Payment Processing",criticality:"high"}),id:"process-2"})},t={render:()=>e.jsx(s,{data:r({label:"Inventory Check",criticality:"medium"}),id:"process-3"})},c={render:()=>e.jsx(s,{data:r({label:"Logging Process",criticality:"low"}),id:"process-4"})},i={render:()=>e.jsx(s,{data:r({label:"Returns Processing",owner:"Operations Team"}),id:"process-5"})},d={render:()=>e.jsx(s,{data:r({label:"Order Fulfillment",subprocessCount:5,subprocesses:[{id:"sp-1",name:"Pick Items",description:"Pick items from warehouse"},{id:"sp-2",name:"Pack Order",description:"Pack items into box"},{id:"sp-3",name:"Label Package",description:"Generate and apply label"},{id:"sp-4",name:"Schedule Pickup",description:"Schedule carrier pickup"},{id:"sp-5",name:"Confirm Shipment",description:"Send shipment confirmation"}]}),id:"process-6"})},n={render:()=>e.jsx(s,{data:r({label:"New Process",changesetOperation:"add"}),id:"process-7"})},p={render:()=>e.jsx(s,{data:r({label:"Updated Process",changesetOperation:"update"}),id:"process-8"})},m={render:()=>e.jsx(s,{data:r({label:"Deleted Process",changesetOperation:"delete"}),id:"process-9"})},l={render:()=>e.jsx(s,{data:r({label:"Dimmed Process",opacity:.5}),id:"process-10"})},u={render:()=>e.jsx(s,{data:r({label:"Highlighted Process",strokeWidth:3}),id:"process-11"})};var P,g,h;a.parameters={...a.parameters,docs:{...(P=a.parameters)==null?void 0:P.docs,source:{originalSource:`{
  render: () => <BusinessProcessNode data={createBusinessProcessNodeData({
    label: 'Order Processing'
  })} id="process-1" />
}`,...(h=(g=a.parameters)==null?void 0:g.docs)==null?void 0:h.source}}};var b,N,B;o.parameters={...o.parameters,docs:{...(b=o.parameters)==null?void 0:b.docs,source:{originalSource:`{
  render: () => <BusinessProcessNode data={createBusinessProcessNodeData({
    label: 'Payment Processing',
    criticality: 'high'
  })} id="process-2" />
}`,...(B=(N=o.parameters)==null?void 0:N.docs)==null?void 0:B.source}}};var D,y,S;t.parameters={...t.parameters,docs:{...(D=t.parameters)==null?void 0:D.docs,source:{originalSource:`{
  render: () => <BusinessProcessNode data={createBusinessProcessNodeData({
    label: 'Inventory Check',
    criticality: 'medium'
  })} id="process-3" />
}`,...(S=(y=t.parameters)==null?void 0:y.docs)==null?void 0:S.source}}};var C,k,x;c.parameters={...c.parameters,docs:{...(C=c.parameters)==null?void 0:C.docs,source:{originalSource:`{
  render: () => <BusinessProcessNode data={createBusinessProcessNodeData({
    label: 'Logging Process',
    criticality: 'low'
  })} id="process-4" />
}`,...(x=(k=c.parameters)==null?void 0:k.docs)==null?void 0:x.source}}};var O,f,w;i.parameters={...i.parameters,docs:{...(O=i.parameters)==null?void 0:O.docs,source:{originalSource:`{
  render: () => <BusinessProcessNode data={createBusinessProcessNodeData({
    label: 'Returns Processing',
    owner: 'Operations Team'
  })} id="process-5" />
}`,...(w=(f=i.parameters)==null?void 0:f.docs)==null?void 0:w.source}}};var j,H,L;d.parameters={...d.parameters,docs:{...(j=d.parameters)==null?void 0:j.docs,source:{originalSource:`{
  render: () => <BusinessProcessNode data={createBusinessProcessNodeData({
    label: 'Order Fulfillment',
    subprocessCount: 5,
    subprocesses: [{
      id: 'sp-1',
      name: 'Pick Items',
      description: 'Pick items from warehouse'
    }, {
      id: 'sp-2',
      name: 'Pack Order',
      description: 'Pack items into box'
    }, {
      id: 'sp-3',
      name: 'Label Package',
      description: 'Generate and apply label'
    }, {
      id: 'sp-4',
      name: 'Schedule Pickup',
      description: 'Schedule carrier pickup'
    }, {
      id: 'sp-5',
      name: 'Confirm Shipment',
      description: 'Send shipment confirmation'
    }]
  })} id="process-6" />
}`,...(L=(H=d.parameters)==null?void 0:H.docs)==null?void 0:L.source}}};var W,I,R;n.parameters={...n.parameters,docs:{...(W=n.parameters)==null?void 0:W.docs,source:{originalSource:`{
  render: () => <BusinessProcessNode data={createBusinessProcessNodeData({
    label: 'New Process',
    changesetOperation: 'add'
  })} id="process-7" />
}`,...(R=(I=n.parameters)==null?void 0:I.docs)==null?void 0:R.source}}};var U,F,G;p.parameters={...p.parameters,docs:{...(U=p.parameters)==null?void 0:U.docs,source:{originalSource:`{
  render: () => <BusinessProcessNode data={createBusinessProcessNodeData({
    label: 'Updated Process',
    changesetOperation: 'update'
  })} id="process-8" />
}`,...(G=(F=p.parameters)==null?void 0:F.docs)==null?void 0:G.source}}};var v,A,E;m.parameters={...m.parameters,docs:{...(v=m.parameters)==null?void 0:v.docs,source:{originalSource:`{
  render: () => <BusinessProcessNode data={createBusinessProcessNodeData({
    label: 'Deleted Process',
    changesetOperation: 'delete'
  })} id="process-9" />
}`,...(E=(A=m.parameters)==null?void 0:A.docs)==null?void 0:E.source}}};var M,T,_;l.parameters={...l.parameters,docs:{...(M=l.parameters)==null?void 0:M.docs,source:{originalSource:`{
  render: () => <BusinessProcessNode data={createBusinessProcessNodeData({
    label: 'Dimmed Process',
    opacity: 0.5
  })} id="process-10" />
}`,...(_=(T=l.parameters)==null?void 0:T.docs)==null?void 0:_.source}}};var q,z,J;u.parameters={...u.parameters,docs:{...(q=u.parameters)==null?void 0:q.docs,source:{originalSource:`{
  render: () => <BusinessProcessNode data={createBusinessProcessNodeData({
    label: 'Highlighted Process',
    strokeWidth: 3
  })} id="process-11" />
}`,...(J=(z=u.parameters)==null?void 0:z.docs)==null?void 0:J.source}}};const te=["Default","HighCriticality","MediumCriticality","LowCriticality","WithOwner","WithSubprocesses","ChangesetAdd","ChangesetUpdate","ChangesetDelete","Dimmed","Highlighted"];export{n as ChangesetAdd,m as ChangesetDelete,p as ChangesetUpdate,a as Default,l as Dimmed,o as HighCriticality,u as Highlighted,c as LowCriticality,t as MediumCriticality,i as WithOwner,d as WithSubprocesses,te as __namedExportsOrder,oe as default};
