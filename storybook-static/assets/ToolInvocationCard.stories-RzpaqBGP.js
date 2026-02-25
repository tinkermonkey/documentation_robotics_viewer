import{j as e}from"./iframe-DSSgKmXl.js";import{T as r}from"./ToolInvocationCard-DbyYmtTK.js";import"./preload-helper-Dp1pzeXC.js";import"./createLucideIcon-CIvKt9yE.js";import"./Badge-4uEMzFcW.js";import"./create-theme-BOkxhGns.js";const U={title:"D Chat / Messages / ToolInvocationCard"},o={render:()=>{const t={toolName:"searchModel",toolInput:{query:"stakeholder",layer:"motivation"},status:{state:"executing"},timestamp:new Date().toISOString()};return e.jsx("div",{className:"p-4 max-w-3xl bg-white dark:bg-gray-800",children:e.jsx(r,{toolName:t.toolName,toolInput:t.toolInput,status:t.status,timestamp:t.timestamp})})}},a={render:()=>{const t={toolName:"getElement",toolInput:{elementId:"motivation.goal.customer-satisfaction"},status:{state:"completed",result:{id:"motivation.goal.customer-satisfaction",name:"Improve Customer Satisfaction",type:"Goal",description:"Achieve 95% customer satisfaction rating by Q4 2024",relationships:{outgoing:["realizes:outcome.happy-customers"],incoming:["influences:stakeholder.customers"]}}},timestamp:new Date().toISOString()};return e.jsx("div",{className:"p-4 max-w-3xl bg-white dark:bg-gray-800",children:e.jsx(r,{toolName:t.toolName,toolInput:t.toolInput,status:t.status,timestamp:t.timestamp})})}},n={render:()=>{const t={toolName:"validateModel",toolInput:{checkCrossLayerReferences:!0,strictMode:!0},status:{state:"failed",error:'Cross-layer reference validation failed: Element "business.capability.payment-processing" references non-existent technology element "tech.service.payment-api"'},timestamp:new Date().toISOString()};return e.jsx("div",{className:"p-4 max-w-3xl bg-white dark:bg-gray-800",children:e.jsx(r,{toolName:t.toolName,toolInput:t.toolInput,status:t.status,timestamp:t.timestamp})})}},s={render:()=>{const t={toolName:"analyzeLayer",toolInput:{layer:"business",includeRelationships:!0},status:{state:"completed",result:{layerId:"business",elementCount:23,elements:[{id:"business.capability.order-management",name:"Order Management",type:"BusinessCapability",relationships:{incoming:3,outgoing:5}},{id:"business.service.inventory",name:"Inventory Service",type:"BusinessService",relationships:{incoming:2,outgoing:4}},{id:"business.function.procurement",name:"Procurement",type:"BusinessFunction",relationships:{incoming:1,outgoing:3}}],relationshipSummary:{composition:8,aggregation:5,realization:10,serving:12},coverage:{documented:20,undocumented:3,completeness:.87}}},timestamp:new Date().toISOString()};return e.jsx("div",{className:"p-4 max-w-3xl bg-white dark:bg-gray-800",children:e.jsx(r,{toolName:t.toolName,toolInput:t.toolInput,status:t.status,timestamp:t.timestamp})})}},i={render:()=>{const t={toolName:"createChangeset",toolInput:{name:"Add payment gateway integration",description:"Integrate Stripe payment gateway for subscription management",changes:[{operation:"add",element:{id:"tech.service.stripe-gateway",type:"TechnologyService",name:"Stripe Payment Gateway",properties:{vendor:"Stripe",version:"v2024-01",protocol:"REST/HTTPS"}}},{operation:"modify",elementId:"app.component.subscription-manager",changes:{addRelationship:{type:"uses",target:"tech.service.stripe-gateway"}}}]},status:{state:"completed",result:{changesetId:"cs-2024-02-10-001",status:"created",affectedElements:2}},timestamp:new Date().toISOString()};return e.jsx("div",{className:"p-4 max-w-3xl bg-white dark:bg-gray-800",children:e.jsx(r,{toolName:t.toolName,toolInput:t.toolInput,status:t.status,timestamp:t.timestamp})})}};var l,c,m,p,u;o.parameters={...o.parameters,docs:{...(l=o.parameters)==null?void 0:l.docs,source:{originalSource:`{
  render: () => {
    const toolInvocation: ToolInvocationContent = {
      type: 'tool_invocation',
      toolUseId: 'tool-1',
      toolName: 'searchModel',
      toolInput: {
        query: 'stakeholder',
        layer: 'motivation'
      },
      status: {
        state: 'executing'
      },
      timestamp: new Date().toISOString()
    };
    return <div className="p-4 max-w-3xl bg-white dark:bg-gray-800">
      <ToolInvocationCard toolName={toolInvocation.toolName} toolInput={toolInvocation.toolInput} status={toolInvocation.status} timestamp={toolInvocation.timestamp} />
    </div>;
  }
}`,...(m=(c=o.parameters)==null?void 0:c.docs)==null?void 0:m.source},description:{story:"Tool currently executing",...(u=(p=o.parameters)==null?void 0:p.docs)==null?void 0:u.description}}};var d,g,v,I,y;a.parameters={...a.parameters,docs:{...(d=a.parameters)==null?void 0:d.docs,source:{originalSource:`{
  render: () => {
    const toolInvocation: ToolInvocationContent = {
      type: 'tool_invocation',
      toolUseId: 'tool-2',
      toolName: 'getElement',
      toolInput: {
        elementId: 'motivation.goal.customer-satisfaction'
      },
      status: {
        state: 'completed',
        result: {
          id: 'motivation.goal.customer-satisfaction',
          name: 'Improve Customer Satisfaction',
          type: 'Goal',
          description: 'Achieve 95% customer satisfaction rating by Q4 2024',
          relationships: {
            outgoing: ['realizes:outcome.happy-customers'],
            incoming: ['influences:stakeholder.customers']
          }
        }
      },
      timestamp: new Date().toISOString()
    };
    return <div className="p-4 max-w-3xl bg-white dark:bg-gray-800">
      <ToolInvocationCard toolName={toolInvocation.toolName} toolInput={toolInvocation.toolInput} status={toolInvocation.status} timestamp={toolInvocation.timestamp} />
    </div>;
  }
}`,...(v=(g=a.parameters)==null?void 0:g.docs)==null?void 0:v.source},description:{story:"Tool completed successfully with result",...(y=(I=a.parameters)==null?void 0:I.docs)==null?void 0:y.description}}};var h,S,x,b,w;n.parameters={...n.parameters,docs:{...(h=n.parameters)==null?void 0:h.docs,source:{originalSource:`{
  render: () => {
    const toolInvocation: ToolInvocationContent = {
      type: 'tool_invocation',
      toolUseId: 'tool-3',
      toolName: 'validateModel',
      toolInput: {
        checkCrossLayerReferences: true,
        strictMode: true
      },
      status: {
        state: 'failed',
        error: 'Cross-layer reference validation failed: Element "business.capability.payment-processing" references non-existent technology element "tech.service.payment-api"'
      },
      timestamp: new Date().toISOString()
    };
    return <div className="p-4 max-w-3xl bg-white dark:bg-gray-800">
      <ToolInvocationCard toolName={toolInvocation.toolName} toolInput={toolInvocation.toolInput} status={toolInvocation.status} timestamp={toolInvocation.timestamp} />
    </div>;
  }
}`,...(x=(S=n.parameters)==null?void 0:S.docs)==null?void 0:x.source},description:{story:"Tool execution failed with error",...(w=(b=n.parameters)==null?void 0:b.docs)==null?void 0:w.description}}};var N,f,C,T,k;s.parameters={...s.parameters,docs:{...(N=s.parameters)==null?void 0:N.docs,source:{originalSource:`{
  render: () => {
    const toolInvocation: ToolInvocationContent = {
      type: 'tool_invocation',
      toolUseId: 'tool-4',
      toolName: 'analyzeLayer',
      toolInput: {
        layer: 'business',
        includeRelationships: true
      },
      status: {
        state: 'completed',
        result: {
          layerId: 'business',
          elementCount: 23,
          elements: [{
            id: 'business.capability.order-management',
            name: 'Order Management',
            type: 'BusinessCapability',
            relationships: {
              incoming: 3,
              outgoing: 5
            }
          }, {
            id: 'business.service.inventory',
            name: 'Inventory Service',
            type: 'BusinessService',
            relationships: {
              incoming: 2,
              outgoing: 4
            }
          }, {
            id: 'business.function.procurement',
            name: 'Procurement',
            type: 'BusinessFunction',
            relationships: {
              incoming: 1,
              outgoing: 3
            }
          }],
          relationshipSummary: {
            composition: 8,
            aggregation: 5,
            realization: 10,
            serving: 12
          },
          coverage: {
            documented: 20,
            undocumented: 3,
            completeness: 0.87
          }
        }
      },
      timestamp: new Date().toISOString()
    };
    return <div className="p-4 max-w-3xl bg-white dark:bg-gray-800">
      <ToolInvocationCard toolName={toolInvocation.toolName} toolInput={toolInvocation.toolInput} status={toolInvocation.status} timestamp={toolInvocation.timestamp} />
    </div>;
  }
}`,...(C=(f=s.parameters)==null?void 0:f.docs)==null?void 0:C.source},description:{story:"Tool with large JSON output",...(k=(T=s.parameters)==null?void 0:T.docs)==null?void 0:k.description}}};var O,j,E,D,M;i.parameters={...i.parameters,docs:{...(O=i.parameters)==null?void 0:O.docs,source:{originalSource:`{
  render: () => {
    const toolInvocation: ToolInvocationContent = {
      type: 'tool_invocation',
      toolUseId: 'tool-5',
      toolName: 'createChangeset',
      toolInput: {
        name: 'Add payment gateway integration',
        description: 'Integrate Stripe payment gateway for subscription management',
        changes: [{
          operation: 'add',
          element: {
            id: 'tech.service.stripe-gateway',
            type: 'TechnologyService',
            name: 'Stripe Payment Gateway',
            properties: {
              vendor: 'Stripe',
              version: 'v2024-01',
              protocol: 'REST/HTTPS'
            }
          }
        }, {
          operation: 'modify',
          elementId: 'app.component.subscription-manager',
          changes: {
            addRelationship: {
              type: 'uses',
              target: 'tech.service.stripe-gateway'
            }
          }
        }]
      },
      status: {
        state: 'completed',
        result: {
          changesetId: 'cs-2024-02-10-001',
          status: 'created',
          affectedElements: 2
        }
      },
      timestamp: new Date().toISOString()
    };
    return <div className="p-4 max-w-3xl bg-white dark:bg-gray-800">
      <ToolInvocationCard toolName={toolInvocation.toolName} toolInput={toolInvocation.toolInput} status={toolInvocation.status} timestamp={toolInvocation.timestamp} />
    </div>;
  }
}`,...(E=(j=i.parameters)==null?void 0:j.docs)==null?void 0:E.source},description:{story:"Tool with complex nested input",...(M=(D=i.parameters)==null?void 0:D.docs)==null?void 0:M.description}}};const A=["Executing","Completed","Failed","LargeOutput","ComplexInput"];export{a as Completed,i as ComplexInput,o as Executing,n as Failed,s as LargeOutput,A as __namedExportsOrder,U as default};
