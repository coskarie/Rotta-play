/* Chart knowledge is separate from first-entry rewards. No animation loop or route search. */
(() => {
 'use strict';
 const RANGE_NM=6,ART='assets/port-markers/unknown-v1.webp?v=1';
 let preloadTask;
 const finishes=new WeakMap();
 function known(state,id){return !!(state.chartedPorts?.[id]||state.fleet?.visited?.[id]);}
 function mark(state,id){const fresh=!known(state,id);(state.chartedPorts??={})[id]=true;return fresh;}
 function radius(port,world){
  const latitude=Number.isFinite(port.lat)?port.lat:40;
  const metresPerUnit=40075016.686*Math.cos(latitude*Math.PI/180)*(world.bounds.east-world.bounds.west)/(360*world.width);
  return RANGE_NM*1852/metresPerUnit;
 }
 function createScanner(){
  let lastState,lastPorts,lastX,lastY,lastNation;
  return {
   scan(state,ports,world,lineClear,{force=false}={}){
    if(!state.nation||![state.shipX,state.shipY].every(Number.isFinite))return [];
    if(!force&&lastState===state&&lastPorts===ports&&lastNation===state.nation&&lastX===state.shipX&&lastY===state.shipY)return [];
    lastState=state;lastPorts=ports;lastNation=state.nation;lastX=state.shipX;lastY=state.shipY;
    const ship={x:state.shipX,y:state.shipY},found=[];
    for(const [id,port] of Object.entries(ports)){
     if(known(state,id))continue;
     const dock={x:port.navX??port.x,y:port.navY??port.y},range=radius(port,world);
     if((dock.x-ship.x)**2+(dock.y-ship.y)**2>range*range||!lineClear(ship,dock))continue;
     if(mark(state,id))found.push(id);
    }
    return found;
   }
  };
 }
 function markerMarkup(){return `<span class="port-unknown" aria-hidden="true"><img src="${ART}" alt="" draggable="false" width="256" height="256"></span><span class="port-discovery-flash" aria-hidden="true"></span>`;}
 function reveal(element,port,{animate=true}={}){
  if(!element||element.classList.contains('is-known'))return;
  finishes.get(element)?.();
  element.classList.remove('is-undiscovered');element.classList.add('is-known');
  element.title=`${port.name} — ${port.region}`;element.setAttribute('aria-label',port.name);
  const label=element.querySelector('.port-label');if(label)label.textContent=port.name;
  if(!animate||globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return;
  element.classList.add('is-revealing');
  let timer;
  const finish=()=>{clearTimeout(timer);element.classList.remove('is-revealing');element.removeEventListener('animationend',ended);finishes.delete(element);};
  const ended=event=>{if(event.animationName==='portDiscoveryFlash')finish();};
  finishes.set(element,finish);element.addEventListener('animationend',ended);
  // A quick pan can hide a marker before animationend, so always clear its temporary effect.
  timer=setTimeout(finish,900);
 }
 function preload(){
  if(!preloadTask)preloadTask=(async()=>{
   const image=new Image();image.src=ART;
   if(image.decode)await image.decode();else await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject;});
   if(!image.naturalWidth)throw Error('Unknown port image failed to load');
  })().catch(error=>{preloadTask=null;throw error;});
  return preloadTask;
 }
 const api={RANGE_NM,ART,known,mark,radius,createScanner,markerMarkup,reveal,preload};
 if(typeof module==='object')module.exports=api;else window.ROTTA_PORT_DISCOVERY=api;
})();
