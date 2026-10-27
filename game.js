const $=s=>document.querySelector(s), $$=s=>document.querySelectorAll(s), fmt=n=>Math.max(0,Math.round(n)).toLocaleString('ko-KR');
const WORLD={w:3072,h:2048};
const GOODS={pepper:{name:'후추',icon:'✤',base:44},clove:{name:'정향',icon:'✦',base:72},silk:{name:'비단',icon:'⌁',base:62},porcelain:{name:'도자기',icon:'◉',base:55},sugar:{name:'설탕',icon:'◇',base:31},silver:{name:'은',icon:'◈',base:51},wool:{name:'모직',icon:'≋',base:23},wine:{name:'포도주',icon:'♜',base:27},timber:{name:'목재',icon:'╫',base:18},ivory:{name:'상아',icon:'☽',base:48},dye:{name:'염료',icon:'✺',base:37},coffee:{name:'커피',icon:'❧',base:40}};
Object.assign(GOODS,window.ROTTA_HISTORIC_GOODS||{},window.ROTTA_GLOBAL_GOODS||{},window.ROTTA_SPECIALTY_GOODS||{});
window.ROTTA_ENRICH_HISTORICAL_GOODS?.(GOODS);
const GOOD_TYPE_KEYS={
 '식료품':['wheat','almond','fig','bacon','cheese','tuna','marasca','hazelnut','lemon','caviar','cod','herring','dates','rice','maize','coconut'],
 '조미료':['rockSalt','salt','sugar','vinegar','oliveOil','honey'],
 '가축':['cattle','horse'],
 '의약품':['sage','rosemary','camphor','ginseng'],
 '잡화':['print','westernBook','parchment','cowrie','navalStores','soap'],
 '주류':['wine','douroWine','sherry','beer','rum'],
 '염료':['dye','woad','indigo','cochineal','brazilwood'],
 '광석':['ironOre','sulfur','coal','mercury'],
 '공업품':['timber','iron','marble','copperPlate','lead','copper','tin','ebony','cedar','sandalwood','whaleOil'],
 '기호품':['coffee','tea','tobacco','cacao','mate','raisin'],
 '섬유':['wool','cotton','silkThread','flax','hemp','fur','leather','hides','henequen'],
 '직물':['silk','velvet','lace','carpet','linen'],
 '공예품':['porcelain','ceramic','majolica','muranoGlass','lacquer','paper','bronze'],
 '미술품':['artwork','marbleSculpture'],
 '향신료':['pepper','clove','saffron','cardamom','cinnamon','nutmeg','mace'],
 '귀금속':['silver','gold'],
 '향료':['frankincense'],
 '보석':['ivory','coral','amber','pearl','diamond'],
 '무기류':[],
 '총포류':['handCannon','cannonball','matchlock','gunpowder']
};
for(const [type,keys] of Object.entries(GOOD_TYPE_KEYS))for(const key of keys)if(GOODS[key])GOODS[key].category=type;
for(const good of Object.values(GOODS))if(!good.category)good.category='잡화';
function goodArt(key,fallback='·'){const art=window.ROTTA_GOODS_ATLAS?.[key],name=GOODS[key]?.name||key;return art?`<img class="good-art" src="${window.ROTTA_GOODS_CACHE?.source(art.path)||`${art.path}?v=29`}" alt="${name}">`:`<span class="good-art-fallback">${fallback}</span>`}
const NATIONS={
 portugal:{name:'포르투갈 왕국',flag:'✥',motto:'바다 너머에 우리의 길이 있다',port:'lisbon',gold:680,trait:'카사 다 인디아',desc:'희망봉을 돌아 인도양으로 향하는 장거리 교역의 선구자.',bonuses:['장거리 식량 소모 −20%','향신료 매입가 −8%','리스본 왕궁 이용'],bargain:1},
 spain:{name:'스페인 왕국',flag:'♛',motto:'해가 지지 않는 항로를 열어라',port:'seville',gold:760,trait:'은의 함대',desc:'아메리카의 은과 대서양 함대를 바탕으로 한 강력한 자본력.',bonuses:['은 판매가 +14%','초기 자본 +80','대서양 명성 보너스'],bargain:1},
 england:{name:'잉글랜드 왕국',flag:'♙',motto:'대담한 자가 바람을 얻는다',port:'london',gold:610,trait:'사략 허가장',desc:'기민한 선단과 정보전으로 틈새 항로를 개척하는 신흥 세력.',bonuses:['항해 사건 보상 +18%','모직 판매가 +10%','소문값 절반'],bargain:2},
 france:{name:'프랑스 왕국',flag:'⚜',motto:'왕의 백합은 모든 항구에 핀다',port:'marseille',gold:640,trait:'레반트 외교',desc:'레반트의 외교 특권과 노련한 협상가를 갖춘 균형형 세력.',bonuses:['협상 성공률 +15%','지중해 관세 −25%','포도주 판매가 +10%'],bargain:3},
 ottoman:{name:'오스만 제국',flag:'☾',motto:'두 바다와 두 대륙의 문지기',port:'istanbul',gold:700,trait:'동서의 관문',desc:'레반트와 홍해의 거대한 시장을 장악한 동서 교역의 중심.',bonuses:['중동 시세 공개','항구 관세 −18%','역병 피해 −15%'],bargain:2}
};
const PORTS={
 london:{name:'런던',region:'북해 · 템스 강',x:1454,y:480,climate:'냉온대',flavor:'안개 사이로 조선소의 망치 소리가 울린다.',royal:1,mansion:1,bank:1,market:{wool:.62,wine:1.35,sugar:1.3,silk:1.45}},
 lisbon:{name:'리스본',region:'대서양 · 테주 강',x:1360,y:650,climate:'지중해성',flavor:'인도에서 돌아온 카락선이 향신료를 부린다.',royal:1,mansion:1,bank:1,market:{wine:.72,wool:1.12,pepper:1.48,sugar:1.18}},
 seville:{name:'세비야',region:'대서양 · 과달키비르',x:1388,y:675,climate:'지중해성',flavor:'신대륙 선단의 은괴가 왕실 창고로 옮겨진다.',royal:1,mansion:1,bank:1,market:{silver:.74,wine:.83,silk:1.35,pepper:1.42}},
 marseille:{name:'마르세유',region:'서지중해',x:1530,y:610,climate:'지중해성',flavor:'레반트 상인과 프랑스 영사가 가격을 흥정한다.',mansion:1,bank:1,market:{wine:.66,silk:1.21,dye:1.08,wool:1.16}},
 istanbul:{name:'콘스탄티니예',region:'보스포루스',x:1720,y:650,climate:'온대',flavor:'돛과 돔 너머로 세 대륙의 물자가 모여든다.',royal:1,mansion:1,bank:1,market:{silk:.88,coffee:.8,wine:1.28,timber:.83}},
 alexandria:{name:'알렉산드리아',region:'레반트',x:1680,y:760,climate:'건조',flavor:'홍해 대상단의 향료와 지중해 선단이 만난다.',mansion:1,bank:1,market:{coffee:.74,silk:.92,pepper:1.05,timber:1.32}},
 goa:{name:'고아',region:'인도양',x:2120,y:1120,climate:'몬순',flavor:'몬순을 기다리는 배들이 강어귀를 가득 메웠다.',mansion:1,market:{pepper:.52,silk:.96,wine:1.64,silver:1.24}},
 calicut:{name:'캘리컷',region:'말라바르',x:2120,y:1200,climate:'몬순',flavor:'후추 자루의 검은 향이 부두 전체에 번진다.',mansion:1,market:{pepper:.42,clove:.96,wool:1.55,silver:1.28}},
 malacca:{name:'말라카',region:'향료 해협',x:2410,y:1200,climate:'열대',flavor:'해협을 지나는 모든 배가 이곳에서 물때를 기다린다.',bank:1,market:{clove:.48,pepper:.6,porcelain:.82,silver:1.38}},
 macao:{name:'마카오',region:'남중국해',x:2580,y:920,climate:'아열대',flavor:'비단과 도자기 상자가 바다 건너 은을 기다린다.',bank:1,market:{silk:.5,porcelain:.48,silver:1.52,pepper:.84}},
 nagasaki:{name:'나가사키',region:'동중국해',x:2760,y:790,climate:'온대몬순',flavor:'은광의 소식에 먼 바다 상인들이 몰려든다.',market:{silver:.58,porcelain:.78,silk:.88,wine:1.72}},
 mozambique:{name:'모잠비크',region:'동아프리카',x:1860,y:1440,climate:'열대',flavor:'산호석 창고에 상아와 목재가 쌓여 있다.',market:{ivory:.58,timber:.72,wine:1.45,silk:1.3}},
 zanzibar:{name:'잔지바르',region:'스와힐리',x:1840,y:1300,climate:'열대',flavor:'스와힐리 상인의 다우선이 계절풍을 기다린다.',mansion:1,market:{ivory:.64,clove:.92,wool:1.42,silver:1.16}},
 havana:{name:'아바나',region:'카리브해',x:720,y:1000,climate:'열대',flavor:'설탕과 은을 실은 함대가 호송선을 기다린다.',royal:1,mansion:1,bank:1,market:{sugar:.48,silver:.92,wine:1.44,wool:1.36}},
 veracruz:{name:'베라크루스',region:'누에바 에스파냐',x:600,y:1060,climate:'열대',flavor:'고원에서 내려온 은이 대서양을 기다린다.',royal:1,market:{silver:.46,dye:.68,wine:1.56,silk:1.5}},
 bahia:{name:'바이아',region:'브라질',x:1080,y:1380,climate:'열대',flavor:'붉은 염료목과 설탕이 창고에 가득하다.',market:{sugar:.52,timber:.61,dye:.77,porcelain:1.48}}
};
function projected(lat,lon){const clamped=Math.max(-84,Math.min(84,lat)),scale=WORLD.w/(2*Math.PI);return{x:Math.round((lon+180)/360*WORLD.w),y:Math.round(WORLD.h/2-scale*Math.log(Math.tan(Math.PI/4+clamped*Math.PI/360)))}}
function generatedMarket(id){const keys=['pepper','clove','silk','porcelain','sugar','silver','wool','wine','timber','ivory','dye','coffee'],out={};for(let i=0;i<4;i++){const k=keys[(hash(id)+i*5)%keys.length];out[k]=.55+((hash(id+k)%105)/100)}return out}
for(const [id,name,lat,lon,region] of (window.ROTTA_PORT_CATALOG||[])){if(PORTS[id])continue;const pos=projected(lat,lon),h=hash(id);PORTS[id]={name,region,x:pos.x,y:pos.y,rawX:pos.x,rawY:pos.y,lat,lon,climate:Math.abs(lat)<20?'열대':Math.abs(lat)<38?'온난':'온대',flavor:`${region}의 상선과 현지 상인이 모이는 거점이다.`,royal:['hanyang','beijing','edo','baghdad','cairo','mecca','ayutthaya'].includes(id)?1:0,mansion:h%3===0?1:0,bank:h%4===0?1:0,market:generatedMarket(id)}}
const BASE_COORDS={london:[51.5074,-.1276],lisbon:[38.7223,-9.1393],seville:[37.3891,-5.9845],marseille:[43.2965,5.3698],istanbul:[41.0082,28.9784],alexandria:[31.2001,29.9187],goa:[15.4989,73.818],calicut:[11.2588,75.7804],malacca:[2.1896,102.2501],macao:[22.1987,113.543],nagasaki:[32.7503,129.8737],mozambique:[-15.0343,40.7358],zanzibar:[-6.1659,39.1979],havana:[23.1136,-82.3666],veracruz:[19.1738,-96.1342],bahia:[-12.9777,-38.5016]};for(const [id,[lat,lon]] of Object.entries(BASE_COORDS)){const pos=projected(lat,lon);Object.assign(PORTS[id],{lat,lon,x:pos.x,y:pos.y,rawX:pos.x,rawY:pos.y})}
for(const [id,market] of Object.entries(window.ROTTA_WORLD_MARKETS||{}))if(PORTS[id])PORTS[id].market=market;
for(const [id,market] of Object.entries(window.ROTTA_MEDITERRANEAN_MARKETS||{}))if(PORTS[id])PORTS[id].market=market;
for(const [id,market] of Object.entries(window.ROTTA_SPECIALTY_MARKETS||{}))if(PORTS[id])Object.assign(PORTS[id].market,market);
window.ROTTA_APPLY_HISTORICAL_PORTS?.(PORTS);
for(const [id,name] of Object.entries(window.ROTTA_HISTORIC_PORT_NAMES||{}))if(PORTS[id])PORTS[id].name=name;
for(const [id,position] of Object.entries(window.ROTTA_PORT_POSITIONS||{})){if(!PORTS[id]||!Array.isArray(position)||position.length<2)continue;const [x,y]=position;if(!Number.isFinite(x)||!Number.isFinite(y))continue;Object.assign(PORTS[id],{x,y,rawX:x,rawY:y})}
for(const id of (window.ROTTA_REMOVED_PORTS||[]))delete PORTS[id];
window.ROTTA_APPLY_MANSION_POLICY?.(PORTS);
const PORT_COUNT=Object.keys(PORTS).length;
const FACILITIES={trade:{name:'교역소',icon:'⚖',intro:'시세표와 창고 장부가 펼쳐져 있습니다.'},royal:{name:'왕국',icon:'♛',intro:'왕실 관청에서 특허장과 국가 임무를 받습니다.'},mansion:{name:'저택',icon:'⚜',intro:'유력 상인과 귀족에게 소문과 협상술을 배웁니다.'},shop:{name:'상점',icon:'⚱',intro:'식량, 물, 항해 도구와 선원용 물품을 구합니다.'},shipyard:{name:'조선소',icon:'⚒',intro:'선체를 수리하고 화물칸을 증설합니다.'},bank:{name:'은행',icon:'◈',intro:'장거리 원정에 대비해 골드를 안전하게 맡깁니다.'}};
const FACILITY_MATERIAL={trade:'parchment',royal:'stone',mansion:'wood',shop:'parchment',shipyard:'iron',bank:'stone'};
const EVENTS=[
 {type:'기상',icon:'♒',title:'돌풍과 돛대',body:'검은 구름이 수평선을 삼키더니 돌풍이 주돛을 후려쳤다.',effects:{hull:-9,morale:-4},labels:['선체 −9','사기 −4']},
 {type:'해상',icon:'⚓',title:'표류 상선 구조',body:'돛을 잃은 상선을 구조하자 선주가 사례금을 건넸다.',effects:{gold:95,fame:4},labels:['95 골드','명성 +4']},
 {type:'역병',icon:'☣',title:'선창의 열병',body:'축축한 선창에서 열병이 번졌다. 격리했지만 손실이 났다.',effects:{crew:-6,morale:-7},labels:['선원 −6','사기 −7']},
 {type:'기후',icon:'☀',title:'무풍대',body:'돛은 축 늘어지고 식수통은 빠르게 비어 간다.',effects:{food:-14,morale:-5},labels:['식량 −14','사기 −5']},
 {type:'해일',icon:'≋',title:'항만의 큰 물결',body:'먼 바다의 지진이 항만으로 거대한 물결을 밀어 넣었다.',effects:{hull:-12,gold:-40},labels:['선체 −12','수리비 40']},
 {type:'국가상황',icon:'♜',title:'왕실 관세령',marketTemplate:'EV39',body:'왕실이 일부 수입품의 관세를 올렸다.',effects:{fame:2},labels:['시세 변동','명성 +2']}
];
let state={nation:null,gold:0,bank:0,fame:0,crew:42,hull:100,food:100,morale:78,bargain:1,cargo:{},cargoLots:{},marketBought:{},capacity:60,current:null,year:1543,month:3,seed:1,shipX:1360,shipY:650,atPort:true,traveling:false,camX:0,camY:0,zoom:6.5};
let pendingTrade=null,SEA_ROUTE_RUN=0;
let MARKET_BASKET=null;
const MARKET_BASKET_UI={port:null,mode:'owned'};
let MARKET_SIM=null;
let DISTANCE_TRADE=null;
function distanceTradeEngine(){
 if(!DISTANCE_TRADE&&window.ROTTA_DISTANCE_TRADE&&window.ROTTA_SEA_DISTANCES)DISTANCE_TRADE=window.ROTTA_DISTANCE_TRADE.create({ports:PORTS,goods:GOODS,table:window.ROTTA_SEA_DISTANCES});
 return DISTANCE_TRADE;
}
function cargoLotsFor(key){
 const quantity=Math.max(0,Math.floor(state.cargo[key]||0));state.cargoLots??={};
 const lots=(state.cargoLots[key]||[]).filter(l=>Number.isFinite(l.quantity)&&l.quantity>0).map(l=>({...l,quantity:Math.floor(l.quantity)}));
 let remaining=quantity;const normalized=[];
 for(const lot of lots){const count=Math.min(remaining,lot.quantity);if(count>0)normalized.push({...lot,quantity:count});remaining-=count}
 // Legacy/reward cargo must not acquire a fabricated European origin.
 if(remaining>0)normalized.push({origin:null,quantity:remaining,unitCost:null});
 state.cargoLots[key]=normalized;return normalized;
}
function addCargoLot(key,quantity,origin,unitCost){
 const lots=cargoLotsFor(key),last=lots[lots.length-1];
 if(last&&last.origin===origin&&last.unitCost===unitCost)last.quantity+=quantity;else lots.push({origin,quantity,unitCost});
 state.cargo[key]=(state.cargo[key]||0)+quantity;
}
function removeCargoLots(key,quantity){
 const lots=cargoLotsFor(key);let remaining=quantity;
 for(const lot of lots){const count=Math.min(remaining,lot.quantity);lot.quantity-=count;remaining-=count;if(!remaining)break}
 state.cargo[key]=Math.max(0,(state.cargo[key]||0)-quantity);state.cargoLots[key]=lots.filter(l=>l.quantity>0);
}
function cargoSaleQuote(portId,key,quantity=state.cargo[key]||0,offset=0){
 const base=marketPriceAt(portId,key,'sell');let skip=Math.max(0,Math.min(Math.floor(offset)||0,state.cargo[key]||0));
 const count=Math.max(0,Math.min(Math.floor(quantity)||0,(state.cargo[key]||0)-skip));
 if(!count)return{quantity:0,total:0,unit:base,minUnit:base,maxUnit:base};
 const engine=distanceTradeEngine();let remaining=count,total=0,minUnit=Infinity,maxUnit=0;
 for(const lot of cargoLotsFor(key)){
  const skipped=Math.min(skip,lot.quantity);skip-=skipped;
  const take=Math.min(remaining,lot.quantity-skipped);if(!take)continue;
  const multiplier=engine?.factor(lot.origin,portId,key)??1,unit=Math.max(1,Math.floor(base*multiplier+1e-8));
  total+=take*unit;minUnit=Math.min(minUnit,unit);maxUnit=Math.max(maxUnit,unit);remaining-=take;if(!remaining)break;
 }
 return{quantity:count,total,unit:Math.floor(total/count),minUnit,maxUnit};
}
function cargoUnitLabel(quote){return quote.minUnit===quote.maxUnit?fmt(quote.minUnit):`${fmt(quote.minUnit)}–${fmt(quote.maxUnit)}`}
function priceAt(portId,key,side='buy'){return side==='sell'&&(state.cargo[key]||0)>0?cargoSaleQuote(portId,key).unit:marketPriceAt(portId,key,side)}
const MARKET_UI={port:null,key:null,month:null};
const SEA_PORT_UI={actionsId:null,quoteId:null};
const ARRIVAL_UI={routePortId:null,portId:null,timer:0,deadline:0,token:0};
function dismissArrivalPrompt(){
 clearTimeout(ARRIVAL_UI.timer);ARRIVAL_UI.timer=0;ARRIVAL_UI.deadline=0;ARRIVAL_UI.portId=null;ARRIVAL_UI.routePortId=null;ARRIVAL_UI.token++;
 const panel=$('#arrivalPrompt');if(panel){panel.hidden=true;panel.classList.remove('counting')}
}
function answerArrivalPrompt(accept){
 const id=ARRIVAL_UI.portId;if(!id)return;
 const allowed=accept&&performance.now()<ARRIVAL_UI.deadline&&$('#sailingView').classList.contains('active')&&canDockAt(id);
 dismissArrivalPrompt();
 if(allowed){DOCK_SELECTION.portId=id;enterPort()}
 else if($('#arrivalPrompt').contains?.(document.activeElement))NAV_RENDER.viewport.focus({preventScroll:true});
}
function showArrivalPrompt(id){
 dismissArrivalPrompt();if(!canDockAt(id)||!$('#sailingView').classList.contains('active'))return false;
 closeSeaPortUI();ARRIVAL_UI.portId=id;ARRIVAL_UI.deadline=performance.now()+10000;const token=ARRIVAL_UI.token,panel=$('#arrivalPrompt');
 $('#arrivalQuestion').textContent=`${PORTS[id].name} · 입항하시겠습니까?`;
 $('#arrivalYes').onclick=()=>answerArrivalPrompt(true);$('#arrivalNo').onclick=()=>answerArrivalPrompt(false);
 panel.hidden=false;void panel.offsetWidth;panel.classList.add('counting');panel.focus({preventScroll:true});
 ARRIVAL_UI.timer=setTimeout(()=>{if(token===ARRIVAL_UI.token)answerArrivalPrompt(false)},10000);return true;
}
function handleArrivalPromptKey(e){
 if(!ARRIVAL_UI.portId)return false;
 if(e.key==='Escape'){e.preventDefault();answerArrivalPrompt(false);return true}
 const tag=e.target?.tagName;if(e.ctrlKey||e.metaKey||e.altKey||['INPUT','SELECT','TEXTAREA'].includes(tag)||e.target?.isContentEditable)return false;
 const key={KeyY:'y',KeyN:'n'}[e.code]||e.key?.toLowerCase();if(key!=='y'&&key!=='n')return false;
 e.preventDefault();if(!e.repeat)answerArrivalPrompt(key==='y');return true;
}
const DAY_CLOCK={distance:0,food:0,morale:0,unitsPerDay:28};
function initMarketSystem(){
 state.year=1543;state.month=3;state.day=1;state.elapsedDays=0;
 DAY_CLOCK.distance=DAY_CLOCK.food=DAY_CLOCK.morale=0;
 window.ROTTA_APPLY_SPECIALTY_DATA?.(window.ROTTA_MARKET_DATA);
 MARKET_SIM=window.ROTTA_MARKET_EVENTS?.create({data:window.ROTTA_MARKET_DATA,ports:PORTS,goods:GOODS,seed:state.seed});
 if(MARKET_SIM)for(const[id,c]of Object.entries(window.ROTTA_MARKET_DATA.ports))if(PORTS[id])PORTS[id].climate=c.koppen;
 syncMarketDiagnostics();
}
function syncMarketDiagnostics(){const root=document.documentElement.dataset;root.marketDay=String(state.elapsedDays||0);root.marketEvents=String(MARKET_SIM?.snapshot().active.length||0);root.marketClimatePorts=String(Object.keys(window.ROTTA_MARKET_DATA?.ports||{}).length)}
function marketEffects(pid,key){return MARKET_SIM?.effects(pid,key)||{price:1,stock:1,demand:1,tax:0,events:[]}}
function marketStatusMarkup(){const active=MARKET_SIM?.at(state.current)||[];return active.length?`<div class="market-status">${active.slice(0,3).map(e=>`<span title="${e.keys.map(k=>GOODS[k]?.name).filter(Boolean).join(', ')}">${e.name}<small>${e.remaining}일</small></span>`).join('')}</div>`:''}
function consumeVoyageDistance(distance){if(!Number.isFinite(distance)||distance<=0)return;DAY_CLOCK.distance+=distance;const days=Math.floor((DAY_CLOCK.distance+1e-9)/DAY_CLOCK.unitsPerDay);if(days){DAY_CLOCK.distance-=days*DAY_CLOCK.unitsPerDay;advance(days)}}
function waitOneDay(){if(!state.nation||state.traveling||MANUAL_SAIL.velocity>.001)return;closeSystem();advance(1);updateStats()}
const CAMERA_DRAG={active:false,moved:false,lastX:0,lastY:0,pointerId:null,suppressUntil:0};
const CAMERA_VIEW={followShip:true,autoFollow:null};
const DEPARTURE_ZOOM={frame:0,run:0,active:false};
const AUTO_SAIL={velocity:0,rampSeconds:1.2,route:null};
const MANUAL_SAIL={keys:new Set(),frame:0,last:0,velocity:0,maxSpeed:4.2,acceleration:2.1,brake:2.8,turnRate:48,heading:0,guide:null,guideIndex:1};
const NAV_RENDER={viewport:null,world:null,ship:null,width:0,height:0,portNodes:[],nearAt:0,cameraFrame:0,cullTimer:0,lastRegion:'',lastTx:0,lastTy:0,vectorReady:false,coastRenderer:null,uiAt:0,dockAt:0,dockId:undefined,moving:false,lastCamera:'',lastShip:''};
const NAV={w:256,h:171,water:null,rawWater:null,ready:false,cellX:WORLD.w/256,cellY:WORLD.h/171};
const COAST={w:1536,h:1024,water:null,rawWater:null,ready:false,cellX:WORLD.w/1536,cellY:WORLD.h/1024};
const MAP_ART_FALLBACK='assets/chart-low.webp?v=38';
const MAP_TILES={layer:null,manifest:null,levels:[],activeLevel:null,nodes:new Map(),queue:[],inFlight:0,maxInFlight:10,maxDecoded:64,updateFrame:0,lastSignature:'',committedSignature:'',committedKeys:new Set(),desiredKeys:new Set(),failures:new Map(),cacheKey:''};
let MAP_LOAD_PROGRESS=0;
const STARTUP={ready:false,running:false,map:0,goods:0,harbors:0};
let ACTIVE_MAP_DATASET='Natural Earth 1:10m',ACTIVE_IMAGE_COASTLINE=null;
function auditNavigationConnectivity(){const reference=PORTS.lisbon||Object.values(PORTS)[0],start=reference&&nearestWater(reference.navX??reference.x,reference.navY??reference.y,12),blocked=[];if(!start)return{reachable:0,blocked:Object.keys(PORTS)};const width=NAV.w,height=NAV.h,seen=new Uint8Array(width*height),queue=new Int32Array(width*height),dirs=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];let head=0,tail=0;queue[tail++]=start.y*width+start.x;seen[start.y*width+start.x]=1;while(head<tail){const at=queue[head++],x=at%width,y=Math.floor(at/width);for(const[dx,dy]of dirs){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=width||ny>=height)continue;const ni=ny*width+nx;if(seen[ni]||!NAV.water[ni])continue;if(dx&&dy&&(!NAV.water[y*width+nx]||!NAV.water[ny*width+x]))continue;seen[ni]=1;queue[tail++]=ni}}for(const[id,p]of Object.entries(PORTS)){const cell=nearestWater(p.navX??p.x,p.navY??p.y,12);if(!cell||!seen[cell.y*width+cell.x])blocked.push(id)}return{reachable:PORT_COUNT-blocked.length,blocked}}
const INLAND_HUBS=new Set(['nicosia','cairo','karibib','mecca','baghdad','ayutthaya','lopburi','hanyang','nanjing','chongqing','beijing','saopaulo','merida','guatemala']);
const CHARTED_ISLANDS=new Set(['madeira','verde','saotome','bermuda']);
function unpackBits(bytes,count){const output=new Uint8Array(count);for(let i=0;i<bytes.length;i++){const value=bytes[i],base=i*8,limit=Math.min(8,count-base);for(let bit=0;bit<limit;bit++)output[base+bit]=(value>>bit)&1}return output}
async function loadMaskAsset(mask,url){const response=await fetch(url,{cache:'force-cache'});if(!response.ok)throw new Error(`Map cache ${response.status}`);const buffer=await response.arrayBuffer(),view=new DataView(buffer);if(String.fromCharCode(...new Uint8Array(buffer,0,4))!=='RTM1'||view.getUint16(4,true)!==mask.w||view.getUint16(6,true)!==mask.h)throw new Error('Map cache mismatch');const count=mask.w*mask.h,packedLength=Math.ceil(count/8),bytes=new Uint8Array(buffer);mask.rawWater=unpackBits(bytes.subarray(16,16+packedLength),count);mask.water=unpackBits(bytes.subarray(16+packedLength,16+packedLength*2),count);mask.waterCells=view.getUint32(8,true);mask.landCells=count-mask.waterCells;mask.ready=true}
function maskCandidate(mask){return{w:mask.w,h:mask.h,water:null,rawWater:null,ready:false,cellX:mask.cellX,cellY:mask.cellY}}
function commitMask(target,candidate){Object.assign(target,{water:candidate.water,rawWater:candidate.rawWater,waterCells:candidate.waterCells,landCells:candidate.landCells,ready:candidate.ready})}
async function loadImageCoastlineAsset(){let response=await fetch('assets/coast-render-chunks.json?v=1',{cache:'force-cache'});if(!response.ok)response=await fetch('assets/image-coastline.json?v=61',{cache:'no-cache'});if(!response.ok)throw new Error(`Image coastline ${response.status}`);const data=await response.json(),worldWidth=Number(data.worldWidth),worldHeight=Number(data.worldHeight),combined=(typeof data.paths==='string'?data.paths:null)??data.path??data.combinedPath??data.pathData??data.d,sourcePaths=Array.isArray(data.paths)&&data.paths.length?data.paths:[combined],paths=sourcePaths.map(item=>typeof item==='string'?item:item?.d).filter(path=>typeof path==='string'&&/^\s*[Mm]/.test(path)&&/[0-9]/.test(path)),tracePaths=(Array.isArray(data.tracePaths)?data.tracePaths:[]).map(item=>typeof item==='string'?item:item?.d).filter(path=>typeof path==='string'&&/^\s*[Mm]/.test(path)&&/[0-9]/.test(path));if(!Number.isFinite(worldWidth)||worldWidth<=0||!Number.isFinite(worldHeight)||worldHeight<=0||!paths.length)throw new Error('Image coastline contract mismatch');return{worldWidth,worldHeight,paths,tracePaths,coastChunks:data.coastChunks||[],dataset:String(data.dataset||data.label||'Image-derived map coastline')}}
function setMapLoadProgress(value){MAP_LOAD_PROGRESS=Math.max(MAP_LOAD_PROGRESS,Math.max(0,Math.min(100,Math.round(value))));STARTUP.map=MAP_LOAD_PROGRESS;const progress=STARTUP.ready?100:Math.min(99,Math.floor(STARTUP.map*.6+STARTUP.goods*.3+STARTUP.harbors*.1)),bar=$('#mapLoaderBar'),label=$('#mapLoaderText');if(bar)bar.style.width=`${progress}%`;if(label)label.textContent=`${progress}%`;const loader=$('#mapLoader');if(loader)loader.setAttribute('aria-label',`다운로드 ${progress}%`)}
async function decodeMapImage(image,url){image.src=url;try{if(image.decode)await image.decode();else if(!image.complete)await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject})}catch(err){if(!image.complete||!image.naturalWidth)throw err}}
async function loadMapArt(){const image=$('#chartRaster'),url=image.dataset.src;setMapLoadProgress(4);try{const response=await fetch(url,{cache:'force-cache'});if(!response.ok)throw new Error(`Map art ${response.status}`);const total=Number(response.headers.get('content-length'))||0,type=response.headers.get('content-type')||'image/png';let blob;if(response.body){const reader=response.body.getReader(),chunks=[];let received=0;while(true){const {done,value}=await reader.read();if(done)break;chunks.push(value);received+=value.byteLength;const ratio=total?received/total:Math.min(.96,Math.log2(1+received/32768)/8);setMapLoadProgress(4+ratio*84)}blob=new Blob(chunks,{type})}else{blob=await response.blob();setMapLoadProgress(88)}const objectUrl=URL.createObjectURL(blob);await decodeMapImage(image,objectUrl);image.dataset.objectUrl=objectUrl;setMapLoadProgress(91)}catch(err){console.error(err);await decodeMapImage(image,MAP_ART_FALLBACK);setMapLoadProgress(91)}}
function normalizeMapTileLevel(level,index,manifest){const density=Math.max(1,Number(level.density||level.scale||level.pixelRatio)||1),tileSize=Math.max(128,Number(level.tileSize||manifest.tileSize)||1024),width=Math.max(1,Number(level.width)||Math.round((manifest.worldWidth||WORLD.w)*density)),height=Math.max(1,Number(level.height)||Math.round((manifest.worldHeight||WORLD.h)*density)),cols=Math.max(1,Number(level.cols)||Math.ceil(width/tileSize)),rows=Math.max(1,Number(level.rows)||Math.ceil(height/tileSize)),id=String(level.id||level.name||`d${density}`),urlTemplate=level.urlTemplate||level.template||level.url||`assets/map-hires/${id}/{x}_{y}.webp`;return{id,density,tileSize,width,height,cols,rows,urlTemplate,minZoom:Number.isFinite(Number(level.minZoom))?Number(level.minZoom):density===1?1:Math.max(1,density*1.25),maxZoom:Number.isFinite(Number(level.maxZoom))?Number(level.maxZoom):index===manifest.levels.length-1?10:density*2.74}}
function chooseMapTileLevel(zoom=state.zoom){if(!MAP_TILES.levels.length)return null;const matching=MAP_TILES.levels.filter(level=>zoom>=level.minZoom-.001&&zoom<=level.maxZoom+.001);if(matching.length)return matching.reduce((best,level)=>level.density>best.density?level:best);return MAP_TILES.levels.reduce((best,level)=>Math.abs(Math.log(Math.max(.01,zoom)/level.density))<Math.abs(Math.log(Math.max(.01,zoom)/best.density))?level:best)}
function mapTileUrl(level,col,row){let url=level.urlTemplate.replaceAll('{x}',col).replaceAll('{y}',row).replaceAll('{col}',col).replaceAll('{row}',row).replaceAll('{level}',level.id).replaceAll('{density}',level.density);if(MAP_TILES.cacheKey&&!/[?&]v=/.test(url))url+=`${url.includes('?')?'&':'?'}v=${encodeURIComponent(MAP_TILES.cacheKey)}`;return url}
function positionMapTile(image,level,col,row){const sourceX=col*level.tileSize,sourceY=row*level.tileSize,sourceW=Math.min(level.tileSize,level.width-sourceX),sourceH=Math.min(level.tileSize,level.height-sourceY);image.style.position='absolute';image.style.left=`${sourceX/level.density}px`;image.style.top=`${sourceY/level.density}px`;image.style.width=`${sourceW/level.density}px`;image.style.height=`${sourceH/level.density}px`;image.style.zIndex=String(level.density);image.style.pointerEvents='none';image.style.userSelect='none'}
function makeMapTileNode(level,col,row){const key=`${level.id}:${col}:${row}`,image=document.createElement('img'),node={key,level,col,row,image,ready:false,wanted:false,prefetch:false,lastUsed:performance.now(),controller:null,promise:null,disposed:false};image.className='chart-tile';image.alt='';image.draggable=false;image.decoding='async';image.loading='eager';image.hidden=true;image.dataset.level=level.id;image.dataset.col=col;image.dataset.row=row;positionMapTile(image,level,col,row);MAP_TILES.layer.appendChild(image);MAP_TILES.nodes.set(key,node);return node}
function disposeMapTile(node){node.disposed=true;node.controller?.abort();node.image.remove();MAP_TILES.nodes.delete(node.key)}
function pumpMapTileQueue(){while(MAP_TILES.inFlight<MAP_TILES.maxInFlight&&MAP_TILES.queue.length){const node=MAP_TILES.queue.shift();if(node.disposed||node.ready||node.promise||(!node.wanted&&!node.prefetch))continue;const failedAt=MAP_TILES.failures.get(node.key)||0;if(failedAt&&performance.now()-failedAt<30000){if(!node.wanted&&!node.prefetch)disposeMapTile(node);continue}MAP_TILES.inFlight++;node.controller=new AbortController();node.promise=(async()=>{let objectUrl='';try{const response=await fetch(mapTileUrl(node.level,node.col,node.row),{cache:'force-cache',signal:node.controller.signal});if(!response.ok)throw new Error(`Map tile ${response.status}`);objectUrl=URL.createObjectURL(await response.blob());await decodeMapImage(node.image,objectUrl);if(node.disposed)return;node.ready=true;node.lastUsed=performance.now();node.image.classList.add('is-ready')}catch(err){if(err.name!=='AbortError'){MAP_TILES.failures.set(node.key,performance.now());console.warn('[Rotta map tile]',node.key,err);if(!node.disposed)disposeMapTile(node)}else if(!node.disposed&&!node.wanted&&!node.prefetch)disposeMapTile(node)}finally{if(objectUrl)URL.revokeObjectURL(objectUrl);node.controller=null;node.promise=null;MAP_TILES.inFlight--;if(!node.disposed&&!node.ready&&(node.wanted||node.prefetch)&&!MAP_TILES.queue.includes(node))MAP_TILES.queue.push(node);pumpMapTileQueue();tryCommitMapTileSet();trimMapTileCache();updateMapTileDiagnostics()}})()}}
function requestMapTile(level,col,row,{prefetch=false,wanted=false}={}){if(!MAP_TILES.layer||col<0||row<0||col>=level.cols||row>=level.rows)return null;const key=`${level.id}:${col}:${row}`,node=MAP_TILES.nodes.get(key)||makeMapTileNode(level,col,row);node.lastUsed=performance.now();node.prefetch=node.prefetch||prefetch;node.wanted=node.wanted||wanted;if(!node.ready&&!node.promise&&!MAP_TILES.queue.includes(node)){MAP_TILES.queue.push(node);pumpMapTileQueue()}return node}
function trimMapTileCache(){const decoded=[...MAP_TILES.nodes.values()].filter(node=>node.ready);if(decoded.length<=MAP_TILES.maxDecoded)return;decoded.filter(node=>!node.wanted&&!MAP_TILES.committedKeys.has(node.key)).sort((a,b)=>a.lastUsed-b.lastUsed).slice(0,decoded.length-MAP_TILES.maxDecoded).forEach(disposeMapTile)}
function updateMapTileDiagnostics(){const nodes=[...MAP_TILES.nodes.values()],ready=nodes.filter(node=>node.ready).length,wanted=nodes.filter(node=>node.wanted).length;document.documentElement.dataset.mapLod=MAP_TILES.activeLevel?.id||'base';document.documentElement.dataset.mapTileCache=`${ready}/${MAP_TILES.maxDecoded}`;document.documentElement.dataset.mapTilesVisible=String(wanted);window.ROTTA_HIRES_MAP_AUDIT={ready:!!MAP_TILES.manifest,level:MAP_TILES.activeLevel?.id||null,density:MAP_TILES.activeLevel?.density||0,decoded:ready,wanted,inFlight:MAP_TILES.inFlight,queued:MAP_TILES.queue.length,maxDecoded:MAP_TILES.maxDecoded}}
function tryCommitMapTileSet(){if(!MAP_TILES.desiredKeys.size)return false;let ready=0;for(const key of MAP_TILES.desiredKeys){const node=MAP_TILES.nodes.get(key);if(!node?.ready)continue;ready++;if(MAP_TILES.committedKeys.size)node.image.hidden=false}if(MAP_TILES.committedKeys.size)NAV_RENDER.world?.classList.add('hires-map-ready');if(ready!==MAP_TILES.desiredKeys.size)return false;if(MAP_TILES.committedSignature===MAP_TILES.lastSignature)return true;for(const node of MAP_TILES.nodes.values())node.image.hidden=!MAP_TILES.desiredKeys.has(node.key);MAP_TILES.committedKeys=new Set(MAP_TILES.desiredKeys);MAP_TILES.committedSignature=MAP_TILES.lastSignature;MAP_TILES.layer.setAttribute('aria-busy','false');NAV_RENDER.world?.classList.add('hires-map-ready');updateMapTileDiagnostics();return true}
function updateVisibleMapTiles(){MAP_TILES.updateFrame=0;if(!MAP_TILES.manifest||!MAP_TILES.layer||!NAV_RENDER.width||!NAV_RENDER.height)return;const level=chooseMapTileLevel(),z=state.zoom,tx=NAV_RENDER.lastTx,ty=NAV_RENDER.lastTy,tileWorld=level.tileSize/level.density,left=Math.max(0,-tx/z),top=Math.max(0,-ty/z),right=Math.min(WORLD.w,(NAV_RENDER.width-tx)/z),bottom=Math.min(WORLD.h,(NAV_RENDER.height-ty)/z),coreMinCol=Math.max(0,Math.floor(left/tileWorld)),coreMaxCol=Math.min(level.cols-1,Math.floor(Math.max(left,right-.001)/tileWorld)),coreMinRow=Math.max(0,Math.floor(top/tileWorld)),coreMaxRow=Math.min(level.rows-1,Math.floor(Math.max(top,bottom-.001)/tileWorld)),ringMinCol=Math.max(0,coreMinCol-1),ringMaxCol=Math.min(level.cols-1,coreMaxCol+1),ringMinRow=Math.max(0,coreMinRow-1),ringMaxRow=Math.min(level.rows-1,coreMaxRow+1),signature=`${level.id}:${coreMinCol}:${coreMaxCol}:${coreMinRow}:${coreMaxRow}`;if(signature===MAP_TILES.lastSignature)return;const coreKeys=new Set();for(let row=coreMinRow;row<=coreMaxRow;row++)for(let col=coreMinCol;col<=coreMaxCol;col++)coreKeys.add(`${level.id}:${col}:${row}`);const coreReady=[...coreKeys].every(key=>MAP_TILES.nodes.get(key)?.ready);MAP_TILES.lastSignature=signature;MAP_TILES.desiredKeys=coreKeys;MAP_TILES.activeLevel=level;MAP_TILES.layer.dataset.level=level.id;MAP_TILES.layer.setAttribute('aria-busy',coreReady?'false':'true');for(const node of MAP_TILES.nodes.values()){node.wanted=false;node.prefetch=false}for(let row=coreMinRow;row<=coreMaxRow;row++)for(let col=coreMinCol;col<=coreMaxCol;col++){const node=requestMapTile(level,col,row,{wanted:true});if(node)node.lastUsed=performance.now()}for(let row=ringMinRow;row<=ringMaxRow;row++)for(let col=ringMinCol;col<=ringMaxCol;col++){const key=`${level.id}:${col}:${row}`;if(coreKeys.has(key))continue;requestMapTile(level,col,row,{prefetch:true})}for(const node of [...MAP_TILES.nodes.values()]){if(node.wanted||node.prefetch||MAP_TILES.committedKeys.has(node.key))continue;if(node.promise)node.controller?.abort();else if(!node.ready)disposeMapTile(node)}MAP_TILES.queue=MAP_TILES.queue.filter(node=>!node.disposed&&(node.wanted||node.prefetch||MAP_TILES.committedKeys.has(node.key)));pumpMapTileQueue();tryCommitMapTileSet();trimMapTileCache();updateMapTileDiagnostics()}
function queueVisibleMapTiles(immediate=false){if(immediate){if(MAP_TILES.updateFrame)cancelAnimationFrame(MAP_TILES.updateFrame);MAP_TILES.updateFrame=0;MAP_TILES.lastSignature='';return updateVisibleMapTiles()}if(MAP_TILES.updateFrame)return;MAP_TILES.updateFrame=requestAnimationFrame(updateVisibleMapTiles)}
function prefetchMapTileAt(wx,wy,zoom=state.zoom){if(!MAP_TILES.manifest)return;const level=chooseMapTileLevel(zoom),tileWorld=level.tileSize/level.density,col=Math.max(0,Math.min(level.cols-1,Math.floor(wx/tileWorld))),row=Math.max(0,Math.min(level.rows-1,Math.floor(wy/tileWorld)));requestMapTile(level,col,row,{prefetch:true})}
async function loadHighResolutionMap(){MAP_TILES.layer=$('#chartTiles');if(!MAP_TILES.layer)return;Object.assign(MAP_TILES.layer.style,{position:'absolute',inset:'0',width:`${WORLD.w}px`,height:`${WORLD.h}px`,pointerEvents:'none'});try{const response=await fetch('assets/map-hires/manifest.json',{cache:'no-cache'});if(!response.ok)throw new Error(`Map manifest ${response.status}`);const manifest=await response.json(),worldWidth=Number(manifest.worldWidth||manifest.world?.width||WORLD.w),worldHeight=Number(manifest.worldHeight||manifest.world?.height||WORLD.h);if(worldWidth!==WORLD.w||worldHeight!==WORLD.h)throw new Error(`Map manifest world mismatch ${worldWidth}×${worldHeight}`);if(!Array.isArray(manifest.levels)||!manifest.levels.length)throw new Error('Map manifest has no levels');MAP_TILES.manifest=manifest;MAP_TILES.levels=manifest.levels.map((level,index)=>normalizeMapTileLevel(level,index,manifest)).sort((a,b)=>a.density-b.density);MAP_TILES.cacheKey=String(manifest.textureVersion||manifest.source?.sha256?.slice(0,12)||manifest.version||'1');const level=chooseMapTileLevel(state.zoom),col=Math.max(0,Math.min(level.cols-1,Math.floor(state.shipX/(level.tileSize/level.density)))),row=Math.max(0,Math.min(level.rows-1,Math.floor(state.shipY/(level.tileSize/level.density)))),prime=requestMapTile(level,col,row,{prefetch:true});if(prime?.promise)await prime.promise;setMapLoadProgress(98);updateMapTileDiagnostics();queueVisibleMapTiles(true)}catch(err){console.warn('[Rotta high-resolution map]',err);MAP_TILES.manifest=null;MAP_TILES.levels=[];document.documentElement.dataset.mapLod='base'}}
function finishMapLoading(){STARTUP.ready=true;document.documentElement.dataset.startupReady='true';setMapLoadProgress(100);const loader=$('#mapLoader');setTimeout(()=>{loader.classList.add('ready');loader.setAttribute('aria-hidden','true')},180)}
async function loadStartupAssets(){
 if(STARTUP.running||STARTUP.ready)return;
 STARTUP.running=true;
 const retry=$('#assetRetry');retry.classList.add('hidden');retry.onclick=loadStartupAssets;
 try{
  const goods=window.ROTTA_GOODS_CACHE,harbors=window.ROTTA_HARBOR_CACHE;
  if(!goods)throw new Error('Goods cache unavailable');if(!harbors)throw new Error('Harbor cache unavailable');if(!window.ROTTA_MARKET_DATA||!window.ROTTA_MARKET_EVENTS||!window.ROTTA_MARKET_PRICES||!window.ROTTA_MARKET_CHART)throw new Error('Market data unavailable');
  await Promise.all([
   window.ROTTA_PORT_TRANSITIONS?.preload(),
   window.ROTTA_MANSION_DIALOGUE?.preload(),
   harbors.preload((loaded,total)=>{
    STARTUP.harbors=total?loaded/total*100:100;
    document.documentElement.dataset.harborsLoaded=String(loaded);document.documentElement.dataset.harborsTotal=String(total);
    setMapLoadProgress(MAP_LOAD_PROGRESS);
   }),
   STARTUP.mapTask??=(Promise.all([loadMapArt(),buildNavMask(),loadHighResolutionMap()]).catch(error=>{STARTUP.mapTask=null;throw error})),
   goods.preload((loaded,total)=>{
    STARTUP.goods=total?loaded/total*100:100;
    const root=document.documentElement.dataset;
    root.goodsLoaded=String(loaded);root.goodsTotal=String(total);
    setMapLoadProgress(MAP_LOAD_PROGRESS);
   })
  ]);
  document.documentElement.dataset.goodsCached=String(goods.stats.cached);
  document.documentElement.dataset.goodsDownloaded=String(goods.stats.downloaded);
  document.documentElement.dataset.harborsCached=String(harbors.stats.cached);
  document.documentElement.dataset.harborsDownloaded=String(harbors.stats.downloaded);
  finishMapLoading();
 }catch(error){console.error('[Rotta startup]',error);$('#mapLoaderText').textContent='다운로드 실패';retry.classList.remove('hidden')}
 finally{STARTUP.running=false}
}
async function buildVectorMap(imageCoastline=ACTIVE_IMAGE_COASTLINE){const svg=d3.select('#chartMap');svg.selectAll('.generated-map').remove();NAV_RENDER.coastRenderer=null;svg.insert('rect',':first-child').attr('class','map-ocean generated-map').attr('width',WORLD.w).attr('height',WORLD.h);svg.append('rect').attr('class','map-patina generated-map').attr('width',WORLD.w).attr('height',WORLD.h);if(imageCoastline){const scaleX=WORLD.w/imageCoastline.worldWidth,scaleY=WORLD.h/imageCoastline.worldHeight,hasManualTrace=Boolean(imageCoastline.coastChunks?.length||imageCoastline.tracePaths?.length),land=svg.append('g').attr('class',`generated-map image-derived-land${hasManualTrace?' has-manual-trace':''}`).attr('transform',`scale(${scaleX} ${scaleY})`);land.append('path').attr('class','map-land image-derived-coast').attr('d',imageCoastline.paths.join(' ')).attr('fill-rule','evenodd').attr('vector-effect','non-scaling-stroke');if(imageCoastline.coastChunks?.length&&window.ROTTA_COAST_RENDERER){NAV_RENDER.coastRenderer=window.ROTTA_COAST_RENDERER.mount(land.node(),imageCoastline.coastChunks);updateCoastVisibility()}else if(hasManualTrace)land.append('path').attr('class','manual-trace-coast').attr('d',imageCoastline.tracePaths.length?imageCoastline.tracePaths.join(' '):(imageCoastline.coastChunks||[]).map(c=>c.d).join(' ')).attr('vector-effect','non-scaling-stroke');document.documentElement.dataset.mapCoastSource=hasManualTrace?'manual-trace':'image'}else{const world=await d3.json('assets/land-10m.json'),land=topojson.feature(world,world.objects.land),projection=d3.geoMercator().scale(WORLD.w/(2*Math.PI)).translate([WORLD.w/2,WORLD.h/2]),path=d3.geoPath(projection);svg.append('path').datum(land).attr('class','map-land generated-map').attr('d',path).attr('vector-effect','non-scaling-stroke');svg.append('g').attr('class','generated-map charted-islands').selectAll('circle').data([...CHARTED_ISLANDS].map(id=>PORTS[id]).filter(Boolean)).enter().append('circle').attr('class','map-port-island').attr('cx',p=>p.rawX??p.x).attr('cy',p=>p.rawY??p.y).attr('r',2.4);document.documentElement.dataset.mapCoastSource='natural-earth'}svg.append('rect').attr('class','map-frame generated-map').attr('x',9).attr('y',9).attr('width',WORLD.w-18).attr('height',WORLD.h-18);NAV_RENDER.vectorReady=true;NAV_RENDER.world.classList.toggle('low-detail',state.zoom<=2.5)}
async function buildNavMask(){let vectorData=null;try{const nav=maskCandidate(NAV),coast=maskCandidate(COAST),loaded=await Promise.all([loadMaskAsset(nav,'assets/image-nav-mask.bin?v=61'),loadMaskAsset(coast,'assets/image-coast-mask.bin?v=62'),loadImageCoastlineAsset()]);commitMask(NAV,nav);commitMask(COAST,coast);vectorData=loaded[2];ACTIVE_IMAGE_COASTLINE=vectorData;ACTIVE_MAP_DATASET=vectorData.dataset}catch(imageErr){console.warn('[Rotta image-derived coast fallback]',imageErr);try{const nav=maskCandidate(NAV),coast=maskCandidate(COAST);await Promise.all([loadMaskAsset(nav,'assets/nav-mask.bin?v=38'),loadMaskAsset(coast,'assets/coast-mask.bin?v=38')]);commitMask(NAV,nav);commitMask(COAST,coast);ACTIVE_IMAGE_COASTLINE=null;ACTIVE_MAP_DATASET='Natural Earth 1:10m'}catch(err){console.error(err);toast('저장된 항해 지도를 불러오지 못했습니다.');return}}setMapLoadProgress(96);const audit=snapAllPorts();$('#routeInfo').textContent=audit.ok?`${ACTIVE_MAP_DATASET} · ${PORT_COUNT}개 거점 전수 검증 완료 · 바다를 클릭해 이동`:`지도 판독 경고 · 미해결 거점 ${audit.unresolved.length}곳`;const schedule=window.requestIdleCallback||((fn)=>setTimeout(fn,16));schedule(()=>buildVectorMap(vectorData).catch(async err=>{console.error(err);if(vectorData){ACTIVE_IMAGE_COASTLINE=null;ACTIVE_MAP_DATASET='Natural Earth 1:10m';try{await buildVectorMap(null)}catch(fallbackErr){console.error(fallbackErr)}}}),{timeout:1200})}
function maskGridAt(mask,wx,wy){return{x:Math.max(0,Math.min(mask.w-1,Math.floor(wx/mask.cellX))),y:Math.max(0,Math.min(mask.h-1,Math.floor(wy/mask.cellY)))}}
function maskWorldAt(mask,gx,gy){return{x:(gx+.5)*mask.cellX,y:(gy+.5)*mask.cellY}}
function gridAt(wx,wy){return maskGridAt(NAV,wx,wy)}
function worldAt(gx,gy){return maskWorldAt(NAV,gx,gy)}
function isCoastLand(mask,x,y){if(x<1||y<1||x>=mask.w-1||y>=mask.h-1||mask.rawWater[y*mask.w+x])return false;for(let yy=-1;yy<=1;yy++)for(let xx=-1;xx<=1;xx++)if(mask.rawWater[(y+yy)*mask.w+x+xx])return true;return false}
function nearestMaskCell(mask,wx,wy,maxR,predicate){if(!mask.ready)return null;const g=maskGridAt(mask,wx,wy);for(let r=0;r<=maxR;r++){let best=null,bestD=Infinity;for(let y=Math.max(0,g.y-r);y<=Math.min(mask.h-1,g.y+r);y++)for(let x=Math.max(0,g.x-r);x<=Math.min(mask.w-1,g.x+r);x++){if(Math.max(Math.abs(x-g.x),Math.abs(y-g.y))!==r||!predicate(x,y))continue;const d=(x-g.x)**2+(y-g.y)**2;if(d<bestD){best={x,y};bestD=d}}if(best)return best}return null}
function nearestWater(wx,wy,maxR=24){return nearestMaskCell(NAV,wx,wy,maxR,(x,y)=>!!NAV.water[y*NAV.w+x])}
function nearestPreciseWater(wx,wy,maxR=260){return nearestMaskCell(COAST,wx,wy,maxR,(x,y)=>!!COAST.water[y*COAST.w+x])}
function isNavigableRawWater(x,y){if(x<1||y<1||x>=COAST.w-1||y>=COAST.h-1||!COAST.rawWater[y*COAST.w+x])return false;let neighbors=0;for(let yy=-1;yy<=1;yy++)for(let xx=-1;xx<=1;xx++)if((xx||yy)&&COAST.rawWater[(y+yy)*COAST.w+x+xx])neighbors++;return neighbors>=3}
function nearestPreciseRawWater(wx,wy,maxR=32){return nearestMaskCell(COAST,wx,wy,maxR,isNavigableRawWater)}
function nearestPreciseCoast(wx,wy,maxR=260){return nearestMaskCell(COAST,wx,wy,maxR,(x,y)=>isCoastLand(COAST,x,y))}
function nearestPreciseLand(wx,wy,maxR=120){return nearestMaskCell(COAST,wx,wy,maxR,(x,y)=>!COAST.rawWater[y*COAST.w+x])}
function preciseWaterAt(wx,wy,safe=true){if(!COAST.ready)return false;const g=maskGridAt(COAST,wx,wy),data=safe?COAST.water:COAST.rawWater;return !!data[g.y*COAST.w+g.x]}
function headingFromVector(dx,dy){return(Math.atan2(dx,-dy)*180/Math.PI+360)%360}
function seaClearance(wx,wy,heading,maxDistance=96){const angle=heading*Math.PI/180,sx=Math.sin(angle),sy=-Math.cos(angle),step=Math.max(1.5,Math.min(COAST.cellX,COAST.cellY));for(let d=step;d<=maxDistance;d+=step)if(!preciseWaterAt(wx+sx*d,wy+sy*d,false))return d-step;return maxDistance}
function bestSeaHeading(wx,wy,base=null){let best=base??0,bestClearance=-1,bestScore=-Infinity;const start=base==null?0:-100,end=base==null?355:100;for(let value=start;value<=end;value+=5){const heading=base==null?value:(base+value+360)%360,clearance=seaClearance(wx,wy,heading),score=clearance+(base==null?0:(1-Math.abs(value)/100)*14);if(score>bestScore){best=heading;bestClearance=clearance;bestScore=score}}return{heading:best,clearance:bestClearance}}
function clearStraitGuide(status='idle'){MANUAL_SAIL.guide=null;MANUAL_SAIL.guideIndex=1;document.documentElement.dataset.straitAssist=status}
function narrowWaterAhead(wx,wy,heading){const forward=seaClearance(wx,wy,heading,18);if(forward>=12)return false;return seaClearance(wx,wy,(heading+270)%360,32)<32&&seaClearance(wx,wy,(heading+90)%360,32)<32}
function buildStraitGuide(wx,wy,heading){if(!COAST.ready||!preciseWaterAt(wx,wy,false))return null;const start=maskGridAt(COAST,wx,wy),radius=48,minX=Math.max(1,start.x-radius),maxX=Math.min(COAST.w-2,start.x+radius),minY=Math.max(1,start.y-radius),maxY=Math.min(COAST.h-2,start.y+radius),width=maxX-minX+1,height=maxY-minY+1,size=width*height,index=(x,y)=>(y-minY)*width+x-minX,came=new Int32Array(size),steps=new Uint16Array(size),queue=new Int32Array(size),si=index(start.x,start.y),angle=heading*Math.PI/180,fx=Math.sin(angle),fy=-Math.cos(angle),dirs=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];came.fill(-2);came[si]=-1;queue[0]=si;let head=0,tail=1,best=-1,bestScore=6;while(head<tail){const at=queue[head++],x=at%width+minX,y=Math.floor(at/width)+minY,point=maskWorldAt(COAST,x,y),vx=point.x-wx,vy=point.y-wy,forward=vx*fx+vy*fy,lateral=Math.abs(vx*fy-vy*fx);if(forward>6){const clearance=seaClearance(point.x,point.y,heading,32),score=forward*1.7-lateral*.72+clearance*.2-steps[at]*.04;if(score>bestScore){best=at;bestScore=score}}if(steps[at]>=radius)continue;for(const[dx,dy]of dirs){const nx=x+dx,ny=y+dy;if(nx<minX||ny<minY||nx>maxX||ny>maxY||Math.max(Math.abs(nx-start.x),Math.abs(ny-start.y))>radius)continue;const ni=index(nx,ny);if(came[ni]!==-2||!COAST.rawWater[ny*COAST.w+nx])continue;if(dx&&dy&&(!COAST.rawWater[y*COAST.w+nx]||!COAST.rawWater[ny*COAST.w+x]))continue;came[ni]=at;steps[ni]=steps[at]+1;queue[tail++]=ni}}if(best<0)return null;const points=[];for(let at=best;at!==-1;at=came[at])points.push(maskWorldAt(COAST,at%width+minX,Math.floor(at/width)+minY));points.reverse();points[0]={x:wx,y:wy};const path=simplifyPath(points,3);if(path.length<2)return null;document.documentElement.dataset.straitAssist=`planned:${path.length}`;return path}
function advanceStraitGuide(distance){const guide=MANUAL_SAIL.guide;if(!guide)return null;let x=state.shipX,y=state.shipY,remaining=distance;while(remaining>.0001&&MANUAL_SAIL.guideIndex<guide.length){const target=guide[MANUAL_SAIL.guideIndex],dx=target.x-x,dy=target.y-y,gap=Math.hypot(dx,dy);if(gap<.0001){MANUAL_SAIL.guideIndex++;continue}const step=Math.min(remaining,gap),nx=x+dx/gap*step,ny=y+dy/gap*step;if(!preciseWaterAt(nx,ny,false)){clearStraitGuide('blocked');return null}x=nx;y=ny;remaining-=step;MANUAL_SAIL.heading=headingFromVector(dx,dy);if(step>=gap-.0001)MANUAL_SAIL.guideIndex++}if(MANUAL_SAIL.guideIndex>=guide.length)clearStraitGuide('complete');else document.documentElement.dataset.straitAssist='active';return{x,y}}
function connectedOffshoreCourse(sx,sy){const start=maskGridAt(COAST,sx,sy),queue=[{x:start.x,y:start.y,d:0}],seen=new Set([start.y*COAST.w+start.x]),dirs=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]],radius=72;let best=null,bestScore=-Infinity;for(let qi=0;qi<queue.length;qi++){const cell=queue[qi];if(cell.d>radius)continue;if(cell.d%3===0){const point=maskWorldAt(COAST,cell.x,cell.y),open=bestSeaHeading(point.x,point.y),score=open.clearance-cell.d*.28;if(score>bestScore){best={x:point.x,y:point.y,heading:open.heading,clearance:open.clearance,offset:Math.hypot(point.x-sx,point.y-sy)};bestScore=score;if(open.clearance>=96)return best}}for(const[dx,dy]of dirs){const nx=cell.x+dx,ny=cell.y+dy;if(nx<1||ny<1||nx>=COAST.w-1||ny>=COAST.h-1||Math.max(Math.abs(nx-start.x),Math.abs(ny-start.y))>radius)continue;const key=ny*COAST.w+nx;if(seen.has(key)||!COAST.rawWater[key])continue;if(dx&&dy&&(!COAST.rawWater[cell.y*COAST.w+nx]||!COAST.rawWater[ny*COAST.w+cell.x]))continue;seen.add(key);queue.push({x:nx,y:ny,d:cell.d+1})}}return best}
function nearestOpenSeaCourse(sx,sy){const start=maskGridAt(COAST,sx,sy);for(let radius=18;radius<=180;radius+=6){let best=null;const test=(x,y)=>{if(x<1||y<1||x>=COAST.w-1||y>=COAST.h-1||!COAST.rawWater[y*COAST.w+x])return;const point=maskWorldAt(COAST,x,y);for(let heading=0;heading<360;heading+=45){const clearance=seaClearance(point.x,point.y,heading);if(!best||clearance>best.clearance)best={x:point.x,y:point.y,heading,clearance,offset:Math.hypot(point.x-sx,point.y-sy)}}};for(let d=-radius;d<=radius;d+=6){test(start.x+d,start.y-radius);test(start.x+d,start.y+radius);test(start.x-radius,start.y+d);test(start.x+radius,start.y+d)}if(best&&best.clearance>=48)return best}return null}
function departureCourse(port){if(!port||!COAST.ready)return null;const sx=port.navX??port.x,sy=port.navY??port.y,cx=port.coastX??port.x,cy=port.coastY??port.y,base=headingFromVector(sx-cx,sy-cy);let course=bestSeaHeading(sx,sy,base);course={x:sx,y:sy,heading:course.heading,clearance:course.clearance,offset:0};if(course.clearance<18){const open=bestSeaHeading(sx,sy);if(open.clearance>course.clearance)course={x:sx,y:sy,heading:open.heading,clearance:open.clearance,offset:0}}if(course.clearance<18){const offshore=connectedOffshoreCourse(sx,sy);if(offshore&&offshore.clearance>course.clearance)course=offshore}if(course.clearance<18){const openSea=nearestOpenSeaCourse(sx,sy);if(openSea&&openSea.clearance>course.clearance)course=openSea}return course}
function setDepartureHeading(port){const course=departureCourse(port);if(!course)return false;state.shipX=course.x;state.shipY=course.y;MANUAL_SAIL.heading=course.heading;MANUAL_SAIL.velocity=0;document.documentElement.dataset.departureHeading=course.heading.toFixed(1);document.documentElement.dataset.departureClearance=course.clearance.toFixed(1);document.documentElement.dataset.departureOffset=course.offset.toFixed(1);return true}
function heapPush(heap,node){heap.push(node);let i=heap.length-1;while(i){const p=(i-1)>>1;if(heap[p].f<=node.f)break;heap[i]=heap[p];i=p}heap[i]=node}
function heapPop(heap){const root=heap[0],last=heap.pop();if(heap.length){let i=0;while(true){let c=i*2+1;if(c>=heap.length)break;if(c+1<heap.length&&heap[c+1].f<heap[c].f)c++;if(heap[c].f>=last.f)break;heap[i]=heap[c];i=c}heap[i]=last}return root}
// Use the precise sea grid for bounded regional voyages too: coarse ocean cells
// cannot represent narrow straits. Cap workspace and expansions to avoid full-world A*.
function findLocalSeaPath(startWorld,endWorld){
 const distance=Math.hypot(endWorld.x-startWorld.x,endWorld.y-startWorld.y);
 if(distance>720){document.documentElement.dataset.localRoute='distance';return null}
 const s=maskGridAt(COAST,startWorld.x,startWorld.y),e=maskGridAt(COAST,endWorld.x,endWorld.y);
 if(!COAST.rawWater[s.y*COAST.w+s.x]||!COAST.rawWater[e.y*COAST.w+e.x]){document.documentElement.dataset.localRoute='endpoint';return null}
 const margin=64,minX=Math.max(0,Math.min(s.x,e.x)-margin),maxX=Math.min(COAST.w-1,Math.max(s.x,e.x)+margin),minY=Math.max(0,Math.min(s.y,e.y)-margin),maxY=Math.min(COAST.h-1,Math.max(s.y,e.y)+margin),width=maxX-minX+1,height=maxY-minY+1,size=width*height;
 if(size>160000){document.documentElement.dataset.localRoute='budget:cells';return null}
 const index=(x,y)=>(y-minY)*width+x-minX,gScore=new Float32Array(size),came=new Int32Array(size),closed=new Uint8Array(size);
 gScore.fill(Infinity);came.fill(-1);
 const si=index(s.x,s.y),ei=index(e.x,e.y),open=[];let expanded=0;
 gScore[si]=0;heapPush(open,{i:si,x:s.x,y:s.y,f:distance});
 const dirs=[[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,1.414],[1,-1,1.414],[-1,1,1.414],[-1,-1,1.414]];
 while(open.length){
  const cur=heapPop(open);if(closed[cur.i])continue;
  if(cur.i===ei){
   const points=[];let at=ei;
   while(at!==-1){const x=at%width+minX,y=Math.floor(at/width)+minY;points.push(maskWorldAt(COAST,x,y));if(at===si)break;at=came[at]}
   points.reverse();points.unshift(startWorld);points.push(endWorld);
   document.documentElement.dataset.localRoute=`ok:${expanded}`;return simplifyPath(points,4);
  }
  if(expanded>=24000){document.documentElement.dataset.localRoute='budget:expanded';return null}
  closed[cur.i]=1;expanded++;
  for(const[dx,dy,cost]of dirs){
   const nx=cur.x+dx,ny=cur.y+dy;
   if(nx<minX||ny<minY||nx>maxX||ny>maxY||!COAST.rawWater[ny*COAST.w+nx])continue;
   if(dx&&dy&&(!COAST.rawWater[cur.y*COAST.w+nx]||!COAST.rawWater[ny*COAST.w+cur.x]))continue;
   const ni=index(nx,ny);if(closed[ni])continue;
   const ng=gScore[cur.i]+cost;
   if(ng<gScore[ni]){gScore[ni]=ng;came[ni]=cur.i;heapPush(open,{i:ni,x:nx,y:ny,f:ng+Math.hypot(e.x-nx,e.y-ny)})}
  }
 }
 document.documentElement.dataset.localRoute=`blocked:${expanded}`;return null;
}
function snapAllPorts(){const audit={dataset:ACTIVE_MAP_DATASET,mask:`${COAST.w}×${COAST.h}`,waterCells:COAST.waterCells,landCells:COAST.landCells,ports:PORT_COUNT,coastal:0,inland:0,chartedIslands:0,validDocks:0,validMarkers:0,unresolved:[],outliers:[],dockOutliers:[],maxDockOffset:0,meanDockOffset:0};let distanceTotal=0;for(const [id,p] of Object.entries(PORTS)){const sourceX=p.rawX??p.x,sourceY=p.rawY??p.y,manualPosition=Object.prototype.hasOwnProperty.call(window.ROTTA_PORT_POSITIONS||{},id);if(manualPosition){const water=nearestPreciseRawWater(sourceX,sourceY,32);if(!water){audit.unresolved.push(id);continue}const w=maskWorldAt(COAST,water.x,water.y);p.syntheticIsland=false;p.inland=INLAND_HUBS.has(id);p.x=sourceX;p.y=sourceY;p.navX=w.x;p.navY=w.y;p.coastX=sourceX;p.coastY=sourceY;p.coastDistance=0;p.inland?audit.inland++:audit.coastal++;audit.validDocks++;audit.validMarkers++;const offset=Math.hypot(p.navX-p.coastX,p.navY-p.coastY);if(offset>14)audit.dockOutliers.push({id,name:p.name,distance:Number(offset.toFixed(1))});distanceTotal+=offset;audit.maxDockOffset=Math.max(audit.maxDockOffset,offset);continue}if(CHARTED_ISLANDS.has(id)&&!ACTIVE_IMAGE_COASTLINE){const water=nearestPreciseRawWater(sourceX+4,sourceY,16);if(!water){audit.unresolved.push(id);continue}const w=maskWorldAt(COAST,water.x,water.y);p.inland=false;p.syntheticIsland=true;p.x=sourceX;p.y=sourceY;p.navX=w.x;p.navY=w.y;p.coastX=sourceX;p.coastY=sourceY;p.coastDistance=0;audit.coastal++;audit.chartedIslands++;audit.validDocks++;audit.validMarkers++;const offset=Math.hypot(p.navX-p.x,p.navY-p.y);distanceTotal+=offset;audit.maxDockOffset=Math.max(audit.maxDockOffset,offset);continue}const coast=nearestPreciseCoast(sourceX,sourceY),land=nearestPreciseLand(sourceX,sourceY);if(!coast||!land){audit.unresolved.push(id);continue}const c=maskWorldAt(COAST,coast.x,coast.y),coastDistance=Math.hypot(c.x-sourceX,c.y-sourceY),water=nearestPreciseRawWater(c.x,c.y,8);if(!water){audit.unresolved.push(id);continue}const w=maskWorldAt(COAST,water.x,water.y),l=maskWorldAt(COAST,land.x,land.y);p.syntheticIsland=false;p.inland=INLAND_HUBS.has(id);p.x=p.inland?l.x:c.x;p.y=p.inland?l.y:c.y;p.navX=w.x;p.navY=w.y;p.coastX=c.x;p.coastY=c.y;p.coastDistance=coastDistance;p.inland?audit.inland++:audit.coastal++;if(coastDistance>18)audit.outliers.push({id,name:p.name,distance:Number(coastDistance.toFixed(1))});if(preciseWaterAt(p.navX,p.navY,false))audit.validDocks++;const marker=maskGridAt(COAST,p.x,p.y);if((p.inland&&!COAST.rawWater[marker.y*COAST.w+marker.x])||(!p.inland&&isCoastLand(COAST,marker.x,marker.y)))audit.validMarkers++;const offset=Math.hypot(p.navX-p.coastX,p.navY-p.coastY);if(offset>9)audit.dockOutliers.push({id,name:p.name,distance:Number(offset.toFixed(1))});distanceTotal+=offset;audit.maxDockOffset=Math.max(audit.maxDockOffset,offset)}audit.meanDockOffset=Number((distanceTotal/Math.max(1,PORT_COUNT-audit.unresolved.length)).toFixed(2));audit.maxDockOffset=Number(audit.maxDockOffset.toFixed(2));const connectivity=auditNavigationConnectivity();audit.navigation=connectivity;audit.ok=!audit.unresolved.length&&audit.validDocks===PORT_COUNT&&audit.validMarkers===PORT_COUNT&&audit.maxDockOffset<=14&&!connectivity.blocked.length;const departureRows=Object.entries(PORTS).map(([id,p])=>{const course=departureCourse(p);return{id,heading:course?.heading??0,clearance:course?.clearance??0}}),departureAudit={ports:departureRows.length,minClearance:Number(Math.min(...departureRows.map(x=>x.clearance)).toFixed(1)),blocked:departureRows.filter(x=>x.clearance<12)};window.ROTTA_DEPARTURE_AUDIT=departureAudit;document.documentElement.dataset.departureAudit=JSON.stringify(departureAudit);window.ROTTA_MAP_AUDIT=audit;document.documentElement.dataset.mapAudit=JSON.stringify(audit);console.info('[Rotta map audit]',audit);console.info('[Rotta departure audit]',departureAudit);renderSeaPorts();$('#setCourseBtn').disabled=!audit.ok;if($('#sailingView').classList.contains('active'))$('#routeInfo').textContent=audit.ok?`전 항구 ${PORT_COUNT}곳 검증 완료 · 접안점과 해안선 일치`:`지도 감사 필요 · 미해결 ${audit.unresolved.length}곳`;if(state.current){const p=PORTS[state.current];state.shipX=p.navX??p.x;state.shipY=p.navY??p.y;if(state.atPort&&$('#sailingView').classList.contains('active'))setDepartureHeading(p);updateShip();updateCamera()}return audit}
function findSeaPath(startWorld,endWorld){if(!NAV.ready||!COAST.ready)return null;if(waterLineClear(startWorld,endWorld)){document.documentElement.dataset.routeMode='direct';return[startWorld,endWorld]}const local=findLocalSeaPath(startWorld,endWorld);if(local){document.documentElement.dataset.routeMode='local';return local}document.documentElement.dataset.routeMode='ocean';const s=nearestWater(startWorld.x,startWorld.y,8),e=nearestWater(endWorld.x,endWorld.y,8);if(!s||!e)return null;const size=NAV.w*NAV.h,gScore=new Float32Array(size),came=new Int32Array(size),closed=new Uint8Array(size);gScore.fill(Infinity);came.fill(-1);const si=s.y*NAV.w+s.x,ei=e.y*NAV.w+e.x;gScore[si]=0;const open=[{i:si,x:s.x,y:s.y,f:0}],dirs=[[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,1.414],[1,-1,1.414],[-1,1,1.414],[-1,-1,1.414]];while(open.length){const cur=heapPop(open);if(cur.i===ei){const cells=[];let at=ei;while(at!==-1){cells.push(worldAt(at%NAV.w,Math.floor(at/NAV.w)));if(at===si)break;at=came[at]}cells.reverse();return refineOceanPath([startWorld,...cells,endWorld])}if(closed[cur.i])continue;closed[cur.i]=1;for(const [dx,dy,cost] of dirs){const nx=cur.x+dx,ny=cur.y+dy;if(nx<0||ny<0||nx>=NAV.w||ny>=NAV.h)continue;const ni=ny*NAV.w+nx;if(!NAV.water[ni]||closed[ni])continue;if(dx&&dy&&(!NAV.water[cur.y*NAV.w+nx]||!NAV.water[ny*NAV.w+cur.x]))continue;const ng=gScore[cur.i]+cost;if(ng<gScore[ni]){gScore[ni]=ng;came[ni]=cur.i;const h=Math.hypot(e.x-nx,e.y-ny);heapPush(open,{i:ni,x:nx,y:ny,f:ng+h})}}}return null}
// Traverse every crossed collision cell, including both sides of diagonal corners.
function waterLineClear(a,b){
 if(!COAST.ready||![a.x,a.y,b.x,b.y].every(Number.isFinite)||Math.min(a.x,b.x)<0||Math.min(a.y,b.y)<0||Math.max(a.x,b.x)>=WORLD.w||Math.max(a.y,b.y)>=WORLD.h)return false;
 const start=maskGridAt(COAST,a.x,a.y),end=maskGridAt(COAST,b.x,b.y),dx=b.x-a.x,dy=b.y-a.y,sx=Math.sign(dx),sy=Math.sign(dy),water=(x,y)=>x>=0&&y>=0&&x<COAST.w&&y<COAST.h&&!!COAST.rawWater[y*COAST.w+x];
 let x=start.x,y=start.y;if(!water(x,y))return false;
 const stepX=dx?COAST.cellX/Math.abs(dx):Infinity,stepY=dy?COAST.cellY/Math.abs(dy):Infinity;
 let nextX=dx?((x+(sx>0?1:0))*COAST.cellX-a.x)/dx:Infinity,nextY=dy?((y+(sy>0?1:0))*COAST.cellY-a.y)/dy:Infinity;
 while(x!==end.x||y!==end.y){
  if(Math.abs(nextX-nextY)<1e-10){if(!water(x+sx,y)||!water(x,y+sy))return false;x+=sx;y+=sy;nextX+=stepX;nextY+=stepY;}
  else if(nextX<nextY){x+=sx;nextX+=stepX;}else{y+=sy;nextY+=stepY;}
  if(!water(x,y))return false;
 }
 return true;
}
function seaPathClear(points){return !!points&&points.length>=2&&points.every((point,i)=>i===0||waterLineClear(points[i-1],point));}
// Ocean-grid cells are hints, never permission to cross the precise coastline.
function refineOceanPath(points){
 const anchors=points.filter((point,i)=>i===0||i===points.length-1||preciseWaterAt(point.x,point.y,false)),out=[anchors[0]];
 for(let i=1;i<anchors.length;i++){
  const a=out[out.length-1],b=anchors[i];if(Math.hypot(b.x-a.x,b.y-a.y)<1e-8)continue;
  if(waterLineClear(a,b)){out.push(b);continue;}
  const detour=findLocalSeaPath(a,b);if(!seaPathClear(detour)){if(i<anchors.length-1)continue;return null;}
  out.push(...detour.slice(1));
 }
 const route=simplifyPath(out);return seaPathClear(route)?route:null;
}
function simplifyPath(points,maxSpan=14){if(points.length<3)return points;const out=[points[0]];let anchor=0;while(anchor<points.length-1){let next=Math.min(points.length-1,anchor+maxSpan);while(next>anchor+1&&!waterLineClear(points[anchor],points[next]))next--;out.push(points[next]);anchor=next}return out}
function hash(s){let h=0;for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))|0;return Math.abs(h)}
function toward(name){const code=name.charCodeAt(name.length-1)-0xac00,jong=code>=0&&code<=11171?code%28:0;return `${name}${jong&&jong!==8?'으로':'로'}`}
function cargoTotal(){return Object.values(state.cargo).reduce((a,b)=>a+b,0)}
function nationalBuyPrice(key,value){return Math.max(5,Math.round(value*(state.nation==='portugal'&&['pepper','clove','nutmeg','mace'].includes(key)?.92:1)))}
function marketPriceAt(pid,key,side='buy'){const raw=MARKET_SIM?.prices?.quote(pid,key);if(raw){const buy=nationalBuyPrice(key,raw.buy);if(side==='buy')return buy;let sell=raw.sell;if(state.nation==='spain'&&key==='silver')sell*=1.14;if(state.nation==='england'&&key==='wool')sell*=1.1;if(state.nation==='france'&&key==='wine')sell*=1.1;return Math.max(1,Math.min(buy-1,Math.floor(sell)))}const p=PORTS[pid],g=GOODS[key],local=p.market[key]??(.94+(hash(pid+key+state.seed)%67)/100),pulse=((hash(`${pid}:${key}:${state.year}:${state.month}`)%17)-8)/100,e=marketEffects(pid,key);let base=g.base*local*(1+pulse)*e.price,buy=base*(1+e.tax);if(state.nation==='portugal'&&['pepper','clove','nutmeg','mace'].includes(key))buy*=.92;buy=Math.max(5,Math.round(buy));if(side==='buy')return buy;let sell=base*.85*(1-e.tax);if(state.nation==='spain'&&key==='silver')sell*=1.14;if(state.nation==='england'&&key==='wool')sell*=1.1;if(state.nation==='france'&&key==='wine')sell*=1.1;return Math.max(1,Math.min(buy-1,Math.floor(sell)))}
function marketSignal(pid,key){const local=PORTS[pid].market[key];if(local==null)return{label:'수입품',className:'imported'};if(local<=.62)return{label:'대표 특산',className:'specialty'};if(local<=.76)return{label:'풍부',className:'abundant'};return{label:'보통',className:'regular'}}
function init(){NAV_RENDER.viewport=$('#seaViewport');NAV_RENDER.world=$('#oceanWorld');NAV_RENDER.ship=$('#ship');renderNations();renderSeaPorts();loadStartupAssets();$('#closeFacility').onclick=closeFacility;$('#departBtn').onclick=openSailing;$('#setCourseBtn').onclick=startCourse;$('#returnPortBtn').onclick=enterPort;$('#eventClose').onclick=()=>$('#eventModal').classList.add('hidden');$('#tradeCancel').onclick=closeTradeDialog;$('#tradeConfirm').onclick=confirmTrade;$('#tradeQuantity').oninput=updateTradePreview;$$('[data-trade-quick]').forEach(b=>b.onclick=()=>setTradeQuick(b.dataset.tradeQuick));$('#zoomRange').oninput=e=>setZoom(Number(e.target.value));$('#resumeGameBtn').onclick=closeSystem;$('#waitDayBtn').onclick=waitOneDay;$('#closeSeaMarket').onclick=closeSeaMarket;$('#restartGameBtn').onclick=()=>location.reload();$('#systemModal').onclick=e=>{if(e.target.id==='systemModal')closeSystem()};document.addEventListener('keydown',handleGlobalKey);document.addEventListener('keyup',releaseManualKey);window.addEventListener('blur',clearManualKeys);const viewport=NAV_RENDER.viewport;viewport.onkeydown=panCamera;viewport.addEventListener('wheel',zoomWheel,{passive:false});viewport.addEventListener('pointerdown',startMapDrag);viewport.addEventListener('pointermove',dragMap);viewport.addEventListener('pointerup',stopMapDrag);viewport.addEventListener('pointercancel',stopMapDrag);viewport.onclick=seaClick;window.onresize=()=>{syncViewportMetrics();updateCamera()};setZoom(state.zoom)}
function renderNations(){$('#nationGrid').innerHTML=Object.entries(NATIONS).map(([id,n])=>`<button class="nation-card" data-nation="${id}"><span class="emblem">${n.flag}</span><h3>${n.name}</h3><ul>${n.bonuses.map(x=>`<li>${x}</li>`).join('')}</ul></button>`).join('');$$('[data-nation]').forEach(b=>b.onclick=()=>startGame(b.dataset.nation))}
function startGame(id){if(!STARTUP.ready)return;const n=NATIONS[id],p=PORTS[n.port];state.nation=id;initMarketSystem();state.gold=n.gold;state.bargain=n.bargain;state.current=n.port;state.shipX=p.navX??p.x;state.shipY=p.navY??p.y;prefetchMapTileAt(state.shipX,state.shipY);$('#nationModal').classList.add('hidden');toast(`${n.name}의 특허장을 받았습니다.`);renderPort();updateStats()}
function renderPort(){const p=PORTS[state.current],home=NATIONS[state.nation].port===state.current,southClass=(state.current==='bahia'||p.region==='브라질'||p.region==='남미 동해안')?'south-atlantic':p.region==='남미 서해안/태평양'?'south-pacific':'';switchView('port');$('#portScene').className=`port-scene ${home?state.nation:'other'} ${southClass}`;window.ROTTA_HARBORS?.show($('#portScene'),state.current);$('#portName').textContent=p.name;$('#portRegion').textContent=`${p.region} · ${p.climate}`;$('#portFlavor').textContent=p.flavor;$('#placeType').textContent='';$('#placeName').textContent=p.name;window.ROTTA_MANSION_TRANSITION?.cancel();closeFacilityNow();const ids=['trade','shop','shipyard'];if(p.royal)ids.push('royal');if(p.mansion)ids.push('mansion');if(p.bank)ids.push('bank');$('#facilityLayer').innerHTML=`<div class="facility-ledger-head" aria-hidden="true"></div>`+ids.map(id=>{const f=FACILITIES[id];return `<button class="facility material-${FACILITY_MATERIAL[id]}" data-facility="${id}" aria-label="${f.name}" aria-pressed="false">${facilitySymbolMarkup(id)}<span class="facility-copy"><b>${f.name}</b></span><em>›</em></button>`}).join('');$$('[data-facility]').forEach(b=>b.onclick=()=>openFacility(b.dataset.facility))}
function closeFacility(){
 return leaveMansion(closeFacilityNow);
}
function leaveMansion(commit){
 const dialogue=window.ROTTA_MANSION_DIALOGUE,transition=window.ROTTA_MANSION_TRANSITION;
 if((dialogue?.active||$('#portScene').classList.contains('mansion-interior'))&&transition&&!transition.active){
  dialogue?.fold?.();return transition.play(commit,{direction:'exit'});
 }
 transition?.cancel();return commit();
}
function closeFacilityNow(){
 window.ROTTA_TRADE_BASKET?.cancel();MARKET_BASKET_UI.mode='owned';closeTradeDialog();
 window.ROTTA_MANSION_NAVIGATION?.cancel();
 window.ROTTA_MANSION_DIALOGUE?.unmount();window.ROTTA_MARKET_DRAWER?.unmount();window.ROTTA_MANSIONS?.clear($('#portScene'));window.ROTTA_FACILITY_SCENES?.clear($('#portScene'));
 $('#facilityPanel').classList.add('hidden');$('#cargoPanel').classList.add('hidden');$('#portView').classList.remove('facility-mode','trade-mode','mansion-dialogue-mode');
 $$('[data-facility]').forEach(b=>{b.classList.remove('active');b.setAttribute('aria-pressed','false')});$('#portView').focus({preventScroll:true});
}
function marketBars(pid,key){return(MARKET_SIM?.prices?.series(pid,key)||[]).map(bar=>({...bar,...Object.fromEntries(['open','high','low','close'].map(k=>[k,nationalBuyPrice(key,bar[k])]))}))}
function renderMarketChart(){
 const chart=$('#marketChart'),key=MARKET_UI.key;if(!chart||!key||!window.ROTTA_MARKET_CHART||!MARKET_SIM?.prices)return;
 const bars=marketBars(state.current,key);chart.innerHTML=window.ROTTA_MARKET_CHART.render({name:GOODS[key].name,profile:MARKET_SIM.prices.profile(key),bars,selected:MARKET_UI.month,width:chart.clientWidth});
 $$('[data-chart-month]').forEach(b=>{const select=()=>{MARKET_UI.month=b.dataset.chartMonth;renderMarketChart();$('#marketChart [aria-pressed="true"]')?.focus()};b.onclick=select;b.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select()}}});
}
function selectMarketGood(key){if(!GOODS[key]||!(key in PORTS[state.current].market))return;MARKET_UI.key=key;MARKET_UI.month=null;$$('[data-market-good]').forEach(row=>{const selected=row.dataset.marketGood===key;row.classList.toggle('selected',selected);row.querySelector('[data-select-good]')?.setAttribute('aria-pressed',String(selected))});renderMarketChart()}
function closeSystem(){$('#systemModal').classList.add('hidden')}
function toggleSystem(){if(!state.nation)return;$('#waitDayBtn').disabled=state.traveling||MANUAL_SAIL.velocity>.001;$('#systemModal').classList.toggle('hidden')}
function handleGlobalKey(e){
 if(window.ROTTA_TRADE_BASKET?.handleKey(e))return;
 if(pendingTrade&&e.key==='Enter'&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!e.isComposing){e.preventDefault();if(!e.repeat)confirmTrade();return}
 if(window.ROTTA_MANSION_NAVIGATION?.handleKey(e))return;
 if(!window.ROTTA_MANSION_TRANSITION?.active&&['#systemModal','#tradeModal','#eventModal'].every(id=>$(id).classList.contains('hidden'))&&window.ROTTA_MANSION_DIALOGUE?.handleKey(e))return;
 if(window.ROTTA_MANSION_TRANSITION?.active){
  if(e.key==='Escape'){e.preventDefault();return closeFacility()}
  if(!/^[1-9]$/.test(e.key)&&!['Tab','Enter',' '].includes(e.key)){if(!e.ctrlKey&&!e.metaKey&&!e.altKey)e.preventDefault();return}
 }
 if(window.ROTTA_PORT_TRANSITIONS?.active){if(!e.ctrlKey&&!e.metaKey&&!e.altKey)e.preventDefault();return}if(handleArrivalPromptKey(e))return;if((/^[1-9]$/.test(e.key))&&(e.repeat||e.ctrlKey||e.metaKey||e.altKey))return;if(e.key==='Escape'){e.preventDefault();if(SEA_PORT_UI.actionsId||SEA_PORT_UI.quoteId)return closeSeaPortUI();if(!$('#tradeModal').classList.contains('hidden'))return closeTradeDialog();if(!$('#eventModal').classList.contains('hidden'))return $('#eventModal').classList.add('hidden');if(window.ROTTA_MANSION_DIALOGUE?.active&&$('#systemModal').classList.contains('hidden'))return closeFacility();return toggleSystem()}const sailKey={KeyW:'w',KeyA:'a',KeyS:'s',KeyD:'d'}[e.code];if(sailKey&&$('#sailingView').classList.contains('active')){e.preventDefault();if(COAST.ready){if(state.traveling)cancelAutoSail();MANUAL_SAIL.keys.add(sailKey);startManualSailing()}return}const tag=e.target?.tagName;if(['INPUT','SELECT','TEXTAREA'].includes(tag)||e.target?.isContentEditable)return;if(e.key==='1'&&state.nation&&$('#sailingView').classList.contains('active')&&['#systemModal','#tradeModal','#eventModal'].every(id=>$(id).classList.contains('hidden'))){e.preventDefault();return enterPort()}if(e.code==='Space'&&$('#sailingView').classList.contains('active')){e.preventDefault();return centerOnShip()}if(!/^[1-9]$/.test(e.key)||!state.nation||!$('#portView').classList.contains('active')||!$('#systemModal').classList.contains('hidden')||!$('#tradeModal').classList.contains('hidden')||!$('#eventModal').classList.contains('hidden'))return;const button=$$('[data-facility]')[Number(e.key)-1];if(!button)return;e.preventDefault();if(button.classList.contains('active')&&(!$('#facilityPanel').classList.contains('hidden')||window.ROTTA_MANSION_DIALOGUE?.active))closeFacility();else openFacility(button.dataset.facility)}
function releaseManualKey(e){const key={KeyW:'w',KeyA:'a',KeyS:'s',KeyD:'d'}[e.code];if(key)MANUAL_SAIL.keys.delete(key)}
function clearManualKeys(){if(MANUAL_SAIL.frame)cancelAnimationFrame(MANUAL_SAIL.frame);MANUAL_SAIL.frame=0;MANUAL_SAIL.keys.clear();MANUAL_SAIL.last=0;MANUAL_SAIL.velocity=0;clearStraitGuide();if(!state.traveling&&NAV_RENDER.moving&&document.body){document.body.classList.remove('sailing-moving');NAV_RENDER.moving=false}}
function openFacility(id,confirmed=false){
 const dialogue=window.ROTTA_MANSION_DIALOGUE,transition=window.ROTTA_MANSION_TRANSITION;
 if(id!=='mansion'&&dialogue?.active&&dialogue.progressed&&!confirmed&&!transition?.active&&window.ROTTA_MANSION_NAVIGATION){
  return window.ROTTA_MANSION_NAVIGATION.request(()=>openFacility(id,true));
 }
 if(id==='mansion'&&transition){
  if($('#portScene').classList.contains('mansion-interior'))return;
  window.ROTTA_MARKET_DRAWER?.unmount();
  return transition.play(()=>openFacilityNow(id),{afterReveal:()=>window.ROTTA_MANSION_DIALOGUE?.reveal()});
 }
 if(dialogue?.active&&!transition?.active)return leaveMansion(()=>openFacilityNow(id));
 transition?.cancel();return openFacilityNow(id);
}
function openFacilityNow(id){
 window.ROTTA_MANSION_DIALOGUE?.unmount();$('#portView').classList.remove('mansion-dialogue-mode');
 window.ROTTA_MANSIONS?.show($('#portScene'),id,state.current,PORTS[state.current],state.nation);
 window.ROTTA_FACILITY_SCENES?.show($('#portScene'),id,state.current,PORTS[state.current]);
 const f=FACILITIES[id];$('#facilityKicker').textContent=`${PORTS[state.current].name} 항구 시설`;$('#facilityTitle').textContent=f.name;$('#facilityIntro').textContent=f.intro;$('#portView').classList.add('facility-mode');$('#portView').classList.toggle('trade-mode',id==='trade');
 $$('[data-facility]').forEach(b=>{const active=b.dataset.facility===id;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))});
 if(id==='mansion'&&state.current==='lisbon'&&window.ROTTA_MANSION_DIALOGUE){
  window.ROTTA_MARKET_DRAWER?.unmount();$('#facilityContent').replaceChildren();$('#facilityPanel').classList.add('hidden');$('#cargoPanel').classList.add('hidden');$('#portView').classList.add('mansion-dialogue-mode');
  window.ROTTA_MANSION_DIALOGUE.mount($('#mansionDialogue'),{deferReveal:!!window.ROTTA_MANSION_TRANSITION?.active,onClose:closeFacility,onBook:key=>{state.books??={};state.books[key]??={name:'협상의 기본',source:'lisbon'}}});return;
 }
 renderFacility(id);renderCargoPanel(id==='trade');$('#facilityPanel').classList.remove('hidden');$('#cargoPanel').classList.remove('hidden');
}
function marketBasket(){
 if(!MARKET_BASKET)MARKET_BASKET=window.ROTTA_TRADE_BASKET.create({
  context:()=>({port:state.current,gold:state.gold,capacity:state.capacity,cargo:cargoTotal()}),
  buyPrice:key=>priceAt(state.current,key,'buy'),sellQuote:(key,qty)=>cargoSaleQuote(state.current,key,qty),
  stock:key=>marketStock(state.current,key),owned:key=>state.cargo[key]||0,
  hasGood:(key,side)=>!!GOODS[key]&&(side==='sell'||Object.hasOwn(PORTS[state.current]?.market||{},key))
 });
 if(MARKET_BASKET_UI.port!==state.current){MARKET_BASKET_UI.port=state.current;MARKET_BASKET_UI.mode='owned';MARKET_BASKET.clear()}
 if(MARKET_BASKET_UI.mode==='owned'&&MARKET_BASKET.entries('sell').length)MARKET_BASKET_UI.mode='sell';
 return MARKET_BASKET;
}
function basketItemsMarkup(entries,{side=null,readonly=false}={}){
 if(!entries.length)return '<div class="cargo-empty"><span>◇</span><b>비어 있음</b></div>';
 return entries.map(({key,quantity})=>{const g=GOODS[key],sale=side==='sell'&&!readonly,tip=sale?`<span class="sale-price-tip" role="tooltip" id="sale-price-${key}">${fmt(cargoSaleQuote(state.current,key,quantity).total)}g</span>`:'';
  return `<button type="button" class="basket-item"${readonly?' disabled':` data-basket-item="${key}" data-basket-side="${side}"`}${sale?` aria-describedby="sale-price-${key}"`:` title="${g.name}"`} aria-label="${g.name} ${quantity}개${sale?' 판매 취소':''}">${goodArt(key,g.icon)}<b>${fmt(quantity)}</b>${tip}</button>`;
 }).join('');
}
function bindBasketItems(container){container.querySelectorAll('[data-basket-item]').forEach(button=>button.onclick=()=>{
 const {basketItem:key,basketSide:side}=button.dataset;
 if(side==='sell')return cancelSaleBasketItem(key);
 if(side==='buy')return cancelPurchaseBasketItem(key);
 if(side==='stock')openTradeDialog(key,'sell',{append:true});
})}
function cancelPurchaseBasketItem(key){
 const basket=marketBasket();if(!basket.quantity('buy',key))return;
 basket.set('buy',key,0);renderCargoPanel(true);
 ($(`[data-buy="${key}"]`)||$('#cargoPanelBack')).focus({preventScroll:true});
}
function availableCargoEntries(){
 const basket=marketBasket();return Object.entries(state.cargo).filter(([key])=>GOODS[key]).map(([key,quantity])=>({key,quantity:Math.max(0,quantity-basket.quantity('sell',key))})).filter(row=>row.quantity>0);
}
function cancelSaleBasketItem(key){
 const basket=marketBasket();if(!basket.quantity('sell',key))return;
 basket.set('sell',key,0);
 if(MARKET_BASKET_UI.mode==='sell'&&!basket.entries('sell').length)MARKET_BASKET_UI.mode='owned';
 renderFacility('trade');renderCargoPanel(true);
 ($(`#cargoPanel [data-basket-item="${key}"]`)||$('#cargoPanelBack')).focus({preventScroll:true});
}
function cargoLedgerMarkup(entries,{side='stock',readonly=false}={}){
 if(!entries.length)return '<div class="cargo-empty"><span>◇</span><b>비어 있음</b></div>';
 return entries.map(({key,quantity})=>{
  const g=GOODS[key],signal=marketSignal(state.current,key),offset=!readonly&&side==='stock'?marketBasket().quantity('sell',key):0;
  const unit=side==='buy'?fmt(priceAt(state.current,key,'buy')):cargoUnitLabel(cargoSaleQuote(state.current,key,quantity,offset));
  const body=`${goodArt(key,g.icon)}<span class="cargo-good"><b>${g.name}</b><small>${fmt(quantity)}개 · ${unit} 골드</small></span>`;
  return readonly?`<div class="cargo-ledger-row ${signal.className}">${body}</div>`:`<button type="button" class="cargo-ledger-row cargo-ledger-item ${signal.className}" data-basket-item="${key}" data-basket-side="${side}" aria-label="${g.name} ${quantity}개${side==='buy'?' 구매 취소':''}">${body}</button>`;
 }).join('');
}
function setMarketBasketMode(mode){
 const basket=marketBasket(),previous=MARKET_BASKET_UI.mode;
 if(mode==='owned'&&basket.entries('sell').length)mode='sell';MARKET_BASKET_UI.mode=mode;
 if(mode==='sell'||previous==='sell')renderFacility('trade');renderCargoPanel(true);
}
function toggleCargoContents(){
 marketBasket();setMarketBasketMode(MARKET_BASKET_UI.mode==='buy'?'owned':'buy');
}
function renderSaleStall(container){
 const basket=marketBasket(),entries=basket.entries('sell');
 $('#facilityTitle').textContent='판매 품목';
 container.innerHTML=`<div class="sale-stall"><div class="basket-grid">${basketItemsMarkup(entries,{side:'sell'})}</div><div class="basket-total"><span>합계</span><strong>${fmt(basket.total('sell'))} G</strong></div><button id="saleStallAction" class="basket-action" type="button" ${entries.length?'':'disabled'}>매각하기</button></div>`;
 bindBasketItems(container);$('#saleStallAction').onclick=()=>requestBasketCheckout('sell');
}
function renderCargoPanel(canSell){
 const list=$('#cargoPanelList'),entries=Object.entries(state.cargo).filter(([key,qty])=>qty>0&&GOODS[key]).map(([key,quantity])=>({key,quantity}));
 const action=$('#cargoPanelAction'),back=$('#cargoPanelBack');
 $('#cargoPanelSummary').textContent=`${cargoTotal()} / ${state.capacity}`;
 const appraisal=entries.reduce((sum,{key,quantity})=>sum+cargoSaleQuote(state.current,key,quantity).total,0);
 $('#cargoPanelTitle').textContent='보유 교역품';$('#cargoPanelTotalLabel').textContent='환산 가치';$('#cargoPanelGold').textContent=`${fmt(appraisal)} G`;
 action.hidden=true;action.onclick=null;back.hidden=true;list.classList.remove('basket-grid');
 if(!canSell){list.innerHTML=cargoLedgerMarkup(entries,{readonly:true});return}
 const basket=marketBasket(),mode=MARKET_BASKET_UI.mode,buying=mode==='buy',side=buying?'buy':'sell',draft=basket.entries(side);
 action.hidden=!buying;
 back.hidden=false;back.onclick=toggleCargoContents;
 back.setAttribute('aria-label',buying?'보유 교역품 보기':'구매 품목 보기');back.setAttribute('aria-pressed',String(buying));
 action.textContent='매입하기';action.disabled=!draft.length;
 action.onclick=buying?()=>requestBasketCheckout('buy'):null;
 if(buying){
  $('#cargoPanelTitle').textContent='구매 품목';$('#cargoPanelTotalLabel').textContent='합계';$('#cargoPanelGold').textContent=`${fmt(basket.total('buy'))} G`;
  $('#cargoPanelSummary').textContent=`${cargoTotal()+draft.reduce((sum,row)=>sum+row.quantity,0)} / ${state.capacity}`;
 }
 list.innerHTML=cargoLedgerMarkup(buying?draft:availableCargoEntries(),{side:buying?'buy':'stock'});bindBasketItems(list);
}
function requestBasketCheckout(side){
 const plan=marketBasket().plan(side);if(!plan.ok)return toast(plan.error);
 window.ROTTA_TRADE_BASKET.confirm({side,html:basketItemsMarkup(plan.rows,{readonly:true}),total:`${fmt(plan.total)} G`,commit:()=>commitMarketBasket(plan)});
}
function commitMarketBasket(expected){
 const basket=marketBasket(),plan=basket.plan(expected.side);
 // Revalidate the whole order before touching gold, stock, cargo or origin lots.
 if(!plan.ok||plan.signature!==expected.signature){toast(plan.ok?'시세가 변경되었습니다.':plan.error);renderFacility('trade');renderCargoPanel(true);return false}
 let total=0,saved=0,bargain=state.bargain;
 const rows=plan.rows.map(row=>{
  if(plan.side==='sell')return row;
  let unit=row.unit;
  if(Math.random()<.3&&Math.random()<.3+bargain*.09+(state.nation==='france'?.15:0)){
   unit=Math.max(marketPriceAt(state.current,row.key,'sell')+1,Math.round(unit*(.88-bargain*.015)));
   unit=Math.min(row.unit,unit);bargain=Math.min(5,bargain+.08);
  }
  saved+=(row.unit-unit)*row.quantity;return {...row,unit,total:unit*row.quantity};
 });
 for(const row of rows){
  if(plan.side==='buy'){
   addCargoLot(row.key,row.quantity,plan.port,row.unit);const token=marketStockToken(plan.port,row.key);state.marketBought[token]=(state.marketBought[token]||0)+row.quantity;
  }else{
   removeCargoLots(row.key,row.quantity);if(row.unit>GOODS[row.key].base*1.2)state.fame+=Math.max(1,Math.floor(row.quantity/5));
  }
  total+=row.total;
 }
 state.gold+=plan.side==='buy'?-total:total;state.bargain=bargain;basket.clear(plan.side);MARKET_BASKET_UI.mode='owned';
 updateStats();renderFacility('trade');renderCargoPanel(true);
 toast(`${plan.side==='buy'?'매입':'매각'} ${fmt(total)} G${saved?` · 협상 −${fmt(saved)} G`:''}`);return true;
}
function renderFacility(id){window.ROTTA_MARKET_DRAWER?.unmount();const c=$('#facilityContent');if(id==='trade'){
 marketBasket();$('#facilityTitle').textContent='교역소';if(MARKET_BASKET_UI.mode==='sell'){renderSaleStall(c);return}
 const keys=Object.keys(PORTS[state.current].market).filter(k=>GOODS[k]);
 if(MARKET_UI.port!==state.current||!keys.includes(MARKET_UI.key)){MARKET_UI.port=state.current;MARKET_UI.key=keys[0];MARKET_UI.month=null}
 const sortValues=Object.fromEntries(keys.map(k=>[k,{category:GOODS[k].category,stock:marketStock(state.current,k),buy:priceAt(state.current,k,'buy'),sell:priceAt(state.current,k,'sell')}]));
 c.innerHTML=marketStatusMarkup()+`<div class="market-head"><button class="market-sort" type="button" data-market-sort="default">상품</button><button class="market-sort" type="button" data-market-sort="category">종류</button><button class="market-sort" type="button" data-market-sort="stock">수량</button><button class="market-sort" type="button" data-market-sort="buy">구매가</button><button class="market-sort" type="button" data-market-sort="sell">판매가</button><span></span></div><div class="market-rows">`+keys.map(k=>{
 const g=GOODS[k],{sell:pr,buy:ask,stock}=sortValues[k],condition=MARKET_SIM?.status(state.current,k)||'',signal=marketSignal(state.current,k),selected=MARKET_UI.key===k;
 return `<div class="market-row ${signal.className}${selected?' selected':''}" data-market-good="${k}"><div class="good-cell"><button class="market-item" data-select-good="${k}" aria-pressed="${selected}" aria-label="${g.name} 시세">${goodArt(k,g.icon)}<span class="good-copy"><b>${g.name}</b>${condition?`<small class="market-good-status">${condition}</small>`:''}</span></button></div><div class="good-type">${g.category}</div><div class="stock">${fmt(stock)}</div><div class="base-price">${fmt(ask)}</div><div class="sale-price">${fmt(pr)}</div><div class="actions"><button data-buy="${k}"${stock<1?' disabled':''}>선택</button></div></div>`;
 }).join('')+`</div><div class="market-chart-drawer" data-chart-drawer><button class="market-chart-handle" data-chart-handle type="button" aria-label="시세 그래프 접기" aria-expanded="true" aria-controls="marketChart"></button><div class="market-chart-reveal"><section id="marketChart" class="market-chart" aria-label="교역품 시세"></section></div></div>`;
 $$('[data-market-good]').forEach(row=>row.onclick=e=>{if(!e.target.closest('[data-buy]'))selectMarketGood(row.dataset.marketGood)});
 $$('[data-select-good]').forEach(b=>b.onclick=e=>{e.stopPropagation();selectMarketGood(b.dataset.selectGood)});
 $$('[data-buy]').forEach(b=>b.onclick=e=>{e.stopPropagation();openTradeDialog(b.dataset.buy,'buy')});window.ROTTA_MARKET_SORT?.mount(c,{port:state.current,keys,values:sortValues});window.ROTTA_MARKET_DRAWER?.mount(c,renderMarketChart);renderMarketChart();return}
 if(id==='shop'){c.innerHTML=`<div class="ledger-list"><div class="ledger-row"><span>항해 식량 20%</span><b>45 골드</b></div><div class="ledger-row"><span>선원 사기 물품</span><b>35 골드</b></div></div><div class="facility-actions"><button data-action="food">식량 구입</button><button data-action="morale">선원 위문</button></div>`}
 if(id==='shipyard'){c.innerHTML=`<div class="ledger-list"><div class="ledger-row"><span>현재 선체</span><b>${fmt(state.hull)}%</b></div><div class="ledger-row"><span>화물칸</span><b>${state.capacity}칸</b></div></div><div class="facility-actions"><button data-action="repair">선체 수리 · 90 골드</button><button data-action="upgrade">증설 · 180 골드</button></div>`}
 if(id==='bank'){c.innerHTML=`<div class="ledger-list"><div class="ledger-row"><span>수중 골드</span><b>${fmt(state.gold)}</b></div><div class="ledger-row"><span>예치금</span><b>${fmt(state.bank)}</b></div></div><div class="facility-actions"><button data-action="deposit">100 골드 예치</button><button data-action="withdraw">100 골드 인출</button></div>`}
 if(id==='mansion'){c.innerHTML=`<div class="ledger-row"><span>협상술</span><b>Lv.${Math.floor(state.bargain)}</b></div><div class="facility-actions"><button data-action="train">수업 · 120 골드</button><button data-action="rumor">시세 · 20 골드</button></div>`}
 if(id==='royal'){c.innerHTML=`<div class="ledger-list"><div class="ledger-row"><span>명성</span><b>${fmt(state.fame)}</b></div><div class="ledger-row"><span>칙명</span><b>향신료 5</b></div></div><div class="facility-actions"><button data-action="charter">축복</button><button data-action="mission">칙명</button></div>`}
 $$('[data-action]').forEach(b=>b.onclick=()=>facilityAction(b.dataset.action,id))}
function facilityAction(action,facility){const spend=(cost,fn)=>{if(state.gold<cost)return toast('골드가 부족합니다.');state.gold-=cost;fn()};if(action==='food')spend(45,()=>{state.food=Math.min(100,state.food+20);toast('식량과 담수를 실었습니다.')});if(action==='morale')spend(35,()=>{state.morale=Math.min(100,state.morale+12);toast('선원들의 사기가 올랐습니다.')});if(action==='repair')spend(90,()=>{state.hull=Math.min(100,state.hull+30);toast('손상된 선체를 수리했습니다.')});if(action==='upgrade')spend(180,()=>{state.capacity+=10;toast('화물칸을 10칸 증설했습니다.')});if(action==='deposit')spend(100,()=>{state.bank+=100;toast('100 골드를 예치했습니다.')});if(action==='withdraw'){if(state.bank<100)return toast('예치금이 부족합니다.');state.bank-=100;state.gold+=100;toast('100 골드를 인출했습니다.')}if(action==='train')spend(120,()=>{state.bargain=Math.min(5,state.bargain+1);toast('협상술이 향상됐습니다.')});if(action==='rumor')spend(state.nation==='england'?10:20,()=>{const tips=MARKET_SIM?.news(state.current)||[];toast(tips.length?tips[Math.floor(Math.random()*tips.length)]:'새 소식 없음')});if(action==='charter'){state.fame+=1;toast('왕실의 축복으로 명성 +1')}if(action==='mission')toast('후추 또는 정향 5단위를 모아 왕실에 납품하십시오.');updateStats();renderFacility(facility);renderCargoPanel(facility==='trade')}
function marketStockToken(portId,key){return `${portId}:${state.year}:${state.month}:${Math.floor(((state.day||1)-1)/7)}:${key}`}
function marketStock(portId,key){const token=marketStockToken(portId,key),initial=12+(hash(`${token}:stock`)%69);return Math.max(0,Math.floor(initial*(GOODS[key]?.stockScale??1)*marketEffects(portId,key).stock)-(state.marketBought[token]||0))}
function maxTradeQuantity(key,type,append=false){const basket=marketBasket();return Math.max(0,basket.maximum(type,key)-(type==='sell'&&append?basket.quantity('sell',key):0))}
function openTradeDialog(key,type,{append=false}={}){
 const basket=marketBasket(),max=maxTradeQuantity(key,type,append),g=GOODS[key],existing=append?0:basket.quantity(type,key);
 if(max<1&&!existing)return toast(type==='sell'?'보유품 없음':marketStock(state.current,key)<1?'재고 없음':'골드 또는 화물칸 부족');
 const mode=type==='buy'?'buy':'sell';if(MARKET_BASKET_UI.mode!==mode)setMarketBasketMode(mode);
 pendingTrade={key,type,append};$('#tradeDialogType').textContent=type==='buy'?'매입':'매각';$('#tradeDialogTitle').textContent=g.name;$('#tradeDialogArt').innerHTML=goodArt(key,g.icon);
 $('#tradeMaximum').textContent=fmt(max);$('#tradeQuantity').min=existing?0:1;$('#tradeQuantity').max=max;$('#tradeQuantity').value=existing?Math.min(existing,max):1;
 $('#tradeConfirm').textContent='담기';updateTradePreview();$('#tradeModal').classList.remove('hidden');$('#tradeQuantity').focus();$('#tradeQuantity').select();
}
function closeTradeDialog(){const previous=pendingTrade;pendingTrade=null;$('#tradeModal').classList.add('hidden');if(previous){const selector=previous.type==='buy'?`[data-buy="${previous.key}"]`:`#cargoPanel [data-basket-item="${previous.key}"]`;($(selector)||$('#cargoPanelBack'))?.focus({preventScroll:true})}}
function setTradeQuick(mode){if(!pendingTrade)return;const max=maxTradeQuantity(pendingTrade.key,pendingTrade.type,pendingTrade.append);$('#tradeQuantity').value=mode==='all'?max:Math.max(1,Math.ceil(max/2));updateTradePreview()}
function tradeDraftQuantity(){const {key,type,append}=pendingTrade,max=maxTradeQuantity(key,type,append),min=!append&&marketBasket().quantity(type,key)?0:1;return Math.max(0,Math.min(max,Math.max(min,Math.floor(Number($('#tradeQuantity').value)||0))))}
function updateTradePreview(){
 if(!pendingTrade)return;const {key,type,append}=pendingTrade,max=maxTradeQuantity(key,type,append),qty=tradeDraftQuantity(),sale=type==='sell'?cargoSaleQuote(state.current,key,qty,append?marketBasket().quantity('sell',key):0):null;
 $('#tradeMaximum').textContent=fmt(max);$('#tradeUnitPrice').textContent=sale?cargoUnitLabel(sale):fmt(priceAt(state.current,key,'buy'));
 $('#tradeTotal').textContent=`${fmt(sale?sale.total:priceAt(state.current,key,'buy')*qty)} G`;$('#tradeConfirm').textContent=qty?'담기':'제외';$('#tradeConfirm').disabled=max<1&&(append||!marketBasket().quantity(type,key));
}
function confirmTrade(){
 if(!pendingTrade)return;const {key,type,append}=pendingTrade,basket=marketBasket(),quantity=tradeDraftQuantity();basket.set(type,key,(append?basket.quantity(type,key):0)+quantity);closeTradeDialog();
 if(type==='sell')renderFacility('trade');renderCargoPanel(true);(type==='buy'?$('#cargoPanelAction'):$('#saleStallAction:not(:disabled)')||$('#cargoPanelBack')).focus({preventScroll:true});
}
function playPortTransition(kind,commit){return window.ROTTA_PORT_TRANSITIONS?.play?window.ROTTA_PORT_TRANSITIONS.play(kind,commit):commit()}
function openSailing(){
 if(window.ROTTA_PORT_TRANSITIONS?.active||!state.nation)return;
 window.ROTTA_MANSION_TRANSITION?.cancel();
 dismissArrivalPrompt();closeSeaPortUI();stopAutoCamera();clearManualKeys();
 const request=DEPARTURE_ZOOM.run;let committed=false;
 const transition=playPortTransition('depart',()=>{
  DOCK_SELECTION.portId=null;switchView('sailing');
  $('#placeType').textContent='항해 중';$('#placeName').textContent=`${PORTS[state.current].name} 근해`;
  state.atPort=true;state.camX=state.camY=0;CAMERA_VIEW.followShip=true;
  clearManualKeys();setSeaClickTarget(null);setDepartureHeading(PORTS[state.current]);
  syncViewportMetrics();populateDestinations();updateShip(true);
  DEPARTURE_ZOOM.active=true;NAV_RENDER.world.classList.remove('recentering');setZoom(.5,null,true);
  NAV_RENDER.viewport.focus();if(!NAV.ready)$('#routeInfo').textContent='해수와 육지를 판독하고 있습니다…';
  committed=true;
 });
 const reveal=()=>{if(committed&&request===DEPARTURE_ZOOM.run&&$('#sailingView').classList.contains('active'))startDepartureZoom()};
 if(transition?.then)return transition.then(ok=>{if(ok)reveal();return ok});
 reveal();return transition;
}
function clearDepartureBlur(){
 const blur=$('#departureBlur');if(!blur)return;
 blur.hidden=true;blur.style.setProperty('--departure-blur','0px');blur.style.setProperty('--departure-blur-opacity','0');
}
function updateDepartureBlur(progress){
 // Proportional to the derivative of smoothstep: no blur at rest, strongest mid-zoom.
 const intensity=Math.max(0,4*progress*(1-progress)),blur=$('#departureBlur');
 if(!blur)return;
 if(intensity<=.001)return clearDepartureBlur();
 blur.style.setProperty('--departure-blur',`${(8*intensity).toFixed(2)}px`);
 blur.style.setProperty('--departure-blur-opacity',(intensity*.9).toFixed(3));blur.hidden=false;
}
function stopDepartureZoom(normalize=true){
 DEPARTURE_ZOOM.run++;
 const wasActive=DEPARTURE_ZOOM.active||DEPARTURE_ZOOM.frame;
 DEPARTURE_ZOOM.active=false;
 if(DEPARTURE_ZOOM.frame)cancelAnimationFrame(DEPARTURE_ZOOM.frame);
 DEPARTURE_ZOOM.frame=0;clearDepartureBlur();
 if(wasActive)document.documentElement.dataset.departureZoom='cancelled';
 if(normalize&&state.zoom<1)setZoom(1,null,true);
}
function startDepartureZoom(){
 stopDepartureZoom(false);
 if(!$('#sailingView').classList.contains('active'))return;
 const run=DEPARTURE_ZOOM.run,started=performance.now();let lastPaint=-Infinity;
 CAMERA_VIEW.autoFollow=null;CAMERA_VIEW.followShip=true;state.camX=state.camY=0;
 DEPARTURE_ZOOM.active=true;NAV_RENDER.world.classList.remove('recentering');setZoom(.5,null,true);
 if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches){setZoom(3.5,null,true);DEPARTURE_ZOOM.active=false;clearDepartureBlur();document.documentElement.dataset.departureZoom='complete';return}
 document.documentElement.dataset.departureZoom='running';
 function frame(now){
  if(run!==DEPARTURE_ZOOM.run)return;
  DEPARTURE_ZOOM.frame=0;
  if(!$('#sailingView').classList.contains('active')){stopDepartureZoom();return}
  const p=Math.max(0,Math.min(1,(now-started)/2000));
  if(p>=1||now-lastPaint>=1000/30){
   const eased=p*p*(3-2*p);
   setZoom(.5+3*eased,null,true);updateDepartureBlur(p);lastPaint=now;
  }
  if(p<1)DEPARTURE_ZOOM.frame=requestAnimationFrame(frame);
  else{DEPARTURE_ZOOM.active=false;clearDepartureBlur();document.documentElement.dataset.departureZoom='complete'}
 }
 DEPARTURE_ZOOM.frame=requestAnimationFrame(frame);
}
function populateDestinations(){const select=$('#destinationSelect'),groups={};for(const [id,p] of Object.entries(PORTS)){if(id===state.current)continue;(groups[p.region]??=[]).push([id,p])}select.innerHTML='<option value="">목적항 선택…</option>'+Object.entries(groups).sort().map(([region,items])=>`<optgroup label="${region}">${items.sort((a,b)=>a[1].name.localeCompare(b[1].name,'ko')).map(([id,p])=>`<option value="${id}">${p.name}</option>`).join('')}</optgroup>`).join('');$('#routeTitle').textContent='목적지를 정하십시오';$('#routeInfo').textContent=NAV.ready?`항구 ${PORT_COUNT}곳 · 바다를 직접 클릭해도 항해합니다.`:'해수와 육지를 판독하고 있습니다…';$('#returnPortBtn').disabled=false;$('#setCourseBtn').disabled=!NAV.ready}
function renderSeaPorts(){const layer=$('#seaPorts');if(!layer)return;const symbols=window.ROTTA_PORT_SYMBOLS;layer.innerHTML=Object.entries(PORTS).map(([id,p])=>{const visual=symbols?.classify(id,p)||{kind:'harbor',culture:'western'},emblem=symbols?.markup(id,p)||'<svg class="port-symbol" viewBox="0 0 40 44"><path class="port-sigil-line" d="M20 8V33M12 16H28M8 25Q10 38 20 33Q30 38 32 25"/></svg>';return `<button class="sea-port${p.inland?' inland':''}" data-seaport="${id}" data-port-kind="${visual.kind}" data-port-culture="${visual.culture}" style="left:${p.x}px;top:${p.y}px" title="${p.name} — ${p.region}${p.inland?' · 내륙 교역 거점(가장 가까운 안전 접안점으로 입항)':''}"><span class="port-emblem" aria-hidden="true">${emblem}</span><span class="port-label">${p.name}</span></button>`}).join('');NAV_RENDER.portNodes=[...layer.querySelectorAll('[data-seaport]')].map(el=>({el,p:PORTS[el.dataset.seaport]}));NAV_RENDER.portNodes.forEach(({el})=>el.onclick=e=>{e.stopPropagation();if(!state.nation)return;openSeaPortActions(el.dataset.seaport)});queuePortCulling(true)}
function updateShip(forceNearby=false){if(COAST.ready&&$('#sailingView').classList.contains('active'))updateDockingState(forceNearby);const ship=NAV_RENDER.ship;const transform=`translate3d(${state.shipX}px,${state.shipY}px,0) translate(-50%,-50%) scale(var(--ship-scale,1)) rotate(${MANUAL_SAIL.heading.toFixed(2)}deg)`;if(transform!==NAV_RENDER.lastShip){ship.style.transform=transform;NAV_RENDER.lastShip=transform}const moving=state.traveling||MANUAL_SAIL.velocity>.001;if(moving!==NAV_RENDER.moving){document.body.classList.toggle('sailing-moving',moving);NAV_RENDER.moving=moving}if(forceNearby||performance.now()-NAV_RENDER.uiAt>=120){NAV_RENDER.uiAt=performance.now();document.documentElement.dataset.shipHeading=MANUAL_SAIL.heading.toFixed(1);document.documentElement.dataset.shipVelocity=(state.traveling?AUTO_SAIL.velocity:MANUAL_SAIL.velocity).toFixed(3)}const now=performance.now();if(forceNearby||now-NAV_RENDER.nearAt>250){for(const {el,p} of NAV_RENDER.portNodes){const dx=(p.navX??p.x)-state.shipX,dy=(p.navY??p.y)-state.shipY;const near=dx*dx+dy*dy<6724;if(el.classList.contains('near')!==near)el.classList.toggle('near',near)}NAV_RENDER.nearAt=now}const region=state.atPort?`${PORTS[state.current].name} 근해`:'대양 항해 중';if(region!==NAV_RENDER.lastRegion){$('#seaRegion').textContent=region;NAV_RENDER.lastRegion=region}}
function setZoom(value,anchor=null,departureFrame=false){if(!departureFrame)stopDepartureZoom(false);if(CAMERA_VIEW.autoFollow)stopAutoCamera();const next=Math.max(departureFrame?.5:1,Math.min(10,Number(value)||6.5)),old=state.zoom,w=NAV_RENDER.width,h=NAV_RENDER.height,active=$('#sailingView').classList.contains('active');let worldX=state.shipX,worldY=state.shipY,ax=w/2,ay=h/2;if(active&&w&&old&&!departureFrame){if(anchor){ax=anchor.x;ay=anchor.y}worldX=(ax-NAV_RENDER.lastTx)/old;worldY=(ay-NAV_RENDER.lastTy)/old}state.zoom=next;window.ROTTA_CLOUDS?.sync(NAV_RENDER.viewport,state.zoom);if(active&&w){state.camX=ax-w/2-(worldX-state.shipX)*next;state.camY=ay-h/2-(worldY-state.shipY)*next}$('#zoomRange').value=Math.max(1,state.zoom);$('#zoomText').textContent=`${state.zoom.toFixed(1)}×`;const world=NAV_RENDER.world,zoomProgress=Math.max(0,(state.zoom-1)/9),worldOverview=state.zoom<=1.05,portLogoScale=.4+zoomProgress*.44,shipScreenScale=.62+zoomProgress*.73,lowDetail=state.zoom<=2.5||!NAV_RENDER.vectorReady,wasLow=world.classList.contains('low-detail');world.style.setProperty('--inverse-zoom',1/state.zoom);world.style.setProperty('--ship-scale',shipScreenScale/state.zoom);world.style.setProperty('--port-logo-scale',portLogoScale);world.style.setProperty('--land-edge-width',`${Math.max(.42,1.35/state.zoom).toFixed(2)}px`);world.style.setProperty('--route-width',`${Math.max(.4,1.9/state.zoom).toFixed(2)}px`);document.documentElement.dataset.shipScreenScale=shipScreenScale.toFixed(3);world.classList.toggle('low-detail',lowDetail);world.classList.toggle('world-overview',worldOverview);if(wasLow&&!lowDetail){world.classList.add('vector-refresh');requestAnimationFrame(()=>requestAnimationFrame(()=>world.classList.remove('vector-refresh')))}$('.scale-mark').textContent=`약 ${Math.max(8,Math.round(120/state.zoom))}해리`;updateCamera()}
function zoomWheel(e){if(!$('#sailingView').classList.contains('active'))return;e.preventDefault();const rect=NAV_RENDER.viewport.getBoundingClientRect();setZoom(state.zoom+(e.deltaY<0?.5:-.5),{x:e.clientX-rect.left,y:e.clientY-rect.top})}
function syncViewportMetrics(){NAV_RENDER.width=NAV_RENDER.viewport.clientWidth;NAV_RENDER.height=NAV_RENDER.viewport.clientHeight}
function clampCamera(){const w=NAV_RENDER.width,h=NAV_RENDER.height;if(!w||DEPARTURE_ZOOM.active)return;const minX=w/2+(state.shipX-WORLD.w)*state.zoom,maxX=state.shipX*state.zoom-w/2,minY=h/2+(state.shipY-WORLD.h)*state.zoom,maxY=state.shipY*state.zoom-h/2;state.camX=Math.max(minX,Math.min(maxX,state.camX));state.camY=Math.max(minY,Math.min(maxY,state.camY))}
function updateCamera(){const w=NAV_RENDER.width,h=NAV_RENDER.height;if(!w)return;clampCamera();const tx=w/2-state.shipX*state.zoom+state.camX,ty=h/2-state.shipY*state.zoom+state.camY;const signature=`${tx.toFixed(3)}:${ty.toFixed(3)}:${state.zoom}:${w}:${h}`;if(signature===NAV_RENDER.lastCamera)return;NAV_RENDER.lastCamera=signature;NAV_RENDER.lastTx=tx;NAV_RENDER.lastTy=ty;NAV_RENDER.world.style.transform=`translate3d(${tx}px,${ty}px,0) scale(${state.zoom})`;queuePortCulling();queueVisibleMapTiles();updateCoastVisibility();positionSeaPortActions()}
function updateCoastVisibility(){if(!NAV_RENDER.coastRenderer||!NAV_RENDER.width||state.zoom<=2.5)return;const z=state.zoom,tx=NAV_RENDER.lastTx,ty=NAV_RENDER.lastTy;NAV_RENDER.coastRenderer.update(-tx/z,-ty/z,(NAV_RENDER.width-tx)/z,(NAV_RENDER.height-ty)/z)}
function requestCameraUpdate(){if(NAV_RENDER.cameraFrame)return;NAV_RENDER.cameraFrame=requestAnimationFrame(()=>{NAV_RENDER.cameraFrame=0;updateCamera()})}
function updatePortVisibility(){NAV_RENDER.cullTimer=0;if(!NAV_RENDER.width)return;const margin=90,z=state.zoom,tx=NAV_RENDER.lastTx,ty=NAV_RENDER.lastTy,w=NAV_RENDER.width,h=NAV_RENDER.height;for(const {el,p} of NAV_RENDER.portNodes){const x=tx+p.x*z,y=ty+p.y*z;const outside=x < -margin||x > w+margin||y < -margin||y > h+margin;if(el.classList.contains('outside-view')!==outside)el.classList.toggle('outside-view',outside)}}
function queuePortCulling(immediate=false){if(immediate){if(NAV_RENDER.cullTimer)clearTimeout(NAV_RENDER.cullTimer);NAV_RENDER.cullTimer=0;return updatePortVisibility()}if(NAV_RENDER.cullTimer)return;NAV_RENDER.cullTimer=setTimeout(updatePortVisibility,110)}
function panCamera(e){if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();stopAutoCamera();state.camX+=e.key==='ArrowLeft'?100:e.key==='ArrowRight'?-100:0;state.camY+=e.key==='ArrowUp'?100:e.key==='ArrowDown'?-100:0;updateCamera()}
function startMapDrag(e){if(e.button!==0||e.target.closest('.sea-port,.sea-port-actions'))return;closeSeaPortActions();stopAutoCamera();CAMERA_DRAG.active=true;CAMERA_DRAG.moved=false;CAMERA_DRAG.lastX=e.clientX;CAMERA_DRAG.lastY=e.clientY;CAMERA_DRAG.pointerId=e.pointerId;e.currentTarget.setPointerCapture?.(e.pointerId);e.currentTarget.classList.add('dragging');$('#oceanWorld').classList.remove('recentering')}
function dragMap(e){if(!CAMERA_DRAG.active||e.pointerId!==CAMERA_DRAG.pointerId)return;const dx=e.clientX-CAMERA_DRAG.lastX,dy=e.clientY-CAMERA_DRAG.lastY;CAMERA_DRAG.lastX=e.clientX;CAMERA_DRAG.lastY=e.clientY;if(Math.abs(dx)+Math.abs(dy)>1){CAMERA_DRAG.moved=true;CAMERA_VIEW.followShip=false;}state.camX+=dx;state.camY+=dy;requestCameraUpdate();e.preventDefault()}
function stopMapDrag(e){if(!CAMERA_DRAG.active||e.pointerId!==CAMERA_DRAG.pointerId)return;CAMERA_DRAG.active=false;if(e.currentTarget.hasPointerCapture?.(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);e.currentTarget.classList.remove('dragging');if(CAMERA_DRAG.moved)CAMERA_DRAG.suppressUntil=performance.now()+250}
function centerOnShip(){stopAutoCamera();CAMERA_VIEW.followShip=true;state.camX=state.camY=0;const world=$('#oceanWorld');world.classList.add('recentering');updateCamera();setTimeout(()=>world.classList.remove('recentering'),360)}
// A detached chart stays fixed in world space while the ship continues sailing.
function stopAutoCamera(){stopDepartureZoom();CAMERA_VIEW.autoFollow=null;CAMERA_VIEW.followShip=false;document.documentElement.dataset.cameraFollow='free';}
function beginAutoCamera(now){
 stopDepartureZoom();
 const distance=Math.hypot(state.camX,state.camY);NAV_RENDER.world.classList.remove('recentering');
 if(distance<.5){CAMERA_VIEW.autoFollow=null;CAMERA_VIEW.followShip=true;state.camX=state.camY=0;document.documentElement.dataset.cameraFollow='following';return;}
 CAMERA_VIEW.followShip=false;CAMERA_VIEW.autoFollow={started:now,last:now,duration:Math.max(2200,Math.min(7000,distance/.22)),progress:0};
 document.documentElement.dataset.cameraFollow='ease-in';
}
function advanceAutoCamera(now){
 const follow=CAMERA_VIEW.autoFollow;if(!follow)return;
 const p=Math.min(1,Math.max(0,(now-follow.started)/follow.duration)),eased=p*p,dt=Math.max(0,Math.min(.05,(now-follow.last)/1000));
 const fraction=follow.progress>=1?1:Math.max(0,(eased-follow.progress)/(1-follow.progress));
 let dx=state.camX*fraction,dy=state.camY*fraction;const length=Math.hypot(dx,dy),limit=Math.max(320,Math.min(900,NAV_RENDER.width*.55))*dt;
 if(length>limit&&length>0){dx*=limit/length;dy*=limit/length;}
 state.camX-=dx;state.camY-=dy;follow.progress=eased;follow.last=now;
 if(p>=1&&Math.hypot(state.camX,state.camY)<.5){state.camX=state.camY=0;CAMERA_VIEW.followShip=true;CAMERA_VIEW.autoFollow=null;document.documentElement.dataset.cameraFollow='following';}
}
// Integrate smoothstep velocity: gentle acceleration, fixed-speed cruise, gentle braking.
function createSailingMotion(distance,maxSpeed=MANUAL_SAIL.maxSpeed,initialSpeed=0){
 const initial=Math.max(0,Math.min(maxSpeed,initialSpeed));
 if(distance<=0)return{distance:0,initial:0,peak:0,ramp:0,brake:0,cruise:0,duration:0};
 const peak=Math.max(initial,Math.min(maxSpeed,Math.sqrt(distance*maxSpeed/AUTO_SAIL.rampSeconds+initial*initial/2)));
 const ramp=AUTO_SAIL.rampSeconds*(peak-initial)/maxSpeed,accelerating=(initial+peak)*ramp/2;
 const brake=Math.min(AUTO_SAIL.rampSeconds*peak/maxSpeed,2*Math.max(0,distance-accelerating)/peak),cruise=Math.max(0,(distance-accelerating-peak*brake/2)/peak);
 return{distance,initial,peak,ramp,brake,cruise,duration:ramp+cruise+brake};
}
function sampleSailingMotion(motion,seconds){
 const {distance,initial,peak,ramp,brake,cruise,duration}=motion,t=Math.max(0,seconds),integral=u=>u*u*u-.5*u*u*u*u,smooth=u=>u*u*(3-2*u);
 if(t>=duration)return{distance,velocity:0,complete:true};
 if(t<ramp){const u=t/ramp;return{distance:initial*t+(peak-initial)*ramp*integral(u),velocity:initial+(peak-initial)*smooth(u),complete:false};}
 if(t<ramp+cruise)return{distance:(initial+peak)*ramp/2+peak*(t-ramp),velocity:peak,complete:false};
 const u=(duration-t)/brake;return{distance:distance-peak*brake*integral(u),velocity:peak*smooth(u),complete:false};
}
function splitSailingPath(path,distance){
 const prefix=[path[0]];
 for(let i=1;i<path.length;i++){
  const a=path[i-1],b=path[i],length=Math.hypot(b.x-a.x,b.y-a.y);
  if(distance<length){const p={x:a.x+(b.x-a.x)*distance/length,y:a.y+(b.y-a.y)*distance/length};prefix.push(p);return{prefix,rest:[p,...path.slice(i)]};}
  prefix.push(b);distance-=length;
 }
 return{prefix,rest:[path[path.length-1]]};
}
// Sample a tangent-continuous bend. Extra side handles keep a U-turn from collapsing into a cusp.
function sailingBend(start,end,forward,outgoing,handle,side){
 const dot=forward.x*outgoing.x+forward.y*outgoing.y,lateral=dot<-.5?handle*1.5:0,normal={x:-forward.y*side,y:forward.x*side};
 const a={x:start.x+forward.x*handle,y:start.y+forward.y*handle},b={x:end.x-outgoing.x*handle,y:end.y-outgoing.y*handle};
 const control=lateral?[start,a,{x:a.x+normal.x*lateral,y:a.y+normal.y*lateral},{x:b.x+normal.x*lateral,y:b.y+normal.y*lateral},b,end]:[start,a,b,end];
 const steps=Math.max(40,Math.ceil((Math.hypot(end.x-start.x,end.y-start.y)+handle*8)/.12)),points=[start];
 let previousDirection=forward;
 for(let i=1;i<=steps;i++){
  const t=i/steps,u=1-t,weights=lateral?[u**5,5*u**4*t,10*u**3*t*t,10*u*u*t**3,5*u*t**4,t**5]:[u**3,3*u*u*t,3*u*t*t,t**3];
  const p={x:0,y:0};for(let j=0;j<control.length;j++){p.x+=control[j].x*weights[j];p.y+=control[j].y*weights[j];}
  const last=points[points.length-1],dx=p.x-last.x,dy=p.y-last.y,length=Math.hypot(dx,dy);if(length<1e-8)return null;
  const direction={x:dx/length,y:dy/length};
  // Reject cusps, excessive turning curvature and any precise-mask land crossing.
  const angle=Math.acos(Math.max(-1,Math.min(1,previousDirection.x*direction.x+previousDirection.y*direction.y)));
  if(angle>.25||angle/length>1/Math.max(.4,AUTO_SAIL.velocity*.5)||!waterLineClear(last,p))return null;
  points.push(p);previousDirection=direction;
 }
 points[points.length-1]=end;return points;
}
function retargetSailingPath(destination){
 const live=AUTO_SAIL.route;if(!live)return null;
 const current={x:state.shipX,y:state.shipY},remaining=compactSeaPath([current,...live.path.slice(live.segmentIndex+1)]);
 if(remaining.length<2)return null;
 // Follow the already validated course before turning; look farther ahead in a narrow passage.
 for(const seconds of [.4,1.2,3,6,12]){
  const drift=splitSailingPath(remaining,Math.max(.05,AUTO_SAIL.velocity*seconds)),start=drift.prefix[drift.prefix.length-1],before=drift.prefix[drift.prefix.length-2];
  const length=Math.hypot(start.x-before.x,start.y-before.y);if(length<1e-8)continue;
  const forward={x:(start.x-before.x)/length,y:(start.y-before.y)/length},next=findSeaPath(start,destination);
  if(!seaPathClear(next))continue;
  for(const lookahead of [1,1.8,3]){
   const join=splitSailingPath(next,Math.max(5,AUTO_SAIL.velocity*3)*lookahead),end=join.prefix[join.prefix.length-1],incoming=join.prefix[join.prefix.length-2];
   const nextPoint=join.rest[1],dx=nextPoint?nextPoint.x-end.x:end.x-incoming.x,dy=nextPoint?nextPoint.y-end.y:end.y-incoming.y,len=Math.hypot(dx,dy);if(len<1e-8)continue;
   const outgoing={x:dx/len,y:dy/len};
   for(const scale of [1,1.8,3])for(const side of [1,-1]){
    const bend=sailingBend(start,end,forward,outgoing,Math.max(.8,AUTO_SAIL.velocity*.9)*scale,side);if(!bend)continue;
    const path=compactSeaPath([...drift.prefix,...bend.slice(1),...join.rest.slice(1)]);
    if(seaPathClear(path))return path;
   }
  }
 }
 return null;
}
function setSailingPosition(x,y){if(!Number.isFinite(x)||!Number.isFinite(y))return false;if(!CAMERA_VIEW.followShip){state.camX+=(x-state.shipX)*state.zoom;state.camY+=(y-state.shipY)*state.zoom;}state.shipX=x;state.shipY=y;}
function startManualSailing(){stopDepartureZoom();dismissArrivalPrompt();if(CAMERA_VIEW.autoFollow)stopAutoCamera();if(MANUAL_SAIL.frame)return;MANUAL_SAIL.last=0;NAV_RENDER.dockAt=-Infinity;NAV_RENDER.dockId=undefined;MANUAL_SAIL.frame=requestAnimationFrame(manualSailFrame)}
function manualSailFrame(now){MANUAL_SAIL.frame=0;if(state.traveling||!$('#sailingView').classList.contains('active')){clearManualKeys();$('#speedText').textContent='0.0 kn';return}if(MANUAL_SAIL.last&&now-MANUAL_SAIL.last<1000/30-1){MANUAL_SAIL.frame=requestAnimationFrame(manualSailFrame);return}if(!MANUAL_SAIL.last)MANUAL_SAIL.last=now;const dt=Math.min(.05,(now-MANUAL_SAIL.last)/1000),steer=(MANUAL_SAIL.keys.has('d')?1:0)-(MANUAL_SAIL.keys.has('a')?1:0);MANUAL_SAIL.last=now;if(MANUAL_SAIL.keys.has('s'))MANUAL_SAIL.velocity=Math.max(0,MANUAL_SAIL.velocity-MANUAL_SAIL.brake*dt);else if(MANUAL_SAIL.keys.has('w'))MANUAL_SAIL.velocity=Math.min(MANUAL_SAIL.maxSpeed,MANUAL_SAIL.velocity+MANUAL_SAIL.acceleration*dt);if(steer){if(MANUAL_SAIL.guide)clearStraitGuide('manual');MANUAL_SAIL.heading=(MANUAL_SAIL.heading+steer*MANUAL_SAIL.turnRate*dt+360)%360}if(MANUAL_SAIL.velocity>.001){const angle=MANUAL_SAIL.heading*Math.PI/180;moveManualShip(Math.sin(angle)*MANUAL_SAIL.velocity*dt,-Math.cos(angle)*MANUAL_SAIL.velocity*dt)}else{$('#speedText').textContent='0.0 kn';updateShip()}if(MANUAL_SAIL.keys.size||MANUAL_SAIL.velocity>.001)MANUAL_SAIL.frame=requestAnimationFrame(manualSailFrame);else MANUAL_SAIL.last=0}
function moveManualShip(dx,dy){const ox=state.shipX,oy=state.shipY,distance=Math.hypot(dx,dy),manualSteer=MANUAL_SAIL.keys.has('a')||MANUAL_SAIL.keys.has('d'),tryMove=(x,y)=>x>0&&y>0&&x<WORLD.w&&y<WORLD.h&&preciseWaterAt(x,y,false);let nx=ox+dx,ny=oy+dy,guided=MANUAL_SAIL.guide&&advanceStraitGuide(distance);if(!guided&&!manualSteer&&narrowWaterAhead(ox,oy,MANUAL_SAIL.heading)){MANUAL_SAIL.guide=buildStraitGuide(ox,oy,MANUAL_SAIL.heading);MANUAL_SAIL.guideIndex=1;guided=MANUAL_SAIL.guide&&advanceStraitGuide(distance)}if(guided){nx=guided.x;ny=guided.y}else if(!tryMove(nx,ny)){if(tryMove(ox+dx,oy)){nx=ox+dx;ny=oy}else if(tryMove(ox,oy+dy)){nx=ox;ny=oy+dy}else{MANUAL_SAIL.velocity*=.25;document.documentElement.dataset.straitAssist='stopped';return}}setSailingPosition(nx,ny);consumeVoyageDistance(Math.hypot(nx-ox,ny-oy));updateShip();updateCamera()}
const DOCKING_RADIUS=20;
const DOCK_SELECTION={portId:null};
function canDockAt(id){const p=PORTS[id];if(!p)return false;const ship={x:state.shipX,y:state.shipY},dock={x:p.navX??p.x,y:p.navY??p.y};return (dock.x-ship.x)**2+(dock.y-ship.y)**2<DOCKING_RADIUS**2&&waterLineClear(ship,dock);}
function nearestDockId(){
 if(DOCK_SELECTION.portId){if(canDockAt(DOCK_SELECTION.portId))return DOCK_SELECTION.portId;DOCK_SELECTION.portId=null;}
 let nearest=null,best=DOCKING_RADIUS**2;const ship={x:state.shipX,y:state.shipY};
 for(const [id,p] of Object.entries(PORTS)){const dock={x:p.navX??p.x,y:p.navY??p.y},d=(dock.x-ship.x)**2+(dock.y-ship.y)**2;if(d<best&&waterLineClear(ship,dock)){best=d;nearest=id;}}
 return nearest;
}
function selectSeaPort(id,{confirmArrival=false}={}){
 if(!canDockAt(id)){plotCourse(id,null,{confirmArrival});return false;}
 stopAutoCamera();
 if(state.traveling)cancelAutoSail();clearManualKeys();DOCK_SELECTION.portId=id;
 updateDockingState(true);updateShip(true);dismissArrivalPrompt();if(confirmArrival)showArrivalPrompt(id);return true;
}
function facilitySymbolMarkup(id){
 const icon=FACILITIES[id]?.icon||'';
 return `<i class="facility-medallion" aria-hidden="true"><span class="facility-symbol">${icon}</span></i>`;
}
function portActionIcon(kind){
 // Arrival geometry is the user's download-minimalistic-svgrepo-com.svg, recoloured only.
 const icon=kind==='market'?FACILITIES.trade.icon:'<svg class="arrival-symbol" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 15C3 17.8284 3 19.2426 3.87868 20.1213C4.75736 21 6.17157 21 9 21H15C17.8284 21 19.2426 21 20.1213 20.1213C21 19.2426 21 17.8284 21 15"/><path d="M12 3V16M12 16L16 11.625M12 16L8 11.625"/></svg>';
 return `<span class="port-action-symbol" aria-hidden="true">${icon}</span>`;
}
function closeSeaPortActions(){const id=SEA_PORT_UI.actionsId;SEA_PORT_UI.actionsId=null;const menu=$('#seaPortActions');if(menu)menu.hidden=true;if(id)$(`[data-seaport="${id}"]`)?.setAttribute('aria-expanded','false')}
function closeSeaMarket(){SEA_PORT_UI.quoteId=null;const panel=$('#seaMarketPanel');if(panel)panel.hidden=true}
function closeSeaPortUI(){closeSeaPortActions();closeSeaMarket()}
function positionSeaPortActions(){
 const id=SEA_PORT_UI.actionsId,menu=$('#seaPortActions');if(!id||!menu)return;const p=PORTS[id],x=NAV_RENDER.lastTx+p.x*state.zoom,y=NAV_RENDER.lastTy+p.y*state.zoom;
 menu.style.left=`${Math.max(82,Math.min(NAV_RENDER.width-82,x))}px`;menu.style.top=`${Math.max(91,Math.min(NAV_RENDER.height-10,y-12))}px`;menu.style.visibility=x<0||y<0||x>NAV_RENDER.width||y>NAV_RENDER.height?'hidden':'visible';
}
function openSeaPortActions(id){
 if(!state.nation||!PORTS[id])return;if(SEA_PORT_UI.actionsId===id)return closeSeaPortActions();
 closeSeaPortActions();SEA_PORT_UI.actionsId=id;
 if(canDockAt(id)){DOCK_SELECTION.portId=id;updateDockingState(true)}
 const menu=$('#seaPortActions');menu.innerHTML=`<svg class="port-action-arc" viewBox="0 0 160 124" aria-hidden="true"><path class="orbit-trace orbit-brass" pathLength="1" d="M29.088 61.088A72 72 0 0 1 130.912 61.088"/></svg><button class="port-orbit-button" data-port-market="${id}" aria-label="${PORTS[id].name} 교역소" title="교역소" disabled>${portActionIcon('market')}</button><button class="port-orbit-button" data-port-move="${id}" aria-label="${PORTS[id].name} 이동" title="항구로 이동" disabled>${portActionIcon('move')}</button>`;menu.hidden=false;
 const market=menu.querySelector('[data-port-market]'),move=menu.querySelector('[data-port-move]');
 for(const button of [market,move])button.onanimationend=e=>{if(e.animationName==='portActionGlide')button.disabled=false};
 market.onclick=e=>{e.stopPropagation();openSeaMarket(id)};
 move.onclick=e=>{e.stopPropagation();closeSeaPortUI();selectSeaPort(id,{confirmArrival:true})};
 $(`[data-seaport="${id}"]`)?.setAttribute('aria-expanded','true');positionSeaPortActions();
}
function openSeaMarket(id){if(!PORTS[id])return;closeSeaPortActions();SEA_PORT_UI.quoteId=id;$('#seaMarketPanel').hidden=false;renderSeaMarket()}
function renderSeaMarket(){
 const id=SEA_PORT_UI.quoteId;if(!id||!PORTS[id])return;$('#seaMarketName').textContent=PORTS[id].name;
 const owned=Object.keys(state.cargo).filter(k=>state.cargo[k]>0&&GOODS[k]),local=Object.keys(PORTS[id].market).filter(k=>GOODS[k]);
 const rows=(keys,side)=>keys.length?keys.map(k=>`<div class="sea-quote-row">${goodArt(k,GOODS[k].icon)}<span>${GOODS[k].name}</span><b>${side==='sell'?cargoUnitLabel(cargoSaleQuote(id,k)):fmt(priceAt(id,k,side))}</b></div>`).join(''):'<div class="sea-quote-empty">—</div>';
 $('#seaMarketContent').innerHTML=`<section><h3>보유 교역품 판매가</h3>${rows(owned,'sell')}</section><section><h3>교역품 구매가</h3>${rows(local,'buy')}</section>`;
}
function compactSeaPath(points){
 if(!Array.isArray(points)||points.some(p=>!p||!Number.isFinite(p.x)||!Number.isFinite(p.y)))return null;
 return points.filter((p,i)=>i===0||Math.hypot(p.x-points[i-1].x,p.y-points[i-1].y)>1e-8);
}
function updateDockingState(force=false){
 const now=performance.now();if(!force&&now-NAV_RENDER.dockAt<100)return;NAV_RENDER.dockAt=now;
 const nearest=nearestDockId();
 state.atPort=!!nearest;if(nearest)state.current=nearest;
 const enter=$('#returnPortBtn');if(enter.disabled!==!nearest)enter.disabled=!nearest;
 const label=nearest?`${PORTS[nearest].name} 입항`:'입항';if(enter.textContent!==label)enter.textContent=label;
 if(nearest!==NAV_RENDER.dockId){NAV_RENDER.dockId=nearest;if(!state.traveling){$('#routeTitle').textContent=nearest?`${PORTS[nearest].name} 근해`:'자유 항해';$('#routeInfo').textContent=nearest?'입항할 수 있습니다.':''}}
 const velocity=state.traveling?AUTO_SAIL.velocity:MANUAL_SAIL.velocity,speed=`${(.8*velocity/MANUAL_SAIL.maxSpeed).toFixed(1)} kn`;if($('#speedText').textContent!==speed)$('#speedText').textContent=speed;
}
function setSeaClickTarget(point){const marker=$('#seaClickTarget');if(!marker)return;if(!point){marker.hidden=true;return}marker.style.left=`${point.x}px`;marker.style.top=`${point.y}px`;marker.hidden=false}
function cancelAutoSail(keepTarget=false){dismissArrivalPrompt();stopAutoCamera();AUTO_SAIL.velocity=0;AUTO_SAIL.route=null;if(!state.traveling){if(!keepTarget)setSeaClickTarget(null);return false}SEA_ROUTE_RUN++;state.traveling=false;$('#destinationSelect').disabled=false;$('#setCourseBtn').disabled=false;$('#routePath').setAttribute('points','');if(!keepTarget)setSeaClickTarget(null);updateDockingState(true);updateShip();return true}
function startCourse(){const id=$('#destinationSelect').value;if(!id)return toast('목적항을 선택하거나 바다를 클릭하십시오.');selectSeaPort(id)}
function plotCourse(portId=null,seaPoint=null,{confirmArrival=false}={}){
 if(!NAV.ready)return toast('해수 판독이 끝날 때까지 잠시 기다리십시오.');
 const target=portId?PORTS[portId]:seaPoint;if(!target)return;
 const destination={x:target.navX??target.x,y:target.navY??target.y},retarget=state.traveling&&AUTO_SAIL.velocity>.001;
 const path=retarget?retargetSailingPath(destination):findSeaPath({x:state.shipX,y:state.shipY},destination);
 // Commit only a complete safe replacement. A failed click must not stop the existing voyage.
 if(!path||path.length<2)return toast('이 위치까지 이어지는 항로를 찾지 못했습니다.');
 DOCK_SELECTION.portId=null;setSeaClickTarget(destination);sailPath(path,portId,{initialSpeed:retarget?AUTO_SAIL.velocity:0,retarget,confirmArrival});
}
function seaClick(e){if(performance.now()<CAMERA_DRAG.suppressUntil||e.target.closest('.sea-port,.sea-port-actions'))return;closeSeaPortActions();const rect=$('#seaViewport').getBoundingClientRect(),world=$('#oceanWorld'),matrix=new DOMMatrix(getComputedStyle(world).transform),wx=(e.clientX-rect.left-matrix.m41)/matrix.a,wy=(e.clientY-rect.top-matrix.m42)/matrix.d;if(wx<0||wy<0||wx>WORLD.w||wy>WORLD.h||!COAST.ready)return;const clickedWater=preciseWaterAt(wx,wy,false),safe=nearestPreciseWater(wx,wy);if(!safe)return toast('이 지점에서 닿을 수 있는 안전 수역을 찾지 못했습니다.');const target=maskWorldAt(COAST,safe.x,safe.y);$('#destinationSelect').value='';if(!clickedWater)$('#routeInfo').textContent='선택한 육지에서 가장 가까운 해안 수역으로 항로를 보정했습니다.';plotCourse(null,target)}
function sailPath(path,portId,{initialSpeed=0,retarget=false,confirmArrival=false}={}){
 path=compactSeaPath(path);if(!path?.length||(path.length===1?!preciseWaterAt(path[0].x,path[0].y,false):!seaPathClear(path))){setSeaClickTarget(null);toast('안전한 항로를 찾지 못했습니다.');return false;}
 dismissArrivalPrompt();if(confirmArrival)ARRIVAL_UI.routePortId=portId;
 if(path.length===1){SEA_ROUTE_RUN++;clearManualKeys();setSailingPosition(path[0].x,path[0].y);finishCourse(portId,0);updateCamera();return true;}
 const run=++SEA_ROUTE_RUN;let total=0;const segments=[];
 for(let i=1;i<path.length;i++){const len=Math.hypot(path[i].x-path[i-1].x,path[i].y-path[i-1].y);segments.push({a:path[i-1],b:path[i],len,start:total});total+=len;}
 const days=Math.max(1,Math.round(total/28)),motion=createSailingMotion(total,MANUAL_SAIL.maxSpeed,initialSpeed);clearManualKeys();AUTO_SAIL.velocity=motion.initial;AUTO_SAIL.route={path,segmentIndex:0};state.traveling=true;state.atPort=false;
 $('#setCourseBtn').disabled=true;$('#destinationSelect').disabled=true;$('#returnPortBtn').disabled=true;
 $('#routeTitle').textContent=portId?`${toward(PORTS[portId].name)} 항해`:'선장이 정한 해역으로 항해';
 $('#routeInfo').textContent=`육지를 우회하는 ${path.length}개 항로점 · 예상 ${days}일`;$('#speedText').textContent=`${(.8*AUTO_SAIL.velocity/MANUAL_SAIL.maxSpeed).toFixed(1)} kn`;drawRoute(path);
 const started=performance.now();if(!retarget||(!CAMERA_VIEW.autoFollow&&!CAMERA_VIEW.followShip))beginAutoCamera(started);let lastPaint=0,segmentIndex=0,arrived=false,lastTravelled=0;
 function frame(now){
  if(run!==SEA_ROUTE_RUN)return;
  if(now-lastPaint<1000/30-1){requestAnimationFrame(frame);return;}lastPaint=now;
  if(arrived){advanceAutoCamera(now);updateCamera();if(CAMERA_VIEW.autoFollow)requestAnimationFrame(frame);return;}
  const sample=sampleSailingMotion(motion,(now-started)/1000),travelled=sample.distance;AUTO_SAIL.velocity=sample.velocity;consumeVoyageDistance(travelled-lastTravelled);lastTravelled=travelled;
  while(segmentIndex<segments.length-1&&travelled>segments[segmentIndex].start+segments[segmentIndex].len)segmentIndex++;
  AUTO_SAIL.route.segmentIndex=segmentIndex;
  const seg=segments[segmentIndex],local=Math.max(0,Math.min(1,(travelled-seg.start)/seg.len));
  MANUAL_SAIL.heading=(Math.atan2(seg.b.x-seg.a.x,-(seg.b.y-seg.a.y))*180/Math.PI+360)%360;
  setSailingPosition(seg.a.x+(seg.b.x-seg.a.x)*local,seg.a.y+(seg.b.y-seg.a.y)*local);advanceAutoCamera(now);updateShip();updateCamera();
  if(sample.complete){arrived=true;AUTO_SAIL.route=null;finishCourse(portId,days);}
  if(!arrived||CAMERA_VIEW.autoFollow)requestAnimationFrame(frame);
 }
 requestAnimationFrame(frame);
}
function drawRoute(path){$('#routePath').setAttribute('points',path.map(p=>`${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '))}
function openingEventsProtected(){return MARKET_SIM?.openingProtected?.()??(state.elapsedDays||0)<(window.ROTTA_MARKET_EVENTS?.OPENING_GRACE_DAYS??30)}
function finishCourse(id,days){const arrivalId=ARRIVAL_UI.routePortId;ARRIVAL_UI.routePortId=null;if(id&&canDockAt(id))DOCK_SELECTION.portId=id;id=id||nearestDockId();state.traveling=false;AUTO_SAIL.velocity=0;state.atPort=!!id;if(id)state.current=id;$('#speedText').textContent='0.0 kn';$('#routeTitle').textContent=id?`${PORTS[id].name} 도착`:'지정 해역 도착';$('#routeInfo').textContent=id?`${days}일의 항해를 마쳤습니다. 입항하여 항구 시설을 이용하십시오.`:'바다를 다시 클릭하거나 목적항을 선택해 계속 항해하십시오.';$('#returnPortBtn').disabled=!id;$('#destinationSelect').disabled=false;$('#setCourseBtn').disabled=false;$('#routePath').setAttribute('points','');setSeaClickTarget(null);updateShip(true);updateStats();const prompted=arrivalId===id&&showArrivalPrompt(id);if(!prompted&&days>0&&!openingEventsProtected()&&Math.random()<.55){const run=SEA_ROUTE_RUN;setTimeout(()=>{if(run===SEA_ROUTE_RUN&&!state.traveling&&!ARRIVAL_UI.portId&&$('#sailingView').classList.contains('active'))showEvent(EVENTS[Math.floor(Math.random()*EVENTS.length)])},300)}}
function enterPort(){if(window.ROTTA_PORT_TRANSITIONS?.active)return;dismissArrivalPrompt();closeSeaPortUI();stopAutoCamera();const id=nearestDockId();if(!id){updateDockingState(true);return;}if(state.traveling)cancelAutoSail();clearManualKeys();return playPortTransition('arrive',()=>{state.current=id;state.atPort=true;const p=PORTS[id];setSailingPosition(p.navX??p.x,p.navY??p.y);$('#destinationSelect').disabled=false;renderPort();updateStats()})}
function advance(days){
 const count=Math.max(0,Math.floor(Number(days)||0));if(!Number.isFinite(count)||!count)return;
 let latest=null;
 for(let i=0;i<count;i++){
  if(MARKET_SIM){const started=MARKET_SIM.nextDay();latest=started.find(e=>e.portId===state.current)||latest;Object.assign(state,MARKET_SIM.date());state.elapsedDays=MARKET_SIM.day()}
  else{const date=new Date(Date.UTC(state.year,state.month-1,(state.day||1)+1));state.year=date.getUTCFullYear();state.month=date.getUTCMonth()+1;state.day=date.getUTCDate();state.elapsedDays=(state.elapsedDays||0)+1}
  if($('#sailingView').classList.contains('active')){DAY_CLOCK.food+=state.nation==='portugal'?.55:.7;DAY_CLOCK.morale+=1/13;const food=Math.floor(DAY_CLOCK.food),morale=Math.floor(DAY_CLOCK.morale);state.food=Math.max(0,state.food-food);state.morale=Math.max(0,state.morale-morale);DAY_CLOCK.food-=food;DAY_CLOCK.morale-=morale}
 }
 syncMarketDiagnostics();updateStats();
 if(latest)toast(`${PORTS[latest.portId].name} · ${latest.name}`);
 if($('#portView').classList.contains('active')&&!$('#facilityPanel').classList.contains('hidden')){const id=$('[data-facility].active')?.dataset.facility;if(id){renderFacility(id);renderCargoPanel(id==='trade')}}
 if(pendingTrade)updateTradePreview();
 if(SEA_PORT_UI.quoteId)renderSeaMarket();
}
function showEvent(ev){if(window.ROTTA_PORT_TRANSITIONS?.active||openingEventsProtected())return false;if(ev.marketTemplate)MARKET_SIM?.start(ev.marketTemplate,state.current);for(const [k,v] of Object.entries(ev.effects))state[k]=Math.max(0,(state[k]||0)+v);$('#eventIcon').textContent=ev.icon;$('#eventType').textContent=ev.type;$('#eventTitle').textContent=ev.title;$('#eventBody').textContent=ev.body;$('#eventEffects').innerHTML=ev.labels.map(x=>`<span>${x}</span>`).join('');$('#eventModal').classList.remove('hidden');updateStats()}
function switchView(which){if(which!=='sailing')stopDepartureZoom();$('#portView').classList.toggle('active',which==='port');$('#sailingView').classList.toggle('active',which==='sailing');document.body.classList.toggle('sailing-mode',which==='sailing')}
function updateStats(){if(!state.nation)return;const n=NATIONS[state.nation];$('#nationFlag').textContent=n.flag;$('#nationName').textContent=n.name;$('#nationTrait').textContent=n.trait;$('#goldStat').textContent=fmt(state.gold);$('#fameStat').textContent=fmt(state.fame);$('#crewStat').textContent=`${fmt(state.crew)}명`;$('#hullStat').textContent=`${fmt(state.hull)}%`;$('#foodStat').textContent=`${fmt(state.food)}%`;$('#cargoStat').textContent=`${cargoTotal()}/${state.capacity}`;$('#dateText').textContent=`${state.year}년 ${state.month}월 ${state.day||1}일`}
let toastTimer;function toast(msg){const el=$('#toast');el.textContent=msg;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2300)}
init();
