import{R as m,j as r,r as g}from"./iframe-DSSgKmXl.js";import"./preload-helper-Dp1pzeXC.js";class n extends m.Component{constructor(e){super(e),this.state={hasError:!1,error:null}}static getDerivedStateFromError(e){return{hasError:!0,error:e}}componentDidCatch(e,u){console.error("[ErrorBoundary] Caught error:",e,u)}render(){return this.state.hasError?this.props.fallback?this.props.fallback:r.jsx("div",{"data-error-boundary":"true",style:{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",padding:24,fontFamily:"system-ui, -apple-system, sans-serif"},children:r.jsxs("div",{style:{maxWidth:600,backgroundColor:"#fef2f2",border:"1px solid #fecaca",borderRadius:8,padding:24},children:[r.jsx("h3",{style:{margin:0,marginBottom:12,fontSize:18,fontWeight:600,color:"#991b1b"},children:"Rendering Error"}),r.jsx("p",{style:{margin:0,marginBottom:16,fontSize:14,color:"#7f1d1d",lineHeight:1.6},children:"An error occurred while rendering the visualization. This could be due to invalid node/edge data or a component rendering issue."}),this.state.error&&r.jsxs("details",{style:{fontSize:13,color:"#7f1d1d"},children:[r.jsx("summary",{style:{cursor:"pointer",fontWeight:500,marginBottom:8},children:"Error Details"}),r.jsxs("pre",{style:{backgroundColor:"#fff",padding:12,borderRadius:4,overflow:"auto",fontSize:12,fontFamily:"monospace"},children:[this.state.error.toString(),`
`,this.state.error.stack]})]}),r.jsx("button",{onClick:()=>this.setState({hasError:!1,error:null}),style:{marginTop:16,padding:"8px 16px",backgroundColor:"#dc2626",color:"white",border:"none",borderRadius:4,fontSize:14,fontWeight:500,cursor:"pointer"},children:"Try Again"})]})}):this.props.children}}n.__docgenInfo={description:`ErrorBoundary Component

Catches React rendering errors and displays a fallback UI instead of crashing the entire app.
Wraps components that might throw during render (e.g., custom nodes/edges).

Usage:
\`\`\`tsx
<ErrorBoundary fallback={<div>Something went wrong</div>}>
  <MotivationGraphView />
</ErrorBoundary>
\`\`\``,methods:[],displayName:"ErrorBoundary",props:{children:{required:!0,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:""},fallback:{required:!1,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:""}}};const E={title:"A Primitives / State Panels / ErrorBoundary",parameters:{layout:"centered"}};class h extends g.Component{render(){if(this.props.shouldThrow)throw new Error("Test error for ErrorBoundary");return r.jsx("div",{children:"No error occurred"})}}const o={render:()=>r.jsx(n,{children:r.jsxs("div",{className:"p-4 bg-white border border-gray-200",children:[r.jsx("p",{children:"This content is wrapped in an ErrorBoundary"}),r.jsx(h,{shouldThrow:!1})]})})},t={render:()=>r.jsx(n,{children:r.jsx("div",{className:"p-4 bg-white border border-gray-200",children:r.jsx(h,{shouldThrow:!0})})})};var s,a,i;o.parameters={...o.parameters,docs:{...(s=o.parameters)==null?void 0:s.docs,source:{originalSource:`{
  render: () => <ErrorBoundary>
    <div className="p-4 bg-white border border-gray-200">
      <p>This content is wrapped in an ErrorBoundary</p>
      <ThrowError shouldThrow={false} />
    </div>
  </ErrorBoundary>
}`,...(i=(a=o.parameters)==null?void 0:a.docs)==null?void 0:i.source}}};var d,c,l;t.parameters={...t.parameters,docs:{...(d=t.parameters)==null?void 0:d.docs,source:{originalSource:`{
  render: () => <ErrorBoundary>
    <div className="p-4 bg-white border border-gray-200">
      <ThrowError shouldThrow={true} />
    </div>
  </ErrorBoundary>
}`,...(l=(c=t.parameters)==null?void 0:c.docs)==null?void 0:l.source}}};const b=["NoError","WithError"];export{o as NoError,t as WithError,b as __namedExportsOrder,E as default};
