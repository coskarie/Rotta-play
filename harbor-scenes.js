(function(){
 'use strict';
 // Architectural regions only: sovereignty, facilities and port coordinates are unchanged.
 const regions={
  "portugal": [
    "lisbon",
    "porto",
    "faro",
    "madeira"
  ],
  "spain": [
    "seville",
    "malaga",
    "valencia",
    "barcelona",
    "palma",
    "laspalmas"
  ],
  "england": [
    "london",
    "bristol",
    "plymouth",
    "edinburgh",
    "dublin"
  ],
  "france": [
    "marseille",
    "montpellier",
    "bordeaux",
    "nantes",
    "calais"
  ],
  "italy": [
    "genoa",
    "pisa",
    "naples",
    "syracuse",
    "cagliari",
    "sassari",
    "ajaccio"
  ],
  "adriatic": [
    "venice",
    "trieste",
    "zadar",
    "ragusa",
    "candia",
    "nicosia"
  ],
  "hanseatic": [
    "antwerp",
    "amsterdam",
    "groningen",
    "bremen",
    "hamburg",
    "lubeck",
    "riga",
    "danzig",
    "visby"
  ],
  "nordic": [
    "copenhagen",
    "oslo",
    "bergen",
    "stockholm"
  ],
  "ottoman": [
    "istanbul",
    "athens",
    "thessaloniki",
    "trebizond",
    "caffa",
    "odesa",
    "jaffa",
    "beirut"
  ],
  "north-africa": [
    "ceuta",
    "casablanca",
    "algiers",
    "tunis",
    "tripoli",
    "benghazi",
    "alexandria",
    "cairo"
  ]
};
 const europeStyles=Object.keys(regions),world=window.ROTTA_WORLD_HARBORS;
 if(world)Object.assign(regions,world.regions);
 const styles=Object.keys(regions),byPort=new Map(Object.entries(regions).flatMap(([style,ids])=>ids.map(id=>[id,style])));
 const assets=[...europeStyles.map(style=>({key:`harbor-region-${style}`,variable:`--harbor-region-${style}`,path:`assets/harbors/europe-v1/${style}.png`})),...(world?.assets||[])];
 function resolve(id){return byPort.get(id)||null}
 function show(scene,id){
  if(!scene)return;
  const style=resolve(id);
  if(style)scene.dataset.harborStyle=style;
  else delete scene.dataset.harborStyle; // Unknown IDs must not retain the previous port's exterior.
 }
 window.ROTTA_HARBORS={styles,europeStyles,regions,assets,resolve,show};
})();

