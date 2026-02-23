import{r as u,j as s}from"./iframe-DSSgKmXl.js";import{G as M}from"./GraphViewer-BWCkNTd9.js";import{S as y}from"./StoryLoadedWrapper-D92HWVD9.js";import"./preload-helper-Dp1pzeXC.js";import"./index-DzsatpJz.js";import"./index-DVMEuaP3.js";import"./index-B3kNdT8l.js";import"./index-CsUALWJS.js";/* empty css              */import"./layerColors-Dv3sYeJV.js";import"./react-fqQoFC2C.js";import"./index-vkQmDB7O.js";import"./BusinessProcessNode-CEovaBVo.js";import"./BusinessFunctionNode-C-nMuTrs.js";import"./BaseLayerNode-CrjxDnkb.js";import"./RelationshipBadge-BEAv2yu2.js";import"./BusinessServiceNode-DRch8gwd.js";import"./BusinessCapabilityNode-BB0Hhw9z.js";import"./LayerContainerNode-BdSyy50l.js";import"./StakeholderNode-D0JWtkck.js";import"./GoalNode-DI1x_tTR.js";import"./RequirementNode-bkA4lIr6.js";import"./ConstraintNode-BqB5kbEd.js";import"./DriverNode-C3erhlff.js";import"./OutcomeNode-B_fS7xwn.js";import"./PrincipleNode-TyyAOrO3.js";import"./AssumptionNode-DQpbG6Z-.js";import"./ValueStreamNode-BnfekKN_.js";import"./AssessmentNode-DkjSth4j.js";import"./ContainerNode-CHJOD5FR.js";import"./ComponentNode-DvHZgqIt.js";import"./ExternalActorNode-3I-nxaqe.js";import"./JSONSchemaNode-DkRy3iIA.js";import"./BaseFieldListNode-bvohYiE_.js";import"./ElbowEdge-BkIQb77y.js";import"./useNavigate-CEEZa2t9.js";import"./crossLayerStore-Bec5Tsd5.js";import"./MiniMap-CP89tgTE.js";const i=[];for(let t=0;t<256;++t)i.push((t+256).toString(16).slice(1));function F(t,e=0){return(i[t[e+0]]+i[t[e+1]]+i[t[e+2]]+i[t[e+3]]+"-"+i[t[e+4]]+i[t[e+5]]+"-"+i[t[e+6]]+i[t[e+7]]+"-"+i[t[e+8]]+i[t[e+9]]+"-"+i[t[e+10]]+i[t[e+11]]+i[t[e+12]]+i[t[e+13]]+i[t[e+14]]+i[t[e+15]]).toLowerCase()}let w;const P=new Uint8Array(16);function T(){if(!w){if(typeof crypto>"u"||!crypto.getRandomValues)throw new Error("crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported");w=crypto.getRandomValues.bind(crypto)}return w(P)}const H=typeof crypto<"u"&&crypto.randomUUID&&crypto.randomUUID.bind(crypto),j={randomUUID:H};function Q(t,e,r){var a;t=t||{};const n=t.random??((a=t.rng)==null?void 0:a.call(t))??T();if(n.length<16)throw new Error("Random bytes length must be >= 16");return n[6]=n[6]&15|64,n[8]=n[8]&63|128,F(n)}function S(t,e,r){return j.randomUUID&&!t?j.randomUUID():Q(t)}const O={add:{border:"#10b981",background:"#d1fae5",text:"#065f46"},update:{border:"#f59e0b",background:"#fef3c7",text:"#92400e"},delete:{border:"#ef4444",background:"#fee2e2",text:"#991b1b"}};class q{buildChangesetModel(e){console.log("[ChangesetGraphBuilder] Building model from changeset:",e.metadata.id);const r={},n=[],a=e.changes.changes||[];console.log("[ChangesetGraphBuilder] Found",a.length,"changes");const o=this.groupChangesByLayer(a);for(const[c,g]of Object.entries(o)){const m=this.buildLayer(c,g);r[c]=m;const h=this.extractRelationships(m.elements,c);n.push(...h)}const d={loadedAt:new Date().toISOString(),layerCount:Object.keys(r).length,elementCount:a.length,type:"changeset-visualization",changesetId:e.metadata.id,changesetName:e.metadata.name,changesetStatus:e.metadata.status};return console.log("[ChangesetGraphBuilder] Built model:",{layers:d.layerCount,elements:d.elementCount,relationships:n.length}),{version:"0.1.0",layers:r,references:[],metadata:d}}groupChangesByLayer(e){const r={};for(const n of e){const a=this.normalizeLayerName(n.layer);r[a]||(r[a]=[]),r[a].push(n)}return r}normalizeLayerName(e){return e.charAt(0).toUpperCase()+e.slice(1).toLowerCase()}buildLayer(e,r){const n=[];for(const a of r){const o=this.buildElement(a);n.push(o)}return{id:S(),name:e,type:"changeset-layer",elements:n,relationships:[]}}buildElement(e){const r=O[e.operation];let n;return e.operation==="add"?n=e.data||{}:e.operation==="update"?n=e.after||{}:e.operation==="delete"?n=e.before||{}:n={},{id:e.element_id,type:e.element_type||"generic",name:typeof n.name=="string"?n.name:e.element_id,layerId:e.layer,properties:{...n,_changesetOperation:e.operation,_changesetTimestamp:e.timestamp},visual:{position:{x:0,y:0},size:{width:200,height:100},style:{borderColor:r.border,backgroundColor:r.background,textColor:r.text}}}}extractRelationships(e,r){const n=[];for(const a of e){const o=this.findRelationshipsInElement(a,e);n.push(...o)}return n}findRelationshipsInElement(e,r){const n=[],a=new Set(r.map(o=>o.id));return this.searchForReferences(e.properties,(o,d)=>{a.has(o)&&n.push({id:S(),type:"reference",sourceId:e.id,targetId:o,properties:{sourceField:d}})}),n}searchForReferences(e,r,n=""){if(!(!e||typeof e!="object"))for(const[a,o]of Object.entries(e)){const d=n?`${n}.${a}`:a;a.startsWith("_changeset")||(this.isIdProperty(a)&&typeof o=="string"&&r(o,d),typeof o=="string"&&this.looksLikeId(o)&&r(o,d),typeof o=="object"&&o!==null&&(Array.isArray(o)?o.forEach((c,g)=>{typeof c=="string"&&this.looksLikeId(c)?r(c,`${d}[${g}]`):typeof c=="object"&&this.searchForReferences(c,r,`${d}[${g}]`)}):this.searchForReferences(o,r,d)))}}isIdProperty(e){return[/^id$/i,/Id$/,/_id$/i,/^ref$/i,/Ref$/,/_ref$/i,/^target$/i,/^source$/i].some(n=>n.test(e))}looksLikeId(e){return/^[a-z_]+\.[a-z_]+\.[a-z0-9_-]+$/i.test(e)||/^[a-z]+-[a-z]+-[a-z0-9-]+$/i.test(e)}static getOperationColor(e){return O[e]}}const p=({changeset:t})=>{const[e,r]=u.useState(null),[n,a]=u.useState(!1),[o,d]=u.useState(""),c=u.useMemo(()=>new q,[]);return u.useEffect(()=>{(()=>{var m;try{if(a(!0),d(""),!t){r(null);return}if(console.log("[ChangesetGraphView] Converting changeset to MetaModel..."),!t.changes||!t.changes.changes||t.changes.changes.length===0)throw new Error("No changes in changeset");const h=c.buildChangesetModel(t);console.log("[ChangesetGraphView] Conversion complete:",{layers:Object.keys(h.layers).length,elements:((m=h.metadata)==null?void 0:m.elementCount)||0}),r(h)}catch(h){const z=h instanceof Error?h.message:"Failed to convert changeset to model";console.error("[ChangesetGraphView] Error converting changeset:",h),d(z)}finally{a(!1)}})()},[t,c]),n?s.jsx("div",{className:"relative w-full h-full",children:s.jsx("div",{className:"message-overlay",children:s.jsxs("div",{className:"message-box",children:[s.jsx("div",{className:"spinner"}),s.jsx("p",{children:"Converting changeset to graph..."})]})})}):o?s.jsx("div",{className:"relative w-full h-full",children:s.jsx("div",{className:"message-overlay",children:s.jsxs("div",{className:"message-box error",children:[s.jsx("h3",{children:"Error"}),s.jsx("p",{children:o})]})})}):t?e?s.jsxs("div",{className:"relative w-full h-full",children:[s.jsxs("div",{className:"absolute top-4 right-4 bg-white/95 dark:bg-gray-800/95 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg z-10 flex items-center gap-4 text-sm",children:[s.jsx("div",{className:"font-semibold text-gray-700 dark:text-gray-300 mr-1",children:"Operations:"}),s.jsxs("div",{className:"flex items-center gap-2",children:[s.jsx("span",{className:"w-4 h-4 rounded border-2 bg-green-100 border-green-500"}),s.jsx("span",{className:"text-gray-600 dark:text-gray-400 font-medium",children:"Added"})]}),s.jsxs("div",{className:"flex items-center gap-2",children:[s.jsx("span",{className:"w-4 h-4 rounded border-2 bg-amber-100 border-amber-500"}),s.jsx("span",{className:"text-gray-600 dark:text-gray-400 font-medium",children:"Updated"})]}),s.jsxs("div",{className:"flex items-center gap-2",children:[s.jsx("span",{className:"w-4 h-4 rounded border-2 bg-red-100 border-red-500"}),s.jsx("span",{className:"text-gray-600 dark:text-gray-400 font-medium",children:"Deleted"})]})]}),s.jsx(M,{model:e})]}):s.jsx("div",{className:"relative w-full h-full",children:s.jsx("div",{className:"message-overlay",children:s.jsx("div",{className:"message-box",children:s.jsx("p",{children:"No changes to display"})})})}):s.jsx("div",{className:"relative w-full h-full",children:s.jsx("div",{className:"message-overlay",children:s.jsx("div",{className:"message-box",children:s.jsx("p",{children:"Select a changeset to view its graph"})})})})};p.__docgenInfo={description:"",methods:[],displayName:"ChangesetGraphView"};const De={title:"C Graphs / Views / ChangesetGraphView",parameters:{layout:"fullscreen"}},l={metadata:{id:"changeset-1",name:"Q1 Architecture Update",description:"Updates to business and application layers",type:"feature",status:"active",created_at:new Date().toISOString(),updated_at:new Date().toISOString(),workflow:"standard",summary:{elements_added:1,elements_updated:1,elements_deleted:1}},changes:{version:"1.0",changes:[{timestamp:new Date().toISOString(),operation:"add",element_id:"new-service-1",element_type:"BusinessService",layer:"business",data:{name:"New Order Service"}},{timestamp:new Date().toISOString(),operation:"update",element_id:"service-1",element_type:"BusinessService",layer:"business",before:{},after:{description:"Updated description"}},{timestamp:new Date().toISOString(),operation:"delete",element_id:"old-process-1",element_type:"Process",layer:"business",before:{}}]}},f={render:()=>s.jsx(y,{testId:"changeset-graph-active",children:s.jsx("div",{style:{width:"100%",height:"100vh"},children:s.jsx(p,{changeset:l})})})},C={render:()=>{const t={...l,changes:{...l.changes,changes:l.changes.changes.filter(e=>e.operation==="add")}};return s.jsx(y,{testId:"changeset-graph-add",children:s.jsx("div",{style:{width:"100%",height:"100vh"},children:s.jsx(p,{changeset:t})})})}},v={render:()=>{const t={...l,changes:{...l.changes,changes:l.changes.changes.filter(e=>e.operation==="update")}};return s.jsx(y,{testId:"changeset-graph-update",children:s.jsx("div",{style:{width:"100%",height:"100vh"},children:s.jsx(p,{changeset:t})})})}},x={render:()=>{const t={...l,changes:{...l.changes,changes:l.changes.changes.filter(e=>e.operation==="delete")}};return s.jsx(y,{testId:"changeset-graph-delete",children:s.jsx("div",{style:{width:"100%",height:"100vh"},children:s.jsx(p,{changeset:t})})})}},b={render:()=>{const t={...l,changes:{version:"1.0",changes:Array.from({length:20},(e,r)=>{const n=["add","update","delete"][r%3],a={timestamp:new Date().toISOString(),operation:n,element_id:`element-${r}`,element_type:"BusinessService",layer:"business"};return n==="add"?{...a,data:{name:`Element ${r}`}}:n==="update"?{...a,before:{},after:{name:`Element ${r}`}}:{...a,before:{name:`Element ${r}`}}})}};return s.jsx(y,{testId:"changeset-graph-many",children:s.jsx("div",{style:{width:"100%",height:"100vh"},children:s.jsx(p,{changeset:t})})})}};var I,N,_;f.parameters={...f.parameters,docs:{...(I=f.parameters)==null?void 0:I.docs,source:{originalSource:`{
  render: () => <StoryLoadedWrapper testId="changeset-graph-active">
      <div style={{
      width: '100%',
      height: '100vh'
    }}>
        <ChangesetGraphView changeset={mockChangeset} />
      </div>
    </StoryLoadedWrapper>
}`,...(_=(N=f.parameters)==null?void 0:N.docs)==null?void 0:_.source}}};var k,L,$;C.parameters={...C.parameters,docs:{...(k=C.parameters)==null?void 0:k.docs,source:{originalSource:`{
  render: () => {
    const addOnlyChangeset: ChangesetDetails = {
      ...mockChangeset,
      changes: {
        ...mockChangeset.changes,
        changes: mockChangeset.changes.changes.filter((c: typeof mockChangeset.changes.changes[0]) => c.operation === 'add')
      }
    };
    return <StoryLoadedWrapper testId="changeset-graph-add">
        <div style={{
        width: '100%',
        height: '100vh'
      }}>
          <ChangesetGraphView changeset={addOnlyChangeset} />
        </div>
      </StoryLoadedWrapper>;
  }
}`,...($=(L=C.parameters)==null?void 0:L.docs)==null?void 0:$.source}}};var E,D,R;v.parameters={...v.parameters,docs:{...(E=v.parameters)==null?void 0:E.docs,source:{originalSource:`{
  render: () => {
    const updateOnlyChangeset: ChangesetDetails = {
      ...mockChangeset,
      changes: {
        ...mockChangeset.changes,
        changes: mockChangeset.changes.changes.filter((c: typeof mockChangeset.changes.changes[0]) => c.operation === 'update')
      }
    };
    return <StoryLoadedWrapper testId="changeset-graph-update">
        <div style={{
        width: '100%',
        height: '100vh'
      }}>
          <ChangesetGraphView changeset={updateOnlyChangeset} />
        </div>
      </StoryLoadedWrapper>;
  }
}`,...(R=(D=v.parameters)==null?void 0:D.docs)==null?void 0:R.source}}};var G,U,V;x.parameters={...x.parameters,docs:{...(G=x.parameters)==null?void 0:G.docs,source:{originalSource:`{
  render: () => {
    const deleteOnlyChangeset: ChangesetDetails = {
      ...mockChangeset,
      changes: {
        ...mockChangeset.changes,
        changes: mockChangeset.changes.changes.filter((c: typeof mockChangeset.changes.changes[0]) => c.operation === 'delete')
      }
    };
    return <StoryLoadedWrapper testId="changeset-graph-delete">
        <div style={{
        width: '100%',
        height: '100vh'
      }}>
          <ChangesetGraphView changeset={deleteOnlyChangeset} />
        </div>
      </StoryLoadedWrapper>;
  }
}`,...(V=(U=x.parameters)==null?void 0:U.docs)==null?void 0:V.source}}};var A,B,W;b.parameters={...b.parameters,docs:{...(A=b.parameters)==null?void 0:A.docs,source:{originalSource:`{
  render: () => {
    const manyChangesChangeset: ChangesetDetails = {
      ...mockChangeset,
      changes: {
        version: '1.0',
        changes: Array.from({
          length: 20
        }, (_, i): ChangesetChange => {
          const operation = ['add', 'update', 'delete'][i % 3] as 'add' | 'update' | 'delete';
          const base = {
            timestamp: new Date().toISOString(),
            operation,
            element_id: \`element-\${i}\`,
            element_type: 'BusinessService',
            layer: 'business'
          };
          if (operation === 'add') {
            return {
              ...base,
              data: {
                name: \`Element \${i}\`
              }
            } as ChangesetChange;
          } else if (operation === 'update') {
            return {
              ...base,
              before: {},
              after: {
                name: \`Element \${i}\`
              }
            } as ChangesetChange;
          } else {
            return {
              ...base,
              before: {
                name: \`Element \${i}\`
              }
            } as ChangesetChange;
          }
        })
      }
    };
    return <StoryLoadedWrapper testId="changeset-graph-many">
        <div style={{
        width: '100%',
        height: '100vh'
      }}>
          <ChangesetGraphView changeset={manyChangesChangeset} />
        </div>
      </StoryLoadedWrapper>;
  }
}`,...(W=(B=b.parameters)==null?void 0:B.docs)==null?void 0:W.source}}};const Re=["ActiveChangeset","AddOperationsOnly","UpdateOperationsOnly","DeleteOperationsOnly","ManyChanges"];export{f as ActiveChangeset,C as AddOperationsOnly,x as DeleteOperationsOnly,b as ManyChanges,v as UpdateOperationsOnly,Re as __namedExportsOrder,De as default};
