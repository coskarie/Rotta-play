window.ROTTA_GLOBAL_GOODS={
 cod:{name:'대구 염장품',icon:'⋖',base:29,category:'식료품'},herring:{name:'청어',icon:'⋗',base:24,category:'식료품'},fur:{name:'모피',icon:'♞',base:56,category:'섬유·피혁'},amber:{name:'호박',icon:'◈',base:69,category:'보석'},beer:{name:'맥주',icon:'♜',base:22,category:'주류'},linen:{name:'리넨',icon:'≋',base:43,category:'직물'},hemp:{name:'대마',icon:'⌇',base:25,category:'선박재'},navalStores:{name:'송진·타르',icon:'♠',base:32,category:'선박재'},copper:{name:'구리',icon:'▣',base:47,category:'광물'},tin:{name:'주석',icon:'▰',base:51,category:'광물'},coal:{name:'석탄',icon:'◆',base:27,category:'광물'},whaleOil:{name:'고래기름',icon:'◒',base:44,category:'유지'},dates:{name:'대추야자',icon:'♣',base:25,category:'식료품'},pearl:{name:'진주',icon:'◉',base:96,category:'보석'},frankincense:{name:'유향',icon:'☁',base:73,category:'향료'},horse:{name:'아라비아 말',icon:'♞',base:84,category:'가축'},gold:{name:'금',icon:'✦',base:108,category:'귀금속'},ebony:{name:'흑단',icon:'╫',base:63,category:'목재'},cowrie:{name:'패화',icon:'◌',base:34,category:'화폐'},indigo:{name:'인디고',icon:'✺',base:61,category:'염료'},cardamom:{name:'카다멈',icon:'❧',base:65,category:'향신료'},cinnamon:{name:'계피',icon:'≋',base:58,category:'향신료'},diamond:{name:'다이아몬드',icon:'◇',base:124,category:'보석'},rice:{name:'쌀',icon:'⌇',base:19,category:'곡물'},nutmeg:{name:'육두구',icon:'✤',base:82,category:'향신료'},mace:{name:'메이스',icon:'✥',base:88,category:'향신료'},camphor:{name:'장뇌',icon:'♧',base:54,category:'약재'},lacquer:{name:'칠기',icon:'▱',base:76,category:'공예품'},paper:{name:'한지·화지',icon:'▤',base:49,category:'공예품'},ginseng:{name:'인삼',icon:'♣',base:93,category:'약재'},tea:{name:'차',icon:'♨',base:57,category:'기호품'},bronze:{name:'청동기',icon:'♜',base:68,category:'공예품'},tobacco:{name:'담배잎',icon:'❦',base:48,category:'기호품'},cacao:{name:'카카오',icon:'●',base:52,category:'기호품'},cochineal:{name:'코치닐',icon:'✺',base:79,category:'염료'},brazilwood:{name:'브라질목',icon:'╫',base:59,category:'염료목'},hides:{name:'소가죽',icon:'▱',base:39,category:'섬유·피혁'},maize:{name:'옥수수',icon:'⌇',base:18,category:'곡물'},mate:{name:'마테',icon:'♨',base:35,category:'기호품'},sandalwood:{name:'백단향',icon:'♠',base:74,category:'향목'},coconut:{name:'코코넛',icon:'◉',base:21,category:'식료품'},rum:{name:'럼주',icon:'♜',base:38,category:'주류'},henequen:{name:'용설란 섬유',icon:'⌇',base:36,category:'섬유'}
};

(function(){
 const pools={
  '이베리아/서지중해':['wine','oliveOil','wheat','almond','salt','iron'],
  '동지중해/흑해':['oliveOil','wheat','cotton','carpet','caviar','leather'],
  '북해/발트해':['wool','cod','timber','beer','linen','amber'],
  '북아프리카':['wheat','oliveOil','dates','leather','salt','coral'],
  '서아프리카':['gold','ivory','ebony','cowrie','dye','timber'],
  '남/동아프리카':['ivory','gold','ebony','timber','cattle','coconut'],
  '홍해/페르시아만':['dates','frankincense','coffee','pearl','horse','carpet'],
  '인도':['cotton','pepper','indigo','cardamom','diamond','silk'],
  '동남아시아':['rice','pepper','clove','nutmeg','tin','camphor'],
  '동아시아':['silk','porcelain','tea','paper','lacquer','copper'],
  '오세아니아/남태평양':['sandalwood','coconut','timber','pearl','rice','hides'],
  '북미/카리브해':['sugar','tobacco','cacao','hides','rum','silver'],
  '남미 동해안':['sugar','brazilwood','hides','tobacco','gold','mate'],
  '남미 서해안/태평양':['silver','cochineal','maize','cacao','hides','gold']
 };
 const special={
  london:'wool',bristol:'tin',plymouth:'navalStores',edinburgh:'coal',dublin:'linen',bordeaux:'wine',nantes:'salt',calais:'wool',antwerp:'lace',amsterdam:'herring',groningen:'flax',bremen:'beer',hamburg:'beer',lubeck:'amber',copenhagen:'herring',oslo:'timber',bergen:'cod',stockholm:'copper',visby:'amber',riga:'hemp',danzig:'amber',
  ceuta:'coral',casablanca:'leather',laspalmas:'sugar',madeira:'wine',algiers:'wheat',tunis:'oliveOil',tripoli:'dates',benghazi:'dates',alexandria:'cotton',cairo:'wheat',
  arguin:'cowrie',verde:'salt',dakar:'gold',bathurst:'ivory',bissau:'ivory',sierraleone:'gold',abidjan:'ivory',elmina:'gold',saotome:'sugar',luanda:'ivory',benguela:'copper',karibib:'copper',
  capetown:'wine',natal:'hides',sofala:'gold',quelimane:'ivory',mozambique:'ivory',kilwa:'gold',zanzibar:'ivory',mombasa:'ivory',malindi:'coconut',mogadishu:'frankincense',
  massawa:'pearl',suakin:'ivory',jeddah:'coffee',mecca:'frankincense',aden:'coffee',socotra:'frankincense',muscat:'horse',hormuz:'pearl',basra:'dates',baghdad:'carpet',
  diu:'indigo',goa:'pepper',calicut:'pepper',cochin:'pepper',colombo:'cinnamon',machilipatnam:'cotton',konark:'rice',kolkata:'indigo',
  aceh:'pepper',malacca:'tin',pattani:'tin',ayutthaya:'rice',lopburi:'rice',jadin:'silk',jambi:'pepper',palembang:'pepper',batavia:'pepper',surabaya:'rice',banjarmasin:'camphor',makassar:'sandalwood',ternate:'clove',ambon:'clove',banda:'nutmeg',dili:'sandalwood',brunei:'camphor',manila:'coconut',
  hanyang:'ginseng',dongnae:'paper',yeongil:'copper',jeju:'horse',macao:'silk',quanzhou:'porcelain',hangzhou:'silk',nanjing:'silk',chongqing:'tea',beijing:'bronze',edo:'lacquer',sakai:'paper',nagasaki:'silver',hakodate:'fur',
  garua:'sandalwood',samarai:'pearl',finschhafen:'ebony',kupang:'sandalwood',whanganui:'hides',wellington:'timber',
  havana:'sugar',santiago:'tobacco',jamaica:'sugar',portauprince:'cacao',santodomingo:'sugar',sanjuan:'sugar',nassau:'salt',bermuda:'navalStores',santiagodecuba:'tobacco',veracruz:'silver',merida:'henequen',trujillo:'cacao',portobelo:'silver',
  maracaibo:'cacao',cartagena:'gold',caracas:'cacao',fortaleza:'brazilwood',pernambuco:'sugar',bahia:'sugar',rio:'brazilwood',saopaulo:'hides',buenosaires:'hides',ushuaia:'whaleOil',valparaiso:'copper',coquimbo:'copper',cobija:'silver',lima:'silver',tumbes:'cacao',panama:'silver',guatemala:'cochineal',acapulco:'cochineal',sanfrancisco:'hides'
 };
 const core=[['london','북해/발트해'],['lisbon','이베리아/서지중해'],['seville','이베리아/서지중해'],['marseille','이베리아/서지중해'],['istanbul','동지중해/흑해'],['alexandria','북아프리카'],['goa','인도'],['calicut','인도'],['malacca','동남아시아'],['macao','동아시아'],['nagasaki','동아시아'],['mozambique','남/동아프리카'],['zanzibar','남/동아프리카'],['havana','북미/카리브해'],['veracruz','북미/카리브해'],['bahia','남미 동해안']];
 const rows=[...(window.ROTTA_PORT_CATALOG||[]).map(r=>[r[0],r[4]]),...core],markets={};
 for(const[id,region]of rows){const pool=pools[region]||['wheat','timber','salt','wine','wool','iron'],pick=[...new Set([pool[0],pool[1],pool[2],special[id]||pool[3+(Math.abs([...id].reduce((a,c)=>a+c.charCodeAt(0),0))%Math.max(1,pool.length-3))]])];for(const key of pool)if(!pick.includes(key)&&pick.length<4)pick.push(key);const market={};pick.slice(0,4).forEach((key,i)=>market[key]=Number((.54+((id.length*13+key.length*7+i*11)%28)/100).toFixed(2)));markets[id]=market}
 window.ROTTA_WORLD_MARKETS=markets;
})();
