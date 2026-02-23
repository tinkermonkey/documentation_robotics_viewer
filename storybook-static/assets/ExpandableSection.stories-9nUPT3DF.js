import{j as e,r as q}from"./iframe-DSSgKmXl.js";import{E as a}from"./ExpandableSection-DnwRdE3z.js";import"./preload-helper-Dp1pzeXC.js";import"./createLucideIcon-CIvKt9yE.js";const z={title:"A Primitives / State Panels / ExpandableSection",parameters:{layout:"centered"}},d={render:()=>e.jsx("div",{className:"w-96",children:e.jsx(a,{title:"Expanded Section",defaultExpanded:!0,children:e.jsx("div",{className:"text-sm text-gray-600 dark:text-gray-400",children:"This section is expanded by default. It contains detailed information about the selected item."})})})},s={render:()=>e.jsx("div",{className:"w-96",children:e.jsx(a,{title:"Collapsed Section",defaultExpanded:!1,children:e.jsx("div",{className:"text-sm text-gray-600 dark:text-gray-400",children:"This section is collapsed by default. Click the header to expand it."})})})},r={render:()=>e.jsx("div",{className:"w-96",children:e.jsx(a,{title:"Elements",count:12,defaultExpanded:!0,children:e.jsxs("div",{className:"space-y-2",children:[e.jsx("div",{className:"text-sm text-gray-600 dark:text-gray-400",children:"Item 1"}),e.jsx("div",{className:"text-sm text-gray-600 dark:text-gray-400",children:"Item 2"}),e.jsx("div",{className:"text-sm text-gray-600 dark:text-gray-400",children:"Item 3"})]})})})},n={render:()=>e.jsx("div",{className:"w-96",children:e.jsx(a,{title:"Active Changesets",badge:"3 new",defaultExpanded:!0,children:e.jsxs("div",{className:"space-y-2",children:[e.jsx("div",{className:"text-sm text-gray-600 dark:text-gray-400",children:"Changeset 1: New Goal added"}),e.jsx("div",{className:"text-sm text-gray-600 dark:text-gray-400",children:"Changeset 2: Requirement updated"}),e.jsx("div",{className:"text-sm text-gray-600 dark:text-gray-400",children:"Changeset 3: Constraint deleted"})]})})})},i={render:()=>e.jsx("div",{className:"w-96",children:e.jsx(a,{title:"Results",count:45,badge:"filtered",defaultExpanded:!0,children:e.jsx("div",{className:"text-sm text-gray-600 dark:text-gray-400",children:"Showing 45 filtered results from 120 total items."})})})},l={render:()=>{const[t,x]=q.useState(!1);return e.jsxs("div",{className:"w-96 space-y-4",children:[e.jsxs("button",{onClick:()=>x(!t),className:"px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600",children:["External Toggle: ",t?"Collapse":"Expand"]}),e.jsx(a,{title:"Controlled Section",isExpanded:t,onToggle:()=>x(!t),children:e.jsx("div",{className:"text-sm text-gray-600 dark:text-gray-400",children:"This section is controlled by the button above."})})]})}},o={render:()=>e.jsx("div",{className:"dark w-96 bg-gray-900 p-4 rounded",children:e.jsx(a,{title:"Expanded Dark Mode",defaultExpanded:!0,children:e.jsx("div",{className:"text-sm text-gray-400",children:"This section demonstrates dark mode styling with proper contrast."})})}),parameters:{backgrounds:{default:"dark"}}},c={render:()=>e.jsx("div",{className:"dark w-96 bg-gray-900 p-4 rounded",children:e.jsx(a,{title:"Collapsed Dark Mode",defaultExpanded:!1,children:e.jsx("div",{className:"text-sm text-gray-400",children:"Click the header to expand this dark mode section."})})}),parameters:{backgrounds:{default:"dark"}}};var m,p,u;d.parameters={...d.parameters,docs:{...(m=d.parameters)==null?void 0:m.docs,source:{originalSource:`{
  render: () => <div className="w-96">
      <ExpandableSection title="Expanded Section" defaultExpanded={true}>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          This section is expanded by default. It contains detailed information about the selected item.
        </div>
      </ExpandableSection>
    </div>
}`,...(u=(p=d.parameters)==null?void 0:p.docs)==null?void 0:u.source}}};var g,h,v;s.parameters={...s.parameters,docs:{...(g=s.parameters)==null?void 0:g.docs,source:{originalSource:`{
  render: () => <div className="w-96">
      <ExpandableSection title="Collapsed Section" defaultExpanded={false}>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          This section is collapsed by default. Click the header to expand it.
        </div>
      </ExpandableSection>
    </div>
}`,...(v=(h=s.parameters)==null?void 0:h.docs)==null?void 0:v.source}}};var y,E,b;r.parameters={...r.parameters,docs:{...(y=r.parameters)==null?void 0:y.docs,source:{originalSource:`{
  render: () => <div className="w-96">
      <ExpandableSection title="Elements" count={12} defaultExpanded={true}>
        <div className="space-y-2">
          <div className="text-sm text-gray-600 dark:text-gray-400">Item 1</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Item 2</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Item 3</div>
        </div>
      </ExpandableSection>
    </div>
}`,...(b=(E=r.parameters)==null?void 0:E.docs)==null?void 0:b.source}}};var k,N,f;n.parameters={...n.parameters,docs:{...(k=n.parameters)==null?void 0:k.docs,source:{originalSource:`{
  render: () => <div className="w-96">
      <ExpandableSection title="Active Changesets" badge="3 new" defaultExpanded={true}>
        <div className="space-y-2">
          <div className="text-sm text-gray-600 dark:text-gray-400">Changeset 1: New Goal added</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Changeset 2: Requirement updated</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Changeset 3: Constraint deleted</div>
        </div>
      </ExpandableSection>
    </div>
}`,...(f=(N=n.parameters)==null?void 0:N.docs)==null?void 0:f.source}}};var S,C,j;i.parameters={...i.parameters,docs:{...(S=i.parameters)==null?void 0:S.docs,source:{originalSource:`{
  render: () => <div className="w-96">
      <ExpandableSection title="Results" count={45} badge="filtered" defaultExpanded={true}>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Showing 45 filtered results from 120 total items.
        </div>
      </ExpandableSection>
    </div>
}`,...(j=(C=i.parameters)==null?void 0:C.docs)==null?void 0:j.source}}};var w,I,T;l.parameters={...l.parameters,docs:{...(w=l.parameters)==null?void 0:w.docs,source:{originalSource:`{
  render: () => {
    const [isExpanded, setIsExpanded] = useState(false);
    return <div className="w-96 space-y-4">
      <button onClick={() => setIsExpanded(!isExpanded)} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
        External Toggle: {isExpanded ? 'Collapse' : 'Expand'}
      </button>
      <ExpandableSection title="Controlled Section" isExpanded={isExpanded} onToggle={() => setIsExpanded(!isExpanded)}>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          This section is controlled by the button above.
        </div>
      </ExpandableSection>
    </div>;
  }
}`,...(T=(I=l.parameters)==null?void 0:I.docs)==null?void 0:T.source}}};var D,M,W;o.parameters={...o.parameters,docs:{...(D=o.parameters)==null?void 0:D.docs,source:{originalSource:`{
  render: () => <div className="dark w-96 bg-gray-900 p-4 rounded">
      <ExpandableSection title="Expanded Dark Mode" defaultExpanded={true}>
        <div className="text-sm text-gray-400">
          This section demonstrates dark mode styling with proper contrast.
        </div>
      </ExpandableSection>
    </div>,
  parameters: {
    backgrounds: {
      default: 'dark'
    }
  }
}`,...(W=(M=o.parameters)==null?void 0:M.docs)==null?void 0:W.source}}};var A,R,B;c.parameters={...c.parameters,docs:{...(A=c.parameters)==null?void 0:A.docs,source:{originalSource:`{
  render: () => <div className="dark w-96 bg-gray-900 p-4 rounded">
      <ExpandableSection title="Collapsed Dark Mode" defaultExpanded={false}>
        <div className="text-sm text-gray-400">
          Click the header to expand this dark mode section.
        </div>
      </ExpandableSection>
    </div>,
  parameters: {
    backgrounds: {
      default: 'dark'
    }
  }
}`,...(B=(R=c.parameters)==null?void 0:R.docs)==null?void 0:B.source}}};const F=["Expanded","Collapsed","WithCount","WithBadge","WithCountAndBadge","Controlled","DarkModeExpanded","DarkModeCollapsed"];export{s as Collapsed,l as Controlled,c as DarkModeCollapsed,o as DarkModeExpanded,d as Expanded,n as WithBadge,r as WithCount,i as WithCountAndBadge,F as __namedExportsOrder,z as default};
