(function(){
 'use strict';
 // These are editable game-balance parameters, not reconstructed historical prices.
 const TYPES={
  '식료품':[.055,.85],'조미료':[.035,.65],'가축':[.07,.95],'의약품':[.075,1],
  '잡화':[.025,.55],'주류':[.045,.8],'염료':[.085,1.1],'광석':[.04,.75],
  '공업품':[.035,.65],'기호품':[.085,1.05],'섬유':[.06,.85],'직물':[.075,1],
  '공예품':[.045,.75],'미술품':[.13,1.25],'향신료':[.125,1.2],
  '귀금속':[.10,1.15],'향료':[.11,1.15],'보석':[.14,1.3],'무기류':[.1,1.2],'총포류':[.095,1.15]
 };
 const CURVES={
  grain:{label:'곡물 수확',values:[.04,.07,.10,.14,.18,.19,-.12,-.20,-.13,-.07,-.02,.01]},
  rice:{label:'벼 수확',values:[-.07,-.02,.03,.06,.10,.13,.16,.18,.08,-.14,-.20,-.13]},
  olive:{label:'올리브 수확',values:[-.15,-.10,-.05,.01,.06,.10,.14,.18,.16,.02,-.12,-.18]},
  nut:{label:'견과 수확',values:[.02,.05,.08,.10,.13,.16,.10,-.08,-.17,-.13,-.08,-.03]},
  fruit:{label:'과실 수확',values:[.02,.05,.08,.11,.14,.07,-.08,-.17,-.12,-.05,-.01,0]},
  grape:{label:'포도 수확',values:[-.04,-.02,.01,.03,.05,.07,.09,.10,.02,-.08,-.10,-.07]},
  citrus:{label:'감귤 수확',values:[-.15,-.13,-.08,-.02,.04,.09,.13,.15,.11,.04,-.06,-.12]},
  date:{label:'대추 수확',values:[.01,.04,.06,.09,.12,.15,.16,.06,-.15,-.18,-.12,-.05]},
  cane:{label:'사탕수수 수확',values:[-.08,-.10,-.11,-.07,-.01,.04,.07,.09,.11,.08,.02,-.04]},
  cotton:{label:'목화 수확',values:[-.05,0,.04,.07,.10,.14,.16,.10,-.03,-.16,-.18,-.11]},
  flax:{label:'섬유 수확',values:[.02,.05,.08,.12,.15,.09,-.10,-.16,-.12,-.07,-.03,0]},
  herb:{label:'약초 채집',values:[.08,.10,.08,.01,-.08,-.12,-.14,-.10,-.03,.02,.05,.07]},
  root:{label:'약근 수확',values:[.02,.04,.07,.10,.13,.16,.18,.08,-.08,-.15,-.10,-.03]},
  silkworm:{label:'양잠·고치',values:[.08,.10,.08,.01,-.08,-.12,-.10,-.08,-.05,.02,.05,.07]},
  dyeCrop:{label:'염료 작물 수확',values:[-.05,0,.04,.07,.10,.14,.16,.10,-.03,-.16,-.18,-.11]},
  honey:{label:'양봉·밀원',values:[.05,.07,.05,-.01,-.07,-.11,-.12,-.08,-.02,.01,.04,.05]},
  shear:{label:'양모·겨울 수요',values:[.08,.06,.02,-.03,-.10,-.15,-.12,-.07,0,.05,.09,.11]},
  winter:{label:'겨울 수요',demand:true,values:[.13,.10,.04,-.03,-.07,-.10,-.11,-.09,-.03,.05,.11,.15]},
  fish:{label:'어획·풍랑',values:[.10,.08,.04,-.01,-.05,-.08,-.10,-.07,-.02,.02,.06,.11]},
  tea:{label:'봄 차 수확',values:[.08,.11,.02,-.13,-.12,-.05,-.02,.02,.05,.07,.08,.08]},
  coffee:{label:'커피 수확',values:[-.13,-.08,-.02,.02,.06,.09,.11,.13,.07,-.04,-.12,-.15]},
  spice:{label:'산지 우기',climate:true},
  none:{label:'사건·수급',values:Array(12).fill(0)}
 };
 const OVERRIDES={};
 function group(keys,season,noise,sensitivity){for(const key of keys.split(' '))OVERRIDES[key]={season,noise,sensitivity}}
 group('wheat maize','grain',.055,.85);group('rice','rice',.065,.9);
 group('oliveOil','olive',.045,.8);group('almond hazelnut','nut',.06,.85);
 group('wine douroWine sherry raisin vinegar','grape',.04,.75);
 group('lemon','citrus',.065,.9);group('dates','date',.06,.85);group('fig marasca','fruit',.06,.85);
 group('sugar rum','cane',.06,.85);group('cotton','cotton',.075,.95);group('indigo woad','dyeCrop',.075,.95);
 group('flax hemp henequen','flax',.05,.8);group('sage rosemary','herb',.07,.95);group('ginseng','root',.09,1.05);group('camphor','none',.07,.95);group('honey','honey',.045,.75);
 group('wool','shear',.055,.85);group('fur coal whaleOil','winter',.055,.85);
 group('cod herring tuna caviar','fish',.06,.9);group('tea','tea',.085,1.05);
 group('coffee','coffee',.09,1.1);group('pepper clove nutmeg mace cinnamon cardamom saffron','spice',.125,1.2);
 group('rockSalt salt soap paper print parchment cannonball','none',.022,.5);
 group('iron copper tin lead ironOre timber cedar marble copperPlate','none',.035,.65);
 group('porcelain ceramic majolica bronze','none',.045,.75);
 group('silkThread','silkworm',.075,1);group('silk velvet lace carpet','none',.095,1.1);
 group('handCannon matchlock gunpowder sulfur','none',.1,1.2);
 group('silver gold','none',.11,1.15);group('pearl diamond coral ivory artwork marbleSculpture','none',.14,1.3);
 // Avalanche the final bits: adjacent day anchors must not produce nearly identical values.
 function hash(value){let h=2166136261;for(const c of String(value)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}h^=h>>>16;h=Math.imul(h,0x85ebca6b);h^=h>>>13;h=Math.imul(h,0xc2b2ae35);return(h^(h>>>16))>>>0}
 function noise(token,value){const n=Math.floor(value),t=value-n,s=t*t*(3-2*t),at=i=>(hash(`${token}:${i}`)/4294967295)*2-1;return at(n)*(1-s)+at(n+1)*s}
 function create({data,ports,goods,seed,effects,dateAt,day}){
  const profiles=new Map(),origins=new Map(),books=new Map(),localPairs=Object.entries(ports).flatMap(([id,p])=>Object.keys(p.market).filter(k=>goods[k]).map(k=>[id,k]));
  for(const[key,g]of Object.entries(goods)){
   const defaults=TYPES[g.category]||[.045,.75],o={...(OVERRIDES[key]||{}),...(g.priceProfile||{})};
   const amplitude=o.noise??defaults[0],sensitivity=o.sensitivity??defaults[1],season=o.season||'none';
   profiles.set(key,{noise:amplitude,sensitivity,season,label:amplitude<=.04?'변동 작음':amplitude>=.09?'변동 큼':'변동 보통',seasonLabel:CURVES[season].label});
  }
  function origin(id,key){
   const token=`${id}:${key}`;if(origins.has(token))return origins.get(token);
   const home=data.ports[id];let result={port:home,imported:false};
   if(home&&!home.producers.includes(key)){
    const source=Object.values(data.ports).filter(p=>p.producers.includes(key)).sort((a,b)=>distance(home,a)-distance(home,b))[0];
    if(source)result={port:source,imported:true};
   }
   origins.set(token,result);return result;
  }
  function distance(a,b){return (a.lat-b.lat)**2+((a.lon-b.lon)*Math.cos(a.lat*Math.PI/180))**2}
  function seasonality(id,key,date){
   const p=profiles.get(key),curve=CURVES[p.season];if(p.season==='none')return 1;
   const source=curve.demand?{port:data.ports[id],imported:false}:origin(id,key),geo=source.port;if(!geo)return 1;
   let m=date.month-1+(date.day-1)/31-(source.imported?2:0);if(geo.lat<0&&!curve.climate)m-=6;
   m=(m%12+12)%12;const i=Math.floor(m),f=m-i,s=f*f*(3-2*f);
   let values=curve.values;
   if(curve.climate){const rain=geo.p,mean=rain.reduce((a,b)=>a+b,0)/12;values=rain.map(v=>Math.max(-.11,Math.min(.11,(v-mean)/(mean+30)*.08)))}
   let seasonal=values[i]*(1-s)+values[(i+1)%12]*s;
   if(Math.abs(geo.lat)<15&&!curve.climate)seasonal*=.5;
   return 1+seasonal*(source.imported?.55:1);
  }
  function quote(id,key){
   const p=ports[id],g=goods[key],profile=profiles.get(key);if(!p||!g)return null;
   const d=day(),date=dateAt(d),e=effects(id,key),local=p.market[key]??(.94+(hash(id+key+seed)%67)/100);
   const n=.65*noise(`${seed}:${id}:${key}:short`,d/13)+.35*noise(`${seed}:${id}:${key}:long`,d/47);
   const value=g.base*local*seasonality(id,key,date)*(1+profile.noise*n)*Math.pow(e.price,profile.sensitivity);
   return{buy:Math.max(5,Math.round(value*(1+e.tax))),sell:Math.max(1,Math.floor(value*.85*(1-e.tax))),reasons:e.events.map(e=>e.name)};
  }
  function record(id,key){
   const q=quote(id,key);if(!q)return;const date=dateAt(day()),token=`${id}:${key}`,stamp=`${date.year}-${date.month}`;
   let bars=books.get(token);if(!bars){bars=[];books.set(token,bars)}
   let bar=bars[bars.length-1];
   if(!bar||bar.stamp!==stamp){bar={stamp,year:date.year,month:date.month,open:q.buy,high:q.buy,low:q.buy,close:q.buy,firstDay:day(),lastDay:day(),simulated:date.year<1543||(date.year===1543&&date.month<3),reasons:[]};bars.push(bar);if(bars.length>12)bars.shift()}
   bar.high=Math.max(bar.high,q.buy);bar.low=Math.min(bar.low,q.buy);bar.close=q.buy;bar.lastDay=day();
   for(const reason of q.reasons)if(!bar.reasons.includes(reason))bar.reasons.push(reason);
  }
  function recordDay(){for(const[id,key]of localPairs)record(id,key)}
  function recordPort(id){for(const key of Object.keys(ports[id]?.market||{}))record(id,key)}
  function series(id,key){record(id,key);return(books.get(`${id}:${key}`)||[]).map(b=>({...b,reasons:[...b.reasons]}))}
  return{quote,series,profile:key=>({...profiles.get(key)}),seasonality,recordDay,recordPort};
 }
 window.ROTTA_MARKET_PRICES={create};
})();
