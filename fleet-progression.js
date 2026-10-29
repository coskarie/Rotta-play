(() => {
 'use strict';
 const MAX_LEVEL=50;
 // Game balance, not historical trade restrictions. Higher grades open buying, never trap owned cargo.
 const grades=[
  {rank:1,label:'Ⅰ',level:1,categories:['식료품','조미료','잡화','섬유']},
  {rank:2,label:'Ⅱ',level:5,categories:['가축','광석','공업품','주류']},
  {rank:3,label:'Ⅲ',level:10,categories:['의약품','염료','기호품','직물']},
  {rank:4,label:'Ⅳ',level:20,categories:['공예품','무기류']},
  {rank:5,label:'Ⅴ',level:30,categories:['향신료','향료','미술품']},
  {rank:6,label:'Ⅵ',level:40,categories:['귀금속','보석']},
  {rank:7,label:'Ⅶ',level:45,categories:['총포류']},
  {rank:8,label:'Ⅷ',level:50,categories:[]}
 ];
 const BALANCE={sailingUnitsPerXP:2,firstPortXP:80,profitRate:.12,unitsRate:1};
 const thresholds=[0];
 for(let level=1;level<MAX_LEVEL;level++)thresholds.push(thresholds.at(-1)+80+24*level+3*level*level);
 const maxXP=thresholds.at(-1),safe=value=>Number.isFinite(value)?Math.max(0,value):0;
 function ensure(state){
  const fleet=state.fleet??={xp:0,sailingRemainder:0,visited:{},earned:{sailing:0,discovery:0,trade:0}};
  fleet.xp=Math.min(maxXP,Math.floor(safe(fleet.xp)));fleet.sailingRemainder=safe(fleet.sailingRemainder)%BALANCE.sailingUnitsPerXP;
  fleet.visited??={};fleet.earned??={sailing:0,discovery:0,trade:0};return fleet;
 }
 function status(state){
  const fleet=ensure(state);let level=1;
  while(level<MAX_LEVEL&&fleet.xp>=thresholds[level])level++;
  const current=fleet.xp-thresholds[level-1],needed=level===MAX_LEVEL?0:thresholds[level]-thresholds[level-1];
  return{level,xp:fleet.xp,current,needed,progress:needed?current/needed:1,max:level===MAX_LEVEL};
 }
 function award(state,amount,source){
  const fleet=ensure(state),before=status(state).level,granted=Math.min(maxXP-fleet.xp,Math.floor(safe(amount)));
  if(granted){fleet.xp+=granted;fleet.earned[source]=safe(fleet.earned[source])+granted}
  return{granted,before,level:status(state).level};
 }
 function discover(state,port,{starting=false}={}){
  const fleet=ensure(state);if(!port||fleet.visited[port])return award(state,0,'discovery');
  fleet.visited[port]=true;return award(state,starting?0:BALANCE.firstPortXP,'discovery');
 }
 function sail(state,distance){
  if(!Number.isFinite(distance)||distance<=0)return award(state,0,'sailing');
  const fleet=ensure(state),total=fleet.sailingRemainder+distance;
  const xp=Math.floor((total+1e-9)/BALANCE.sailingUnitsPerXP);
  fleet.sailingRemainder=Math.max(0,total-xp*BALANCE.sailingUnitsPerXP);return award(state,xp,'sailing');
 }
 function saleXP({destination,quantity,lots,revenue}){
  // Read FIFO acquisition costs before cargo is removed. Unknown/reward origins earn no trade XP.
  let remaining=Math.floor(safe(quantity)),cost=0,eligible=0,profit=0;
  const averageUnit=safe(revenue)/(remaining||1);
  for(const lot of lots||[]){
   const take=Math.min(remaining,Math.floor(safe(lot.quantity)));remaining-=take;
   const unit=Number.isFinite(lot.unitSale)?safe(lot.unitSale):averageUnit;
   if(lot.origin&&lot.origin!==destination&&Number.isFinite(lot.unitCost)&&lot.unitCost>0&&unit>lot.unitCost){
    eligible+=take;cost+=take*lot.unitCost;profit+=take*(unit-lot.unitCost);
   }
   if(!remaining)break;
  }
  if(!eligible)return 0;
  // Cap profit credit at acquisition cost: event windfalls cannot skip the entire progression.
  return Math.floor(eligible*BALANCE.unitsRate+Math.min(profit,cost)*BALANCE.profitRate);
 }
 function requirement(good){
  const base=grades.find(grade=>grade.categories.includes(good?.category))||grades[0];
  if(good?.specialty&&['귀금속','보석','총포류'].includes(good.category))return grades[7];
  return base;
 }
 function canBuy(state,good){return !!good&&status(state).level>=requirement(good).level}
 function facilityOrder(port){
  const ids=['trade','shop','shipyard'];if(port.bank)ids.push('bank');
  if(port.mansion)ids.push('mansion');if(port.royal)ids.push('royal');return ids;
 }
 window.ROTTA_FLEET={MAX_LEVEL,maxXP,grades,BALANCE,thresholds,status,award,discover,sail,saleXP,requirement,canBuy,facilityOrder};
})();
