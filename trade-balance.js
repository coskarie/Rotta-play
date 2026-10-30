(() => {
 'use strict';
 // Gold and weekly availability are game-balance values, not historical price claims.
 // Keep catalog base prices intact: apply this profile once at quote/stock evaluation.
 const profiles=Object.freeze([
  {rank:1,value:1,resale:.85,stock:1.25,maxStock:100},
  {rank:2,value:1.8,resale:.86,stock:1,maxStock:80},
  {rank:3,value:3.2,resale:.875,stock:.85,maxStock:60},
  {rank:4,value:5.5,resale:.89,stock:.65,maxStock:42},
  {rank:5,value:9,resale:.905,stock:.48,maxStock:28},
  {rank:6,value:15,resale:.92,stock:.32,maxStock:16},
  {rank:7,value:20,resale:.935,stock:.24,maxStock:12},
  {rank:8,value:32,resale:.95,stock:.16,maxStock:8}
 ].map(Object.freeze));
 function profile(good){return profiles[(window.ROTTA_FLEET?.requirement(good).rank||1)-1]||profiles[0]}
 function baseValue(good){return (Number.isFinite(good?.base)&&good.base>0?good.base:1)*profile(good).value}
 function stock(good,initial,eventFactor=1,purchased=0){
  const p=profile(good),scale=Number.isFinite(good?.stockScale)?Math.max(0,good.stockScale):1;
  if(!Number.isFinite(initial)||initial<=0||scale===0||!Number.isFinite(eventFactor)||eventFactor<=0)return 0;
  const normal=Math.max(1,Math.min(p.maxStock,Math.floor(initial*scale*p.stock)));
  const used=Number.isFinite(purchased)?Math.max(0,Math.floor(purchased)):0;
  // Events affect supply, then purchases debit it once. Basket reservations stay separate.
  return Math.max(0,Math.floor(normal*eventFactor)-used);
 }
 window.ROTTA_TRADE_BALANCE={profiles,profile,baseValue,stock};
})();
