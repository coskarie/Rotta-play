(function(root){
 'use strict';
 const STORAGE_KEY='rotta-chart-transfer-v1';
 const EUROPE_BOUNDS={west:-32,east:44,south:25,north:72};
 const MODES=['world','europe'];
 let options,group,overviewButton,buttons=[];
 const finite=value=>typeof value==='number'&&Number.isFinite(value);
 const mode=()=>root.ROTTA_EUROPE?.mode||(root.ROTTA_EUROPE?.isWorld?'world':'europe');
 const geographic=point=>point&&finite(point.lat)&&finite(point.lon)&&point.lat>=-90&&point.lat<=90&&point.lon>=-180&&point.lon<=180;
 const inEurope=point=>geographic(point)&&point.lon>=EUROPE_BOUNDS.west&&point.lon<=EUROPE_BOUNDS.east&&point.lat>=EUROPE_BOUNDS.south&&point.lat<=EUROPE_BOUNDS.north;
 function clone(value){
  return JSON.parse(JSON.stringify(value,(_key,item)=>{
   if(typeof item==='number'&&!Number.isFinite(item))throw Error('저장할 항해 상태를 확인하지 못했습니다.');
   return item;
  }));
 }
 function safeObject(value){
  if(!value||typeof value!=='object')return false;
  return Object.entries(value).every(([key,item])=>!['__proto__','prototype','constructor'].includes(key)&&
   (item===null||typeof item!=='object'||safeObject(item)));
 }
 function valid(snapshot){
  const state=snapshot?.state,position=snapshot?.position,voyage=snapshot?.voyage;
  return snapshot?.version===1&&MODES.includes(snapshot.sourceMode)&&MODES.includes(snapshot.targetMode)&&
   snapshot.sourceMode!==snapshot.targetMode&&safeObject(state)&&!Array.isArray(state)&&
   typeof state.nation==='string'&&typeof state.current==='string'&&finite(state.gold)&&finite(state.year)&&finite(state.month)&&state.month>=1&&state.month<=12&&
   geographic(position)&&finite(position.heading)&&['sailing','port'].includes(snapshot.view)&&
   (!voyage||(geographic(voyage.position)&&finite(voyage.velocity)&&voyage.velocity>=0&&(voyage.portId===null||typeof voyage.portId==='string')))&&
   safeObject(snapshot);
 }
 function currentPosition(){
  const point=options?.position?.(),chart=root.ROTTA_EUROPE;
  if(!point||!finite(point.x)||!finite(point.y)||!finite(point.heading)||!chart?.unproject)return null;
  const result=chart.unproject(point.x,point.y);
  return geographic(result)?{lat:result.lat,lon:result.lon,heading:point.heading}:null;
 }
 function currentVoyage(){
  const course=options?.currentView?.()==='sailing'?options.voyage?.():null;
  if(!course?.point)return null;
  const destination=root.ROTTA_EUROPE.unproject(course.point.x,course.point.y);
  if(!geographic(destination))return null;
  return {portId:course.portId??null,position:destination,confirmArrival:!!course.confirmArrival,velocity:Math.max(0,Number(course.velocity)||0)};
 }
 function snapshotFor(targetMode){
  const state=options?.state?.(),position=currentPosition();
  if(!state?.nation||!position||!MODES.includes(targetMode)||targetMode===mode())return null;
  const sailing=options.currentView?.()==='sailing',voyage=currentVoyage();
  if(targetMode==='europe'&&(!inEurope(position)||(voyage&&!inEurope(voyage.position))))return null;
  const snapshot={version:1,sourceMode:mode(),targetMode,state:clone(state),position,
   view:sailing?'sailing':'port',voyage,extras:clone(options.extras?.()||{})};
  return valid(snapshot)?snapshot:null;
 }
 function transfer(targetMode){
  if(options?.canTransfer&&!options.canTransfer())return false;
  try{
   const snapshot=snapshotFor(targetMode);if(!snapshot)return false;
   root.sessionStorage.setItem(STORAGE_KEY,JSON.stringify(snapshot));
   if(options.beforeTransfer?.()===false){root.sessionStorage.removeItem(STORAGE_KEY);return false;}
   const url=new URL(root.location.href);url.searchParams.set('map',targetMode);
   root.location.assign(url.href);return true;
  }catch(error){options?.onError?.('지도 전환을 저장하지 못했습니다. 다시 시도해 주세요.');return false;}
 }
 function peek(){
  try{
   const raw=root.sessionStorage.getItem(STORAGE_KEY);if(!raw)return null;
   const snapshot=JSON.parse(raw);
   return valid(snapshot)&&snapshot.targetMode===mode()?snapshot:null;
  }catch(_){return null;}
 }
 function complete(){
  try{root.sessionStorage.removeItem(STORAGE_KEY);return true;}catch(_){return false;}
 }
 function consume(){const snapshot=peek();if(snapshot)complete();return snapshot;}
 function refresh(){
  if(!group||!options)return;
  const started=!!options.state?.()?.nation,position=started?currentPosition():null;
  const voyage=started?currentVoyage():null,overseas=!!voyage&&!inEurope(voyage.position);
  const blocked=!!(options.canTransfer&&!options.canTransfer());
  const hidden=!started;
  if(group.hidden!==hidden)group.hidden=hidden;
  for(const button of buttons){
   const selected=button.dataset.chartMode===mode(),europe=button.dataset.chartMode==='europe',unavailable=europe&&(!inEurope(position)||overseas);
   const disabled=selected||unavailable||blocked;
   if(button.disabled!==disabled)button.disabled=disabled;
   const pressed=String(selected);if(button.getAttribute('aria-pressed')!==pressed)button.setAttribute('aria-pressed',pressed);
   const title=europe&&overseas?'유럽 밖 목적지로 항해 중입니다. 항해를 마치거나 취소한 뒤 전환하세요.':unavailable?'유럽 해역에 진입하면 상세 항해 지도로 전환할 수 있습니다.':selected?'현재 항해 지도':'선박과 항해 상태를 이어서 지도 전환';
   if(button.title!==title)button.title=title;
  }
  if(overviewButton){
   const hidden=!root.ROTTA_EUROPE?.isWorld;
   if(overviewButton.hidden!==hidden)overviewButton.hidden=hidden;
   overviewButton.disabled=blocked||typeof options.overview!=='function';
  }
 }
 function mount(configuration){
  options=configuration;
  if(!group){
   const container=root.document?.querySelector('.top-actions');if(!container)return;
   group=root.document.createElement('nav');group.className='chart-mode-switch';group.hidden=true;group.setAttribute('aria-label','항해 지도');
   for(const chartMode of MODES){
    const button=root.document.createElement('button');button.type='button';button.dataset.chartMode=chartMode;
    button.textContent=chartMode==='world'?'세계 항해':'유럽 항해';button.setAttribute('aria-pressed','false');button.onclick=()=>transfer(chartMode);
    group.appendChild(button);buttons.push(button);
   }
   overviewButton=root.document.createElement('button');overviewButton.type='button';overviewButton.className='chart-overview';
   overviewButton.textContent='세계 전도';overviewButton.title='전체 세계지도를 한눈에 봅니다.';
   overviewButton.onclick=()=>{if(!overviewButton.disabled)options.overview?.();};
   group.appendChild(overviewButton);container.prepend(group);
  }
  refresh();
 }
 const api={mount,refresh,transfer,peek,complete,consume,inEurope,validate:valid,STORAGE_KEY};
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.ROTTA_CHART_TRANSFER=api;
})(typeof window==='undefined'?globalThis:window);
