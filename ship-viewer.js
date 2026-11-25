(() => {
  'use strict';
  const api=window.ROTTA_SHIP_3D;
  const stage=document.querySelector('#shipStage'),canvas=document.querySelector('#shipCanvas');
  const error=document.querySelector('#viewerError'),title=document.querySelector('#shipTitle');
  const buttons=[...document.querySelectorAll('[data-hull]')];
  const heading=document.querySelector('#shipHeading'),pitch=document.querySelector('#shipPitch'),zoom=document.querySelector('#shipZoom');
  const sameScale=document.querySelector('#sameScale');
  const pointers=new Map();
  let renderer,kind,center,radius,frame,size=0;
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  const degrees=value=>((value%360)+360)%360;

  function schedule(){
    if(frame||document.hidden)return;
    frame=requestAnimationFrame(draw);
  }
  function draw(){
    frame=undefined;
    if(!renderer||!size||document.hidden)return;
    const span=sameScale.checked?30:radius;
    const ok=renderer.draw({
      heading:Number(heading.value),pitch:Number(pitch.value),size,
      scale:size*.42/span*Number(zoom.value),center,waterline:-10,
      ratio:Math.min(2,window.devicePixelRatio||1)
    });
    error.hidden=ok;
    for(const input of [heading,pitch,zoom]){
      input.nextElementSibling.value=input===zoom?Number(input.value).toFixed(2)+'×':input.value+'°';
    }
  }
  function selectHull(value){
    if(!api?.hulls[value]){error.hidden=false;return}
    renderer?.dispose();
    kind=value;
    const source=api.buildModel(kind),vertices=source.vertices.slice();
    const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
    for(let i=0;i<vertices.length;i+=10)for(let j=0;j<3;j++){
      min[j]=Math.min(min[j],vertices[i+j]);max[j]=Math.max(max[j],vertices[i+j]);
    }
    center=(min[2]+max[2])/2;radius=0;
    const middleY=(min[1]+max[1])/2;
    for(let i=0;i<vertices.length;i+=10){
      vertices[i+1]-=middleY;
      radius=Math.max(radius,Math.hypot(vertices[i],vertices[i+1],vertices[i+2]-center));
    }
    const model={vertices,triangles:source.triangles};
    try{renderer=api.createRenderer(canvas,model)}catch{renderer=null}
    title.textContent=api.hulls[kind].name;
    canvas.setAttribute('aria-label',api.hulls[kind].name+' 3D 모델');
    buttons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.hull===kind)));
    const url=new URL(location.href);url.searchParams.set('tier',String(buttons.findIndex(button=>button.dataset.hull===kind)+1));
    history.replaceState(null,'',url);
    error.hidden=Boolean(renderer);
    schedule();
  }
  function resize(){
    size=Math.max(1,Math.floor(Math.min(stage.clientWidth,stage.clientHeight)));
    canvas.style.width=canvas.style.height=size+'px';
    schedule();
  }
  function reset(){
    const largeShip=kind==='royal-galleon'||kind==='ocean-carrack';
    heading.value=largeShip?225:35;pitch.value=largeShip?63:48;zoom.value=largeShip?1.15:1;schedule();
  }
  buttons.forEach(button=>button.addEventListener('click',()=>selectHull(button.dataset.hull)));
  for(const input of [heading,pitch,zoom,sameScale])input.addEventListener('input',schedule);
  document.querySelector('#resetView').addEventListener('click',reset);
  document.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>{
    const views={top:[0,0],side:[90,85],stern:[0,78]};
    [heading.value,pitch.value]=views[button.dataset.view];schedule();
  }));
  stage.addEventListener('pointerdown',event=>{
    if(event.button!==0)return;
    stage.focus({preventScroll:true});
    pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
    stage.setPointerCapture(event.pointerId);stage.classList.add('dragging');
  });
  stage.addEventListener('pointermove',event=>{
    const previous=pointers.get(event.pointerId);
    if(!previous)return;
    const next={x:event.clientX,y:event.clientY};
    if(pointers.size===2){
      const other=[...pointers.entries()].find(([id])=>id!==event.pointerId)[1];
      const before=Math.hypot(previous.x-other.x,previous.y-other.y);
      const after=Math.hypot(next.x-other.x,next.y-other.y);
      if(before>2)zoom.value=clamp(Number(zoom.value)*after/before,.6,2.5);
    }else if(pointers.size===1){
      heading.value=degrees(Number(heading.value)+(next.x-previous.x)*.4);
      pitch.value=clamp(Number(pitch.value)+(next.y-previous.y)*.3,0,85);
    }
    pointers.set(event.pointerId,next);schedule();
  });
  const release=event=>{
    pointers.delete(event.pointerId);
    if(!pointers.size)stage.classList.remove('dragging');
  };
  for(const name of ['pointerup','pointercancel','lostpointercapture'])stage.addEventListener(name,release);
  stage.addEventListener('wheel',event=>{
    event.preventDefault();
    const amount=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?size:1);
    zoom.value=clamp(Number(zoom.value)*Math.exp(-amount*.0015),.6,2.5);schedule();
  },{passive:false});
  stage.addEventListener('keydown',event=>{
    const changes={ArrowLeft:[-5,0],ArrowRight:[5,0],ArrowUp:[0,-5],ArrowDown:[0,5]};
    if(changes[event.key]){
      event.preventDefault();
      heading.value=degrees(Number(heading.value)+changes[event.key][0]);
      pitch.value=clamp(Number(pitch.value)+changes[event.key][1],0,85);
    }else if(['+','=','-'].includes(event.key)){
      event.preventDefault();zoom.value=clamp(Number(zoom.value)+(event.key==='-'?-.1:.1),.6,2.5);
    }else if(event.key==='Home'){event.preventDefault();reset()}
    else return;
    schedule();
  });
  canvas.addEventListener('shiprendererchange',schedule);
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){cancelAnimationFrame(frame);frame=undefined;pointers.clear();stage.classList.remove('dragging')}
    else schedule();
  });
  window.addEventListener('pagehide',()=>{cancelAnimationFrame(frame);renderer?.dispose();renderer=null});
  window.addEventListener('pageshow',event=>{if(event.persisted)selectHull(kind)});
  new ResizeObserver(resize).observe(stage);
  const tier=clamp(Math.trunc(Number(new URL(location.href).searchParams.get('tier'))||1),1,buttons.length);
  selectHull(buttons[tier-1].dataset.hull);reset();resize();
})();
