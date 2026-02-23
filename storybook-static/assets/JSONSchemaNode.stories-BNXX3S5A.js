import{j as t}from"./iframe-DSSgKmXl.js";import{J as a}from"./JSONSchemaNode-DkRy3iIA.js";import{w as J}from"./ReactFlowDecorator-CTPaIlRv.js";import"./preload-helper-Dp1pzeXC.js";import"./BaseFieldListNode-bvohYiE_.js";import"./index-B3kNdT8l.js";import"./index-CsUALWJS.js";import"./index-DzsatpJz.js";import"./index-DVMEuaP3.js";/* empty css              */const H={title:"C Graphs / Nodes / Base / JSONSchemaNode",decorators:[J({})],parameters:{layout:"fullscreen"}},r={render:()=>{const e={label:"UserProfile",elementId:"schema-user-profile",schemaElementId:"schema-user-profile",layerId:"data-model",fill:"#ffffff",stroke:"#1e40af",properties:[{id:"id",name:"id",type:"string",required:!0},{id:"username",name:"username",type:"string",required:!0},{id:"email",name:"email",type:"string",required:!0},{id:"firstName",name:"firstName",type:"string",required:!1},{id:"lastName",name:"lastName",type:"string",required:!1},{id:"age",name:"age",type:"number",required:!1},{id:"isActive",name:"isActive",type:"boolean",required:!1}]};return t.jsx(a,{data:e,id:"test-node-1"})}},d={render:()=>{const e={label:"LoginRequest",elementId:"schema-login",schemaElementId:"schema-login",layerId:"api",fill:"#ffffff",stroke:"#1e40af",properties:[{id:"username",name:"username",type:"string",required:!0},{id:"password",name:"password",type:"string",required:!0}]};return t.jsx(a,{data:e,id:"test-node-2"})}},s={render:()=>{const e={label:"OrderDetails",elementId:"schema-order",schemaElementId:"schema-order",layerId:"data-model",fill:"#ffffff",stroke:"#1e40af",properties:[{id:"orderId",name:"orderId",type:"string",required:!0},{id:"items",name:"items",type:"OrderItem[]",required:!0},{id:"total",name:"total",type:"number",required:!0},{id:"customer",name:"customer",type:"Customer",required:!0},{id:"shippingAddress",name:"shippingAddress",type:"Address",required:!1},{id:"metadata",name:"metadata",type:"Record<string, any>",required:!1}]};return t.jsx(a,{data:e,id:"test-node-3"})}},i={render:()=>{const e={label:"EmptyObject",elementId:"schema-empty",schemaElementId:"schema-empty",layerId:"data-model",fill:"#ffffff",stroke:"#1e40af",properties:[]};return t.jsx(a,{data:e,id:"test-node-4"})}},m={render:()=>{const e={label:"HighlightedSchema",elementId:"schema-highlighted",schemaElementId:"schema-highlighted",layerId:"data-model",fill:"#ffffff",stroke:"#1e40af",strokeWidth:3,properties:[{id:"id",name:"id",type:"string",required:!0},{id:"name",name:"name",type:"string",required:!0}]};return t.jsx(a,{data:e,id:"test-node-5"})}};var o,n,l,p,c;r.parameters={...r.parameters,docs:{...(o=r.parameters)==null?void 0:o.docs,source:{originalSource:`{
  render: () => {
    const data: JSONSchemaNodeData = {
      label: 'UserProfile',
      elementId: 'schema-user-profile',
      schemaElementId: 'schema-user-profile',
      layerId: 'data-model',
      fill: '#ffffff',
      stroke: '#1e40af',
      properties: [{
        id: 'id',
        name: 'id',
        type: 'string',
        required: true
      }, {
        id: 'username',
        name: 'username',
        type: 'string',
        required: true
      }, {
        id: 'email',
        name: 'email',
        type: 'string',
        required: true
      }, {
        id: 'firstName',
        name: 'firstName',
        type: 'string',
        required: false
      }, {
        id: 'lastName',
        name: 'lastName',
        type: 'string',
        required: false
      }, {
        id: 'age',
        name: 'age',
        type: 'number',
        required: false
      }, {
        id: 'isActive',
        name: 'isActive',
        type: 'boolean',
        required: false
      }]
    };
    return <JSONSchemaNode data={data} id="test-node-1" />;
  }
}`,...(l=(n=r.parameters)==null?void 0:n.docs)==null?void 0:l.source},description:{story:`JSONSchemaNode Stories
Displays schema definitions with properties and field-level connection handles`,...(c=(p=r.parameters)==null?void 0:p.docs)==null?void 0:c.description}}};var u,f,h;d.parameters={...d.parameters,docs:{...(u=d.parameters)==null?void 0:u.docs,source:{originalSource:`{
  render: () => {
    const data: JSONSchemaNodeData = {
      label: 'LoginRequest',
      elementId: 'schema-login',
      schemaElementId: 'schema-login',
      layerId: 'api',
      fill: '#ffffff',
      stroke: '#1e40af',
      properties: [{
        id: 'username',
        name: 'username',
        type: 'string',
        required: true
      }, {
        id: 'password',
        name: 'password',
        type: 'string',
        required: true
      }]
    };
    return <JSONSchemaNode data={data} id="test-node-2" />;
  }
}`,...(h=(f=d.parameters)==null?void 0:f.docs)==null?void 0:h.source}}};var y,g,q;s.parameters={...s.parameters,docs:{...(y=s.parameters)==null?void 0:y.docs,source:{originalSource:`{
  render: () => {
    const data: JSONSchemaNodeData = {
      label: 'OrderDetails',
      elementId: 'schema-order',
      schemaElementId: 'schema-order',
      layerId: 'data-model',
      fill: '#ffffff',
      stroke: '#1e40af',
      properties: [{
        id: 'orderId',
        name: 'orderId',
        type: 'string',
        required: true
      }, {
        id: 'items',
        name: 'items',
        type: 'OrderItem[]',
        required: true
      }, {
        id: 'total',
        name: 'total',
        type: 'number',
        required: true
      }, {
        id: 'customer',
        name: 'customer',
        type: 'Customer',
        required: true
      }, {
        id: 'shippingAddress',
        name: 'shippingAddress',
        type: 'Address',
        required: false
      }, {
        id: 'metadata',
        name: 'metadata',
        type: 'Record<string, any>',
        required: false
      }]
    };
    return <JSONSchemaNode data={data} id="test-node-3" />;
  }
}`,...(q=(g=s.parameters)==null?void 0:g.docs)==null?void 0:q.source}}};var I,S,N;i.parameters={...i.parameters,docs:{...(I=i.parameters)==null?void 0:I.docs,source:{originalSource:`{
  render: () => {
    const data: JSONSchemaNodeData = {
      label: 'EmptyObject',
      elementId: 'schema-empty',
      schemaElementId: 'schema-empty',
      layerId: 'data-model',
      fill: '#ffffff',
      stroke: '#1e40af',
      properties: []
    };
    return <JSONSchemaNode data={data} id="test-node-4" />;
  }
}`,...(N=(S=i.parameters)==null?void 0:S.docs)==null?void 0:N.source}}};var O,b,E;m.parameters={...m.parameters,docs:{...(O=m.parameters)==null?void 0:O.docs,source:{originalSource:`{
  render: () => {
    const data: JSONSchemaNodeData = {
      label: 'HighlightedSchema',
      elementId: 'schema-highlighted',
      schemaElementId: 'schema-highlighted',
      layerId: 'data-model',
      fill: '#ffffff',
      stroke: '#1e40af',
      strokeWidth: 3,
      properties: [{
        id: 'id',
        name: 'id',
        type: 'string',
        required: true
      }, {
        id: 'name',
        name: 'name',
        type: 'string',
        required: true
      }]
    };
    return <JSONSchemaNode data={data} id="test-node-5" />;
  }
}`,...(E=(b=m.parameters)==null?void 0:b.docs)==null?void 0:E.source}}};const P=["WithMultipleProperties","WithRequiredOnly","WithComplexTypes","EmptySchema","Highlighted"];export{i as EmptySchema,m as Highlighted,s as WithComplexTypes,r as WithMultipleProperties,d as WithRequiredOnly,P as __namedExportsOrder,H as default};
