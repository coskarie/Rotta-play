(function(){
 'use strict';
 const styles=['portugal','spain','england','france','ottoman'];
 const portScenes=["lisbon","porto","seville","marseille","bordeaux","london","barcelona","genoa","naples","venice","ragusa","istanbul","antwerp","hamburg","lubeck","copenhagen","stockholm","danzig"];
 const assets=portScenes.map(id=>({key:`mansion-port-${id}`,variable:`--mansion-port-${id}`,path:`assets/mansions/europe-v1/${id}.png`}));
 // Visual context only: this does not set sovereignty or change any port facility.
 const ports={
  portugal:['lisbon','porto','faro','madeira','ceuta','goa','diu','arguin','elmina','hormuz','malacca','sofala'],
  spain:['seville','malaga','valencia','barcelona','palma','laspalmas','havana','santiagodecuba','santodomingo','sanjuan','veracruz'],
  england:['london','bristol','plymouth','calais'],
  france:['marseille','montpellier','bordeaux','nantes'],
  ottoman:['istanbul','alexandria','cairo','thessaloniki','athens','trebizond','jaffa','beirut','jeddah','mecca','baghdad','basra']
 };
 const byPort=new Map(Object.entries(ports).flatMap(([style,ids])=>ids.map(id=>[id,style])));
 function resolve(id,port={},nation='portugal'){
  if(styles.includes(port.mansionStyle))return port.mansionStyle;
  return byPort.get(id)||(styles.includes(nation)?nation:'portugal');
 }
 function clear(scene){if(!scene)return;scene.classList.remove('mansion-interior');delete scene.dataset.mansionStyle;delete scene.dataset.mansionPort}
 function show(scene,facility,id,port,nation){
  if(facility!=='mansion')return clear(scene);
  if(!scene)return;
  clear(scene);
  scene.dataset.mansionStyle=resolve(id,port,nation);
  if(portScenes.includes(id))scene.dataset.mansionPort=id;
  scene.classList.add('mansion-interior');
 }
 window.ROTTA_MANSIONS={styles,portScenes,assets,resolve,show,clear};
})();
