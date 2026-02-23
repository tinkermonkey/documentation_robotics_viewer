import{j as e,r as o}from"./iframe-DSSgKmXl.js";import{H as p,a as R}from"./index-NvR17eTZ.js";import{c as _}from"./react-fqQoFC2C.js";import{B as H}from"./Badge-4uEMzFcW.js";import{S as O}from"./Spinner-Al2eUyHo.js";import"./preload-helper-Dp1pzeXC.js";import"./create-theme-BOkxhGns.js";const n=_(t=>({state:"disconnected",reconnectAttempt:0,reconnectDelay:0,lastError:null,lastConnectedAt:null,lastDisconnectedAt:null,setConnecting:()=>t({state:"connecting",lastError:null}),setConnected:()=>t({state:"connected",reconnectAttempt:0,reconnectDelay:0,lastError:null,lastConnectedAt:new Date}),setDisconnected:()=>t({state:"disconnected",lastDisconnectedAt:new Date}),setReconnecting:(c,a)=>t({state:"reconnecting",reconnectAttempt:c,reconnectDelay:a}),setError:c=>t({state:"error",lastError:c}),reset:()=>t({state:"disconnected",reconnectAttempt:0,reconnectDelay:0,lastError:null,lastConnectedAt:null,lastDisconnectedAt:null})})),r=()=>{const{state:t,reconnectAttempt:c,reconnectDelay:a}=n(),s=(I=>{switch(I){case"connected":return{color:"success",icon:e.jsx(R,{className:"w-4 h-4"}),label:"Connected",showSpinner:!1};case"connecting":return{color:"info",icon:null,label:"Connecting...",showSpinner:!0};case"reconnecting":return{color:"warning",icon:null,label:`Reconnecting (${c})...`,showSpinner:!0};case"disconnected":return{color:"gray",icon:e.jsx(p,{className:"w-4 h-4"}),label:"Disconnected",showSpinner:!1};case"error":return{color:"failure",icon:e.jsx(p,{className:"w-4 h-4"}),label:"Connection Error",showSpinner:!1};default:return{color:"gray",icon:null,label:"Unknown",showSpinner:!1}}})(t);return e.jsxs(H,{color:s.color,icon:()=>e.jsx(e.Fragment,{children:s.showSpinner?e.jsx(O,{size:"sm",className:"mr-1"}):s.icon&&e.jsx("span",{className:"mr-1",children:s.icon})}),"data-testid":"connection-status","data-connection-state":t,children:[s.label,t==="reconnecting"&&a>0&&e.jsxs("span",{className:"ml-1 opacity-75",children:["(",Math.round(a/1e3),"s)"]})]})};r.__docgenInfo={description:"",methods:[],displayName:"ConnectionStatus"};const q={title:"A Primitives / Indicators / ConnectionStatus"},i={render:()=>(o.useEffect(()=>{n.setState({state:"connected",reconnectAttempt:0})},[]),e.jsx("div",{className:"p-4 bg-gray-50",children:e.jsx(r,{})}))},l={render:()=>(o.useEffect(()=>{n.setState({state:"connecting",reconnectAttempt:0})},[]),e.jsx("div",{className:"p-4 bg-gray-50",children:e.jsx(r,{})}))},d={render:()=>(o.useEffect(()=>{n.setState({state:"reconnecting",reconnectAttempt:3})},[]),e.jsx("div",{className:"p-4 bg-gray-50",children:e.jsx(r,{})}))},u={render:()=>(o.useEffect(()=>{n.setState({state:"disconnected",reconnectAttempt:0})},[]),e.jsx("div",{className:"p-4 bg-gray-50",children:e.jsx(r,{})}))},m={render:()=>(o.useEffect(()=>{n.setState({state:"error",reconnectAttempt:0})},[]),e.jsx("div",{className:"p-4 bg-gray-50",children:e.jsx(r,{})}))};var g,S,f;i.parameters={...i.parameters,docs:{...(g=i.parameters)==null?void 0:g.docs,source:{originalSource:`{
  render: () => {
    useEffect(() => {
      useConnectionStore.setState({
        state: 'connected',
        reconnectAttempt: 0
      });
    }, []);
    return <div className="p-4 bg-gray-50">
        <ConnectionStatus />
      </div>;
  }
}`,...(f=(S=i.parameters)==null?void 0:S.docs)==null?void 0:f.source}}};var C,x,h;l.parameters={...l.parameters,docs:{...(C=l.parameters)==null?void 0:C.docs,source:{originalSource:`{
  render: () => {
    useEffect(() => {
      useConnectionStore.setState({
        state: 'connecting',
        reconnectAttempt: 0
      });
    }, []);
    return <div className="p-4 bg-gray-50">
        <ConnectionStatus />
      </div>;
  }
}`,...(h=(x=l.parameters)==null?void 0:x.docs)==null?void 0:h.source}}};var A,E,j;d.parameters={...d.parameters,docs:{...(A=d.parameters)==null?void 0:A.docs,source:{originalSource:`{
  render: () => {
    useEffect(() => {
      useConnectionStore.setState({
        state: 'reconnecting',
        reconnectAttempt: 3
      });
    }, []);
    return <div className="p-4 bg-gray-50">
        <ConnectionStatus />
      </div>;
  }
}`,...(j=(E=d.parameters)==null?void 0:E.docs)==null?void 0:j.source}}};var y,b,N;u.parameters={...u.parameters,docs:{...(y=u.parameters)==null?void 0:y.docs,source:{originalSource:`{
  render: () => {
    useEffect(() => {
      useConnectionStore.setState({
        state: 'disconnected',
        reconnectAttempt: 0
      });
    }, []);
    return <div className="p-4 bg-gray-50">
        <ConnectionStatus />
      </div>;
  }
}`,...(N=(b=u.parameters)==null?void 0:b.docs)==null?void 0:N.source}}};var v,w,D;m.parameters={...m.parameters,docs:{...(v=m.parameters)==null?void 0:v.docs,source:{originalSource:`{
  render: () => {
    useEffect(() => {
      useConnectionStore.setState({
        state: 'error',
        reconnectAttempt: 0
      });
    }, []);
    return <div className="p-4 bg-gray-50">
        <ConnectionStatus />
      </div>;
  }
}`,...(D=(w=m.parameters)==null?void 0:w.docs)==null?void 0:D.source}}};const G=["Connected","Connecting","Reconnecting","Disconnected","Error"];export{i as Connected,l as Connecting,u as Disconnected,m as Error,d as Reconnecting,G as __namedExportsOrder,q as default};
