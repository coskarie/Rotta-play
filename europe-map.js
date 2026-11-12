/* Regional chart: one geographic source for visible land, collision and routes. */
(function(root){
'use strict';
const WIDTH=16384,HEIGHT=17192,WEST=-32,EAST=44,SOUTH=25,NORTH=72;
const enabled=!!(root?.location&&new URLSearchParams(root.location.search).get('map')!=='world');
const merc=lat=>Math.log(Math.tan(Math.PI/4+lat*Math.PI/360));
const project=(lat,lon)=>({x:(lon-WEST)/(EAST-WEST)*WIDTH,y:(merc(NORTH)-merc(lat))*WIDTH/((EAST-WEST)*Math.PI/180)});
const DIRS=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
function createNavigation(meta,bits,edges){
 const W=meta.width,H=meta.height,S=meta.step,GW=meta.graphWidth,N=GW*meta.graphHeight;
 const water=(x,y)=>Number.isFinite(x)&&Number.isFinite(y)&&x>=0&&y>=0&&x<W&&y<H&&!!(bits[(Math.floor(y)*W+Math.floor(x))>>>3]&(1<<((Math.floor(y)*W+Math.floor(x))&7)));
 function lineClear(a,b){
  if(!water(a.x,a.y)||!water(b.x,b.y))return false;
  let x=Math.floor(a.x),y=Math.floor(a.y);const ex=Math.floor(b.x),ey=Math.floor(b.y),dx=b.x-a.x,dy=b.y-a.y,sx=Math.sign(dx),sy=Math.sign(dy),stepX=dx?1/Math.abs(dx):Infinity,stepY=dy?1/Math.abs(dy):Infinity;
  let tx=dx?((x+(sx>0?1:0))-a.x)/dx:Infinity,ty=dy?((y+(sy>0?1:0))-a.y)/dy:Infinity;
  while(x!==ex||y!==ey){if(Math.min(tx,ty)>=1-1e-12)return true;if(Math.abs(tx-ty)<1e-10){if(!water(x+sx,y)||!water(x,y+sy))return false;x+=sx;y+=sy;tx+=stepX;ty+=stepY}else if(tx<ty){x+=sx;tx+=stepX}else{y+=sy;ty+=stepY}if(!water(x,y))return false}return true;
 }
 const point=i=>({x:(i%GW)*S+S/2+.5,y:Math.floor(i/GW)*S+S/2+.5});
 function simplify(points){if(!points?.length)return null;const out=[points[0]];let i=0;while(i<points.length-1){let j=i+1;for(let k=i+2;k<points.length;k++){if(lineClear(points[i],points[k]))j=k;else if(k-j>24)break}out.push(points[j]);i=j}return out}
 class Heap{constructor(){this.a=[]}push(v){let i=this.a.length;this.a.push(v);while(i){let p=(i-1)>>1;if(this.a[p].f<=v.f)break;this.a[i]=this.a[p];i=p}this.a[i]=v}pop(){let top=this.a[0],v=this.a.pop();if(this.a.length){let i=0;while(2*i+1<this.a.length){let c=2*i+1;if(c+1<this.a.length&&this.a[c+1].f<this.a[c].f)c++;if(this.a[c].f>=v.f)break;this.a[i]=this.a[c];i=c}this.a[i]=v}return top}get length(){return this.a.length}}
 // Fine local search connects river mouths and narrow coastal starts to the offshore graph.
 function connectors(p){
  const found=[];const gx=Math.floor(p.x/S),gy=Math.floor(p.y/S);
  for(let r=0;r<=8&&found.length<8;r++)for(let y=gy-r;y<=gy+r;y++)for(let x=gx-r;x<=gx+r;x++){
   if(r&&Math.max(Math.abs(x-gx),Math.abs(y-gy))!==r)continue;
   const i=y*GW+x;if(x<0||y<0||x>=GW||i>=N||!edges[i])continue;const q=point(i);
   if(lineClear(p,q))found.push({i,cost:Math.hypot(q.x-p.x,q.y-p.y),path:[p,q]});
  }
  if(found.length)return found.sort((a,b)=>a.cost-b.cost).slice(0,8);
  const sx=Math.floor(p.x),sy=Math.floor(p.y),si=sy*W+sx,open=new Heap(),cost=new Map([[si,0]]),came=new Map();open.push({i:si,f:0});let count=0;
  while(open.length&&count++<90000){const cur=open.pop(),x=cur.i%W,y=Math.floor(cur.i/W),g=cost.get(cur.i);if(cur.f>g+1e-7)continue;
   if(x%S===S/2&&y%S===S/2&&edges[Math.floor(y/S)*GW+Math.floor(x/S)]){
    const q=point(Math.floor(y/S)*GW+Math.floor(x/S));let at=cur.i,tail=[];while(at!==si){tail.push({x:at%W+.5,y:Math.floor(at/W)+.5});at=came.get(at)}tail.reverse();const path=simplify([p,{x:sx+.5,y:sy+.5},...tail,q]);if(path.every((v,i)=>!i||lineClear(path[i-1],v)))return[{i:Math.floor(y/S)*GW+Math.floor(x/S),cost:g+2,path}];
   }
   for(const [dx,dy]of DIRS){const nx=x+dx,ny=y+dy;if(Math.abs(nx-sx)>144||Math.abs(ny-sy)>144||!water(nx,ny)||(dx&&dy&&(!water(x+dx,y)||!water(x,y+dy))))continue;const ni=ny*W+nx,ng=g+Math.hypot(dx,dy);if(ng<(cost.get(ni)??Infinity)){cost.set(ni,ng);came.set(ni,cur.i);open.push({i:ni,f:ng})}}
  }return[];
 }
 const bridgeAt=new Map();(meta.bridges||[]).forEach((b,k)=>{for(const [from,to,rev]of[[b.a,b.b,false],[b.b,b.a,true]]){if(!bridgeAt.has(from))bridgeAt.set(from,[]);bridgeAt.get(from).push({to,cost:b.cost,k,rev})}});
 let g,came,stamp,closed,via,generation=0;
 function route(start,end){
  if(!water(start.x,start.y)||!water(end.x,end.y))return null;if(lineClear(start,end))return[start,end];
  const starts=connectors(start),ends=connectors(end);if(!starts.length||!ends.length)return null;
  if(!g){g=new Float64Array(N);came=new Int32Array(N);stamp=new Uint32Array(N);closed=new Uint32Array(N);via=new Int8Array(N)}
  if(++generation===0xffffffff){stamp.fill(0);closed.fill(0);generation=1}const gen=generation,open=new Heap(),goals=new Map(ends.map(v=>[v.i,v])),roots=new Map(starts.map(v=>[v.i,v]));
  for(const s of starts){g[s.i]=s.cost;stamp[s.i]=gen;came[s.i]=-1;via[s.i]=0;const p=point(s.i);open.push({i:s.i,f:s.cost+Math.hypot(p.x-end.x,p.y-end.y)})}
  let best=Infinity,last=-1;
  while(open.length){const cur=open.pop(),i=cur.i;if(cur.f>=best)break;if(closed[i]===gen)continue;closed[i]=gen;
   if(goals.has(i)){const v=g[i]+goals.get(i).cost;if(v<best){best=v;last=i}}
   const relax=(ni,cost,bridge=0)=>{if(ni<0||ni>=N||closed[ni]===gen)return;const ng=g[i]+cost;if(stamp[ni]!==gen||ng<g[ni]){stamp[ni]=gen;g[ni]=ng;came[ni]=i;via[ni]=bridge;const p=point(ni);open.push({i:ni,f:ng+Math.hypot(p.x-end.x,p.y-end.y)})}};
   const flags=edges[i];for(let k=0;k<8;k++)if(flags&(1<<k)){const [dx,dy]=DIRS[k];relax(i+dy*GW+dx,S*Math.hypot(dx,dy))}
   for(const b of bridgeAt.get(i)||[])relax(b.to,b.cost,(b.k+1)*(b.rev?-1:1));
  }
  if(last<0)return null;const nodes=[];for(let at=last;at!==-1;at=came[at])nodes.push(at);nodes.reverse();const path=[...roots.get(nodes[0]).path];
  for(let j=1;j<nodes.length;j++){const tag=via[nodes[j]];if(tag){let pts=meta.bridges[Math.abs(tag)-1].points.map(p=>({x:p[0]+.5,y:p[1]+.5}));if(tag<0)pts.reverse();path.push(...pts)}path.push(point(nodes[j]))}
  path.push(...goals.get(last).path.slice().reverse());const result=simplify(path);return result.every((v,i)=>!i||lineClear(result[i-1],v))?result:null;
 }
 const packedView=new Proxy({length:W*H},{get(t,k){if(k==='length')return t.length;if(typeof k==='symbol')return undefined;const i=Number(k);return Number.isInteger(i)&&i>=0&&i<t.length?((bits[i>>>3]>>>(i&7))&1):undefined}});
 return{water,lineClear,route,simplify,packedView};
}
let meta,nav,worker,task,terrain;let requestId=0;const pending=new Map();
async function load(progress=()=>{}){if(task)return task;task=(async()=>{
 const fetchAsset=async(name)=>{const r=await fetch('assets/europe/'+name+'?v=2',{cache:'force-cache'});if(!r.ok)throw Error('Europe chart '+name+': '+r.status);return r};
 let completed=0;const downloaded=weight=>{completed+=weight;progress(completed)};
 const [chart,water,graph,terrainAssets]=await Promise.all([fetchAsset('navigation.json').then(r=>r.json()).then(v=>{downloaded(28);return v}),fetchAsset('water.bin').then(r=>r.arrayBuffer()).then(v=>{downloaded(34);return v}),fetchAsset('graph.bin').then(r=>r.arrayBuffer()).then(v=>{downloaded(14);return v}),root.ROTTA_EUROPE_TERRAIN.preload().then(v=>{downloaded(10);return v})]);
 terrain=terrainAssets;
 meta=chart;nav=createNavigation(chart,new Uint8Array(water),new Uint8Array(graph));
 try{worker=new Worker('europe-route-worker.js?v=5');await new Promise((resolve,reject)=>{worker.onmessage=e=>{if(e.data.ready)resolve();else{const p=pending.get(e.data.id);if(p){pending.delete(e.data.id);e.data.error?p.reject(Error(e.data.error)):p.resolve(e.data.path)}}};worker.onerror=e=>{reject(e);for(const p of pending.values())p.reject(Error('Europe route worker failed'));pending.clear();worker?.terminate();worker=null};worker.postMessage({init:true,meta:chart,water,graph})})}catch(e){worker?.terminate();worker=null;console.warn('[Rotta Europe worker fallback]',e)}
 progress(94);return{meta,nav};
 })().catch(e=>{task=null;throw e});return task}
function routeAsync(start,end){if(!worker)return Promise.resolve(nav.route(start,end));return new Promise((resolve,reject)=>{const id=++requestId;pending.set(id,{resolve,reject});worker.postMessage({id,start,end})})}
function mount(svg){
 const world=svg.parentElement;
 return root.ROTTA_EUROPE_TERRAIN.mount(world.parentElement,world,terrain);
}
const api={enabled,width:WIDTH,height:HEIGHT,bounds:{west:WEST,east:EAST,south:SOUTH,north:NORTH},project,createNavigation,load,routeAsync,mount,get meta(){return meta},get nav(){return nav}};
if(typeof module!=='undefined')module.exports=api;if(root)root.ROTTA_EUROPE=api;
})(typeof window!=='undefined'?window:typeof self!=='undefined'?self:null);
