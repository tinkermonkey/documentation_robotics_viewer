import{j as a}from"./iframe-DSSgKmXl.js";import{u as L}from"./useNavigate-CEEZa2t9.js";import"./preload-helper-Dp1pzeXC.js";const t=({tabs:e,activePath:D})=>{const E=L();if(e.length===0)return null;const F=r=>{E({to:r})};return a.jsx("div",{className:"px-6 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700","data-testid":"sub-tab-navigation",children:a.jsx("div",{className:"flex -mb-px",children:e.map(r=>a.jsx("button",{onClick:()=>F(r.path),className:`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${D.startsWith(r.path)?"text-blue-600 dark:text-blue-500 border-blue-600 dark:border-blue-500":"text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"}`,"data-testid":`sub-tab-${r.id}`,children:r.label},r.id))})})};t.__docgenInfo={description:"",methods:[],displayName:"SubTabNavigation",props:{tabs:{required:!0,tsType:{name:"Array",elements:[{name:"SubTab"}],raw:"SubTab[]"},description:""},activePath:{required:!0,tsType:{name:"string"},description:""}}};const W={title:"A Primitives / Navigation / SubTabNavigation"},s={render:()=>{const e=[{id:"graph",label:"Graph",path:"/view/graph"},{id:"json",label:"JSON",path:"/view/json"}];return a.jsx(t,{tabs:e,activePath:"/view/graph"})}},i={render:()=>{const e=[{id:"graph",label:"Graph View",path:"/model/graph"},{id:"list",label:"List View",path:"/model/list"}];return a.jsx(t,{tabs:e,activePath:"/model/list"})}},o={render:()=>{const e=[{id:"overview",label:"Overview",path:"/dashboard/overview"},{id:"motivation",label:"Motivation",path:"/dashboard/motivation"},{id:"business",label:"Business",path:"/dashboard/business"},{id:"technology",label:"Technology",path:"/dashboard/technology"},{id:"analytics",label:"Analytics",path:"/dashboard/analytics"}];return a.jsx(t,{tabs:e,activePath:"/dashboard/business"})}},d={render:()=>{const e=[{id:"graph",label:"Graph",path:"/view/graph"},{id:"json",label:"JSON",path:"/view/json"},{id:"diff",label:"Diff",path:"/view/diff"}];return a.jsx(t,{tabs:e,activePath:"/view/graph"})}},n={render:()=>{const e=[{id:"graph",label:"Graph",path:"/view/graph"},{id:"json",label:"JSON",path:"/view/json"},{id:"diff",label:"Diff",path:"/view/diff"}];return a.jsx(t,{tabs:e,activePath:"/view/diff"})}},l={render:()=>a.jsxs("div",{className:"p-4 text-gray-500 text-sm",children:[a.jsx(t,{tabs:[],activePath:"/view"}),a.jsx("p",{className:"mt-4",children:"No sub-tabs to display (component returns null)"})]})},b={render:()=>{const e=[{id:"graph",label:"Graph",path:"/model/graph"},{id:"json",label:"JSON",path:"/model/json"}];return a.jsx("div",{className:"space-y-4",children:a.jsxs("div",{children:[a.jsx("p",{className:"text-xs text-gray-600 dark:text-gray-400 mb-2",children:"Active path: /model/graph/detailed (uses startsWith matching)"}),a.jsx(t,{tabs:e,activePath:"/model/graph/detailed"})]})})}};var p,c,h;s.parameters={...s.parameters,docs:{...(p=s.parameters)==null?void 0:p.docs,source:{originalSource:`{
  render: () => {
    const tabs: SubTab[] = [{
      id: 'graph',
      label: 'Graph',
      path: '/view/graph'
    }, {
      id: 'json',
      label: 'JSON',
      path: '/view/json'
    }];
    return <SubTabNavigation tabs={tabs} activePath="/view/graph" />;
  }
}`,...(h=(c=s.parameters)==null?void 0:c.docs)==null?void 0:h.source}}};var v,u,m;i.parameters={...i.parameters,docs:{...(v=i.parameters)==null?void 0:v.docs,source:{originalSource:`{
  render: () => {
    const tabs: SubTab[] = [{
      id: 'graph',
      label: 'Graph View',
      path: '/model/graph'
    }, {
      id: 'list',
      label: 'List View',
      path: '/model/list'
    }];
    return <SubTabNavigation tabs={tabs} activePath="/model/list" />;
  }
}`,...(m=(u=i.parameters)==null?void 0:u.docs)==null?void 0:m.source}}};var g,x,N;o.parameters={...o.parameters,docs:{...(g=o.parameters)==null?void 0:g.docs,source:{originalSource:`{
  render: () => {
    const tabs: SubTab[] = [{
      id: 'overview',
      label: 'Overview',
      path: '/dashboard/overview'
    }, {
      id: 'motivation',
      label: 'Motivation',
      path: '/dashboard/motivation'
    }, {
      id: 'business',
      label: 'Business',
      path: '/dashboard/business'
    }, {
      id: 'technology',
      label: 'Technology',
      path: '/dashboard/technology'
    }, {
      id: 'analytics',
      label: 'Analytics',
      path: '/dashboard/analytics'
    }];
    return <SubTabNavigation tabs={tabs} activePath="/dashboard/business" />;
  }
}`,...(N=(x=o.parameters)==null?void 0:x.docs)==null?void 0:N.source}}};var f,w,y;d.parameters={...d.parameters,docs:{...(f=d.parameters)==null?void 0:f.docs,source:{originalSource:`{
  render: () => {
    const tabs: SubTab[] = [{
      id: 'graph',
      label: 'Graph',
      path: '/view/graph'
    }, {
      id: 'json',
      label: 'JSON',
      path: '/view/json'
    }, {
      id: 'diff',
      label: 'Diff',
      path: '/view/diff'
    }];
    return <SubTabNavigation tabs={tabs} activePath="/view/graph" />;
  }
}`,...(y=(w=d.parameters)==null?void 0:w.docs)==null?void 0:y.source}}};var T,j,S;n.parameters={...n.parameters,docs:{...(T=n.parameters)==null?void 0:T.docs,source:{originalSource:`{
  render: () => {
    const tabs: SubTab[] = [{
      id: 'graph',
      label: 'Graph',
      path: '/view/graph'
    }, {
      id: 'json',
      label: 'JSON',
      path: '/view/json'
    }, {
      id: 'diff',
      label: 'Diff',
      path: '/view/diff'
    }];
    return <SubTabNavigation tabs={tabs} activePath="/view/diff" />;
  }
}`,...(S=(j=n.parameters)==null?void 0:j.docs)==null?void 0:S.source}}};var P,k,O;l.parameters={...l.parameters,docs:{...(P=l.parameters)==null?void 0:P.docs,source:{originalSource:`{
  render: () => {
    return <div className="p-4 text-gray-500 text-sm">
      <SubTabNavigation tabs={[]} activePath="/view" />
      <p className="mt-4">No sub-tabs to display (component returns null)</p>
    </div>;
  }
}`,...(O=(k=l.parameters)==null?void 0:k.docs)==null?void 0:O.source}}};var A,G,J;b.parameters={...b.parameters,docs:{...(A=b.parameters)==null?void 0:A.docs,source:{originalSource:`{
  render: () => {
    const tabs: SubTab[] = [{
      id: 'graph',
      label: 'Graph',
      path: '/model/graph'
    }, {
      id: 'json',
      label: 'JSON',
      path: '/model/json'
    }];
    return <div className="space-y-4">
      <div>
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
          Active path: /model/graph/detailed (uses startsWith matching)
        </p>
        <SubTabNavigation tabs={tabs} activePath="/model/graph/detailed" />
      </div>
    </div>;
  }
}`,...(J=(G=b.parameters)==null?void 0:G.docs)==null?void 0:J.source}}};const q=["Default","TwoTabs","FiveTabs","FirstTabActive","LastTabActive","NoTabs","PathNotExactMatch"];export{s as Default,d as FirstTabActive,o as FiveTabs,n as LastTabActive,l as NoTabs,b as PathNotExactMatch,i as TwoTabs,q as __namedExportsOrder,W as default};
