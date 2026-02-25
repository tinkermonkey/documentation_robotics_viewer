import{j as e}from"./iframe-DSSgKmXl.js";import{C as s}from"./ChatMessage-DIZmy_0F.js";import"./preload-helper-Dp1pzeXC.js";import"./react-fqQoFC2C.js";import"./errorTracker-DrR4A8t3.js";import"./ChatTextContent-D1MHf8Qj.js";import"./ThinkingBlock-Dm6mq9Ve.js";import"./createLucideIcon-CIvKt9yE.js";import"./ToolInvocationCard-DbyYmtTK.js";import"./Badge-4uEMzFcW.js";import"./create-theme-BOkxhGns.js";import"./UsageStatsBadge-D6eWC_K7.js";import"./ChatInput-DKttK8bN.js";const Z={title:"D Chat / Messages / ChatMessage"},a={render:()=>{const t={id:"1",role:"user",conversationId:"conv-1",timestamp:new Date().toISOString(),parts:[{type:"text",content:"Can you help me understand the motivation layer in this architecture?",timestamp:new Date().toISOString()}]};return e.jsx("div",{className:"p-4 max-w-3xl bg-white dark:bg-gray-800",children:e.jsx(s,{message:t})})}},r={render:()=>{const t={id:"2",role:"assistant",conversationId:"conv-1",timestamp:new Date().toISOString(),parts:[{type:"text",content:"The motivation layer captures the strategic drivers, goals, and stakeholders that guide the architecture. It includes elements like business goals, constraints, and principles that influence design decisions.",timestamp:new Date().toISOString()}]};return e.jsx("div",{className:"p-4 max-w-3xl bg-white dark:bg-gray-800",children:e.jsx(s,{message:t})})}},n={render:()=>{const t={id:"3",role:"assistant",conversationId:"conv-1",timestamp:new Date().toISOString(),isStreaming:!0,parts:[{type:"text",content:"Let me analyze the business layer for you. I can see several key components including...",timestamp:new Date().toISOString()}]};return e.jsx("div",{className:"p-4 max-w-3xl bg-white dark:bg-gray-800",children:e.jsx(s,{message:t})})}},i={render:()=>{const t={id:"4",role:"assistant",conversationId:"conv-1",timestamp:new Date().toISOString(),parts:[{type:"text",content:"Let me search for the stakeholder elements in the model.",timestamp:new Date().toISOString()},{type:"tool_invocation",toolUseId:"tool-1",toolName:"searchModel",toolInput:{query:"stakeholder",layer:"motivation"},status:{state:"completed",result:{count:5,elements:["CEO","CTO","Product Manager"]}},timestamp:new Date().toISOString()},{type:"text",content:"I found 5 stakeholders defined in the motivation layer.",timestamp:new Date().toISOString()}]};return e.jsx("div",{className:"p-4 max-w-3xl bg-white dark:bg-gray-800",children:e.jsx(s,{message:t})})}},o={render:()=>{const t={id:"5",role:"assistant",conversationId:"conv-1",timestamp:new Date().toISOString(),parts:[{type:"thinking",content:"The user is asking about the relationship between goals and constraints. I should first analyze the model structure to identify all goal elements, then trace their relationships to constraint elements. This will require examining the motivation layer graph.",timestamp:new Date().toISOString()},{type:"text",content:"Based on the model structure, I can see that your business goals are constrained by three key factors: budget limitations, regulatory compliance, and technical feasibility.",timestamp:new Date().toISOString()}]};return e.jsx("div",{className:"p-4 max-w-3xl bg-white dark:bg-gray-800",children:e.jsx(s,{message:t})})}},m={render:()=>{const t={id:"6",role:"assistant",conversationId:"conv-1",timestamp:new Date().toISOString(),parts:[{type:"text",content:"I've analyzed all the layers in your architecture model and identified several key relationships between the business and application layers.",timestamp:new Date().toISOString()},{type:"usage",inputTokens:1250,outputTokens:380,totalTokens:1630,totalCostUsd:.0245,timestamp:new Date().toISOString()}]};return e.jsx("div",{className:"p-4 max-w-3xl bg-white dark:bg-gray-800",children:e.jsx(s,{message:t})})}};var c,d,l,p,g;a.parameters={...a.parameters,docs:{...(c=a.parameters)==null?void 0:c.docs,source:{originalSource:`{
  render: () => {
    const message: ChatMessageType = {
      id: '1',
      role: 'user',
      conversationId: 'conv-1',
      timestamp: new Date().toISOString(),
      parts: [{
        type: 'text',
        content: 'Can you help me understand the motivation layer in this architecture?',
        timestamp: new Date().toISOString()
      }]
    };
    return <div className="p-4 max-w-3xl bg-white dark:bg-gray-800">
      <ChatMessage message={message} />
    </div>;
  }
}`,...(l=(d=a.parameters)==null?void 0:d.docs)==null?void 0:l.source},description:{story:"User message with simple text",...(g=(p=a.parameters)==null?void 0:p.docs)==null?void 0:g.description}}};var h,u,y,S,w;r.parameters={...r.parameters,docs:{...(h=r.parameters)==null?void 0:h.docs,source:{originalSource:`{
  render: () => {
    const message: ChatMessageType = {
      id: '2',
      role: 'assistant',
      conversationId: 'conv-1',
      timestamp: new Date().toISOString(),
      parts: [{
        type: 'text',
        content: 'The motivation layer captures the strategic drivers, goals, and stakeholders that guide the architecture. It includes elements like business goals, constraints, and principles that influence design decisions.',
        timestamp: new Date().toISOString()
      }]
    };
    return <div className="p-4 max-w-3xl bg-white dark:bg-gray-800">
      <ChatMessage message={message} />
    </div>;
  }
}`,...(y=(u=r.parameters)==null?void 0:u.docs)==null?void 0:y.source},description:{story:"Assistant message with simple text response",...(w=(S=r.parameters)==null?void 0:S.docs)==null?void 0:w.description}}};var v,I,x,b,k;n.parameters={...n.parameters,docs:{...(v=n.parameters)==null?void 0:v.docs,source:{originalSource:`{
  render: () => {
    const message: ChatMessageType = {
      id: '3',
      role: 'assistant',
      conversationId: 'conv-1',
      timestamp: new Date().toISOString(),
      isStreaming: true,
      parts: [{
        type: 'text',
        content: 'Let me analyze the business layer for you. I can see several key components including...',
        timestamp: new Date().toISOString()
      }]
    };
    return <div className="p-4 max-w-3xl bg-white dark:bg-gray-800">
      <ChatMessage message={message} />
    </div>;
  }
}`,...(x=(I=n.parameters)==null?void 0:I.docs)==null?void 0:x.source},description:{story:"Assistant message being streamed",...(k=(b=n.parameters)==null?void 0:b.docs)==null?void 0:k.description}}};var O,D,M,C,T;i.parameters={...i.parameters,docs:{...(O=i.parameters)==null?void 0:O.docs,source:{originalSource:`{
  render: () => {
    const message: ChatMessageType = {
      id: '4',
      role: 'assistant',
      conversationId: 'conv-1',
      timestamp: new Date().toISOString(),
      parts: [{
        type: 'text',
        content: "Let me search for the stakeholder elements in the model.",
        timestamp: new Date().toISOString()
      }, {
        type: 'tool_invocation',
        toolUseId: 'tool-1',
        toolName: 'searchModel',
        toolInput: {
          query: 'stakeholder',
          layer: 'motivation'
        },
        status: {
          state: 'completed',
          result: {
            count: 5,
            elements: ['CEO', 'CTO', 'Product Manager']
          }
        },
        timestamp: new Date().toISOString()
      }, {
        type: 'text',
        content: "I found 5 stakeholders defined in the motivation layer.",
        timestamp: new Date().toISOString()
      }]
    };
    return <div className="p-4 max-w-3xl bg-white dark:bg-gray-800">
      <ChatMessage message={message} />
    </div>;
  }
}`,...(M=(D=i.parameters)==null?void 0:D.docs)==null?void 0:M.source},description:{story:"Message with tool invocations",...(T=(C=i.parameters)==null?void 0:C.docs)==null?void 0:T.description}}};var f,j,N,U,z;o.parameters={...o.parameters,docs:{...(f=o.parameters)==null?void 0:f.docs,source:{originalSource:`{
  render: () => {
    const message: ChatMessageType = {
      id: '5',
      role: 'assistant',
      conversationId: 'conv-1',
      timestamp: new Date().toISOString(),
      parts: [{
        type: 'thinking',
        content: 'The user is asking about the relationship between goals and constraints. I should first analyze the model structure to identify all goal elements, then trace their relationships to constraint elements. This will require examining the motivation layer graph.',
        timestamp: new Date().toISOString()
      }, {
        type: 'text',
        content: "Based on the model structure, I can see that your business goals are constrained by three key factors: budget limitations, regulatory compliance, and technical feasibility.",
        timestamp: new Date().toISOString()
      }]
    };
    return <div className="p-4 max-w-3xl bg-white dark:bg-gray-800">
      <ChatMessage message={message} />
    </div>;
  }
}`,...(N=(j=o.parameters)==null?void 0:j.docs)==null?void 0:N.source},description:{story:"Message with extended thinking",...(z=(U=o.parameters)==null?void 0:U.docs)==null?void 0:z.description}}};var W,q,A,E,L;m.parameters={...m.parameters,docs:{...(W=m.parameters)==null?void 0:W.docs,source:{originalSource:`{
  render: () => {
    const message: ChatMessageType = {
      id: '6',
      role: 'assistant',
      conversationId: 'conv-1',
      timestamp: new Date().toISOString(),
      parts: [{
        type: 'text',
        content: "I've analyzed all the layers in your architecture model and identified several key relationships between the business and application layers.",
        timestamp: new Date().toISOString()
      }, {
        type: 'usage',
        inputTokens: 1250,
        outputTokens: 380,
        totalTokens: 1630,
        totalCostUsd: 0.0245,
        timestamp: new Date().toISOString()
      }]
    };
    return <div className="p-4 max-w-3xl bg-white dark:bg-gray-800">
      <ChatMessage message={message} />
    </div>;
  }
}`,...(A=(q=m.parameters)==null?void 0:q.docs)==null?void 0:A.source},description:{story:"Message with usage statistics",...(L=(E=m.parameters)==null?void 0:E.docs)==null?void 0:L.description}}};const $=["UserMessage","AssistantMessage","StreamingMessage","WithToolInvocations","WithThinking","WithUsageStats"];export{r as AssistantMessage,n as StreamingMessage,a as UserMessage,o as WithThinking,i as WithToolInvocations,m as WithUsageStats,$ as __namedExportsOrder,Z as default};
