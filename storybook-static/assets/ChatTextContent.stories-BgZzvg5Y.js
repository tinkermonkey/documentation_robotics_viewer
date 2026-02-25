import{j as e}from"./iframe-DSSgKmXl.js";import{C as t}from"./ChatTextContent-D1MHf8Qj.js";import"./preload-helper-Dp1pzeXC.js";const K={title:"D Chat / Messages / ChatTextContent"},n={render:()=>e.jsx("div",{className:"p-4 max-w-3xl bg-white dark:bg-gray-800",children:e.jsx(t,{content:"This is a simple text message without any markdown formatting."})})},a={render:()=>e.jsx("div",{className:"p-4 max-w-3xl bg-white dark:bg-gray-800",children:e.jsx(t,{content:`
Here's a **bold** statement and an *italic* one.

You can also have \`inline code\` in your messages.

Lists work too:
- Item one
- Item two
- Item three
  `})})},s={render:()=>e.jsx("div",{className:"p-4 max-w-3xl bg-white dark:bg-gray-800",children:e.jsx(t,{content:`
Here's an example TypeScript function:

\`\`\`typescript
interface Goal {
  id: string;
  name: string;
  description: string;
}

function findGoals(model: MetaModel): Goal[] {
  return model.elements.filter(e => e.type === 'Goal');
}
\`\`\`

This demonstrates syntax highlighting in chat.
  `})})},o={render:()=>e.jsx("div",{className:"p-4 max-w-3xl bg-white dark:bg-gray-800",children:e.jsx(t,{content:`
Here's a summary of the layers:

| Layer | Element Count | Status |
|-------|--------------|--------|
| Motivation | 12 | Complete |
| Business | 8 | In Progress |
| Application | 15 | Complete |
| Technology | 6 | Planned |
  `})})},r={render:()=>e.jsx("div",{className:"p-4 max-w-3xl bg-white dark:bg-gray-800",children:e.jsx(t,{content:`
You can learn more about:
- [ArchiMate specification](https://www.opengroup.org/archimate-forum)
- [React Flow documentation](https://reactflow.dev)
- [Documentation Robotics](https://github.com/austinsanders/documentation-robotics)

Reference format: See element \`motivation.goal.improve-customer-satisfaction\` for details.
  `})})},i={render:()=>e.jsx("div",{className:"p-4 max-w-3xl bg-white dark:bg-gray-800",children:e.jsx(t,{content:`
Architecture analysis results:

1. **Motivation Layer**
   - 3 business goals identified
   - 5 stakeholders mapped
   - Key constraint: \`budget.2024.q1 < $500k\`

2. **Business Layer**
   - Business capabilities aligned with goals
   - Service dependencies tracked
   - *Note: Missing 2 capability definitions*

3. **Application Layer**
   - Component relationships validated
   - API contracts documented
   - Database schemas defined
  `})})};var d,m,l,p,g;n.parameters={...n.parameters,docs:{...(d=n.parameters)==null?void 0:d.docs,source:{originalSource:`{
  render: () => <div className="p-4 max-w-3xl bg-white dark:bg-gray-800">
      <ChatTextContent content="This is a simple text message without any markdown formatting." />
    </div>
}`,...(l=(m=n.parameters)==null?void 0:m.docs)==null?void 0:l.source},description:{story:"Plain text without markdown",...(g=(p=n.parameters)==null?void 0:p.docs)==null?void 0:g.description}}};var u,h,x,w,y;a.parameters={...a.parameters,docs:{...(u=a.parameters)==null?void 0:u.docs,source:{originalSource:`{
  render: () => {
    const content = \`
Here's a **bold** statement and an *italic* one.

You can also have \\\`inline code\\\` in your messages.

Lists work too:
- Item one
- Item two
- Item three
  \`;
    return <div className="p-4 max-w-3xl bg-white dark:bg-gray-800">
      <ChatTextContent content={content} />
    </div>;
  }
}`,...(x=(h=a.parameters)==null?void 0:h.docs)==null?void 0:x.source},description:{story:"Text with markdown formatting",...(y=(w=a.parameters)==null?void 0:w.docs)==null?void 0:y.description}}};var b,f,v,k,C;s.parameters={...s.parameters,docs:{...(b=s.parameters)==null?void 0:b.docs,source:{originalSource:`{
  render: () => {
    const content = \`
Here's an example TypeScript function:

\\\`\\\`\\\`typescript
interface Goal {
  id: string;
  name: string;
  description: string;
}

function findGoals(model: MetaModel): Goal[] {
  return model.elements.filter(e => e.type === 'Goal');
}
\\\`\\\`\\\`

This demonstrates syntax highlighting in chat.
  \`;
    return <div className="p-4 max-w-3xl bg-white dark:bg-gray-800">
      <ChatTextContent content={content} />
    </div>;
  }
}`,...(v=(f=s.parameters)==null?void 0:f.docs)==null?void 0:v.source},description:{story:"Code block with syntax highlighting",...(C=(k=s.parameters)==null?void 0:k.docs)==null?void 0:C.description}}};var T,N,L,M,j;o.parameters={...o.parameters,docs:{...(T=o.parameters)==null?void 0:T.docs,source:{originalSource:`{
  render: () => {
    const content = \`
Here's a summary of the layers:

| Layer | Element Count | Status |
|-------|--------------|--------|
| Motivation | 12 | Complete |
| Business | 8 | In Progress |
| Application | 15 | Complete |
| Technology | 6 | Planned |
  \`;
    return <div className="p-4 max-w-3xl bg-white dark:bg-gray-800">
      <ChatTextContent content={content} />
    </div>;
  }
}`,...(L=(N=o.parameters)==null?void 0:N.docs)==null?void 0:L.source},description:{story:"Table formatting",...(j=(M=o.parameters)==null?void 0:M.docs)==null?void 0:j.description}}};var S,A,I,P,B;r.parameters={...r.parameters,docs:{...(S=r.parameters)==null?void 0:S.docs,source:{originalSource:`{
  render: () => {
    const content = \`
You can learn more about:
- [ArchiMate specification](https://www.opengroup.org/archimate-forum)
- [React Flow documentation](https://reactflow.dev)
- [Documentation Robotics](https://github.com/austinsanders/documentation-robotics)

Reference format: See element \\\`motivation.goal.improve-customer-satisfaction\\\` for details.
  \`;
    return <div className="p-4 max-w-3xl bg-white dark:bg-gray-800">
      <ChatTextContent content={content} />
    </div>;
  }
}`,...(I=(A=r.parameters)==null?void 0:A.docs)==null?void 0:I.source},description:{story:"Links and references",...(B=(P=r.parameters)==null?void 0:P.docs)==null?void 0:B.description}}};var G,R,H,D,E;i.parameters={...i.parameters,docs:{...(G=i.parameters)==null?void 0:G.docs,source:{originalSource:`{
  render: () => {
    const content = \`
Architecture analysis results:

1. **Motivation Layer**
   - 3 business goals identified
   - 5 stakeholders mapped
   - Key constraint: \\\`budget.2024.q1 < $500k\\\`

2. **Business Layer**
   - Business capabilities aligned with goals
   - Service dependencies tracked
   - *Note: Missing 2 capability definitions*

3. **Application Layer**
   - Component relationships validated
   - API contracts documented
   - Database schemas defined
  \`;
    return <div className="p-4 max-w-3xl bg-white dark:bg-gray-800">
      <ChatTextContent content={content} />
    </div>;
  }
}`,...(H=(R=i.parameters)==null?void 0:R.docs)==null?void 0:H.source},description:{story:"Nested lists with mixed content",...(E=(D=i.parameters)==null?void 0:D.docs)==null?void 0:E.description}}};const W=["PlainText","WithMarkdown","CodeBlock","Table","Links","NestedLists"];export{s as CodeBlock,r as Links,i as NestedLists,n as PlainText,o as Table,a as WithMarkdown,W as __namedExportsOrder,K as default};
