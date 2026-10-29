(function(){
 'use strict';
 let current=null;
 function answer(accept){
  if(!current)return;
  const task=current;current=null;task.modal.hidden=true;
  task.yes.onclick=task.no.onclick=task.modal.onclick=null;task.game.inert=task.inert;
  if(accept)task.action();
  else{
   window.ROTTA_MANSION_DIALOGUE?.resume();
   const focus=document.querySelector('#mansionDialogue button')||document.querySelector(`[data-facility="${window.ROTTA_MANSION_DIALOGUE?.facility||'mansion'}"]`);
   focus?.focus({preventScroll:true});
  }
 }
 function request(action){
  if(current)return false;
  const modal=document.querySelector('#mansionLeavePrompt'),yes=document.querySelector('#mansionLeaveYes'),no=document.querySelector('#mansionLeaveNo'),game=document.querySelector('#game');
  if(!modal||!yes||!no||!game)return false; // Missing confirmation must never discard an ongoing conversation.
  current={modal,yes,no,game,inert:game.inert,action};
  window.ROTTA_MANSION_DIALOGUE?.pause();game.inert=true;modal.hidden=false;
  yes.onclick=()=>answer(true);no.onclick=()=>answer(false);
  modal.onclick=event=>{if(event.target===modal)answer(false)};
  no.focus({preventScroll:true});return false;
 }
 function handleKey(event){
  if(!current)return false;
  if(event.ctrlKey||event.metaKey||event.altKey)return true;
  if(window.ROTTA_DIALOGUE_INPUT?.handleKey(event,{buttons:[current.yes,current.no]}))return true;
  const key=({KeyY:'y',KeyN:'n'})[event.code]||event.key.toLowerCase();
  if(key==='y'||key==='n'||key==='escape'){
   event.preventDefault();if(!event.repeat)answer(key==='y');return true;
  }
  if(key==='tab'){
   event.preventDefault();(document.activeElement===current.no?current.yes:current.no).focus({preventScroll:true});return true;
  }
  if(key!=='enter'&&key!==' ')event.preventDefault();
  return true;
 }
 window.ROTTA_MANSION_NAVIGATION={request,handleKey,cancel:()=>answer(false),get active(){return !!current}};
})();
