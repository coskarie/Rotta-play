(function(){
 'use strict';
 const SCENE_DURATION=3000,BLACK_DURATION=2000,FADE_DURATION=180;
 const DURATION=SCENE_DURATION+BLACK_DURATION+FADE_DURATION;
 const scenes={
  depart:{src:'assets/departure-preparation-v1.png',label:'항해 준비'},
  arrive:{src:'assets/arrival-unloading-v1.png',label:'하역 중'}
 };
 const images=new Map();let task=null,active=false;
 function preload(){
  if(task)return task;
  task=Promise.all(Object.entries(scenes).map(async([kind,scene])=>{
   const image=new Image();image.src=scene.src;await image.decode();
   images.set(kind,image);
   const target=document.querySelector(`[data-transition-scene="${kind}"]`);if(target)target.src=scene.src;
  })).catch(error=>{task=null;throw error});
  return task;
 }
 function play(kind,commit){
  if(active||!scenes[kind])return Promise.resolve(false);
  const overlay=document.querySelector('#portTransition');
  if(!overlay){commit();return Promise.resolve(true)}
  active=true;
  const scene=scenes[kind],game=document.querySelector('#game'),header=document.querySelector('.topbar');
  const previous=[game,header].filter(Boolean).map(node=>({node,inert:node.inert}));
  for(const {node}of previous)node.inert=true;
  overlay.dataset.scene=kind;overlay.dataset.phase='scene';overlay.classList.remove('is-leaving');overlay.hidden=false;
  document.querySelector('#portTransitionLabel').textContent=scene.label;
  document.body.classList.add('port-transitioning');overlay.focus({preventScroll:true});
  return new Promise(resolve=>{
   let committed=false;
   // Fade into pure black first. The map swap stays hidden for two full seconds.
   setTimeout(()=>{overlay.dataset.phase='fading'},SCENE_DURATION-250);
   setTimeout(()=>{
    overlay.dataset.phase='black';
    try{commit();committed=true}catch(error){console.error('[Rotta port transition]',error)}
   },SCENE_DURATION);
   setTimeout(()=>{overlay.dataset.phase='reveal';overlay.classList.add('is-leaving')},SCENE_DURATION+BLACK_DURATION);
   setTimeout(()=>{
    overlay.hidden=true;overlay.dataset.phase='idle';overlay.classList.remove('is-leaving');document.body.classList.remove('port-transitioning');
    for(const {node,inert}of previous)node.inert=inert;
    active=false;
    const focus=document.querySelector(kind==='depart'?'#seaViewport':'#departBtn');focus?.focus({preventScroll:true});
    resolve(committed);
   },DURATION);
  });
 }
 window.ROTTA_PORT_TRANSITIONS={preload,play,DURATION,SCENE_DURATION,BLACK_DURATION,get active(){return active},get ready(){return images.size===Object.keys(scenes).length}};
})();
