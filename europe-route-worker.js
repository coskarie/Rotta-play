importScripts('europe-map.js?v=5');
let navigation;
onmessage=function({data}){try{if(data.init){navigation=self.ROTTA_EUROPE_WORKER=createNavigationForWorker(data);postMessage({ready:true});return}postMessage({id:data.id,path:navigation.route(data.start,data.end)})}catch(error){postMessage({id:data.id,error:String(error)})}};
function createNavigationForWorker(data){return self.ROTTA_EUROPE.createNavigation(data.meta,new Uint8Array(data.water),new Uint8Array(data.graph))}
