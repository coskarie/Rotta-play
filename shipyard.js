(() => {
 'use strict';
 const hulls=Object.freeze([
  {name:'소형 카라벨',capacity:60,slots:1,price:0,speed:1,turn:1,materials:{}},
  {name:'상업용 카라벨',capacity:100,slots:2,price:2600,speed:1.02,turn:.96,materials:{timber:22,linen:8,hemp:6,iron:4,navalStores:4}},
  {name:'나우',capacity:170,slots:3,price:9000,speed:1.04,turn:.9,materials:{timber:42,linen:16,hemp:12,iron:10,navalStores:8}},
  {name:'카락',capacity:280,slots:4,price:26000,speed:1.06,turn:.84,materials:{timber:76,linen:28,hemp:22,iron:18,navalStores:16}},
  {name:'대형 카락',capacity:440,slots:6,price:80000,speed:1.08,turn:.78,materials:{timber:124,linen:44,hemp:36,iron:28,navalStores:24}}
 ]);
 const blueprints=Object.freeze(Object.fromEntries(hulls.slice(1).map((h,i)=>['shipPlan'+(i+2),Object.freeze({name:h.name+' 설계도',tier:i+2,source:'quest'})])));
 for(const hull of hulls){Object.freeze(hull.materials);Object.freeze(hull)}
 const parts=Object.freeze({
  sails:{name:'돛',cost:140,materials:{linen:2},effect:'속력 +4%'},
  rudder:{name:'키',cost:100,materials:{timber:2},effect:'선회 +5%'},
  planking:{name:'외판',cost:160,materials:{timber:2,iron:1},effect:'선체 피해 −5%'},
  cargoFrame:{name:'적재구',cost:120,materials:{timber:3},effect:'화물 +12'}
 });
 const cabins=Object.freeze({
  captain:{name:'선장실',tier:1,cost:0,preset:true,effect:'기본 탑재'},
  supplies:{name:'물자창고',tier:1,cost:0,preset:true,effect:'기본 탑재'},
  firstOfficer:{name:'부관실',tier:1,cost:0,preset:true,effect:'기본 탑재'},
  smallHold:{name:'소형 물류창고',tier:1,cost:180,warehouse:10,effect:'일반 화물 +10'},
  galley:{name:'조리실',tier:2,cost:180,effect:'식량 소모 −10%'},
  hold:{name:'중형 물류창고',tier:2,cost:650,warehouse:20,effect:'일반 화물 +20'},
  infirmary:{name:'의무실',tier:2,cost:850,effect:'선원 피해 −20%'},
  accounting:{name:'회계실',tier:3,cost:1600,effect:'협상 성공률 +5%'},
  largeHold:{name:'대형 물류창고',tier:3,cost:1800,warehouse:40,effect:'일반 화물 +40'},
  chartroom:{name:'측량실',tier:3,cost:2200,effect:'속력 +3% · 선회 +8%'},
  quarters:{name:'선원 휴게실',tier:3,cost:3600,effect:'사기 소모 −15%'},
  workshop:{name:'공작실',tier:4,cost:1800,effect:'선체 피해 −15%'},
  specialHold:{name:'특수 화물실',tier:4,cost:2400,effect:'선택 품목 +30'}
 });
 const names={timber:'목재',iron:'철재',linen:'리넨',hemp:'대마',navalStores:'송진·타르'};
 const own=(obj,key)=>Object.hasOwn(obj,key),num=value=>Number.isSafeInteger(value)&&value>=0?value:0;
 const tier=state=>Math.max(1,Math.min(5,num(state.ship?.tier)||1));
 const level=(state,id)=>Math.min(5,num(state.ship?.parts?.[id]));
 let goodCatalog={};
 const setGoods=goods=>{goodCatalog=goods||{}};
 const fitted=(state,id)=>own(cabins,id)&&(cabins[id].preset||tier(state)>=cabins[id].tier&&!!state.ship?.cabins?.[id]?.unlocked&&!!state.ship.cabins[id].fitted);
 const count=state=>Object.keys(cabins).filter(id=>fitted(state,id)).length;
 const fmt=value=>Number(value).toLocaleString('ko-KR');
 const planOwned=(state,target)=>num(state.questItems?.['shipPlan'+target]?.quantity);
 const blueprintArt=name=>art('material-blueprint',name||'선박 설계도','good-art');
 // Reward adapter for future quest completion. Not a purchasable shipyard action.
 function grantBlueprint(state,target){
  if(!/^[2-5]$/.test(String(target)))return{ok:false,message:'설계도 없음'};
  target=Number(target);if(target<=tier(state)||planOwned(state,target))return{ok:false,message:'설계도 보유 또는 건조 완료'};
  const key='shipPlan'+target;state.questItems??={};state.questItems[key]={name:blueprints[key].name,quantity:1};
  return{ok:true,key};
 }
 function ensure(state){
  state.ship??={tier:1,parts:{},cabins:{}};state.ship.parts??={};state.ship.cabins??={};
  for(const[id,cabin]of Object.entries(cabins))if(cabin.preset)state.ship.cabins[id]={unlocked:true,fitted:true};
  return state.ship;
 }
 function stats(state){
  const hull=hulls[tier(state)-1];
  // Hull slots are optional rooms; the three mandatory presets are always additional.
  const specialGood=fitted(state,'specialHold')&&own(goodCatalog,state.ship.cabins.specialHold.good)?state.ship.cabins.specialHold.good:null;
  const capacity=hull.capacity+level(state,'cargoFrame')*12+Object.entries(cabins).reduce((sum,[id,c])=>sum+(c.warehouse&&fitted(state,id)?c.warehouse:0),0);
  return{tier:tier(state),name:hull.name,slots:hull.slots+3,used:count(state),
   capacity,specialGood,specialCapacity:specialGood?30:0,totalCapacity:capacity+(specialGood?30:0),negotiation:fitted(state,'accounting')?.05:0,
   speed:hull.speed*(1+level(state,'sails')*.04+(fitted(state,'chartroom')?.03:0)),
   turn:hull.turn*(1+level(state,'rudder')*.05+(fitted(state,'chartroom')?.08:0)),
   hullDamage:(1-level(state,'planking')*.05)*(fitted(state,'workshop')?.85:1),
   crewDamage:fitted(state,'infirmary')?.8:1,food:fitted(state,'galley')?.9:1,morale:fitted(state,'quarters')?.85:1};
 }
 function cargoLoad(state,extra=[]){
  const cargo=Object.assign(Object.create(null),state.cargo||{});
  for(const row of extra)cargo[row.key]=num(cargo[row.key])+num(row.quantity);
  // Allocate matching cargo to dedicated slots first, then everything else to general capacity.
  const s=stats(state),total=Object.values(cargo).reduce((a,b)=>a+num(b),0),dedicated=s.specialGood?Math.min(num(cargo[s.specialGood]),s.specialCapacity):0;
  return{...s,total,dedicated,generalUsed:total-dedicated};
 }
 function cargoFits(state,extra=[],capacity=stats(state).capacity){return cargoLoad(state,extra).generalUsed<=capacity}
 function cargoRoom(state,key,extra=[],capacity=stats(state).capacity){
  const load=cargoLoad(state,extra);if(load.generalUsed>capacity)return 0;
  return Math.max(0,capacity-load.generalUsed)+(key===load.specialGood?load.specialCapacity-load.dedicated:0);
 }
 function cabinState(state,id,{good}={}){
  const rooms={...state.ship?.cabins},was=rooms[id],unlocked=!!was?.unlocked;
  if(good!==undefined)rooms.specialHold={...rooms.specialHold,good};
  else{
   const fitting=!unlocked||!fitted(state,id);
   rooms[id]={...was,unlocked:true,fitted:fitting};
   if(fitting&&cabins[id].warehouse)for(const[other,c]of Object.entries(cabins))if(other!==id&&c.warehouse&&rooms[other])rooms[other]={...rooms[other],fitted:false};
  }
  return{...state,ship:{...state.ship,cabins:rooms}};
 }
 function quote(state,action,id){
  if(action==='build'){
   const next=tier(state)+1,target=id==null||id===''?next:Number(id);
   if(next>5)return{ok:false,message:'최종 선박'};
   if(target!==next)return{ok:false,message:'이전 단계 선박 필요'};
   const hull=hulls[target-1];return{ok:true,target,planKey:'shipPlan'+target,cost:hull.price,materials:{...hull.materials},label:'선박 건조'};
  }
  if(action==='part'&&own(parts,id)){
   const next=level(state,id)+1,item=parts[id];
   if(next>5)return{ok:false,message:'최대 강화'};
   if(next>tier(state))return{ok:false,message:`선체 ${next}단계 필요`};
   return{ok:true,cost:item.cost*next*next,materials:Object.fromEntries(Object.entries(item.materials).map(([key,n])=>[key,n*next])),label:next===1?'제작':'강화'};
  }
  if(action==='cabin'&&own(cabins,id)){
   const item=cabins[id],unlocked=!!state.ship?.cabins?.[id]?.unlocked;
   if(item.preset)return{ok:false,message:'기본 선실'};
   if(tier(state)<item.tier)return{ok:false,message:`선체 ${item.tier}단계 필요`};
   if(id==='specialHold'&&!fitted(state,id)&&!own(goodCatalog,state.ship?.cabins?.specialHold?.good))return{ok:false,message:'품목 선택 필요'};
   const proposed=cabinState(state,id);
   if(count(proposed)>stats(proposed).slots)return{ok:false,message:'선실 공간 부족'};
   if(!cargoFits(proposed))return{ok:false,message:'화물칸 부족'};
   return{ok:true,cost:unlocked?0:item.cost,materials:{},label:unlocked?(fitted(state,id)?'해제':'배치'):'해금'};
  }
  if(action==='special-good'){
   if(tier(state)<4)return{ok:false,message:'선체 4단계 필요'};
   if(!own(goodCatalog,id))return{ok:false,message:'품목 선택 필요'};
   if(!cargoFits(cabinState(state,'specialHold',{good:id})))return{ok:false,message:'화물칸 부족'};
   return{ok:true,cost:0,materials:{},label:'품목 선택'};
  }
  if(action==='repair')return state.hull<100?{ok:true,cost:Math.max(1,Math.ceil((100-state.hull)*3)),materials:{},label:'수리'}:{ok:false,message:'수리 완료'};
  return{ok:false,message:'작업 불가'};
 }
 function check(state,action,id){
  const q=quote(state,action,id);if(!q.ok)return q;
  if(q.planKey&&!planOwned(state,q.target))return{...q,ok:false,message:'설계도 필요'};
  if(!Number.isFinite(state.gold)||state.gold<q.cost)return{...q,ok:false,message:'골드 부족'};
  if(Object.entries(q.materials).some(([key,n])=>num(state.cargo?.[key])<n))return{...q,ok:false,message:'자재 부족'};
  return q;
 }
 function transact(state,action,id,{consume=null,sync=()=>{}}={}){
  const q=check(state,action,id);if(!q.ok)return q;
  if(Object.keys(q.materials).length&&typeof consume!=='function')return{ok:false,message:'자재 처리 불가'};
  // Validate everything before charging or changing the hull. Trade lots use the game's FIFO remover.
  const ship=ensure(state);for(const[key,n]of Object.entries(q.materials))consume(key,n);state.gold-=q.cost;
  if(action==='build'){
   state.questItems[q.planKey].quantity--;if(!state.questItems[q.planKey].quantity)delete state.questItems[q.planKey];
   ship.tier=q.target;state.hull=100;
  }
  if(action==='part')ship.parts[id]=level(state,id)+1;
  if(action==='cabin')ship.cabins=cabinState(state,id).ship.cabins;
  if(action==='special-good')ship.cabins=cabinState(state,'specialHold',{good:id}).ship.cabins;
  if(action==='repair')state.hull=100;
  state.capacity=stats(state).capacity;sync();return{ok:true,message:action==='build'?hulls[q.target-1].name+' 건조 완료':q.label+' 완료'};
 }
 function mitigate(state,event){
  const s=stats(state),effects={...event.effects};
  for(const[key,factor]of [['hull',s.hullDamage],['crew',s.crewDamage],['morale',s.morale]])if(effects[key]<0)effects[key]=-Math.max(1,Math.round(-effects[key]*factor));
  const labels=event.labels.map(label=>{const map={선체:'hull',선원:'crew',사기:'morale'};return label.replace(/^(선체|선원|사기) −\d+$/,(_,name)=>`${name} −${-effects[map[name]]}`)});
  return{...event,effects,labels};
 }
 const art=(key,name,className='')=>window.ROTTA_SHIPYARD_ART?.image(key,name,className)||'';
 const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const cabinImage=id=>'cabin-'+({captain:'chartroom',supplies:'hold',firstOfficer:'quarters',smallHold:'hold',largeHold:'hold',accounting:'chartroom',specialHold:'hold'}[id]||id);
 const cabinEffect=(state,id)=>id==='specialHold'&&goodCatalog[state.ship?.cabins?.specialHold?.good]?`${goodCatalog[state.ship.cabins.specialHold.good].name} +30`:cabins[id].effect;
 function specialSelect(state){
  const selected=state.ship?.cabins?.specialHold?.good;
  return`<select class="special-cargo-select" aria-label="특수 화물실 품목" data-special-good ${tier(state)<4?'disabled':''}><option value="" ${!selected?'selected':''} disabled>품목 선택</option>${Object.entries(goodCatalog).sort((a,b)=>a[1].name.localeCompare(b[1].name,'ko')).map(([key,g])=>`<option value="${escape(key)}" ${selected===key?'selected':''}>${escape(g.name)}</option>`).join('')}</select>`;
 }
 function vesselPortrait(state){return`<div class="vessel-portrait"><span class="vessel-rank" aria-label="${tier(state)}단계">${'ⅠⅡⅢⅣⅤ'[tier(state)-1]}</span>${art('hull-'+tier(state),hulls[tier(state)-1].name,'vessel-portrait-image')}</div>`}
 // An engraved deck plan, not a cartoon vessel or a claim to an exact archaeological reconstruction.
 function plan(state){
  const t=tier(state),stations=2+Math.floor(t/2),rooms=Object.keys(cabins).filter(id=>fitted(state,id));
  return`<svg class="vessel-plan" viewBox="0 0 240 430" role="img" aria-label="${hulls[t-1].name} 갑판 배치"><path class="plan-hull" d="M120 18C65 54 45 117 45 215L58 363Q120 412 182 363L195 215C195 117 175 54 120 18Z"/><path d="M120 25V397M62 360Q120 390 178 360M56 310h128M47 215h146M57 119h126M72 78h96M63 343h114"/>${Array.from({length:stations},(_,i)=>{const y=102+i*210/(stations-1);return`<path d="M28 ${y}h184M35 ${y+7}h170"/><circle cx="120" cy="${y}" r="8"/>`}).join('')}${rooms.map((id,i)=>`<g transform="translate(${i%2?126:68} ${144+Math.floor(i/2)*64})"><rect width="46" height="48" rx="2"/><text x="23" y="28">${cabins[id].name.slice(0,3)}</text></g>`).join('')}<path d="M120 18V2M105 391v20h30v-20"/></svg>`;
 }
 function summary(state){const s=stats(state);return`<div class="vessel-summary"><strong>Santa Rotta</strong><span>${s.name} · ${s.tier}단계</span><dl><div><dt>선체</dt><dd>${Math.round(state.hull)}%</dd></div><div><dt>화물</dt><dd title="일반 ${s.capacity}${s.specialGood?' · '+escape(goodCatalog[s.specialGood].name)+' 전용 '+s.specialCapacity:''}">${Object.values(state.cargo||{}).reduce((a,b)=>a+num(b),0)} / ${s.totalCapacity}</dd></div><div><dt>속력</dt><dd>${Math.round(s.speed*100)}%</dd></div><div><dt>선실</dt><dd>${s.used} / ${s.slots}</dd></div></dl></div>`}
 let yardTab='parts',shipTab='parts',config=null,overlay=null,previousFocus=null,inertStates=[];
 const tabs=(selected,attribute)=>`<div class="vessel-tabs">${[['hulls',attribute==='data-yard-tab'?'건조':'선박'],['parts','파츠'],['cabins','선실']].map(([id,label])=>`<button type="button" ${attribute}="${id}" aria-pressed="${selected===id}">${label}</button>`).join('')}</div>`;
 function construction(state,target,editable){
  const hull=hulls[target-1],plan=planOwned(state,target),ready=check(state,'build',String(target));
  const material=(key,name,have,need)=>`<div class="build-material ${have<need?'lacking':''}" title="${name}">${art('material-'+key,name)}<span><span class="build-material-name">${name}</span><b>${fmt(have)}/${fmt(need)}</b></span></div>`;
  return`<div class="build-requirements">${material('blueprint',blueprints['shipPlan'+target].name,plan,1)}${Object.entries(hull.materials).map(([key,n])=>material(key,names[key],num(state.cargo?.[key]),n)).join('')}</div>${editable&&target===tier(state)+1?`<div class="build-actions"><button type="button" class="yard-work" data-yard-action="build" data-yard-id="${target}" ${ready.ok?'':'disabled'} title="${ready.message||'선박 건조'}">선박 건조</button></div>`:''}`;
 }
 function cards(state,tab,editable){
  const button=(action,id)=>{const q=quote(state,action,id),ready=check(state,action,id),label=action==='cabin'?(state.ship?.cabins?.[id]?.unlocked?(fitted(state,id)?'해제':'배치'):'해금'):(q.ok?q.label:q.message);return editable?`<button type="button" class="yard-work" data-yard-action="${action}" data-yard-id="${id}" ${ready.ok?'':'disabled'} title="${ready.message||q.label}">${label}${q.ok&&q.cost?` · ${fmt(q.cost)} G`:''}</button>`:''};
  if(tab==='hulls')return`<div class="hull-ladder">${hulls.map((h,i)=>editable&&i+1<=tier(state)&&!(i===4&&tier(state)===5)?'':`<article class="vessel-card hull-card ${i+1===tier(state)?'current':''}"><div class="hull-art"><span class="hull-number">${'ⅠⅡⅢⅣⅤ'[i]}</span>${art('hull-'+(i+1),h.name)}</div><div class="hull-copy"><h3>${h.name}</h3><p>화물 ${h.capacity} · 선실 ${h.slots+3}</p><span class="hull-price">${i+1===tier(state)?'운용 중':i+1<tier(state)?'이전 선박':'건조비 '+fmt(h.price)+' G'}</span>${i+1>tier(state)?construction(state,i+1,editable):''}</div></article>`).join('')}</div>`;
  const catalog=tab==='parts'?parts:cabins;
  return`<div class="vessel-cards ${tab==='parts'?'parts-cards':'cabin-cards'}">${Object.entries(catalog).map(([id,item])=>{const part=tab==='parts',lv=level(state,id),q=quote(state,part?'part':'cabin',id),status=part?`${lv} / 5`:item.preset?'기본 탑재':fitted(state,id)?'배치 중':state.ship?.cabins?.[id]?.unlocked?'미배치':'미해금';return`<article class="vessel-card ${part?'part-card':'cabin-card'} ${!part&&fitted(state,id)?'current':''}"><div class="vessel-item-art">${art(part?'part-'+id:cabinImage(id),item.name)}</div><div class="vessel-item-copy"><div class="vessel-card-top"><h3>${item.name}</h3><span>${status}</span></div>${!item.preset?`<p>${part?item.effect+' / 단계':escape(cabinEffect(state,id))}</p>`:''}${part?`<div class="part-levels" aria-label="${lv}단계">${Array.from({length:5},(_,i)=>`<i class="${i<lv?'filled':''}"></i>`).join('')}</div>`:''}${editable&&q.materials?`<div class="yard-materials">${Object.entries(q.materials).map(([key,n])=>`<span class="${num(state.cargo?.[key])<n?'lacking':''}">${names[key]} ${num(state.cargo?.[key])}/${n}</span>`).join('')}</div>`:''}${!part&&!item.preset?`<small class="cabin-tier">선체 ${item.tier}단계</small>`:''}${editable&&id==='specialHold'?specialSelect(state):''}${!item.preset?button(part?'part':'cabin',id):''}</div></article>`}).join('')}</div>`;
 }
 function renderYard(container,{state,onAction,goods}){
  if(goods)setGoods(goods);
  window.ROTTA_SHIPYARD_ART?.materials(container.closest('.facility-panel')||container);
  container.innerHTML=`${tabs(yardTab,'data-yard-tab')}<div class="vessel-scroll">${cards(state,yardTab,true)}</div>`;
  container.querySelectorAll('[data-yard-tab]').forEach(b=>b.onclick=()=>{yardTab=b.dataset.yardTab;renderYard(container,{state,onAction})});
  container.querySelectorAll('[data-yard-action]').forEach(b=>b.onclick=()=>{if(!b.disabled)onAction(b.dataset.yardAction,b.dataset.yardId)});
  container.querySelectorAll('[data-special-good]').forEach(select=>select.onchange=()=>{if(onAction('special-good',select.value)===false)select.value=state.ship?.cabins?.specialHold?.good||''});
 }
 function renderSide(container,state,{onAction}={}){
  const rooms=Object.entries(cabins).filter(([id])=>fitted(state,id));
  const repair=`<button class="yard-work yard-repair" type="button" data-yard-action="repair" data-yard-id="" ${check(state,'repair').ok?'':'disabled'}>${state.hull>=100?'수리 완료':`수리 · ${fmt(quote(state,'repair').cost)} G`}</button>`;
  container.innerHTML=`<div class="vessel-side">${vesselPortrait(state)}<div class="vessel-side-details">${summary(state)}${repair}</div><div class="vessel-fitted">${rooms.map(([id,c])=>`<div title="${escape(cabinEffect(state,id))}">${art(cabinImage(id),c.name)}<span>${c.name}</span></div>`).join('')}${Array.from({length:Math.max(0,stats(state).slots-rooms.length)},()=>'<i class="vessel-empty-slot" aria-hidden="true"></i>').join('')}</div></div>`;
  container.querySelectorAll('[data-yard-action="repair"]').forEach(button=>button.onclick=()=>{if(!button.disabled)onAction?.('repair','')});
 }
 function refresh(){
  if(!overlay||overlay.hidden)return;
  window.ROTTA_SHIPYARD_ART?.materials(overlay.querySelector('.ship-dialog'));
  const state=config.state(),body=overlay.querySelector('.ship-dialog-body'),html=`<aside>${vesselPortrait(state)}${summary(state)}</aside><section>${tabs(shipTab,'data-ship-tab')}<div class="vessel-scroll">${cards(state,shipTab,false)}</div></section>`;
  if(body.innerHTML===html)return;body.innerHTML=html;
  body.querySelectorAll('[data-ship-tab]').forEach(b=>b.onclick=()=>{shipTab=b.dataset.shipTab;refresh();overlay.querySelector(`[data-ship-tab="${shipTab}"]`).focus({preventScroll:true})});
 }
 function open(){
  if(!config?.canOpen()||!overlay.hidden)return;previousFocus=document.activeElement;config.beforeOpen();
  inertStates=[document.querySelector('#game'),document.querySelector('.topbar')].map(node=>[node,node.inert]);inertStates.forEach(([node])=>node.inert=true);
  overlay.hidden=false;refresh();overlay.querySelector('[data-ship-close]').focus({preventScroll:true});
 }
 function close(restore=true){if(!overlay||overlay.hidden)return;overlay.hidden=true;inertStates.forEach(([node,value])=>node.inert=value);inertStates=[];if(restore)(previousFocus?.isConnected&&!previousFocus.disabled&&!previousFocus.closest?.('#playerMenu')?previousFocus:document.querySelector('#playerMenuToggle'))?.focus({preventScroll:true});previousFocus=null}
 function handleKey(e){
  if(!overlay||overlay.hidden)return false;if(e.ctrlKey||e.metaKey||e.altKey||e.isComposing)return true;
  if(e.key==='Escape'||e.code==='KeyL'){e.preventDefault();if(!e.repeat)close();return true}
  if(e.key==='Tab'){const buttons=[...overlay.querySelectorAll('button:not(:disabled)')],index=buttons.indexOf(document.activeElement);e.preventDefault();buttons[(index+(e.shiftKey?-1:1)+buttons.length)%buttons.length]?.focus({preventScroll:true});return true}
  if(['ArrowLeft','ArrowRight'].includes(e.key)&&e.target.closest?.('[data-ship-tab]')){e.preventDefault();const ids=['hulls','parts','cabins'];shipTab=ids[(ids.indexOf(shipTab)+(e.key==='ArrowRight'?1:2))%3];refresh();overlay.querySelector(`[data-ship-tab="${shipTab}"]`).focus();return true}
  if(!['Enter',' ','ArrowUp','ArrowDown','PageUp','PageDown'].includes(e.key)||e.repeat)e.preventDefault();return true;
 }
 function mount(options){
  if(overlay)return;config=options;overlay=document.createElement('div');overlay.className='ship-overlay';overlay.hidden=true;overlay.innerHTML='<section class="ship-dialog" role="dialog" aria-modal="true" aria-labelledby="shipDialogTitle"><header><h2 id="shipDialogTitle">선박</h2><button type="button" data-ship-close aria-label="선박 닫기">×</button></header><div class="ship-dialog-body"></div></section>';document.body.appendChild(overlay);
  overlay.querySelector('[data-ship-close]').onclick=()=>close();overlay.onclick=e=>{if(e.target===overlay)close()};
 }
 window.ROTTA_SHIPYARD={hulls,parts,cabins,blueprints,blueprintArt,grantBlueprint,planOwned,tier,level,fitted,ensure,setGoods,cargoLoad,cargoFits,cargoRoom,stats,quote,check,transact,mitigate,plan,renderYard,renderSide,mount,open,close,refresh,handleKey,get active(){return !!overlay&&!overlay.hidden}};
})();
