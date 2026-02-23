import{r as o,j as e}from"./iframe-DSSgKmXl.js";import{u as d}from"./changesetStore-Czqcwo7a.js";import{E as T}from"./EmptyState-B6ktL3oV.js";import"./LoadingState-DZmQgDQh.js";import"./ErrorState-uaa9-pX2.js";import"./BreadcrumbNav-DXCKxi7g.js";import"./FilterPanel-C0Vy-Tax.js";import"./ExportButtonGroup-C-LUBG8s.js";import"./LayerRightSidebar-BAszuvNY.js";import{B as x}from"./Badge-4uEMzFcW.js";import{C as A}from"./Card-dBO4-pIe.js";import"./preload-helper-Dp1pzeXC.js";import"./react-fqQoFC2C.js";import"./index-NvR17eTZ.js";import"./Button-DjdbHWkm.js";import"./create-theme-BOkxhGns.js";import"./Spinner-Al2eUyHo.js";import"./Alert-B-2krvq0.js";import"./chevron-right-icon-C4Btn_J9.js";import"./x-BvdhAmd6.js";import"./createLucideIcon-CIvKt9yE.js";import"./AccordionTitle-Cun89kOD.js";import"./chevron-down-icon-CIJfcLG8.js";import"./Label-BgBB6PcL.js";import"./BaseInspectorPanel-BBWNLuHC.js";import"./RenderPropErrorBoundary-C5UeOkUJ.js";import"./BaseControlPanel-D-ZWsrS_.js";import"./GraphViewSidebar-BmDrn4TD.js";import"./NavigationErrorNotification-BQSize9i.js";import"./crossLayerStore-Bec5Tsd5.js";const l=({onChangesetSelect:s})=>{const{changesets:a,selectedChangesetId:E}=d(),m=o.useMemo(()=>[...a].sort((t,r)=>new Date(r.created_at).getTime()-new Date(t.created_at).getTime()),[a]),g=m.filter(t=>t.status==="active"),p=m.filter(t=>t.status==="applied"),h=m.filter(t=>t.status==="abandoned"),k=t=>{switch(t){case"feature":return"✨";case"bugfix":return"🐛";case"exploration":return"🔍";default:return"📝"}},I=t=>{const r={active:"success",applied:"info",abandoned:"gray"};return e.jsx(x,{color:r[t]||"gray",children:t})},L=t=>new Date(t).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}),u=t=>e.jsxs(A,{className:`cursor-pointer transition-all ${E===t.id?"ring-2 ring-blue-500":""}`,onClick:()=>s(t.id),children:[e.jsxs("div",{className:"flex items-start justify-between",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("span",{className:"text-xl",children:k(t.type)}),e.jsx("h5",{className:"text-base font-semibold text-gray-900 dark:text-white",children:t.name})]}),I(t.status)]}),e.jsxs("div",{className:"flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400",children:[e.jsx("code",{className:"bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded",children:t.id}),e.jsx("span",{children:"•"}),e.jsx("span",{children:L(t.created_at)})]}),e.jsxs("div",{className:"text-sm text-gray-600 dark:text-gray-400",children:[t.elements_count," changes"]})]},t.id);return a.length===0?e.jsx("div",{className:"h-full overflow-y-auto flex flex-col p-4",children:e.jsx(T,{variant:"changesets"})}):e.jsxs("div",{className:"h-full overflow-y-auto flex flex-col p-4 space-y-4","data-testid":"changeset-list",children:[e.jsxs("div",{className:"flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700",children:[e.jsx("h3",{className:"text-lg font-semibold text-gray-900 dark:text-white",children:"Changesets"}),e.jsxs(x,{color:"gray",children:[a.length," total"]})]}),g.length>0&&e.jsxs("div",{className:"changeset-section",children:[e.jsxs("h4",{className:"text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2",children:["Active (",g.length,")"]}),e.jsx("div",{className:"space-y-2",children:g.map(u)})]}),p.length>0&&e.jsxs("div",{className:"changeset-section",children:[e.jsxs("h4",{className:"text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2",children:["Applied (",p.length,")"]}),e.jsx("div",{className:"space-y-2",children:p.map(u)})]}),h.length>0&&e.jsxs("div",{className:"changeset-section",children:[e.jsxs("h4",{className:"text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2",children:["Abandoned (",h.length,")"]}),e.jsx("div",{className:"space-y-2",children:h.map(u)})]})]})};l.__docgenInfo={description:"",methods:[],displayName:"ChangesetList",props:{onChangesetSelect:{required:!0,tsType:{name:"signature",type:"function",raw:"(changesetId: string) => void",signature:{arguments:[{type:{name:"string"},name:"changesetId"}],return:{name:"void"}}},description:""}}};const de={title:"A Primitives / Data Viewers / ChangesetList"},_=[{id:"cs-1",name:"Add User Authentication",type:"feature",status:"active",created_at:"2024-12-20T10:00:00Z",elements_count:5},{id:"cs-2",name:"Fix Data Validation",type:"bugfix",status:"applied",created_at:"2024-12-19T14:30:00Z",elements_count:3},{id:"cs-3",name:"Explore ML Integration",type:"exploration",status:"active",created_at:"2024-12-18T09:15:00Z",elements_count:8},{id:"cs-4",name:"Old Feature Attempt",type:"feature",status:"abandoned",created_at:"2024-12-10T11:00:00Z",elements_count:2}],n={render:()=>(o.useEffect(()=>{d.setState({changesets:_,selectedChangesetId:null})},[]),e.jsx("div",{className:"w-96 bg-gray-50 p-4",children:e.jsx(l,{onChangesetSelect:s=>console.log("Selected:",s)})}))},c={render:()=>(o.useEffect(()=>{d.setState({changesets:_,selectedChangesetId:"cs-1"})},[]),e.jsx("div",{className:"w-96 bg-gray-50 p-4",children:e.jsx(l,{onChangesetSelect:s=>console.log("Selected:",s)})}))},i={render:()=>(o.useEffect(()=>{d.setState({changesets:[],selectedChangesetId:null})},[]),e.jsx("div",{className:"w-96 bg-gray-50 p-4",children:e.jsx(l,{onChangesetSelect:s=>console.log("Selected:",s)})}))};var f,y,C;n.parameters={...n.parameters,docs:{...(f=n.parameters)==null?void 0:f.docs,source:{originalSource:`{
  render: () => {
    useEffect(() => {
      useChangesetStore.setState({
        changesets: mockChangesets,
        selectedChangesetId: null
      });
    }, []);
    return <div className="w-96 bg-gray-50 p-4">
        <ChangesetList onChangesetSelect={id => console.log('Selected:', id)} />
      </div>;
  }
}`,...(C=(y=n.parameters)==null?void 0:y.docs)==null?void 0:C.source}}};var j,v,b;c.parameters={...c.parameters,docs:{...(j=c.parameters)==null?void 0:j.docs,source:{originalSource:`{
  render: () => {
    useEffect(() => {
      useChangesetStore.setState({
        changesets: mockChangesets,
        selectedChangesetId: 'cs-1'
      });
    }, []);
    return <div className="w-96 bg-gray-50 p-4">
        <ChangesetList onChangesetSelect={id => console.log('Selected:', id)} />
      </div>;
  }
}`,...(b=(v=c.parameters)==null?void 0:v.docs)==null?void 0:b.source}}};var S,N,w;i.parameters={...i.parameters,docs:{...(S=i.parameters)==null?void 0:S.docs,source:{originalSource:`{
  render: () => {
    useEffect(() => {
      useChangesetStore.setState({
        changesets: [],
        selectedChangesetId: null
      });
    }, []);
    return <div className="w-96 bg-gray-50 p-4">
        <ChangesetList onChangesetSelect={id => console.log('Selected:', id)} />
      </div>;
  }
}`,...(w=(N=i.parameters)==null?void 0:N.docs)==null?void 0:w.source}}};const le=["WithMultipleChangesets","WithSelection","EmptyList"];export{i as EmptyList,n as WithMultipleChangesets,c as WithSelection,le as __namedExportsOrder,de as default};
