import{j as e}from"./iframe-DSSgKmXl.js";import{w as ee,a as u,b as p}from"./RenderPropErrorBoundary-C5UeOkUJ.js";import"./preload-helper-Dp1pzeXC.js";const ne={title:"A Primitives / State Panels / RenderPropErrorBoundary",parameters:{layout:"centered"}},d={render:()=>{const r=t=>e.jsxs("div",{className:"space-y-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded",children:[e.jsx("h3",{className:"font-semibold text-green-900 dark:text-green-300",children:"Successful Render"}),e.jsxs("p",{className:"text-sm text-green-800 dark:text-green-200",children:["ID: ",t.id]}),e.jsxs("p",{className:"text-sm text-green-800 dark:text-green-200",children:["Name: ",t.name]}),e.jsxs("p",{className:"text-sm text-green-800 dark:text-green-200",children:["Type: ",t.type]})]});return e.jsxs("div",{style:{width:"100%",maxWidth:400,padding:"20px",backgroundColor:"#f9fafb"},children:[e.jsx("h2",{className:"text-lg font-bold mb-4",children:"wrapRenderProp - Success Case"}),ee(r,{id:"elem-1",name:"Test Element",type:"Service"},"renderElement")]})}},a={render:()=>{const r=t=>{throw new Error("Failed to render element - invalid data structure")};return e.jsxs("div",{style:{width:"100%",maxWidth:400,padding:"20px",backgroundColor:"#f9fafb"},children:[e.jsx("h2",{className:"text-lg font-bold mb-4",children:"wrapRenderProp - Error Case"}),ee(r,{id:"elem-1"},"renderElement")]})}},s={render:()=>{const r=(t,m)=>e.jsxs("div",{className:"space-y-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded",children:[e.jsx("h3",{className:"font-semibold text-blue-900 dark:text-blue-300",children:"Relationship Found"}),e.jsxs("p",{className:"text-sm text-blue-800 dark:text-blue-200",children:[t.name," → ",m.name]})]});return e.jsxs("div",{style:{width:"100%",maxWidth:400,padding:"20px",backgroundColor:"#f9fafb"},children:[e.jsx("h2",{className:"text-lg font-bold mb-4",children:"wrapRenderProp2 - Success Case"}),u(r,{name:"Source Service"},{name:"Target Service"},"renderRelationship")]})}},n={render:()=>{const r=(t,m)=>{throw new Error("Cannot find relationship between these elements")};return e.jsxs("div",{style:{width:"100%",maxWidth:400,padding:"20px",backgroundColor:"#f9fafb"},children:[e.jsx("h2",{className:"text-lg font-bold mb-4",children:"wrapRenderProp2 - Error Case"}),u(r,{name:"Source"},{name:"Target"},"renderRelationship")]})}},o={render:()=>{const r=()=>e.jsxs("div",{className:"p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded",children:[e.jsx("h3",{className:"font-semibold text-purple-900 dark:text-purple-300",children:"Header Content"}),e.jsx("p",{className:"text-sm text-purple-800 dark:text-purple-200",children:"This header renders successfully"})]});return e.jsxs("div",{style:{width:"100%",maxWidth:400,padding:"20px",backgroundColor:"#f9fafb"},children:[e.jsx("h2",{className:"text-lg font-bold mb-4",children:"wrapRenderPropVoid - Success Case"}),p(r,"renderHeader")]})}},i={render:()=>{const r=()=>{throw new Error("Header data is corrupted or unavailable")};return e.jsxs("div",{style:{width:"100%",maxWidth:400,padding:"20px",backgroundColor:"#f9fafb"},children:[e.jsx("h2",{className:"text-lg font-bold mb-4",children:"wrapRenderPropVoid - Error Case"}),p(r,"renderHeader")]})}},l={render:()=>e.jsxs("div",{style:{width:"100%",maxWidth:400,padding:"20px",backgroundColor:"#f9fafb"},children:[e.jsx("h2",{className:"text-lg font-bold mb-4",children:"wrapRenderPropVoid - Undefined Case"}),e.jsxs("div",{className:"p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded",children:[e.jsx("p",{className:"text-sm text-gray-600 dark:text-gray-400",children:"When render prop is undefined:"}),e.jsxs("div",{className:"mt-2 p-2 bg-white dark:bg-gray-900 rounded",children:[p(void 0,"optionalRender"),e.jsx("p",{className:"text-xs text-gray-500 dark:text-gray-400",children:"(Returns null - nothing rendered above this line)"})]})]})]})},c={render:()=>{const r=()=>{throw new Error("Failed to load filters")},t=(re,te)=>{throw new Error("Cannot compare these elements")},m=()=>{throw new Error("Annotations unavailable")};return e.jsxs("div",{style:{width:"100%",maxWidth:500,padding:"20px",backgroundColor:"#f9fafb"},children:[e.jsx("h2",{className:"text-lg font-bold mb-6",children:"Multiple Errors - Recovery Demonstration"}),e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{children:[e.jsx("h3",{className:"font-semibold text-gray-700 dark:text-gray-300 mb-2",children:"Section 1 - Filters"}),p(r,"renderFilters")]}),e.jsxs("div",{children:[e.jsx("h3",{className:"font-semibold text-gray-700 dark:text-gray-300 mb-2",children:"Section 2 - Comparison"}),u(t,{id:"elem1"},{id:"elem2"},"renderComparison")]}),e.jsxs("div",{children:[e.jsx("h3",{className:"font-semibold text-gray-700 dark:text-gray-300 mb-2",children:"Section 3 - Annotations"}),p(m,"renderAnnotations")]}),e.jsxs("div",{className:"p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded",children:[e.jsx("p",{className:"text-sm text-blue-800 dark:text-blue-300",children:"✓ Component remains stable despite multiple errors"}),e.jsx("p",{className:"text-sm text-blue-800 dark:text-blue-300 mt-1",children:"✓ Each error is isolated and displayed clearly"}),e.jsx("p",{className:"text-sm text-blue-800 dark:text-blue-300 mt-1",children:"✓ User can still interact with unaffected sections"})]})]})]})}};var b,x,h,g,f;d.parameters={...d.parameters,docs:{...(b=d.parameters)==null?void 0:b.docs,source:{originalSource:`{
  render: () => {
    const renderElement = (element: {
      id: string;
      name: string;
      type: string;
    }) => <div className="space-y-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
        <h3 className="font-semibold text-green-900 dark:text-green-300">Successful Render</h3>
        <p className="text-sm text-green-800 dark:text-green-200">ID: {element.id}</p>
        <p className="text-sm text-green-800 dark:text-green-200">Name: {element.name}</p>
        <p className="text-sm text-green-800 dark:text-green-200">Type: {element.type}</p>
      </div>;
    return <div style={{
      width: '100%',
      maxWidth: 400,
      padding: '20px',
      backgroundColor: '#f9fafb'
    }}>
        <h2 className="text-lg font-bold mb-4">wrapRenderProp - Success Case</h2>
        {wrapRenderProp(renderElement, {
        id: 'elem-1',
        name: 'Test Element',
        type: 'Service'
      }, 'renderElement')}
      </div>;
  }
}`,...(h=(x=d.parameters)==null?void 0:x.docs)==null?void 0:h.source},description:{story:"Story showing successful render prop",...(f=(g=d.parameters)==null?void 0:g.docs)==null?void 0:f.description}}};var w,y,R,v,k;a.parameters={...a.parameters,docs:{...(w=a.parameters)==null?void 0:w.docs,source:{originalSource:`{
  render: () => {
    const throwingRender = (_element: any) => {
      throw new Error('Failed to render element - invalid data structure');
    };
    return <div style={{
      width: '100%',
      maxWidth: 400,
      padding: '20px',
      backgroundColor: '#f9fafb'
    }}>
        <h2 className="text-lg font-bold mb-4">wrapRenderProp - Error Case</h2>
        {wrapRenderProp(throwingRender, {
        id: 'elem-1'
      }, 'renderElement')}
      </div>;
  }
}`,...(R=(y=a.parameters)==null?void 0:y.docs)==null?void 0:R.source},description:{story:"Story showing error in render prop",...(k=(v=a.parameters)==null?void 0:v.docs)==null?void 0:k.description}}};var N,S,j,C,P;s.parameters={...s.parameters,docs:{...(N=s.parameters)==null?void 0:N.docs,source:{originalSource:`{
  render: () => {
    const renderRelationship = (source: {
      name: string;
    }, target: {
      name: string;
    }) => <div className="space-y-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
        <h3 className="font-semibold text-blue-900 dark:text-blue-300">Relationship Found</h3>
        <p className="text-sm text-blue-800 dark:text-blue-200">{source.name} → {target.name}</p>
      </div>;
    return <div style={{
      width: '100%',
      maxWidth: 400,
      padding: '20px',
      backgroundColor: '#f9fafb'
    }}>
        <h2 className="text-lg font-bold mb-4">wrapRenderProp2 - Success Case</h2>
        {wrapRenderProp2(renderRelationship, {
        name: 'Source Service'
      }, {
        name: 'Target Service'
      }, 'renderRelationship')}
      </div>;
  }
}`,...(j=(S=s.parameters)==null?void 0:S.docs)==null?void 0:j.source},description:{story:"Story showing successful render prop with two arguments",...(P=(C=s.parameters)==null?void 0:C.docs)==null?void 0:P.description}}};var E,V,W,_,H;n.parameters={...n.parameters,docs:{...(E=n.parameters)==null?void 0:E.docs,source:{originalSource:`{
  render: () => {
    const throwingRender = (_source: any, _target: any) => {
      throw new Error('Cannot find relationship between these elements');
    };
    return <div style={{
      width: '100%',
      maxWidth: 400,
      padding: '20px',
      backgroundColor: '#f9fafb'
    }}>
        <h2 className="text-lg font-bold mb-4">wrapRenderProp2 - Error Case</h2>
        {wrapRenderProp2(throwingRender, {
        name: 'Source'
      }, {
        name: 'Target'
      }, 'renderRelationship')}
      </div>;
  }
}`,...(W=(V=n.parameters)==null?void 0:V.docs)==null?void 0:W.source},description:{story:"Story showing error in render prop with two arguments",...(H=(_=n.parameters)==null?void 0:_.docs)==null?void 0:H.description}}};var F,T,I,A,U;o.parameters={...o.parameters,docs:{...(F=o.parameters)==null?void 0:F.docs,source:{originalSource:`{
  render: () => {
    const renderHeader = () => <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded">
        <h3 className="font-semibold text-purple-900 dark:text-purple-300">Header Content</h3>
        <p className="text-sm text-purple-800 dark:text-purple-200">This header renders successfully</p>
      </div>;
    return <div style={{
      width: '100%',
      maxWidth: 400,
      padding: '20px',
      backgroundColor: '#f9fafb'
    }}>
        <h2 className="text-lg font-bold mb-4">wrapRenderPropVoid - Success Case</h2>
        {wrapRenderPropVoid(renderHeader, 'renderHeader')}
      </div>;
  }
}`,...(I=(T=o.parameters)==null?void 0:T.docs)==null?void 0:I.source},description:{story:"Story showing successful void render prop",...(U=(A=o.parameters)==null?void 0:A.docs)==null?void 0:U.description}}};var D,M,B,O,q;i.parameters={...i.parameters,docs:{...(D=i.parameters)==null?void 0:D.docs,source:{originalSource:`{
  render: () => {
    const throwingRender = () => {
      throw new Error('Header data is corrupted or unavailable');
    };
    return <div style={{
      width: '100%',
      maxWidth: 400,
      padding: '20px',
      backgroundColor: '#f9fafb'
    }}>
        <h2 className="text-lg font-bold mb-4">wrapRenderPropVoid - Error Case</h2>
        {wrapRenderPropVoid(throwingRender, 'renderHeader')}
      </div>;
  }
}`,...(B=(M=i.parameters)==null?void 0:M.docs)==null?void 0:B.source},description:{story:"Story showing error in void render prop",...(q=(O=i.parameters)==null?void 0:O.docs)==null?void 0:q.description}}};var z,G,J,K,L;l.parameters={...l.parameters,docs:{...(z=l.parameters)==null?void 0:z.docs,source:{originalSource:`{
  render: () => <div style={{
    width: '100%',
    maxWidth: 400,
    padding: '20px',
    backgroundColor: '#f9fafb'
  }}>
      <h2 className="text-lg font-bold mb-4">wrapRenderPropVoid - Undefined Case</h2>
      <div className="p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          When render prop is undefined:
        </p>
        <div className="mt-2 p-2 bg-white dark:bg-gray-900 rounded">
          {wrapRenderPropVoid(undefined, 'optionalRender')}
          <p className="text-xs text-gray-500 dark:text-gray-400">
            (Returns null - nothing rendered above this line)
          </p>
        </div>
      </div>
    </div>
}`,...(J=(G=l.parameters)==null?void 0:G.docs)==null?void 0:J.source},description:{story:"Story showing undefined void render prop (returns null)",...(L=(K=l.parameters)==null?void 0:K.docs)==null?void 0:L.description}}};var Q,X,Y,Z,$;c.parameters={...c.parameters,docs:{...(Q=c.parameters)==null?void 0:Q.docs,source:{originalSource:`{
  render: () => {
    const failingRender1 = () => {
      throw new Error('Failed to load filters');
    };
    const failingRender2 = (_a: any, _b: any) => {
      throw new Error('Cannot compare these elements');
    };
    const failingRender3 = () => {
      throw new Error('Annotations unavailable');
    };
    return <div style={{
      width: '100%',
      maxWidth: 500,
      padding: '20px',
      backgroundColor: '#f9fafb'
    }}>
      <h2 className="text-lg font-bold mb-6">Multiple Errors - Recovery Demonstration</h2>

      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Section 1 - Filters</h3>
          {wrapRenderPropVoid(failingRender1, 'renderFilters')}
        </div>

        <div>
          <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Section 2 - Comparison</h3>
          {wrapRenderProp2(failingRender2, {
            id: 'elem1'
          }, {
            id: 'elem2'
          }, 'renderComparison')}
        </div>

        <div>
          <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Section 3 - Annotations</h3>
          {wrapRenderPropVoid(failingRender3, 'renderAnnotations')}
        </div>

        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            ✓ Component remains stable despite multiple errors
          </p>
          <p className="text-sm text-blue-800 dark:text-blue-300 mt-1">
            ✓ Each error is isolated and displayed clearly
          </p>
          <p className="text-sm text-blue-800 dark:text-blue-300 mt-1">
            ✓ User can still interact with unaffected sections
          </p>
        </div>
      </div>
    </div>;
  }
}`,...(Y=(X=c.parameters)==null?void 0:X.docs)==null?void 0:Y.source},description:{story:"Story showing multiple error cases together",...($=(Z=c.parameters)==null?void 0:Z.docs)==null?void 0:$.description}}};const oe=["SuccessfulRenderProp","ErrorInRenderProp","SuccessfulRenderProp2","ErrorInRenderProp2","SuccessfulVoidRenderProp","ErrorInVoidRenderProp","UndefinedVoidRenderProp","MultipleErrorCases"];export{a as ErrorInRenderProp,n as ErrorInRenderProp2,i as ErrorInVoidRenderProp,c as MultipleErrorCases,d as SuccessfulRenderProp,s as SuccessfulRenderProp2,o as SuccessfulVoidRenderProp,l as UndefinedVoidRenderProp,oe as __namedExportsOrder,ne as default};
