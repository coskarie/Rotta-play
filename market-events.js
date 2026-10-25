(function(){
 'use strict';
 const DAY=86400000,EPOCH=Date.UTC(1543,2,1);
 const OPENING_GRACE_DAYS=30;
 const openingProtected=day=>day<OPENING_GRACE_DAYS;
 // Discrete shocks, including windfalls, are separate from normal seasonal prices.
 function isMajorEvent(t){const price=t.price??1,stock=t.stock??1,demand=t.demand??1;return t.family==='war'||price<=.8||price>=1.2||stock<=.65||stock>=1.35||demand<=.8||demand>=1.2||(t.tax||0)>=.1}
 const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
 function hash(value){let h=2166136261;for(const c of String(value)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
 function random(seed){let n=hash(seed);return()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296}}
 function dateAt(day){const d=new Date(EPOCH+day*DAY);return{year:d.getUTCFullYear(),month:d.getUTCMonth()+1,day:d.getUTCDate()}}
 function create({data,ports,goods,seed=1,warmup=true,ambient=true,openingProtection=true}){
  let day=warmup?-120:0,nextId=1;
  const protectedNow=()=>openingProtection&&openingProtected(day);
  // Apply the same rule to simulated prehistory so no shock/cooldown leaks into March.
  const allowed=template=>!protectedNow()||!isMajorEvent(template);
  const active=[],history=[],cooldowns=new Map(),weather=new Map(),cache=new Map(),byId=new Map(data.templates.map(t=>[t.id,t]));
  let effectIndex=null;
  const portIds=Object.keys(ports).filter(id=>data.ports[id]);
  const prices=window.ROTTA_MARKET_PRICES?.create({data,ports,goods,seed,effects,dateAt,day:()=>day});
  const neighbours=new Map();
  for(const id of portIds){const p=data.ports[id];neighbours.set(id,portIds.filter(k=>k!==id).map(k=>{
   const q=data.ports[k],dx=(p.lon-q.lon)*Math.cos(p.lat*Math.PI/180),dy=p.lat-q.lat;
   return{id:k,d:Math.hypot(dx,dy)};
  }).filter(q=>q.d<22).sort((a,b)=>a.d-b.d).slice(0,5).map(q=>q.id))}
  function climate(id,month){const p=data.ports[id],i=month-1,total=p.p.reduce((a,b)=>a+b,0),mean=total/12,rain=p.p[i];
   return{t:p.t[i],tn:p.tn[i],rain,total,dry:total>=250&&(rain<60&&rain<=mean*.5),wet:total>=250&&rain>=Math.max(60,mean*.9),
    spring:p.lat>=0?[3,4,5].includes(month):[9,10,11].includes(month),
    beforeWinter:p.lat>=0?[9,10,11].includes(month):[3,4,5].includes(month)};
  }
  function eligible(template,id,date=dateAt(day),w=weather.get(id)||{rainFactor:1,temperature:20,dryDays:0,wind:0}){
   if(!template||!ports[id]||!data.ports[id])return[];
   const p=data.ports[id],c=climate(id,date.month),local=Object.keys(ports[id].market);
   let keys=(template.keys||local).filter(key=>goods[key]&&local.includes(key));
   if(template.family==='production')keys=keys.filter(key=>p.producers.includes(key));
   if(!keys.length)return[];
   let allowed=true;
   switch(template.mode){
    case 'any':break;
    case 'followup':return[];
    case 'dry':allowed=c.total>=250&&c.t>=18&&(c.dry||c.rain<2*c.t)&&w.dryDays>=3;break;
    case 'wet':allowed=c.wet&&w.rainFactor>=1.8;break;
    case 'frost':case 'vineFrost':allowed=c.spring&&c.tn<=8&&w.temperature<0;break;
    case 'saltRain':allowed=c.rain>=60&&w.rainFactor>=1.4;break;
    case 'locust':allowed=p.lat>=5&&p.lat<=35&&p.lon>=-20&&p.lon<=80&&c.total<=1500&&c.rain>=20&&c.t>20&&w.rainFactor>1.3;break;
    case 'oliveHarvest':allowed=p.oliveHarvest.includes(date.month);break;
    case 'harvest':case 'caneHarvest':case 'herbHarvest':case 'resinSeason':allowed=p.harvest.includes(date.month);break;
    case 'spiceStress':allowed=(c.wet&&w.rainFactor>1.8)||(w.dryDays>=3&&c.t>20);break;
    case 'fishing':case 'pearlSeason':allowed=w.wind<.45;break;
    case 'seaStorm':allowed=w.wind>.85&&(c.t<18||c.wet);break;
    case 'silkworm':allowed=c.t>=15&&c.t<=30;break;
    case 'warmStorage':allowed=c.t>=20;break;
    case 'winterStock':allowed=Math.abs(p.lat)>=23.5&&Math.min(...p.t)<15&&c.beforeWinter;break;
    default:allowed=false;
   }
   return allowed?keys:[];
  }
  function add(template,id,keys,duration,rng){
   if(!template||!allowed(template)||!keys.length||active.filter(e=>e.portId===id).length>=3)return null;
   if(active.some(e=>e.portId===id&&e.templateId===template.id))return null;
   const end=day+(duration||template.duration[0]+Math.floor(rng()*(template.duration[1]-template.duration[0]+1)));
   const record={id:nextId++,templateId:template.id,portId:id,name:template.name,keys:[...keys],start:day,end,
    price:template.price,stock:template.stock,demand:template.demand,tax:template.tax||0,family:template.family};
   active.push(record);history.push({...record});if(history.length>180)history.shift();
   cooldowns.set(`${id}:${template.id}`,end+18);cache.clear();effectIndex=null;return record;
  }
  function start(templateId,id,{force=false,keys:specified,duration}={}){
   const template=byId.get(templateId);if(!template||!allowed(template)||!ports[id])return null;
   const rng=random(`${seed}:${day}:${id}:${templateId}:${nextId}`);
   let keys=force?(template.keys||Object.keys(ports[id].market)).filter(k=>goods[k]&&k in ports[id].market):eligible(template,id);
   if(specified)keys=keys.filter(k=>specified.includes(k));
   if(template.family==='war'&&template.id==='EV50')keys=Object.keys(ports[id].market);
   if(!force&&(cooldowns.get(`${id}:${templateId}`)||-Infinity)>day)return null;
   if(templateId==='EV50'&&active.some(e=>e.portId===id&&e.family==='war'))return null;
   // An incident affects actual selected cargo/commodities, not every item on Earth.
   const broad=['EV23','EV25','EV25b','EV26','EV28','EV29','EV30','EV36','EV37','EV39','EV40','EV49'].includes(templateId);
   if(broad&&keys.length>2){const at=Math.floor(rng()*keys.length);keys=[keys[at],keys[(at+1)%keys.length]]}
   const result=add(template,id,keys,duration,rng);if(!result)return null;
   if(['EV25','EV38','EV50'].includes(templateId)){
    const partner=(neighbours.get(id)||[]).find(k=>!active.some(e=>e.portId===k&&e.family==='war')&&keys.some(key=>key in ports[k].market));
    const linked=templateId==='EV25'?'EV25b':templateId==='EV38'?'EV38b':'EV50';
    if(partner){const other=byId.get(linked),matched=templateId==='EV50'?Object.keys(ports[partner].market):keys.filter(k=>k in ports[partner].market);
     const pair=add(other,partner,matched,result.end-day,rng);if(pair){result.partner=partner;pair.partner=id}}
   }
   prices?.recordPort(id);if(result.partner)prices?.recordPort(result.partner);
   return result;
  }
  function nextDay(){
   day++;cache.clear();effectIndex=null;const expired=active.filter(e=>e.end<=day);
   for(let i=active.length-1;i>=0;i--)if(active[i].end<=day)active.splice(i,1);
   for(const e of expired){
    if(e.templateId==='EV50')add(byId.get('EV51'),e.portId,Object.keys(ports[e.portId].market),6,random(`${seed}:${day}:peace`));
    if(e.templateId==='EV14')add(byId.get('EV49'),e.portId,e.keys,7,random(`${seed}:${day}:fodder`));
   }
   const date=dateAt(day),started=[];
   for(const id of portIds){
    const rng=random(`${seed}:${day}:${id}`),c=climate(id,date.month),previous=weather.get(id);
    const rainFactor=rng()*2.2,temperature=c.tn+(rng()-.5)*12,wind=rng();
    weather.set(id,{rainFactor,temperature,wind,dryDays:rainFactor<.65?(previous?.dryDays||0)+1:0});
    if(!ambient)continue;
    if(rng()>.035||active.filter(e=>e.portId===id).length>=2||active.length>=150)continue;
    const options=data.templates.filter(t=>allowed(t)&&t.mode!=='followup'&&(cooldowns.get(`${id}:${t.id}`)||-Infinity)<=day&&eligible(t,id,date).length);
    if(!options.length)continue;
    const template=options[Math.floor(rng()*options.length)],event=start(template.id,id);
    if(event)started.push(event);
   }
   prices?.recordDay();return started;
  }
  function effects(id,key){
   const token=`${id}:${key}`;if(cache.has(token))return cache.get(token);
   if(!effectIndex){effectIndex=new Map();for(const event of active)for(const item of event.keys){const k=`${event.portId}:${item}`;if(!effectIndex.has(k))effectIndex.set(k,[]);effectIndex.get(k).push(event)}}
   let price=1,stock=1,demand=1,tax=0;const events=[];
   for(const e of effectIndex.get(token)||[]){
    price*=e.price;stock*=e.stock;demand*=e.demand;tax+=e.tax;events.push(e);
   }
   const result={price:clamp(price*(1+(demand-1)*.35),.5,2.8),stock:clamp(stock,.15,2.6),demand:clamp(demand,.5,1.8),tax:clamp(tax,0,.25),events};
   cache.set(token,result);return result;
  }
  function status(id,key){const e=effects(id,key);
   if(e.stock<=.55&&e.price>1)return '품귀';
   if(e.events.some(v=>v.templateId==='EV36'))return '유행';
   if(e.events.some(v=>v.templateId==='EV50'))return '전쟁';
   if(e.stock>1.3&&e.price<1)return '과잉';
   return e.price>1.1?'수요 증가':e.price<.9?'시세 하락':'';
  }
  function news(id){return [...active].sort((a,b)=>{
   const near=new Set([id,...(neighbours.get(id)||[])]);return Number(near.has(b.portId))-Number(near.has(a.portId))||b.start-a.start;
  }).slice(0,8).map(e=>`${ports[e.portId].name} · ${e.name} · ${e.keys.map(k=>goods[k].name).slice(0,2).join(', ')}`)}
  prices?.recordDay();if(warmup)while(day<0)nextDay();
  return{nextDay,start,effects,status,news,climate,eligible,prices,openingProtected:protectedNow,date:()=>dateAt(day),day:()=>day,
   at:id=>active.filter(e=>e.portId===id).map(e=>({...e,remaining:e.end-day})),
   snapshot:()=>({day,date:dateAt(day),active:active.map(e=>({...e})),history:history.map(e=>({...e}))})};
 }
 window.ROTTA_MARKET_EVENTS={create,dateAt,OPENING_GRACE_DAYS,openingProtected,isMajorEvent};
})();
