(() => {
 'use strict';
 const THRESHOLD=25;
 const percent=value=>Number.isFinite(value)?Math.max(0,Math.min(100,value)):0;
 function options(state){
  if(!state.voyageOptions||typeof state.voyageOptions!=='object')state.voyageOptions={autoFood:false};
  return state.voyageOptions;
 }
 function estimate(state,supplies,rate,carry=0){
  let reserve=0;
  for(const [key,item]of Object.entries(supplies?.catalog||{}))if(item.group==='food')reserve+=supplies.owned(state,key)*(item.effects.food||0);
  const valid=Number.isFinite(rate)&&rate>0,fraction=Number.isFinite(carry)?Math.max(0,Math.min(.999999,carry)):0;
  const days=points=>valid?Math.max(0,Math.ceil((points-fraction)/rate-1e-9)):null;
  return{days:days(percent(state.food)),withReserve:days(percent(state.food)+reserve),reserve};
 }
 function autoFeed(state,supplies,{sailing=false,day=state.elapsedDays}={}){
  // Called only by the daily simulation, never by rendering, camera movement or timers.
  if(!sailing||state.voyageOptions?.autoFood!==true||!Number.isFinite(state.food)||state.food>THRESHOLD||!Number.isSafeInteger(day)||day<0||state.voyageOptions.lastFedDay===day||!supplies)return null;
  const room=100-percent(state.food);
  const candidates=Object.entries(supplies.catalog).filter(([key,item])=>item.group==='food'&&item.effects.food>0&&item.effects.food<=room&&supplies.canUse(state,key));
  candidates.sort((a,b)=>b[1].effects.food-a[1].effects.food||a[1].price-b[1].price||a[0].localeCompare(b[0]));
  if(!candidates.length)return null;
  const [key,item]=candidates[0],result=supplies.use(state,key);
  if(!result.ok)return null;
  options(state).lastFedDay=day;return{key,name:item.name,...result};
 }
 const bag='<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M10 6h12l-3 6c7 4 9 11 5 14H8c-4-3-2-10 5-14Zm3 6h6M12 3l4 3 4-3M11 20h10"/></svg>';
 const foodIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h14v14H5zM9 9h.1M15 9h.1M12 12h.1M9 15h.1M15 15h.1"/></svg>';
 const hullIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 12 4 7h10l4-7H3Zm4 0V7h10v5M12 7V3M4 22h16"/></svg>';
 const warehouseIcon='<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M10 13h28v25H10zM8 9h32v7H8zM19 22h10v7H19zM16 16v22M32 16v22"/></svg>';
 let config=null,nodes=null,opened=false;
 function close(restoreFocus=true){
  if(!nodes||!opened)return false;
  opened=false;nodes.panel.hidden=true;nodes.toggle.setAttribute('aria-expanded','false');
  if(restoreFocus&&!nodes.root.hidden)nodes.toggle.focus({preventScroll:true});return true;
 }
 function refresh(){
  if(!nodes)return;
  const state=config.state(),supplies=config.supplies(),visible=config.visible();nodes.root.hidden=!visible;
  if(!visible||!supplies){close(false);return}
  // Transitions/modals may finish without a simulation tick. Check live guards on activation
  // rather than freezing the opener disabled until the next sailing day.
  const allowed=config.canOpen();nodes.toggle.disabled=false;
  if(opened&&!allowed)close(false);
  const summary=config.summary();for(const [key,node]of nodes.stats)if(node.textContent!==summary[key])node.textContent=summary[key];
  const forecast=estimate(state,supplies,config.rate(),config.carry()),food=percent(state.food),hull=percent(state.hull);
  nodes.food.textContent=`${Math.round(food)}%`;nodes.hull.textContent=`${Math.round(hull)}%`;
  nodes.foodWrap.title=`식량${forecast.days===null?'':` · 약 ${forecast.days}일${forecast.reserve?` · 비축 포함 ${forecast.withReserve}일`:''}`}`;
  nodes.foodWrap.setAttribute('aria-label',`식량 ${Math.round(food)}%${forecast.days===null?'':` · 약 ${forecast.days}일`}`);
  nodes.hullWrap.setAttribute('aria-label',`선체 ${Math.round(hull)}%`);
  nodes.hullWrap.title='선체';nodes.foodWrap.classList.toggle('low',food<=THRESHOLD);nodes.hullWrap.classList.toggle('low',hull<=25);
  nodes.auto.checked=state.voyageOptions?.autoFood===true;
  for(const [key,node]of nodes.items){
   const item=supplies.catalog[key],quantity=supplies.owned(state,key),enabled=allowed&&supplies.canUse(state,key);
   node.count.textContent=String(quantity);node.button.disabled=!enabled;
   node.button.classList.toggle('empty',quantity===0);node.button.classList.toggle('event-only',!!item.eventOnly);
   node.button.title=`${item.name} · ${supplies.description(item)}${item.eventOnly?' · 사건 발생 시 자동 사용':''}`;
   node.button.setAttribute('aria-label',`${item.name} ${quantity}개${item.eventOnly?' · 사건 대응':enabled?' 사용':''}`);
  }
 }
 function mount(settings){
  if(nodes)return;const root=settings.root,supplies=settings.supplies();if(!root||!supplies)return;
  config=settings;
  root.innerHTML=`<div class="voyage-supply-status"><div class="voyage-summary"><dl class="voyage-ledger"><div><dt>골드</dt><dd data-voyage-stat="gold"></dd></div><div><dt>명성</dt><dd data-voyage-stat="fame"></dd></div><div><dt>화물</dt><dd data-voyage-stat="cargo"></dd></div><div><dt>선원</dt><dd data-voyage-stat="crew"></dd></div></dl><span data-voyage-food>${foodIcon}<b></b></span><span data-voyage-hull>${hullIcon}<b></b></span></div><div class="voyage-tools"><button type="button" data-voyage-toggle aria-label="항해 물자" aria-controls="voyageSupplyPanel" aria-expanded="false">${bag}</button><button type="button" data-voyage-warehouse aria-label="창고" aria-controls="warehouseDialog" aria-haspopup="dialog" title="창고">${warehouseIcon}</button></div></div><section id="voyageSupplyPanel" class="voyage-supply-panel" aria-label="항해 물자" hidden><div class="voyage-supply-grid">${Object.entries(supplies.catalog).map(([key,item])=>`<button type="button" class="voyage-supply-item" data-voyage-use="${key}">${supplies.art(key)||settings.goodArt(item.good)}${item.grade?`<i aria-hidden="true">${'ⅠⅡⅢ'[item.grade-1]}</i>`:''}<b data-voyage-count>0</b></button>`).join('')}</div><label class="voyage-auto-food" title="항해 중 식량이 25% 이하이면 보유한 식량을 하루 최대 한 개 사용합니다."><input type="checkbox" data-voyage-auto>자동 보급</label></section>`;
  const foodWrap=root.querySelector('[data-voyage-food]'),hullWrap=root.querySelector('[data-voyage-hull]');
  foodWrap.setAttribute('role','img');hullWrap.setAttribute('role','img');
  nodes={root,foodWrap,hullWrap,food:foodWrap.querySelector('b'),hull:hullWrap.querySelector('b'),toggle:root.querySelector('[data-voyage-toggle]'),warehouse:root.querySelector('[data-voyage-warehouse]'),panel:root.querySelector('#voyageSupplyPanel'),auto:root.querySelector('[data-voyage-auto]'),stats:new Map(['gold','fame','cargo','crew'].map(key=>[key,root.querySelector(`[data-voyage-stat="${key}"]`)])),items:new Map()};
  root.querySelectorAll('[data-voyage-use]').forEach(button=>{
   const key=button.dataset.voyageUse;nodes.items.set(key,{button,count:button.querySelector('[data-voyage-count]')});
   button.onclick=()=>{if(button.disabled||!config.canOpen())return;config.use(key);refresh();if(button.disabled)nodes.toggle.focus({preventScroll:true})};
  });
  nodes.toggle.onclick=()=>{
   if(opened)return close();if(!config.canOpen())return;
   opened=true;nodes.panel.hidden=false;nodes.toggle.setAttribute('aria-expanded','true');refresh();
  };
  nodes.auto.onchange=()=>{if(!config.canOpen()){refresh();return}options(config.state()).autoFood=nodes.auto.checked;refresh()};
  nodes.warehouse.onclick=()=>{if(!config.canOpen())return;close(false);config.openWarehouse()};
  document.addEventListener('pointerdown',event=>{if(opened&&!root.contains(event.target))close(false)});
  refresh();
 }
 function handleKey(event){
  if(!nodes||event.ctrlKey||event.metaKey||event.altKey||event.isComposing)return false;
  // Native activation must not leak Space to the camera or repeat-consume a focused item.
  if(nodes.root.contains(event.target)&&['Enter',' '].includes(event.key)){if(event.repeat)event.preventDefault();return true}
  if(!opened||event.key!=='Escape')return false;
  if(!config.canOpen()){close(false);return false}
  event.preventDefault();if(!event.repeat)close();return true;
 }
 window.ROTTA_VOYAGE_SUPPLIES={THRESHOLD,estimate,autoFeed,options,mount,refresh,close,handleKey,get active(){return opened}};
})();
