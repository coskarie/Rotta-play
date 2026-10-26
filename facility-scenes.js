(function(){
 'use strict';
 // Shared continental art direction only; never changes facility availability or sovereignty.
 const regions=['north-europe','south-europe','africa','asia','north-america','south-america','oceania'];
 const facilities=['shipyard','bank'];
 const assets=regions.flatMap(region=>facilities.map(facility=>({
  key:`facility-${facility}-${region}`,variable:`--facility-${facility}-${region}`,
  path:`assets/facilities/continental-v1/${facility}-${region}.webp`,region,facility
 })));
 const byKey=new Map(assets.map(asset=>[`${asset.facility}:${asset.region}`,asset]));
 const catalog=new Map((window.ROTTA_PORT_CATALOG||[]).map(row=>[row[0],row[4]]));
 const core={london:'north-europe',lisbon:'south-europe',seville:'south-europe',marseille:'south-europe',istanbul:'south-europe',alexandria:'africa',goa:'asia',calicut:'asia',malacca:'asia',macao:'asia',nagasaki:'asia',mozambique:'africa',zanzibar:'africa',havana:'north-america',veracruz:'north-america',bahia:'south-america'};
 // The legacy catalog groups these northern Pacific ports with South America.
 const northernPacific=new Set(['panama','guatemala','acapulco','sanfrancisco']);
 function resolve(id,port={}){
  if(core[id])return core[id];
  if(northernPacific.has(id))return 'north-america';
  if(id==='jaffa'||id==='beirut')return 'asia';
  const region=catalog.get(id)||port.region||'';
  if(region==='북해/발트해')return 'north-europe';
  if(region==='이베리아/서지중해'||region==='동지중해/흑해')return 'south-europe';
  if(/아프리카/.test(region))return 'africa';
  if(region==='홍해/페르시아만')return ['massawa','suakin'].includes(id)?'africa':'asia';
  if(/인도|아시아/.test(region))return 'asia';
  if(/오세아니아|남태평양/.test(region))return 'oceania';
  if(/북미|카리브/.test(region))return 'north-america';
  if(/남미|브라질/.test(region))return 'south-america';
  return null; // Unknown ports retain their own harbor; never borrow the player's nation.
 }
 function clear(scene){
  if(!scene)return;
  scene.classList.remove('facility-interior');
  delete scene.dataset.facilityScene;delete scene.dataset.facilityRegion;
  scene.style.removeProperty('--facility-image');
 }
 function show(scene,facility,id,port={}){
  clear(scene);
  if(!scene||!facilities.includes(facility)||(facility==='bank'&&!port.bank))return;
  const region=resolve(id,port),asset=byKey.get(`${facility}:${region}`);
  if(!asset)return;
  scene.dataset.facilityScene=facility;scene.dataset.facilityRegion=region;
  scene.style.setProperty('--facility-image',`var(${asset.variable},url("${asset.path}"))`);
  scene.classList.add('facility-interior');
 }
 window.ROTTA_FACILITY_SCENES={regions,facilities,assets,resolve,show,clear};
})();
