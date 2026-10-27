(() => {
 'use strict';
 const shortcuts=Object.freeze({KeyO:'navigator',KeyI:'warehouse',KeyP:'crew',KeyL:'ship',KeyK:'codex',KeyJ:'skills',KeyQ:'quests'});
 const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
 const icon='<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M10 13h28v25H10zM8 9h32v7H8zM19 22h10v7H19zM16 16v22M32 16v22"/></svg>';
 let config=null,nodes=null,opened=false,tab='goods',previousFocus=null,inertStates=[];
 function dismissMenu(){if(!nodes)return;nodes.menu.hidden=true;nodes.toggle.setAttribute('aria-expanded','false')}
 function render(){
  if(!opened)return;
  const rows=config.items(tab);
  nodes.tabs.forEach(button=>{const selected=button.dataset.warehouseTab===tab;button.setAttribute('aria-selected',String(selected));button.tabIndex=selected?0:-1;if(selected)nodes.contents.setAttribute('aria-labelledby',button.id)});
  // Only render on actual inventory changes. Simulation ticks must not replace focused content.
  const html=rows.length?`<ul class="warehouse-grid">${rows.map(row=>`<li class="warehouse-item"><div class="warehouse-art">${row.art||icon}<b>${escape(row.quantity.toLocaleString('ko-KR'))}</b></div><span>${escape(row.name)}</span></li>`).join('')}</ul>`:'<p class="warehouse-empty">없음</p>';
  if(nodes.contents.innerHTML!==html)nodes.contents.innerHTML=html;
 }
 function open(){
  if(!config?.canOpen()||opened)return;
  previousFocus=document.activeElement;dismissMenu();opened=true;
  inertStates=[nodes.game,nodes.topbar].map(node=>[node,node.inert]);
  inertStates.forEach(([node])=>{node.inert=true});
  nodes.overlay.hidden=false;render();nodes.tabs.find(button=>button.dataset.warehouseTab===tab).focus({preventScroll:true});
 }
 function close(restoreFocus=true){
  dismissMenu();if(!opened)return;
  opened=false;nodes.overlay.hidden=true;
  inertStates.forEach(([node,inert])=>{node.inert=inert});inertStates=[];
  if(restoreFocus){const target=previousFocus?.isConnected&&!previousFocus.disabled&&!nodes.menu.contains(previousFocus)?previousFocus:nodes.toggle;target?.focus({preventScroll:true})}
  previousFocus=null;
 }
 function selectTab(value){if(!['goods','tools','quest'].includes(value))return;tab=value;render()}
 function refresh(){if(!nodes)return;nodes.toggle.disabled=!(config.ready?config.ready():config.canOpen());if(opened)render()}
 function mount(options){
  if(nodes)return;config=options;
  const $=id=>document.querySelector(id);
  nodes={toggle:$('#playerMenuToggle'),menu:$('#playerMenu'),overlay:$('#warehouseOverlay'),dialog:$('#warehouseDialog'),contents:$('#warehouseContents'),close:$('#warehouseClose'),game:$('#game'),topbar:$('.topbar'),tabs:[...document.querySelectorAll('[data-warehouse-tab]')]};
  nodes.toggle.onclick=()=>{if(!config.canOpen())return;const show=nodes.menu.hidden;nodes.menu.hidden=!show;nodes.toggle.setAttribute('aria-expanded',String(show))};
  nodes.menu.querySelector('[data-player-page="warehouse"]').onclick=open;
  nodes.close.onclick=()=>close();nodes.overlay.onclick=event=>{if(event.target===nodes.overlay)close()};
  nodes.tabs.forEach(button=>button.onclick=()=>selectTab(button.dataset.warehouseTab));
  document.addEventListener('pointerdown',event=>{if(!nodes.menu.hidden&&!nodes.menu.contains(event.target)&&!nodes.toggle.contains(event.target))dismissMenu()});
  refresh();
 }
 function handleKey(event){
  if(!nodes||event.ctrlKey||event.metaKey||event.altKey||event.isComposing)return false;
  const key=event.key.toLowerCase(),page=shortcuts[event.code]||shortcuts[`Key${key.toUpperCase()}`];
  if(opened){
   if(key==='escape'||page==='warehouse'){event.preventDefault();if(!event.repeat)close();return true}
   if(key==='tab'){
    const focusable=[nodes.close,...nodes.tabs.filter(button=>button.tabIndex===0),nodes.contents],index=focusable.indexOf(document.activeElement);
    event.preventDefault();focusable[(index+(event.shiftKey?-1:1)+focusable.length)%focusable.length].focus({preventScroll:true});return true;
   }
   if(['arrowleft','arrowright','home','end'].includes(key)&&nodes.tabs.includes(document.activeElement)){
    event.preventDefault();const index=nodes.tabs.indexOf(document.activeElement),next=key==='home'?0:key==='end'?nodes.tabs.length-1:(index+(key==='arrowright'?1:-1)+nodes.tabs.length)%nodes.tabs.length;
    selectTab(nodes.tabs[next].dataset.warehouseTab);nodes.tabs[next].focus({preventScroll:true});return true;
   }
   // Native Enter/Space still activate focused buttons; no game hotkeys reach the map.
   if(!['enter',' ','arrowup','arrowdown','pageup','pagedown'].includes(key))event.preventDefault();
   return true;
  }
  if(!nodes.menu.hidden&&key==='escape'){event.preventDefault();dismissMenu();nodes.toggle.focus({preventScroll:true});return true}
  if(['enter',' '].includes(key)&&(event.target===nodes.toggle||nodes.menu.contains(event.target)))return true;
  if(['INPUT','SELECT','TEXTAREA'].includes(event.target?.tagName)||event.target?.isContentEditable||!config.canOpen()||!page)return false;
  event.preventDefault();if(!event.repeat&&page==='warehouse')open();return true;
 }
 window.ROTTA_PLAYER_MENU={mount,refresh,open,close,handleKey,shortcuts,get active(){return opened}};
})();
