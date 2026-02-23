import{j as e}from"./iframe-DSSgKmXl.js";import{G as t}from"./GraphViewer-BWCkNTd9.js";import{R as o}from"./index-DzsatpJz.js";import{c as i}from"./modelFixtures-nuBusyic.js";import{S as d}from"./StoryLoadedWrapper-D92HWVD9.js";import"./preload-helper-Dp1pzeXC.js";/* empty css              */import"./layerColors-Dv3sYeJV.js";import"./react-fqQoFC2C.js";import"./index-vkQmDB7O.js";import"./BusinessProcessNode-CEovaBVo.js";import"./BusinessFunctionNode-C-nMuTrs.js";import"./BaseLayerNode-CrjxDnkb.js";import"./RelationshipBadge-BEAv2yu2.js";import"./BusinessServiceNode-DRch8gwd.js";import"./BusinessCapabilityNode-BB0Hhw9z.js";import"./LayerContainerNode-BdSyy50l.js";import"./StakeholderNode-D0JWtkck.js";import"./GoalNode-DI1x_tTR.js";import"./RequirementNode-bkA4lIr6.js";import"./ConstraintNode-BqB5kbEd.js";import"./DriverNode-C3erhlff.js";import"./OutcomeNode-B_fS7xwn.js";import"./PrincipleNode-TyyAOrO3.js";import"./AssumptionNode-DQpbG6Z-.js";import"./ValueStreamNode-BnfekKN_.js";import"./AssessmentNode-DkjSth4j.js";import"./ContainerNode-CHJOD5FR.js";import"./ComponentNode-DvHZgqIt.js";import"./ExternalActorNode-3I-nxaqe.js";import"./JSONSchemaNode-DkRy3iIA.js";import"./BaseFieldListNode-bvohYiE_.js";import"./index-B3kNdT8l.js";import"./index-CsUALWJS.js";import"./ElbowEdge-BkIQb77y.js";import"./useNavigate-CEEZa2t9.js";import"./crossLayerStore-Bec5Tsd5.js";import"./MiniMap-CP89tgTE.js";import"./index-DVMEuaP3.js";const me={title:"C Graphs / Views / GraphViewer",parameters:{layout:"fullscreen"}},a={render:()=>{const r=i();return e.jsx(o,{children:e.jsx(d,{testId:"graph-viewer-complete",children:e.jsx("div",{style:{width:"100%",height:"100vh"},children:e.jsx(t,{model:r})})})})}},s={render:()=>{const r=i();return e.jsx(o,{children:e.jsx(d,{testId:"graph-viewer-motivation",children:e.jsx("div",{style:{width:"100%",height:"100vh"},children:e.jsx(t,{model:r,selectedLayerId:"motivation"})})})})}},p={render:()=>{const r=i();return e.jsx(o,{children:e.jsx(d,{testId:"graph-viewer-business",children:e.jsx("div",{style:{width:"100%",height:"100vh"},children:e.jsx(t,{model:r,selectedLayerId:"business"})})})})}},l={render:()=>{const r=i();return e.jsx(o,{children:e.jsx(d,{testId:"graph-viewer-application",children:e.jsx("div",{style:{width:"100%",height:"100vh"},children:e.jsx(t,{model:r,selectedLayerId:"application"})})})})}},c={render:()=>{const r=i();return e.jsx(o,{children:e.jsx(d,{testId:"graph-viewer-technology",children:e.jsx("div",{style:{width:"100%",height:"100vh"},children:e.jsx(t,{model:r,selectedLayerId:"technology"})})})})}};var m,n,h;a.parameters={...a.parameters,docs:{...(m=a.parameters)==null?void 0:m.docs,source:{originalSource:`{
  render: () => {
    const model = createCompleteModelFixture();
    return <ReactFlowProvider>
        <StoryLoadedWrapper testId="graph-viewer-complete">
          <div style={{
          width: '100%',
          height: '100vh'
        }}>
            <GraphViewer model={model} />
          </div>
        </StoryLoadedWrapper>
      </ReactFlowProvider>;
  }
}`,...(h=(n=a.parameters)==null?void 0:n.docs)==null?void 0:h.source}}};var v,y,u;s.parameters={...s.parameters,docs:{...(v=s.parameters)==null?void 0:v.docs,source:{originalSource:`{
  render: () => {
    const model = createCompleteModelFixture();
    return <ReactFlowProvider>
        <StoryLoadedWrapper testId="graph-viewer-motivation">
          <div style={{
          width: '100%',
          height: '100vh'
        }}>
            <GraphViewer model={model} selectedLayerId="motivation" />
          </div>
        </StoryLoadedWrapper>
      </ReactFlowProvider>;
  }
}`,...(u=(y=s.parameters)==null?void 0:y.docs)==null?void 0:u.source}}};var w,g,x;p.parameters={...p.parameters,docs:{...(w=p.parameters)==null?void 0:w.docs,source:{originalSource:`{
  render: () => {
    const model = createCompleteModelFixture();
    return <ReactFlowProvider>
        <StoryLoadedWrapper testId="graph-viewer-business">
          <div style={{
          width: '100%',
          height: '100vh'
        }}>
            <GraphViewer model={model} selectedLayerId="business" />
          </div>
        </StoryLoadedWrapper>
      </ReactFlowProvider>;
  }
}`,...(x=(g=p.parameters)==null?void 0:g.docs)==null?void 0:x.source}}};var L,j,I;l.parameters={...l.parameters,docs:{...(L=l.parameters)==null?void 0:L.docs,source:{originalSource:`{
  render: () => {
    const model = createCompleteModelFixture();
    return <ReactFlowProvider>
        <StoryLoadedWrapper testId="graph-viewer-application">
          <div style={{
          width: '100%',
          height: '100vh'
        }}>
            <GraphViewer model={model} selectedLayerId="application" />
          </div>
        </StoryLoadedWrapper>
      </ReactFlowProvider>;
  }
}`,...(I=(j=l.parameters)==null?void 0:j.docs)==null?void 0:I.source}}};var F,S,R;c.parameters={...c.parameters,docs:{...(F=c.parameters)==null?void 0:F.docs,source:{originalSource:`{
  render: () => {
    const model = createCompleteModelFixture();
    return <ReactFlowProvider>
        <StoryLoadedWrapper testId="graph-viewer-technology">
          <div style={{
          width: '100%',
          height: '100vh'
        }}>
            <GraphViewer model={model} selectedLayerId="technology" />
          </div>
        </StoryLoadedWrapper>
      </ReactFlowProvider>;
  }
}`,...(R=(S=c.parameters)==null?void 0:S.docs)==null?void 0:R.source}}};const ne=["CompleteModel","MotivationLayer","BusinessLayer","ApplicationLayer","TechnologyLayer"];export{l as ApplicationLayer,p as BusinessLayer,a as CompleteModel,s as MotivationLayer,c as TechnologyLayer,ne as __namedExportsOrder,me as default};
