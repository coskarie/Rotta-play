(() => {
 'use strict';
 // Official market rules, not a claim that every historical resident observed a blanket ban.
 // Explicit port lists deliberately exclude Christian enclaves and mixed-trade exceptions.
 const groups={
  ottoman:['istanbul','trebizond','caffa','odesa','jaffa','beirut','algiers','alexandria','cairo','suakin','baghdad'],
  maghreb:['casablanca','tunis','benghazi'],
  arabian:['jeddah','mecca','aden','basra'],
  aceh:['aceh'],brunei:['brunei'],pattani:['pattani'],
  ming:['quanzhou','hangzhou','nanjing','chongqing','beijing']
 };
 const byPort=new Map(Object.entries(groups).flatMap(([group,ids])=>ids.map(id=>[id,group])));
 const islamic=new Set(['ottoman','maghreb','arabian','aceh','brunei','pattani']);
 const dryMarkets=new Set(['istanbul','cairo','baghdad','jeddah','mecca','aden','aceh','brunei']);
 const allow=Object.freeze({allowed:true,label:'',reason:''});
 function check(port,key,good,side='buy'){
  const group=byPort.get(port);
  if(islamic.has(group)&&key==='bacon')return {allowed:false,label:'취급 불가',reason:'공영시장 · 돼지고기 취급 제한',rule:'pork'};
  if(dryMarkets.has(port)&&good?.category==='주류')return {allowed:false,label:'취급 불가',reason:'공영시장 · 주류 취급 제한',rule:'alcohol'};
  // Buying from a port means taking the item out of that jurisdiction. Import sales remain legal.
  if(group==='ming'&&side==='buy'&&['무기류','총포류'].includes(good?.category))return {allowed:false,label:'반출 금지',reason:'명나라 · 군수품 반출 제한',rule:'arms-export'};
  return allow;
 }
 window.ROTTA_TRADE_POLICY={check,groups};
})();
