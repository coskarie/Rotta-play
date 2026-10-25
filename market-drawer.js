(function(){
 'use strict';
 const DURATION=2000,THRESHOLD=12;
 let active=null,closed=false;
 function unmount(){if(active){active.dispose();active=null}}
 function mount(container,onResize=()=>{}){
  unmount();
  const root=container?.querySelector('[data-chart-drawer]'),handle=root?.querySelector('[data-chart-handle]'),chart=root?.querySelector('#marketChart');
  if(!root||!handle||!chart)return;
  const cleanups=[],height=window.ROTTA_MARKET_CHART?.HEIGHT||160;
  let pointer=null,ignoreClick=false,timer=0,frame=0,lastWidth=chart.clientWidth;
  root.style.setProperty('--market-chart-height',height+'px');
  root.style.setProperty('--market-chart-duration',DURATION+'ms');
  function sync(){
   root.classList.toggle('is-closed',closed);
   handle.setAttribute('aria-expanded',String(!closed));
   handle.setAttribute('aria-label',closed?'시세 그래프 펼치기':'시세 그래프 접기');
   chart.inert=closed;chart.setAttribute('aria-hidden',String(closed));
  }
  function finish(){clearTimeout(timer);timer=0;root.dataset.chartDrawerPhase=closed?'closed':'open'}
  function setClosed(next){
   if(next===closed)return;
   closed=next;clearTimeout(timer);sync();
   root.dataset.chartDrawerPhase=closed?'closing':'opening';
   if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)finish();
   else timer=setTimeout(finish,DURATION);
  }
  function listen(node,type,listener){node.addEventListener(type,listener);cleanups.push(()=>node.removeEventListener(type,listener))}
  listen(handle,'pointerdown',event=>{
   if(event.button!==0||event.isPrimary===false)return;
   pointer={id:event.pointerId,x:event.clientX,y:event.clientY,triggered:false};ignoreClick=false;
   try{handle.setPointerCapture(event.pointerId)}catch(_){}
   event.preventDefault();
  });
  listen(handle,'pointermove',event=>{
   if(!pointer||pointer.id!==event.pointerId||pointer.triggered)return;
   const dy=event.clientY-pointer.y,dx=event.clientX-pointer.x;
   if(Math.hypot(dx,dy)>=THRESHOLD)ignoreClick=true;
   if(Math.abs(dy)<THRESHOLD||Math.abs(dy)<Math.abs(dx))return;
   // One direction-sensitive switch per gesture; pointer velocity never controls the animation.
   pointer.triggered=true;ignoreClick=true;
   if((!closed&&dy>0)||(closed&&dy<0))setClosed(!closed);
   event.preventDefault();
  });
  function release(event){
   if(!pointer||pointer.id!==event.pointerId)return;
   pointer=null;
   try{if(handle.hasPointerCapture(event.pointerId))handle.releasePointerCapture(event.pointerId)}catch(_){}
  }
  listen(handle,'pointerup',release);listen(handle,'pointercancel',release);listen(handle,'lostpointercapture',release);
  listen(handle,'click',event=>{
   if(ignoreClick&&event.detail!==0){ignoreClick=false;event.preventDefault();return}
   ignoreClick=false;setClosed(!closed);
  });
  listen(handle,'keydown',event=>{
   if(event.key!=='ArrowDown'&&event.key!=='ArrowUp')return;
   event.preventDefault();if(!event.repeat)setClosed(event.key==='ArrowDown');
  });
  sync();finish();
  frame=requestAnimationFrame(()=>{frame=0;root.classList.add('is-ready')});
  let observer=null;
  if(window.ResizeObserver){
   observer=new window.ResizeObserver(()=>{
    const width=chart.clientWidth;
    if(width>0&&width!==lastWidth){lastWidth=width;onResize()}
   });
   observer.observe(chart);
  }
  active={dispose(){
   clearTimeout(timer);cancelAnimationFrame(frame);observer?.disconnect();
   if(pointer)release({pointerId:pointer.id});
   for(const cleanup of cleanups)cleanup();
  }};
 }
 window.ROTTA_MARKET_DRAWER={mount,unmount,DURATION,THRESHOLD,get closed(){return closed}};
})();
