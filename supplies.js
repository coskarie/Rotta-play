(() => {
 'use strict';
 const limit=99;
 const catalog=Object.freeze({
  rationBiscuit:{name:'소형 식량',recipe:'선박용 비스킷',group:'food',grade:1,price:20,primary:'food',effects:{food:10},path:'assets/supplies/v1/ration-biscuit.png'},
  rationSalted:{name:'중형 식량',recipe:'염장육 · 말린 콩 · 비스킷',group:'food',grade:2,price:36,primary:'food',effects:{food:24,morale:2},path:'assets/supplies/v1/ration-salted.png'},
  rationVoyage:{name:'대형 식량',recipe:'보존식 · 치즈 · 올리브유',group:'food',grade:3,price:60,primary:'food',effects:{food:45,morale:5},path:'assets/supplies/v1/ration-voyage.png'},
  driedFruit:{name:'건과일 꾸러미',recipe:'건포도 · 선원용 간식',group:'gear',price:28,primary:'morale',effects:{morale:16},good:'raisin'},
  repairKit:{name:'응급 수리구',recipe:'목재 · 역청 · 쇠못',group:'gear',price:66,primary:'hull',effects:{hull:18},path:'assets/supplies/v1/repair-kit.png'},
  sailCloth:{name:'돛 수선재',recipe:'돛감 · 밧줄 · 바늘',group:'gear',price:120,primary:'hull',effects:{hull:36},path:'assets/supplies/v1/sail-cloth.png'},
  firstAid:{name:'구급함',recipe:'붕대 · 치료 물자',group:'gear',price:200,eventOnly:true,description:'선원 치료',effects:{},path:'assets/supplies/v1/first-aid.png'},
  bailingBucket:{name:'통',recipe:'물을 퍼내는 나무 통',group:'gear',price:2,eventOnly:true,description:'침수 대응',effects:{},path:'assets/supplies/v1/bailing-bucket.png'},
  ratPoison:{name:'쥐약',recipe:'선창 방역 물자',group:'gear',price:5,eventOnly:true,description:'쥐떼 대응',effects:{},path:'assets/supplies/v1/rat-poison.png'}
 });
 for(const item of Object.values(catalog)){Object.freeze(item.effects);Object.freeze(item)}
 const assets=Object.values(catalog).filter(item=>item.path).map(item=>({path:item.path}));
 const count=value=>Number.isSafeInteger(Number(value))?Math.max(0,Number(value)):0;
 const labels={food:'식량',morale:'사기',hull:'선체'};
 const owned=(state,id)=>count(state.tools?.[id]?.quantity);
 const effectText=effects=>Object.entries(effects).map(([key,value])=>`${labels[key]} +${value}`).join(' · ');
 const description=item=>item.description||effectText(item.effects);
 function maximum(state,id){const item=Object.hasOwn(catalog,id)?catalog[id]:null;return item?Math.max(0,Math.min(limit-owned(state,id),Math.floor(count(state.gold)/item.price))):0}
 function buy(state,id,quantity){
  const item=Object.hasOwn(catalog,id)?catalog[id]:null;
  if(!item||!Number.isSafeInteger(quantity)||quantity<1)return{ok:false,message:'수량을 확인해 주세요.'};
  if(quantity>maximum(state,id))return{ok:false,message:owned(state,id)+quantity>limit?'보관 한도 초과':'골드 부족'};
  const total=item.price*quantity;
  state.tools??={};state.tools[id]={name:item.name,quantity:owned(state,id)+quantity};state.gold-=total;
  return{ok:true,total,message:`${item.name} ×${quantity}`};
 }
 function canUse(state,id){const item=Object.hasOwn(catalog,id)?catalog[id]:null;return !!item&&!item.eventOnly&&owned(state,id)>0&&Number.isFinite(state[item.primary])&&state[item.primary]<100}
 function use(state,id){
  const item=Object.hasOwn(catalog,id)?catalog[id]:null;if(!canUse(state,id))return{ok:false,message:item?.eventOnly?'이벤트 대응 물자':item?`${labels[item.primary]} 가득`:'사용할 수 없습니다.'};
  const effects={};
  for(const [key,value]of Object.entries(item.effects)){const before=Number.isFinite(state[key])?Math.max(0,Math.min(100,state[key])):0;effects[key]=Math.min(value,100-before);state[key]=before+effects[key]}
  state.tools[id].quantity--;if(!state.tools[id].quantity)delete state.tools[id];
  return{ok:true,effects,message:effectText(Object.fromEntries(Object.entries(effects).filter(([,value])=>value>0)))};
 }
 // Only explicitly tagged incidents consume a countermeasure; rendering never consumes it.
 const responses=Object.freeze({
  treatment:{id:'firstAid',effects:{crew:-2,morale:-3},body:'선창에 열병이 번졌다. 구급함으로 환자를 돌봐 손실을 줄였다.',labels:['선원 −2','사기 −3']},
  flooding:{id:'bailingBucket',effects:{hull:-6,gold:-40},body:'큰 물결이 갑판을 덮쳤다. 통으로 물을 퍼내 피해를 줄였다.',labels:['선체 −6','수리비 40']},
  rats:{id:'ratPoison',effects:{food:-2,morale:0},body:'쥐떼가 식량을 갉아먹었다. 쥐약으로 확산을 막았다.',labels:['식량 −2']}
 });
 function resolveEvent(state,event){
  const response=Object.hasOwn(responses,event.supplyResponse)?responses[event.supplyResponse]:null;
  if(!response||!owned(state,response.id))return event;
  state.tools[response.id].quantity--;if(!state.tools[response.id].quantity)delete state.tools[response.id];
  return{...event,effects:{...event.effects,...response.effects},body:response.body,labels:[...response.labels,`${catalog[response.id].name} −1`]};
 }
 function art(id){const item=Object.hasOwn(catalog,id)?catalog[id]:null;if(!item?.path)return null;return `<img class="good-art supply-art" src="${window.ROTTA_GOODS_CACHE?.source(item.path)||`${item.path}?v=29`}" alt="${item.name}">`}
 let category='all';const quantities=new Map();
 function render(container,inventory,{state,goodArt,onBuy,onUse}){
  const image=id=>art(id)||goodArt(catalog[id].good);
  container.innerHTML=`<div class="shop-status">${['food','morale','hull'].map(key=>`<div><span>${labels[key]}</span><b>${Math.round(state[key])}%</b><i><em style="width:${Math.max(0,Math.min(100,state[key]))}%"></em></i></div>`).join('')}</div><div class="shop-tabs" role="group" aria-label="상점 분류">${[['all','전체'],['food','식량'],['gear','물자']].map(([id,name])=>`<button type="button" data-shop-category="${id}" aria-pressed="${category===id}">${name}</button>`).join('')}</div><div class="shop-grid">${Object.entries(catalog).filter(([,item])=>category==='all'||item.group===category).map(([id,item])=>{
   const max=maximum(state,id),quantity=Math.max(1,Math.min(max||1,quantities.get(id)||1));quantities.set(id,quantity);
   return `<article class="shop-card" data-supply="${id}"><div class="shop-art">${image(id)}${item.grade?`<span class="shop-grade grade-${item.grade}" aria-label="${item.grade}등급">${'ⅠⅡⅢ'[item.grade-1]}</span>`:''}</div><h3 title="${item.recipe}">${item.name}</h3><p class="shop-effect">${description(item)}</p><div class="shop-quantity"><button type="button" data-shop-step="-1" aria-label="${item.name} 수량 줄이기">−</button><input type="number" min="1" max="${max}" step="1" value="${quantity}" inputmode="numeric" aria-label="${item.name} 수량" ${max?'':'disabled'}><button type="button" data-shop-step="1" aria-label="${item.name} 수량 늘리기">＋</button></div><button type="button" class="shop-buy" data-supply-buy="${id}" ${max?'':'disabled'}>구입 · <b>${item.price*quantity}</b> G</button></article>`;
  }).join('')}</div>`;
  container.querySelectorAll('[data-shop-category]').forEach(button=>button.onclick=()=>{category=button.dataset.shopCategory;render(container,inventory,{state,goodArt,onBuy,onUse})});
  container.querySelectorAll('[data-supply]').forEach(card=>{
   const id=card.dataset.supply,input=card.querySelector('input'),buyButton=card.querySelector('[data-supply-buy]'),max=maximum(state,id);
   const sync=()=>{const value=Number(input.value),valid=Number.isSafeInteger(value)&&value>0&&value<=max;buyButton.disabled=!valid;buyButton.querySelector('b').textContent=String(valid?value*catalog[id].price:catalog[id].price);if(valid)quantities.set(id,value);card.querySelectorAll('[data-shop-step]').forEach(button=>button.disabled=!max||(Number(button.dataset.shopStep)<0?value<=1:value>=max))};
   input.oninput=sync;input.onchange=()=>{input.value=String(Math.max(1,Math.min(max||1,Math.floor(Number(input.value))||1)));sync()};
   card.querySelectorAll('[data-shop-step]').forEach(button=>button.onclick=()=>{input.value=String(Math.max(1,Math.min(max||1,(Number(input.value)||1)+Number(button.dataset.shopStep))));sync()});
   buyButton.onclick=()=>{if(!buyButton.disabled)onBuy(id,Number(input.value))};sync();
  });
  const entries=Object.entries(catalog).filter(([id])=>owned(state,id));
  inventory.innerHTML=entries.length?entries.map(([id,item])=>`<div class="shop-owned-row">${image(id)}<div><b>${item.name} <small>×${owned(state,id)}</small></b><span>${description(item)}</span></div>${item.eventOnly?'':`<button type="button" data-supply-use="${id}" ${canUse(state,id)?'':'disabled'} aria-label="${item.name} 사용">사용</button>`}</div>`).join(''):'<div class="cargo-empty"><span>◇</span><b>없음</b></div>';
  inventory.querySelectorAll('[data-supply-use]').forEach(button=>button.onclick=()=>onUse(button.dataset.supplyUse));
 }
 window.ROTTA_SUPPLIES={catalog,assets,limit,owned,maximum,buy,use,canUse,resolveEvent,art,effectText,description,render};
})();
