(function(){
 'use strict';
 // Origin DB distribution is a game reference, not evidence that a port manufactured an item.
 // Prices, stock and volatility below are Rotta balance parameters, in gold.
 const rows=[
  ['mirror','거울','미술품',96,'베네치아 공화국',['venice','trieste'],'none',.12,1.2,.65,'1412'],
  ['celadon','고려청자','공예품',125,'조선 · 고려 유물',['hanyang'],'none',.11,1.1,.28,'1302'],
  ['rubber','고무','공업품',38,'메소아메리카',['guatemala','panama'],'none',.065,.9,.9,'0902'],
  ['chili','고추','향신료',47,'메소아메리카',['acapulco','panama'],'spice',.115,1.2,.9,'1504'],
  ['guaiacWood','구와이아우드','의약품',68,'아메리카',['lima','tumbes'],'none',.085,1.1,.7,'0435'],
  ['osmanthus','금목서','향료',76,'명',['hangzhou'],'herb',.11,1.1,.65,'1702'],
  ['clogs','나무신발','잡화',24,'네덜란트',['antwerp'],'none',.025,.55,1,'0519'],
  ['nacreLacquer','나전 칠기','미술품',138,'조선',['dongnae'],'none',.125,1.25,.45,'1401'],
  ['fishSauce','느억맘','조미료',29,'대월',['jadin'],'fish',.05,.8,1,'0203'],
  ['nishijin','니시진오리','직물',112,'일본 · 교토',['sakai'],'none',.10,1.15,.55,'1203'],
  ['damascusSteel','다마스쿠스 강철','공업품',84,'레반트',['beirut'],'none',.065,.95,.65,'0926'],
  ['bamboo','대나무','공업품',20,'명',['chongqing','quanzhou'],'none',.03,.65,1,'0905'],
  ['madeiraWine','마데이라 와인','주류',46,'포르투갈 · 마데이라',['madeira'],'grape',.05,.8,.85,'0617'],
  ['muslin','모슬린','직물',73,'인도양 교역권',['basra','hormuz'],'none',.08,1,.75,'1210'],
  ['myrrh','몰약','의약품',74,'홍해 교역권',['benghazi','alexandria','tripoli'],'none',.085,1.15,.65,'0412'],
  ['whitePorcelain','순백자','공예품',88,'명 · 조선',['quanzhou','hanyang','nagasaki','sakai'],'none',.065,.9,.55,'1309'],
  ['sumac','숨마끄','향신료',49,'서아시아 · 홍해',['massawa','basra'],'spice',.10,1.1,.85,'1533'],
  ['sheaButter','시어 버터','의약품',56,'서아프리카',['bissau','elmina','madeira'],'nut',.07,.95,.8,'0443'],
  ['aguayo','아과요','직물',65,'안데스',['lima','tumbes'],'none',.075,1,.75,'1216'],
  ['avocado','아보카도','기호품',32,'아메리카',['rio','maracaibo','bahia','buenosaires','cartagena','pernambuco'],'fruit',.075,.9,.9,'1018'],
  ['azulejo','아줄레주','공예품',69,'포르투갈',['lisbon','porto'],'none',.055,.8,.75,'1321'],
  ['aquavit','아콰비트','주류',51,'스칸디나비아',['bergen','visby','stockholm','copenhagen'],'none',.05,.8,.8,'0609'],
  ['alpacaYarn','알파카 털실','섬유',53,'안데스',['lima','tumbes'],'shear',.065,.9,.85,'1113'],
  ['allspice','올스파이스','향신료',63,'카리브해',['nassau','jamaica','trujillo'],'spice',.12,1.2,.8,'1522'],
  ['jasmine','재스민','향료',79,'인도',['goa'],'herb',.11,1.15,.65,'1720'],
  ['cashmere','캐시미어','직물',118,'카슈미르 · 인도양',['goa'],'winter',.10,1.15,.55,'1219'],
  ['kris','크리스','무기류',91,'자바',['surabaya','batavia'],'none',.095,1.2,.65,'1922'],
  ['tnalak','트날락','직물',82,'필리핀 · 동남아시아',['dili','manila','makassar','banda','banjarmasin','brunei','surabaya','aceh','ambon','batavia','ternate','palembang'],'none',.085,1,.7,'1229'],
  ['pasta','파스타','식료품',25,'이탈리아',['naples','syracuse'],'grain',.05,.85,1,'0156'],
  ['feta','페타 치즈','식료품',35,'그리스',['candia','thessaloniki'],'none',.06,.9,.9,'0163'],
  ['flannel','플란넬','직물',58,'브리튼',['london','bristol'],'winter',.07,.9,.85,'1223'],
  ['pistachio','피스타치오','기호품',48,'서아시아',['aden'],'nut',.075,.95,.8,'1032']
 ];
 const notes={
  celadon:'고려 시대 유물의 소량 거래. 1543년 신규 대량 생산품으로 취급하지 않음.',
  nacreLacquer:'DB의 덕원은 미구현. 조선 공예품의 연안 유통 거점으로 동래에 지역 배치.',
  whitePorcelain:'DB의 일본 판매항은 수입항으로 유지. 명·조선 생산 거점 추가. 16세기 일본산 백자로 취급하지 않음.',
  sheaButter:'DB의 푼샬(마데이라)은 중계항. 서아프리카 산지 거점 비사우·엘미나 추가.',
  alpacaYarn:'DB의 우수아이아는 알파카 산지와 맞지 않아 제외. 리마·툼베스만 배치.',
  tnalak:'DB의 동남아 판매망을 반영. 필리핀 생산과 역내 유통은 구분.',
  avocado:'DB의 남미 판매망을 반영한 게임 배치. 모든 판매항의 토산 생산을 뜻하지 않음.',
  guaiacWood:'DB의 리마·툼베스 판매망 반영. 판매항과 식물 원산지는 구분.',
  madeiraWine:'16세기 마데이라 포도주. 후대의 표준화된 가열·강화 공법은 전제하지 않음.'
 };
 const producerPorts={
  mirror:['venice','trieste'],celadon:[],rubber:['guatemala','panama'],chili:['acapulco','panama'],
  guaiacWood:[],osmanthus:['hangzhou'],clogs:['antwerp'],nacreLacquer:['dongnae'],
  fishSauce:['jadin'],nishijin:['sakai'],damascusSteel:['beirut'],bamboo:['chongqing','quanzhou'],
  madeiraWine:['madeira'],muslin:[],myrrh:[],whitePorcelain:['quanzhou','hanyang'],
  sumac:['basra'],sheaButter:['bissau','elmina'],aguayo:['lima','tumbes'],avocado:['maracaibo','cartagena'],
  azulejo:['lisbon','porto'],aquavit:['bergen','visby','stockholm','copenhagen'],alpacaYarn:['lima','tumbes'],
  allspice:['jamaica','trujillo'],jasmine:['goa'],cashmere:[],kris:['surabaya','batavia'],tnalak:['manila'],
  pasta:['naples','syracuse'],feta:['candia','thessaloniki'],flannel:['london','bristol'],pistachio:[]
 };
 const eventKeys={
  EV01:['chili','osmanthus','bamboo','sumac','sheaButter','avocado','allspice','jasmine'],
  EV02:['chili','bamboo','avocado'],EV03:['osmanthus','avocado'],
  EV06:['chili','avocado','sheaButter'],EV07:['madeiraWine'],EV09:['chili','sumac','allspice'],
  EV11:['fishSauce'],EV12:['fishSauce'],EV13:['feta','alpacaYarn','cashmere'],EV15:['nishijin'],
  EV18:['damascusSteel','mirror','kris'],
  EV19:['mirror','celadon','clogs','nacreLacquer','nishijin','muslin','whitePorcelain','aguayo','azulejo','cashmere','kris','tnalak','flannel'],
  EV20:['guaiacWood','bamboo'],EV21:['pasta'],EV22:['pasta','feta','pistachio','sheaButter','avocado'],
  EV24:['myrrh','cashmere','muslin','damascusSteel','pistachio'],EV31:['pasta','flannel','alpacaYarn','cashmere'],
  EV32:['damascusSteel','bamboo'],EV33:['azulejo'],
  EV34:['mirror','nacreLacquer','nishijin','whitePorcelain','madeiraWine','aquavit','azulejo','cashmere'],
  EV35:['pasta','myrrh','muslin'],EV36:['nishijin','muslin','aguayo','alpacaYarn','cashmere','tnalak','flannel'],
  EV41:['guaiacWood','myrrh','sheaButter'],EV42:['jasmine','osmanthus'],
  EV45:['mirror','nacreLacquer','myrrh'],EV46:['mirror','celadon','nacreLacquer','nishijin','whitePorcelain','azulejo','cashmere'],
  EV48:['guaiacWood','myrrh','rubber'],EV50:['kris','damascusSteel','pasta']
 };
 const goods={},markets={};
 for(const[key,name,category,base,originRegion,portIds,season,noise,sensitivity,stockScale,code]of rows){
  goods[key]={name,category,base,icon:'◇',specialty:true,originRegion,stockScale,
   sourceUrl:`https://uwo.inven.co.kr/db/trade/?code=trade${code}`,
   sourceNote:notes[key]||'오리진 DB 취급항을 현재 항구명에 연결. 가격·재고·계절은 Rotta 설정.',
   priceProfile:{season,noise,sensitivity}};
  for(const id of portIds)(markets[id]??={})[key]=producerPorts[key].includes(id)?.58:.70;
 }
 window.ROTTA_SPECIALTY_GOODS=goods;
 window.ROTTA_SPECIALTY_MARKETS=markets;
 // Mutates only the existing climate dataset's commodity flags/templates, never geography.
 window.ROTTA_APPLY_SPECIALTY_DATA=function(data){
  if(!data||data.specialtyVersion===1)return;
  for(const[key,ids]of Object.entries(producerPorts))for(const id of ids){
   const p=data.ports[id];if(p&&!p.producers.includes(key))p.producers.push(key);
  }
  for(const t of data.templates||[])if(eventKeys[t.id])t.keys=[...new Set([...(t.keys||[]),...eventKeys[t.id]])];
  data.specialtyVersion=1;
 };
})();
