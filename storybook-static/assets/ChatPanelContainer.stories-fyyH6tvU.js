import{j as e}from"./iframe-DSSgKmXl.js";import{a as s}from"./ChatMessage-DIZmy_0F.js";import"./preload-helper-Dp1pzeXC.js";import"./react-fqQoFC2C.js";import"./errorTracker-DrR4A8t3.js";import"./ChatTextContent-D1MHf8Qj.js";import"./ThinkingBlock-Dm6mq9Ve.js";import"./createLucideIcon-CIvKt9yE.js";import"./ToolInvocationCard-DbyYmtTK.js";import"./Badge-4uEMzFcW.js";import"./create-theme-BOkxhGns.js";import"./UsageStatsBadge-D6eWC_K7.js";import"./ChatInput-DKttK8bN.js";const q={title:"D Chat / Containers / ChatPanelContainer"},t={render:()=>e.jsx("div",{style:{height:"500px"},children:e.jsx(s,{title:"DrBot Chat",showCostInfo:!0,testId:"chat-panel-container"})})},a={render:()=>e.jsx("div",{style:{height:"500px"},children:e.jsx(s,{title:"Architecture Assistant",showCostInfo:!0,testId:"chat-panel-container"})})},o={render:()=>e.jsx("div",{style:{height:"500px"},children:e.jsx(s,{title:"DrBot Chat",showCostInfo:!1,testId:"chat-panel-container"})})},i={render:()=>e.jsx("div",{style:{height:"500px"},children:e.jsx(s,{title:"DrBot Chat",showCostInfo:!0,testId:"custom-chat-panel"})})},d={render:()=>e.jsx("div",{style:{height:"500px"},children:e.jsx(s,{title:"Custom Chat",showCostInfo:!1,testId:"all-custom"})})},r={render:()=>e.jsx("div",{style:{height:"500px"},children:e.jsx("div",{className:"flex flex-col h-full bg-white dark:bg-gray-800 border rounded-lg",children:e.jsx("div",{className:"flex-1 flex items-center justify-center p-6",children:e.jsx("div",{className:"max-w-md w-full",children:e.jsx("div",{className:"bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4",children:e.jsxs("div",{className:"flex items-start gap-3",children:[e.jsx("div",{className:"flex-shrink-0",children:e.jsx("svg",{className:"w-5 h-5 text-red-600 dark:text-red-400",fill:"currentColor",viewBox:"0 0 20 20",children:e.jsx("path",{fillRule:"evenodd",d:"M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z",clipRule:"evenodd"})})}),e.jsxs("div",{className:"flex-1",children:[e.jsx("h3",{className:"text-sm font-semibold text-red-800 dark:text-red-200 mb-1",children:"Chat Unavailable"}),e.jsx("p",{className:"text-sm text-red-700 dark:text-red-300",children:"Failed to connect to chat service. Please check your connection and try again."})]})]})})})})})})};var l,n,c,h,m;t.parameters={...t.parameters,docs:{...(l=t.parameters)==null?void 0:l.docs,source:{originalSource:`{
  render: () => <div style={{
    height: '500px'
  }}>
    <ChatPanel title="DrBot Chat" showCostInfo={true} testId="chat-panel-container" />
  </div>
}`,...(c=(n=t.parameters)==null?void 0:n.docs)==null?void 0:c.source},description:{story:`ChatPanelContainer Stories

Note: These stories show the ChatPanel component directly to avoid
the 30-second timeout that occurs when ChatPanelContainer tries to
connect to the chat service in the story environment.

For error state demonstration, we show a mock error display.`,...(m=(h=t.parameters)==null?void 0:h.docs)==null?void 0:m.description}}};var p,x,u;a.parameters={...a.parameters,docs:{...(p=a.parameters)==null?void 0:p.docs,source:{originalSource:`{
  render: () => <div style={{
    height: '500px'
  }}>
    <ChatPanel title="Architecture Assistant" showCostInfo={true} testId="chat-panel-container" />
  </div>
}`,...(u=(x=a.parameters)==null?void 0:x.docs)==null?void 0:u.source}}};var v,f,C;o.parameters={...o.parameters,docs:{...(v=o.parameters)==null?void 0:v.docs,source:{originalSource:`{
  render: () => <div style={{
    height: '500px'
  }}>
    <ChatPanel title="DrBot Chat" showCostInfo={false} testId="chat-panel-container" />
  </div>
}`,...(C=(f=o.parameters)==null?void 0:f.docs)==null?void 0:C.source}}};var g,j,w;i.parameters={...i.parameters,docs:{...(g=i.parameters)==null?void 0:g.docs,source:{originalSource:`{
  render: () => <div style={{
    height: '500px'
  }}>
    <ChatPanel title="DrBot Chat" showCostInfo={true} testId="custom-chat-panel" />
  </div>
}`,...(w=(j=i.parameters)==null?void 0:j.docs)==null?void 0:w.source}}};var y,I,b;d.parameters={...d.parameters,docs:{...(y=d.parameters)==null?void 0:y.docs,source:{originalSource:`{
  render: () => <div style={{
    height: '500px'
  }}>
    <ChatPanel title="Custom Chat" showCostInfo={false} testId="all-custom" />
  </div>
}`,...(b=(I=d.parameters)==null?void 0:I.docs)==null?void 0:b.source}}};var N,k,P,D,S;r.parameters={...r.parameters,docs:{...(N=r.parameters)==null?void 0:N.docs,source:{originalSource:`{
  render: () => <div style={{
    height: '500px'
  }}>
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 border rounded-lg">
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-red-800 dark:text-red-200 mb-1">
                  Chat Unavailable
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300">
                  Failed to connect to chat service. Please check your connection and try again.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
}`,...(P=(k=r.parameters)==null?void 0:k.docs)==null?void 0:P.source},description:{story:`Error State - Demonstrates what the error display looks like
when chat service connection fails`,...(S=(D=r.parameters)==null?void 0:D.docs)==null?void 0:S.description}}};const G=["Default","WithCustomTitle","WithoutCostInfo","WithCustomTestId","AllCustomProps","ErrorState"];export{d as AllCustomProps,t as Default,r as ErrorState,i as WithCustomTestId,a as WithCustomTitle,o as WithoutCostInfo,G as __namedExportsOrder,q as default};
