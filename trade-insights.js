(() => {
 'use strict';
 const count=value=>Number.isFinite(value)?Math.max(0,Math.floor(value)):0;
 const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
 const number=value=>Math.round(value).toLocaleString('ko-KR');
 const signed=value=>(value>0?'+':value<0?'−':'')+number(Math.abs(value));
 function slices(lots,quantity,offset=0){
  let remaining=count(quantity),skip=count(offset);const rows=[];
  for(const lot of lots||[]){
   const available=count(lot.quantity),ignored=Math.min(skip,available);skip-=ignored;
   const take=Math.min(remaining,available-ignored);if(take)rows.push({...lot,quantity:take});
   remaining-=take;if(!remaining)break;
  }
  if(remaining)rows.push({origin:null,unitCost:null,quantity:remaining});return rows;
 }
 function basis(lots,quantity,offset=0){
  const rows=slices(lots,quantity,offset);let known=0,cost=0,unknown=0;
  for(const row of rows)if(Number.isFinite(row.unitCost)&&row.unitCost>=0){known+=row.quantity;cost+=row.quantity*row.unitCost}else unknown+=row.quantity;
  return{quantity:count(quantity),known,unknown,complete:unknown===0,cost:unknown?null:cost,knownCost:cost};
 }
 function unitCostLabel(lots,quantity){
  const rows=slices(lots,quantity),cost=basis(rows,quantity);
  if(!cost.quantity||!cost.complete)return '—';
  const prices=rows.map(row=>row.unitCost),low=Math.min(...prices),high=Math.max(...prices);
  return low===high?number(low):`${number(low)}–${number(high)}`;
 }
 function suppliers(ports,key,canSupply=()=>true){return Object.entries(ports).filter(([id,port])=>Object.hasOwn(port.market||{},key)&&canSupply(id,key)).map(([id,port])=>({id,name:port.name}))}
 function routes({ports,key,from,quantity=1,lots,engine,quote,canSell=()=>true,limit=3}){
  quantity=count(quantity);
  if(!ports[from]||!engine?.distance||!engine?.factor||typeof quote!=='function'||!quantity)return [];
  const rows=slices(lots,quantity),cost=basis(rows,quantity),offers=[];
  for(const [id,port]of Object.entries(ports)){
   if(id===from||!canSell(id,key))continue;
   const distance=engine.distance(from,id);if(!Number.isFinite(distance)||distance<=.001)continue;
   const price=quote(id,key);if(!Number.isFinite(price)||price<1)continue;
   let revenue=0,valid=true;
   for(const row of rows){
    const factor=engine.factor(row.origin,id,key);if(!Number.isFinite(factor)||factor<1){valid=false;break}
    revenue+=row.quantity*Math.max(1,Math.floor(price*factor+1e-8));
   }
   if(!valid||!Number.isSafeInteger(revenue))continue;
   const days=distance/28,profit=cost.complete?revenue-cost.cost:null;
   offers.push({id,name:port.name,distance,days,revenue,unit:Math.floor(revenue/quantity),profit,score:(profit??revenue)/Math.max(1,days)});
  }
  // Profitable routes rank by gross profit per sailing day. If none profit, show the least loss,
  // not a distant loss made to look attractive merely by dividing it by a very long voyage.
  const profitable=offers.filter(row=>row.profit===null||row.profit>0),ranked=profitable.length?profitable:offers;
  ranked.sort((a,b)=>(profitable.length?b.score-a.score:b.profit-a.profit)||b.revenue-a.revenue||a.distance-b.distance||a.id.localeCompare(b.id));
  return ranked.slice(0,Math.max(0,count(limit)));
 }
 function ledgerMarkup({lots,quantity,offset=0,revenue}){
  const cost=basis(lots,quantity,offset);
  if(!cost.quantity)return '';
  if(!cost.complete)return '<small class="cargo-cost" title="취득 원가를 모르는 화물">원가 —</small>';
  const profit=revenue-cost.cost,style=profit>0?'gain':profit<0?'loss':'even';
  return `<small class="cargo-cost" title="표시 수량의 매입 원가 · 현재 항구 예상 차익 · 항해 비용 제외">원가 ${number(cost.cost)} · <span class="trade-${style}">${signed(profit)} G</span></small>`;
 }
 function render(model){
  const {name,category,grade,origin,specialty,season,volatility=1,ports=[],offers=[],buyPrice,art,restriction=''}=model;
  const days=value=>value<1?'1일 미만':`${Math.ceil(value)}일`;
  return `<header class="trade-insight-heading"><div class="trade-insight-art">${art||''}</div><div><h2 id="tradeInsightTitle">${escape(name)}</h2><p>${escape(category)}${model.levelLocked?` · Lv.${grade.level}`:''}</p>${specialty?'<span class="trade-specialty-seal">명산품</span>':''}</div></header>
   <dl class="trade-insight-facts">${origin?`<div><dt>산지</dt><dd>${escape(origin)}</dd></div>`:''}<div><dt>구매가</dt><dd>${restriction?'—':number(buyPrice)}</dd></div><div><dt>계절</dt><dd>${escape(season||'—')}</dd></div><div><dt>변동성</dt><dd class="trade-volatility" aria-label="가격 변동 ${volatility}/3">${[1,2,3].map(level=>`<i${level<=volatility?' class="filled"':''}></i>`).join('')}</dd></div></dl>
   ${restriction?`<p class="trade-policy-note">${escape(restriction)}</p>`:''}<details class="trade-insight-suppliers"><summary>취급 항구 ${ports.length}</summary><p>${ports.map(port=>escape(port.name)).join(' · ')||'—'}</p></details>
   <section class="trade-insight-routes"><h3 title="현재 차익과 항해 거리를 함께 비교">판매처</h3><div class="trade-route-head"><span>항구</span><span>항해</span><span>판매가</span><span>예상 차익</span></div>${offers.length?offers.map(row=>`<div class="trade-route-row" data-offer-port="${escape(row.id)}"><strong>${escape(row.name)}</strong><span>${days(row.days)}</span><span>${number(row.unit)}</span><b class="trade-${row.profit>0?'gain':row.profit<0?'loss':'even'}">${row.profit===null?'—':signed(row.profit)}</b></div>`).join(''):`<p class="trade-routes-empty">${restriction?'현지 매입 불가':'확인된 항로 없음'}</p>`}<p class="trade-insight-note">1개 기준 · 현재 시세 · 항해 비용 제외</p></section>`;
 }
 let active=null;
 function close(restoreFocus=true){
  if(!active)return;
  const task=active;active=null;task.root.hidden=true;task.root.onclick=null;task.close.onclick=null;
  for(const [node,inert]of task.inert)node.inert=inert;
  task.body.replaceChildren();
  if(restoreFocus&&task.trigger?.isConnected&&!task.trigger.disabled)task.trigger.focus({preventScroll:true});
 }
 function open(model,{trigger=document.activeElement}={}){
  close(false);const root=document.querySelector('#tradeInsightOverlay'),body=document.querySelector('#tradeInsightBody'),button=document.querySelector('#tradeInsightClose');
  if(!root||!body||!button)return false;
  const inert=[document.querySelector('#game'),document.querySelector('.topbar')].filter(Boolean).map(node=>[node,node.inert]);
  active={root,body,close:button,trigger,inert};for(const [node]of inert)node.inert=true;
  body.innerHTML=render(model);root.hidden=false;button.onclick=()=>close();root.onclick=event=>{if(event.target===root)close()};button.focus({preventScroll:true});return true;
 }
 function handleKey(event){
  if(!active)return false;
  if(event.ctrlKey||event.metaKey||event.altKey||event.isComposing)return true;
  if(event.key==='Escape'){event.preventDefault();if(!event.repeat)close();return true}
  if(event.key==='Tab'){
   event.preventDefault();const items=[active.close,active.body.querySelector('summary')].filter(Boolean),index=items.indexOf(document.activeElement);
   items[(index+(event.shiftKey?-1:1)+items.length)%items.length].focus({preventScroll:true});return true;
  }
  if(!['Enter',' ','ArrowUp','ArrowDown','PageUp','PageDown','Home','End'].includes(event.key)||event.repeat&&['Enter',' '].includes(event.key))event.preventDefault();
  return true;
 }
 window.ROTTA_TRADE_INSIGHTS={basis,unitCostLabel,routes,suppliers,signed,ledgerMarkup,render,open,close,handleKey,get active(){return !!active}};
})();
