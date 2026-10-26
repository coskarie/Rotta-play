(() => {
 'use strict';
 const portraitPath='assets/characters/01-portugal-nobleman.png';
 // revisit is the conversation hub: every completed topic returns here.
 const nodes={
  greeting:{text:'어서오시오',next:'inquiry'},
  inquiry:{text:'찾는 물건이 있소?',choices:[['협상술에 대해 물어볼 것이 있소.','negotiation'],['없소','nothing']]},
  negotiation:{text:'협상에 대하여 궁금한가?',choices:[['예','book'],['아니오','other']]},
  nothing:{text:'그렇군...',next:'revisit'},
  book:{text:'협상의 기본에 대하여 저술한 책일 세 이걸 주도록 하지.',reward:'negotiationBasics',next:'revisit'},
  other:{text:'다른 것을 찾는가 보군. 하지만 협상술 외엔 가진 것이 없네 돌아가보게.',next:'revisit'},
  revisit:{text:'다른 용건이 있는가?',choices:[['협상에 대하여','negotiation'],['아니오','farewell']]},
  farewell:{text:'그렇다면 돌아가시오.',choices:[['대화 종료',null]]}
 };
 function createConversation({onChange=()=>{},onBook=()=>{},onClose=()=>{}}={}){
  let current='greeting',closed=false,granted=false;
  function go(next){
   if(closed)return false;
   if(next===null){closed=true;onClose();return true}
   if(!nodes[next])return false;
   current=next;
   if(nodes[next].reward&&!granted){granted=true;onBook(nodes[next].reward)}
   onChange(current);return true;
  }
  return{get current(){return current},get node(){return nodes[current]},
   advance(){return nodes[current].next?go(nodes[current].next):false},
   choose(index){const choice=nodes[current].choices?.[index];return choice?go(choice[1]):false},
   dispose(){closed=true}
  };
 }
 let image=null,pending=null,root=null,conversation=null;
 function preload(){
  if(pending)return pending;
  image=new Image();image.decoding='async';image.src=portraitPath;
  pending=image.decode().then(()=>{if(!image.naturalWidth)throw Error('Noble portrait unavailable')}).catch(error=>{pending=null;image=null;throw error});
  return pending;
 }
 function unmount(){
  conversation?.dispose();conversation=null;
  if(root){root.hidden=true;root.querySelector('[data-dialogue-line]').onclick=null;root.querySelector('[data-dialogue-actions]').replaceChildren();delete root.dataset.node}
  root=null;
 }
 function mount(element,{onClose=()=>{},onBook=()=>{}}={}){
  unmount();if(!element)return;
  root=element;root.hidden=false;
  const line=root.querySelector('[data-dialogue-line]'),actions=root.querySelector('[data-dialogue-actions]');
  function render(){
   const node=conversation.node;root.dataset.node=conversation.current;
   line.textContent=node.text;line.classList.toggle('can-advance',!!node.next);
   line.onclick=node.next?()=>conversation.advance():null;
   actions.replaceChildren();
   for(const [index,choice]of (node.choices||[]).entries()){
    const button=document.createElement('button');button.type='button';button.className='mansion-choice';button.innerHTML='<svg class="mansion-choice-frame" viewBox="0 0 300 44" preserveAspectRatio="none" aria-hidden="true"><path class="field" d="M12 2H288L298 12V32L288 42H12L2 32V12Z"/><path class="rule" d="M15 6H285L293 14V30L285 38H15L7 30V14Z"/></svg>';const label=document.createElement('span');label.textContent=choice[0];button.appendChild(label);button.dataset.dialogueChoice=String(index);button.onclick=()=>conversation.choose(index);actions.appendChild(button);
   }
   if(node.next){
    const button=document.createElement('button');button.type='button';button.className='mansion-continue';button.setAttribute('aria-label','계속');button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 8 7 7 7-7"/></svg>';button.onclick=()=>conversation.advance();actions.appendChild(button);
   }
   actions.querySelector('button')?.focus({preventScroll:true});
  }
  conversation=createConversation({onChange:render,onBook,onClose:()=>{unmount();onClose()}});render();
 }
 window.ROTTA_MANSION_DIALOGUE={mount,unmount,preload,createConversation,nodes,portraitPath,get active(){return !!conversation}};
})();
