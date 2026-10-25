(function(){
 'use strict';
 const audit=window.ROTTA_SPECIALTY_HISTORY;
 if(!audit)return;
 const additions=window.ROTTA_SPECIALTY_GOODS,markets={};
 window.ROTTA_HISTORY_MARKETS=markets;
 const active=audit.items.filter(r=>['add','rename','existing'].includes(r.status));
 const categoryPrices={'식료품':30,'조미료':32,'가축':74,'의약품':64,'잡화':31,'주류':49,'염료':58,'광석':53,'공업품':37,'기호품':39,'섬유':44,'직물':74,'공예품':76,'미술품':121,'향신료':61,'귀금속':118,'향료':78,'보석':142,'무기류':94,'총포류':108};
 const seasonalFruit=new Set(['가지','밤','링곤베리','망고','두리안','람부탄','리치','바나나','땅콩','호두','파인애플','타마린드','유자']);
 function profile(r){
  let season='none';
  if(seasonalFruit.has(r.name))season=['밤','땅콩','호두'].includes(r.name)?'nut':r.name==='유자'?'citrus':'fruit';
  else if(r.category==='향신료')season='spice';
  else if(['모헤어','비쿠냐털'].includes(r.name))season='shear';
  else if(['잇꽃','자근','오배자','헤나'].includes(r.name))season='dyeCrop';
  else if(['인삼','노니','아니카','콜키쿰'].includes(r.name))season='herb';
  const noise=['보석','미술품','귀금속'].includes(r.category)?.115:['향신료','향료','무기류','총포류'].includes(r.category)?.095:['광석','공업품','잡화','조미료'].includes(r.category)?.035:.065;
  return{season,noise,sensitivity:noise>=.09?1.15:noise<=.04?.7:.9};
 }
 for(const r of active){
  if(r.status!=='existing'){
   if(additions[r.key])throw Error(`Duplicate specialty key: ${r.key}`);
   additions[r.key]={name:r.displayName||r.name,category:r.category,base:r.base||categoryPrices[r.category],icon:'◇',specialty:true,
    originRegion:r.originPolity,sourceUrl:r.sourceUrls[0],referenceUrl:r.dbUrl,sourceNote:r.reasoning,
    stockScale:r.stockScale??(['미술품','보석','귀금속','무기류','총포류'].includes(r.category)?.45:.8),priceProfile:profile(r)};
  }
  // These ports represent regional supply/redistribution, not a claim of a dated sale at that quay.
  for(const id of r.ports)(markets[id]??={})[r.key]=(r.producerPorts||[]).includes(id)?.59:.73;
 }
 window.ROTTA_ENRICH_HISTORICAL_GOODS=function(goods){
  for(const r of active){const g=goods[r.key];if(!g)throw Error(`Missing historical commodity: ${r.key}`);
   // Keep established item names, categories and prices when aliases point to an existing good.
   Object.assign(g,{specialty:true,originRegion:r.originPolity,historicalSources:r.sourceUrls,historyNote:r.reasoning});
   if(!g.sourceUrl)g.sourceUrl=r.sourceUrls[0];
  }
  for(const correction of audit.corrections||[])if(goods[correction.key])Object.assign(goods[correction.key],{originRegion:correction.originPolity,historicalSources:correction.sourceUrls,historyNote:correction.reasoning,historicalDisposition:correction.action==='retire'?'deferred':'active'});
 };
 window.ROTTA_APPLY_HISTORICAL_PORTS=function(ports){
  for(const[id,market]of Object.entries(markets))if(ports[id])for(const[key,value]of Object.entries(market))if(!(key in ports[id].market))ports[id].market[key]=value;
  for(const correction of audit.corrections||[]){
   if(correction.action==='retire'||correction.action==='replaceMarkets'){
    for(const p of Object.values(ports))delete p.market[correction.key];
    for(const id of correction.ports||[])if(ports[id])ports[id].market[correction.key]=.73;
   }
  }
 };
 const previous=window.ROTTA_APPLY_SPECIALTY_DATA;
 window.ROTTA_APPLY_SPECIALTY_DATA=function(data){
  previous?.(data);if(!data||data.specialtyHistoryVersion===audit.version)return;
  for(const correction of audit.corrections||[])if(correction.clearProducers)for(const p of Object.values(data.ports))p.producers=p.producers.filter(key=>key!==correction.key);
  for(const r of active)for(const id of r.producerPorts||[]){const p=data.ports[id];if(p&&!p.producers.includes(r.key))p.producers.push(r.key)}
  const buckets={food:[],crop:[],spice:[],medicine:[],herb:[],fiber:[],dye:[],dyeCrop:[],wood:[],ore:[],metal:[],artisan:[],luxury:[],arms:[],alcohol:[],animal:[]};
  for(const r of active.filter(r=>r.status!=='existing')){
   const k=r.key,c=r.category;
   if(c==='식료품'||c==='기호품')buckets.food.push(k);
   if(seasonalFruit.has(r.name))buckets.crop.push(k);
   if(c==='향신료')buckets.spice.push(k);
   if(c==='의약품'){buckets.medicine.push(k);if(!['수은제','서각','용골'].includes(r.name))buckets.herb.push(k)}
   if(c==='섬유'||c==='직물')buckets.fiber.push(k);
   if(c==='염료')buckets.dye.push(k);
   if(['망고스틴','오배자','잇꽃','자근','헤나','로그우드'].includes(r.name))buckets.dyeCrop.push(k);
   if(['레드우드','등','향나무','황단'].includes(r.name))buckets.wood.push(k);
   if(['금 광석','은 광석'].includes(r.name))buckets.ore.push(k);
   if(r.name==='강철')buckets.metal.push(k);
   if(['공예품','미술품','직물','잡화'].includes(c))buckets.artisan.push(k);
   if(['미술품','보석','귀금속','직물'].includes(c))buckets.luxury.push(k);
   if(c==='무기류'||c==='총포류')buckets.arms.push(k);
   if(c==='주류')buckets.alcohol.push(k);
   if(c==='가축')buckets.animal.push(k);
  }
  const families={EV01:['crop','dyeCrop'],EV02:['crop','dyeCrop'],EV03:['crop'],EV06:['crop'],EV09:['spice'],EV13:['animal'],EV14:['animal'],EV16:['ore'],EV17:['ore'],EV18:['metal'],EV19:['artisan'],EV20:['wood'],EV22:['food'],EV24:['luxury','spice'],EV31:['food','fiber'],EV32:['arms','wood','metal'],EV33:['wood','metal'],EV34:['luxury','alcohol'],EV35:['food','medicine'],EV36:['fiber','dye'],EV37:['dye'],EV41:['medicine'],EV42:['herb'],EV45:['luxury'],EV46:['luxury'],EV50:['arms','metal','food']};
  for(const t of data.templates)if(families[t.id])t.keys=[...new Set([...(t.keys||[]),...families[t.id].flatMap(g=>buckets[g])])];
  data.specialtyHistoryVersion=audit.version;
 };
})();
