(() => {
 'use strict';
 const keys=['hull-1','hull-2','part-sails','part-rudder','part-planking','part-cargoFrame','cabin-galley','cabin-hold','cabin-infirmary','cabin-workshop','cabin-chartroom','cabin-quarters','yard-vellum'];
 const files=Object.freeze(Object.fromEntries(keys.map(key=>[key,`assets/shipyard/v2/${key}.png`])));
 const materialKeys=['blueprint','timber','linen','hemp','iron','navalStores'];
 const materialFiles=Object.fromEntries(materialKeys.map(key=>['material-'+key,`assets/shipyard/materials-v1/${key}.png`]));
 // Generated from the sailing meshes so the yard and the inspection view show the same rig.
 const allFiles=Object.freeze({...files,'hull-3':'assets/shipyard/models/hull-3.png',
  'hull-4':'assets/shipyard/models/hull-4-v2.png','hull-5':'assets/shipyard/models/hull-5.png',...materialFiles});
 const assets=Object.values(allFiles).map(path=>({path}));
 function source(key){return Object.hasOwn(allFiles,key)?(window.ROTTA_GOODS_CACHE?.source(allFiles[key])||`${allFiles[key]}?v=29`):''}
 function image(key,name,className=''){return Object.hasOwn(allFiles,key)?`<img class="yard-art ${className}" src="${source(key)}" alt="${name}" decoding="async" draggable="false">`:''}
 function materials(element){element.style.setProperty('--yard-vellum',`url("${source('yard-vellum')}")`)}
 window.ROTTA_SHIPYARD_ART={files:allFiles,assets,source,image,materials};
})();
