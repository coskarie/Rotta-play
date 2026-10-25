(function(){
 'use strict';
 // Balance, in chart-world sailing units (28 units = one game day).
 const BALANCE=Object.freeze({nearby:180,scale:900,maxBonus:2});
 function create({ports,goods,table}){
  const index=new Map((table?.ids||[]).map((id,i)=>[id,i])),supplies=new Map(),nearest=new Map(),factors=new Map();
  for(const[id,p]of Object.entries(ports))for(const key of Object.keys(p.market||{}))if(goods[key]){if(!supplies.has(key))supplies.set(key,[]);supplies.get(key).push(id)}
  function distance(a,b){
   const i=index.get(a),j=index.get(b);if(i==null||j==null)return Infinity;
   for(const[id,k]of [[a,i],[b,j]]){const p=ports[id],dock=table.docks[k];if(!p||!dock||Math.abs((p.navX??p.x)-dock[0])>.01||Math.abs((p.navY??p.y)-dock[1])>.01)return Infinity}
   const d=table.rows[i]?.[j];return Number.isFinite(d)&&d>=0?d:Infinity;
  }
  function nearestSupply(id,key){
   const token=`${id}:${key}`;if(nearest.has(token))return nearest.get(token);
   let best=Infinity;for(const source of supplies.get(key)||[])best=Math.min(best,distance(source,id));
   nearest.set(token,best);return best;
  }
  function factor(origin,destination,key){
   const token=`${origin}:${destination}:${key}`;if(factors.has(token))return factors.get(token);
   let multiplier=1;const local=Object.prototype.hasOwnProperty.call(ports[destination]?.market||{},key),supply=local?0:nearestSupply(destination,key),route=distance(origin,destination);
   // Unknown cargo origins and unavailable/stale route data fail closed: no premium.
   if(!local&&ports[origin]&&Object.prototype.hasOwnProperty.call(ports[origin].market,key)&&Number.isFinite(route)&&supply>BALANCE.nearby){
    const effective=Math.min(route,supply),excess=Math.max(0,effective-BALANCE.nearby);
    multiplier=1+BALANCE.maxBonus*(1-Math.exp(-excess/BALANCE.scale));
   }
   factors.set(token,multiplier);return multiplier;
  }
  return{distance,nearestSupply,factor,balance:BALANCE};
 }
 window.ROTTA_DISTANCE_TRADE={create,balance:BALANCE};
})();
