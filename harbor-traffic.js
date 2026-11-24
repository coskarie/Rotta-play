/* European port traffic uses baked sea-only trade itineraries and a bounded pool of cached ship views. */
(() => {
  'use strict';
  const types=[
    {id:'caravel',name:'카라벨형',beam:1.7,wood:[.35,.21,.12],cloth:[.88,.82,.65]},
    {id:'cog',name:'외돛 화물선',beam:2.05,wood:[.28,.19,.12],cloth:[.79,.70,.52]},
    {id:'coaster',name:'쌍돛 연안선',beam:1.85,wood:[.18,.29,.25],cloth:[.80,.67,.43]},
    {id:'galley',name:'갤리형',beam:1.3,wood:[.22,.29,.36],cloth:[.84,.79,.67]},
    {id:'fishing',name:'연안 어선',beam:1.55,wood:[.37,.22,.12],cloth:[.76,.36,.19],scale:.56}
  ];
  const fishingPorts=new Set(['lisbon','seville','london','marseille','istanbul']);
  const fishingKind=types.findIndex(type=>type.id==='fishing');
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
    function fishingBoat(type){
      // Shallow open clinker hull. Both ends fine down to a stem.
      const rim=[.06,.92,1.44,type.beam,1.39,.84,.04];
      const section=(i,side)=>{
        const y=(i-3)*1.85,w=rim[i]*side,lip=1.35+.08*(i-3)**2;
        return [[0,y,-.45],[w*.70,y,.19],[w,y,lip],[w*.86,y,lip-.05],[w*.54,y,.46]];
      };
      for(const side of [-1,1])for(let i=0;i<rim.length-1;i++){
        const a=section(i,side),b=section(i+1,side);
        for(let j=0;j<4;j++)quad(a[j],b[j],b[j+1],a[j+1],j===2?trim:type.wood);
        quad(a[4],b[4],[0,b[4][1],.43],[0,a[4][1],.43],deck);
        spar(a[2],b[2],.085,trim);
      }
      for(const y of [-2.8,-.3,2.1])box(0,y,1.04,2.36,.38,.15,deck);
      // Raked red-ochre working sail leaves the aft benches and net exposed.
      spar([0,1.25,.48],[0,1.00,7.30],.12,trim);
      const tack=[-.24,3.68,2.05],peak=[.10,-1.55,7.00],clew=[1.55,-2.45,2.12];
      spar(tack,peak,.085,trim);
      const belly=[.91,-.02,3.94];
      for(const [a,b] of [[tack,peak],[peak,clew],[clew,tack]])triangle(a,b,belly,type.cloth,3);
      spar(clew,[1.20,-3.5,1.36],.035,rope);
      // A folded fishing net with crossed cords and cork floats at the stern.
      const net=[.25,.32,.27];
      box(0,-3.62,.65,1.65,1.05,.50,net);
      for(const x of [-.65,-.25,.15,.55]){
        spar([x,-4.10,1.17],[x+.22,-3.14,1.17],.045,rope);
        box(x,-4.10,1.17,.21,.20,.14,trim);
      }
      for(const y of [-3.90,-3.58,-3.26])spar([-.78,y,1.18],[.78,y+.09,1.18],.038,rope);
    }
    for(const [index,type] of types.entries()){
      const firstVertex=vertices.length/10;
      if(index===fishingKind){
        fishingBoat(type);
        ranges.push({firstVertex,vertexCount:vertices.length/10-firstVertex});
        continue;
      }
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

  function returnRoute(id,from,to,points){
    const segments=[];let oneWayLength=0;
    for(let i=1;i<points.length;i++){
      const [x,y]=points[i-1],[bx,by]=points[i],length=Math.hypot(bx-x,by-y);
      if(!length)continue;
      segments.push({x,y,dx:bx-x,dy:by-y,length,start:oneWayLength});oneWayLength+=length;
    }
    if(!oneWayLength)return null;
    let length=oneWayLength;
    for(const segment of segments.slice().reverse()){
      segments.push({x:segment.x+segment.dx,y:segment.y+segment.dy,dx:-segment.dx,dy:-segment.dy,length:segment.length,start:length});
      length+=segment.length;
    }
    return {id,from,to,segments,length,oneWayLength,
      bounds:{left:Math.min(...points.map(p=>p[0])),right:Math.max(...points.map(p=>p[0])),
        top:Math.min(...points.map(p=>p[1])),bottom:Math.max(...points.map(p=>p[1]))}};
  }

  function fishingRoute(home,lane){
    // Follow the first 55 chart units of the safe approach from the home dock.
    const start=home===lane.from?0:lane.oneWayLength;
    const end=start+Math.min(55,lane.oneWayLength);
    const points=[];
    const add=p=>points.push([p.x,p.y]);
    add(sampleRoute(lane,start));
    for(const leg of lane.segments)if(leg.start>start&&leg.start<end)points.push([leg.x,leg.y]);
    add(sampleRoute(lane,end));
    return returnRoute(home+'-fishery',home,home+'-fishing-ground',points);
  }

  function buildRoutes(ports,data=routeData){
    const lanes=new Map(),sites=[];
    for(const lane of Object.values(data?.routes??{})){
      if(!ports[lane.from]||!ports[lane.to])continue;
      const route=returnRoute(lane.id,lane.from,lane.to,lane.points);
      if(route)lanes.set(lane.id,route);
    }
    for(const [id,assignments] of Object.entries(data?.ports??{})){
      if(!ports[id])continue;
      const plans=assignments.map(key=>lanes.get(key)).filter(Boolean);
      if(!plans.length)continue;
      sites.push({id,plans,count:ports[id].royal?3:1,
        bounds:{left:Math.min(...plans.map(p=>p.bounds.left)),right:Math.max(...plans.map(p=>p.bounds.right)),
          top:Math.min(...plans.map(p=>p.bounds.top)),bottom:Math.max(...plans.map(p=>p.bounds.bottom))}});
    }
    return sites;
  }

  function sampleRoute(route,distance){
    distance=((distance%route.length)+route.length)%route.length;
    // Long coastal itineraries use binary search instead of scanning every waypoint.
    let lo=0,hi=route.segments.length-1;
    while(lo<hi){const mid=(lo+hi)>>1;if(distance<route.segments[mid].start+route.segments[mid].length)hi=mid;else lo=mid+1;}
    const segment=route.segments[lo],t=(distance-segment.start)/segment.length;
    return {x:segment.x+segment.dx*t,y:segment.y+segment.dy*t};
  }

  function voyageCycle(vessel){return 2*(vessel.route.oneWayLength/vessel.speed+3+vessel.dockSeconds);}
  function randomVoyagePhase(vessel,random=Math.random){
    const L=vessel.route.oneWayLength,travel=L/vessel.speed+3;
    const inbound=random()<.5;
    // Begin in the middle of an existing voyage, with distance distributed along the sea lane.
    const distance=L*(.1+.8*random());
    const elapsed=distance<1.5*vessel.speed?Math.sqrt(6*distance/vessel.speed):
      L-distance<1.5*vessel.speed?travel-Math.sqrt(6*(L-distance)/vessel.speed):distance/vessel.speed+1.5;
    return (inbound?2*vessel.dockSeconds+travel:vessel.dockSeconds)+elapsed;
  }
  function sampleVoyage(vessel,seconds){
    const route=vessel.route,L=route.oneWayLength,travel=L/vessel.speed+3,wait=vessel.dockSeconds;
    const cycle=2*(travel+wait),time=((seconds+vessel.phase)%cycle+cycle)%cycle;
    const homeStart=vessel.port===route.from?0:L;
    let start,along,ratio,phase,dockAge=0;
    if(time<wait){start=homeStart;along=start;ratio=0;phase='loading';dockAge=time;}
    else if(time<wait+travel){start=homeStart;phase='outbound';}
    else if(time<2*wait+travel){start=(homeStart+L)%route.length;along=start;ratio=0;phase='loading';dockAge=time-wait-travel;}
    else{start=(homeStart+L)%route.length;phase='inbound';}
    if(phase!=='loading'){
      const t=phase==='outbound'?time-wait:time-2*wait-travel;
      const remaining=travel-t;
      const distance=t<3?vessel.speed*t*t/6:remaining<3?L-vessel.speed*remaining*remaining/6:vessel.speed*(t-1.5);
      along=start+distance;ratio=Math.max(0,Math.min(1,t/3,remaining/3));
    }
    const bearing=(a,b)=>{const p=sampleRoute(route,a),q=sampleRoute(route,b);return (Math.atan2(q.x-p.x,p.y-q.y)*180/Math.PI+360)%360;};
    let heading;
    if(phase==='loading'){
      const incoming=bearing(start-2,start),outgoing=bearing(start,start+2);
      const turn=Math.max(0,Math.min(1,(dockAge-(wait-3))/3));
      heading=incoming+((outgoing-incoming+540)%360-180)*turn*turn*(3-2*turn);
    }else heading=bearing(Math.max(start,along-1.8),Math.min(start+L,along+1.8));
    const position=sampleRoute(route,along);
    const destination=start===0?route.to:route.from;
    return {position,along,heading:(heading+360)%360,speed:ratio,phase,destination,cycle};
  }

  // Reject the entire footprint of a foam mark if any coastline cell touches it.
  function wakeWaterClear(nav,a,b,radius){
    const left=Math.floor(Math.min(a.x,b.x)-radius),right=Math.floor(Math.max(a.x,b.x)+radius);
    const top=Math.floor(Math.min(a.y,b.y)-radius),bottom=Math.floor(Math.max(a.y,b.y)+radius);
    for(let y=top;y<=bottom;y++)for(let x=left;x<=right;x++)if(!nav.water(x+.5,y+.5))return false;
    return true;
  }

  function paintWake(ctx,stamp,vessel,position,distance,units,seconds,nav,detail,opacity=1){
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
      ctx.strokeStyle='#86bdb7';ctx.lineWidth=width+2;ctx.globalAlpha=alpha*.25*opacity;ctx.stroke();
      ctx.strokeStyle='#d5eee3';ctx.lineWidth=width;ctx.globalAlpha=alpha*opacity;ctx.stroke();marks++;
    }
    function foam(point,radius,alpha){
      if(!stamp||!wakeWaterClear(nav,point,point,(radius+1)*units))return;
      const p=pixel(point);ctx.globalAlpha=alpha*opacity;
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

  function mount(container,project,random=Math.random,unproject=null){
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
          const route=site.plans[slot%site.plans.length];
          const descriptor={key:site.id+':'+slot,port:site.id,kind:(seed+slot)%fishingKind,route,
            speed:.85+(seed+slot)%5*.14,dockSeconds:16+seed%9,phase:0,offset:seed%97};
          // Sample once per world initialization; camera culling and canvas reuse never respawn a ship.
          descriptor.phase=randomVoyagePhase(descriptor,random);
          site.ships.push(descriptor);catalog.push(descriptor);
        }
        if(fishingPorts.has(site.id)){
          const descriptor={key:site.id+':fishing',port:site.id,kind:fishingKind,route:fishingRoute(site.id,site.plans[0]),
            speed:.52,dockSeconds:22,phase:0,offset:seed%97+11};
          descriptor.phase=randomVoyagePhase(descriptor,random);
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
      if(unproject){
        // Cull in chart space. Projecting a long route's corners loses the near
        // half when those corners pass behind the tilted camera (Infinity).
        // Side and center samples include the curved horizon's extremal reach.
        const points=[-160,view.width/2,view.width+160].flatMap(x=>
          [-160,view.height+160].map(y=>unproject(x,y)));
        if(points.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y))){
          const left=Math.min(...points.map(p=>p.x)),right=Math.max(...points.map(p=>p.x));
          const top=Math.min(...points.map(p=>p.y)),bottom=Math.max(...points.map(p=>p.y));
          nearSites=sites.filter(({bounds:b})=>b.right>=left&&b.left<=right&&b.bottom>=top&&b.top<=bottom);
          return;
        }
      }
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
      const fleetScale=(.62+Math.max(0,Math.min(1,(view.zoom-1)/9))*.73)*(.75+.25*closeUp*closeUp*(3-2*closeUp));
      const candidates=[];
      // Only ships belonging to nearby trade corridors are sampled. Distant ships have no canvases or timers.
      for(const site of nearSites)for(const descriptor of site.ships){
        const motion=sampleVoyage(descriptor,seconds),{position,along,heading}=motion;
        const screen=project(position.x,position.y);
        if(!Number.isFinite(screen.x)||!Number.isFinite(screen.y)||screen.x<=-120||screen.y<=-120||screen.x>=view.width+120||screen.y>=view.height+120)continue;
        candidates.push({descriptor,motion,screen,heading,position,along,distance:Math.hypot(screen.x-view.width/2,screen.y-view.height/2)});
      }
      candidates.sort((a,b)=>a.distance-b.distance);
      const selected=candidates.slice(0,view.zoom<2?16:MAX_VISIBLE),budget={left:2};
      const selectedKeys=new Set(selected.map(item=>item.descriptor.key));
      for(const [key,vessel] of bindings)if(!selectedKeys.has(key)){
        vessel.descriptor=null;vessel.worldY=undefined;vessel.element.hidden=vessel.wake.hidden=true;bindings.delete(key);
      }
      visibleCount=selected.length;
      for(const {descriptor,motion,screen,heading,position,along} of selected){
        const vessel=bindings.get(descriptor.key)??acquire(descriptor);
        if(!vessel)continue;
        vessel.element.hidden=false;vessel.wake.hidden=motion.speed<=.02;
        if(vessel.element.dataset.destination!==motion.destination)vessel.element.dataset.destination=motion.destination;
        if(vessel.element.dataset.sailingState!==motion.phase)vessel.element.dataset.sailingState=motion.phase;
        const image=cameraOnly?null:sprite(vessel.kind,heading,view.pitch,budget);
        if(image&&vessel.frame!==image){
          vessel.context.clearRect(0,0,SPRITE_SIZE,SPRITE_SIZE);
          vessel.context.drawImage(image,0,0);vessel.frame=image;
        }
        const scale=fleetScale*(types[vessel.kind].scale??1);
        const bob=reduced?.matches?0:Math.sin(seconds*1.4+vessel.offset)*.35;
        const transform='translate3d('+screen.x.toFixed(2)+'px,'+(screen.y+bob).toFixed(2)+'px,0) translate(-50%,-50%) scale('+scale.toFixed(4)+')';
        if(transform!==vessel.transform){vessel.element.style.transform=transform;vessel.transform=transform;}
        vessel.worldY=position.y;sortVessel(vessel);
        const depth=Math.round(position.y*100);
        if(vessel.depth!==depth){vessel.element.style.zIndex=depth;vessel.depth=depth;}
        const wakeFrame=Math.floor(seconds*WAKE_FPS);
        if(motion.speed>.02&&!cameraOnly&&vessel.wakeContext&&vessel.wakeFrame!==wakeFrame){
          const units=scale/view.zoom;
          wakeMarks+=paintWake(vessel.wakeContext,foamStamp,vessel,position,along,units,seconds,navSource,view.zoom>=2,motion.speed);
          vessel.wakeOrigin={...position,units};vessel.wakeFrame=wakeFrame;wakePaints++;
        }
        const origin=vessel.wakeOrigin;
        if(origin&&motion.speed>.02){
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
      stats:()=>({vessels:catalog.length,ports:sites.length,allocated:vessels.length,nearPorts:nearSites.length,types:types.length,tradeLanes:new Set(sites.flatMap(site=>site.plans.map(route=>route.id))).size,visible:visibleCount,paintCount,routeBuilds,
        spriteCache:sprites.size,meshTriangles:fleetMesh?.triangles??0,gpuDraws:renderer?.stats.draws??0,wakePaints,wakeMarks,active:inRegion()})
    };
  }
  const api={types,buildFleet,buildRoutes,fishingRoute,sampleRoute,voyageCycle,randomVoyagePhase,sampleVoyage,wakeWaterClear,paintWake,mount};
  if(typeof module==='object')module.exports=api;else window.ROTTA_HARBOR_TRAFFIC=api;
})();
