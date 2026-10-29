(function(){
 'use strict';
 const VERSION='1',assets=[
  {key:'atlas',variable:'--harbor-atlas',path:'assets/harbor-atlas.jpg'},
  {key:'south-atlantic',variable:'--harbor-south-atlantic',path:'assets/harbor-south-atlantic.png'},
  {key:'south-pacific',variable:'--harbor-south-pacific',path:'assets/harbor-south-pacific.png'},
  ...['portugal','spain','england','france','ottoman'].map(style=>({key:`mansion-${style}`,variable:`--mansion-${style}`,path:`assets/mansions/${style}.png`})),
  ...window.ROTTA_MANSIONS.assets,
  ...(window.ROTTA_FACILITY_SCENES?.assets||[]),
  ...(window.ROTTA_ROYAL_DIALOGUE?.assets||[]),
  ...window.ROTTA_HARBORS.assets
 ];
 const decoded=new Map(),stats={total:assets.length,loaded:0,cached:0,downloaded:0,ready:false};
 let pending=null;
 async function decode(response){
  if(!response?.ok)throw new Error('Invalid harbor image response');
  const url=URL.createObjectURL(await response.blob()),image=new Image();image.decoding='async';
  try{
   if(image.decode){image.src=url;await image.decode()}
   else await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject;image.src=url});
   if(!image.naturalWidth||!image.naturalHeight)throw new Error('Invalid harbor image');
   return{url,image}; // Retain decoded pixels and use this same URL in the CSS background.
  }catch(error){URL.revokeObjectURL(url);throw error}
 }
 async function load(asset,cache){
  if(decoded.has(asset.key))return;
  const url=`${asset.path}?v=${VERSION}`;let stored;
  try{stored=await cache?.match(url)}catch(_){}
  if(stored){
   try{decoded.set(asset.key,await decode(stored));stats.cached++;return}
   catch(_){try{await cache.delete(url)}catch(_){}}
  }
  let error;
  for(let attempt=0;attempt<2;attempt++){
   try{
    const response=await fetch(url,{cache:attempt?'reload':'force-cache',signal:window.AbortSignal?.timeout?.(30000)}),retained=response.clone();
    decoded.set(asset.key,await decode(response));stats.downloaded++;
    try{await cache?.put(url,retained)}catch(_){} // Full/quota-disabled storage still has a decoded memory copy.
    return;
   }catch(failure){error=failure}
  }
  throw error;
 }
 function preload(onProgress=()=>{}){
  if(pending)return pending;
  pending=(async()=>{
   let cache=null;try{cache=await window.caches?.open(`rotta-harbors-${VERSION}`)}catch(_){}
   const errors=[],report=()=>{stats.loaded=decoded.size;onProgress(stats.loaded,stats.total)};
   report();
   let next=0;
   await Promise.all(Array.from({length:Math.min(3,assets.length)},async()=>{while(next<assets.length){const asset=assets[next++];try{await load(asset,cache)}catch(error){errors.push(error)}report()}}));
   stats.ready=decoded.size===assets.length;
   if(!stats.ready)throw errors[0]||new Error('Harbor images incomplete');
   for(const asset of assets)document.documentElement.style.setProperty(asset.variable,`url("${decoded.get(asset.key).url}")`);
   return stats;
  })().finally(()=>{pending=null});
  return pending;
 }
 window.ROTTA_HARBOR_CACHE={stats,preload,assets:assets.map(asset=>({...asset})),source:key=>decoded.get(key)?.url};
})();
