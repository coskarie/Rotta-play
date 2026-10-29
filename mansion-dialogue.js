(() => {
 'use strict';
 const portraitPath='assets/characters/01-portugal-nobleman.png';
 const assets=[portraitPath,'assets/dialogue/noble-v1/portrait-frame-slim.png','assets/dialogue/noble-v1/nameplate.png','assets/dialogue/noble-v1/speech-panel.png','assets/dialogue/noble-v1/choice-button.png'];
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
 function createConversation({onChange=()=>{},onBook=()=>{},onClose=()=>{},nodes:script=nodes}={}){
  let current='greeting',closed=false,granted=false,progressed=false;
  function go(next){
   if(closed)return false;
   if(next===null){closed=true;onClose();return true}
   if(!script[next])return false;
   current=next;progressed=true;
   if(script[next].reward&&!granted){granted=true;onBook(script[next].reward)}
   onChange(current);return true;
  }
  return{get current(){return current},get node(){return script[current]},get progressed(){return progressed},
   advance(){return script[current].next?go(script[current].next):false},
   choose(index){const choice=script[current].choices?.[index];return choice?go(choice[1]):false},
   dispose(){closed=true}
  };
 }
 const PORTRAIT_DURATION=360,SPEECH_DURATION=340,CHAR_DELAY=36;
 const decoded=new Map();let pending=null,root=null,conversation=null,presentation=null;
 function preload(){
  if(pending)return pending;
  pending=Promise.allSettled(assets.map(async path=>{
   if(decoded.has(path))return;
   const image=new Image();image.decoding='async';image.src=path;await image.decode();
   if(!image.naturalWidth)throw Error('Dialogue image unavailable');decoded.set(path,image);
  })).then(results=>{const failure=results.find(result=>result.status==='rejected');if(failure)throw failure.reason}).catch(error=>{pending=null;throw error});
  return pending;
 }
 function unmount(){
  presentation?.dispose();presentation=null;
  conversation?.dispose();conversation=null;
  if(root){root.hidden=true;root.querySelector('[data-dialogue-line]').onclick=null;root.querySelector('[data-dialogue-actions]').replaceChildren();delete root.dataset.node;delete root.dataset.dialoguePhase;delete root.dataset.typing;delete root.dataset.dialogueFacility}
  root=null;
 }
 function mount(element,{onClose=()=>{},onBook=()=>{},deferReveal=false,profile=null}={}){
  unmount();if(!element)return;
  root=element;root.hidden=false;root.dataset.dialoguePhase='waiting';root.dataset.node='greeting';
  root.dataset.dialogueFacility=profile?.facility||'mansion';
  const portrait=root.querySelector('.mansion-person'),speaker=root.querySelector('#mansionSpeaker span');
  if(portrait){portrait.src=profile?.portraitSource||portraitPath;portrait.alt=profile?.portraitAlt||'포르투갈 귀족'}
  if(speaker)speaker.textContent=profile?.speaker||'귀족';
  const line=root.querySelector('[data-dialogue-line]'),actions=root.querySelector('[data-dialogue-actions]');
  const reduced=!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,timers=new Set();
  let disposed=false,paused=false,typing=false,writer=0,letters=[],cursor=0;
  line.textContent='';line.setAttribute('aria-label','');actions.replaceChildren();
  function later(fn,delay){const id=setTimeout(()=>{timers.delete(id);if(!disposed)fn()},delay);timers.add(id);return id}
  function stopWriter(){if(writer){clearTimeout(writer);timers.delete(writer);writer=0}}
  function dispose(){disposed=true;for(const id of timers)clearTimeout(id);timers.clear();writer=0;line.onclick=null}
  function controls(){
   if(disposed)return;
   const node=conversation.node;
   actions.replaceChildren();
   if(!typing)for(const [index,choice]of (node.choices||[]).entries()){
    const button=document.createElement('button');button.type='button';button.className='mansion-choice';const label=document.createElement('span');label.textContent=choice[0];button.appendChild(label);button.dataset.dialogueChoice=String(index);button.onclick=()=>{if(!paused)conversation.choose(index)};actions.appendChild(button);
   }
   if(node.next){
    const button=document.createElement('button');button.type='button';button.className='mansion-continue';button.setAttribute('aria-label','계속');button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 8 7 7 7-7"/></svg>';button.onclick=advance;actions.appendChild(button);
   }
   line.classList.toggle('can-advance',typing||!!node.next);
   if(!paused)actions.querySelector('button')?.focus({preventScroll:true});
  }
  function complete(){
   stopWriter();typing=false;root.dataset.typing='false';line.textContent=letters.join('');cursor=letters.length;controls();
  }
  function tick(){
   writer=0;if(paused||disposed||!typing)return;
   line.textContent=letters.slice(0,++cursor).join('');
   if(cursor>=letters.length)complete();else writer=later(tick,CHAR_DELAY);
  }
  function advance(){
   if(paused||disposed)return;
   if(typing)complete();else conversation.advance(); // First click finishes this line, never skips a node.
  }
  function render(){
   if(disposed)return;
   stopWriter();const node=conversation.node;root.dataset.node=conversation.current;
   letters=Array.from(node.text);cursor=0;typing=!reduced;root.dataset.typing=String(typing);
   line.textContent='';line.setAttribute('aria-label',node.text);line.onclick=advance;
   if(reduced)complete();else{controls();writer=later(tick,CHAR_DELAY)}
  }
  function reveal(){
   if(disposed||root.dataset.dialoguePhase!=='waiting')return;
   if(reduced){root.dataset.dialoguePhase='ready';render();return}
   root.dataset.dialoguePhase='portrait';
   later(()=>{root.dataset.dialoguePhase='speech';later(()=>{root.dataset.dialoguePhase='ready';render()},SPEECH_DURATION)},PORTRAIT_DURATION);
  }
  function handleKey(event){
   if(disposed)return false;
   return window.ROTTA_DIALOGUE_INPUT?.handleKey(event,{
    buttons:!typing&&conversation.node.choices?actions.children:[],onAdvance:advance,
    ready:!paused&&root.dataset.dialoguePhase==='ready'
   })||false;
  }
  presentation={dispose,reveal,handleKey,fold(){for(const id of timers)clearTimeout(id);timers.clear();writer=0;paused=true;root.dataset.dialoguePhase='leaving'},pause(){paused=true;stopWriter()},resume(){if(disposed)return;paused=false;if(typing)writer=later(tick,CHAR_DELAY)}};
  conversation=createConversation({nodes:profile?.nodes||nodes,onChange:render,onBook,onClose:()=>{const result=onClose();if(!result?.then)unmount()}});
  if(!deferReveal)reveal();
 }
 window.ROTTA_MANSION_DIALOGUE={mount,unmount,preload,createConversation,nodes,portraitPath,assets,PORTRAIT_DURATION,SPEECH_DURATION,CHAR_DELAY,
  reveal:()=>presentation?.reveal(),fold:()=>presentation?.fold(),pause:()=>presentation?.pause(),resume:()=>presentation?.resume(),
  handleKey:event=>presentation?.handleKey(event)||false,
  get active(){return !!conversation},get facility(){return root?.dataset.dialogueFacility||null},get progressed(){return !!conversation?.progressed}};
})();
