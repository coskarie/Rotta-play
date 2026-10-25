(function(){
 'use strict';
 const labels={harbor:'기항지',trade:'교역도시',royal:'왕궁도시',fort:'요새항',settlement:'현지 취락'};
 // These records are historical visual contexts, not changes to available facilities.
 const contexts={
  ceuta:{kind:'fort',culture:'western',reason:'Portuguese fortified enclave; sixteenth-century landward defences.',sources:['https://turismodeceuta.com/ceuta/nuestras-perlas/ciudad-amurallada/']},
  elmina:{kind:'fort',culture:'western',reason:'São Jorge da Mina, founded in 1482.',sources:['https://gmmb.gov.gh/st-georges-castle-elmina-castle-elmina-1482/']},
  arguin:{kind:'fort',culture:'western',reason:'Fifteenth-century Portuguese fortified trading post.',sources:['https://www.fortmed.eu/OV/2023/BevilacquaMarcoGiorgioEdi_DefensiveArchitectureOfThe_20230520022511.pdf']},
  diu:{kind:'fort',culture:'western',reason:'Fort construction authorised in 1535; do not confuse this with the 1546 conquest.',sources:['https://diu.gov.in/history/']},
  malacca:{kind:'fort',culture:'western',reason:'Portuguese fortress begun in 1511; avoid later Dutch gate details.',sources:['https://whc.unesco.org/document/105988']},
  hormuz:{kind:'fort',culture:'western',reason:'Portuguese fortress works resumed in 1515, with further works in the 1520s.',sources:['https://hpip.org/en/heritage/details/1664']},
  sofala:{kind:'fort',culture:'western',reason:'Fort negotiated with the local ruler in 1505; surrounding African town retained.',sources:['https://eve.fcsh.unl.pt/en/places/sofala']},
  whanganui:{kind:'settlement',culture:'maori',reason:'Pre-European Māori river communities; present map name retained.',sources:['https://www.whanganui.govt.nz/files/assets/public/v/1/plans/long-term-plan-2021-2031-amended-volume-1.pdf']},
  wellington:{kind:'settlement',culture:'maori',reason:'Te Whanganui-a-Tara Māori settlement context, not the later European city.',sources:['https://wellington.govt.nz/-/media/recreation/enjoy-the-outdoors/walks-and-walkways/files/heritage-trails/teara.pdf']},
  ushuaia:{kind:'settlement',culture:'fuegian',reason:'Yaghan coastal camp context; branch/bark shelters and canoes, not the later Argentine city.',sources:['https://museomaritimo.com/indigenas','https://www.memoriachilena.gob.cl/602/w3-article-93793.html']}
 };
 const east=new Set(['macao','nagasaki','hanyang','dongnae','yeongil','jeju','quanzhou','hangzhou','nanjing','chongqing','beijing','edo','sakai','hakodate']);
 const islamic=new Set(['istanbul','alexandria','cairo','casablanca','algiers','tunis','tripoli','benghazi','trebizond','jaffa','beirut','zanzibar','kilwa','mombasa','malindi','mogadishu','massawa','suakin','jeddah','mecca','aden','socotra','muscat','hormuz','basra','baghdad']);
 const southeast=new Set(['malacca','aceh','pattani','ayutthaya','lopburi','jadin','jambi','palembang','batavia','surabaya','banjarmasin','makassar','ternate','ambon','banda','dili','brunei','manila']);
 const southAsia=new Set(['goa','calicut','diu','cochin','colombo','machilipatnam','konark','kolkata']);
 const pacific=new Set(['garua','samarai','finschhafen','kupang']);
 function culture(id,p){return contexts[id]?.culture||(east.has(id)?'east-asian':islamic.has(id)?'islamic':southeast.has(id)?'southeast-asian':southAsia.has(id)?'south-asian':pacific.has(id)?'pacific':p?.region==='서아프리카'||['capetown','natal','karibib'].includes(id)?'vernacular':'western')}
 function classify(id,p={}){
  const context=contexts[id],facilityCount=3+Number(!!p.royal)+Number(!!p.mansion)+Number(!!p.bank);
  // Royal access always wins. A settlement that later gains extra facilities becomes a local-style trading town.
  const kind=p.royal?'royal':context?.kind==='fort'?'fort':context?.kind==='settlement'&&facilityCount===3?'settlement':facilityCount>3?'trade':'harbor';
  return{kind,culture:culture(id,p),facilityCount,reason:p.royal?'Existing in-game royal facility (not a claim of historical capital status).':kind===context?.kind?context.reason:'Existing in-game facilities; not a historical population/wealth ranking.',sources:context?.sources||[]};
 }
 const mass=d=>`<path class="port-sigil-mass" d="${d}"/>`,line=d=>`<path class="port-sigil-line" d="${d}"/>`,cut=d=>`<path class="port-sigil-cut" d="${d}"/>`;
 // Building silhouettes rest on y=36; the shared marker origin stays fixed for anchors too.
 function harbor(){return '<path class="port-sigil-anchor" fill-rule="evenodd" clip-rule="evenodd" d="M18.5 12C16.5 11.3 15.5 9.7 15.5 8C15.5 5.5 17.5 3.5 20 3.5C22.5 3.5 24.5 5.5 24.5 8C24.5 9.7 23.5 11.3 21.5 12V16H28V19H21.5V30.8C25.6 30 28.8 27.5 29.7 23.8L27 24.8L31 19L35 24.7L32.4 24C31.6 29.5 27.4 33 22 34.2L20 36L18 34.2C12.6 33 8.4 29.5 7.6 24L5 24.7L9 19L13 24.8L10.3 23.8C11.2 27.5 14.4 30 18.5 30.8V19H12V16H18.5ZM22.2 8A2.2 2.2 0 1 1 17.8 8A2.2 2.2 0 1 1 22.2 8Z"/>'}
 function trade(c){
  if(c==='southeast-asian')return mass('M4 23L13 10L22 23V36H4ZM22 21L29 8L36 21V36H22Z')+cut('M10 28H16V36H10ZM27 27H32V36H27Z');
  if(c==='east-asian')return mass('M6 22H34V36H6ZM3 22L11 18L20 10L29 18L37 22Z')+cut('M17 28H23V36H17Z');
  if(c==='islamic'||c==='south-asian')return mass('M5 18H14V36H5ZM14 23V14Q20 7 26 14V36H14ZM26 18H35V36H26Z')+cut('M17 36V29Q20 24 23 29V36Z');
  if(c==='pacific'||c==='maori'||c==='vernacular')return mass('M4 24L13 13L23 24V36H4ZM23 22L29 13L36 22V36H23Z')+cut('M10 28H16V36H10Z');
  return mass('M4 18L14 9L24 18V36H4ZM27 20L31 11L35 20V36H27Z')+cut('M11 27H18V36H11Z');
 }
 function royal(c){
  if(c==='southeast-asian')return mass('M5 27H35V36H5ZM3 27L12 21L20 7L28 21L37 27ZM10 19L20 5L30 19L26 21H14Z')+cut('M17 29H23V36H17Z');
  if(c==='east-asian')return mass('M5 26H35V36H5ZM3 26L9 24L20 16L31 24L37 26ZM9 17L20 10L31 17L27 19H13Z')+cut('M17 28H23V36H17Z');
  if(c==='islamic'||c==='south-asian')return mass('M5 18L8.5 11L12 18V36H5ZM28 18L31.5 11L35 18V36H28ZM12 23H28V36H12ZM13 21Q12 15 20 10Q28 15 27 21Z')+line('M20 10V6')+cut('M17 36V29Q20 23 23 29V36Z');
  if(['maori','fuegian','pacific','vernacular'].includes(c))return mass('M6 24L20 9L34 24V36H6Z')+cut('M17 26H23V36H17Z');
  return mass('M5 17L9 9L13 17V36H5ZM27 17L31 9L35 17V36H27ZM14 15H26V36H14Z')+line('M20 15V4L26 6L20 8')+cut('M17 36V29Q20 24 23 29V36Z');
 }
 function fort(){return mass('M4 17H10V22H15V18H25V22H30V17H36V36H4Z')+cut('M17 36V29Q20 24 23 29V36Z')}
 function settlement(c){
  if(c==='fuegian')return mass('M4 36L7 24L14 17L23 24L26 36ZM25 36L28 26L32 23L36 28L38 36Z')+cut('M16 36V29L19 27L21 30V36Z');
  return mass('M3 27L14 14L26 27V36H3ZM26 27L31 20L38 27V36H26Z')+line('M14 14V8M9 18L19 28M19 18L9 28')+cut('M10 29H17V36H10Z');
 }
 function roofBoundary(kind,c){
  let d='';
  if(kind==='trade')d=c==='southeast-asian'?'M4 23H22M22 21H36':c==='east-asian'?'M3 22H37':c==='islamic'||c==='south-asian'?'M14 14H26':['pacific','maori','vernacular'].includes(c)?'M4 24H23M23 22H36':'M4 18H24M27 20H35';
  else if(kind==='royal')d=c==='southeast-asian'?'M3 27H37M10 19H30':c==='east-asian'?'M3 26H37M9 17H31':c==='islamic'||c==='south-asian'?'M5 18H12M28 18H35M13 21H27':['maori','fuegian','pacific','vernacular'].includes(c)?'M6 24H34':'M5 17H13M27 17H35';
  else if(kind==='settlement'&&c!=='fuegian')d='M3 27H26M26 27H38';
  return d?`<path class="port-sigil-roof" d="${d}"/>`:'';
 }
 const cached=new Map();
 function markup(id,p){const info=classify(id,p),key=`${info.kind}:${info.culture}`;if(!cached.has(key)){const shape=info.kind==='royal'?royal(info.culture):info.kind==='trade'?trade(info.culture):info.kind==='fort'?fort():info.kind==='settlement'?settlement(info.culture):harbor(info.culture),outline=shape.replace(/<path class="port-sigil-cut"[^>]*\/>/g,'');cached.set(key,`<svg class="port-symbol" data-symbol-kind="${info.kind}" viewBox="0 0 40 44" focusable="false" aria-hidden="true"><g class="port-symbol-outline">${outline}</g><g class="port-symbol-ink">${shape}${roofBoundary(info.kind,info.culture)}</g></svg>`)}return cached.get(key)}
 window.ROTTA_PORT_SYMBOLS={labels,contexts,classify,markup};
})();
