import{r as p,j as t}from"./iframe-DSSgKmXl.js";import{L as b}from"./LayerRightSidebar-BAszuvNY.js";import"./preload-helper-Dp1pzeXC.js";import"./BaseInspectorPanel-BBWNLuHC.js";import"./RenderPropErrorBoundary-C5UeOkUJ.js";import"./Button-DjdbHWkm.js";import"./create-theme-BOkxhGns.js";import"./x-BvdhAmd6.js";import"./createLucideIcon-CIvKt9yE.js";import"./Card-dBO4-pIe.js";import"./Badge-4uEMzFcW.js";import"./BaseControlPanel-D-ZWsrS_.js";import"./Label-BgBB6PcL.js";import"./Spinner-Al2eUyHo.js";import"./GraphViewSidebar-BmDrn4TD.js";import"./AccordionTitle-Cun89kOD.js";import"./chevron-down-icon-CIJfcLG8.js";import"./NavigationErrorNotification-BQSize9i.js";import"./index-NvR17eTZ.js";import"./crossLayerStore-Bec5Tsd5.js";import"./react-fqQoFC2C.js";import"./Alert-B-2krvq0.js";import"./FilterPanel-C0Vy-Tax.js";const $={title:"A Primitives / Panels and Sidebars / LayerRightSidebar",parameters:{layout:"centered"}},q=(e,l,s,n)=>[{id:"elements",title:"Element Types",items:[{value:"goal",label:"Goals",count:{visible:e.has("goal")?5:0,total:5}},{value:"requirement",label:"Requirements",count:{visible:e.has("requirement")?8:0,total:8}},{value:"stakeholder",label:"Stakeholders",count:{visible:e.has("stakeholder")?2:0,total:2}},{value:"driver",label:"Drivers",count:{visible:e.has("driver")?3:0,total:3}}],selectedValues:e,onToggle:l},{id:"relationships",title:"Relationship Types",items:[{value:"influence",label:"Influences",count:{visible:s.has("influence")?10:0,total:10}},{value:"constrains",label:"Constrains",count:{visible:s.has("constrains")?5:0,total:5}},{value:"realizes",label:"Realizes",count:{visible:s.has("realizes")?8:0,total:8}}],selectedValues:s,onToggle:n}],m={render:()=>{const[e,l]=p.useState(new Set(["goal","requirement","stakeholder","driver"])),[s,n]=p.useState(new Set(["influence","constrains","realizes"])),d=(i,o)=>{const a=new Set(e);o?a.add(i):a.delete(i),l(a)},r=(i,o)=>{const a=new Set(s);o?a.add(i):a.delete(i),n(a)};return t.jsx("div",{className:"w-80 h-screen bg-gray-50",children:t.jsx(b,{filterSections:q(e,d,s,r),onClearFilters:()=>{l(new Set(["goal","requirement","stakeholder","driver"])),n(new Set(["influence","constrains","realizes"]))},controlContent:t.jsx("div",{className:"p-4 text-sm text-gray-600",children:"Control panel placeholder"}),annotationContent:t.jsx("div",{className:"p-4 text-sm text-gray-600",children:"Annotations placeholder"}),crossLayerContent:t.jsx("div",{className:"p-3 bg-blue-50 text-xs text-blue-700 border-b",children:"Cross-layer panel"}),testId:"motivation-right-sidebar"})})}},g={render:()=>{const[e,l]=p.useState(new Set(["webApp","api","database"])),[s,n]=p.useState(new Set(["React","Node.js","PostgreSQL"])),d=(o,a)=>{const c=new Set(e);a?c.add(o):c.delete(o),l(c)},r=(o,a)=>{const c=new Set(s);a?c.add(o):c.delete(o),n(c)},i=[{id:"containerTypes",title:"Container Types",items:[{value:"webApp",label:"Web Application",count:{visible:e.has("webApp")?3:0,total:3}},{value:"api",label:"API",count:{visible:e.has("api")?4:0,total:4}},{value:"database",label:"Database",count:{visible:e.has("database")?2:0,total:2}}],selectedValues:e,onToggle:d},{id:"technologies",title:"Technology Stack",items:[{value:"React",label:"React",count:{visible:s.has("React")?3:0,total:3}},{value:"Node.js",label:"Node.js",count:{visible:s.has("Node.js")?4:0,total:4}},{value:"PostgreSQL",label:"PostgreSQL",count:{visible:s.has("PostgreSQL")?2:0,total:2}}],selectedValues:s,onToggle:r}];return t.jsx("div",{className:"w-80 h-screen bg-gray-50",children:t.jsx(b,{filterSections:i,onClearFilters:()=>{l(new Set(["webApp","api","database"])),n(new Set(["React","Node.js","PostgreSQL"]))},controlContent:t.jsx("div",{className:"p-4 text-sm text-gray-600",children:"C4 control panel placeholder"}),crossLayerContent:t.jsx("div",{className:"p-3 bg-blue-50 text-xs text-blue-700 border-b",children:"Cross-layer panel"}),testId:"c4-right-sidebar"})})}},u={render:()=>{const[e,l]=p.useState(new Set(["goal","requirement"])),s=[{id:"elements",title:"Element Types",items:[{value:"goal",label:"Goals",count:{visible:e.has("goal")?5:0,total:5}},{value:"requirement",label:"Requirements",count:{visible:e.has("requirement")?8:0,total:8}}],selectedValues:e,onToggle:(n,d)=>{const r=new Set(e);d?r.add(n):r.delete(n),l(r)}}];return t.jsx("div",{className:"w-80 h-screen bg-gray-50",children:t.jsx(b,{filterSections:s,onClearFilters:()=>l(new Set(["goal","requirement"])),controlContent:t.jsx("div",{className:"p-4 text-sm text-gray-600",children:"Control panel"}),inspectorContent:t.jsxs("div",{className:"p-4 space-y-2",children:[t.jsx("div",{className:"text-sm font-semibold",children:"Improve Customer Satisfaction"}),t.jsx("div",{className:"text-xs text-gray-500",children:"Type: Goal"}),t.jsx("div",{className:"text-xs text-gray-600",children:"Strategic goal to improve NPS score by 20%"})]}),testId:"layer-right-sidebar-with-inspector"})})}},v={render:()=>t.jsx("div",{className:"w-80 h-screen bg-gray-50",children:t.jsx(b,{filterSections:[],onClearFilters:()=>{},controlContent:t.jsx("div",{className:"p-4 text-sm text-gray-600",children:"Control panel placeholder"}),testId:"layer-right-sidebar-empty"})})};var h,S,x;m.parameters={...m.parameters,docs:{...(h=m.parameters)==null?void 0:h.docs,source:{originalSource:`{
  render: () => {
    const [selectedElements, setSelectedElements] = useState(new Set(['goal', 'requirement', 'stakeholder', 'driver']));
    const [selectedRelationships, setSelectedRelationships] = useState(new Set(['influence', 'constrains', 'realizes']));
    const onElementToggle = (v: string, s: boolean) => {
      const next = new Set(selectedElements);
      s ? next.add(v) : next.delete(v);
      setSelectedElements(next);
    };
    const onRelToggle = (v: string, s: boolean) => {
      const next = new Set(selectedRelationships);
      s ? next.add(v) : next.delete(v);
      setSelectedRelationships(next);
    };
    return <div className="w-80 h-screen bg-gray-50">
        <LayerRightSidebar filterSections={makeMotivationSections(selectedElements, onElementToggle, selectedRelationships, onRelToggle)} onClearFilters={() => {
        setSelectedElements(new Set(['goal', 'requirement', 'stakeholder', 'driver']));
        setSelectedRelationships(new Set(['influence', 'constrains', 'realizes']));
      }} controlContent={<div className="p-4 text-sm text-gray-600">Control panel placeholder</div>} annotationContent={<div className="p-4 text-sm text-gray-600">Annotations placeholder</div>} crossLayerContent={<div className="p-3 bg-blue-50 text-xs text-blue-700 border-b">Cross-layer panel</div>} testId="motivation-right-sidebar" />
      </div>;
  }
}`,...(x=(S=m.parameters)==null?void 0:S.docs)==null?void 0:x.source}}};var y,C,T;g.parameters={...g.parameters,docs:{...(y=g.parameters)==null?void 0:y.docs,source:{originalSource:`{
  render: () => {
    const [selectedContainerTypes, setSelectedContainerTypes] = useState(new Set(['webApp', 'api', 'database']));
    const [selectedTechs, setSelectedTechs] = useState(new Set(['React', 'Node.js', 'PostgreSQL']));
    const onContainerToggle = (v: string, s: boolean) => {
      const next = new Set(selectedContainerTypes);
      s ? next.add(v) : next.delete(v);
      setSelectedContainerTypes(next);
    };
    const onTechToggle = (v: string, s: boolean) => {
      const next = new Set(selectedTechs);
      s ? next.add(v) : next.delete(v);
      setSelectedTechs(next);
    };
    const sections: FilterSection<string>[] = [{
      id: 'containerTypes',
      title: 'Container Types',
      items: [{
        value: 'webApp',
        label: 'Web Application',
        count: {
          visible: selectedContainerTypes.has('webApp') ? 3 : 0,
          total: 3
        }
      }, {
        value: 'api',
        label: 'API',
        count: {
          visible: selectedContainerTypes.has('api') ? 4 : 0,
          total: 4
        }
      }, {
        value: 'database',
        label: 'Database',
        count: {
          visible: selectedContainerTypes.has('database') ? 2 : 0,
          total: 2
        }
      }],
      selectedValues: selectedContainerTypes,
      onToggle: onContainerToggle
    }, {
      id: 'technologies',
      title: 'Technology Stack',
      items: [{
        value: 'React',
        label: 'React',
        count: {
          visible: selectedTechs.has('React') ? 3 : 0,
          total: 3
        }
      }, {
        value: 'Node.js',
        label: 'Node.js',
        count: {
          visible: selectedTechs.has('Node.js') ? 4 : 0,
          total: 4
        }
      }, {
        value: 'PostgreSQL',
        label: 'PostgreSQL',
        count: {
          visible: selectedTechs.has('PostgreSQL') ? 2 : 0,
          total: 2
        }
      }],
      selectedValues: selectedTechs,
      onToggle: onTechToggle
    }];
    return <div className="w-80 h-screen bg-gray-50">
        <LayerRightSidebar filterSections={sections} onClearFilters={() => {
        setSelectedContainerTypes(new Set(['webApp', 'api', 'database']));
        setSelectedTechs(new Set(['React', 'Node.js', 'PostgreSQL']));
      }} controlContent={<div className="p-4 text-sm text-gray-600">C4 control panel placeholder</div>} crossLayerContent={<div className="p-3 bg-blue-50 text-xs text-blue-700 border-b">Cross-layer panel</div>} testId="c4-right-sidebar" />
      </div>;
  }
}`,...(T=(C=g.parameters)==null?void 0:C.docs)==null?void 0:T.source}}};var w,N,j;u.parameters={...u.parameters,docs:{...(w=u.parameters)==null?void 0:w.docs,source:{originalSource:`{
  render: () => {
    const [selected, setSelected] = useState(new Set(['goal', 'requirement']));
    const sections: FilterSection<string>[] = [{
      id: 'elements',
      title: 'Element Types',
      items: [{
        value: 'goal',
        label: 'Goals',
        count: {
          visible: selected.has('goal') ? 5 : 0,
          total: 5
        }
      }, {
        value: 'requirement',
        label: 'Requirements',
        count: {
          visible: selected.has('requirement') ? 8 : 0,
          total: 8
        }
      }],
      selectedValues: selected,
      onToggle: (v, s) => {
        const next = new Set(selected);
        s ? next.add(v) : next.delete(v);
        setSelected(next);
      }
    }];
    return <div className="w-80 h-screen bg-gray-50">
        <LayerRightSidebar filterSections={sections} onClearFilters={() => setSelected(new Set(['goal', 'requirement']))} controlContent={<div className="p-4 text-sm text-gray-600">Control panel</div>} inspectorContent={<div className="p-4 space-y-2">
              <div className="text-sm font-semibold">Improve Customer Satisfaction</div>
              <div className="text-xs text-gray-500">Type: Goal</div>
              <div className="text-xs text-gray-600">Strategic goal to improve NPS score by 20%</div>
            </div>} testId="layer-right-sidebar-with-inspector" />
      </div>;
  }
}`,...(j=(N=u.parameters)==null?void 0:N.docs)==null?void 0:j.source}}};var R,L,f;v.parameters={...v.parameters,docs:{...(R=v.parameters)==null?void 0:R.docs,source:{originalSource:`{
  render: () => <div className="w-80 h-screen bg-gray-50">
      <LayerRightSidebar filterSections={[]} onClearFilters={() => {}} controlContent={<div className="p-4 text-sm text-gray-600">Control panel placeholder</div>} testId="layer-right-sidebar-empty" />
    </div>
}`,...(f=(L=v.parameters)==null?void 0:L.docs)==null?void 0:f.source}}};const ee=["MotivationLayer","C4ArchitectureLayer","WithInspector","EmptyGraph"];export{g as C4ArchitectureLayer,v as EmptyGraph,m as MotivationLayer,u as WithInspector,ee as __namedExportsOrder,$ as default};
