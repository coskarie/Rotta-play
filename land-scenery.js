/* Shared painted atlases, deterministic land-only groves, and a bounded screen canvas. */
(() => {
 'use strict';
 const ROOT='assets/europe/scenery/nature-v1/',CELL=64,MAX_CELLS=160,MAX_VISIBLE=600;
 let assets,loading;
 function preload(){
  return loading??=(async()=>{
   const response=await fetch(ROOT+'atlas.json?v=1',{cache:'force-cache'});
   if(!response.ok)throw Error('Landscape atlas: '+response.status);
   const metadata=await response.json(),result={};
   await Promise.all(Object.entries(metadata).map(async([kind,entry])=>{
    const image=new Image();image.src=ROOT+entry.file+'?v=1';await image.decode();
    result[kind]={image,rects:entry.rects};
   }));
   return assets=result;
  })().catch(error=>{loading=null;throw error;});
 }
 function seedFor(x,y){let seed=Math.imul(x+971,374761393)^Math.imul(y+307,668265263);return(seed^(seed>>>13))>>>0;}
 function randomSource(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
 function geography(x,y,world){
  const b=world.bounds,longitude=b.west+x/world.width*(b.east-b.west);
  const north=Math.log(Math.tan(Math.PI/4+b.north*Math.PI/360));
  const latitude=(2*Math.atan(Math.exp(north-y/world.width*(b.east-b.west)*Math.PI/180))-Math.PI/2)*180/Math.PI;
  return{latitude,longitude};
 }
 function landFootprint(nav,world,x,y,radius){
  if(x-radius<0||y-radius<0||x+radius>=world.width||y+radius>=world.height)return false;
  for(const dx of [-radius,0,radius])for(const dy of [-radius,0,radius])if(nav.water(x+dx,y+dy))return false;
  return true;
 }
 function generateCell(col,row,{world,nav,elevation,exclusions=[]}){
  const random=randomSource(seedFor(col,row)),points=[];
  for(let cluster=0;cluster<8;cluster++){
   const cx=(col+random())*CELL,cy=(row+random())*CELL;
   const {latitude,longitude}=geography(cx,cy,world),arid=latitude<34.5&&longitude>-10;
   const count=3+Math.floor(random()*4),spread=3.5+random()*5;
   for(let member=0;member<count;member++){
    const x=cx+(random()-.5)*spread*2,y=cy+(random()-.5)*spread*2;
    const height=elevation(x,y),choice=random(),size=random(),variant=random();
    if(!Number.isFinite(height)||!landFootprint(nav,world,x,y,2.1))continue;
    if(exclusions.some(site=>(site.x-x)**2+(site.y-y)**2<(site.radius??8)**2))continue;
    const slope=Math.max(Math.abs(elevation(x+3,y)-height),Math.abs(elevation(x,y+3)-height));
    const rocky=height>11||slope>1.6||choice<(arid?.92:.22);
    if(arid&&choice>.23)continue; // Dry southern terrain remains sparse.
    const kind=rocky?'rocks':'trees';
    const index=rocky?(height>13?2:latitude<40?(variant<.5?1:3):0):
     latitude>55||height>7?3:latitude<44?(variant<.57?0:1):2;
    points.push({x,y,kind,index,height,width:rocky?2.7+size*2.6:3.4+size*2.0,
     detail:member>0,priority:random(),id:col+':'+row+':'+cluster+':'+member});
   }
  }
  return points;
 }
 function mount(overlay,{world,project,unproject,elevation,exclusions=()=>[]}){
  const canvas=document.createElement('canvas');canvas.className='land-scenery';canvas.hidden=true;
  canvas.setAttribute('aria-hidden','true');overlay.prepend(canvas);
  const context=canvas.getContext('2d'),cache=new Map();
  let active=false,lastKey='',lastOptions,navSource,draws=0,visible=0,generated=0,frame=0;
  function clear(){visible=0;canvas.hidden=true;lastKey='';}
  function update(options){
   lastOptions=options;
   const {zoom,width,height,nav,cameraKey}=options;
   if(!active||!nav||!assets||zoom<1.15||!Number.isFinite(elevation(0,0))){clear();return;}
   const key=cameraKey+':'+width+':'+height+':'+zoom;
   if(key===lastKey&&navSource===nav)return;
   lastKey=key;
   if(navSource!==nav){cache.clear();navSource=nav;}
   const corners=[-100,width/2,width+100].flatMap(x=>[-100,height+100].map(y=>unproject(x,y)));
   if(!corners.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y))){clear();return;}
   const left=Math.max(0,Math.floor((Math.min(...corners.map(p=>p.x))-12)/CELL));
   const right=Math.min(Math.ceil(world.width/CELL)-1,Math.floor((Math.max(...corners.map(p=>p.x))+12)/CELL));
   const top=Math.max(0,Math.floor((Math.min(...corners.map(p=>p.y))-12)/CELL));
   const bottom=Math.min(Math.ceil(world.height/CELL)-1,Math.floor((Math.max(...corners.map(p=>p.y))+12)/CELL));
   const center=unproject(width/2,height/2),cells=[];
   for(let row=top;row<=bottom;row++)for(let col=left;col<=right;col++)
    cells.push({col,row,distance:Math.hypot((col+.5)*CELL-center.x,(row+.5)*CELL-center.y)});
   cells.sort((a,b)=>a.distance-b.distance);
   const selected=[],sites=exclusions(),detail=Math.max(0,Math.min(1,(zoom-1.8)/1.2));
   for(const {col,row} of cells.slice(0,96)){
    const id=col+':'+row;
    let points=cache.get(id);
    if(points){cache.delete(id);cache.set(id,points);}
    else{points=generateCell(col,row,{world,nav,elevation,exclusions:sites});cache.set(id,points);generated++;}
    for(const point of points){
     if(point.detail&&!detail)continue;
     const position=project(point.x,point.y),displayWidth=point.width*Math.min(zoom,9);
     if(!Number.isFinite(position.x)||!Number.isFinite(position.y)||position.x<-displayWidth||position.x>width+displayWidth||position.y<-displayWidth||position.y>height+displayWidth)continue;
     selected.push({point,position,displayWidth,distance:Math.hypot(position.x-width/2,position.y-height/2)});
    }
   }
   while(cache.size>MAX_CELLS)cache.delete(cache.keys().next().value);
   selected.sort((a,b)=>a.distance-b.distance||a.point.priority-b.point.priority);
   const limit=zoom<2.5?220:MAX_VISIBLE,list=selected.slice(0,limit);
   list.sort((a,b)=>a.position.depth-b.position.depth||a.point.y-b.point.y);
   const ratio=Math.min(1.5,Math.sqrt(1800000/(width*height)),globalThis.devicePixelRatio||1);
   const pixelsWide=Math.max(1,Math.round(width*ratio)),pixelsHigh=Math.max(1,Math.round(height*ratio));
   if(canvas.width!==pixelsWide||canvas.height!==pixelsHigh){canvas.width=pixelsWide;canvas.height=pixelsHigh;}
   context.setTransform(ratio,0,0,ratio,0,0);context.clearRect(0,0,width,height);
   context.imageSmoothingEnabled=true;
   const visibility=Math.max(0,Math.min(1,(zoom-1.15)/.85));
   for(const {point,position,displayWidth} of list){
    const atlas=assets[point.kind],[x,y,w,h]=atlas.rects[point.index],displayHeight=displayWidth*h/w;
    context.globalAlpha=visibility*(point.detail?detail:1);
    context.fillStyle=point.kind==='trees'?'rgba(36,43,25,.15)':'rgba(43,39,31,.12)';
    context.beginPath();context.ellipse(position.x,position.y,displayWidth*.35,displayWidth*.095,0,0,Math.PI*2);context.fill();
    context.drawImage(atlas.image,x,y,w,h,position.x-displayWidth/2,position.y-displayHeight*.96,displayWidth,displayHeight);
   }
   context.globalAlpha=1;canvas.hidden=!list.length;visible=list.length;draws++;
  }
  function requestUpdate(){
   if(frame||!active||!lastOptions)return;
   frame=requestAnimationFrame(()=>{frame=0;lastKey='';update(lastOptions);});
  }
  return{
   update,
   requestUpdate,
   setActive(value){active=value;if(!value){if(frame)cancelAnimationFrame(frame);frame=0;clear();}else requestUpdate();},
   stats:()=>({visible,cachedCells:cache.size,generatedCells:generated,draws,maxVisible:MAX_VISIBLE,canvasPixels:canvas.width*canvas.height})
  };
 }
 const api={preload,geography,landFootprint,generateCell,mount,CELL,MAX_CELLS,MAX_VISIBLE};
 if(typeof module==='object')module.exports=api;else window.ROTTA_LAND_SCENERY=api;
})();
