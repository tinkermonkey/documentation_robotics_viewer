import{j as n,r as f}from"./iframe-DSSgKmXl.js";import{A as S}from"./AnnotationPanel-CmH8HUm1.js";import{u as r}from"./annotationStore-C2enqPKJ.js";import{u as I}from"./modelStore-D8PMC_DL.js";import{c as K,a as t}from"./annotationFixtures-DVStLF4m.js";import{c as V}from"./modelFixtures-nuBusyic.js";import"./preload-helper-Dp1pzeXC.js";import"./EmptyState-B6ktL3oV.js";import"./index-NvR17eTZ.js";import"./Button-DjdbHWkm.js";import"./create-theme-BOkxhGns.js";import"./LoadingState-DZmQgDQh.js";import"./Spinner-Al2eUyHo.js";import"./Card-dBO4-pIe.js";import"./ErrorState-uaa9-pX2.js";import"./Alert-B-2krvq0.js";import"./BreadcrumbNav-DXCKxi7g.js";import"./chevron-right-icon-C4Btn_J9.js";import"./Badge-4uEMzFcW.js";import"./FilterPanel-C0Vy-Tax.js";import"./x-BvdhAmd6.js";import"./createLucideIcon-CIvKt9yE.js";import"./AccordionTitle-Cun89kOD.js";import"./chevron-down-icon-CIJfcLG8.js";import"./Label-BgBB6PcL.js";import"./ExportButtonGroup-C-LUBG8s.js";import"./LayerRightSidebar-BAszuvNY.js";import"./BaseInspectorPanel-BBWNLuHC.js";import"./RenderPropErrorBoundary-C5UeOkUJ.js";import"./BaseControlPanel-D-ZWsrS_.js";import"./GraphViewSidebar-BmDrn4TD.js";import"./NavigationErrorNotification-BQSize9i.js";import"./crossLayerStore-Bec5Tsd5.js";import"./react-fqQoFC2C.js";import"./errorTracker-DrR4A8t3.js";import"./floating-ui.react-CidLzX28.js";import"./index-B3kNdT8l.js";import"./index-CsUALWJS.js";const Ce={title:"A Primitives / Panels and Sidebars / AnnotationPanel",parameters:{layout:"centered"}};function o({annotations:e=[],selectedElementId:a=null,modelOverride:i=null}){return f.useEffect(()=>{r.setState({annotations:e,selectedElementId:a,loading:!1,error:null});const A=i||V();return I.setState({model:A,loading:!1,error:null}),()=>{r.setState({annotations:[],selectedElementId:null,loading:!1,error:null}),I.setState({model:null,loading:!1,error:null})}},[e,a,i]),n.jsx(S,{})}const s={render:()=>n.jsx(o,{annotations:[]})},l={render:()=>{const e=[t({id:"ann-1",elementId:"goal-1",author:"Alice Johnson",content:"This component needs clarification on the requirements.",resolved:!1}),t({id:"ann-2",elementId:"goal-1",author:"Bob Smith",content:"Agreed, let me update the specification.",resolved:!1}),t({id:"ann-3",elementId:"requirement-1",author:"Charlie Davis",content:"Looks good! This aligns with our architecture guidelines.",resolved:!0})];return n.jsx(o,{annotations:e})}},d={render:()=>{const e=[t({id:"ann-1",elementId:"goal-1",author:"Alice",content:"This goal needs metrics.",resolved:!1}),t({id:"ann-2",elementId:"goal-1",author:"Bob",content:"Metrics added in version 2.1",resolved:!0}),t({id:"ann-3",elementId:"requirement-2",author:"Charlie",content:"This is for a different element",resolved:!1})];return n.jsx(o,{annotations:e,selectedElementId:"goal-1"})}},c={render:()=>{const e=K(10);return n.jsx(o,{annotations:e})}},u={render:()=>{const e=[t({id:"ann-1",elementId:"goal-1",author:"Alice",content:"We need to align this with @business.service.authentication. See also @api.endpoint.secure for details.",resolved:!1}),t({id:"ann-2",elementId:"goal-1",author:"Bob",content:"Good point. I have updated @requirement.security to reflect this.",resolved:!1})];return n.jsx(o,{annotations:e,selectedElementId:"goal-1"})}},m={render:()=>{const e=new Date,a=new Date(e.getTime()-7200*1e3).toISOString(),i=new Date(e.getTime()-3600*1e3).toISOString(),A=new Date(e.getTime()-1800*1e3).toISOString(),U=[t({id:"ann-1",elementId:"goal-1",author:"Alice Johnson",content:"What is the timeline for this initiative?",createdAt:a,resolved:!1,replies:[{id:"reply-1",author:"Bob Smith",content:"Target Q2 2024.",createdAt:i},{id:"reply-2",author:"Alice Johnson",content:"Perfect, that aligns with our planning cycle.",createdAt:A}]})];return n.jsx(o,{annotations:U,selectedElementId:"goal-1"})}},p={render:()=>{const e=[t({id:"ann-1",elementId:"goal-1",author:"Alice",content:"Need to add performance metrics.",resolved:!0}),t({id:"ann-2",elementId:"goal-1",author:"Bob",content:"SLA defined in appendix C.",resolved:!0}),t({id:"ann-3",elementId:"goal-1",author:"Charlie",content:"Still needs cost analysis.",resolved:!1})];return n.jsx(o,{annotations:e,selectedElementId:"goal-1"})}},h={render:()=>(f.useEffect(()=>{r.setState({annotations:[],loading:!0,error:null});const e=setTimeout(()=>{r.setState({loading:!1,annotations:K(3)})},2e3);return()=>clearTimeout(e)},[]),n.jsx(S,{}))},g={render:()=>(f.useEffect(()=>(r.setState({annotations:[],loading:!1,error:"Failed to load annotations. Please refresh the page."}),()=>{r.setState({error:null})}),[]),n.jsx(S,{}))};var v,x,y;s.parameters={...s.parameters,docs:{...(v=s.parameters)==null?void 0:v.docs,source:{originalSource:`{
  render: () => <AnnotationPanelStory annotations={[]} />
}`,...(y=(x=s.parameters)==null?void 0:x.docs)==null?void 0:y.source}}};var w,E,T;l.parameters={...l.parameters,docs:{...(w=l.parameters)==null?void 0:w.docs,source:{originalSource:`{
  render: () => {
    const annotations = [createAnnotationFixture({
      id: 'ann-1',
      elementId: 'goal-1',
      author: 'Alice Johnson',
      content: 'This component needs clarification on the requirements.',
      resolved: false
    }), createAnnotationFixture({
      id: 'ann-2',
      elementId: 'goal-1',
      author: 'Bob Smith',
      content: 'Agreed, let me update the specification.',
      resolved: false
    }), createAnnotationFixture({
      id: 'ann-3',
      elementId: 'requirement-1',
      author: 'Charlie Davis',
      content: 'Looks good! This aligns with our architecture guidelines.',
      resolved: true
    })];
    return <AnnotationPanelStory annotations={annotations} />;
  }
}`,...(T=(E=l.parameters)==null?void 0:E.docs)==null?void 0:T.source}}};var F,P,b;d.parameters={...d.parameters,docs:{...(F=d.parameters)==null?void 0:F.docs,source:{originalSource:`{
  render: () => {
    const annotations = [createAnnotationFixture({
      id: 'ann-1',
      elementId: 'goal-1',
      author: 'Alice',
      content: 'This goal needs metrics.',
      resolved: false
    }), createAnnotationFixture({
      id: 'ann-2',
      elementId: 'goal-1',
      author: 'Bob',
      content: 'Metrics added in version 2.1',
      resolved: true
    }), createAnnotationFixture({
      id: 'ann-3',
      elementId: 'requirement-2',
      author: 'Charlie',
      content: 'This is for a different element',
      resolved: false
    })];
    return <AnnotationPanelStory annotations={annotations} selectedElementId="goal-1" />;
  }
}`,...(b=(P=d.parameters)==null?void 0:P.docs)==null?void 0:b.source}}};var j,W,M;c.parameters={...c.parameters,docs:{...(j=c.parameters)==null?void 0:j.docs,source:{originalSource:`{
  render: () => {
    const annotations = createAnnotationListFixture(10);
    return <AnnotationPanelStory annotations={annotations} />;
  }
}`,...(M=(W=c.parameters)==null?void 0:W.docs)==null?void 0:M.source}}};var B,D,C;u.parameters={...u.parameters,docs:{...(B=u.parameters)==null?void 0:B.docs,source:{originalSource:`{
  render: () => {
    const annotations = [createAnnotationFixture({
      id: 'ann-1',
      elementId: 'goal-1',
      author: 'Alice',
      content: 'We need to align this with @business.service.authentication. See also @api.endpoint.secure for details.',
      resolved: false
    }), createAnnotationFixture({
      id: 'ann-2',
      elementId: 'goal-1',
      author: 'Bob',
      content: 'Good point. I have updated @requirement.security to reflect this.',
      resolved: false
    })];
    return <AnnotationPanelStory annotations={annotations} selectedElementId="goal-1" />;
  }
}`,...(C=(D=u.parameters)==null?void 0:D.docs)==null?void 0:C.source}}};var L,q,H;m.parameters={...m.parameters,docs:{...(L=m.parameters)==null?void 0:L.docs,source:{originalSource:`{
  render: () => {
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
    const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString();
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000).toISOString();
    const annotations = [createAnnotationFixture({
      id: 'ann-1',
      elementId: 'goal-1',
      author: 'Alice Johnson',
      content: 'What is the timeline for this initiative?',
      createdAt: twoHoursAgo,
      resolved: false,
      replies: [{
        id: 'reply-1',
        author: 'Bob Smith',
        content: 'Target Q2 2024.',
        createdAt: oneHourAgo
      }, {
        id: 'reply-2',
        author: 'Alice Johnson',
        content: 'Perfect, that aligns with our planning cycle.',
        createdAt: thirtyMinutesAgo
      }]
    })];
    return <AnnotationPanelStory annotations={annotations} selectedElementId="goal-1" />;
  }
}`,...(H=(q=m.parameters)==null?void 0:q.docs)==null?void 0:H.source}}};var J,O,R;p.parameters={...p.parameters,docs:{...(J=p.parameters)==null?void 0:J.docs,source:{originalSource:`{
  render: () => {
    const annotations = [createAnnotationFixture({
      id: 'ann-1',
      elementId: 'goal-1',
      author: 'Alice',
      content: 'Need to add performance metrics.',
      resolved: true
    }), createAnnotationFixture({
      id: 'ann-2',
      elementId: 'goal-1',
      author: 'Bob',
      content: 'SLA defined in appendix C.',
      resolved: true
    }), createAnnotationFixture({
      id: 'ann-3',
      elementId: 'goal-1',
      author: 'Charlie',
      content: 'Still needs cost analysis.',
      resolved: false
    })];
    return <AnnotationPanelStory annotations={annotations} selectedElementId="goal-1" />;
  }
}`,...(R=(O=p.parameters)==null?void 0:O.docs)==null?void 0:R.source}}};var k,G,N;h.parameters={...h.parameters,docs:{...(k=h.parameters)==null?void 0:k.docs,source:{originalSource:`{
  render: () => {
    useEffect(() => {
      useAnnotationStore.setState({
        annotations: [],
        loading: true,
        error: null
      });
      const timer = setTimeout(() => {
        useAnnotationStore.setState({
          loading: false,
          annotations: createAnnotationListFixture(3)
        });
      }, 2000);
      return () => clearTimeout(timer);
    }, []);
    return <AnnotationPanel />;
  }
}`,...(N=(G=h.parameters)==null?void 0:G.docs)==null?void 0:N.source}}};var Q,_,z;g.parameters={...g.parameters,docs:{...(Q=g.parameters)==null?void 0:Q.docs,source:{originalSource:`{
  render: () => {
    useEffect(() => {
      useAnnotationStore.setState({
        annotations: [],
        loading: false,
        error: 'Failed to load annotations. Please refresh the page.'
      });
      return () => {
        useAnnotationStore.setState({
          error: null
        });
      };
    }, []);
    return <AnnotationPanel />;
  }
}`,...(z=(_=g.parameters)==null?void 0:_.docs)==null?void 0:z.source}}};const Le=["Empty","WithAnnotations","WithSelectedElement","ManyAnnotations","WithMentions","WithReplies","ResolvedAnnotations","Loading","Error"];export{s as Empty,g as Error,h as Loading,c as ManyAnnotations,p as ResolvedAnnotations,l as WithAnnotations,u as WithMentions,m as WithReplies,d as WithSelectedElement,Le as __namedExportsOrder,Ce as default};
