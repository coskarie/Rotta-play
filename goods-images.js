(function(){
  const sheets=[
    ['pepper','clove','silk','porcelain','sugar','silver','wool','wine','timber','ivory','dye','coffee','rockSalt','handCannon','almond','cannonball','print','wheat','ceramic','douroWine','fig','mercury','matchlock','sage','gunpowder','cotton','oliveOil'],
    ['saffron','sherry','cattle','vinegar','bacon','rosemary','raisin','iron','salt','coral','majolica','woad','honey','soap','velvet','marble','silkThread','artwork','sulfur','cheese','tuna','timber','muranoGlass','lace','westernBook','marasca','lead'],
    ['marbleSculpture','parchment','carpet','ironOre','caviar','copperPlate','hazelnut','leather','flax','lemon','cedar','cod','herring','fur','amber','beer','linen','hemp','navalStores','copper','tin','coal','whaleOil','dates','pearl','frankincense','horse'],
    ['gold','ebony','cowrie','indigo','cardamom','cinnamon','diamond','rice','nutmeg','mace','camphor','lacquer','paper','ginseng','tea','bronze','tobacco','cacao','cochineal','brazilwood','hides','maize','mate','sandalwood','coconut','rum','henequen']
  ];
  const atlas={};
  sheets.forEach((keys,sheet)=>keys.forEach((key,index)=>{
    if(!atlas[key])atlas[key]={path:`assets/goods-items/${key}.png`};
  }));
  for(const key of Object.keys(window.ROTTA_SPECIALTY_GOODS||{}))atlas[key]={path:`assets/goods-items/${key}.png`};
  window.ROTTA_GOODS_ATLAS=atlas;
})();
