(function(root){
 'use strict';
 function presentation(zoom){
  const visible=Number.isFinite(zoom)&&zoom>=1&&zoom<=4.5;
  return{visible};
 }
 const WORLD_WIDTH=3072,WORLD_HEIGHT=2048,SPAN=WORLD_WIDTH+768,DEFAULT_SEED=0x52a74f19,CORE_COUNT=84,WISP_COUNT=28;
 function sample(seed,id,pass,lane){
  let n=(seed^Math.imul(id+1,0x9e3779b9)^Math.imul(pass+1,0x85ebca6b)^Math.imul(lane+1,0xc2b2ae35))>>>0;
  n=Math.imul(n^(n>>>16),0x7feb352d);n=Math.imul(n^(n>>>15),0x846ca68b);
  return((n^(n>>>16))>>>0)/4294967296;
 }
 function bankFor(id,pass=0,seed=DEFAULT_SEED){
  const wispy=id>=CORE_COUNT,kind=wispy?'wispy':'cumulus',aspectRatio=wispy?3.2:1.6;
  const width=wispy?400+sample(seed,id,0,0)*240:160+sample(seed,id,0,0)*80,centerY=sample(seed,id,pass,1)*WORLD_HEIGHT;
  const rawEnd=centerY+(sample(seed,id,pass,2)*2-1)*360;
  const endY=rawEnd<0?-rawEnd:rawEnd>WORLD_HEIGHT?WORLD_HEIGHT*2-rawEnd:rawEnd;
  const padding=wispy?896:384,span=WORLD_WIDTH+padding*2,x=sample(seed,id,0,3)*span-padding;
  const speed=wispy?.85+sample(seed,id,0,4)*.65:1.4+sample(seed,id,0,4),duration=span/speed;
  return{id,pass,kind,aspectRatio,padding,span,x,y:centerY-width/aspectRatio/2,centerY,driftY:endY-centerY,width,opacity:wispy?.22+sample(seed,id,0,5)*.1:.52+sample(seed,id,0,5)*.16,rotation:wispy?sample(seed,id,0,6)*14-7:sample(seed,id,0,6)*30-15,duration,delay:-(x+padding)/span*duration};
 }
 function field(seed=DEFAULT_SEED){return Array.from({length:CORE_COUNT+WISP_COUNT},(_,id)=>bankFor(id,0,seed));}
 function position(node,bank){
  node.style.top=`${bank.y}px`;node.style.setProperty('--cloud-drift-y',`${bank.driftY}px`);
  node.dataset.cloudPass=String(bank.pass);
 }
 function mount(sky,seed=DEFAULT_SEED){
  if(!sky||sky.dataset.cloudMounted)return;
  const doc=sky.ownerDocument,fragment=doc.createDocumentFragment();
  for(const bank of field(seed)){
   const node=doc.createElement('div'),shape=doc.createElement('div');node.className=`sky-cloud ${bank.kind}`;shape.className='cloud-shape';
   node.dataset.cloudId=String(bank.id);node.dataset.cloudKind=bank.kind;position(node,bank);node.style.width=`${bank.width}px`;
   node.style.aspectRatio=bank.aspectRatio;node.style.left=`-${bank.padding}px`;node.style.setProperty('--cloud-span',`${bank.span}px`);
   node.style.opacity=bank.opacity;node.style.animationDuration=`${bank.duration}s`;node.style.animationDelay=`${bank.delay}s`;
   let pass=0;
   // Re-seed latitude only at the off-map wrap, never in response to a camera action.
   node.addEventListener('animationiteration',event=>{
    if(event.target!==node||event.animationName!=='world-cloud-drift')return;
    position(node,bankFor(bank.id,++pass,seed));
   });
   if(bank.kind==='wispy')for(const side of ['left','right']){const strand=doc.createElement('i');strand.className=`wisp-strand wisp-${side}`;shape.appendChild(strand);}
   shape.style.transform=`rotate(${bank.rotation}deg)`;node.appendChild(shape);fragment.appendChild(node);
  }
  sky.appendChild(fragment);sky.dataset.cloudMounted='world';sky.dataset.cloudSeed=String(seed>>>0);
 }
 function sync(viewport,zoom){
  if(!viewport)return;
  const sky=presentation(zoom);
  viewport.classList.toggle('clouds-visible',sky.visible);
 }
 const api={presentation,sync,field,bankFor,mount,WORLD_WIDTH,WORLD_HEIGHT,SPAN,CORE_COUNT,WISP_COUNT};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root){
  root.ROTTA_CLOUDS=api;
  const pause=()=>root.document.documentElement.classList.toggle('sky-paused',root.document.hidden);
  root.document.addEventListener('visibilitychange',pause);pause();
  mount(root.document.getElementById('cloudSky'),Math.floor(Math.random()*4294967296));
 }
})(typeof window!=='undefined'?window:null);
