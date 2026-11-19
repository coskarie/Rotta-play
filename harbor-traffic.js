/* European port traffic uses baked sea-only circuits and a bounded pool of cached ship views. */
(() => {
  'use strict';
  const types=[
    {id:'caravel',name:'카라벨형',beam:1.7,wood:[.35,.21,.12],cloth:[.88,.82,.65]},
    {id:'cog',name:'외돛 화물선',beam:2.05,wood:[.28,.19,.12],cloth:[.79,.70,.52]},
    {id:'coaster',name:'쌍돛 연안선',beam:1.85,wood:[.18,.29,.25],cloth:[.80,.67,.43]},
    {id:'galley',name:'갤리형',beam:1.3,wood:[.22,.29,.36],cloth:[.84,.79,.67]}
  ];
  const FPS=24,WAKE_FPS=12,WAKE_SIZE=256,SPRITE_SIZE=160,MAX_SPRITES=96;
  const MAX_VISIBLE=24;
  const routeData=typeof require==='function'?require('./harbor-traffic-routes.js'):window.ROTTA_TRAFFIC_ROUTES;
  let fleetMesh;

  function buildFleet(){
    if(fleetMesh)return fleetMesh;
    const vertices=[],ranges=[];
    const trim=[.66,.48,.27],deck=[.49,.36,.23],rope=[.19,.16,.12];
    function triangle(a,b,c,color,material=0){
      const u=b.map((v,i)=>v-a[i]),v=c.map((value,i)=>value-a[i]);
      const normal=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
      const length=Math.hypot(...normal);
      if(length<1e-8)return;
      for(const point of [a,b,c])vertices.push(...point,...normal.map(value=>value/length),...color,material);
    }
    function quad(a,b,c,d,color,material=0){triangle(a,b,c,color,material);triangle(a,c,d,color,material)}
    function spar(a,b,r,color=rope){
      const direction=b.map((v,i)=>v-a[i]),length=Math.hypot(...direction);
      const axis=direction.map(v=>v/length);
      const across=Math.abs(axis[2])>.9?[1,0,0]:[-axis[1],axis[0],0];
      const size=Math.hypot(...across);
      const u=across.map(v=>v/size);
      const v=[axis[1]*u[2]-axis[2]*u[1],axis[2]*u[0]-axis[0]*u[2],axis[0]*u[1]-axis[1]*u[0]];
      const ring=(point,angle)=>point.map((value,i)=>value+r*(u[i]*Math.cos(angle)+v[i]*Math.sin(angle)));
      for(let i=0;i<6;i++)quad(ring(a,i*Math.PI/3),ring(a,(i+1)*Math.PI/3),ring(b,(i+1)*Math.PI/3),ring(b,i*Math.PI/3),color);
    }
    function box(x,y,z,w,l,h,color){
      const points=[[-1,-1,0],[1,-1,0],[1,1,0],[-1,1,0],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]]
        .map(([a,b,c])=>[x+a*w/2,y+b*l/2,z+c*h]);
      for(const face of [[0,3,2,1],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7],[4,5,6,7]])quad(...face.map(i=>points[i]),color);
    }
    function squareSail(y,bottom,top,width,color){
      spar([-width/2,y,top],[width/2,y,top],.065,trim);
      const point=(u,v)=>[(u-.5)*width*(.78+.22*v),y+Math.sin(u*Math.PI)*Math.sin(v*Math.PI)*1.05,bottom+(top-bottom)*v];
      for(let row=0;row<5;row++)for(let col=0;col<6;col++)quad(point(col/6,row/5),point((col+1)/6,row/5),point((col+1)/6,(row+1)/5),point(col/6,(row+1)/5),color,3);
    }
    function lateen(y,bottom,top,width,color){
      const a=[0,y-width/2,top-3.8],b=[0,y+width/2,top],c=[1.7,y+width*.28,bottom];
      spar(a,b,.065,trim);
      const point=(u,v)=>a.map((value,i)=>value+(b[i]-value)*u+(c[i]-value)*v+(i===0?Math.sin(u*Math.PI)*Math.sin(v*Math.PI)*.6:0));
      for(let row=0;row<6;row++)for(let col=0;col<6-row;col++){
        const u=col/6,v=row/6;
        triangle(point(u,v),point(u+1/6,v),point(u,v+1/6),color,3);
        if(col+row<5)triangle(point(u+1/6,v),point(u+1/6,v+1/6),point(u,v+1/6),color,3);
      }
    }
    for(const [index,type] of types.entries()){
      const firstVertex=vertices.length/10;
      const length=index===3?13.4:12;
      const ring=(u)=>{
        const width=type.beam*Math.pow(Math.sin(Math.PI*(.16+.84*u)),.65);
        const y=(u-.5)*length;
        const top=(index===3?1.65:2.25)+.9*Math.abs(2*u-1)**1.6;
        return [[-width,y,top],[-width*.94,y,top-1.1],[-width*.52,y,-.8],[0,y,-1.2],[width*.52,y,-.8],[width*.94,y,top-1.1],[width,y,top]];
      };
      for(let row=0;row<12;row++){
        const a=ring(row/12),b=ring((row+1)/12);
        for(let edge=0;edge<6;edge++)quad(a[edge],b[edge],b[edge+1],a[edge+1],type.wood);
        quad(a[0],a[6],b[6],b[0],deck);
        for(const side of [0,6])spar(a[side],b[side],.065,trim);
      }
      const stern=ring(0);
      quad(stern[0],stern[6],stern[4],stern[2],type.wood);
      box(0,-4.8,2.6,type.beam*1.35,2.0,index===1?1.7:.7,type.wood);
      box(0,-4.8,index===1?4.3:3.3,type.beam*1.5,2.15,.12,trim);
      spar([0,4.8,2.4],[0,8.8,3.9],.09,trim);
      const masts=index===0?[[-1.7,14.6],[2.3,10.7]]:index===1?[[.1,14.3]]:index===2?[[-1.7,14.0],[2.6,11.2]]:[[-.6,14.7]];
      for(const [y,top] of masts){
        spar([0,y,2.0],[0,y,top],.105,rope);
        for(const side of [-1,1]){
          spar([side*type.beam,y-1.1,2.8],[0,y,top-.8],.022,rope);
          spar([side*type.beam,y+1.1,2.8],[0,y,top-.8],.022,rope);
        }
        if(index===0||index===3)lateen(y,3.3,top-1.0,index===3?8.8:6.1,type.cloth);
        else squareSail(y,index===1?4.0:4.3,top-1.6,index===1?6.4:5.6,type.cloth);
      }
      if(index===2)triangle([0,3,4],[0,8.5,3.9],[.8,3,9.3],type.cloth,3);
      if(index===3)for(let row=0;row<13;row++)for(const side of [-1,1]){
        const y=-4.5+row*.7;
        spar([side*1.0,y,1.4],[side*3.5,y-1,.2],.035,trim);
        box(side*3.45,y-1,.15,.22,.7,.08,deck);
      }
      const flagColor=index%2?[.55,.24,.18]:[.24,.41,.34];
      triangle([0,masts[0][0],masts[0][1]],[0,masts[0][0]-1.4,masts[0][1]-.35],[0,masts[0][0],masts[0][1]-.65],flagColor);
      ranges.push({firstVertex,vertexCount:vertices.length/10-firstVertex});
    }
    fleetMesh={vertices:new Float32Array(vertices),triangles:vertices.length/30,ranges};
    return fleetMesh;
  }

  function buildRoutes(ports,data=routeData){
    const sites=[];
    for(const [id,points] of Object.entries(data?.ports??{})){
      if(!ports[id])continue;
      const segments=[];let length=0;
      for(let i=0;i<points.length;i++){
        const [x,y]=points[i],[bx,by]=points[(i+1)%points.length];
        const distance=Math.hypot(bx-x,by-y);
        if(!distance)continue;
        segments.push({x,y,dx:bx-x,dy:by-y,length:distance,start:length});length+=distance;
      }
      if(!length)continue;
      sites.push({id,segments,length,count:ports[id].royal?3:1,
        bounds:{left:Math.min(...points.map(p=>p[0])),right:Math.max(...points.map(p=>p[0])),
          top:Math.min(...points.map(p=>p[1])),bottom:Math.max(...points.map(p=>p[1]))}});
    }
    return sites;
  }

  function sampleRoute(route,distance){
    distance=((distance%route.length)+route.length)%route.length;
    const segment=route.segments.find(segment=>distance<segment.start+segment.length)??route.segments[route.segments.length-1];
    const t=(distance-segment.start)/segment.length;
    return {x:segment.x+segment.dx*t,y:segment.y+segment.dy*t};
  }

  // Reject the entire footprint of a foam mark if any coastline cell touches it.
  function wakeWaterClear(nav,a,b,radius){
    const left=Math.floor(Math.min(a.x,b.x)-radius),right=Math.floor(Math.max(a.x,b.x)+radius);
    const top=Math.floor(Math.min(a.y,b.y)-radius),bottom=Math.floor(Math.max(a.y,b.y)+radius);
    for(let y=top;y<=bottom;y++)for(let x=left;x<=right;x++)if(!nav.water(x+.5,y+.5))return false;
    return true;
  }

  function paintWake(ctx,stamp,vessel,position,distance,units,seconds,nav,detail){
    ctx.clearRect(0,0,WAKE_SIZE,WAKE_SIZE);
    ctx.lineCap='round';
    const pixel=p=>({x:WAKE_SIZE/2+(p.x-position.x)/units,y:WAKE_SIZE/2+(p.y-position.y)/units});
    const at=(aft,side=0)=>{
      const along=distance-aft*units;
      const center=sampleRoute(vessel.route,along);
      const a=sampleRoute(vessel.route,along-.4),b=sampleRoute(vessel.route,along+.4);
      const length=Math.hypot(b.x-a.x,b.y-a.y)||1;
      return {x:center.x-(b.y-a.y)/length*side*units,y:center.y+(b.x-a.x)/length*side*units};
    };
    let marks=0;
    function streak(a,b,width,alpha){
      if(!wakeWaterClear(nav,a,b,(width/2+2)*units))return;
      const from=pixel(a),to=pixel(b);
      ctx.beginPath();ctx.moveTo(from.x,from.y);ctx.lineTo(to.x,to.y);
      ctx.strokeStyle='#86bdb7';ctx.lineWidth=width+2;ctx.globalAlpha=alpha*.25;ctx.stroke();
      ctx.strokeStyle='#d5eee3';ctx.lineWidth=width;ctx.globalAlpha=alpha;ctx.stroke();marks++;
    }
    function foam(point,radius,alpha){
      if(!stamp||!wakeWaterClear(nav,point,point,(radius+1)*units))return;
      const p=pixel(point);ctx.globalAlpha=alpha;
      ctx.drawImage(stamp,p.x-radius,p.y-radius,radius*2,radius*2);marks++;
    }
    const phase=(seconds*(.65+vessel.speed*.12)+vessel.offset*.17)%1;
    const count=detail?8:4;
    for(let i=0;i<count;i++){
      const t=(i+phase)/count,fade=(1-t)**1.5;
      const aft=24+t*78;
      foam(at(aft,Math.sin(i*2.4+vessel.offset)*(.7+t*1.4)),2.8+t*3.7,.62*fade);
      for(const side of [-1,1]){
        const spread=side*(4+t*19+Math.sin(i*2.8+vessel.offset)*1.4);
        streak(at(aft,spread),at(aft+3.5+t*3,spread+side*1.4),1.0+t*.4,.38*fade);
        if(detail&&i%2===0)foam(at(aft+3,spread*.72),2.2+t*2.4,.34*fade);
      }
    }
    // Short washes along the bow meet the trail without drawing a solid V.
    for(const side of [-1,1]){
      const beam=types[vessel.kind].beam*3.2;
      streak(at(-22,side*.7),at(-14,side*beam*.75),1.1,.25);
      streak(at(-14,side*beam*.75),at(-5,side*beam),1.3,.20);
      foam(at(24,side*beam*.55),3,.38+.08*Math.sin(seconds*3+side+vessel.offset));
    }
    ctx.globalAlpha=1;
    return marks;
  }

  function mount(container,project){
    const layer=document.createElement('div');
    layer.className='harbor-traffic';layer.setAttribute('aria-hidden','true');
    container.prepend(layer);
    // These sibling stacking layers straddle the player's existing z-index of 5.
    const wakeLayer=document.createElement('div'),rearLayer=document.createElement('div'),frontLayer=document.createElement('div');
    wakeLayer.className='traffic-wakes';rearLayer.className='traffic-rear';frontLayer.className='traffic-front';
    for(const child of [wakeLayer,rearLayer,frontLayer])layer.appendChild(child);
    const sprites=new Map(),vessels=[],bindings=new Map();
    let sites=[],nearSites=[],catalog=[],portsSource;
    let view,active=false,timer,renderer,gpuCanvas,navSource,lastPaint=-Infinity,lastCameraKey,foamStamp,playerY;
    let routeBuilds=0,paintCount=0,wakePaints=0,wakeMarks=0,visibleCount=0,failed=false;
    const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const epoch=performance.now();

    function initialize(nav,ports){
      navSource=nav;portsSource=ports;
      sites=buildRoutes(ports);routeBuilds++;
      catalog=[];bindings.clear();
      for(const vessel of vessels){vessel.descriptor=null;vessel.worldY=undefined;vessel.element.hidden=vessel.wake.hidden=true;}
      for(const site of sites){
        const seed=[...site.id].reduce((value,char)=>(value*31+char.charCodeAt(0))>>>0,0);
        site.ships=[];
        for(let slot=0;slot<site.count;slot++){
          const descriptor={key:site.id+':'+slot,port:site.id,kind:(seed+slot)%types.length,route:site,
            offset:site.length*(slot/site.count+.09+(seed%31)/200),speed:.85+(seed+slot)%5*.14};
          site.ships.push(descriptor);catalog.push(descriptor);
        }
      }
    }

    function acquire(descriptor){
      let vessel=vessels.find(item=>!item.descriptor);
      if(!vessel){
        if(vessels.length>=MAX_VISIBLE)return null;
        const element=document.createElement('canvas');element.width=element.height=SPRITE_SIZE;
        element.className='traffic-vessel';
        const wake=document.createElement('canvas');wake.width=wake.height=WAKE_SIZE;wake.className='traffic-wake';
        wakeLayer.appendChild(wake);rearLayer.appendChild(element);
        vessel={element,context:element.getContext('2d'),wake,wakeContext:wake.getContext('2d')};vessels.push(vessel);
      }
      Object.assign(vessel,descriptor,{descriptor,frame:null,worldY:undefined,front:undefined,wakeFrame:undefined,wakeOrigin:null});
      vessel.context.clearRect(0,0,SPRITE_SIZE,SPRITE_SIZE);vessel.wakeContext?.clearRect(0,0,WAKE_SIZE,WAKE_SIZE);
      vessel.element.dataset.vesselId=descriptor.key;vessel.element.dataset.vesselKind=types[descriptor.kind].id;vessel.element.dataset.port=descriptor.port;
      bindings.set(descriptor.key,vessel);
      if(!foamStamp){
        foamStamp=document.createElement('canvas');foamStamp.width=foamStamp.height=32;
        const ctx=foamStamp.getContext('2d'),gradient=ctx.createRadialGradient(16,16,0,16,16,16);
        gradient.addColorStop(0,'rgba(224,244,234,.85)');gradient.addColorStop(.4,'rgba(185,224,214,.46)');
        gradient.addColorStop(1,'rgba(170,218,208,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,32,32);
      }
      return vessel;
    }

    function locateSites(){
      nearSites=sites.filter(({bounds:b})=>{
        const corners=[[b.left,b.top],[b.right,b.top],[b.right,b.bottom],[b.left,b.bottom]].map(([x,y])=>project(x,y));
        const finite=corners.filter(p=>Number.isFinite(p.x)&&Number.isFinite(p.y));
        if(!finite.length)return false;
        return Math.max(...finite.map(p=>p.x))>-160&&Math.min(...finite.map(p=>p.x))<view.width+160&&
          Math.max(...finite.map(p=>p.y))>-160&&Math.min(...finite.map(p=>p.y))<view.height+160;
      });
    }

    function sprite(kind,heading,pitch,budget){
      const direction=((Math.round(heading/15)*15)%360+360)%360;
      const tilt=Math.round(pitch/3)*3;
      const key=kind+':'+direction+':'+tilt;
      if(sprites.has(key))return sprites.get(key);
      if(!budget.left||failed)return null;
      if(!renderer){
        try{
          gpuCanvas=document.createElement('canvas');
          renderer=window.ROTTA_SHIP_3D.createRenderer(gpuCanvas,buildFleet());
          if(!renderer){failed=true;return null;}
        }catch(error){console.warn('Ambient ship renderer unavailable',error);failed=true;return null;}
      }
      const range=buildFleet().ranges[kind];
      if(!renderer.draw({heading:direction,pitch:tilt,size:SPRITE_SIZE,scale:4,waterline:0,ratio:1,force:true,...range}))return null;
      const image=document.createElement('canvas');image.width=image.height=SPRITE_SIZE;
      image.getContext('2d').drawImage(gpuCanvas,0,0);
      sprites.set(key,image);budget.left--;
      if(sprites.size>MAX_SPRITES){
        const oldest=sprites.keys().next().value;
        const previous=sprites.get(oldest);sprites.delete(oldest);previous.width=previous.height=1;
      }
      return image;
    }

    function stop(){if(timer!==undefined)clearTimeout(timer);timer=undefined;}
    function sortVessel(vessel){
      if(!Number.isFinite(vessel.worldY)||!Number.isFinite(playerY))return;
      const delta=vessel.worldY-playerY;
      // Use water anchors, never sprite bobbing or camera-dependent screen coordinates.
      const front=delta>.08?true:delta<-.08?false:(vessel.front??false);
      if(front!==vessel.front){
        const target=front?frontLayer:rearLayer;
        if(vessel.element.parentNode!==target)target.appendChild(vessel.element);
        vessel.front=front;
      }
    }
    function hideTraffic(){
      layer.hidden=true;visibleCount=0;bindings.clear();
      for(const vessel of vessels){vessel.descriptor=null;vessel.worldY=undefined;vessel.element.hidden=vessel.wake.hidden=true;}
      stop();
    }
    function inRegion(){
      return !!(active&&!document.hidden&&view&&view.width>0&&view.height>0&&nearSites.length);
    }
    function paint(cameraOnly=false){
      if(!cameraOnly)timer=undefined;
      if(!inRegion()){hideTraffic();return;}
      layer.hidden=false;
      const now=performance.now();if(!cameraOnly)lastPaint=now;
      const seconds=reduced?.matches?0:(now-epoch)/1000;
      const closeUp=Math.max(0,Math.min(1,(view.zoom-5)/1.5));
      const scale=(.62+Math.max(0,Math.min(1,(view.zoom-1)/9))*.73)*(.75+.25*closeUp*closeUp*(3-2*closeUp));
      const candidates=[];
      // Only ships belonging to nearby port circuits are sampled. Distant ships have no canvases or timers.
      for(const site of nearSites)for(const descriptor of site.ships){
        const along=descriptor.offset+seconds*descriptor.speed;
        const position=sampleRoute(site,along),screen=project(position.x,position.y);
        if(!Number.isFinite(screen.x)||!Number.isFinite(screen.y)||screen.x<=-120||screen.y<=-120||screen.x>=view.width+120||screen.y>=view.height+120)continue;
        const ahead=sampleRoute(site,along+1.8),behind=sampleRoute(site,along-1.8);
        const heading=(Math.atan2(ahead.x-behind.x,behind.y-ahead.y)*180/Math.PI+360)%360;
        candidates.push({descriptor,screen,heading,position,along,distance:Math.hypot(screen.x-view.width/2,screen.y-view.height/2)});
      }
      candidates.sort((a,b)=>a.distance-b.distance);
      const selected=candidates.slice(0,view.zoom<2?16:MAX_VISIBLE),budget={left:2};
      const selectedKeys=new Set(selected.map(item=>item.descriptor.key));
      for(const [key,vessel] of bindings)if(!selectedKeys.has(key)){
        vessel.descriptor=null;vessel.worldY=undefined;vessel.element.hidden=vessel.wake.hidden=true;bindings.delete(key);
      }
      visibleCount=selected.length;
      for(const {descriptor,screen,heading,position,along} of selected){
        const vessel=bindings.get(descriptor.key)??acquire(descriptor);
        if(!vessel)continue;
        vessel.element.hidden=false;vessel.wake.hidden=false;
        const image=cameraOnly?null:sprite(vessel.kind,heading,view.pitch,budget);
        if(image&&vessel.frame!==image){
          vessel.context.clearRect(0,0,SPRITE_SIZE,SPRITE_SIZE);
          vessel.context.drawImage(image,0,0);vessel.frame=image;
        }
        const bob=reduced?.matches?0:Math.sin(seconds*1.4+vessel.offset)*.35;
        const transform='translate3d('+screen.x.toFixed(2)+'px,'+(screen.y+bob).toFixed(2)+'px,0) translate(-50%,-50%) scale('+scale.toFixed(4)+')';
        if(transform!==vessel.transform){vessel.element.style.transform=transform;vessel.transform=transform;}
        vessel.worldY=position.y;sortVessel(vessel);
        const depth=Math.round(position.y*100);
        if(vessel.depth!==depth){vessel.element.style.zIndex=depth;vessel.depth=depth;}
        const wakeFrame=Math.floor(seconds*WAKE_FPS);
        if(!cameraOnly&&vessel.wakeContext&&vessel.wakeFrame!==wakeFrame){
          const units=scale/view.zoom;
          wakeMarks+=paintWake(vessel.wakeContext,foamStamp,vessel,position,along,units,seconds,navSource,view.zoom>=2);
          vessel.wakeOrigin={...position,units};vessel.wakeFrame=wakeFrame;wakePaints++;
        }
        const origin=vessel.wakeOrigin;
        if(origin){
          const base=project(origin.x,origin.y),right=project(origin.x+origin.units,origin.y),down=project(origin.x,origin.y+origin.units);
          const a=right.x-base.x,b=right.y-base.y,c=down.x-base.x,d=down.y-base.y;
          const transform='matrix('+[a,b,c,d,base.x-WAKE_SIZE/2*(a+c),base.y-WAKE_SIZE/2*(b+d)].map(value=>value.toFixed(5)).join(',')+')';
          if(vessel.wakeTransform!==transform){vessel.wake.style.transform=transform;vessel.wakeTransform=transform;}
        }else vessel.wake.hidden=true;
      }
      if(!cameraOnly){
        paintCount++;
        if(!reduced?.matches)timer=setTimeout(paint,visibleCount?1000/FPS:1000);
      }
    }
    function refresh(cameraChanged=false){
      if(!inRegion()){hideTraffic();return;}
      if(timer===undefined||performance.now()-lastPaint>=1000/FPS){stop();paint();}
      // Camera movement must reposition boats with the chart, without rebaking their images.
      else if(cameraChanged)paint(true);
    }
    document.addEventListener('visibilitychange',()=>refresh());
    reduced?.addEventListener?.('change',()=>{stop();refresh()});
    return {
      update(zoom,width,height,pitch,nav,ports,cameraKey){
        view={zoom,width,height,pitch};
        const changed=!!(nav&&ports&&(navSource!==nav||portsSource!==ports));
        if(changed)initialize(nav,ports);
        const cameraChanged=changed||cameraKey===undefined||cameraKey!==lastCameraKey;
        lastCameraKey=cameraKey;
        if(cameraChanged)locateSites();
        refresh(cameraChanged);
      },
      setActive(value){active=value;refresh();},
      setPlayer(worldY){
        if(playerY===worldY)return;
        playerY=worldY;
        for(const vessel of vessels)sortVessel(vessel);
      },
      stats:()=>({vessels:catalog.length,ports:sites.length,allocated:vessels.length,nearPorts:nearSites.length,types:types.length,visible:visibleCount,paintCount,routeBuilds,
        spriteCache:sprites.size,meshTriangles:fleetMesh?.triangles??0,gpuDraws:renderer?.stats.draws??0,wakePaints,wakeMarks,active:inRegion()})
    };
  }
  const api={types,buildFleet,buildRoutes,sampleRoute,wakeWaterClear,paintWake,mount};
  if(typeof module==='object')module.exports=api;else window.ROTTA_HARBOR_TRAFFIC=api;
})();
