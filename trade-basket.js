(() => {
 'use strict';
 const count=value=>Number.isFinite(Number(value))?Math.max(0,Math.floor(Number(value))):0;
 function create({context,buyPrice,sellQuote,stock,owned,hasGood,buyRoom=null,canLoad=null}){
  let port=null;const bags={buy:new Map(),sell:new Map()};
  function sync(){const next=context().port;if(port!==next){port=next;bags.buy.clear();bags.sell.clear()}return context()}
  function entries(side){sync();return [...bags[side]].map(([key,quantity])=>({key,quantity}))}
  function quantity(side,key){sync();return bags[side].get(key)||0}
  function maximum(side,key){
   const c=sync();if(!hasGood(key,side))return 0;
   if(side==='sell')return count(owned(key));
   let reserved=0,cost=0;const otherRows=[];
   for(const [other,qty]of bags.buy)if(other!==key){reserved+=qty;cost+=qty*buyPrice(other);otherRows.push({key:other,quantity:qty})}
   const price=buyPrice(key);if(!Number.isSafeInteger(price)||price<1)return 0;
   const room=buyRoom?count(buyRoom(key,otherRows)):count(c.capacity)-count(c.cargo)-reserved;
   return Math.max(0,Math.min(count(stock(key)),room,Math.floor((c.gold-cost)/price)));
  }
  function set(side,key,value){
   sync();if(!['buy','sell'].includes(side)||!hasGood(key,side))return 0;
   const qty=Math.min(count(value),maximum(side,key));
   if(qty)bags[side].set(key,qty);else bags[side].delete(key);return qty;
  }
  function plan(side){
   const c=sync(),rows=[];let total=0,units=0;
   for(const {key,quantity:qty}of entries(side)){
    if(!hasGood(key,side)||qty>maximum(side,key))return {ok:false,error:'수량을 다시 확인해 주세요.'};
    const quote=side==='buy'?{quantity:qty,unit:buyPrice(key),total:buyPrice(key)*qty}:sellQuote(key,qty);
    if(quote.quantity!==qty||!Number.isSafeInteger(quote.total)||quote.total<1)return {ok:false,error:'시세를 다시 확인해 주세요.'};
    rows.push({key,quantity:qty,...quote});total+=quote.total;units+=qty;
   }
   if(!rows.length)return {ok:false,error:'품목을 담아 주세요.'};
   if(side==='buy'&&(total>c.gold||(canLoad?!canLoad(rows):units+c.cargo>c.capacity)))return {ok:false,error:total>c.gold?'골드 부족':'화물칸 부족'};
   return {ok:true,side,port:c.port,rows,total,units,signature:JSON.stringify([c.port,side,rows.map(r=>[r.key,r.quantity,r.total])])};
  }
  function clear(side){sync();if(side)bags[side].clear();else{bags.buy.clear();bags.sell.clear()}}
  function total(side){return entries(side).reduce((sum,row)=>sum+(side==='buy'?buyPrice(row.key)*row.quantity:sellQuote(row.key,row.quantity).total),0)}
  return {entries,quantity,maximum,set,plan,clear,total};
 }
 let confirmation=null;
 function answer(accepted){
  if(!confirmation)return;
  const task=confirmation;confirmation=null;task.modal.hidden=true;task.game.inert=task.inert;
  task.yes.onclick=task.no.onclick=task.modal.onclick=null;
  if(accepted)task.commit();
  if(task.focus?.isConnected&&!task.focus.disabled)task.focus.focus({preventScroll:true});
  else (document.querySelector('#saleStallAction:not(:disabled)')||document.querySelector('#cargoPanelAction:not([hidden]):not(:disabled)')||document.querySelector('#cargoPanelBack:not([hidden])'))?.focus({preventScroll:true});
 }
 function confirm({side,html,total,commit}){
  if(confirmation)return;
  const modal=document.querySelector('#basketConfirmation'),game=document.querySelector('#game'),yes=document.querySelector('#basketYes'),no=document.querySelector('#basketNo');
  if(!modal||!game||!yes||!no)return;
  confirmation={modal,game,yes,no,commit,inert:game.inert,focus:document.activeElement};
  document.querySelector('#basketQuestion').textContent=side==='buy'?'매입하시겠습니까?':'매각하시겠습니까?';
  document.querySelector('#basketConfirmItems').innerHTML=html;document.querySelector('#basketConfirmTotal').textContent=total;
  game.inert=true;modal.hidden=false;yes.onclick=()=>answer(true);no.onclick=()=>answer(false);
  modal.onclick=event=>{if(event.target===modal)answer(false)};no.focus({preventScroll:true});
 }
 function handleKey(event){
  if(!confirmation)return false;
  if(event.ctrlKey||event.metaKey||event.altKey)return true;
  const key=({KeyY:'y',KeyN:'n'})[event.code]||event.key.toLowerCase();
  if(['y','n','escape'].includes(key)){event.preventDefault();if(!event.repeat)answer(key==='y');return true}
  if(event.key==='Tab'){event.preventDefault();(document.activeElement===confirmation.no?confirmation.yes:confirmation.no).focus({preventScroll:true});return true}
  if(window.ROTTA_DIALOGUE_INPUT?.handleKey(event,{buttons:[confirmation.yes,confirmation.no]}))return true;
  event.preventDefault();return true;
 }
 window.ROTTA_TRADE_BASKET={create,confirm,handleKey,cancel:()=>answer(false),get confirming(){return !!confirmation}};
})();
