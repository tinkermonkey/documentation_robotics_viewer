import{j as e,r as b}from"./iframe-DSSgKmXl.js";import{F as r}from"./FilterPanel-C0Vy-Tax.js";import"./preload-helper-Dp1pzeXC.js";import"./Button-DjdbHWkm.js";import"./create-theme-BOkxhGns.js";import"./x-BvdhAmd6.js";import"./createLucideIcon-CIvKt9yE.js";import"./AccordionTitle-Cun89kOD.js";import"./chevron-down-icon-CIJfcLG8.js";import"./Label-BgBB6PcL.js";const O={title:"A Primitives / State Panels / FilterPanel",parameters:{layout:"centered"}},L=()=>({id:"layers",title:"A Primitives / State Panels / FilterPanel",items:[{value:"motivation",label:"Motivation",count:{visible:15,total:15}},{value:"business",label:"Business",count:{visible:8,total:12}},{value:"technology",label:"Technology",count:{visible:20,total:25}},{value:"c4",label:"C4 Architecture",count:{visible:5,total:10}}],selectedValues:new Set(["motivation","business","technology"]),onToggle:(l,s)=>console.log(`Toggle ${l}: ${s}`)}),E=()=>({id:"elementTypes",title:"A Primitives / State Panels / FilterPanel",items:[{value:"goal",label:"Goals",count:{visible:5,total:5}},{value:"requirement",label:"Requirements",count:{visible:8,total:8}},{value:"constraint",label:"Constraints",count:{visible:0,total:3}},{value:"principle",label:"Principles",count:{visible:2,total:2}}],selectedValues:new Set(["goal","requirement"]),onToggle:(l,s)=>console.log(`Toggle ${l}: ${s}`)}),o={render:()=>e.jsx("div",{className:"w-80 bg-white border border-gray-200 p-4 rounded",children:e.jsx(r,{sections:[{id:"layers",title:"A Primitives / State Panels / FilterPanel",items:[],selectedValues:new Set,onToggle:()=>{}}]})})},i={render:()=>e.jsx("div",{className:"w-80 bg-white border border-gray-200 p-4 rounded",children:e.jsx(r,{sections:[L(),E()],onClearAll:()=>console.log("Clear all clicked")})})},n={render:()=>{const[l,s]=b.useState(new Set(["motivation","business","technology"])),[m,v]=b.useState(new Set(["goal","requirement"]));return e.jsx("div",{className:"w-80 bg-white border border-gray-200 p-4 rounded",children:e.jsx(r,{sections:[{id:"layers",title:"A Primitives / State Panels / FilterPanel",items:[{value:"motivation",label:"Motivation",count:{visible:15,total:15}},{value:"business",label:"Business",count:{visible:8,total:12}},{value:"technology",label:"Technology",count:{visible:20,total:25}},{value:"c4",label:"C4 Architecture",count:{visible:5,total:10}}],selectedValues:l,onToggle:(a,u)=>{const t=new Set(l);u?t.add(a):t.delete(a),s(t)}},{id:"elementTypes",title:"A Primitives / State Panels / FilterPanel",items:[{value:"goal",label:"Goals",count:{visible:5,total:5}},{value:"requirement",label:"Requirements",count:{visible:8,total:8}},{value:"constraint",label:"Constraints",count:{visible:0,total:3}},{value:"principle",label:"Principles",count:{visible:2,total:2}}],selectedValues:m,onToggle:(a,u)=>{const t=new Set(m);u?t.add(a):t.delete(a),v(t)}}],onClearAll:()=>{s(new Set),v(new Set)}})})}},c={render:()=>e.jsx("div",{className:"dark w-80 bg-gray-900 border border-gray-700 p-4 rounded",children:e.jsx(r,{sections:[L(),E()],onClearAll:()=>console.log("Clear all clicked")})}),parameters:{backgrounds:{default:"dark"}}},d={render:()=>e.jsx("div",{className:"dark w-80 bg-gray-900 border border-gray-700 p-4 rounded",children:e.jsx(r,{sections:[{id:"layers",title:"A Primitives / State Panels / FilterPanel",items:[],selectedValues:new Set,onToggle:()=>{}}]})}),parameters:{backgrounds:{default:"dark"}}};var g,p,S;o.parameters={...o.parameters,docs:{...(g=o.parameters)==null?void 0:g.docs,source:{originalSource:`{
  render: () => <div className="w-80 bg-white border border-gray-200 p-4 rounded">
    <FilterPanel sections={[{
      id: 'layers',
      title: 'A Primitives / State Panels / FilterPanel',
      items: [],
      selectedValues: new Set<string>(),
      onToggle: () => {}
    }]} />
  </div>
}`,...(S=(p=o.parameters)==null?void 0:p.docs)==null?void 0:S.source}}};var y,w,P;i.parameters={...i.parameters,docs:{...(y=i.parameters)==null?void 0:y.docs,source:{originalSource:`{
  render: () => <div className="w-80 bg-white border border-gray-200 p-4 rounded">
    <FilterPanel sections={[createLayerSection(), createElementTypeSection()]} onClearAll={() => console.log('Clear all clicked')} />
  </div>
}`,...(P=(w=i.parameters)==null?void 0:w.docs)==null?void 0:P.source}}};var T,h,A;n.parameters={...n.parameters,docs:{...(T=n.parameters)==null?void 0:T.docs,source:{originalSource:`{
  render: () => {
    const [selectedLayers, setSelectedLayers] = useState(new Set(['motivation', 'business', 'technology']));
    const [selectedTypes, setSelectedTypes] = useState(new Set(['goal', 'requirement']));
    return <div className="w-80 bg-white border border-gray-200 p-4 rounded">
      <FilterPanel sections={[{
        id: 'layers',
        title: 'A Primitives / State Panels / FilterPanel',
        items: [{
          value: 'motivation',
          label: 'Motivation',
          count: {
            visible: 15,
            total: 15
          }
        }, {
          value: 'business',
          label: 'Business',
          count: {
            visible: 8,
            total: 12
          }
        }, {
          value: 'technology',
          label: 'Technology',
          count: {
            visible: 20,
            total: 25
          }
        }, {
          value: 'c4',
          label: 'C4 Architecture',
          count: {
            visible: 5,
            total: 10
          }
        }],
        selectedValues: selectedLayers,
        onToggle: (value, selected) => {
          const newSelected = new Set(selectedLayers);
          if (selected) newSelected.add(value);else newSelected.delete(value);
          setSelectedLayers(newSelected);
        }
      }, {
        id: 'elementTypes',
        title: 'A Primitives / State Panels / FilterPanel',
        items: [{
          value: 'goal',
          label: 'Goals',
          count: {
            visible: 5,
            total: 5
          }
        }, {
          value: 'requirement',
          label: 'Requirements',
          count: {
            visible: 8,
            total: 8
          }
        }, {
          value: 'constraint',
          label: 'Constraints',
          count: {
            visible: 0,
            total: 3
          }
        }, {
          value: 'principle',
          label: 'Principles',
          count: {
            visible: 2,
            total: 2
          }
        }],
        selectedValues: selectedTypes,
        onToggle: (value, selected) => {
          const newSelected = new Set(selectedTypes);
          if (selected) newSelected.add(value);else newSelected.delete(value);
          setSelectedTypes(newSelected);
        }
      }]} onClearAll={() => {
        setSelectedLayers(new Set());
        setSelectedTypes(new Set());
      }} />
    </div>;
  }
}`,...(A=(h=n.parameters)==null?void 0:h.docs)==null?void 0:A.source}}};var F,k,C;c.parameters={...c.parameters,docs:{...(F=c.parameters)==null?void 0:F.docs,source:{originalSource:`{
  render: () => <div className="dark w-80 bg-gray-900 border border-gray-700 p-4 rounded">
      <FilterPanel sections={[createLayerSection(), createElementTypeSection()]} onClearAll={() => console.log('Clear all clicked')} />
    </div>,
  parameters: {
    backgrounds: {
      default: 'dark'
    }
  }
}`,...(C=(k=c.parameters)==null?void 0:k.docs)==null?void 0:C.source}}};var x,j,f;d.parameters={...d.parameters,docs:{...(x=d.parameters)==null?void 0:x.docs,source:{originalSource:`{
  render: () => <div className="dark w-80 bg-gray-900 border border-gray-700 p-4 rounded">
      <FilterPanel sections={[{
      id: 'layers',
      title: 'A Primitives / State Panels / FilterPanel',
      items: [],
      selectedValues: new Set<string>(),
      onToggle: () => {}
    }]} />
    </div>,
  parameters: {
    backgrounds: {
      default: 'dark'
    }
  }
}`,...(f=(j=d.parameters)==null?void 0:j.docs)==null?void 0:f.source}}};const z=["EmptyFilters","ActiveFilters","MultipleCategories","DarkMode","DarkModeEmpty"];export{i as ActiveFilters,c as DarkMode,d as DarkModeEmpty,o as EmptyFilters,n as MultipleCategories,z as __namedExportsOrder,O as default};
