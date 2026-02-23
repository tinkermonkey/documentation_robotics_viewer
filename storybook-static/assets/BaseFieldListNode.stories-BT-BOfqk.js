import{j as r}from"./iframe-DSSgKmXl.js";import{B as t}from"./BaseFieldListNode-bvohYiE_.js";import{c as n}from"./nodeDataFixtures-B0tGCHY2.js";import{w as _}from"./ReactFlowDecorator-CTPaIlRv.js";import"./preload-helper-Dp1pzeXC.js";import"./index-B3kNdT8l.js";import"./index-CsUALWJS.js";import"./index-DzsatpJz.js";import"./index-DVMEuaP3.js";/* empty css              */const Y={title:"C Graphs / Nodes / Base / BaseFieldListNode",decorators:[_({})],parameters:{layout:"fullscreen"}},R=[{id:"f1",name:"id",type:"UUID",required:!0},{id:"f2",name:"status",type:"enum",required:!0}],k=[{id:"f1",name:"id",type:"UUID",required:!0},{id:"f2",name:"firstName",type:"string",required:!0},{id:"f3",name:"lastName",type:"string",required:!0},{id:"f4",name:"email",type:"string",required:!0},{id:"f5",name:"phone",type:"string",required:!1},{id:"f6",name:"address",type:"string",required:!1},{id:"f7",name:"city",type:"string",required:!1},{id:"f8",name:"state",type:"string",required:!1},{id:"f9",name:"postalCode",type:"string",required:!1},{id:"f10",name:"country",type:"string",required:!1},{id:"f11",name:"createdAt",type:"timestamp",required:!1},{id:"f12",name:"updatedAt",type:"timestamp",required:!1}],w=[{id:"f1",name:"identifier",type:"UUID",required:!0},{id:"f2",name:"name",type:"string",required:!0},{id:"f3",name:"quantity",type:"integer",required:!0},{id:"f4",name:"price",type:"decimal",required:!0},{id:"f5",name:"active",type:"boolean",required:!1}],P=[{id:"col1",name:"user_id",type:"BIGINT",required:!0},{id:"col2",name:"email",type:"VARCHAR(255)",required:!0},{id:"col3",name:"password_hash",type:"VARCHAR(256)",required:!0},{id:"col4",name:"created_at",type:"TIMESTAMP",required:!1},{id:"col5",name:"last_login",type:"TIMESTAMP",required:!1}],s={render:()=>{const e=n();return r.jsx(t,{...e})}},a={render:()=>{const e=n({label:"Order Status",typeLabel:"ENUM",items:R});return r.jsx(t,{...e})}},i={render:()=>{const e=n({label:"Customer",typeLabel:"CLASS",items:k});return r.jsx(t,{...e})}},o={render:()=>{const e=n({label:"Product",typeLabel:"CLASS",items:w});return r.jsx(t,{...e})}},d={render:()=>{const e=n({label:"User (Updated)",typeLabel:"CLASS",items:[{id:"f1",name:"id",type:"UUID",required:!0},{id:"f2",name:"username",type:"string",required:!0},{id:"f3",name:"email",type:"string",required:!0},{id:"f4",name:"role",type:"enum",required:!0}],colors:{border:"#ff9800",background:"#fff3e0",header:"#f57c00",handle:"#e65100"}});return r.jsx(t,{...e})}},c={render:()=>{const e=n({label:"Empty Entity",typeLabel:"CLASS",items:[]});return r.jsx(t,{...e})}},m={render:()=>{const e=n({label:"users",typeLabel:"TABLE",items:P,colors:{border:"#2196f3",background:"#e3f2fd",header:"#1976d2",handle:"#0d47a1"}});return r.jsx(t,{...e})}},l={render:()=>{const e=n({label:"Highlighted Entity",typeLabel:"CLASS",items:R});return r.jsx(t,{...e})}};var u,p,f;s.parameters={...s.parameters,docs:{...(u=s.parameters)==null?void 0:u.docs,source:{originalSource:`{
  render: () => {
    const config = createBaseFieldListNodeConfig();
    return <BaseFieldListNode {...config} />;
  }
}`,...(f=(p=s.parameters)==null?void 0:p.docs)==null?void 0:f.source}}};var g,y,L;a.parameters={...a.parameters,docs:{...(g=a.parameters)==null?void 0:g.docs,source:{originalSource:`{
  render: () => {
    const config = createBaseFieldListNodeConfig({
      label: 'Order Status',
      typeLabel: 'ENUM',
      items: shortItems
    });
    return <BaseFieldListNode {...config} />;
  }
}`,...(L=(y=a.parameters)==null?void 0:y.docs)==null?void 0:L.source}}};var b,h,S;i.parameters={...i.parameters,docs:{...(b=i.parameters)==null?void 0:b.docs,source:{originalSource:`{
  render: () => {
    const config = createBaseFieldListNodeConfig({
      label: 'Customer',
      typeLabel: 'CLASS',
      items: longItems
    });
    return <BaseFieldListNode {...config} />;
  }
}`,...(S=(h=i.parameters)==null?void 0:h.docs)==null?void 0:S.source}}};var q,C,N;o.parameters={...o.parameters,docs:{...(q=o.parameters)==null?void 0:q.docs,source:{originalSource:`{
  render: () => {
    const config = createBaseFieldListNodeConfig({
      label: 'Product',
      typeLabel: 'CLASS',
      items: itemsWithTypes
    });
    return <BaseFieldListNode {...config} />;
  }
}`,...(N=(C=o.parameters)==null?void 0:C.docs)==null?void 0:N.source}}};var B,F,A;d.parameters={...d.parameters,docs:{...(B=d.parameters)==null?void 0:B.docs,source:{originalSource:`{
  render: () => {
    const config = createBaseFieldListNodeConfig({
      label: 'User (Updated)',
      typeLabel: 'CLASS',
      items: [{
        id: 'f1',
        name: 'id',
        type: 'UUID',
        required: true
      }, {
        id: 'f2',
        name: 'username',
        type: 'string',
        required: true
      }, {
        id: 'f3',
        name: 'email',
        type: 'string',
        required: true
      }, {
        id: 'f4',
        name: 'role',
        type: 'enum',
        required: true
      }],
      colors: {
        border: '#ff9800',
        background: '#fff3e0',
        header: '#f57c00',
        handle: '#e65100'
      }
    });
    return <BaseFieldListNode {...config} />;
  }
}`,...(A=(F=d.parameters)==null?void 0:F.docs)==null?void 0:A.source}}};var I,U,E;c.parameters={...c.parameters,docs:{...(I=c.parameters)==null?void 0:I.docs,source:{originalSource:`{
  render: () => {
    const config = createBaseFieldListNodeConfig({
      label: 'Empty Entity',
      typeLabel: 'CLASS',
      items: []
    });
    return <BaseFieldListNode {...config} />;
  }
}`,...(E=(U=c.parameters)==null?void 0:U.docs)==null?void 0:E.source}}};var x,j,D;m.parameters={...m.parameters,docs:{...(x=m.parameters)==null?void 0:x.docs,source:{originalSource:`{
  render: () => {
    const config = createBaseFieldListNodeConfig({
      label: 'users',
      typeLabel: 'TABLE',
      items: schemaItems,
      colors: {
        border: '#2196f3',
        background: '#e3f2fd',
        header: '#1976d2',
        handle: '#0d47a1'
      }
    });
    return <BaseFieldListNode {...config} />;
  }
}`,...(D=(j=m.parameters)==null?void 0:j.docs)==null?void 0:D.source}}};var T,H,M;l.parameters={...l.parameters,docs:{...(T=l.parameters)==null?void 0:T.docs,source:{originalSource:`{
  render: () => {
    const config = createBaseFieldListNodeConfig({
      label: 'Highlighted Entity',
      typeLabel: 'CLASS',
      items: shortItems
    });
    return <BaseFieldListNode {...config} />;
  }
}`,...(M=(H=l.parameters)==null?void 0:H.docs)==null?void 0:M.source}}};const Z=["Default","ShortList","LongList","WithIcons","ChangesetUpdate","EmptyFields","DatabaseSchema","Highlighted"];export{d as ChangesetUpdate,m as DatabaseSchema,s as Default,c as EmptyFields,l as Highlighted,i as LongList,a as ShortList,o as WithIcons,Z as __namedExportsOrder,Y as default};
