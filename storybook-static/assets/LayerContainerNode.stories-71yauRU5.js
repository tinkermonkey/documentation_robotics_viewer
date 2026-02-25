import{j as a}from"./iframe-DSSgKmXl.js";import{L as r}from"./LayerContainerNode-BdSyy50l.js";import{a as t}from"./nodeDataFixtures-B0tGCHY2.js";import{w as W}from"./ReactFlowDecorator-CTPaIlRv.js";import"./preload-helper-Dp1pzeXC.js";import"./index-DzsatpJz.js";import"./index-DVMEuaP3.js";import"./index-B3kNdT8l.js";import"./index-CsUALWJS.js";/* empty css              */const Q={title:"C Graphs / Nodes / Base / LayerContainerNode",decorators:[W({})],parameters:{layout:"fullscreen"}},o={render:()=>{const e=t({label:"Business Layer",layerType:"business",color:"#4caf50"});return a.jsx(r,{data:e,id:"container-1"})}},n={render:()=>{const e=t({label:"Technology Layer",layerType:"technology",color:"#2196f3"});return a.jsxs("div",{style:{position:"relative",width:"600px",height:"400px"},children:[a.jsx(r,{data:e,id:"container-2"}),a.jsx("div",{style:{position:"absolute",top:"80px",left:"80px",width:"100px",height:"80px",background:"#fff",border:"2px solid #ccc",borderRadius:"4px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"12px"},children:"Child Node"})]})}},d={render:()=>{const e=t({label:"API Layer",layerType:"api",color:"#ff9800"});return a.jsx(r,{data:e,id:"container-3"})}},i={render:()=>{const e=t({label:"Data Model Layer",layerType:"dataModel",color:"#9c27b0"});return a.jsx(r,{data:e,id:"container-4"})}},s={render:()=>{const e=t({label:"New Security Layer",layerType:"security",color:"#f44336",changesetOperation:"add"});return a.jsx(r,{data:e,id:"container-5"})}},c={render:()=>{const e=t({label:"Motivation Layer",layerType:"motivation",color:"#fbc02d"});return a.jsx(r,{data:e,id:"container-6"})}},l={render:()=>{const e=t({label:"Application Layer",layerType:"application",color:"#00bcd4"});return a.jsx(r,{data:e,id:"container-7"})}},p={render:()=>{const e=t({label:"Highlighted Layer",layerType:"business",color:"#4caf50",strokeWidth:3});return a.jsx(r,{data:e,id:"container-8"})}};var y,u,m;o.parameters={...o.parameters,docs:{...(y=o.parameters)==null?void 0:y.docs,source:{originalSource:`{
  render: () => {
    const data = createLayerContainerNodeData({
      label: 'Business Layer',
      layerType: 'business',
      color: '#4caf50'
    });
    return <LayerContainerNode data={data} id="container-1" />;
  }
}`,...(m=(u=o.parameters)==null?void 0:u.docs)==null?void 0:m.source}}};var h,L,f;n.parameters={...n.parameters,docs:{...(h=n.parameters)==null?void 0:h.docs,source:{originalSource:`{
  render: () => {
    const data = createLayerContainerNodeData({
      label: 'Technology Layer',
      layerType: 'technology',
      color: '#2196f3'
    });
    return <div style={{
      position: 'relative',
      width: '600px',
      height: '400px'
    }}>
        <LayerContainerNode data={data} id="container-2" />
        <div style={{
        position: 'absolute',
        top: '80px',
        left: '80px',
        width: '100px',
        height: '80px',
        background: '#fff',
        border: '2px solid #ccc',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '12px'
      }}>
          Child Node
        </div>
      </div>;
  }
}`,...(f=(L=n.parameters)==null?void 0:L.docs)==null?void 0:f.source}}};var x,b,g;d.parameters={...d.parameters,docs:{...(x=d.parameters)==null?void 0:x.docs,source:{originalSource:`{
  render: () => {
    const data = createLayerContainerNodeData({
      label: 'API Layer',
      layerType: 'api',
      color: '#ff9800'
    });
    return <LayerContainerNode data={data} id="container-3" />;
  }
}`,...(g=(b=d.parameters)==null?void 0:b.docs)==null?void 0:g.source}}};var C,N,T;i.parameters={...i.parameters,docs:{...(C=i.parameters)==null?void 0:C.docs,source:{originalSource:`{
  render: () => {
    const data = createLayerContainerNodeData({
      label: 'Data Model Layer',
      layerType: 'dataModel',
      color: '#9c27b0'
    });
    return <LayerContainerNode data={data} id="container-4" />;
  }
}`,...(T=(N=i.parameters)==null?void 0:N.docs)==null?void 0:T.source}}};var j,v,D;s.parameters={...s.parameters,docs:{...(j=s.parameters)==null?void 0:j.docs,source:{originalSource:`{
  render: () => {
    const data = createLayerContainerNodeData({
      label: 'New Security Layer',
      layerType: 'security',
      color: '#f44336',
      changesetOperation: 'add'
    });
    return <LayerContainerNode data={data} id="container-5" />;
  }
}`,...(D=(v=s.parameters)==null?void 0:v.docs)==null?void 0:D.source}}};var S,w,A;c.parameters={...c.parameters,docs:{...(S=c.parameters)==null?void 0:S.docs,source:{originalSource:`{
  render: () => {
    const data = createLayerContainerNodeData({
      label: 'Motivation Layer',
      layerType: 'motivation',
      color: '#fbc02d'
    });
    return <LayerContainerNode data={data} id="container-6" />;
  }
}`,...(A=(w=c.parameters)==null?void 0:w.docs)==null?void 0:A.source}}};var M,k,E;l.parameters={...l.parameters,docs:{...(M=l.parameters)==null?void 0:M.docs,source:{originalSource:`{
  render: () => {
    const data = createLayerContainerNodeData({
      label: 'Application Layer',
      layerType: 'application',
      color: '#00bcd4'
    });
    return <LayerContainerNode data={data} id="container-7" />;
  }
}`,...(E=(k=l.parameters)==null?void 0:k.docs)==null?void 0:E.source}}};var H,I,R;p.parameters={...p.parameters,docs:{...(H=p.parameters)==null?void 0:H.docs,source:{originalSource:`{
  render: () => {
    const data = createLayerContainerNodeData({
      label: 'Highlighted Layer',
      layerType: 'business',
      color: '#4caf50',
      strokeWidth: 3
    });
    return <LayerContainerNode data={data} id="container-8" />;
  }
}`,...(R=(I=p.parameters)==null?void 0:I.docs)==null?void 0:R.source}}};const U=["Default","WithChildren","Collapsed","Expanded","ChangesetAdd","MotivationLayer","ApplicationLayer","Highlighted"];export{l as ApplicationLayer,s as ChangesetAdd,d as Collapsed,o as Default,i as Expanded,p as Highlighted,c as MotivationLayer,n as WithChildren,U as __namedExportsOrder,Q as default};
