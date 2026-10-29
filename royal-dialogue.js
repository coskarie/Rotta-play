(() => {
 'use strict';
 // Visiting-port policy, never the player's nationality. Colonial offices do not house the king.
 const courts={
  lisbon:['portugal','왕궁','국왕 폐하'],seville:['spain','왕실 관청','국왕 폐하'],
  london:['england','왕궁','국왕 폐하'],istanbul:['ottoman','궁정','술탄 폐하'],
  havana:['spain','왕실 관청',null],veracruz:['spain','왕실 관청',null],
  cairo:['ottoman','총독 관청',null],baghdad:['ottoman','총독 관청',null],
  mecca:['mecca','샤리프 관청','샤리프'],ayutthaya:['ayutthaya','왕궁','국왕 폐하'],
  hanyang:['joseon','궁궐','주상 전하'],beijing:['ming','황궁','황제 폐하'],
  edo:['japan','성','성주님']
 };
 const groups=[...new Set(Object.values(courts).map(court=>court[0]))];
 const assets=groups.map(group=>({key:`royal-guard-${group}`,variable:`--royal-guard-${group}`,path:`assets/characters/royal-v1/${group}-guard.webp`}));
 function resolve(port,info){
  const court=courts[port];if(!court||!info?.royal)return null;
  const [group,place,ruler]=court,asset=assets.find(item=>item.key===`royal-guard-${group}`);
  return{
   facility:'royal',speaker:'경비병',portraitPath:asset.path,
   portraitSource:window.ROTTA_HARBOR_CACHE?.source(asset.key)||asset.path,
   portraitAlt:`${place} 경비병`,
   nodes:{
    greeting:{text:`멈추시오. 이곳은 ${place}이오. 무슨 용건이오?`,next:'purpose'},
    purpose:{text:'허가받은 방문이오?',choices:[['알현을 청하오.','audience'],['출입 절차를 묻고 싶소.','procedure']]},
    audience:{text:ruler?`${ruler}께서는 지금 알현을 받지 않으시오.`:'군주께서는 이곳에 계시지 않소. 이곳은 현지 행정을 맡는 관청이오.',choices:[['중요한 교역에 관한 일이오.','trade'],['알겠소. 물러가겠소.','farewell']]},
    procedure:{text:'정식 허가나 소환장이 있어야 하오. 그대 이름으로 도착한 허가는 없소.',choices:[['지금 알현을 청할 수는 없소?','refusal'],['그렇다면 돌아가겠소.','farewell']]},
    trade:{text:'교역에 관한 일이라면 항구의 교역소에서 상의하시오. 허가 없이 안으로 들일 수는 없소.',choices:[['말만 전해 주시오.','refusal'],['알겠소.','farewell']]},
    refusal:{text:'경비병인 내가 알현을 정할 수는 없소. 오늘은 돌아가시오.',next:'farewell'},
    farewell:{text:'조심히 가시오. 출입문 앞은 비워 주시오.',choices:[['대화 종료',null]]}
   }
  };
 }
 window.ROTTA_ROYAL_DIALOGUE={resolve,assets,ports:Object.keys(courts)};
})();
