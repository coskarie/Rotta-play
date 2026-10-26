(() => {
 'use strict';
 // Shared by dialogue presenters: pass only the currently available actions.
 function handleKey(event,{buttons=[],onAdvance=()=>{},ready=true}={}){
  if(event.ctrlKey||event.metaKey||event.altKey||event.isComposing)return false;
  const tag=event.target?.tagName;
  if(['INPUT','TEXTAREA','SELECT'].includes(tag)||event.target?.isContentEditable)return false;
  if(!['ArrowLeft','ArrowRight','Enter'].includes(event.key))return false;
  event.preventDefault();
  if(event.repeat||!ready)return true;
  const available=Array.from(buttons).filter(button=>!button.disabled&&!button.hidden);
  if(event.key==='Enter'){
   const selected=available.includes(document.activeElement)?document.activeElement:available[0];
   if(selected)selected.click();else onAdvance();
  }else if(available.length){
   const index=available.indexOf(document.activeElement),direction=event.key==='ArrowRight'?1:-1;
   const next=index<0?(direction>0?0:available.length-1):(index+direction+available.length)%available.length;
   available[next].focus({preventScroll:true});
  }
  return true;
 }
 window.ROTTA_DIALOGUE_INPUT={handleKey};
})();
