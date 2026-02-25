import{j as r}from"./iframe-DSSgKmXl.js";import{B as a}from"./BreadcrumbNav-DXCKxi7g.js";import{G}from"./index-NvR17eTZ.js";import"./preload-helper-Dp1pzeXC.js";import"./create-theme-BOkxhGns.js";import"./chevron-right-icon-C4Btn_J9.js";import"./Badge-4uEMzFcW.js";import"./Button-DjdbHWkm.js";function I(e){return G({attr:{fill:"none",viewBox:"0 0 24 24",strokeWidth:"1.5",stroke:"currentColor","aria-hidden":"true"},child:[{tag:"path",attr:{strokeLinecap:"round",strokeLinejoin:"round",d:"m21 7.5-2.25-1.313M21 7.5v2.25m0-2.25-2.25 1.313M3 7.5l2.25-1.313M3 7.5l2.25 1.313M3 7.5v2.25m9 3 2.25-1.313M12 12.75l-2.25-1.313M12 12.75V15m0 6.75 2.25-1.313M12 21.75V19.5m0 2.25-2.25-1.313m0-16.875L12 2.25l2.25 1.313M21 14.25v2.25l-2.25 1.313m-13.5 0L3 16.5v-2.25"},child:[]}]})(e)}function D(e){return G({attr:{fill:"none",viewBox:"0 0 24 24",strokeWidth:"1.5",stroke:"currentColor","aria-hidden":"true"},child:[{tag:"path",attr:{strokeLinecap:"round",strokeLinejoin:"round",d:"M6 6.878V6a2.25 2.25 0 0 1 2.25-2.25h7.5A2.25 2.25 0 0 1 18 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 0 0 4.5 9v.878m13.5-3A2.25 2.25 0 0 1 19.5 9v.878m0 0a2.246 2.246 0 0 0-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0 1 21 12v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6c0-.98.626-1.813 1.5-2.122"},child:[]}]})(e)}const P={title:"A Primitives / Navigation / BreadcrumbNav"},o={render:()=>{const e=[{id:"goal-1",label:"Increase Revenue",type:"Goal"},{id:"req-1",label:"Customer Satisfaction",type:"Requirement"}];return r.jsx(a,{segments:e,onNavigate:t=>console.log("Navigate to:",t)})}},s={render:()=>{const e=[{id:"goal-1",label:"Increase Revenue",type:"Goal"}];return r.jsx(a,{segments:e,onNavigate:t=>console.log("Navigate to:",t)})}},n={render:()=>{const e=[{id:"stakeholder-1",label:"Board of Directors",type:"Stakeholder",icon:r.jsx(I,{className:"w-4 h-4"})},{id:"driver-1",label:"Digital Transformation",type:"Driver",icon:r.jsx(D,{className:"w-4 h-4"})},{id:"goal-1",label:"Cloud Migration",type:"Goal"},{id:"req-1",label:"Reduce TCO by 30%",type:"Requirement"}];return r.jsx(a,{segments:e,currentLevel:"Business",onNavigate:t=>console.log("Navigate to:",t)})}},l={render:()=>{const e=[{id:"goal-1",label:"Increase Revenue",type:"Goal"},{id:"req-1",label:"Customer Satisfaction",type:"Requirement"}];return r.jsx(a,{segments:e,currentLevel:"Motivation",onNavigate:t=>console.log("Navigate to:",t),onClear:()=>console.log("Cleared breadcrumb"),showLevelBadge:!0})}},i={render:()=>{const e=[{id:"goal-1",label:"Increase Revenue",type:"Goal"},{id:"req-1",label:"Customer Satisfaction",type:"Requirement"}];return r.jsx(a,{segments:e,currentLevel:"Business",onNavigate:t=>console.log("Navigate to:",t),showLevelBadge:!1})}},c={render:()=>{const e=[{id:"stakeholder-1",label:"Executive Team",type:"Stakeholder",icon:r.jsx(I,{className:"w-4 h-4 text-purple-600"})},{id:"driver-1",label:"Market Expansion",type:"Driver",icon:r.jsx(D,{className:"w-4 h-4 text-blue-600"})},{id:"goal-1",label:"Enter New Markets",type:"Goal"}];return r.jsx(a,{segments:e,currentLevel:"Motivation",onNavigate:t=>console.log("Navigate to:",t),onClear:()=>console.log("Cleared"),showLevelBadge:!0})}},d={render:()=>r.jsxs("div",{className:"p-4 text-gray-500 text-sm",children:[r.jsx(a,{segments:[],onNavigate:e=>console.log("Navigate to:",e)}),r.jsx("p",{className:"mt-4",children:"No breadcrumbs to display (component returns null)"})]})};var m,u,g;o.parameters={...o.parameters,docs:{...(m=o.parameters)==null?void 0:m.docs,source:{originalSource:`{
  render: () => {
    const segments: BreadcrumbSegment[] = [{
      id: 'goal-1',
      label: 'Increase Revenue',
      type: 'Goal'
    }, {
      id: 'req-1',
      label: 'Customer Satisfaction',
      type: 'Requirement'
    }];
    return <BreadcrumbNav segments={segments} onNavigate={id => console.log('Navigate to:', id)} />;
  }
}`,...(g=(u=o.parameters)==null?void 0:u.docs)==null?void 0:g.source}}};var v,p,b;s.parameters={...s.parameters,docs:{...(v=s.parameters)==null?void 0:v.docs,source:{originalSource:`{
  render: () => {
    const segments: BreadcrumbSegment[] = [{
      id: 'goal-1',
      label: 'Increase Revenue',
      type: 'Goal'
    }];
    return <BreadcrumbNav segments={segments} onNavigate={id => console.log('Navigate to:', id)} />;
  }
}`,...(b=(p=s.parameters)==null?void 0:p.docs)==null?void 0:b.source}}};var N,h,y;n.parameters={...n.parameters,docs:{...(N=n.parameters)==null?void 0:N.docs,source:{originalSource:`{
  render: () => {
    const segments: BreadcrumbSegment[] = [{
      id: 'stakeholder-1',
      label: 'Board of Directors',
      type: 'Stakeholder',
      icon: <HiOutlineCubeTransparent className="w-4 h-4" />
    }, {
      id: 'driver-1',
      label: 'Digital Transformation',
      type: 'Driver',
      icon: <HiOutlineRectangleStack className="w-4 h-4" />
    }, {
      id: 'goal-1',
      label: 'Cloud Migration',
      type: 'Goal'
    }, {
      id: 'req-1',
      label: 'Reduce TCO by 30%',
      type: 'Requirement'
    }];
    return <BreadcrumbNav segments={segments} currentLevel="Business" onNavigate={id => console.log('Navigate to:', id)} />;
  }
}`,...(y=(h=n.parameters)==null?void 0:h.docs)==null?void 0:y.source}}};var B,x,S;l.parameters={...l.parameters,docs:{...(B=l.parameters)==null?void 0:B.docs,source:{originalSource:`{
  render: () => {
    const segments: BreadcrumbSegment[] = [{
      id: 'goal-1',
      label: 'Increase Revenue',
      type: 'Goal'
    }, {
      id: 'req-1',
      label: 'Customer Satisfaction',
      type: 'Requirement'
    }];
    return <BreadcrumbNav segments={segments} currentLevel="Motivation" onNavigate={id => console.log('Navigate to:', id)} onClear={() => console.log('Cleared breadcrumb')} showLevelBadge={true} />;
  }
}`,...(S=(x=l.parameters)==null?void 0:x.docs)==null?void 0:S.source}}};var L,C,k;i.parameters={...i.parameters,docs:{...(L=i.parameters)==null?void 0:L.docs,source:{originalSource:`{
  render: () => {
    const segments: BreadcrumbSegment[] = [{
      id: 'goal-1',
      label: 'Increase Revenue',
      type: 'Goal'
    }, {
      id: 'req-1',
      label: 'Customer Satisfaction',
      type: 'Requirement'
    }];
    return <BreadcrumbNav segments={segments} currentLevel="Business" onNavigate={id => console.log('Navigate to:', id)} showLevelBadge={false} />;
  }
}`,...(k=(C=i.parameters)==null?void 0:C.docs)==null?void 0:k.source}}};var f,R,M;c.parameters={...c.parameters,docs:{...(f=c.parameters)==null?void 0:f.docs,source:{originalSource:`{
  render: () => {
    const segments: BreadcrumbSegment[] = [{
      id: 'stakeholder-1',
      label: 'Executive Team',
      type: 'Stakeholder',
      icon: <HiOutlineCubeTransparent className="w-4 h-4 text-purple-600" />
    }, {
      id: 'driver-1',
      label: 'Market Expansion',
      type: 'Driver',
      icon: <HiOutlineRectangleStack className="w-4 h-4 text-blue-600" />
    }, {
      id: 'goal-1',
      label: 'Enter New Markets',
      type: 'Goal'
    }];
    return <BreadcrumbNav segments={segments} currentLevel="Motivation" onNavigate={id => console.log('Navigate to:', id)} onClear={() => console.log('Cleared')} showLevelBadge={true} />;
  }
}`,...(M=(R=c.parameters)==null?void 0:R.docs)==null?void 0:M.source}}};var w,j,q;d.parameters={...d.parameters,docs:{...(w=d.parameters)==null?void 0:w.docs,source:{originalSource:`{
  render: () => {
    return <div className="p-4 text-gray-500 text-sm">
      <BreadcrumbNav segments={[]} onNavigate={id => console.log('Navigate to:', id)} />
      <p className="mt-4">No breadcrumbs to display (component returns null)</p>
    </div>;
  }
}`,...(q=(j=d.parameters)==null?void 0:j.docs)==null?void 0:q.source}}};const z=["Default","SingleLevel","MultiLevel","WithClearButton","WithoutLevelBadge","WithIcons","Empty"];export{o as Default,d as Empty,n as MultiLevel,s as SingleLevel,l as WithClearButton,c as WithIcons,i as WithoutLevelBadge,z as __namedExportsOrder,P as default};
