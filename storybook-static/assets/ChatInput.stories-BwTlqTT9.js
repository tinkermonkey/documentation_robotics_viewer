import{j as e}from"./iframe-DSSgKmXl.js";import{C as t}from"./ChatInput-DKttK8bN.js";import"./preload-helper-Dp1pzeXC.js";import"./createLucideIcon-CIvKt9yE.js";const P={title:"D Chat / Messages / ChatInput"},a={render:()=>{const r=async s=>{console.log("Message sent:",s)};return e.jsx("div",{className:"p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700",children:e.jsx(t,{onSendMessage:r,placeholder:"Ask about the architecture model..."})})}},o={render:()=>{const r=async D=>{console.log("Message sent:",D)},s=async()=>{console.log("Streaming canceled")};return e.jsx("div",{className:"p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700",children:e.jsx(t,{onSendMessage:r,onCancel:s,isStreaming:!0,placeholder:"Waiting for response..."})})}},d={render:()=>{const r=async s=>{console.log("Message sent:",s)};return e.jsx("div",{className:"p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700",children:e.jsx(t,{onSendMessage:r,disabled:!0,placeholder:"SDK not available..."})})}},n={render:()=>{const r=async s=>{console.log("Message sent:",s)};return e.jsx("div",{className:"p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700",children:e.jsx(t,{onSendMessage:r,placeholder:"Type /dr-model to add architecture elements..."})})}};var c,g,l,i,p;a.parameters={...a.parameters,docs:{...(c=a.parameters)==null?void 0:c.docs,source:{originalSource:`{
  render: () => {
    const handleSendMessage = async (message: string) => {
      console.log('Message sent:', message);
    };
    return <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <ChatInput onSendMessage={handleSendMessage} placeholder="Ask about the architecture model..." />
    </div>;
  }
}`,...(l=(g=a.parameters)==null?void 0:g.docs)==null?void 0:l.source},description:{story:"Default empty input",...(p=(i=a.parameters)==null?void 0:i.docs)==null?void 0:p.description}}};var m,h,b,u,y;o.parameters={...o.parameters,docs:{...(m=o.parameters)==null?void 0:m.docs,source:{originalSource:`{
  render: () => {
    const handleSendMessage = async (message: string) => {
      console.log('Message sent:', message);
    };
    const handleCancel = async () => {
      console.log('Streaming canceled');
    };
    return <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <ChatInput onSendMessage={handleSendMessage} onCancel={handleCancel} isStreaming={true} placeholder="Waiting for response..." />
    </div>;
  }
}`,...(b=(h=o.parameters)==null?void 0:h.docs)==null?void 0:b.source},description:{story:"Input disabled during streaming",...(y=(u=o.parameters)==null?void 0:u.docs)==null?void 0:y.description}}};var S,M,k,C,v;d.parameters={...d.parameters,docs:{...(S=d.parameters)==null?void 0:S.docs,source:{originalSource:`{
  render: () => {
    const handleSendMessage = async (message: string) => {
      console.log('Message sent:', message);
    };
    return <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <ChatInput onSendMessage={handleSendMessage} disabled={true} placeholder="SDK not available..." />
    </div>;
  }
}`,...(k=(M=d.parameters)==null?void 0:M.docs)==null?void 0:k.source},description:{story:"Input disabled",...(v=(C=d.parameters)==null?void 0:C.docs)==null?void 0:v.description}}};var x,j,w,I,f;n.parameters={...n.parameters,docs:{...(x=n.parameters)==null?void 0:x.docs,source:{originalSource:`{
  render: () => {
    const handleSendMessage = async (message: string) => {
      console.log('Message sent:', message);
    };
    return <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <ChatInput onSendMessage={handleSendMessage} placeholder="Type /dr-model to add architecture elements..." />
    </div>;
  }
}`,...(w=(j=n.parameters)==null?void 0:j.docs)==null?void 0:w.source},description:{story:"Input with custom placeholder",...(f=(I=n.parameters)==null?void 0:I.docs)==null?void 0:f.description}}};const T=["Default","Streaming","Disabled","CustomPlaceholder"];export{n as CustomPlaceholder,a as Default,d as Disabled,o as Streaming,T as __namedExportsOrder,P as default};
