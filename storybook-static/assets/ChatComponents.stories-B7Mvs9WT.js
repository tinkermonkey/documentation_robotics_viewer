import{j as e}from"./iframe-DSSgKmXl.js";import{C as n}from"./ChatTextContent-D1MHf8Qj.js";import{T as r}from"./ThinkingBlock-Dm6mq9Ve.js";import{T as o}from"./ToolInvocationCard-DbyYmtTK.js";import{U as c}from"./UsageStatsBadge-D6eWC_K7.js";import{C as s}from"./ChatMessage-DIZmy_0F.js";import{C as a}from"./ChatInput-DKttK8bN.js";import"./preload-helper-Dp1pzeXC.js";import"./createLucideIcon-CIvKt9yE.js";import"./Badge-4uEMzFcW.js";import"./create-theme-BOkxhGns.js";import"./react-fqQoFC2C.js";import"./errorTracker-DrR4A8t3.js";const Is={title:"D Chat / Components / ChatComponents"},i={render:()=>e.jsx(n,{content:"This is plain text content without any formatting.",isStreaming:!1})},d={render:()=>e.jsx(n,{content:"This is **bold text** and *italic text* and a [link](https://example.com) and `inline code`.",isStreaming:!1})},m={render:()=>e.jsx(n,{content:'Here\'s a code block:\n```javascript\nconst greeting = "Hello, World!";\nconsole.log(greeting);\n```',isStreaming:!1})},l={render:()=>e.jsx(n,{content:`| Feature | Status |
|---------|--------|
| Chat | Active |
| Tools | Active |
| Thinking | Active |`,isStreaming:!1})},p={render:()=>e.jsx(n,{content:"This content is currently streaming...",isStreaming:!0})},u={render:()=>e.jsx(n,{content:`# Heading

This is **bold** and *italic* text.

\`\`\`python
def hello():
    print("Hello")
\`\`\`

And a [link](https://example.com) to check out.`,isStreaming:!1})},g={render:()=>e.jsx(n,{content:`> This is a blockquote
> with multiple lines
> to demonstrate formatting`,isStreaming:!1})},h={render:()=>e.jsx(n,{content:`## Unordered List
- Item 1
- Item 2
- Item 3

## Ordered List
1. First
2. Second
3. Third`,isStreaming:!1})},S={render:()=>e.jsx(r,{content:"I'm thinking about how to solve this problem. Let me consider the requirements and come up with the best approach.",isStreaming:!1,defaultExpanded:!1})},k={render:()=>e.jsx(r,{content:"I'm thinking about how to solve this problem. Let me consider the requirements and come up with the best approach.",isStreaming:!1,defaultExpanded:!0})},C={render:()=>e.jsx(r,{content:"I analyzed the problem carefully and determined the optimal solution.",durationMs:2500,isStreaming:!1,defaultExpanded:!1})},T={render:()=>e.jsx(r,{content:"Analyzing requirements... considering edge cases... formulating response...",isStreaming:!0,defaultExpanded:!0})},x={render:()=>e.jsx(r,{content:`This is a very long thinking block that demonstrates how the component handles content that exceeds 100 characters.
The preview will be truncated when collapsed. When expanded, the full thinking process will be visible to the user.
This allows users to understand the reasoning behind the assistant's response without overwhelming the UI.`,isStreaming:!1,defaultExpanded:!1})},I={render:()=>e.jsx(r,{content:"Brief thought",isStreaming:!1,defaultExpanded:!1})},v={render:()=>e.jsx(o,{toolName:"calculator",toolInput:{expression:"2 + 2"},status:{state:"executing"},timestamp:"2024-01-15T10:30:00Z"})},y={render:()=>e.jsx(o,{toolName:"calculator",toolInput:{expression:"2 + 2"},toolOutput:"4",status:{state:"completed",result:"4"},timestamp:"2024-01-15T10:30:00Z",duration:245})},w={render:()=>e.jsx(o,{toolName:"calculator",toolInput:{expression:"invalid"},toolOutput:"SyntaxError: invalid expression",status:{state:"failed",error:"SyntaxError: invalid expression"},timestamp:"2024-01-15T10:30:00Z",duration:150})},f={render:()=>e.jsx(o,{toolName:"search",toolInput:{query:"documentation"},toolOutput:`[
  { "title": "Getting Started", "url": "https://example.com/start", "score": 0.98 },
  { "title": "API Reference", "url": "https://example.com/api", "score": 0.95 },
  { "title": "Examples", "url": "https://example.com/examples", "score": 0.87 }
]`,status:{state:"completed",result:"Found 3 results"},timestamp:"2024-01-15T10:30:00Z",duration:420})},b={render:()=>e.jsx(o,{toolName:"database_query",toolInput:{table:"users",filters:{active:!0,role:"admin"},limit:10,sort:{created_at:"desc"}},toolOutput:"Retrieved 3 users",status:{state:"completed",result:"Retrieved 3 users"},timestamp:"2024-01-15T10:30:00Z",duration:320})},M={render:()=>e.jsx(o,{toolName:"logger",toolInput:{message:"Event logged",level:"info"},status:{state:"completed"},timestamp:"2024-01-15T10:30:00Z",duration:50})},D={render:()=>e.jsx(c,{inputTokens:50,outputTokens:75,totalTokens:125})},O={render:()=>e.jsx(c,{inputTokens:500,outputTokens:750,totalTokens:1250})},j={render:()=>e.jsx(c,{inputTokens:5e3,outputTokens:7500,totalTokens:12500})},B={render:()=>e.jsx(c,{inputTokens:1234,outputTokens:1234,totalTokens:2468})},E={render:()=>e.jsx(c,{inputTokens:5e4,outputTokens:75e3,totalTokens:125e3})},A={render:()=>{const t={id:"msg-1",role:"user",conversationId:"conv-1",timestamp:new Date().toISOString(),parts:[{type:"text",content:"Hello, what can you help me with?",timestamp:new Date().toISOString()}]};return e.jsx(s,{message:t})}},U={render:()=>{const t={id:"msg-2",role:"assistant",conversationId:"conv-1",timestamp:new Date().toISOString(),parts:[{type:"text",content:"I can help you with a wide range of tasks! I'm knowledgeable about programming, writing, analysis, and more.",timestamp:new Date().toISOString()}]};return e.jsx(s,{message:t})}},N={render:()=>{const t={id:"msg-3",role:"assistant",conversationId:"conv-1",timestamp:new Date().toISOString(),parts:[{type:"thinking",content:"The user is asking about my capabilities. I should provide a comprehensive overview.",timestamp:new Date().toISOString()},{type:"text",content:"I can assist with: writing, coding, analysis, and much more!",timestamp:new Date().toISOString()}]};return e.jsx(s,{message:t})}},L={render:()=>{const t={id:"msg-4",role:"assistant",conversationId:"conv-1",timestamp:new Date().toISOString(),parts:[{type:"text",content:"Here is my response with token usage information included.",timestamp:new Date().toISOString()},{type:"usage",inputTokens:150,outputTokens:200,totalTokens:350,totalCostUsd:.00125,timestamp:new Date().toISOString()}]};return e.jsx(s,{message:t})}},q={render:()=>{const t={id:"msg-5",role:"assistant",conversationId:"conv-1",timestamp:new Date().toISOString(),parts:[{type:"text",content:"Let me search for that information.",timestamp:new Date().toISOString()},{type:"tool_invocation",toolUseId:"tool-use-1",toolName:"search",toolInput:{query:"example"},status:{state:"completed",result:"Found 10 results"},timestamp:new Date().toISOString()}]};return e.jsx(s,{message:t})}},V={render:()=>{const t={id:"msg-6",role:"assistant",conversationId:"conv-1",timestamp:new Date().toISOString(),parts:[{type:"text",content:"This response is currently being streamed to you...",timestamp:new Date().toISOString()}],isStreaming:!0};return e.jsx(s,{message:t})}},W={render:()=>{const t={id:"msg-7",role:"assistant",conversationId:"conv-1",timestamp:new Date().toISOString(),parts:[],isStreaming:!0};return e.jsx(s,{message:t})}},F={render:()=>{const t={id:"msg-8",role:"assistant",conversationId:"conv-1",timestamp:new Date().toISOString(),parts:[{type:"error",code:"SEND_FAILED",message:"Failed to process your request. Please try again.",timestamp:new Date().toISOString()}]};return e.jsx(s,{message:t})}},H={render:()=>e.jsx(a,{onSendMessage:async t=>console.log("Sending:",t),sdkStatus:{sdkAvailable:!0,sdkVersion:"1.0.0",errorMessage:null}})},Z={render:()=>e.jsx(a,{onSendMessage:async t=>console.log("Sending:",t),onCancel:async()=>console.log("Cancelled"),isStreaming:!0,sdkStatus:{sdkAvailable:!0,sdkVersion:"1.0.0",errorMessage:null}})},_={render:()=>e.jsx(a,{onSendMessage:async t=>console.log("Sending:",t),sdkStatus:{sdkAvailable:!1,sdkVersion:null,errorMessage:"SDK not initialized"}})},P={render:()=>e.jsx(a,{onSendMessage:async t=>console.log("Sending:",t),isSending:!0,sdkStatus:{sdkAvailable:!0,sdkVersion:"1.0.0",errorMessage:null}})},R={render:()=>e.jsx(a,{onSendMessage:async t=>console.log("Sending:",t),disabled:!0,sdkStatus:{sdkAvailable:!0,sdkVersion:"1.0.0",errorMessage:null}})},z={render:()=>e.jsx(a,{onSendMessage:async t=>console.log("Sending:",t),placeholder:"Ask me anything...",sdkStatus:{sdkAvailable:!0,sdkVersion:"1.0.0",errorMessage:null}})},K={render:()=>e.jsxs("div",{className:"space-y-4 p-4 bg-white dark:bg-gray-900",children:[e.jsx("div",{className:"text-sm text-gray-500",children:"Conversation Example"}),e.jsx(s,{message:{id:"msg-1",role:"user",conversationId:"conv-1",timestamp:new Date().toISOString(),parts:[{type:"text",content:"What is 2 + 2?",timestamp:new Date().toISOString()}]}}),e.jsx(s,{message:{id:"msg-2",role:"assistant",conversationId:"conv-1",timestamp:new Date().toISOString(),parts:[{type:"thinking",content:"Simple arithmetic",timestamp:new Date().toISOString()},{type:"text",content:"The answer is 4.",timestamp:new Date().toISOString()},{type:"usage",inputTokens:20,outputTokens:30,totalTokens:50,totalCostUsd:2e-4,timestamp:new Date().toISOString()}]}}),e.jsx(a,{onSendMessage:async t=>console.log("Sending:",t),sdkStatus:{sdkAvailable:!0,sdkVersion:"1.0.0",errorMessage:null}})]})};var G,J,Q,X,Y;i.parameters={...i.parameters,docs:{...(G=i.parameters)==null?void 0:G.docs,source:{originalSource:`{
  render: () => <ChatTextContent content="This is plain text content without any formatting." isStreaming={false} />
}`,...(Q=(J=i.parameters)==null?void 0:J.docs)==null?void 0:Q.source},description:{story:`Storybook Stories for Chat Components
Comprehensive component variations for validation and visual testing`,...(Y=(X=i.parameters)==null?void 0:X.docs)==null?void 0:Y.description}}};var $,ee,te;d.parameters={...d.parameters,docs:{...($=d.parameters)==null?void 0:$.docs,source:{originalSource:'{\n  render: () => <ChatTextContent content="This is **bold text** and *italic text* and a [link](https://example.com) and `inline code`." isStreaming={false} />\n}',...(te=(ee=d.parameters)==null?void 0:ee.docs)==null?void 0:te.source}}};var se,ne,ae;m.parameters={...m.parameters,docs:{...(se=m.parameters)==null?void 0:se.docs,source:{originalSource:'{\n  render: () => <ChatTextContent content={`Here\'s a code block:\\n\\`\\`\\`javascript\\nconst greeting = "Hello, World!";\\nconsole.log(greeting);\\n\\`\\`\\``} isStreaming={false} />\n}',...(ae=(ne=m.parameters)==null?void 0:ne.docs)==null?void 0:ae.source}}};var re,oe,ie;l.parameters={...l.parameters,docs:{...(re=l.parameters)==null?void 0:re.docs,source:{originalSource:"{\n  render: () => <ChatTextContent content={`| Feature | Status |\\n|---------|--------|\\n| Chat | Active |\\n| Tools | Active |\\n| Thinking | Active |`} isStreaming={false} />\n}",...(ie=(oe=l.parameters)==null?void 0:oe.docs)==null?void 0:ie.source}}};var ce,de,me;p.parameters={...p.parameters,docs:{...(ce=p.parameters)==null?void 0:ce.docs,source:{originalSource:`{
  render: () => <ChatTextContent content="This content is currently streaming..." isStreaming={true} />
}`,...(me=(de=p.parameters)==null?void 0:de.docs)==null?void 0:me.source}}};var le,pe,ue;u.parameters={...u.parameters,docs:{...(le=u.parameters)==null?void 0:le.docs,source:{originalSource:'{\n  render: () => <ChatTextContent content={`# Heading\\n\\nThis is **bold** and *italic* text.\\n\\n\\`\\`\\`python\\ndef hello():\\n    print("Hello")\\n\\`\\`\\`\\n\\nAnd a [link](https://example.com) to check out.`} isStreaming={false} />\n}',...(ue=(pe=u.parameters)==null?void 0:pe.docs)==null?void 0:ue.source}}};var ge,he,Se;g.parameters={...g.parameters,docs:{...(ge=g.parameters)==null?void 0:ge.docs,source:{originalSource:"{\n  render: () => <ChatTextContent content={`> This is a blockquote\\n> with multiple lines\\n> to demonstrate formatting`} isStreaming={false} />\n}",...(Se=(he=g.parameters)==null?void 0:he.docs)==null?void 0:Se.source}}};var ke,Ce,Te;h.parameters={...h.parameters,docs:{...(ke=h.parameters)==null?void 0:ke.docs,source:{originalSource:"{\n  render: () => <ChatTextContent content={`## Unordered List\\n- Item 1\\n- Item 2\\n- Item 3\\n\\n## Ordered List\\n1. First\\n2. Second\\n3. Third`} isStreaming={false} />\n}",...(Te=(Ce=h.parameters)==null?void 0:Ce.docs)==null?void 0:Te.source}}};var xe,Ie,ve;S.parameters={...S.parameters,docs:{...(xe=S.parameters)==null?void 0:xe.docs,source:{originalSource:`{
  render: () => <ThinkingBlock content="I'm thinking about how to solve this problem. Let me consider the requirements and come up with the best approach." isStreaming={false} defaultExpanded={false} />
}`,...(ve=(Ie=S.parameters)==null?void 0:Ie.docs)==null?void 0:ve.source}}};var ye,we,fe;k.parameters={...k.parameters,docs:{...(ye=k.parameters)==null?void 0:ye.docs,source:{originalSource:`{
  render: () => <ThinkingBlock content="I'm thinking about how to solve this problem. Let me consider the requirements and come up with the best approach." isStreaming={false} defaultExpanded={true} />
}`,...(fe=(we=k.parameters)==null?void 0:we.docs)==null?void 0:fe.source}}};var be,Me,De;C.parameters={...C.parameters,docs:{...(be=C.parameters)==null?void 0:be.docs,source:{originalSource:`{
  render: () => <ThinkingBlock content="I analyzed the problem carefully and determined the optimal solution." durationMs={2500} isStreaming={false} defaultExpanded={false} />
}`,...(De=(Me=C.parameters)==null?void 0:Me.docs)==null?void 0:De.source}}};var Oe,je,Be;T.parameters={...T.parameters,docs:{...(Oe=T.parameters)==null?void 0:Oe.docs,source:{originalSource:`{
  render: () => <ThinkingBlock content="Analyzing requirements... considering edge cases... formulating response..." isStreaming={true} defaultExpanded={true} />
}`,...(Be=(je=T.parameters)==null?void 0:je.docs)==null?void 0:Be.source}}};var Ee,Ae,Ue;x.parameters={...x.parameters,docs:{...(Ee=x.parameters)==null?void 0:Ee.docs,source:{originalSource:`{
  render: () => <ThinkingBlock content={\`This is a very long thinking block that demonstrates how the component handles content that exceeds 100 characters.
The preview will be truncated when collapsed. When expanded, the full thinking process will be visible to the user.
This allows users to understand the reasoning behind the assistant's response without overwhelming the UI.\`} isStreaming={false} defaultExpanded={false} />
}`,...(Ue=(Ae=x.parameters)==null?void 0:Ae.docs)==null?void 0:Ue.source}}};var Ne,Le,qe;I.parameters={...I.parameters,docs:{...(Ne=I.parameters)==null?void 0:Ne.docs,source:{originalSource:`{
  render: () => <ThinkingBlock content="Brief thought" isStreaming={false} defaultExpanded={false} />
}`,...(qe=(Le=I.parameters)==null?void 0:Le.docs)==null?void 0:qe.source}}};var Ve,We,Fe;v.parameters={...v.parameters,docs:{...(Ve=v.parameters)==null?void 0:Ve.docs,source:{originalSource:`{
  render: () => <ToolInvocationCard toolName="calculator" toolInput={{
    expression: "2 + 2"
  }} status={{
    state: 'executing'
  }} timestamp="2024-01-15T10:30:00Z" />
}`,...(Fe=(We=v.parameters)==null?void 0:We.docs)==null?void 0:Fe.source}}};var He,Ze,_e;y.parameters={...y.parameters,docs:{...(He=y.parameters)==null?void 0:He.docs,source:{originalSource:`{
  render: () => <ToolInvocationCard toolName="calculator" toolInput={{
    expression: "2 + 2"
  }} toolOutput="4" status={{
    state: 'completed',
    result: '4'
  }} timestamp="2024-01-15T10:30:00Z" duration={245} />
}`,...(_e=(Ze=y.parameters)==null?void 0:Ze.docs)==null?void 0:_e.source}}};var Pe,Re,ze;w.parameters={...w.parameters,docs:{...(Pe=w.parameters)==null?void 0:Pe.docs,source:{originalSource:`{
  render: () => <ToolInvocationCard toolName="calculator" toolInput={{
    expression: "invalid"
  }} toolOutput="SyntaxError: invalid expression" status={{
    state: 'failed',
    error: 'SyntaxError: invalid expression'
  }} timestamp="2024-01-15T10:30:00Z" duration={150} />
}`,...(ze=(Re=w.parameters)==null?void 0:Re.docs)==null?void 0:ze.source}}};var Ke,Ge,Je;f.parameters={...f.parameters,docs:{...(Ke=f.parameters)==null?void 0:Ke.docs,source:{originalSource:`{
  render: () => <ToolInvocationCard toolName="search" toolInput={{
    query: "documentation"
  }} toolOutput={\`[
  { "title": "Getting Started", "url": "https://example.com/start", "score": 0.98 },
  { "title": "API Reference", "url": "https://example.com/api", "score": 0.95 },
  { "title": "Examples", "url": "https://example.com/examples", "score": 0.87 }
]\`} status={{
    state: 'completed',
    result: 'Found 3 results'
  }} timestamp="2024-01-15T10:30:00Z" duration={420} />
}`,...(Je=(Ge=f.parameters)==null?void 0:Ge.docs)==null?void 0:Je.source}}};var Qe,Xe,Ye;b.parameters={...b.parameters,docs:{...(Qe=b.parameters)==null?void 0:Qe.docs,source:{originalSource:`{
  render: () => <ToolInvocationCard toolName="database_query" toolInput={{
    table: "users",
    filters: {
      active: true,
      role: "admin"
    },
    limit: 10,
    sort: {
      created_at: "desc"
    }
  }} toolOutput='Retrieved 3 users' status={{
    state: 'completed',
    result: 'Retrieved 3 users'
  }} timestamp="2024-01-15T10:30:00Z" duration={320} />
}`,...(Ye=(Xe=b.parameters)==null?void 0:Xe.docs)==null?void 0:Ye.source}}};var $e,et,tt;M.parameters={...M.parameters,docs:{...($e=M.parameters)==null?void 0:$e.docs,source:{originalSource:`{
  render: () => <ToolInvocationCard toolName="logger" toolInput={{
    message: "Event logged",
    level: "info"
  }} status={{
    state: 'completed'
  }} timestamp="2024-01-15T10:30:00Z" duration={50} />
}`,...(tt=(et=M.parameters)==null?void 0:et.docs)==null?void 0:tt.source}}};var st,nt,at;D.parameters={...D.parameters,docs:{...(st=D.parameters)==null?void 0:st.docs,source:{originalSource:`{
  render: () => <UsageStatsBadge inputTokens={50} outputTokens={75} totalTokens={125} />
}`,...(at=(nt=D.parameters)==null?void 0:nt.docs)==null?void 0:at.source}}};var rt,ot,it;O.parameters={...O.parameters,docs:{...(rt=O.parameters)==null?void 0:rt.docs,source:{originalSource:`{
  render: () => <UsageStatsBadge inputTokens={500} outputTokens={750} totalTokens={1250} />
}`,...(it=(ot=O.parameters)==null?void 0:ot.docs)==null?void 0:it.source}}};var ct,dt,mt;j.parameters={...j.parameters,docs:{...(ct=j.parameters)==null?void 0:ct.docs,source:{originalSource:`{
  render: () => <UsageStatsBadge inputTokens={5000} outputTokens={7500} totalTokens={12500} />
}`,...(mt=(dt=j.parameters)==null?void 0:dt.docs)==null?void 0:mt.source}}};var lt,pt,ut;B.parameters={...B.parameters,docs:{...(lt=B.parameters)==null?void 0:lt.docs,source:{originalSource:`{
  render: () => <UsageStatsBadge inputTokens={1234} outputTokens={1234} totalTokens={2468} />
}`,...(ut=(pt=B.parameters)==null?void 0:pt.docs)==null?void 0:ut.source}}};var gt,ht,St;E.parameters={...E.parameters,docs:{...(gt=E.parameters)==null?void 0:gt.docs,source:{originalSource:`{
  render: () => <UsageStatsBadge inputTokens={50000} outputTokens={75000} totalTokens={125000} />
}`,...(St=(ht=E.parameters)==null?void 0:ht.docs)==null?void 0:St.source}}};var kt,Ct,Tt;A.parameters={...A.parameters,docs:{...(kt=A.parameters)==null?void 0:kt.docs,source:{originalSource:`{
  render: () => {
    const message: ChatMessageType = {
      id: 'msg-1',
      role: 'user',
      conversationId: 'conv-1',
      timestamp: new Date().toISOString(),
      parts: [{
        type: 'text',
        content: 'Hello, what can you help me with?',
        timestamp: new Date().toISOString()
      }]
    };
    return <ChatMessage message={message} />;
  }
}`,...(Tt=(Ct=A.parameters)==null?void 0:Ct.docs)==null?void 0:Tt.source}}};var xt,It,vt;U.parameters={...U.parameters,docs:{...(xt=U.parameters)==null?void 0:xt.docs,source:{originalSource:`{
  render: () => {
    const message: ChatMessageType = {
      id: 'msg-2',
      role: 'assistant',
      conversationId: 'conv-1',
      timestamp: new Date().toISOString(),
      parts: [{
        type: 'text',
        content: "I can help you with a wide range of tasks! I'm knowledgeable about programming, writing, analysis, and more.",
        timestamp: new Date().toISOString()
      }]
    };
    return <ChatMessage message={message} />;
  }
}`,...(vt=(It=U.parameters)==null?void 0:It.docs)==null?void 0:vt.source}}};var yt,wt,ft;N.parameters={...N.parameters,docs:{...(yt=N.parameters)==null?void 0:yt.docs,source:{originalSource:`{
  render: () => {
    const message: ChatMessageType = {
      id: 'msg-3',
      role: 'assistant',
      conversationId: 'conv-1',
      timestamp: new Date().toISOString(),
      parts: [{
        type: 'thinking',
        content: 'The user is asking about my capabilities. I should provide a comprehensive overview.',
        timestamp: new Date().toISOString()
      }, {
        type: 'text',
        content: 'I can assist with: writing, coding, analysis, and much more!',
        timestamp: new Date().toISOString()
      }]
    };
    return <ChatMessage message={message} />;
  }
}`,...(ft=(wt=N.parameters)==null?void 0:wt.docs)==null?void 0:ft.source}}};var bt,Mt,Dt;L.parameters={...L.parameters,docs:{...(bt=L.parameters)==null?void 0:bt.docs,source:{originalSource:`{
  render: () => {
    const message: ChatMessageType = {
      id: 'msg-4',
      role: 'assistant',
      conversationId: 'conv-1',
      timestamp: new Date().toISOString(),
      parts: [{
        type: 'text',
        content: 'Here is my response with token usage information included.',
        timestamp: new Date().toISOString()
      }, {
        type: 'usage',
        inputTokens: 150,
        outputTokens: 200,
        totalTokens: 350,
        totalCostUsd: 0.00125,
        timestamp: new Date().toISOString()
      }]
    };
    return <ChatMessage message={message} />;
  }
}`,...(Dt=(Mt=L.parameters)==null?void 0:Mt.docs)==null?void 0:Dt.source}}};var Ot,jt,Bt;q.parameters={...q.parameters,docs:{...(Ot=q.parameters)==null?void 0:Ot.docs,source:{originalSource:`{
  render: () => {
    const message: ChatMessageType = {
      id: 'msg-5',
      role: 'assistant',
      conversationId: 'conv-1',
      timestamp: new Date().toISOString(),
      parts: [{
        type: 'text',
        content: 'Let me search for that information.',
        timestamp: new Date().toISOString()
      }, {
        type: 'tool_invocation',
        toolUseId: 'tool-use-1',
        toolName: 'search',
        toolInput: {
          query: 'example'
        },
        status: {
          state: 'completed',
          result: 'Found 10 results'
        },
        timestamp: new Date().toISOString()
      }]
    };
    return <ChatMessage message={message} />;
  }
}`,...(Bt=(jt=q.parameters)==null?void 0:jt.docs)==null?void 0:Bt.source}}};var Et,At,Ut;V.parameters={...V.parameters,docs:{...(Et=V.parameters)==null?void 0:Et.docs,source:{originalSource:`{
  render: () => {
    const message: ChatMessageType = {
      id: 'msg-6',
      role: 'assistant',
      conversationId: 'conv-1',
      timestamp: new Date().toISOString(),
      parts: [{
        type: 'text',
        content: 'This response is currently being streamed to you...',
        timestamp: new Date().toISOString()
      }],
      isStreaming: true
    };
    return <ChatMessage message={message} />;
  }
}`,...(Ut=(At=V.parameters)==null?void 0:At.docs)==null?void 0:Ut.source}}};var Nt,Lt,qt;W.parameters={...W.parameters,docs:{...(Nt=W.parameters)==null?void 0:Nt.docs,source:{originalSource:`{
  render: () => {
    const message: ChatMessageType = {
      id: 'msg-7',
      role: 'assistant',
      conversationId: 'conv-1',
      timestamp: new Date().toISOString(),
      parts: [],
      isStreaming: true
    };
    return <ChatMessage message={message} />;
  }
}`,...(qt=(Lt=W.parameters)==null?void 0:Lt.docs)==null?void 0:qt.source}}};var Vt,Wt,Ft;F.parameters={...F.parameters,docs:{...(Vt=F.parameters)==null?void 0:Vt.docs,source:{originalSource:`{
  render: () => {
    const message: ChatMessageType = {
      id: 'msg-8',
      role: 'assistant',
      conversationId: 'conv-1',
      timestamp: new Date().toISOString(),
      parts: [{
        type: 'error',
        code: 'SEND_FAILED',
        message: 'Failed to process your request. Please try again.',
        timestamp: new Date().toISOString()
      }]
    };
    return <ChatMessage message={message} />;
  }
}`,...(Ft=(Wt=F.parameters)==null?void 0:Wt.docs)==null?void 0:Ft.source}}};var Ht,Zt,_t;H.parameters={...H.parameters,docs:{...(Ht=H.parameters)==null?void 0:Ht.docs,source:{originalSource:`{
  render: () => <ChatInput onSendMessage={async (msg: string) => console.log('Sending:', msg)} sdkStatus={{
    sdkAvailable: true,
    sdkVersion: '1.0.0',
    errorMessage: null
  }} />
}`,...(_t=(Zt=H.parameters)==null?void 0:Zt.docs)==null?void 0:_t.source}}};var Pt,Rt,zt;Z.parameters={...Z.parameters,docs:{...(Pt=Z.parameters)==null?void 0:Pt.docs,source:{originalSource:`{
  render: () => <ChatInput onSendMessage={async (msg: string) => console.log('Sending:', msg)} onCancel={async () => console.log('Cancelled')} isStreaming={true} sdkStatus={{
    sdkAvailable: true,
    sdkVersion: '1.0.0',
    errorMessage: null
  }} />
}`,...(zt=(Rt=Z.parameters)==null?void 0:Rt.docs)==null?void 0:zt.source}}};var Kt,Gt,Jt;_.parameters={..._.parameters,docs:{...(Kt=_.parameters)==null?void 0:Kt.docs,source:{originalSource:`{
  render: () => <ChatInput onSendMessage={async (msg: string) => console.log('Sending:', msg)} sdkStatus={{
    sdkAvailable: false,
    sdkVersion: null,
    errorMessage: 'SDK not initialized'
  }} />
}`,...(Jt=(Gt=_.parameters)==null?void 0:Gt.docs)==null?void 0:Jt.source}}};var Qt,Xt,Yt;P.parameters={...P.parameters,docs:{...(Qt=P.parameters)==null?void 0:Qt.docs,source:{originalSource:`{
  render: () => <ChatInput onSendMessage={async (msg: string) => console.log('Sending:', msg)} isSending={true} sdkStatus={{
    sdkAvailable: true,
    sdkVersion: '1.0.0',
    errorMessage: null
  }} />
}`,...(Yt=(Xt=P.parameters)==null?void 0:Xt.docs)==null?void 0:Yt.source}}};var $t,es,ts;R.parameters={...R.parameters,docs:{...($t=R.parameters)==null?void 0:$t.docs,source:{originalSource:`{
  render: () => <ChatInput onSendMessage={async (msg: string) => console.log('Sending:', msg)} disabled={true} sdkStatus={{
    sdkAvailable: true,
    sdkVersion: '1.0.0',
    errorMessage: null
  }} />
}`,...(ts=(es=R.parameters)==null?void 0:es.docs)==null?void 0:ts.source}}};var ss,ns,as;z.parameters={...z.parameters,docs:{...(ss=z.parameters)==null?void 0:ss.docs,source:{originalSource:`{
  render: () => <ChatInput onSendMessage={async (msg: string) => console.log('Sending:', msg)} placeholder="Ask me anything..." sdkStatus={{
    sdkAvailable: true,
    sdkVersion: '1.0.0',
    errorMessage: null
  }} />
}`,...(as=(ns=z.parameters)==null?void 0:ns.docs)==null?void 0:as.source}}};var rs,os,is;K.parameters={...K.parameters,docs:{...(rs=K.parameters)==null?void 0:rs.docs,source:{originalSource:`{
  render: () => <div className="space-y-4 p-4 bg-white dark:bg-gray-900">
    <div className="text-sm text-gray-500">Conversation Example</div>
    <ChatMessage message={{
      id: 'msg-1',
      role: 'user',
      conversationId: 'conv-1',
      timestamp: new Date().toISOString(),
      parts: [{
        type: 'text',
        content: 'What is 2 + 2?',
        timestamp: new Date().toISOString()
      }]
    }} />
    <ChatMessage message={{
      id: 'msg-2',
      role: 'assistant',
      conversationId: 'conv-1',
      timestamp: new Date().toISOString(),
      parts: [{
        type: 'thinking',
        content: 'Simple arithmetic',
        timestamp: new Date().toISOString()
      }, {
        type: 'text',
        content: 'The answer is 4.',
        timestamp: new Date().toISOString()
      }, {
        type: 'usage',
        inputTokens: 20,
        outputTokens: 30,
        totalTokens: 50,
        totalCostUsd: 0.0002,
        timestamp: new Date().toISOString()
      }]
    }} />
    <ChatInput onSendMessage={async (msg: string) => console.log('Sending:', msg)} sdkStatus={{
      sdkAvailable: true,
      sdkVersion: '1.0.0',
      errorMessage: null
    }} />
  </div>
}`,...(is=(os=K.parameters)==null?void 0:os.docs)==null?void 0:is.source}}};const vs=["ChatTextContentBasic","ChatTextContentMarkdown","ChatTextContentCodeBlock","ChatTextContentTable","ChatTextContentStreaming","ChatTextContentMixed","ChatTextContentBlockquote","ChatTextContentLists","ThinkingBlockDefault","ThinkingBlockExpanded","ThinkingBlockWithDuration","ThinkingBlockStreaming","ThinkingBlockLongContent","ThinkingBlockShortContent","ToolInvocationCardExecuting","ToolInvocationCardComplete","ToolInvocationCardError","ToolInvocationCardLongOutput","ToolInvocationCardComplexInput","ToolInvocationCardNoOutput","UsageStatsBadgeSmall","UsageStatsBadgeMedium","UsageStatsBadgeLarge","UsageStatsBadgeFormatted","UsageStatsBadgeHighVolume","ChatMessageUser","ChatMessageAssistant","ChatMessageWithThinking","ChatMessageWithUsage","ChatMessageWithToolInvocation","ChatMessageStreaming","ChatMessageStreamingEmpty","ChatMessageWithError","ChatInputDefault","ChatInputStreaming","ChatInputDisabledSDK","ChatInputSending","ChatInputDisabled","ChatInputCustomPlaceholder","ChatPanelConversation"];export{z as ChatInputCustomPlaceholder,H as ChatInputDefault,R as ChatInputDisabled,_ as ChatInputDisabledSDK,P as ChatInputSending,Z as ChatInputStreaming,U as ChatMessageAssistant,V as ChatMessageStreaming,W as ChatMessageStreamingEmpty,A as ChatMessageUser,F as ChatMessageWithError,N as ChatMessageWithThinking,q as ChatMessageWithToolInvocation,L as ChatMessageWithUsage,K as ChatPanelConversation,i as ChatTextContentBasic,g as ChatTextContentBlockquote,m as ChatTextContentCodeBlock,h as ChatTextContentLists,d as ChatTextContentMarkdown,u as ChatTextContentMixed,p as ChatTextContentStreaming,l as ChatTextContentTable,S as ThinkingBlockDefault,k as ThinkingBlockExpanded,x as ThinkingBlockLongContent,I as ThinkingBlockShortContent,T as ThinkingBlockStreaming,C as ThinkingBlockWithDuration,y as ToolInvocationCardComplete,b as ToolInvocationCardComplexInput,w as ToolInvocationCardError,v as ToolInvocationCardExecuting,f as ToolInvocationCardLongOutput,M as ToolInvocationCardNoOutput,B as UsageStatsBadgeFormatted,E as UsageStatsBadgeHighVolume,j as UsageStatsBadgeLarge,O as UsageStatsBadgeMedium,D as UsageStatsBadgeSmall,vs as __namedExportsOrder,Is as default};
