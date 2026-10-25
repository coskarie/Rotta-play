(function(){
 'use strict';
 // Visual families, not sovereignty or facility policy. All existing port data stays untouched.
 const regions={
  "atlantic-arid": [
    "arguin",
    "verde"
  ],
  "west-african-estuary": [
    "dakar",
    "bathurst",
    "bissau",
    "sierraleone",
    "abidjan"
  ],
  "atlantic-portuguese": [
    "elmina",
    "saotome"
  ],
  "kongo-coast": [
    "luanda",
    "benguela"
  ],
  "southern-anchorage": [
    "capetown",
    "natal"
  ],
  "swahili-coral": [
    "sofala",
    "quelimane",
    "kilwa",
    "mombasa",
    "malindi",
    "mogadishu",
    "mozambique",
    "zanzibar"
  ],
  "red-sea": [
    "massawa",
    "suakin",
    "jeddah"
  ],
  "arabian-rocky": [
    "aden",
    "socotra",
    "muscat",
    "hormuz"
  ],
  "mesopotamian-river": [
    "basra",
    "baghdad"
  ],
  "indo-portuguese": [
    "diu",
    "goa"
  ],
  "malabar-cinnamon": [
    "calicut",
    "cochin",
    "colombo"
  ],
  "bay-of-bengal": [
    "machilipatnam",
    "konark",
    "kolkata"
  ],
  "hijaz-caravan": [
    "mecca"
  ],
  "namib-inland": [
    "karibib"
  ],
  "malay-river": [
    "aceh",
    "pattani",
    "jambi",
    "palembang",
    "malacca",
    "brunei",
    "manila",
    "banjarmasin"
  ],
  "java-maritime": [
    "batavia",
    "surabaya",
    "makassar"
  ],
  "spice-island": [
    "ternate",
    "ambon",
    "banda"
  ],
  "timor-dry-coast": [
    "dili",
    "kupang"
  ],
  "mainland-river": [
    "ayutthaya",
    "lopburi",
    "jadin"
  ],
  "joseon": [
    "hanyang",
    "dongnae",
    "yeongil",
    "jeju"
  ],
  "ming-coastal": [
    "quanzhou",
    "macao"
  ],
  "ming-river": [
    "hangzhou",
    "nanjing",
    "chongqing",
    "beijing"
  ],
  "sengoku-japan": [
    "edo",
    "sakai",
    "nagasaki"
  ],
  "ainu-frontier": [
    "hakodate"
  ],
  "melanesian-coast": [
    "garua",
    "samarai",
    "finschhafen"
  ],
  "aotearoa-maori": [
    "whanganui",
    "wellington"
  ],
  "caribbean-early-spanish": [
    "havana",
    "santiago",
    "santodomingo",
    "sanjuan",
    "santiagodecuba",
    "veracruz",
    "merida",
    "trujillo",
    "cartagena",
    "panama",
    "acapulco"
  ],
  "tropical-american-shore": [
    "jamaica",
    "portauprince",
    "portobelo",
    "maracaibo",
    "caracas",
    "guatemala"
  ],
  "atlantic-island-anchorage": [
    "nassau",
    "bermuda"
  ],
  "brazil-early-factoria": [
    "pernambuco",
    "bahia",
    "saopaulo"
  ],
  "brazil-native-coast": [
    "fortaleza",
    "rio"
  ],
  "andean-dry-coast": [
    "lima",
    "tumbes",
    "cobija"
  ],
  "chile-temperate-coast": [
    "valparaiso",
    "coquimbo"
  ],
  "rioplata-riverbank": [
    "buenosaires"
  ],
  "fuegian-canoe-cove": [
    "ushuaia"
  ],
  "california-ohlone-bay": [
    "sanfrancisco"
  ]
};
 const labels={"atlantic-arid":"건조 대서양 교역지","west-african-estuary":"서아프리카 하구","atlantic-portuguese":"기니만 초기 상관","kongo-coast":"콩고·앙골라 연안","southern-anchorage":"남아프리카 자연 정박지","swahili-coral":"스와힐리 산호석 항구","red-sea":"홍해 교역항","arabian-rocky":"아라비아 바위 해안","mesopotamian-river":"메소포타미아 강항","indo-portuguese":"인도·포르투갈 교역지","malabar-cinnamon":"말라바르·실론 향료항","bay-of-bengal":"벵골만 수운 교역지","hijaz-caravan":"히자즈 내륙 교역지","namib-inland":"나미브 내륙 보급지","malay-river":"말레이 해협 수상 상가","java-maritime":"자바·술라웨시 상업항","spice-island":"몰루카 향료섬","timor-dry-coast":"티모르 건조 해안","mainland-river":"차오프라야·메콩 강변","joseon":"조선 나루·포구","ming-coastal":"명 남중국 연안","ming-river":"명 운하·강항","sengoku-japan":"일본 전국시대 교역지","ainu-frontier":"남홋카이도 교류 연안","melanesian-coast":"멜라네시아 해안 취락","aotearoa-maori":"아오테아로아 마오리 연안","caribbean-early-spanish":"아메리카 초기 스페인 교역항","tropical-american-shore":"열대 아메리카 연안 교역지","atlantic-island-anchorage":"대서양 산호섬 정박지","brazil-early-factoria":"브라질 초기 상관","brazil-native-coast":"브라질 토착 연안","andean-dry-coast":"안데스 건조 해안","chile-temperate-coast":"칠레 온대 태평양","rioplata-riverbank":"라플라타 하구","fuegian-canoe-cove":"티에라델푸에고 해협","california-ohlone-bay":"캘리포니아 올론 연안"};
 const groups={"atlantic-arid":"africa-india","west-african-estuary":"africa-india","atlantic-portuguese":"africa-india","kongo-coast":"africa-india","southern-anchorage":"africa-india","swahili-coral":"africa-india","red-sea":"africa-india","arabian-rocky":"africa-india","mesopotamian-river":"africa-india","indo-portuguese":"africa-india","malabar-cinnamon":"africa-india","bay-of-bengal":"africa-india","hijaz-caravan":"africa-india","namib-inland":"africa-india","malay-river":"asia-pacific","java-maritime":"asia-pacific","spice-island":"asia-pacific","timor-dry-coast":"asia-pacific","mainland-river":"asia-pacific","joseon":"asia-pacific","ming-coastal":"asia-pacific","ming-river":"asia-pacific","sengoku-japan":"asia-pacific","ainu-frontier":"asia-pacific","melanesian-coast":"asia-pacific","aotearoa-maori":"asia-pacific","caribbean-early-spanish":"americas","tropical-american-shore":"americas","atlantic-island-anchorage":"americas","brazil-early-factoria":"americas","brazil-native-coast":"americas","andean-dry-coast":"americas","chile-temperate-coast":"americas","rioplata-riverbank":"americas","fuegian-canoe-cove":"americas","california-ohlone-bay":"americas"};
 const assets=Object.keys(regions).map(style=>({key:`harbor-region-${style}`,variable:`--harbor-region-${style}`,path:`assets/harbors/world-v1/${style}.webp`}));
 window.ROTTA_WORLD_HARBORS={regions,labels,groups,assets};
})();

