(function(){
 'use strict';
 const FOLD=420,FADE_OUT=380,BLACK=180,FADE_IN=650;
 const DURATION=FOLD+FADE_OUT+BLACK+FADE_IN;
 let current=null;
 function phase(task,value){
  task.overlay.dataset.phase=value;
  document.body.dataset.mansionTransitionPhase=value;
 }
 function finish(task,ok){
  if(current!==task)return;
  for(const timer of task.timers)clearTimeout(timer);
  task.overlay.hidden=true;delete task.overlay.dataset.phase;
  document.body.classList.remove('mansion-transitioning');
  delete document.body.dataset.mansionTransitionPhase;
  task.view.removeAttribute('aria-busy');
  for(const {node,inert}of task.locked)node.inert=inert;
  current=null;task.resolve(ok);
  if(ok){
   const focus=document.querySelector('#mansionDialogue:not([hidden]) button')||document.querySelector('[data-facility="mansion"]');
   focus?.focus({preventScroll:true});
  }
 }
 function cancel(){if(current)finish(current,false)}
 function play(commit){
  if(current)return current.promise; // Repeated mansion clicks never restart the fade or conversation.
  const overlay=document.querySelector('#mansionTransition'),view=document.querySelector('#portView');
  if(!overlay||!view){commit();return Promise.resolve(true)}
  // Respect reduced motion without adding a delayed, invisible navigation step.
  if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches){commit();return Promise.resolve(true)}
  const task={overlay,view,timers:[],locked:[],resolve:null,promise:null};
  task.promise=new Promise(resolve=>{task.resolve=resolve});current=task;
  for(const selector of ['#facilityPanel','#cargoPanel','#mansionDialogue','#departBtn','.captain-strip','.topbar']){
   const node=document.querySelector(selector);if(!node)continue;
   task.locked.push({node,inert:node.inert});node.inert=true;
  }
  view.setAttribute('aria-busy','true');phase(task,'fold');overlay.hidden=false;
  document.body.classList.add('mansion-transitioning');
  document.querySelector('[data-facility="mansion"]')?.focus({preventScroll:true});
  const later=(delay,fn)=>task.timers.push(setTimeout(()=>{if(current===task)fn()},delay));
  later(FOLD,()=>phase(task,'fade-out'));
  later(FOLD+FADE_OUT,()=>{
   phase(task,'black'); // The old room and panels change only behind fully opaque black.
   try{commit()}catch(error){console.error('[Rotta mansion transition]',error);finish(task,false)}
  });
  later(FOLD+FADE_OUT+BLACK,()=>phase(task,'reveal'));
  later(DURATION,()=>finish(task,true));
  return task.promise;
 }
 window.ROTTA_MANSION_TRANSITION={play,cancel,FOLD,FADE_OUT,BLACK,FADE_IN,DURATION,get active(){return !!current}};
})();
