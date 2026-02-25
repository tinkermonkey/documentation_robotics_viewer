import{j as r}from"./iframe-DSSgKmXl.js";function s(d,n,t){try{return d(n)}catch(e){const o=e instanceof Error?e.message:String(e);return console.error(`[RenderPropError] ${t}: ${o}`),r.jsxs("div",{className:"p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm","data-testid":`render-prop-error-${t}`,role:"alert",children:[r.jsxs("p",{className:"font-semibold text-red-800 dark:text-red-200",children:["Error in ",t]}),r.jsx("p",{className:"text-red-700 dark:text-red-300 text-xs mt-1",children:o}),r.jsx("p",{className:"text-red-600 dark:text-red-400 text-xs mt-1",children:"Check browser console for details"})]})}}function p(d,n,t,e){try{return d(n,t)}catch(o){const a=o instanceof Error?o.message:String(o);return console.error(`[RenderPropError] ${e}: ${a}`),r.jsxs("div",{className:"p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm","data-testid":`render-prop-error-${e}`,role:"alert",children:[r.jsxs("p",{className:"font-semibold text-red-800 dark:text-red-200",children:["Error in ",e]}),r.jsx("p",{className:"text-red-700 dark:text-red-300 text-xs mt-1",children:a}),r.jsx("p",{className:"text-red-600 dark:text-red-400 text-xs mt-1",children:"Check browser console for details"})]})}}function i(d,n){if(!d)return null;try{return d()}catch(t){const e=t instanceof Error?t.message:String(t);return console.error(`[RenderPropError] ${n}: ${e}`),r.jsxs("div",{className:"p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm","data-testid":`render-prop-error-${n}`,role:"alert",children:[r.jsxs("p",{className:"font-semibold text-red-800 dark:text-red-200",children:["Error in ",n]}),r.jsx("p",{className:"text-red-700 dark:text-red-300 text-xs mt-1",children:e}),r.jsx("p",{className:"text-red-600 dark:text-red-400 text-xs mt-1",children:"Check browser console for details"})]})}}s.__docgenInfo={description:`Wraps a render prop function with error handling

@param renderProp - The render prop function to call
@param argument - The argument to pass to the render prop
@param renderPropName - Descriptive name for logging (e.g., 'renderElementDetails')
@returns ReactNode from render prop or error UI on failure

@example
{wrapRenderProp(renderElementDetails, selectedNode, 'renderElementDetails')}`,methods:[],displayName:"wrapRenderProp"};p.__docgenInfo={description:`Wraps a render prop function that takes two arguments with error handling

@param renderProp - The render prop function to call
@param arg1 - First argument to pass to the render prop
@param arg2 - Second argument to pass to the render prop
@param renderPropName - Descriptive name for logging
@returns ReactNode from render prop or error UI on failure

@example
{wrapRenderProp2(renderCrossLayerLinks, selectedNode, graph, 'renderCrossLayerLinks')}`,methods:[],displayName:"wrapRenderProp2"};i.__docgenInfo={description:`Wraps a render prop function (that returns void/undefined) with error handling
Useful for render slots that might be undefined

@param renderProp - The render prop function to call (or undefined)
@param renderPropName - Descriptive name for logging
@returns ReactNode from render prop or error UI on failure

@example
{renderBeforeLayout && wrapRenderPropVoid(renderBeforeLayout, 'renderBeforeLayout')}`,methods:[],displayName:"wrapRenderPropVoid"};export{p as a,i as b,s as w};
